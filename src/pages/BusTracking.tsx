import { useState, useEffect, useCallback } from 'react';
import { Bus, Satellite, Clock, Navigation, Phone, WifiOff, AlertTriangle, Zap, ZapOff, Gauge } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ui';
import {
  getAllBusPositions,
  formatLastSeen,
  millitrackConfigured,
  BUS_DEVICE_MAP,
  type LiveBusData,
  type MillitrackStatus,
} from '../services/millitrack';

// Google Maps React SDK Imports
import { GoogleMap, useJsApiLoader, MarkerF, Polyline, InfoWindow } from '@react-google-maps/api';

// ── Static route / driver configuration ──────────────────────────────────────
// busNumber must exactly match the key used in BUS_DEVICE_MAP in millitrack.ts.
// Update route names, driver names, and phone numbers to reflect your real data.
interface RouteStop {
  lat: number;
  lng: number;
  name: string;
}

interface RouteConfig {
  id: number;
  busNumber: string;
  route: string;
  next: string;
  eta: number | null;
  driver: string;
  phone: string;
  color: string;
  startPos: { lat: number; lng: number };
  stops: RouteStop[];
}

const ROUTE_CONFIG: RouteConfig[] = [
  {
    id: 1,
    busNumber: 'TS07UP2292',   // deviceId 204221
    route: 'Route 1',
    next: '',
    eta: null,
    driver: 'Driver',
    phone: '98765 43210',
    color: '#185FA5',
    startPos: { lat: 17.3100, lng: 78.1400 },
    stops: [
      { lat: 17.3100, lng: 78.1400, name: 'Ibrahimpatnam Circle' },
      { lat: 17.3140, lng: 78.1450, name: 'Ibrahimpatnam Lake' },
      { lat: 17.3180, lng: 78.1490, name: 'Bus Stand' },
      { lat: 17.3198, lng: 78.1511, name: 'School' },
    ],
  },
  {
    id: 2,
    busNumber: 'TS07UM4821',   // deviceId 204197
    route: 'Route 2',
    next: '',
    eta: null,
    driver: 'Driver',
    phone: '99887 65432',
    color: '#0A6E5F',
    startPos: { lat: 17.3320, lng: 78.1650 },
    stops: [
      { lat: 17.3320, lng: 78.1650, name: 'Sheriguda' },
      { lat: 17.3280, lng: 78.1590, name: 'Gurunanak University' },
      { lat: 17.3240, lng: 78.1550, name: 'Gurunanak College' },
      { lat: 17.3198, lng: 78.1511, name: 'School' },
    ],
  },
  {
    id: 3,
    busNumber: 'TG07T2823',    // deviceId 204238
    route: 'Route 3',
    next: '',
    eta: null,
    driver: 'Driver',
    phone: '97654 32109',
    color: '#B45309',
    startPos: { lat: 17.3080, lng: 78.1480 },
    stops: [
      { lat: 17.3080, lng: 78.1480, name: 'Ibrahimpatnam Police Station' },
      { lat: 17.3120, lng: 78.1495, name: 'Ibrahimpatnam Hospital' },
      { lat: 17.3160, lng: 78.1505, name: 'Ibrahimpatnam X Roads' },
      { lat: 17.3198, lng: 78.1511, name: 'School' },
    ],
  },
  {
    id: 4,
    busNumber: 'TG07T2824',    // deviceId 204227
    route: 'Route 4',
    next: '',
    eta: null,
    driver: 'Driver',
    phone: '96543 21098',
    color: '#7C3AED',
    startPos: { lat: 17.2910, lng: 78.1150 },
    stops: [
      { lat: 17.2910, lng: 78.1150, name: 'Bongloor' },
      { lat: 17.3000, lng: 78.1250, name: 'Bongloor X Roads' },
      { lat: 17.3100, lng: 78.1380, name: 'Mangalpally' },
      { lat: 17.3198, lng: 78.1511, name: 'School' },
    ],
  },
  {
    id: 5,
    busNumber: 'TG07V7473',    // deviceId 204214
    route: 'Route 5',
    next: '',
    eta: null,
    driver: 'Driver',
    phone: '95432 10987',
    color: '#BE185D',
    startPos: { lat: 17.1500, lng: 78.2500 },
    stops: [
      { lat: 17.1500, lng: 78.2500, name: 'Yacharam' },
      { lat: 17.2000, lng: 78.2000, name: 'Yacharam X Roads' },
      { lat: 17.2800, lng: 78.1600, name: 'Ibrahimpatnam Outer Ring Road' },
      { lat: 17.3198, lng: 78.1511, name: 'School' },
    ],
  },
];

