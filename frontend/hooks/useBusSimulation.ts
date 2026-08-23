import { useState, useEffect, useRef, useCallback } from 'react';

// Institutional Grade Route (New Delhi Area)
const SAMPLE_ROUTE: [number, number][] = [
  [28.6139, 77.2090], [28.6145, 77.2095], [28.6155, 77.2105],
  [28.6165, 77.2115], [28.6175, 77.2125], [28.6185, 77.2135],
  [28.6195, 77.2145], [28.6205, 77.2155], [28.6215, 77.2165],
  [28.6225, 77.2175], [28.6235, 77.2185]
];

const SAMPLE_STOPS = [
  { name: 'Main Campus', position: SAMPLE_ROUTE[0] as [number, number] },
  { name: 'Metro Junction', position: SAMPLE_ROUTE[4] as [number, number] },
  { name: 'Public Library', position: SAMPLE_ROUTE[8] as [number, number] },
  { name: 'Sector 42 Gate', position: SAMPLE_ROUTE[10] as [number, number] },
];

interface BusSimState {
  positions: Record<string, [number, number]>;
  headings: Record<string, number>;
  statuses: Record<string, 'ON_ROUTE' | 'PARKED' | 'DELAYED' | 'EMERGENCY'>;
  route: [number, number][];
  stops: typeof SAMPLE_STOPS;
  isMoving: boolean;
}

function getOffset(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (hash % 100) / 10000;
}

function calculateHeading(from: [number, number], to: [number, number]): number {
  const dLat = to[0] - from[0];
  const dLng = to[1] - from[1];
  const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  return ((angle + 360) % 360);
}

/**
 * Fleet Intelligence Simulation Hook
 * FIXED: Uses refs to avoid stale closure bug.
 * Added: heading calculation, EMERGENCY status simulation.
 */
export const useBusSimulation = (
  active: boolean = true,
  busIds: string[] = [],
  customRoutePoints?: [number, number][]
): BusSimState => {
  const activeRoute = (customRoutePoints && customRoutePoints.length > 1) ? customRoutePoints : SAMPLE_ROUTE;
  const [positions, setPositions] = useState<Record<string, [number, number]>>({});
  const [headings, setHeadings] = useState<Record<string, number>>({});
  const [statuses, setStatuses] = useState<Record<string, 'ON_ROUTE' | 'PARKED' | 'DELAYED' | 'EMERGENCY'>>({});

  const routeIndicesRef = useRef<Record<string, number>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const busIdsRef = useRef(busIds);
  busIdsRef.current = busIds;
  const activeRouteRef = useRef(activeRoute);
  activeRouteRef.current = activeRoute;

  // Initialize positions
  useEffect(() => {
    const r = activeRoute;
    const initialPos: Record<string, [number, number]> = {};
    const initialIdx: Record<string, number> = {};
    const initialHeadings: Record<string, number> = {};
    const initialStatuses: Record<string, 'ON_ROUTE' | 'PARKED' | 'DELAYED' | 'EMERGENCY'> = {};

    busIds.forEach((id, i) => {
      const offset = getOffset(id);
      const startIdx = Math.min(i, r.length - 1);
      initialPos[id] = [r[startIdx]![0] + offset, r[startIdx]![1] + offset];
      initialIdx[id] = startIdx;
      initialHeadings[id] = 0;
      initialStatuses[id] = id.includes('EMG') ? 'EMERGENCY' : 'ON_ROUTE';
    });

    setPositions(initialPos);
    setHeadings(initialHeadings);
    setStatuses(initialStatuses);
    routeIndicesRef.current = initialIdx;
  }, [busIds.join(','), JSON.stringify(customRoutePoints)]);

  const tick = useCallback(() => {
    const currentBusIds = busIdsRef.current;
    const r = activeRouteRef.current;
    if (currentBusIds.length === 0 || r.length === 0) return;

    setPositions(prev => {
      const nextPos: Record<string, [number, number]> = {};
      const nextHeadings: Record<string, number> = {};
      const indices = { ...routeIndicesRef.current };

      currentBusIds.forEach(id => {
        const offset = getOffset(id);
        const currentIdx = indices[id] || 0;
        const nextIdx = (currentIdx + 1) % r.length;
        const from = r[currentIdx]!;
        const to = r[nextIdx]!;

        nextPos[id] = [from[0] + offset, from[1] + offset];
        nextHeadings[id] = calculateHeading(from, to);
        indices[id] = nextIdx;
      });

      routeIndicesRef.current = indices;
      setHeadings(nextHeadings);
      return nextPos;
    });
  }, []);

  useEffect(() => {
    if (!active || busIds.length === 0) return;

    intervalRef.current = setInterval(tick, 3500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, busIds.join(','), tick]);

  return {
    positions,
    headings,
    statuses,
    route: activeRoute,
    stops: SAMPLE_STOPS,
    isMoving: active,
  };
};
