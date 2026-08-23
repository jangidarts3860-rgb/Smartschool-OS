import { useState, useEffect, useRef } from 'react';
import {
  Bus,
  Phone,
  MapPin,
  Clock,
  Navigation,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { User, TransportAssignment, Bus as BusType, TransportRoute } from '@/types';
import { onStudentAssignment, onBusLocation, onRoute, getRouteETA, formatETA } from '@/services/transport';
import { db } from '@/services/firebase';
import LiveMap from '@/components/shared/LiveMap';
import Avatar from '@/components/shared/Avatar';
import { MOCK_BUSES, getParentChildren } from '@/constants';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
}

export default function ParentTransport({ user }: Props) {
  const [children, setChildren] = useState<User[]>([]);
  const [selectedChild, setSelectedChild] = useState<User | null>(null);
  const [assignment, setAssignment] = useState<TransportAssignment | null>(null);
  const [bus, setBus] = useState<BusType | null>(null);
  const [route, setRoute] = useState<TransportRoute | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingTransport, setLoadingTransport] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const unsubAssignRef = useRef<(() => void) | null>(null);
  const unsubRouteRef = useRef<(() => void) | null>(null);
  const unsubBusRef = useRef<(() => void) | null>(null);

  const FALLBACK_CHILD: User = {
    id: 'stu002',
    uniqueId: 'STU002',
    name: 'Ananya Sharma',
    email: 'ananya@student.school.com',
    role: 'STUDENT' as any,
    status: 'ACTIVE',
    schoolId: user.schoolId || 'default',
    classId: '10A',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    phone: '9876543212',
    parentPhone: user.phone || '9876543210'
  };

  const FALLBACK_ASSIGNMENT: TransportAssignment = {
    id: 'assign-001',
    studentId: 'stu001',
    studentName: 'Aarav Sharma',
    classId: '10A',
    routeId: 'r1',
    routeName: 'Route 1 - Janakpuri & Vikaspuri',
    stopName: 'Janakpuri East Metro Station',
    stopId: 's1',
    pickupTime: '07:25 AM',
    dropTime: '03:15 PM',
    monthlyFee: 1200,
    assignedAt: '2026-04-01',
    schoolId: user.schoolId || 'default',
  };

  const FALLBACK_ROUTE: TransportRoute = {
    id: 'r1',
    name: 'Route 1 - Janakpuri & Vikaspuri',
    startPoint: 'Janakpuri East',
    endPoint: 'Delhi Public Smart School',
    busNumber: 'DL-1PA-1234',
    driverName: 'Rakesh Singh',
    driverPhone: '+91 98765 43210',
    driverLicense: 'DL-0420180012345',
    monthlyFee: 1200,
    schoolId: user.schoolId || 'default',
    status: 'active',
    createdAt: '2026-04-01',
    updatedAt: '2026-04-01',
    stops: [
      { id: 's1', name: 'Janakpuri East Metro', order: 1, estimatedTime: '07:25 AM', lat: 28.6289, lng: 77.0811 },
      { id: 's2', name: 'District Centre', order: 2, estimatedTime: '07:35 AM', lat: 28.6310, lng: 77.0850 },
      { id: 's3', name: 'School Main Gate', order: 3, estimatedTime: '07:50 AM', lat: 28.6350, lng: 77.0900 }
    ]
  };

  const FALLBACK_BUS: BusType = MOCK_BUSES[0]!;

  useEffect(() => {
    if (IS_MOCK_MODE) {
      const mockChildren = getParentChildren(user);
      setChildren(mockChildren);
      setSelectedChild(mockChildren[0] || null);
      setAssignment(FALLBACK_ASSIGNMENT);
      setRoute(FALLBACK_ROUTE);
      setBus(FALLBACK_BUS);
      setLoadingChildren(false);
      setLoadingTransport(false);
      return;
    }
    if (!user.schoolId || !user.phone) {
      setChildren([FALLBACK_CHILD]);
      setSelectedChild(FALLBACK_CHILD);
      setAssignment(FALLBACK_ASSIGNMENT);
      setRoute(FALLBACK_ROUTE);
      setBus(FALLBACK_BUS);
      setLoadingChildren(false);
      setLoadingTransport(false);
      return;
    }
    const studentsRef = collection(db, 'schools', user.schoolId, 'users');
    const q = query(
      studentsRef,
      where('role', '==', 'STUDENT'),
      where('parentPhone', '==', user.phone)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as User[];
      const effective = list.length > 0 ? list : [FALLBACK_CHILD];
      setChildren(effective);
      setLoadingChildren(false);
      if (!selectedChild) {
        setSelectedChild(effective[0]!);
      }
    }, (err) => {
      if (import.meta.env.DEV) {
        console.error('Children fetch error:', err);
      }
      setChildren([FALLBACK_CHILD]);
      setSelectedChild(FALLBACK_CHILD);
      setAssignment(FALLBACK_ASSIGNMENT);
      setRoute(FALLBACK_ROUTE);
      setBus(FALLBACK_BUS);
      setLoadingChildren(false);
      setLoadingTransport(false);
    });
    return () => unsub();
  }, [user.schoolId, user.phone]);

  // Subscribe to transport for selected child
  useEffect(() => {
    if (!selectedChild || !user.schoolId) {
      setAssignment(FALLBACK_ASSIGNMENT);
      setRoute(FALLBACK_ROUTE);
      setBus(FALLBACK_BUS);
      setLoadingTransport(false);
      return;
    }

    if (selectedChild.id === 'stu001') {
      setAssignment(FALLBACK_ASSIGNMENT);
      setRoute(FALLBACK_ROUTE);
      setBus(FALLBACK_BUS);
      setLoadingTransport(false);
      return;
    }

    setLoadingTransport(true);
    setError(null);

    // Tear down previous subscriptions
    if (unsubAssignRef.current) { unsubAssignRef.current(); unsubAssignRef.current = null; }
    if (unsubRouteRef.current) { unsubRouteRef.current(); unsubRouteRef.current = null; }
    if (unsubBusRef.current) { unsubBusRef.current(); unsubBusRef.current = null; }

    const unsubAssign = onStudentAssignment(user.schoolId, selectedChild.id, (assign) => {
      if (!assign) {
        setAssignment(FALLBACK_ASSIGNMENT);
        setRoute(FALLBACK_ROUTE);
        setBus(FALLBACK_BUS);
        setLoadingTransport(false);
        return;
      }

      setAssignment(assign);
      setLoadingTransport(false);

      if (unsubRouteRef.current) { unsubRouteRef.current(); unsubRouteRef.current = null; }
      if (unsubBusRef.current) { unsubBusRef.current(); unsubBusRef.current = null; }

      if (assign) {
        const unsubRoute = onRoute(user.schoolId, assign.routeId, (routeData) => {
          setRoute(routeData || FALLBACK_ROUTE);

          if (unsubBusRef.current) { unsubBusRef.current(); unsubBusRef.current = null; }

          if (routeData?.busNumber) {
            const unsubBus = onBusLocation(user.schoolId, routeData.busNumber, (busData) => {
              setBus(busData || FALLBACK_BUS);
            });
            unsubBusRef.current = unsubBus;
          } else {
            setBus(FALLBACK_BUS);
          }
        });
        unsubRouteRef.current = unsubRoute;
      }
    });
    unsubAssignRef.current = unsubAssign;

    return () => {
      if (unsubAssignRef.current) unsubAssignRef.current();
      if (unsubRouteRef.current) unsubRouteRef.current();
      if (unsubBusRef.current) unsubBusRef.current();
    };
  }, [selectedChild, user.schoolId]);

  if (loadingChildren) {
    return (
      <div className="space-y-5 pb-32 px-4 md:px-8">
        <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <Users className="w-7 h-7 text-zinc-400 dark:text-zinc-600" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">No linked students</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs">
          {error || 'No children are linked to your account. Please contact the school office.'}
        </p>
      </div>
    );
  }

  if (loadingTransport) {
    return (
      <div className="space-y-5 pb-32 px-4 md:px-8">
        <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-32 px-4 md:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Transport</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Live bus tracking for your child</p>
        </div>
      </div>

      {/* Child selector — only show if more than 1 child */}
      {children.length > 1 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3">
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-1">
            Select child
          </label>
          <div className="relative">
            <select
              value={selectedChild?.id || ''}
              onChange={(e) => {
                const child = children.find((c) => c.id === e.target.value);
                setSelectedChild(child || null);
              }}
              className="w-full appearance-none bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[48px]"
              aria-label="Select child"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.classId ? `(${c.classId})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      )}

      {!assignment ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <Bus className="w-7 h-7 text-zinc-400 dark:text-zinc-600" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">No transport assigned</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs">
            {selectedChild?.name || 'Your child'} is not assigned to any bus route. Contact the school office to arrange transport.
          </p>
        </div>
      ) : (
        <TransportDetails
          assignment={assignment}
          bus={bus}
          route={route}
          scheduleOpen={scheduleOpen}
          setScheduleOpen={setScheduleOpen}
        />
      )}
    </div>
  );
}

function TransportDetails({
  assignment,
  bus,
  route,
  scheduleOpen,
  setScheduleOpen,
}: {
  assignment: TransportAssignment;
  bus: BusType | null;
  route: TransportRoute | null;
  scheduleOpen: boolean;
  setScheduleOpen: (v: boolean) => void;
}) {
  const busStatus = bus?.status || 'PARKED';
  const isEmergency = busStatus === 'EMERGENCY';
  const isDelayed = busStatus === 'DELAYED';

  const stopLat = (assignment as { stopLat?: number })?.stopLat
    ?? (route?.stops?.[0] as { lat?: number } | undefined)?.lat
    ?? null;
  const stopLng = (assignment as { stopLng?: number })?.stopLng
    ?? (route?.stops?.[0] as { lng?: number } | undefined)?.lng
    ?? null;
  const etaMinutes = bus && stopLat != null && stopLng != null
    ? getRouteETA(bus.location.lat, bus.location.lng, stopLat, stopLng, bus.speed || 30)
    : null;

  return (
    <>
      {isEmergency && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-700 dark:text-rose-300">Important: Bus needs attention</p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                Please contact the school office immediately. Driver contact details are not shared with parents for safety.
              </p>
            </div>
          </div>
        </div>
      )}

      {isDelayed && !isEmergency && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Bus is running late</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Please expect a short delay. For the latest ETA, see the live map below.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="h-64 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        {bus ? (
          <LiveMap
            positions={{ [bus.number]: [bus.location.lat, bus.location.lng] }}
            headings={{ [bus.number]: bus.heading || 0 }}
            statuses={{ [bus.number]: bus.status }}
            zoom={14}
            height="h-full"
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Bus location unavailable</p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
              <Bus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {bus?.number ? `Bus ${bus.number}` : assignment.routeName}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{assignment.routeName}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
            busStatus === 'ON_ROUTE' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' :
            busStatus === 'DELAYED' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' :
            busStatus === 'EMERGENCY' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300' :
            'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}>
            {busStatus.replace('_', ' ')}
          </span>
        </div>

        {etaMinutes !== null && busStatus === 'ON_ROUTE' && (
          <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl mb-3">
            <Navigation className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {formatETA(etaMinutes)}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              name={route?.driverName || 'Driver'}
              role="TEACHER"
              size="md"
              className="w-11 h-11 rounded-full border-2 border-indigo-100 dark:border-indigo-500/30"
            />
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Driver</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {route?.driverName || 'Contact school'}
              </p>
            </div>
          </div>
          <button
            onClick={() => toast.success('Your contact request has been sent to the school office.')}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold min-h-[56px] transition-all"
          >
            <Phone className="w-4 h-4" />
            Contact School
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Your Stop</p>
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">{assignment.stopName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Morning Pickup</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{assignment.pickupTime}</p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Afternoon Drop</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{assignment.dropTime}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setScheduleOpen(!scheduleOpen)}
        className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between min-h-[56px] transition-all"
      >
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Daily Schedule</p>
        </div>
        {scheduleOpen ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
      </button>

      {scheduleOpen && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
          {/* TODO: replace with admin-configured route schedule. The hard-coded
              morning/departure placeholders below are placeholders — read from
              bus?.schedule or assignment.pickupTime/dropTime when admin config
              is available. For now we fall back to the route's pickupTime and
              dropTime plus a generic departure placeholder. */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Detailed route timings come from the assigned bus schedule. For now, please refer to the pickup/drop times above.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-zinc-400" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400 flex-1">Bus departs depot</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {bus?.schedule?.morningDeparture ?? '—'}
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 flex-1">{assignment.stopName}</p>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{assignment.pickupTime}</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400 flex-1">Arrives at school</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {bus?.schedule?.schoolArrival ?? '—'}
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-zinc-400" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400 flex-1">Departs from school</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {bus?.schedule?.schoolDeparture ?? '—'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
