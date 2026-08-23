import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  MapPin, 
  Users, 
  Phone, 
  Navigation, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Search,
  Filter,
  Zap,
  MoreVertical,
  CreditCard,
  User,
  LayoutGrid,
  Map,
  Loader2,
  Calendar,
  Save,
  X,
  Map as MapIcon,
  ArrowLeft,
  Settings,
  Edit3,
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { db } from '@/services/firebase';
import { collection, doc, onSnapshot, query, where, addDoc, updateDoc, writeBatch, serverTimestamp, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import { writeBatchChunked } from '@/services/firestore';
import { User as UserType, UserRole, TransportRoute, TransportAssignment, BusStop, Driver as DriverType } from '@/types';
import { toast } from 'react-hot-toast';
import EmptyState from '@/components/ui/EmptyState';
import Avatar from '@/components/shared/Avatar';
import LiveMap from '@/components/shared/LiveMap';
import { useBusSimulation } from '@/hooks/useBusSimulation';
import { sanitizePhone, createRoute, deleteRoute as deleteRouteService, assignStudent, onAllBusLocations, updateRoute } from '@/services/transport';
import { MOCK_USERS } from '@/constants';

interface Props {
  user: UserType;
}

interface LocalRoute extends Omit<TransportRoute, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'> {
  id?: string;
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LocalAssignment {
  id: string;
  studentId: string;
  studentName: string;
  routeId: string;
  routeName: string;
  stopName: string;
  assignedAt: any;
}

const DEFAULT_MOCK_ROUTES: LocalRoute[] = [
  {
    id: 'r1',
    name: 'North Delhi Express (Route 1)',
    busNumber: 'DL-01-AB-1234',
    driverName: 'Ramesh Singh',
    driverPhone: '+91 98112 34567',
    driverLicense: 'DL-042011005678',
    startPoint: 'Rohini Sector 18',
    endPoint: 'Main School Campus',
    monthlyFee: 1800,
    status: 'active',
    stops: [
      { id: 's1-1', name: 'Rohini Sector 18', estimatedTime: '07:15 AM', lat: 28.7495, lng: 77.1322, order: 1 },
      { id: 's1-2', name: 'Pitampura Metro', estimatedTime: '07:30 AM', lat: 28.6990, lng: 77.1384, order: 2 },
      { id: 's1-3', name: 'Shalimar Bagh', estimatedTime: '07:45 AM', lat: 28.7164, lng: 77.1643, order: 3 },
      { id: 's1-4', name: 'Model Town', estimatedTime: '08:00 AM', lat: 28.7028, lng: 77.1932, order: 4 },
      { id: 's1-5', name: 'Main School Campus', estimatedTime: '08:20 AM', lat: 28.6850, lng: 77.2200, order: 5 }
    ]
  },
  {
    id: 'r2',
    name: 'West Delhi Shuttle (Route 2)',
    busNumber: 'DL-01-CD-5678',
    driverName: 'Gurpreet Singh',
    driverPhone: '+91 98765 98765',
    driverLicense: 'DL-052014008912',
    startPoint: 'Janakpuri West',
    endPoint: 'Main School Campus',
    monthlyFee: 2100,
    status: 'active',
    stops: [
      { id: 's2-1', name: 'Janakpuri District Centre', estimatedTime: '07:10 AM', lat: 28.6292, lng: 77.0784, order: 1 },
      { id: 's2-2', name: 'Rajouri Garden', estimatedTime: '07:30 AM', lat: 28.6506, lng: 77.1215, order: 2 },
      { id: 's2-3', name: 'Punjabi Bagh Club', estimatedTime: '07:45 AM', lat: 28.6692, lng: 77.1315, order: 3 },
      { id: 's2-4', name: 'Karol Bagh', estimatedTime: '08:05 AM', lat: 28.6517, lng: 77.1906, order: 4 },
      { id: 's2-5', name: 'Main School Campus', estimatedTime: '08:25 AM', lat: 28.6850, lng: 77.2200, order: 5 }
    ]
  },
  {
    id: 'r3',
    name: 'South Delhi Flyer (Route 3)',
    busNumber: 'DL-01-EF-9012',
    driverName: 'Satender Kumar',
    driverPhone: '+91 99110 54321',
    driverLicense: 'DL-062018001234',
    startPoint: 'Saket Metro',
    endPoint: 'Main School Campus',
    monthlyFee: 2400,
    status: 'active',
    stops: [
      { id: 's3-1', name: 'Saket Metro Station', estimatedTime: '07:05 AM', lat: 28.5204, lng: 77.2014, order: 1 },
      { id: 's3-2', name: 'Hauz Khas Market', estimatedTime: '07:25 AM', lat: 28.5494, lng: 77.2001, order: 2 },
      { id: 's3-3', name: 'AIIMS Circle', estimatedTime: '07:45 AM', lat: 28.5672, lng: 77.2100, order: 3 },
      { id: 's3-4', name: 'India Gate C-Hexagon', estimatedTime: '08:05 AM', lat: 28.6129, lng: 77.2295, order: 4 },
      { id: 's3-5', name: 'Main School Campus', estimatedTime: '08:30 AM', lat: 28.6850, lng: 77.2200, order: 5 }
    ]
  }
];

const DEFAULT_MOCK_CLASSES = [
  { id: '10A', name: 'Class 10-A' },
  { id: '10B', name: 'Class 10-B' },
  { id: '9A',  name: 'Class 9-A' },
  { id: '8A',  name: 'Class 8-A' },
  { id: '7A',  name: 'Class 7-A' }
];

const TransportManagement: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'ROUTES' | 'STUDENTS' | 'DRIVERS' | 'TRACKING'>('ROUTES');
  const [routes, setRoutes] = useState<LocalRoute[]>(DEFAULT_MOCK_ROUTES);
  const [assignments, setAssignments] = useState<LocalAssignment[]>([]);
  const [students, setStudents] = useState<UserType[]>([]);
  const [classes, setClasses] = useState<any[]>(DEFAULT_MOCK_CLASSES);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Bulk Assign State
  const [bulkClass, setBulkClass] = useState('10A');
  const [bulkSection, setBulkSection] = useState('A');
  const [bulkRoute, setBulkRoute] = useState('r1');
  
  // Tracking State
  const [selectedRouteForMap, setSelectedRouteForMap] = useState<string | null>('r1');
  const [liveBuses, setLiveBuses] = useState<any[]>([]);

  // Active route stops & coordinates for LiveMap
  const activeRouteObj = routes.find(r => r.id === selectedRouteForMap) || routes[0];
  const activeRouteCoords: [number, number][] = (activeRouteObj?.stops || []).map(s => [s.lat, s.lng] as [number, number]);
  const activeRouteStops = (activeRouteObj?.stops || []).map(s => ({
    name: s.name,
    position: [s.lat, s.lng] as [number, number]
  }));

  const { positions, statuses } = useBusSimulation(
    activeTab === 'TRACKING', 
    routes.map(r => r.busNumber),
    activeRouteCoords
  );

  // Form States
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [editingRoute, setEditingRoute] = useState<LocalRoute | null>(null);
  const [newRoute, setNewRoute] = useState<Partial<LocalRoute>>({
    name: '', startPoint: '', endPoint: '', stops: [], busNumber: '',
    driverName: '', driverPhone: '', driverLicense: '', monthlyFee: 0, status: 'active'
  });

  const isMock = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

  useEffect(() => {
    const mockStudentsList = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);
    const defaultAssignments: LocalAssignment[] = mockStudentsList.slice(0, 12).map((s, idx) => {
      const assignedRoute = DEFAULT_MOCK_ROUTES[idx % DEFAULT_MOCK_ROUTES.length]!;
      return {
        id: `asg-${idx + 1}`,
        studentId: s.id,
        studentName: s.name,
        routeId: assignedRoute.id || 'r1',
        routeName: assignedRoute.name,
        stopName: assignedRoute.stops[idx % assignedRoute.stops.length]?.name || 'School Stop',
        assignedAt: new Date().toISOString()
      };
    });

    if (!user?.schoolId) {
      setRoutes(DEFAULT_MOCK_ROUTES);
      setAssignments(defaultAssignments);
      setStudents(mockStudentsList);
      setClasses(DEFAULT_MOCK_CLASSES);
      setLoading(false);
      return;
    }
    if (isMock) {
      setRoutes(DEFAULT_MOCK_ROUTES);
      setAssignments(defaultAssignments);
      setStudents(mockStudentsList);
      setClasses(DEFAULT_MOCK_CLASSES);
      setLoading(false);
      return;
    }

    const unsubRoutes = onSnapshot(collection(db, 'schools', user.schoolId, 'transport', 'routes', 'list'), (snap) => {
      const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as LocalRoute[];
      setRoutes(list.length > 0 ? list : DEFAULT_MOCK_ROUTES);
    }, () => {
      setRoutes(DEFAULT_MOCK_ROUTES);
    });

    const unsubAssign = onSnapshot(collection(db, 'schools', user.schoolId, 'transport', 'assignments', 'list'), (snap) => {
      const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as LocalAssignment[];
      setAssignments(list.length > 0 ? list : defaultAssignments);
    }, () => {
      setAssignments(defaultAssignments);
    });

    const unsubStudents = onSnapshot(query(collection(db, 'schools', user.schoolId, 'users'), where('role', '==', UserRole.STUDENT)), (snap) => {
      const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as UserType[];
      setStudents(list.length > 0 ? list : mockStudentsList);
    }, () => {
      setStudents(mockStudentsList);
    });

    const unsubClasses = onSnapshot(collection(db, 'schools', user.schoolId, 'classes'), (snap) => {
      const classList = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      const finalClasses = classList.length > 0 ? classList : DEFAULT_MOCK_CLASSES;
      setClasses(finalClasses);
      if (finalClasses.length > 0 && !bulkClass) setBulkClass(finalClasses[0].id);
    }, () => {
      setClasses(DEFAULT_MOCK_CLASSES);
    });

    const unsubBuses = onAllBusLocations(user.schoolId, (buses) => {
      setLiveBuses(buses);
    });

    setLoading(false);
    return () => {
      unsubRoutes();
      unsubAssign();
      unsubStudents();
      unsubClasses();
      unsubBuses();
    };
  }, [user?.schoolId]);

  const handleAddRoute = async () => {
    if (!newRoute.name || !newRoute.busNumber || !user.schoolId) return toast.error("Provide route name and bus number");
    setIsSaving(true);
    try {
      await createRoute(user.schoolId, {
        name: newRoute.name || '',
        startPoint: newRoute.startPoint || '',
        endPoint: newRoute.endPoint || '',
        stops: (newRoute.stops || []) as BusStop[],
        busNumber: newRoute.busNumber || '',
        driverName: newRoute.driverName || '',
        driverPhone: sanitizePhone(newRoute.driverPhone || ''),
        driverLicense: newRoute.driverLicense || '',
        monthlyFee: newRoute.monthlyFee || 0,
        status: (newRoute.status || 'active') as 'active' | 'inactive' | 'suspended',
        schoolId: user.schoolId,
      });
      setShowAddRoute(false);
      toast.success("New Route Synchronized!");
    } catch (err) {
      toast.error("Failed to add route");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRoute = async () => {
    if (!editingRoute || !editingRoute.id || !user.schoolId) return;
    setIsSaving(true);
    try {
      await updateRoute(user.schoolId, editingRoute.id, {
        name: editingRoute.name,
        startPoint: editingRoute.startPoint,
        endPoint: editingRoute.endPoint,
        stops: editingRoute.stops,
        busNumber: editingRoute.busNumber,
        driverName: editingRoute.driverName,
        driverPhone: sanitizePhone(editingRoute.driverPhone || ''),
        driverLicense: editingRoute.driverLicense,
        monthlyFee: editingRoute.monthlyFee,
        status: editingRoute.status,
      });
      setEditingRoute(null);
      toast.success("Route updated!");
    } catch (err) {
      toast.error("Failed to update route");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    const assignedStudents = assignments.filter(a => a.routeId === id);
    if (assignedStudents.length > 0) {
        return toast.error(`Cannot delete: ${assignedStudents.length} students currently mapped to this route.`);
    }
    if (!confirm("Are you sure? This will purge the route from fleet engine.")) return;
    if (!user.schoolId) return;
    try {
        await deleteRouteService(user.schoolId, id);
        toast.success("Route Purged");
    } catch (err) { toast.error("Delete failed"); }
  };

  const handleAssignStudent = async (student: UserType, route: LocalRoute, stop: string) => {
    if (!user.schoolId) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      const assignRef = doc(db, 'schools', user.schoolId, 'transport', 'assignments', 'list', student.id);
      batch.set(assignRef, {
        id: student.id,
        studentId: student.id,
        studentName: student.name,
        routeId: route.id,
        routeName: route.name,
        stopName: stop,
        assignedAt: serverTimestamp()
      });

      const studentRef = doc(db, 'schools', user.schoolId, 'users', student.id);
      batch.update(studentRef, {
        transportRouteId: route.id,
        transportFee: route.monthlyFee
      });

      await batch.commit();
      toast.success(`${student.name} mapped to ${route.name}. Billing synchronized.`);
    } catch (err) {
      toast.error("Assignment failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnassignStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Remove ${studentName} from transport?`)) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      const assignRef = doc(db, 'schools', user.schoolId, 'transport', 'assignments', 'list', studentId);
      batch.delete(assignRef);

      const studentRef = doc(db, 'schools', user.schoolId, 'users', studentId);
      batch.update(studentRef, {
        transportRouteId: null,
        transportFee: 0
      });

      await batch.commit();
      toast.success(`${studentName} removed from transport`);
    } catch (err) {
      toast.error("Unassign failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkAssign = async () => {
    const classId = `${bulkClass}-${bulkSection}`;
    const classStudents = students.filter(s => s.classId === classId || (s.class === bulkClass && s.section === bulkSection));
    const selectedRoute = routes.find(r => r.id === bulkRoute);

    if (classStudents.length === 0) return toast.error("No students found in this section");
    if (!selectedRoute) return toast.error("Select target route");

    setIsSaving(true);
    try {
      const operations = classStudents.flatMap(s => [
        { ref: doc(db, 'schools', user.schoolId, 'transport', 'assignments', 'list', s.id), data: { id: s.id, studentId: s.id, studentName: s.name, routeId: selectedRoute.id, routeName: selectedRoute.name, stopName: selectedRoute.stops[0]?.name || 'School Gate', assignedAt: serverTimestamp() }, type: 'set' as const },
        { ref: doc(db, 'schools', user.schoolId, 'users', s.id), data: { transportRouteId: selectedRoute.id, transportFee: selectedRoute.monthlyFee }, type: 'update' as const }
      ]);
      await writeBatchChunked(operations);
      toast.success(`Bulk synchronization complete for ${classStudents.length} students`);
    } catch (err) { toast.error("Bulk mapping failed"); }
    finally { setIsSaving(false); }
  };

  // Extract unique drivers from routes
  const drivers = routes.map(r => ({
    id: r.id,
    name: r.driverName,
    phone: r.driverPhone,
    license: r.driverLicense,
    busNumber: r.busNumber,
    routeName: r.name,
    routeId: r.id,
    status: r.status === 'active' ? 'active' as const : 'off-duty' as const,
    schoolId: user.schoolId,
  }));

  // Group drivers by bus number so the UI can surface a warning when a bus
  // has zero or more than one driver (driver deleted but route still active,
  // or two routes accidentally assigned to the same bus).
  const getDriversForBus = (busNumber: string | undefined): LocalRoute[] => {
    if (!busNumber) return [];
    return routes.filter((r) => r.busNumber === busNumber);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calibrating Fleet Matrix</p>
    </div>
  );

  return (
    <div className="w-full space-y-6 pb-24 page-enter">
      
      {/* --- HEADER --- */}
      <div className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-black rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white overflow-hidden shadow-[0_20px_50px_rgba(30,27,75,0.4)] border border-white/10 group">
        <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[90px] transform translate-x-1/4 -translate-y-1/4" aria-hidden="true" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-2 backdrop-blur-md">
                <Bus size={12} className="text-indigo-400" /> Fleet Intelligence System
             </div>
             <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-white">Transport Management</h1>
             <p className="text-slate-400 text-sm mt-1 max-w-xl">Coordinate institutional routes, monitor live GPS fleet movements, and manage student rosters.</p>
          </div>
          
          <div className="flex flex-wrap lg:flex-nowrap gap-1.5 p-1.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-sm w-full lg:w-auto overflow-x-auto scrollbar-hide">
            {[
              { id: 'ROUTES', label: 'Fleet Registry', icon: MapIcon },
              { id: 'TRACKING', label: 'Live GPS Radar', icon: Navigation },
              { id: 'STUDENTS', label: 'Mapping', icon: Users },
              { id: 'DRIVERS', label: 'Drivers', icon: User },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap min-h-[40px] ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                <tab.icon size={15} /> <span className="inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'ROUTES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <button 
                onClick={() => setShowAddRoute(true)}
                className="group p-10 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3.5rem] flex flex-col items-center justify-center gap-6 hover:border-indigo-500 hover:bg-indigo-50/10 transition-all text-center"
            >
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <Plus size={40} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Initialize Route</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Deploy new fleet parameters</p>
                </div>
            </button>

            {routes.map(route => {
              const assignedCount = assignments.filter(a => a.routeId === route.id).length;
              const liveBus = liveBuses.find(b => b.number === route.busNumber || b.id === route.id);
              const busDrivers = getDriversForBus(route.busNumber);
              const driverCount = busDrivers.length;
              const driverWarning = driverCount === 0
                ? { label: 'No driver assigned', tone: 'rose' as const }
                : driverCount > 1
                  ? { label: `${driverCount} drivers on this bus`, tone: 'amber' as const }
                  : null;
              return (
                <div key={route.id} className="bg-white dark:bg-slate-950 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all">
                    <div className="flex justify-between items-start mb-10">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-indigo-600 shadow-inner">
                            <Bus size={32} />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${route.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                {route.status}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingRoute({...route})} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"><Edit3 size={16}/></button>
                              <button onClick={() => handleDeleteRoute(route.id!)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">{route.name}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">
                        <MapPin size={14} className="text-indigo-500" /> {route.startPoint} <ChevronRight size={10}/> {route.endPoint}
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Bus ID</p>
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase">{route.busNumber}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Fee</p>
                            <p className="text-xs font-black text-emerald-600">₹{route.monthlyFee}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-10">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Driver</p>
                            <p className="text-xs font-black text-slate-900 dark:text-white">{route.driverName || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Students</p>
                            <p className="text-xs font-black text-slate-900 dark:text-white">{assignedCount}</p>
                        </div>
                    </div>

                    {driverWarning && (
                      <div className={`mb-6 p-3 rounded-2xl border flex items-center gap-2 ${
                        driverWarning.tone === 'rose'
                          ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                          : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                      }`}>
                        <AlertTriangle size={14} className={driverWarning.tone === 'rose' ? 'text-rose-600' : 'text-amber-600'} />
                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                          driverWarning.tone === 'rose' ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'
                        }`}>
                          {driverWarning.label}
                        </p>
                      </div>
                    )}

                    {liveBus && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          Live: {liveBus.status || 'ON_ROUTE'} • {liveBus.speed || 0} km/h
                        </p>
                      </div>
                    )}

                    <button 
                        onClick={() => { setSelectedRouteForMap(route.id!); setActiveTab('TRACKING'); }}
                        className="w-full py-4 bg-indigo-600/10 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <Navigation size={16}/> Monitor Live Fleet
                    </button>
                </div>
              );
            })}
        </div>
      )}

      {activeTab === 'STUDENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 bg-white dark:bg-slate-950 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Assignment Engine</h3>
                    <div className="relative w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" size={18} />
                        <input type="text" placeholder="Search student roster..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-xs font-bold outline-none transition-all dark:text-white" />
                    </div>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                    {(() => {
                        const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
                        if (filteredStudents.length === 0) {
                            return (
                                <div className="py-10">
                                    <EmptyState 
                                        variant="students" 
                                        title="No Students Found" 
                                        description="Try adjusting your search query." 
                                    />
                                </div>
                            );
                        }
                        return filteredStudents.map(s => {
                            const assign = assignments.find(a => a.id === s.id);
                            return (
                                <div key={s.id} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-500 transition-all">
                                    <div className="flex items-center gap-5">
                                        <Avatar src={s.avatar} name={s.name} size="lg" className="w-14 h-14 rounded-2xl" />
                                        <div>
                                            <p className="text-base font-black text-slate-900 dark:text-white leading-none mb-1">{s.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.classId || `Class ${s.class}-${s.section}`}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {assign ? (
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{assign.routeName}</p>
                                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{assign.stopName}</p>
                                            </div>
                                            <button 
                                            onClick={() => handleUnassignStudent(s.id, s.name)}
                                            className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
                                            title="Remove from transport"
                                            >
                                            <X size={14} />
                                            </button>
                                        </div>
                                        ) : (
                                        <select 
                                            onChange={(e) => {
                                                const r = routes.find(rt => rt.id === e.target.value);
                                                if (r) handleAssignStudent(s, r, r.stops[0]?.name || 'Main Gate');
                                            }}
                                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none"
                                        >
                                            <option>Action...</option>
                                            {routes.map(r => <option key={r.id} value={r.id}>To {r.name}</option>)}
                                        </select>
                                        )}
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
                <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl"><Zap size={20}/></div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em]">Bulk Sync Mapper</h4>
                    </div>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Class</label>
                                <select value={bulkClass} onChange={e => setBulkClass(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:border-indigo-500 dark:text-white">
                                    {classes.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Section</label>
                                <select value={bulkSection} onChange={e => setBulkSection(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:border-indigo-500 dark:text-white">
                                    {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Target Route</label>
                            <select value={bulkRoute} onChange={e => setBulkRoute(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:border-indigo-500 dark:text-white">
                                <option value="">Select Fleet Route...</option>
                                {routes.map(r => <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>)}
                            </select>
                        </div>
                        <button onClick={handleBulkAssign} disabled={isSaving || !bulkRoute} className="w-full py-5 bg-indigo-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>} Synchronize Class
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'DRIVERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {drivers.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <User className="w-7 h-7 text-zinc-400" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">No drivers assigned</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs">Add routes with driver information to see them here.</p>
              </div>
            ) : (
              drivers.map(driver => {
                const route = routes.find(r => r.id === driver.routeId);
                const assignedCount = route ? assignments.filter(a => a.routeId === route.id).length : 0;
                const liveBus = liveBuses.find(b => b.number === driver.busNumber || b.id === driver.routeId);
                return (
                  <div key={driver.id} className="bg-white dark:bg-slate-950 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl flex items-center justify-center">
                        <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{driver.name || 'Unassigned'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{driver.busNumber}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <a href={`tel:${sanitizePhone(driver.phone)}`} className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors">
                          {driver.phone || 'N/A'}
                        </a>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{driver.license || 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <Users className="w-4 h-4 text-slate-400" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{assignedCount} students</p>
                      </div>
                    </div>

                    {liveBus && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          {liveBus.status || 'ON_ROUTE'} • {liveBus.speed || 0} km/h
                        </p>
                      </div>
                    )}

                    <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-center ${
                      driver.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {driver.status}
                    </div>
                  </div>
                );
              })
            )}
        </div>
      )}

      {activeTab === 'TRACKING' && (
        <div className="h-[680px] bg-white dark:bg-slate-950 rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
            <LiveMap 
              positions={positions} 
              statuses={statuses} 
              route={activeRouteCoords} 
              stops={activeRouteStops} 
              selectedBusId={activeRouteObj?.busNumber} 
            />
            <div className="absolute top-6 right-6 z-[60] w-80 space-y-4 max-w-[calc(100%-3rem)]">
                <div className="bg-slate-900/90 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/10 shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Navigation size={14} className="text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} /> Fleet Radar
                      </h4>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {routes.length} Active Routes
                      </span>
                    </div>
                    <div className="space-y-2 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
                        {routes.map(r => {
                          const liveBus = liveBuses.find(b => b.number === r.busNumber || b.id === r.id);
                          const isSelected = (selectedRouteForMap === r.id) || (!selectedRouteForMap && r.id === routes[0]?.id);
                          return (
                            <button 
                              key={r.id} 
                              onClick={() => setSelectedRouteForMap(r.id!)} 
                              className={`w-full p-4 rounded-xl flex items-center justify-between transition-all border ${
                                isSelected 
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' 
                                  : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                                <div className="text-left min-w-0 flex-1 mr-2">
                                    <p className="text-xs font-bold leading-tight truncate text-white">{r.busNumber}</p>
                                    <p className="text-[9px] font-semibold opacity-70 truncate">{r.name}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {liveBus && (
                                    <span className="text-[9px] font-bold opacity-80">{liveBus.speed || 0} km/h</span>
                                  )}
                                  <div className={`w-2 h-2 rounded-full ${r.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
                                </div>
                            </button>
                          );
                        })}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ADD ROUTE MODAL */}
      {showAddRoute && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
             <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-[4rem] shadow-2xl border border-white/10 overflow-hidden">
                <div className="p-10 border-b border-slate-50 dark:border-slate-900 flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Fleet Initialization</h3>
                    <button onClick={() => setShowAddRoute(false)} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={24}/></button>
                </div>
                <div className="p-10 grid grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                    <InputField label="Route Name" placeholder="e.g. Route Alpha" value={newRoute.name} onChange={(v: string) => setNewRoute({...newRoute, name: v})} />
                    <InputField label="Bus ID" placeholder="DL-..." value={newRoute.busNumber} onChange={(v: string) => setNewRoute({...newRoute, busNumber: v})} />
                    <InputField label="Terminal A" value={newRoute.startPoint} onChange={(v: string) => setNewRoute({...newRoute, startPoint: v})} />
                    <InputField label="Terminal B" value={newRoute.endPoint} onChange={(v: string) => setNewRoute({...newRoute, endPoint: v})} />
                    <InputField label="Monthly Fee (₹)" type="number" value={newRoute.monthlyFee} onChange={(v: string) => setNewRoute({...newRoute, monthlyFee: parseFloat(v)})} />
                    <InputField label="Driver Name" value={newRoute.driverName} onChange={(v: string) => setNewRoute({...newRoute, driverName: v})} />
                    <InputField label="Driver Phone" placeholder="+91..." value={newRoute.driverPhone} onChange={(v: string) => setNewRoute({...newRoute, driverPhone: v})} />
                    <InputField label="Driver License" value={newRoute.driverLicense} onChange={(v: string) => setNewRoute({...newRoute, driverLicense: v})} />
                    <StopsEditor stops={(newRoute.stops as BusStop[]) || []} onChange={(stops) => setNewRoute({ ...newRoute, stops })} />
                </div>
                <div className="p-10 bg-slate-50 dark:bg-slate-900 flex gap-4">
                    <button onClick={handleAddRoute} disabled={isSaving} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                        {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Deploy Fleet Registry
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* EDIT ROUTE MODAL */}
      {editingRoute && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
             <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-[4rem] shadow-2xl border border-white/10 overflow-hidden">
                <div className="p-10 border-b border-slate-50 dark:border-slate-900 flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Edit Route</h3>
                    <button onClick={() => setEditingRoute(null)} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={24}/></button>
                </div>
                <div className="p-10 grid grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                    <InputField label="Route Name" value={editingRoute.name} onChange={(v: string) => setEditingRoute({...editingRoute, name: v})} />
                    <InputField label="Bus ID" value={editingRoute.busNumber} onChange={(v: string) => setEditingRoute({...editingRoute, busNumber: v})} />
                    <InputField label="Terminal A" value={editingRoute.startPoint} onChange={(v: string) => setEditingRoute({...editingRoute, startPoint: v})} />
                    <InputField label="Terminal B" value={editingRoute.endPoint} onChange={(v: string) => setEditingRoute({...editingRoute, endPoint: v})} />
                    <InputField label="Monthly Fee (₹)" type="number" value={editingRoute.monthlyFee} onChange={(v: string) => setEditingRoute({...editingRoute, monthlyFee: parseFloat(v)})} />
                    <InputField label="Driver Name" value={editingRoute.driverName} onChange={(v: string) => setEditingRoute({...editingRoute, driverName: v})} />
                    <InputField label="Driver Phone" value={editingRoute.driverPhone} onChange={(v: string) => setEditingRoute({...editingRoute, driverPhone: v})} />
                    <InputField label="Driver License" value={editingRoute.driverLicense} onChange={(v: string) => setEditingRoute({...editingRoute, driverLicense: v})} />
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Status</label>
                      <select value={editingRoute.status} onChange={e => setEditingRoute({...editingRoute, status: e.target.value as any})} className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] text-sm font-bold outline-none transition-all dark:text-white">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    <StopsEditor stops={(editingRoute.stops as BusStop[]) || []} onChange={(stops) => setEditingRoute({ ...editingRoute, stops })} />
                </div>
                <div className="p-10 bg-slate-50 dark:bg-slate-900 flex gap-4">
                    <button onClick={handleUpdateRoute} disabled={isSaving} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                        {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Save Changes
                    </button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

const InputField = ({ label, value, onChange, placeholder, type = 'text' }: any) => (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] text-sm font-bold outline-none transition-all dark:text-white" />
    </div>
);

const StopsEditor = ({ stops, onChange }: { stops: BusStop[]; onChange: (next: BusStop[]) => void }) => {
  const add = () => {
    const next: BusStop = { id: `stop-${Date.now()}`, name: '', lat: 0, lng: 0, order: stops.length, estimatedTime: '' };
    onChange([...stops, next]);
  };
  const update = (idx: number, patch: Partial<BusStop>) => {
    onChange(stops.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };
  const remove = (idx: number) => {
    const filtered = stops.filter((_, i) => i !== idx);
    onChange(filtered.map((s, i) => ({ ...s, order: i })));
  };
  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= stops.length) return;
    const next = [...stops];
    [next[idx]!, next[target]!] = [next[target]!, next[idx]!];
    onChange(next.map((s, i) => ({ ...s, order: i })));
  };
  return (
    <div className="col-span-2 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Bus Stops ({stops.length})</label>
        <button
          type="button"
          onClick={add}
          className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-indigo-50 transition-all flex items-center gap-1"
        >
          <Plus size={12} /> Add Stop
        </button>
      </div>
      <div className="space-y-2">
        {stops.length === 0 && (
          <p className="text-xs text-slate-400 italic px-4">No stops yet. Add the first stop to enable student pickup/drop assignment.</p>
        )}
        {stops.map((s, idx) => (
          <div key={s.id || idx} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5">
            <span className="text-[10px] font-black text-slate-400 w-6 text-center">#{idx + 1}</span>
            <input
              type="text"
              placeholder="Stop name"
              value={s.name}
              onChange={e => update(idx, { name: e.target.value })}
              className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 dark:text-white"
            />
            <input
              type="text"
              placeholder="ETA (e.g. 7:30 AM)"
              value={s.estimatedTime || ''}
              onChange={e => update(idx, { estimatedTime: e.target.value })}
              className="w-24 px-2 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 dark:text-white"
            />
            <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all">
              <ArrowUp size={12} />
            </button>
            <button type="button" onClick={() => move(idx, 1)} disabled={idx === stops.length - 1} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all">
              <ArrowDown size={12} />
            </button>
            <button type="button" onClick={() => remove(idx)} className="p-2 text-slate-400 hover:text-rose-500 transition-all">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransportManagement;
