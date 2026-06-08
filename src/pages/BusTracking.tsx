import { useState, useEffect } from 'react';
import { Bus, MapPin, Satellite, Clock, Navigation, Phone } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ui';

const buses = [
  { id: 1, route: 'Route 1 — Nizamabad Central', next: 'Railway Colony', eta: 7, students: 24, pct: 68, active: true, driver: 'Ramesh K', phone: '98765 43210' },
  { id: 2, route: 'Route 2 — Gandhi Nagar', next: 'Gandhi Nagar Stop', eta: 12, students: 31, pct: 44, active: true, driver: 'Suresh M', phone: '99887 65432' },
  { id: 3, route: 'Route 3 — Old Town', next: 'Market Circle', eta: 3, students: 19, pct: 91, active: true, driver: 'Venkat R', phone: '97654 32109' },
  { id: 4, route: 'Route 4 — Yellareddyguda', next: 'Parked at school · No trip scheduled', eta: null, students: 0, pct: 0, active: false, driver: 'Prakash B', phone: '96543 21098' },
];

const stops = [
  { name: 'Railway Colony', info: 'Alert sent · 7:48 AM · 8 parents', status: 'done' as const },
  { name: 'Bus Stand', info: 'Alert sent · 7:55 AM · 11 parents', status: 'done' as const },
  { name: 'Gandhi Nagar Stop', info: 'ETA 12 min · 9 parents waiting', status: 'upcoming' as const },
  { name: 'Market Circle', info: 'Not yet reached · 7 parents', status: 'waiting' as const },
];

interface BusMapPosition {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
}

const BUS_MAP_POSITIONS: Record<number, BusMapPosition> = {
  1: { x: 35, y: 48, labelX: 40, labelY: 43 },
  2: { x: 62, y: 38, labelX: 67, labelY: 33 },
  3: { x: 50, y: 68, labelX: 55, labelY: 63 },
  4: { x: 50, y: 50, labelX: 55, labelY: 45 },
};

const ROUTE_PATHS: { id: number; path: string; color: string; stops: { x: number; y: number; name: string }[] }[] = [
  {
    id: 1,
    color: '#185FA5',
    path: 'M 10,72 C 15,65 22,60 30,55 C 38,50 42,48 50,50',
    stops: [
      { x: 10, y: 72, name: 'Nizamabad Jn' },
      { x: 22, y: 60, name: 'Railway Colony' },
      { x: 35, y: 52, name: 'Bus Stand' },
      { x: 50, y: 50, name: 'School' },
    ],
  },
  {
    id: 2,
    color: '#0A6E5F',
    path: 'M 80,20 C 75,25 70,30 65,35 C 60,40 55,44 50,50',
    stops: [
      { x: 80, y: 20, name: 'Gandhi Nagar' },
      { x: 70, y: 30, name: 'Gandhi Nagar Stop' },
      { x: 58, y: 42, name: 'Collector Office' },
      { x: 50, y: 50, name: 'School' },
    ],
  },
  {
    id: 3,
    color: '#B45309',
    path: 'M 20,88 C 28,82 36,76 42,70 C 46,65 48,58 50,50',
    stops: [
      { x: 20, y: 88, name: 'Old Town' },
      { x: 36, y: 76, name: 'Market Circle' },
      { x: 45, y: 62, name: 'Clock Tower' },
      { x: 50, y: 50, name: 'School' },
    ],
  },
  {
    id: 4,
    color: '#6B7280',
    path: 'M 82,75 C 76,70 68,62 60,56 C 55,53 52,51 50,50',
    stops: [
      { x: 82, y: 75, name: 'Yellareddyguda' },
      { x: 68, y: 62, name: 'LB Nagar' },
      { x: 55, y: 53, name: 'Padmavathi Colony' },
      { x: 50, y: 50, name: 'School' },
    ],
  },
];

