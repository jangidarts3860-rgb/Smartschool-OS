import { useState, useEffect, useRef } from 'react';
import {
  Bus,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { User, TransportAssignment, TransportRoute, Bus as BusType } from '@/types';
import { onStudentAssignment, onRoute, onBusLocation } from '@/services/transport';
import LiveMap from '@/components/shared/LiveMap';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
}

export default function StudentTransport({ user }: Props) {
  const [assignment, setAssignment] = useState<TransportAssignment | null>(null);
  const [route, setRoute] = useState<TransportRoute | null>(null);
  const [bus, setBus] = useState<{ number: string; status: string; location: { lat: number; lng: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const unsubBusRef = useRef<(() => void) | null>(null);
  const unsubRouteRef = useRef<(() => void) | null>(null);

  const FALLBACK_ASSIGNMENT: TransportAssignment = {
    id: 'assign-stu-001',
    studentId: user?.id || 'stu001',
    studentName: user?.name || 'Aarav Sharma',
    classId: user?.classId || '10A',
    routeId: 'r1',
    routeName: 'Route 1 - Janakpuri & Vikaspuri',
    stopName: 'Janakpuri East Metro Station',
    stopId: 's1',
    pickupTime: '07:25 AM',
    dropTime: '03:15 PM',
    monthlyFee: 1200,
    assignedAt: '2026-04-01',
    schoolId: user?.schoolId || 'SCH01',
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
    schoolId: user?.schoolId || 'SCH01',
    status: 'active',
    createdAt: '2026-04-01',
    updatedAt: '2026-04-01',
    stops: [
      { id: 's1', name: 'Janakpuri East Metro', order: 1, estimatedTime: '07:25 AM', lat: 28.6289, lng: 77.0811 },
      { id: 's2', name: 'District Centre', order: 2, estimatedTime: '07:35 AM', lat: 28.6310, lng: 77.0850 },
      { id: 's3', name: 'School Main Gate', order: 3, estimatedTime: '07:50 AM', lat: 28.6350, lng: 77.0900 }
    ]
  };

  const FALLBACK_BUS = {
    number: 'DL-1PA-1234',
    status: 'ON_ROUTE',
    location: { lat: 28.6289, lng: 77.0811 }
  };

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setAssignment(FALLBACK_ASSIGNMENT);
      setRoute(FALLBACK_ROUTE);
      setBus(FALLBACK_BUS);
      setLoading(false);
      return;
    }
    if (!user?.schoolId || !user?.id) {
      setAssignment(FALLBACK_ASSIGNMENT);
      setRoute(FALLBACK_ROUTE);
      setBus(FALLBACK_BUS);
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    const unsubAssign = onStudentAssignment(user.schoolId, user.id, (assign) => {
      if (!assign) {
        setAssignment(FALLBACK_ASSIGNMENT);
        setRoute(FALLBACK_ROUTE);
        setBus(FALLBACK_BUS);
        setLoading(false);
        return;
      }

      setAssignment(assign);
      setLoading(false);

      if (unsubRouteRef.current) {
        unsubRouteRef.current();
        unsubRouteRef.current = null;
      }
      if (unsubBusRef.current) {
        unsubBusRef.current();
        unsubBusRef.current = null;
      }

      if (assign) {
        const unsubRoute = onRoute(user.schoolId, assign.routeId, (routeData) => {
          setRoute(routeData || FALLBACK_ROUTE);

          if (unsubBusRef.current) {
            unsubBusRef.current();
            unsubBusRef.current = null;
          }

          if (routeData?.busNumber) {
            const unsubBus = onBusLocation(user.schoolId, routeData.busNumber, (busData: BusType | null) => {
              if (busData) {
                setBus({
                  number: busData.number,
                  status: busData.status,
                  location: busData.location,
                });
              } else {
                setBus(FALLBACK_BUS);
              }
            });
            unsubBusRef.current = unsubBus;
          } else {
            setBus(FALLBACK_BUS);
          }
        });
        unsubRouteRef.current = unsubRoute;
      }
    });

    return () => {
      unsubAssign();
      if (unsubRouteRef.current) unsubRouteRef.current();
      if (unsubBusRef.current) unsubBusRef.current();
    };
  }, [user?.schoolId, user?.id]);

  // Driver phone is intentionally NOT fetched for students. The student
  // must contact the school office (rules forbid leaking driver phone to
  // students; see firestore.rules > transport/routes/list).

  if (loading) {
    return (
      <div className="space-y-5 pb-32 px-4 md:px-8">
        <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
        <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">Something went wrong</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold min-h-[44px]"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <Bus className="w-7 h-7 text-zinc-400 dark:text-zinc-600" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">No transport assigned</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs">
          Contact your school admin to arrange bus transport.
        </p>
      </div>
    );
  }

  const busStatus = bus?.status || 'PARKED';
  const isEmergency = busStatus === 'EMERGENCY';
  const isDelayed = busStatus === 'DELAYED';

  return (
    <div className="space-y-5 pb-32 px-4 md:px-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">My Bus</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Your bus route and schedule</p>
      </div>

      {/* Emergency banner */}
      {isEmergency && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-700 dark:text-rose-300">Important: Bus needs attention</p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                Contact your teacher or school immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delayed banner */}
      {isDelayed && !isEmergency && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Bus is running late</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Expected delay: 10-15 minutes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bus card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
              <Bus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {bus?.number || route?.busNumber || assignment.routeName}
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

        {/* Live map (mini) */}
        {bus && (
          <div className="h-48 rounded-xl overflow-hidden mb-3 border border-zinc-200 dark:border-zinc-800">
            <LiveMap
              positions={{ [bus.number]: [bus.location.lat, bus.location.lng] }}
              zoom={14}
              height="h-full"
            />
          </div>
        )}

        {/* Driver contact — driver phone is not exposed to students for safety */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Driver</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {route?.driverName || 'Contact school'}
            </p>
          </div>
          <button
            onClick={() => alert('For driver contact, please reach out to the school office. Driver phone numbers are not shared with students for safety.')}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold min-h-[56px] transition-all"
          >
            <Phone className="w-4 h-4" />
            Contact School
          </button>
        </div>
      </div>

      {/* Stop details */}
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

      {/* Schedule (collapsible) */}
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
          <div>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Morning Route</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-zinc-400" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400 flex-1">Bus departs depot</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">06:45 AM</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 flex-1">{assignment.stopName}</p>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{assignment.pickupTime}</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400 flex-1">Arrives at school</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">08:00 AM</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Afternoon Route</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-zinc-400" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400 flex-1">Departs from school</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">03:00 PM</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 flex-1">{assignment.stopName}</p>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{assignment.dropTime}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