// Demo fallback percentages (used when Millitrack is unconfigured/offline)
const DEMO_PCTS: Record<number, number> = { 1: 68, 2: 44, 3: 91, 4: 55, 5: 30 };

// Helper to interpolate coordinates along route stops for demo animation
interface LatLng {
  lat: number;
  lng: number;
}

function interpolatePosition(stops: RouteStop[], pct: number): LatLng {
  if (stops.length === 0) return { lat: 17.3198, lng: 78.1511 };
  if (stops.length === 1) return { lat: stops[0].lat, lng: stops[0].lng };
  if (pct <= 0) return { lat: stops[0].lat, lng: stops[0].lng };
  if (pct >= 100) return { lat: stops[stops.length - 1].lat, lng: stops[stops.length - 1].lng };

  const progress = pct / 100;
  const segmentCount = stops.length - 1;
  const rawIndex = progress * segmentCount;
  const index = Math.floor(rawIndex);
  const segmentProgress = rawIndex - index;

  if (index >= segmentCount) return { lat: stops[stops.length - 1].lat, lng: stops[stops.length - 1].lng };

  const p1 = stops[index];
  const p2 = stops[index + 1];

  return {
    lat: p1.lat + (p2.lat - p1.lat) * segmentProgress,
    lng: p1.lng + (p2.lng - p1.lng) * segmentProgress,
  };
}

// ── Helper ────────────────────────────────────────────────────────────────────
function isActive(live: LiveBusData | undefined, _routeId: number): boolean {
  if (!live) return true; // demo fallback — show all 5 buses as active
  return live.ignition && !live.error;
}

// ── Google Maps Custom Marker SVG Generators ──────────────────────────────────
const getBusSvgString = (color: string, label: string, heading: number) => {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-opacity="0.35"/>
        </filter>
      </defs>
      <g filter="url(#shadow)" transform="rotate(${heading}, 32, 32)">
        <!-- Side Mirrors -->
        <rect x="17" y="15" width="3" height="5" rx="1" fill="#333333" />
        <rect x="44" y="15" width="3" height="5" rx="1" fill="#333333" />
        
        <!-- Main Bus Body -->
        <rect x="20" y="9" width="24" height="46" rx="4" fill="${color}" stroke="white" stroke-width="2"/>
        
        <!-- Front Windshield -->
        <path d="M22 15c0-2 2-4 4-4h8c2 0 4 2 4 4v2H22v-2z" fill="#e2e8f0" stroke="#334155" stroke-width="1"/>
        <path d="M34 12l3 3h-4z" fill="white" opacity="0.6" />
        
        <!-- Roof AC units / hatches -->
        <rect x="25" y="23" width="14" height="8" rx="1" fill="white" opacity="0.25" stroke="white" stroke-width="1"/>
        <rect x="25" y="35" width="14" height="8" rx="1" fill="white" opacity="0.25" stroke="white" stroke-width="1"/>
        
        <!-- Rear Window -->
        <rect x="23" y="49" width="18" height="3" rx="0.5" fill="#475569" />
        
        <!-- Route text printed on the roof of the bus -->
        <circle cx="32" cy="29" r="5" fill="white" />
        <text x="32" y="32" font-size="8" font-weight="900" fill="${color}" text-anchor="middle" font-family="system-ui">${label}</text>
      </g>
    </svg>
  `;
};

const getSchoolSvgString = () => {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="46" height="54" viewBox="0 0 46 54">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <g filter="url(#shadow)" transform="translate(3, 1)">
        <!-- Pin Shape -->
        <path d="M20 0C8.954 0 0 8.954 0 20c0 12.4 20 28 20 28s20-15.6 20-28c0-11.046-8.954-20-20-20z" fill="#2563eb" stroke="white" stroke-width="2.5"/>
        
        <!-- White Circular Background -->
        <circle cx="20" cy="20" r="11" fill="white" />
        
        <!-- Graduation Cap Icon in Blue -->
        <g transform="translate(10, 10)">
          <path d="M10 2l8 4-8 4-8-4z" fill="#2563eb"/>
          <path d="M5 7.5v4c0 1.2 1.2 2 5 2s5-.8 5-2v-4" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M15 6v3.5" fill="none" stroke="#2563eb" stroke-width="1.2"/>
          <circle cx="15" cy="9.5" r="1" fill="#2563eb"/>
        </g>
        
        <!-- KTS Text overlay on bottom of circle/pin -->
        <text x="20" y="37" font-size="7" font-weight="900" fill="white" text-anchor="middle" font-family="system-ui">KTS</text>
      </g>
    </svg>
  `;
};

