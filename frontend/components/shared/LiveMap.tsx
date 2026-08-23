import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: [number, number] = [28.6139, 77.2090];

const isValidCoord = (p: any): p is [number, number] => {
  return Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number' && !isNaN(p[0]) && !isNaN(p[1]);
};

interface BusStatus {
  [busId: string]: 'ON_ROUTE' | 'PARKED' | 'DELAYED' | 'EMERGENCY';
}

interface Props {
  positions?: Record<string, [number, number]>;
  headings?: Record<string, number>;
  statuses?: BusStatus;
  route?: [number, number][];
  stops?: { name: string; position: [number, number] }[];
  myStopPosition?: [number, number];
  zoom?: number;
  interactive?: boolean;
  selectedBusId?: string | null;
  height?: string;
}

const STATUS_COLORS: Record<string, string> = {
  ON_ROUTE: '#10B981',
  PARKED: '#71717A',
  DELAYED: '#F59E0B',
  EMERGENCY: '#EF4444',
};

const LiveMap: React.FC<Props> = ({
  positions = {},
  statuses = {},
  route = [],
  stops = [],
  myStopPosition,
  zoom = 14,
  interactive = true,
  selectedBusId = null,
  height = 'h-full',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const candidatePos = selectedBusId && positions[selectedBusId] ? positions[selectedBusId] : Object.values(positions)[0];
  const mainPosition: [number, number] = isValidCoord(candidatePos) ? candidatePos : DEFAULT_CENTER;

  // Initialize map instance once
  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    try {
      const container = containerRef.current;
      // Fix for React 18 Strict Mode: clear leftover leaflet id if it exists
      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = null;
        container.innerHTML = '';
      }

      const map = L.map(container, {
        center: mainPosition,
        zoom: zoom,
        scrollWheelZoom: interactive,
        zoomControl: interactive,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Handle container resizes dynamically
      const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(container);

      // Initial size invalidation
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {
          // ignore
        }
      }, 200);
      
      // Attach observer to map object so we can clean it up later
      (map as any)._resizeObserver = resizeObserver;

    } catch (err) {
      console.warn('Map initialization error:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          const obs = (mapInstanceRef.current as any)._resizeObserver;
          if (obs && containerRef.current) {
            obs.unobserve(containerRef.current);
            obs.disconnect();
          }
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        polylineRef.current = null;
      }
    };
  }, []);

  // Update markers, route polyline, and map center dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    try {
      markersLayer.clearLayers();

      // 1. Draw route polyline
      const validRoute = route.filter(isValidCoord);
      if (polylineRef.current) {
        try {
          map.removeLayer(polylineRef.current);
        } catch {
          // ignore
        }
        polylineRef.current = null;
      }

      if (validRoute.length > 1) {
        polylineRef.current = L.polyline(validRoute, {
          color: '#4F46E5',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 6'
        }).addTo(map);
      }

      // 2. Add Stops
      stops.forEach((stop, idx) => {
        if (stop && isValidCoord(stop.position)) {
          const pinIcon = L.divIcon({
            html: `<div style="display:flex;align-items:center;justify-content:center;width:14px;height:14px;background:#4f46e5;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
            className: 'custom-stop-icon',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          const marker = L.marker(stop.position, { icon: pinIcon });
          marker.bindPopup(`<p style="font-size:11px;font-weight:700;margin:0;color:#0f172a;">${stop.name || `Stop ${idx + 1}`}</p>`);
          markersLayer.addLayer(marker);
        }
      });

      // 3. Add My Stop (if any)
      if (isValidCoord(myStopPosition)) {
        const myIcon = L.divIcon({
          html: `<div style="display:flex;align-items:center;justify-content:center;width:18px;height:18px;background:#10b981;border:2px solid white;border-radius:50%;box-shadow:0 0 10px #10b981;"></div>`,
          className: 'custom-my-stop-icon',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        const myMarker = L.marker(myStopPosition, { icon: myIcon });
        myMarker.bindPopup(`<p style="font-size:11px;font-weight:800;margin:0;color:#059669;">Your Designated Stop</p>`);
        markersLayer.addLayer(myMarker);
      }

      // 4. Add Live Buses
      Object.entries(positions).forEach(([busId, pos]) => {
        if (!isValidCoord(pos)) return;
        const status = statuses[busId] || 'ON_ROUTE';
        const color = STATUS_COLORS[status] || STATUS_COLORS.ON_ROUTE;

        const busIcon = L.divIcon({
          html: `<div style="position:relative;width:34px;height:34px;">
                  <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.3;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
                  <div style="width:34px;height:34px;border-radius:50%;border:2px solid white;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.3);">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="2.5" fill="none">
                      <rect x="4" y="6" width="16" height="10" rx="2" />
                      <path d="M6 16v2m12-2v2M8 6V4m8 2V4" />
                    </svg>
                  </div>
                </div>`,
          className: 'custom-bus-icon',
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        const busMarker = L.marker(pos, { icon: busIcon });
        busMarker.bindPopup(`
          <div style="padding:4px;min-width:120px;">
            <p style="font-size:12px;font-weight:800;margin:0 0 2px 0;color:#0f172a;">${busId}</p>
            <p style="font-size:10px;font-weight:600;margin:0 0 2px 0;color:#64748b;">Status: <span style="color:${color};font-weight:700;">${status.replace('_', ' ')}</span></p>
            <p style="font-size:9px;font-weight:700;margin:0;color:#10b981;">● Live GPS Radar Active</p>
          </div>
        `);
        markersLayer.addLayer(busMarker);
      });

      // 5. Update Center / Bounds
      const bounds = L.latLngBounds([]);
      let hasPoints = false;

      if (validRoute.length > 0) {
        validRoute.forEach(pt => { bounds.extend(pt); hasPoints = true; });
      }
      stops.forEach(st => {
        if (st && isValidCoord(st.position)) {
          bounds.extend(st.position);
          hasPoints = true;
        }
      });
      Object.values(positions).forEach(pos => {
        if (isValidCoord(pos)) {
          bounds.extend(pos);
          hasPoints = true;
        }
      });

      if (hasPoints && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else if (isValidCoord(mainPosition)) {
        map.panTo(mainPosition, { animate: true, duration: 0.5 });
      }

      // Invalidate size to avoid any grey tile clipping
      setTimeout(() => {
        try { map.invalidateSize(); } catch {}
      }, 150);
    } catch (err) {
      console.warn('Map layer update error caught:', err);
    }
  }, [positions, statuses, route, stops, myStopPosition, mainPosition?.[0], mainPosition?.[1]]);

  return (
    <div className={`w-full ${height} relative overflow-hidden rounded-[2.5rem] bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 shadow-sm`}>
      <div ref={containerRef} className="w-full h-full z-10" />

      {/* Live indicator badge */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <div className="bg-slate-900/90 dark:bg-zinc-950/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-xl border border-white/10 flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
          <p className="text-[10px] font-black uppercase tracking-widest text-white">
            Fleet Radar Live
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