export function BusTracking() {
  const [selectedBus, setSelectedBus] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  // Simulate live bus movement
  const [livePcts, setLivePcts] = useState<Record<number, number>>(() => {
    const m: Record<number, number> = {};
    buses.forEach((b) => { m[b.id] = b.pct; });
    return m;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLivePcts((prev) => {
        const next = { ...prev };
        buses.forEach((b) => {
          if (b.active && next[b.id] < 100) {
            next[b.id] = Math.min(100, next[b.id] + Math.random() * 0.5);
          }
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Active Buses" value="3" sub="GPS live tracking" icon={<Bus size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Alerts Sent Today" value="142" sub="Pickup + WhatsApp" icon={<MapPin size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="GPS Accuracy" value={<>98<span className="text-[13px] font-normal text-[var(--tx3)]">%</span></>} sub="All devices online" icon={<Satellite size={15} />} iconBg="var(--green-bg)" iconColor="var(--green-tx)" />
        <KPICard label="Avg Pickup Delay" value={<>2.4<span className="text-[13px] font-normal text-[var(--tx3)]">min</span></>} sub="Within acceptable range" icon={<Clock size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
      </div>

      {/* Live Bus Status */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-2.5 mb-3">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12.5px] font-semibold text-[var(--tx)] flex items-center gap-1.5">
              <Bus size={14} className="text-[var(--tx3)]" /> Live Bus Status
            </div>
            <Badge variant="teal">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] inline-block mr-0.5 animate-pulse" />
              Live GPS
            </Badge>
          </div>

          <div className="space-y-2">
            {buses.map((bus) => (
              <button
                key={bus.id}
                onClick={() => setSelectedBus(selectedBus === bus.id ? null : bus.id)}
                className={`w-full text-left flex items-center gap-2.5 p-2.5 bg-[var(--surf2)] border rounded-xl cursor-pointer transition-all ${
                  selectedBus === bus.id ? 'border-[var(--blue)] ring-1 ring-[var(--blue)]/30' : 'border-[var(--b)] hover:border-[var(--blue)]'
                } ${!bus.active ? 'opacity-60' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bus.active ? 'bg-[var(--teal-bg)] text-[var(--teal-tx)]' : 'bg-[var(--surf3)] text-[var(--tx3)]'}`}>
                  <Bus size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[12px] font-semibold text-[var(--tx)]">{bus.route}</span>
                    {bus.active && <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] flex-shrink-0" />}
                  </div>
                  <div className="text-[11px] text-[var(--tx3)] mb-1.5">
                    {bus.active ? `Next: ${bus.next} · ETA ${bus.eta} min · ${bus.students} students` : bus.next}
                  </div>
                  {bus.active && <ProgressBar value={Math.round(livePcts[bus.id] ?? bus.pct)} color="var(--teal)" height={4} />}
                </div>
                {bus.active ? <Badge variant="teal">On route</Badge> : <Badge variant="gray">Idle</Badge>}
              </button>
            ))}
          </div>
        </Card>

        {/* Side Panel: Route Detail or Stop Alerts */}
        <div className="space-y-2.5">
          {selectedBus ? (() => {
            const bus = buses.find((b) => b.id === selectedBus);
            if (!bus) return null;
            const route = ROUTE_PATHS.find((r) => r.id === selectedBus);
            return (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[12.5px] font-semibold text-[var(--tx)]">Route {bus.id} Details</div>
                  <button onClick={() => setSelectedBus(null)} className="text-[11px] text-[var(--tx3)] hover:text-[var(--tx)] cursor-pointer">Clear</button>
                </div>
                <div className="p-3 rounded-xl border border-[var(--b)] bg-[var(--surf2)] mb-3">
                  <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-1">{bus.route}</div>
                  <div className="text-[11px] text-[var(--tx3)] mb-2">{bus.active ? `Next: ${bus.next} · ETA ${bus.eta} min · ${bus.students} students` : bus.next}</div>
                  {bus.active && <ProgressBar value={Math.round(livePcts[bus.id] ?? bus.pct)} color={route?.color ?? 'var(--teal)'} height={5} />}
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-[var(--blue-bg)] rounded-xl mb-3">
                  <div className="w-7 h-7 rounded-lg bg-[var(--blue)] flex items-center justify-center flex-shrink-0">
                    <Bus size={14} className="text-white" />
                  </div>
                  <div>
                    <div className="text-[11.5px] font-semibold text-[var(--blue-tx)]">{bus.driver}</div>
                    <div className="text-[10.5px] text-[var(--blue-tx)] opacity-70">Driver</div>
                  </div>
                  <a href={`tel:${bus.phone}`} className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-[var(--blue)] text-white rounded-lg text-[11px] cursor-pointer hover:opacity-90">
                    <Phone size={10} /> Call
                  </a>
                </div>
                <div className="text-[11.5px] font-semibold text-[var(--tx)] mb-2">Stop Progress</div>
                <div className="space-y-1">
                  {(route?.stops ?? []).map((stop, i) => {
                    const stopProgress = (i / ((route?.stops.length ?? 1) - 1)) * 100;
                    const currentPct = livePcts[bus.id] ?? bus.pct;
                    const passed = stopProgress <= currentPct;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${passed ? 'bg-[var(--teal-bg)]' : 'bg-[var(--surf3)]'}`}>
                          {i === route!.stops.length - 1 ? (
                            <div className="w-2 h-2 rounded-sm bg-[var(--blue)]" />
                          ) : (
                            <div className={`w-1.5 h-1.5 rounded-full ${passed ? 'bg-[var(--teal)]' : 'bg-[var(--tx3)]'}`} />
                          )}
                        </div>
                        <span className={`text-[11px] ${passed ? 'text-[var(--tx)]' : 'text-[var(--tx3)]'}`}>{stop.name}</span>
                        {passed && i < route!.stops.length - 1 && <span className="ml-auto text-[10px] text-[var(--teal-tx)]">Done</span>}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })() : (
            <Card>
              <CardHeader title="Stop-wise Alerts" icon={<MapPin size={14} />} />
              <div className="space-y-0">
                {stops.map((stop, i) => (
                  <div key={i} className={`flex items-center gap-2.5 py-2 ${i < stops.length - 1 ? 'border-b border-[var(--b)]' : ''}`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${stop.status === 'done' ? 'bg-[var(--teal-bg)] text-[var(--teal-tx)]' : stop.status === 'upcoming' ? 'bg-[var(--amber-bg)] text-[var(--amber-tx)]' : 'bg-[var(--surf2)] text-[var(--tx3)]'}`}>
                      {stop.status === 'done' ? (
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      ) : stop.status === 'upcoming' ? (
                        <Clock size={11} />
                      ) : (
                        <MapPin size={11} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-[var(--tx)]">{stop.name}</div>
                      <div className="text-[10.5px] text-[var(--tx3)]">{stop.info}</div>
                    </div>
                    {stop.status === 'done' && <Badge variant="teal">Done</Badge>}
                    {stop.status === 'upcoming' && <Badge variant="amber">Upcoming</Badge>}
                    {stop.status === 'waiting' && <Badge variant="gray">Waiting</Badge>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Live Map View - Below status */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--tx)]">
            <Navigation size={14} className="text-[var(--tx3)]" /> Live Map View
          </div>
          <Badge variant="teal">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] inline-block mr-0.5 animate-pulse" />
            GPS Live
          </Badge>
        </div>

        {/* SVG Map */}
        <div className="relative bg-[var(--surf2)] rounded-xl overflow-hidden border border-[var(--b)]" style={{ aspectRatio: '16/10' }}>
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Background */}
            <rect width="100" height="100" fill="var(--surf2)" />

            {/* Background road network */}
            <g opacity="0.15">
              <line x1="0" y1="50" x2="100" y2="50" stroke="var(--tx3)" strokeWidth="0.5" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="var(--tx3)" strokeWidth="0.5" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="var(--tx3)" strokeWidth="0.5" />
              <line x1="25" y1="0" x2="25" y2="100" stroke="var(--tx3)" strokeWidth="0.5" />
              <line x1="75" y1="0" x2="75" y2="100" stroke="var(--tx3)" strokeWidth="0.5" />
            </g>

            {/* Area labels */}
            <text x="8" y="76" fontSize="2.2" fill="var(--tx3)" opacity="0.7" fontFamily="system-ui">Nizamabad</text>
            <text x="8" y="79" fontSize="2.2" fill="var(--tx3)" opacity="0.7" fontFamily="system-ui">Central</text>
            <text x="72" y="18" fontSize="2.2" fill="var(--tx3)" opacity="0.7" fontFamily="system-ui">Gandhi Nagar</text>
            <text x="14" y="92" fontSize="2.2" fill="var(--tx3)" opacity="0.7" fontFamily="system-ui">Old Town</text>
            <text x="74" y="78" fontSize="2.2" fill="var(--tx3)" opacity="0.7" fontFamily="system-ui">Yellareddyguda</text>

            {/* Route paths */}
            {ROUTE_PATHS.map((route) => (
              <g key={route.id}>
                <path
                  d={route.path}
                  fill="none"
                  stroke={route.color}
                  strokeWidth={selectedBus === route.id ? '1.5' : '0.8'}
                  strokeDasharray={route.id === 4 ? '1.5 1' : undefined}
                  opacity={selectedBus !== null && selectedBus !== route.id ? 0.25 : 0.85}
                  strokeLinecap="round"
                />
                {/* Route stops */}
                {route.stops.slice(0, -1).map((stop, si) => (
                  <circle
                    key={si}
                    cx={stop.x}
                    cy={stop.y}
                    r="0.8"
                    fill={route.color}
                    opacity={selectedBus !== null && selectedBus !== route.id ? 0.25 : 0.8}
                    className="cursor-pointer"
                    onMouseEnter={() => setShowTooltip({ x: stop.x, y: stop.y - 3, text: stop.name })}
                    onMouseLeave={() => setShowTooltip(null)}
                  />
                ))}
              </g>
            ))}

            {/* School marker */}
            <g>
              <circle cx="50" cy="50" r="2.5" fill="var(--blue)" opacity="0.9" />
              <text x="52.5" y="49" fontSize="2" fill="var(--blue-tx)" fontWeight="bold" fontFamily="system-ui">School</text>
            </g>

            {/* Bus icons */}
            {buses.map((bus) => {
              const pos = BUS_MAP_POSITIONS[bus.id];
              if (!pos) return null;
              const progress = (livePcts[bus.id] ?? bus.pct) / 100;
              const routePath = ROUTE_PATHS.find((r) => r.id === bus.id);
              const color = routePath?.color ?? '#6B7280';
              const isSelected = selectedBus === bus.id;

              const busX = bus.active
                ? pos.x + (50 - pos.x) * progress
                : 50;
              const busY = bus.active
                ? pos.y + (50 - pos.y) * progress
                : 50;

              return (
                <g
                  key={bus.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedBus(isSelected ? null : bus.id)}
                  opacity={selectedBus !== null && !isSelected ? 0.35 : 1}
                >
                  {/* Pulse ring for active buses */}
                  {bus.active && (
                    <circle cx={busX} cy={busY} r={isSelected ? '3.5' : '2.5'} fill={color} opacity="0.15">
                      <animate attributeName="r" values={isSelected ? '3.5;5;3.5' : '2.5;4;2.5'} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.15;0;0.15" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Bus circle */}
                  <circle
                    cx={busX}
                    cy={busY}
                    r={isSelected ? '2.8' : '2'}
                    fill={color}
                    stroke="white"
                    strokeWidth="0.5"
                  />
                  <text
                    x={busX}
                    y={busY + 0.7}
                    fontSize="1.8"
                    fill="white"
                    textAnchor="middle"
                    fontWeight="bold"
                    fontFamily="system-ui"
                  >
                    {bus.id}
                  </text>
                  {/* Label */}
                  {isSelected && (
                    <g>
                      <rect
                        x={busX - 8}
                        y={busY - 6}
                        width="16"
                        height="3.5"
                        rx="0.8"
                        fill={color}
                        opacity="0.9"
                      />
                      <text
                        x={busX}
                        y={busY - 3.5}
                        fontSize="1.6"
                        fill="white"
                        textAnchor="middle"
                        fontFamily="system-ui"
                      >
                        R{bus.id} · ETA {bus.eta ? `${bus.eta}m` : 'Idle'}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Tooltip */}
            {showTooltip && (
              <g>
                <rect x={showTooltip.x - 8} y={showTooltip.y - 3} width="16" height="3.5" rx="0.8" fill="var(--surf)" stroke="var(--b)" strokeWidth="0.3" />
                <text x={showTooltip.x} y={showTooltip.y - 0.5} fontSize="1.6" fill="var(--tx)" textAnchor="middle" fontFamily="system-ui">{showTooltip.text}</text>
              </g>
            )}
          </svg>
        </div>

        {/* Map legend */}
        <div className="mt-3 flex flex-wrap gap-3">
          {ROUTE_PATHS.map((route) => {
            const bus = buses.find((b) => b.id === route.id);
            return (
              <button
                key={route.id}
                onClick={() => setSelectedBus(selectedBus === route.id ? null : route.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] cursor-pointer transition-all border ${
                  selectedBus === route.id ? 'border-current font-semibold' : 'border-transparent hover:border-current'
                }`}
                style={{ color: route.color, background: selectedBus === route.id ? route.color + '18' : 'transparent' }}
              >
                <div className="w-3 h-1 rounded-sm" style={{ background: route.color }} />
                <span>Route {route.id}</span>
                {bus?.active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: route.color }} />}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