// ── Component ─────────────────────────────────────────────────────────────────
export function BusTracking() {
  const [selectedBus, setSelectedBus] = useState<number | null>(null);
  // Touch-hint overlay: shown on mobile until first map interaction
  const [showTouchHint, setShowTouchHint] = useState(true);
  const [touchHintFading, setTouchHintFading] = useState(false);

  const dismissTouchHint = useCallback(() => {
    if (!showTouchHint) return;
    setTouchHintFading(true);
    setTimeout(() => setShowTouchHint(false), 400);
  }, [showTouchHint]);

  // Load Google Maps SDK
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Live GPS state
  const [liveData, setLiveData] = useState<Record<string, LiveBusData>>({});
  const [gpsStatus, setGpsStatus] = useState<MillitrackStatus>(
    millitrackConfigured ? 'offline' : 'unconfigured'
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  // Simulated progress % for the SVG map (demo) or derived from speed (live)
  const [livePcts, setLivePcts] = useState<Record<number, number>>(DEMO_PCTS);

  // Map state (default to Ibrahimpatnam where buses are located)
  const [mapCenter, setMapCenter] = useState<[number, number]>([17.3198, 78.1511]);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');

  // Keep track of the last selected bus so we only center/zoom when selection actually changes
  const [prevSelectedBus, setPrevSelectedBus] = useState<number | null>(null);

  // Animated bus positions state
  const [animatedBuses, setAnimatedBuses] = useState<
    Record<number, { lat: number; lng: number; heading: number }>
  >({});

  // Sync map center/zoom state only when the selected bus selection actually changes
  useEffect(() => {
    if (selectedBus !== prevSelectedBus) {
      setPrevSelectedBus(selectedBus);
      
      if (selectedBus !== null) {
        const cfg = ROUTE_CONFIG.find((c) => c.id === selectedBus);
        if (cfg) {
          const live = liveData[cfg.busNumber];
          let lat = 17.3198;
          let lng = 78.1511;
          if (gpsStatus === 'live' && live && !live.error) {
            lat = live.lat;
            lng = live.lng;
          } else {
            const pct = livePcts[cfg.id] ?? 0;
            const pos = interpolatePosition(cfg.stops, pct);
            lat = pos.lat;
            lng = pos.lng;
          }
          setMapCenter([lat, lng]);
          setMapZoom(15);
        }
      } else {
        // Default center: school
        setMapCenter([17.3198, 78.1511]);
        setMapZoom(13);
      }
    }
  }, [selectedBus, prevSelectedBus, liveData, gpsStatus, livePcts]);

  // Pan and zoom map only when state variables change from selection updates
  useEffect(() => {
    if (map) {
      map.panTo({ lat: mapCenter[0], lng: mapCenter[1] });
      map.setZoom(mapZoom);
    }
  }, [mapCenter, mapZoom, map]);

  // Follow the active selected bus location when it updates, using map.panTo directly to avoid resetting user's zoom
  useEffect(() => {
    if (map && selectedBus !== null) {
      const cfg = ROUTE_CONFIG.find((c) => c.id === selectedBus);
      if (cfg) {
        const live = liveData[cfg.busNumber];
        let lat = 0;
        let lng = 0;
        if (gpsStatus === 'live' && live && !live.error) {
          lat = live.lat;
          lng = live.lng;
        } else {
          const pct = livePcts[cfg.id] ?? 0;
          const pos = interpolatePosition(cfg.stops, pct);
          lat = pos.lat;
          lng = pos.lng;
        }
        
        if (lat !== 0 && lng !== 0) {
          map.panTo({ lat, lng });
        }
      }
    }
  }, [liveData, livePcts, gpsStatus, selectedBus, map]);

  // Unified loop to compute target positions and smoothly update animated positions (glide animation like food delivery apps)
  useEffect(() => {
    const updateLoop = () => {
      setAnimatedBuses((prev) => {
        const next = { ...prev };
        let changed = false;

        ROUTE_CONFIG.forEach((cfg) => {
          // 1. Calculate Target Position
          let targetLat = 17.3198;
          let targetLng = 78.1511;

          const live = liveData[cfg.busNumber];
          if (gpsStatus === 'live' && live && !live.error) {
            targetLat = live.lat;
            targetLng = live.lng;
          } else {
            const pct = livePcts[cfg.id] ?? 0;
            const pos = interpolatePosition(cfg.stops, pct);
            targetLat = pos.lat;
            targetLng = pos.lng;
          }

          // 2. Interpolate towards Target Position
          const current = prev[cfg.id];
          if (!current) {
            next[cfg.id] = { lat: targetLat, lng: targetLng, heading: 0 };
            changed = true;
          } else {
            const dLat = targetLat - current.lat;
            const dLng = targetLng - current.lng;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);

            // Smooth linear interpolation (lerp)
            const nextLat = current.lat + dLat * 0.08;
            const nextLng = current.lng + dLng * 0.08;
            let heading = current.heading;

            // If the bus moves a significant amount, calculate the new heading
            if (dist > 0.00001) {
              const radLat1 = current.lat * Math.PI / 180;
              const radLat2 = nextLat * Math.PI / 180;
              const radDLng = (nextLng - current.lng) * Math.PI / 180;

              const y = Math.sin(radDLng) * Math.cos(radLat2);
              const x = Math.cos(radLat1) * Math.sin(radLat2) - Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(radDLng);
              const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
              heading = bearing;
            }

            // Check if we changed enough to update state
            if (
              Math.abs(current.lat - nextLat) > 1e-7 ||
              Math.abs(current.lng - nextLng) > 1e-7 ||
              Math.abs(current.heading - heading) > 0.5
            ) {
              next[cfg.id] = { lat: nextLat, lng: nextLng, heading };
              changed = true;
            }
          }
        });

        return changed ? next : prev;
      });
    };

    const interval = setInterval(updateLoop, 50);
    return () => clearInterval(interval);
  }, [liveData, livePcts, gpsStatus]);

  // ── Fetch live positions ────────────────────────────────────────────────────
  const fetchPositions = useCallback(async () => {
    if (!millitrackConfigured || Object.keys(BUS_DEVICE_MAP).length === 0) return;
    setLoading(true);
    try {
      const [positions, status] = await getAllBusPositions();
      setGpsStatus(status);
      if (status === 'live') {
        const map: Record<string, LiveBusData> = {};
        positions.forEach((p) => { map[p.busNumber] = p; });
        setLiveData(map);
        setLastUpdated(new Date());

        // Derive a progress % from speed: cap at 95% (we don't know distance)
        setLivePcts((prev) => {
          const next = { ...prev };
          ROUTE_CONFIG.forEach((cfg) => {
            const d = map[cfg.busNumber];
            if (d && d.ignition && !d.error) {
              // Speed-based heuristic: faster = further along route (capped)
              const speedPct = Math.min(95, Math.max(5, d.speed * 1.5));
              next[cfg.id] = speedPct;
            } else if (d && !d.ignition) {
              next[cfg.id] = 0;
            }
          });
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 15-second polling
  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, 15000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

  // Demo animation (only when no live data)
  useEffect(() => {
    if (gpsStatus === 'live') return;
    const interval = setInterval(() => {
      setLivePcts((prev) => {
        const next = { ...prev };
        ROUTE_CONFIG.forEach((cfg) => {
          if (cfg.id !== 4 && next[cfg.id] < 100) {
            next[cfg.id] = Math.min(100, next[cfg.id] + Math.random() * 0.5);
          }
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [gpsStatus]);

  // ── Derived KPIs ────────────────────────────────────────────────────────────
  const activeBusCount =
    gpsStatus === 'live'
      ? Object.values(liveData).filter((d) => d.ignition && !d.error).length
      : 3; // demo value

  const avgSpeed =
    gpsStatus === 'live' && Object.keys(liveData).length > 0
      ? Math.round(
          Object.values(liveData)
            .filter((d) => d.ignition)
            .reduce((sum, d) => sum + d.speed, 0) /
            Math.max(1, Object.values(liveData).filter((d) => d.ignition).length)
        )
      : null;

  // ── Status banner helpers ───────────────────────────────────────────────────
  const statusBanner = (() => {
    if (gpsStatus === 'live') return null;
    if (gpsStatus === 'unauthorized')
      return {
        icon: <AlertTriangle size={13} />,
        color: 'var(--amber-tx)',
        bg: 'var(--amber-bg)',
        text: 'Session expired — please log out and log back in to resume live GPS tracking.',
      };
    if (gpsStatus === 'offline')
      return {
        icon: <WifiOff size={13} />,
        color: 'var(--coral-tx, #b91c1c)',
        bg: 'var(--coral-bg, #fef2f2)',
        text: 'Could not reach the GPS proxy on your Laravel server — check that the backend is running and Millitrack is reachable from it. Showing demo data.',
      };
    // unconfigured
    return {
      icon: <AlertTriangle size={13} />,
      color: 'var(--blue-tx)',
      bg: 'var(--blue-bg)',
      text: 'Bus GPS not configured. Ensure BUS_DEVICE_MAP is populated in MillitrackProxyController.php and the Laravel server is running.',
    };
  })();

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">

      {/* Status banner */}
      {statusBanner && (
        <div
          className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-3 text-[11.5px]"
          style={{ background: statusBanner.bg, color: statusBanner.color, border: `1px solid ${statusBanner.color}30` }}
        >
          {statusBanner.icon}
          <span>{statusBanner.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard
          label="Active Buses"
          value={String(activeBusCount)}
          sub={gpsStatus === 'live' ? 'Ignition ON · Live' : 'GPS live tracking'}
          icon={<Bus size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
        />
        <KPICard
          label="Avg Speed"
          value={avgSpeed !== null ? <>{avgSpeed}<span className="text-[13px] font-normal text-[var(--tx3)]"> km/h</span></> : '—'}
          sub={gpsStatus === 'live' ? 'Active buses only' : 'No live data'}
          icon={<Gauge size={15} />}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue-tx)"
        />
        <KPICard
          label="GPS Status"
          value={gpsStatus === 'live' ? <><span className="text-[13px] font-normal text-[var(--tx3)]"></span>Live</> : 'Demo'}
          sub={gpsStatus === 'live' && lastUpdated ? `Updated ${formatLastSeen(lastUpdated.toISOString())}` : 'Configure Millitrack'}
          icon={<Satellite size={15} />}
          iconBg="var(--green-bg)"
          iconColor="var(--green-tx)"
        />
        <KPICard
          label="Last Refresh"
          value={lastUpdated ? formatLastSeen(lastUpdated.toISOString()) : '—'}
          sub={loading ? 'Fetching…' : 'Polls every 15 s'}
          icon={<Clock size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
        />
      </div>

      {/* Live Bus Status + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-2.5 mb-3">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12.5px] font-semibold text-[var(--tx)] flex items-center gap-1.5">
              <Bus size={14} className="text-[var(--tx3)]" /> Live Bus Status
            </div>
            <div className="flex items-center gap-1.5">
              {loading && (
                <span className="text-[10.5px] text-[var(--tx3)] animate-pulse">Updating…</span>
              )}
              <Badge variant={gpsStatus === 'live' ? 'teal' : 'gray'}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block mr-0.5 ${gpsStatus === 'live' ? 'bg-[var(--teal)] animate-pulse' : 'bg-[var(--tx3)]'}`} />
                {gpsStatus === 'live' ? 'Live GPS' : 'Demo'}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            {ROUTE_CONFIG.map((cfg) => {
              const live = liveData[cfg.busNumber];
              const active = isActive(live, cfg.id);
              const pct = Math.round(livePcts[cfg.id] ?? 0);
              const speed = live?.speed ?? null;
              const ignition = live?.ignition ?? (cfg.id !== 4);
              const lastSeen = live?.lastSeen ?? '';

              return (
                <button
                  key={cfg.id}
                  onClick={() => setSelectedBus(selectedBus === cfg.id ? null : cfg.id)}
                  className={`w-full text-left flex items-center gap-2.5 p-2.5 bg-[var(--surf2)] border rounded-xl cursor-pointer transition-all ${
                    selectedBus === cfg.id ? 'border-[var(--blue)] ring-1 ring-[var(--blue)]/30' : 'border-[var(--b)] hover:border-[var(--blue)]'
                  } ${!active ? 'opacity-60' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-[var(--teal-bg)] text-[var(--teal-tx)]' : 'bg-[var(--surf3)] text-[var(--tx3)]'}`}>
                    <Bus size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[12px] font-semibold text-[var(--tx)] truncate">{live?.address ? live.address : cfg.route}</span>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] text-[var(--tx3)] truncate">
                        {active ? (live?.address ? `Location: ${live.address}` : 'Live Tracking') : 'Offline'}
                      </span>
                      {/* Live speed chip */}
                      {gpsStatus === 'live' && speed !== null && active && (
                        <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--blue-bg)] text-[var(--blue-tx)]">
                          <Gauge size={9} /> {speed} km/h
                        </span>
                      )}
                      {/* Ignition indicator */}
                      {gpsStatus === 'live' && (
                        <span className={`flex-shrink-0 flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${ignition ? 'bg-[var(--green-bg)] text-[var(--green-tx)]' : 'bg-[var(--surf3)] text-[var(--tx3)]'}`}>
                          {ignition ? <Zap size={9} /> : <ZapOff size={9} />}
                          {ignition ? 'On' : 'Off'}
                        </span>
                      )}
                    </div>
                    {active && <ProgressBar value={pct} color={cfg.color} height={4} />}
                    {/* Last seen */}
                    {gpsStatus === 'live' && lastSeen && (
                      <div className="text-[10px] text-[var(--tx3)] mt-1">
                        Last GPS fix: {formatLastSeen(lastSeen)}
                      </div>
                    )}
                  </div>
                  {active ? <Badge variant="teal">On route</Badge> : <Badge variant="gray">Idle</Badge>}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Side Panel */}
        <div className="space-y-2.5">
          {selectedBus ? (() => {
            const cfg = ROUTE_CONFIG.find((c) => c.id === selectedBus);
            if (!cfg) return null;
            const live = liveData[cfg.busNumber];
            const active = isActive(live, cfg.id);
            const pct = Math.round(livePcts[cfg.id] ?? 0);
            return (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[12.5px] font-semibold text-[var(--tx)]">Route {cfg.id} Details</div>
                  <button onClick={() => setSelectedBus(null)} className="text-[11px] text-[var(--tx3)] hover:text-[var(--tx)] cursor-pointer">Clear</button>
                </div>

                {/* Route summary */}
                <div className="p-3 rounded-xl border border-[var(--b)] bg-[var(--surf2)] mb-3">
                  <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-1">{live?.address ? live.address : cfg.route}</div>
                  <div className="text-[11px] text-[var(--tx3)] mb-2">
                    {active ? (live?.address ? `Location: ${live.address}` : 'Live Tracking') : 'Offline'}
                  </div>
                  {active && <ProgressBar value={pct} color={cfg.color} height={5} />}

                  {/* Live telemetry grid */}
                  {gpsStatus === 'live' && live && !live.error && (
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                      <div className="text-center p-1.5 bg-[var(--surf3)] rounded-lg">
                        <div className="text-[13px] font-bold text-[var(--tx)]">{live.speed}</div>
                        <div className="text-[9.5px] text-[var(--tx3)]">km/h</div>
                      </div>
                      <div className="text-center p-1.5 bg-[var(--surf3)] rounded-lg">
                        <div className={`text-[13px] font-bold ${live.ignition ? 'text-[var(--green-tx,#15803d)]' : 'text-[var(--tx3)]'}`}>
                          {live.ignition ? 'ON' : 'OFF'}
                        </div>
                        <div className="text-[9.5px] text-[var(--tx3)]">Ignition</div>
                      </div>
                      <div className="text-center p-1.5 bg-[var(--surf3)] rounded-lg">
                        <div className="text-[11px] font-bold text-[var(--tx)] leading-tight">{formatLastSeen(live.lastSeen)}</div>
                        <div className="text-[9.5px] text-[var(--tx3)]">Last fix</div>
                      </div>
                    </div>
                  )}
                  {gpsStatus === 'live' && live && !live.error && live.address && (
                    <div className="text-[10px] text-[var(--tx3)] mt-2.5 pt-2 border-t border-[var(--b)]">
                      <span className="font-semibold text-[var(--tx)]">Location:</span> {live.address}
                    </div>
                  )}
                  {gpsStatus === 'live' && live?.error && (
                    <div className="mt-2 text-[10.5px] text-[var(--amber-tx)] flex items-center gap-1">
                      <AlertTriangle size={11} /> {live.error}
                    </div>
                  )}
                </div>

                {/* Driver card */}
                <div className="flex items-center gap-2 p-2.5 bg-[var(--blue-bg)] rounded-xl mb-3">
                  <div className="w-7 h-7 rounded-lg bg-[var(--blue)] flex items-center justify-center flex-shrink-0">
                    <Bus size={14} className="text-white" />
                  </div>
                  <div>
                    <div className="text-[11.5px] font-semibold text-[var(--blue-tx)]">{cfg.driver}</div>
                    <div className="text-[10.5px] text-[var(--blue-tx)] opacity-70">Driver · {cfg.busNumber}</div>
                  </div>
                  <a
                    href={`tel:${cfg.phone}`}
                    className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-[var(--blue)] text-white rounded-lg text-[11px] cursor-pointer hover:opacity-90"
                  >
                    <Phone size={10} /> Call
                  </a>
                </div>


              </Card>
            );
          })() : (
            <Card>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--surf3)] flex items-center justify-center mb-3">
                  <Bus size={20} className="text-[var(--tx3)]" />
                </div>
                <div className="text-[13px] font-semibold text-[var(--tx)] mb-1">Select a bus</div>
                <div className="text-[11.5px] text-[var(--tx3)] max-w-[200px]">
                  Click on a bus from the list to view its live location and details.
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Live Map View */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--tx)]">
            <Navigation size={14} className="text-[var(--tx3)]" /> Live Map View
          </div>
          <div className="flex items-center gap-1.5">
            {selectedBus !== null && (
              <button 
                onClick={() => setSelectedBus(null)}
                className="text-[10px] bg-[var(--surf3)] hover:bg-[var(--b)] text-[var(--tx)] px-2 py-0.5 rounded transition-all cursor-pointer mr-1"
              >
                Reset Focus
              </button>
            )}
            <Badge variant={gpsStatus === 'live' ? 'teal' : 'gray'}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block mr-0.5 ${gpsStatus === 'live' ? 'bg-[var(--teal)] animate-pulse' : 'bg-[var(--tx3)]'}`} />
              {gpsStatus === 'live' ? 'GPS Live' : 'Demo Route'}
            </Badge>
          </div>
        </div>

        {/* Real Google Map */}
        <div className="relative bg-[var(--surf2)] rounded-xl overflow-hidden border border-[var(--b)]" style={{ height: 'clamp(300px, 50vw, 480px)' }}>
          {!isLoaded ? (
            <div className="flex items-center justify-center h-full text-[12.5px] text-[var(--tx3)] font-medium">
              <span className="animate-pulse">Loading Google Maps...</span>
            </div>
          ) : (
            <>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={{ lat: mapCenter[0], lng: mapCenter[1] }}
                zoom={mapZoom}
                onLoad={onMapLoad}
                onUnmount={onMapUnmount}
                options={{
                  mapTypeControl: false,
                  streetViewControl: true,
                  zoomControl: true,
                  fullscreenControl: false,
                  // Fix pinch-zoom vs page-scroll conflict on touch devices:
                  // 'greedy' captures all touch gestures exclusively for the map.
                  gestureHandling: 'greedy',
                }}
                mapTypeId={mapStyle === 'streets' ? 'roadmap' : 'hybrid'}
                onDragStart={dismissTouchHint}
                onZoomChanged={dismissTouchHint}
              >
                {/* School Marker */}
                <MarkerF
                  position={{ lat: 17.3198, lng: 78.1511 }}
                  icon={{
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(getSchoolSvgString())}`,
                     
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    scaledSize: new (window as any).google.maps.Size(46, 54),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    anchor: new (window as any).google.maps.Point(23, 49)
                  }}
                  title="KTS School"
                />

                {/* Route polylines */}
                {ROUTE_CONFIG.map((cfg) => {
                  const isSelected = selectedBus === cfg.id;
                  const isAnySelected = selectedBus !== null;
                  if (isAnySelected && !isSelected) return null;
                  
                  const routeCoords = cfg.stops.map(s => ({ lat: s.lat, lng: s.lng }));
                  
                  return (
                    <Polyline
                      key={cfg.id}
                      path={routeCoords}
                      options={{
                        strokeColor: cfg.color,
                        strokeOpacity: isSelected ? 0.95 : 0.6,
                        strokeWeight: isSelected ? 4 : 2.5,
                      }}
                    />
                  );
                })}

                {/* Stops as small dot markers */}
                {ROUTE_CONFIG.map((cfg) => {
                  const isSelected = selectedBus === cfg.id;
                  const isAnySelected = selectedBus !== null;
                  if (isAnySelected && !isSelected) return null;

                  return cfg.stops.slice(0, -1).map((stop, si) => (
                    <MarkerF
                      key={`${cfg.id}-stop-${si}`}
                      position={{ lat: stop.lat, lng: stop.lng }}
                      icon={{
                        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                           
                          `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><circle cx="5" cy="5" r="4" fill="${cfg.color}" stroke="white" stroke-width="1.5"/></svg>`
                         
                        )}`,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        scaledSize: new (window as any).google.maps.Size(10, 10),
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        anchor: new (window as any).google.maps.Point(5, 5)
                      }}
                      title={`${stop.name} (Route ${cfg.id} Stop)`}
                    />
                  ));
                })}

                {/* Bus markers */}
                {ROUTE_CONFIG.map((cfg) => {
                  const isSelected = selectedBus === cfg.id;
                  const isAnySelected = selectedBus !== null;
                  
                  const anim = animatedBuses[cfg.id];
                  const pos = anim ? { lat: anim.lat, lng: anim.lng } : { lat: 17.3198, lng: 78.1511 };
                  const heading = anim ? anim.heading : 0;

                  const opacity = isAnySelected && !isSelected ? 0.35 : 1;

                  return (
                    <MarkerF
                       
                      key={cfg.id}
                       
                      position={pos}
                      icon={{
                        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(getBusSvgString(cfg.color, String(cfg.id), heading))}`,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        scaledSize: new (window as any).google.maps.Size(64, 64),
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        anchor: new (window as any).google.maps.Point(32, 32)
                      }}
                      opacity={opacity}
                      onClick={() => {
                        setSelectedBus(isSelected ? null : cfg.id);
                      }}
                    />
                  );
                })}

                {/* InfoWindow for Selected Bus */}
                {selectedBus !== null && (() => {
                  const cfg = ROUTE_CONFIG.find(c => c.id === selectedBus);
                  if (!cfg) return null;
                  const live = liveData[cfg.busNumber];
                  const anim = animatedBuses[cfg.id];
                  const pos = anim ? { lat: anim.lat, lng: anim.lng } : { lat: 17.3198, lng: 78.1511 };
                  return (
                    <InfoWindow
                      position={pos}
                      onCloseClick={() => setSelectedBus(null)}
                    >
                      <div className="p-2 min-w-[150px] text-gray-800">
                        <div className="font-bold text-[12px] flex items-center gap-1.5" style={{ color: cfg.color }}>
                          <Bus size={12} /> {liveData[cfg.busNumber]?.address ? liveData[cfg.busNumber].address : cfg.route}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Plate: <span className="font-semibold text-gray-700">{cfg.busNumber}</span>
                        </div>
                        <div className="text-[10.5px] font-semibold text-gray-800 mt-1">
                          {gpsStatus === 'live' && live
                            ? `${live.speed} km/h · Ignition: ${live.ignition ? 'ON' : 'OFF'}`
                            : `ETA: ${cfg.eta} min (Simulated)`}
                        </div>
                        {gpsStatus === 'live' && live?.status && (
                          <div className="text-[10px] font-semibold text-gray-700 mt-1">
                            Status: <span className="text-[var(--teal-tx)]">{live.status}</span>
                          </div>
                        )}
                        {gpsStatus === 'live' && live?.address && (
                          <div className="text-[9.5px] text-gray-600 border-t border-gray-100 mt-1 pt-1 italic">
                            {live.address}
                          </div>
                        )}
                        {gpsStatus === 'live' && live?.lastSeen && (
                          <div className="text-[9px] text-gray-400 mt-1">
                            Fix: {formatLastSeen(live.lastSeen)}
                          </div>
                        )}
                      </div>
                    </InfoWindow>
                  );
                })()}
              </GoogleMap>

              {/* Floating Controls for Map Toggle */}
              <div className="absolute top-2.5 right-2.5 z-[10] flex gap-1 bg-white dark:bg-[var(--surf)] p-1 rounded-lg shadow-md border border-[var(--b)]">
                <button
                  onClick={() => setMapStyle('streets')}
                  className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                    mapStyle === 'streets'
                      ? 'bg-[var(--blue)] text-white'
                      : 'text-[var(--tx3)] hover:text-[var(--tx)] dark:text-gray-300'
                  }`}
                >
                  Map
                </button>
                <button
                  onClick={() => setMapStyle('satellite')}
                  className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                    mapStyle === 'satellite'
                      ? 'bg-[var(--blue)] text-white'
                      : 'text-[var(--tx3)] hover:text-[var(--tx)] dark:text-gray-300'
                  }`}
                >
                  Satellite
                </button>
              </div>

              {/* Mobile touch hint — fades away after first map interaction */}
              {showTouchHint && (
                <div
                  className="absolute inset-0 pointer-events-none flex items-end justify-center pb-6 sm:hidden"
                  style={{ opacity: touchHintFading ? 0 : 1, transition: 'opacity 0.4s ease' }}
                >
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-white"
                    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
                      <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/>
                      <path d="M10 10.5a2 2 0 0 0-2-2 2 2 0 0 0-2 2V18a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6V11a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
                    </svg>
                    Use one finger to pan · Pinch to zoom
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-3">
          {ROUTE_CONFIG.map((cfg) => {
            const live = liveData[cfg.busNumber];
            const active = isActive(live, cfg.id);
            return (
              <button
                key={cfg.id}
                onClick={() => setSelectedBus(selectedBus === cfg.id ? null : cfg.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] cursor-pointer transition-all border ${
                  selectedBus === cfg.id ? 'border-current font-semibold' : 'border-transparent hover:border-current'
                }`}
                style={{ color: cfg.color, background: selectedBus === cfg.id ? cfg.color + '18' : 'transparent' }}
              >
                <div className="w-3 h-1 rounded-sm" style={{ background: cfg.color }} />
                <span>Route {cfg.id}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />}
                {gpsStatus === 'live' && live?.speed != null && active && (
                  <span className="text-[9.5px] opacity-70">{live.speed} km/h</span>
                )}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
