/**
 * Sanjeevani Grid — Sovereign Federated AI Platform
 * Ultra-Futuristic Glassmorphic Cockpit inspired by Aerospace Telemetry HUD
 * Fully responsive & optimized across Mobile, Tablet, Laptop, and 4K Displays.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import {
  Activity, AlertTriangle, ArrowUpRight, CheckCircle2, ChevronRight,
  Crosshair, Eye, Globe, Layers, Navigation, Package, Pill,
  Radio, RefreshCw, Search, Send, ShieldAlert, Sparkles, TrendingUp,
  Truck, Users, X, Zap, BedDouble, Bell, Flame, Menu
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const API = '/api';

/* ── Network Helpers ─────────────────────────────────────────────── */
const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return res.json();
};

const poster = async (url, body) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return res.json();
};

const statusPalette = {
  critical: '#ef4444',
  warning: '#f59e0b',
  watch: '#38bdf8',
  ok: '#10b981',
};

const COUNTRIES = [
  { code: 'ALL', name: 'Global BRICS' },
  { code: 'IN', name: '🇮🇳 India' },
  { code: 'BR', name: '🇧🇷 Brazil' },
  { code: 'RU', name: '🇷🇺 Russia' },
  { code: 'CN', name: '🇨🇳 China' },
  { code: 'ZA', name: '🇿🇦 S. Africa' },
];

/* ── Map Camera Controller & Responsive Resizer ──────────────────── */
function MapCameraController({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    // Force Leaflet to re-calculate container dimensions across all devices & viewports
    map.invalidateSize();
    map.whenReady(() => {
      map.invalidateSize();
    });

    const handleResize = () => {
      try {
        map.invalidateSize();
      } catch {
        // ignore unmounted edge cases
      }
    };

    window.addEventListener('resize', handleResize);
    const intervals = [50, 150, 300, 600, 1000, 2000].map(ms =>
      setTimeout(handleResize, ms)
    );

    return () => {
      window.removeEventListener('resize', handleResize);
      intervals.forEach(clearTimeout);
    };
  }, [map]);

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 6, { duration: 1.4 });
    }
  }, [center, zoom, map]);

  return null;
}

/* ── Animated Circular Radar Sweep Component ─────────────────────── */
function TacticalRadarWidget({ alertCount = 14 }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 w-full">
      <div className="radar-container shrink-0">
        <div className="radar-crosshair-h" />
        <div className="radar-crosshair-v" />
        <div className="radar-ring radar-ring-1" />
        <div className="radar-ring radar-ring-2" />
        <div className="radar-ring radar-ring-3" />
        <div className="radar-sweep-beam" />
        
        {/* Blips corresponding to critical surge areas */}
        <div className="radar-blip" style={{ top: '30%', left: '60%' }} />
        <div className="radar-blip" style={{ top: '65%', left: '40%' }} />
        <div className="radar-blip" style={{ top: '45%', left: '75%', animationDelay: '0.6s' }} />
        <div className="radar-blip" style={{ top: '75%', left: '70%', animationDelay: '1.1s' }} />
      </div>

      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-cyan-300 truncate">
            Live Sweep Active
          </span>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">
          {alertCount} Hotspot Clusters
        </p>
        <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight line-clamp-2">
          100 PHC telemetry beacons monitored across BRICS.
        </p>
      </div>
    </div>
  );
}

/* ── Glassmorphic Scenario Outbreak Modal ─────────────────────────── */
function ScenarioModal({ isOpen, onClose, onApply }) {
  const [type, setType] = useState('dengue');
  const [districts, setDistricts] = useState('Pune, Delhi');
  const [multiplier, setMultiplier] = useState(3.0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    setLoading(true);
    const distList = districts.split(',').map(d => d.trim()).filter(Boolean);
    await onApply({ outbreak_type: type, districts: distList, multiplier });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
         onClick={onClose}>
      <div className="glass-panel p-5 sm:p-7 w-full max-w-lg relative border-cyan-500/30 shadow-[0_0_50px_rgba(56,189,248,0.2)] max-h-[92vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">Outbreak Stress-Test Simulator</h2>
              <p className="text-xs text-slate-400">Inject dynamic epidemiological surges into the grid</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Pathogen / Disease Profile
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'dengue', label: '🦟 Dengue Surge', desc: 'ORS & IV Fluids' },
                { id: 'cholera', label: '💧 Waterborne', desc: 'Antibiotics & Salts' },
                { id: 'flu', label: '🤧 Respiratory', desc: 'Paracetamol & O2' },
              ].map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setType(d.id)}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
                    type === d.id
                      ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <p className="text-xs font-bold">{d.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Target Epidemiological Districts
            </label>
            <input
              type="text"
              value={districts}
              onChange={e => setDistricts(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/40"
              placeholder="e.g. Pune, Delhi, São Paulo"
            />
            <p className="text-[11px] text-slate-500 mt-1">Comma-separated districts matching the PHC grid registry</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Demand Surge Multiplier
              </label>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30">
                {multiplier.toFixed(1)}× Demand
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.5"
              value={multiplier}
              onChange={e => setMultiplier(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Normal (1.0×)</span>
              <span>2.0×</span>
              <span>3.0×</span>
              <span>Severe Outbreak (4.0×)</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 sm:mt-7">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800/80 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
            {loading ? 'Simulating Dynamic Grid…' : 'Trigger Outbreak Surge'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Deep-Dive Forecast & PHC Telemetry Drawer ────────────────────── */
function PHCDetailDrawer({ phcId, onClose }) {
  const [phcData, setPhcData] = useState(null);
  const [selectedMed, setSelectedMed] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!phcId) return;
    setLoading(true);
    fetcher(`${API}/phc/${phcId}`).then(d => {
      setPhcData(d);
      if (d.stock?.length > 0) {
        setSelectedMed(d.stock[0].medicine);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [phcId]);

  useEffect(() => {
    if (!phcId || !selectedMed) return;
    fetcher(`${API}/forecast?phc_id=${phcId}&medicine=${encodeURIComponent(selectedMed)}`)
      .then(setForecastData)
      .catch(() => setForecastData(null));
  }, [phcId, selectedMed]);

  if (!phcId) return null;

  const chartSeries = forecastData ? [
    ...forecastData.history.map(h => ({ date: h.date.slice(5), actual: h.actual })),
    ...forecastData.forecast.map(f => ({
      date: f.date.slice(5),
      predicted: f.predicted,
      lower: Math.max(0, f.lower),
      upper: f.upper,
    })),
  ] : [];

  return (
    <div className="fixed inset-y-0 right-0 z-[1000] w-full sm:w-[480px] lg:w-[520px] glass-panel rounded-none sm:rounded-l-2xl border-y-0 border-r-0 border-l border-cyan-500/30 shadow-[-20px_0_60px_rgba(0,0,0,0.85)] overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
      {/* Top Header */}
      <div className="p-4 sm:p-6 border-b border-slate-700/60 sticky top-0 bg-[#070e20]/95 backdrop-blur-xl z-20 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {phcId}
            </span>
            <span className="text-xs text-slate-400">{phcData?.district} • {phcData?.country}</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-[320px]">
            {phcData?.name || 'Loading Node…'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-5 flex-1">
        {/* Quick Node Vital Cards */}
        {phcData && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                <BedDouble className="w-3.5 h-3.5 text-cyan-400" /> Bed Occupancy
              </span>
              <p className="text-base sm:text-lg font-bold text-slate-100">
                {phcData.beds_occupied} / {phcData.beds_total}
                <span className="text-xs text-cyan-400 font-normal ml-1">
                  ({Math.round((phcData.beds_occupied / Math.max(1, phcData.beds_total)) * 100)}%)
                </span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-emerald-400" /> Staff Attendance
              </span>
              <p className="text-base sm:text-lg font-bold text-slate-100">
                {phcData.staff_present} / {phcData.staff_total}
                <span className="text-xs text-emerald-400 font-normal ml-1">
                  ({Math.round((phcData.staff_present / Math.max(1, phcData.staff_total)) * 100)}%)
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Medicine Inventory Grid */}
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-cyan-400" /> Medicine Stock & Days of Cover
            </h3>
            <span className="text-[10px] text-slate-500">Tap to forecast</span>
          </div>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {phcData?.stock?.map(s => {
              const isSelected = selectedMed === s.medicine;
              return (
                <div
                  key={s.medicine}
                  onClick={() => setSelectedMed(s.medicine)}
                  className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-400/60 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {s.medicine}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {Math.round(s.stock_on_hand).toLocaleString()} units • {s.daily_consumption_avg.toFixed(1)}/day burn
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-bold border"
                      style={{
                        color: statusPalette[s.status],
                        borderColor: `${statusPalette[s.status]}40`,
                        backgroundColor: `${statusPalette[s.status]}15`,
                      }}
                    >
                      {s.days_of_cover.toFixed(1)}d cover
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 14-Day Ridge Regression Forecast Chart */}
        {selectedMed && (
          <div className="pt-1">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                14-Day Projection ({selectedMed})
              </h3>
              {forecastData?.mape && (
                <span className="text-[10px] text-cyan-300 font-mono">
                  MAPE: {forecastData.mape.toFixed(1)}%
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
              {chartSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={chartSeries}>
                    <defs>
                      <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} interval={4} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(13,22,41,0.95)',
                        border: '1px solid rgba(56,189,248,0.3)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(12px)',
                      }}
                      labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandGrad)" />
                    <Area type="monotone" dataKey="lower" stroke="none" fill="#030712" fillOpacity={1} />
                    <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={false} name="Actual" />
                    <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Predicted" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[210px] flex items-center justify-center text-slate-500 text-xs">
                  Loading ML Ridge Forecast…
                </div>
              )}
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 border-t border-slate-800 pt-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-emerald-400" /> Actual (30d)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-amber-400 border-dashed" /> Forecast (14d)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-cyan-500/20" /> ±1σ Band
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  MAIN SANJEEVANI GRID DASHBOARD
 * ════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [country, setCountry] = useState('ALL');
  const [tab, setTab] = useState('radar'); // radar | redistribution | federation
  const [overview, setOverview] = useState(null);
  const [phcs, setPhcs] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [redistribution, setRedistribution] = useState(null);
  const [federation, setFederation] = useState(null);
  const [selectedPHC, setSelectedPHC] = useState(null);
  const [focusedPHC, setFocusedPHC] = useState(null);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [approvedIds, setApprovedIds] = useState(new Set());
  const [approvedTransfers, setApprovedTransfers] = useState([]);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(null);
  const [trainingRound, setTrainingRound] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // ── Load All Data ────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const cParam = country !== 'ALL' ? `?country=${country}` : '';
      const [ov, ph, al, rd, fed] = await Promise.all([
        fetcher(`${API}/overview${cParam}`),
        fetcher(`${API}/phcs${cParam}`),
        fetcher(`${API}/alerts${cParam}`),
        fetcher(`${API}/redistribution${cParam}`),
        fetcher(`${API}/federation`),
      ]);
      setOverview(ov);
      setPhcs(ph);
      setAlerts(al);
      setRedistribution(rd);
      setFederation(fed);

      if (ph && ph.length > 0 && !focusedPHC) {
        const crit = ph.find(p => p.status === 'critical') || ph[0];
        setFocusedPHC(crit);
      }
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    }
    setLoading(false);
  }, [country, focusedPHC]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleScenario = async (scenario) => {
    await poster(`${API}/scenario`, scenario);
    await loadAll();
  };

  const handleApprove = async (transferId) => {
    const res = await poster(`${API}/redistribution/approve`, { transfer_id: transferId });
    if (res.success) {
      setApprovedIds(prev => new Set([...prev, transferId]));
      const t = redistribution?.transfers?.find(item => item.id === transferId);
      if (t) {
        setApprovedTransfers(prev => [...prev, t]);
      }
      await loadAll();
    }
  };

  const handleFederationTrain = async () => {
    setTrainingRound(true);
    await poster(`${API}/federation/train`, {});
    const fed = await fetcher(`${API}/federation`);
    setFederation(fed);
    setTrainingRound(false);
  };

  const handleFocus = (phc) => {
    setFocusedPHC(phc);
    setMapCenter([phc.lat, phc.lon]);
    setMapZoom(9);
  };

  // ── Filtered PHCs ────────────────────────────────────────────────
  const filteredPHCs = useMemo(() => {
    if (!phcs) return [];
    if (!searchQuery.trim()) return phcs;
    const q = searchQuery.toLowerCase();
    return phcs.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q)
    );
  }, [phcs, searchQuery]);

  // Stock Distribution breakdown for bottom-right widget
  const stockBreakdown = useMemo(() => {
    if (!phcs) return { critical: 15, warning: 22, watch: 38, ok: 25 };
    let c = 0, w = 0, wt = 0, ok = 0;
    phcs.forEach(p => {
      if (p.status === 'critical') c++;
      else if (p.status === 'warning') w++;
      else if (p.status === 'watch') wt++;
      else ok++;
    });
    return { critical: c, warning: w, watch: wt, ok };
  }, [phcs]);

  return (
    <div className="flex flex-col min-h-screen text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* ══════════════════════════════════════════════════════════════
          TOP FLOATING NAVIGATION BAR (Responsive on all viewports)
         ══════════════════════════════════════════════════════════════ */}
      <header className="px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
        {/* Brand Logo & Telemetry Indicator */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 p-[1.5px] shadow-[0_0_20px_rgba(56,189,248,0.35)]">
              <div className="w-full h-full bg-[#050b18] rounded-2xl flex items-center justify-center">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300 animate-pulse" />
              </div>
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#050b18] rounded-full animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-extrabold tracking-wider text-white">SANJEEVANI</h1>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                GRID
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-widest uppercase">
              Sovereign Federated AI Telemetry
            </p>
          </div>
        </div>

        {/* Center Floating Pill Navigation — Fully Responsive on Mobile & Desktop */}
        <nav className="flex items-center gap-1.5 glass-pill p-1 shadow-[0_8px_30px_rgba(0,0,0,0.5)] order-3 md:order-2 w-full md:w-auto overflow-x-auto no-scrollbar justify-center">
          <button
            onClick={() => setTab('radar')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
              tab === 'radar'
                ? 'active-nav-pill'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Grid Radar & Map
          </button>
          <button
            onClick={() => setTab('redistribution')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 whitespace-nowrap ${
              tab === 'redistribution'
                ? 'active-nav-pill'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>Redistribution Hub</span>
            {redistribution?.transfers?.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-cyan-500/30 text-[10px] text-cyan-300 font-bold">
                {redistribution.transfers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('federation')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 whitespace-nowrap ${
              tab === 'federation'
                ? 'active-nav-pill'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5 shrink-0" />
            <span>Federation Lab</span>
            <span className="hidden sm:inline-block ml-1 px-2 py-0.5 rounded-full bg-emerald-500/30 text-[10px] text-emerald-300 font-bold">
              FedAvg
            </span>
          </button>
        </nav>

        {/* Right Controls (Country Selector, Outbreak Trigger, Status) */}
        <div className="flex items-center gap-2 sm:gap-3 order-2 md:order-3">
          {/* Country Filter Pill */}
          <div className="glass-pill px-3 py-2 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer pr-1"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-slate-100">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Outbreak Simulation Button */}
          <button
            onClick={() => setScenarioOpen(true)}
            className="glass-pill px-3 sm:px-4 py-2 text-xs font-bold text-red-300 hover:text-white bg-red-600/15 hover:bg-red-600/30 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
            <span className="hidden sm:inline">Simulate Outbreak</span>
            <span className="sm:hidden">Simulate</span>
          </button>

          {/* Live Alert Bell Badge */}
          <div className="relative">
            <button
              onClick={() => setTab('radar')}
              className="glass-pill p-2 text-slate-300 hover:text-cyan-300 transition-colors"
            >
              <Bell className="w-4 h-4" />
            </button>
            {alerts && alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-500 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                {alerts.length}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          TOP TELEMETRY KPI HUD STRIP (Responsive 2x2 or 4x1)
         ══════════════════════════════════════════════════════════════ */}
      <div className="px-3 sm:px-6 pb-3 sm:pb-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
        {[
          {
            title: 'Critical Stock-Out Risk',
            value: overview?.stockout_risk_count ?? '15',
            unit: 'PHCs at risk',
            color: '#ef4444',
            icon: ShieldAlert,
          },
          {
            title: 'Average Supply Cover',
            value: overview?.avg_days_of_cover ? overview.avg_days_of_cover.toFixed(1) : '163.9',
            unit: 'Days Cover',
            color: '#10b981',
            icon: Package,
          },
          {
            title: 'Hospital Bed Occupancy',
            value: overview?.bed_occupancy_pct ? `${overview.bed_occupancy_pct.toFixed(1)}%` : '40.2%',
            unit: 'Capacity',
            color: '#38bdf8',
            icon: BedDouble,
          },
          {
            title: 'Staff Duty Attendance',
            value: overview?.staff_attendance_pct ? `${overview.staff_attendance_pct.toFixed(1)}%` : '76.1%',
            unit: 'Readiness',
            color: '#f59e0b',
            icon: Users,
          },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="glass-panel p-4 flex items-center justify-between gap-3 overflow-hidden">
              <div className="min-w-0 pr-1 flex-1">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block truncate">
                  {kpi.title}
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: kpi.color }}>
                    {kpi.value}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">{kpi.unit}</span>
                </div>
              </div>
              <div
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border shrink-0"
                style={{
                  backgroundColor: `${kpi.color}15`,
                  borderColor: `${kpi.color}35`,
                  color: kpi.color,
                }}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MAIN VIEW CONTAINER (Responsive Stacking on Mobile/Tablet)
         ══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 px-3 sm:px-6 pb-4 sm:pb-6 overflow-hidden flex flex-col">
        {/* ── TAB 1: GRID RADAR & MAP (Matching Reference Image 2) ── */}
        {tab === 'radar' && (
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto lg:overflow-hidden">
            {/* Top Multi-Column Cockpit Strip */}
            <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
              
              {/* LEFT COLUMN: AI Insights & Critical Predictions */}
              <div className="order-2 xl:order-1 col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h3 className="text-xs font-black tracking-widest text-cyan-400 uppercase">
                      IA Insights
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">Predictive Early Warning</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    LIVE
                  </span>
                </div>

                {/* Card 1: Critical Surge Prediction */}
                {alerts && alerts[0] ? (
                  <div
                    onClick={() => handleFocus(phcs?.find(p => p.id === alerts[0].phc_id) || alerts[0])}
                    className="glass-panel p-4 cursor-pointer hover:border-red-500/50 group relative"
                  >
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 shrink-0">
                        Surge Alert
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPHC(alerts[0].phc_id);
                        }}
                        className="text-slate-400 group-hover:text-cyan-300 transition-colors p-1"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 my-2">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                        <Pill className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-white truncate">{alerts[0].phc_name}</p>
                        <p className="text-xs text-red-400 font-mono font-bold">
                          {alerts[0].days_of_cover.toFixed(1)} Days Cover
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 overflow-hidden">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{alerts[0].reason}</span>
                    </div>
                  </div>
                ) : null}

                {/* Card 2: Stock Exhaustion Horizon */}
                {alerts && alerts[1] ? (
                  <div
                    onClick={() => handleFocus(phcs?.find(p => p.id === alerts[1].phc_id) || alerts[1])}
                    className="glass-panel p-4 cursor-pointer hover:border-amber-500/50 group relative"
                  >
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                        About to Expire
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPHC(alerts[1].phc_id);
                        }}
                        className="text-slate-400 group-hover:text-cyan-300 transition-colors p-1"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 my-2">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-blue-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-white truncate">{alerts[1].phc_name}</p>
                        <p className="text-xs text-amber-300 font-mono font-bold">
                          {alerts[1].medicine} • {alerts[1].days_of_cover.toFixed(1)}d
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 overflow-hidden">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{alerts[1].reason}</span>
                    </div>
                  </div>
                ) : null}

                {/* Card 3: AI Transfer Recommendation */}
                {redistribution?.transfers?.[0] ? (
                  <div className="glass-panel p-4 border-cyan-500/30 relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                        Recommendation
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {redistribution.transfers[0].distance_km} km
                      </span>
                    </div>

                    <div className="my-2">
                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {redistribution.transfers[0].medicine} Dispatch
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {redistribution.transfers[0].from_phc_name} → {redistribution.transfers[0].to_phc_name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800 flex-wrap">
                      <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                        +{Math.round(redistribution.transfers[0].quantity)} units
                      </span>
                      <button
                        onClick={() => handleApprove(redistribution.transfers[0].id)}
                        disabled={approvedIds.has(redistribution.transfers[0].id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                          approvedIds.has(redistribution.transfers[0].id)
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                        }`}
                      >
                        {approvedIds.has(redistribution.transfers[0].id) ? '✓ Dispatched' : 'Approve Transfer'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* CENTER COLUMN: Master Map Canvas */}
              <div 
                className="order-1 lg:order-2 col-span-12 lg:col-span-8 xl:col-span-6 flex flex-col relative rounded-2xl overflow-hidden glass-panel border-cyan-500/20 !p-0"
                style={{ height: '540px', minHeight: '420px' }}
              >
                {/* Tactical Dark Matter Basemap */}
                <div className="w-full h-full relative" style={{ height: '100%', minHeight: '420px', width: '100%' }}>
                  <MapContainer
                    center={[20, 30]}
                    zoom={2}
                    zoomControl={false}
                    style={{ height: '100%', minHeight: '420px', width: '100%', background: '#050b18' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
                      subdomains="abcd"
                      maxZoom={19}
                    />
                    <MapCameraController center={mapCenter} zoom={mapZoom} />

                    {/* Approved Transfer Polyline Routes with Dash Particle Animation */}
                    {approvedTransfers.map((t, idx) => (
                      <Polyline
                        key={`poly-${idx}`}
                        positions={[[t.from_lat, t.from_lon], [t.to_lat, t.to_lon]]}
                        color="#10b981"
                        weight={3}
                        opacity={0.85}
                        className="transfer-line"
                      />
                    ))}

                    {/* 100 PHC Markers */}
                    {filteredPHCs.map(p => {
                      const isFocused = focusedPHC?.id === p.id;
                      const markerColor = statusPalette[p.status];
                      return (
                        <CircleMarker
                          key={p.id}
                          center={[p.lat, p.lon]}
                          radius={isFocused ? 11 : 6}
                          fillColor={markerColor}
                          color={isFocused ? '#ffffff' : markerColor}
                          weight={isFocused ? 3 : 1.5}
                          opacity={0.9}
                          fillOpacity={0.8}
                          eventHandlers={{
                            click: () => {
                              handleFocus(p);
                              setSelectedPHC(p.id);
                            },
                          }}
                        >
                          <Popup>
                            <div className="p-1 space-y-1 text-xs">
                              <p className="font-bold text-sm text-cyan-300">{p.name}</p>
                              <p className="text-slate-400">{p.district} • {p.country}</p>
                              <div className="flex items-center gap-2 pt-1 border-t border-slate-700">
                                <span className="font-bold capitalize" style={{ color: markerColor }}>
                                  ● {p.status}
                                </span>
                                <span>{p.worst_days_of_cover.toFixed(1)} Days Cover</span>
                              </div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>

                  {/* Floating AI Query Bar over Map with clean clearance above attribution */}
                  <div className="absolute bottom-6 sm:bottom-5 inset-x-3 sm:inset-x-8 z-[450] flex justify-center pointer-events-none">
                    <div className="glass-pill px-3.5 sm:px-4 py-2 sm:py-2.5 w-full max-w-md flex items-center gap-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.85)] border-cyan-500/30 pointer-events-auto">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search PHC, district, medicine, or ask AI..."
                        className="bg-transparent text-xs text-slate-200 outline-none w-full placeholder:text-slate-500"
                      />
                      {searchQuery ? (
                        <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (filteredPHCs.length > 0) handleFocus(filteredPHCs[0]);
                          }}
                          className="px-2.5 py-1 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px] tracking-wide shrink-0 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                        >
                          Explore
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Node Inspector & Sweep Radar (3 cols on desktop) */}
              <div className="order-2 lg:order-3 col-span-12 lg:col-span-3 flex flex-col gap-3.5 pr-0 lg:pr-1">
                
                {/* Node Inspector Card (matching "Code SAT-123" card in Image 2) */}
                <div className="glass-panel p-4 sm:p-5 border-cyan-500/30 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400">
                        Telemetric Node
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                        {focusedPHC?.id || 'IN-PUN-001'}
                      </h3>
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">
                        {focusedPHC?.name || 'Pune Central PHC'}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedPHC(focusedPHC?.id || 'IN-PUN-001')}
                      className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-cyan-300 transition-colors shrink-0"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 2x2 Telemetry Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 my-3.5 pt-3 border-t border-slate-800">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Supply Runway
                      </span>
                      <p className="text-base sm:text-lg font-black text-amber-400 font-mono">
                        {focusedPHC?.worst_days_of_cover ? `${focusedPHC.worst_days_of_cover.toFixed(1)}d` : '3.2d'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Bed Utilization
                      </span>
                      <p className="text-base sm:text-lg font-black text-cyan-400 font-mono">
                        {focusedPHC?.beds_total ? `${Math.round((focusedPHC.beds_occupied / focusedPHC.beds_total) * 100)}%` : '85%'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Clinical Staff
                      </span>
                      <p className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                        {focusedPHC?.staff_total ? `${focusedPHC.staff_present}/${focusedPHC.staff_total}` : '10/12'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Alert Status
                      </span>
                      <p className="text-xs sm:text-sm font-black capitalize flex items-center gap-1.5 mt-0.5"
                         style={{ color: statusPalette[focusedPHC?.status || 'critical'] }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusPalette[focusedPHC?.status || 'critical'] }} />
                        <span className="truncate">{focusedPHC?.status || 'Critical'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Mission / District Label */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div className="min-w-0 pr-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">Mission Cluster</span>
                      <p className="text-xs font-bold text-slate-200 truncate">{focusedPHC?.district || 'Pune District'}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPHC(focusedPHC?.id || 'IN-PUN-001')}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition-all flex items-center gap-1 shrink-0"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Radar Sweep Widget Card (matching Image 2 bottom-right) */}
                <div className="glass-panel p-4 flex items-center">
                  <TacticalRadarWidget alertCount={alerts?.length || 15} />
                </div>
              </div>
            </div>

            {/* Bottom 2-Card Row (Matching Reference Image 2 bottom row) */}
            <div className="order-4 grid grid-cols-12 gap-4 shrink-0">
              
              {/* Bottom Left: Active Supply Transfers (matching "Upcoming Launches" in Image 2) */}
              <div className="col-span-12 lg:col-span-7 glass-panel p-3.5 sm:p-4 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Active Redistribution Logistics
                    </h3>
                  </div>
                  <button
                    onClick={() => setTab('redistribution')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                  >
                    <span>View All</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex overflow-x-auto sm:grid sm:grid-cols-3 gap-3 pb-1 no-scrollbar">
                  {redistribution?.transfers?.slice(0, 3).map((t, idx) => {
                    const isApproved = approvedIds.has(t.id) || t.approved;
                    return (
                      <div
                        key={t.id}
                        className={`min-w-[190px] sm:min-w-0 p-3 rounded-xl border flex flex-col justify-between transition-all shrink-0 sm:shrink ${
                          isApproved
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              Order #{100 + idx}
                            </span>
                            <span className="text-[10px] text-cyan-400 font-bold">{t.distance_km} km</span>
                          </div>
                          <p className="text-xs font-bold text-white truncate mt-1">{t.medicine}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {t.from_phc_name.split(' ')[0]} → {t.to_phc_name.split(' ')[0]}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/60 gap-1.5">
                          <span className="text-[11px] font-mono font-bold text-slate-200 truncate">
                            {Math.round(t.quantity)} Units
                          </span>
                          <button
                            onClick={() => handleApprove(t.id)}
                            disabled={isApproved}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold shrink-0 ${
                              isApproved
                                ? 'text-emerald-400'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                            }`}
                          >
                            {isApproved ? '✓ Dispatched' : 'Approve'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Right: Medicine Stock by Criticality (matching "Satellites by End-Use Category" in Image 2) */}
              <div className="col-span-12 lg:col-span-5 glass-panel p-3.5 sm:p-4 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Grid Readiness by Cover Tier
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">100 Primary Facilities</span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: 'Critical Stockout (<5 Days)', count: stockBreakdown.critical, color: 'from-red-500 to-amber-500', pct: (stockBreakdown.critical / 100) * 100 },
                    { label: 'Warning Buffer (5–10 Days)', count: stockBreakdown.warning, color: 'from-amber-500 to-yellow-400', pct: (stockBreakdown.warning / 100) * 100 },
                    { label: 'Tactical Watch (10–20 Days)', count: stockBreakdown.watch, color: 'from-cyan-500 to-blue-500', pct: (stockBreakdown.watch / 100) * 100 },
                    { label: 'Stable Horizon (≥20 Days)', count: stockBreakdown.ok, color: 'from-emerald-500 to-teal-400', pct: (stockBreakdown.ok / 100) * 100 },
                  ].map((row, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-300 text-[11px] truncate">{row.label}</span>
                        <span className="text-slate-200 font-mono font-bold text-[11px] shrink-0 ml-2">{row.count} PHCs</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${row.color}`}
                          style={{ width: `${Math.max(5, row.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── TAB 2: REDISTRIBUTION HUB ── */}
        {tab === 'redistribution' && (
          <div className="flex-1 glass-panel p-4 sm:p-6 flex flex-col gap-5 overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-cyan-400" />
                  Automated Cross-District Supply Redistribution Hub
                </h2>
                <p className="text-xs text-slate-400">
                  Algorithmic surplus-to-deficit routing with distance penalty optimization
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 w-fit">
                {redistribution?.transfers?.length || 0} Recommended Transfer Orders
              </span>
            </div>

            {/* Transfers Table with Horizontal Scroll Support */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recommended Internal Transfers
              </h3>
              <div className="rounded-xl border border-slate-800 overflow-x-auto bg-slate-950/60">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Medicine</th>
                      <th className="p-3">Donor Facility (Surplus)</th>
                      <th className="p-3">Recipient Facility (Deficit)</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Transit Distance</th>
                      <th className="p-3">Runway Gain</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {redistribution?.transfers?.map(t => {
                      const isApproved = approvedIds.has(t.id) || t.approved;
                      return (
                        <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 font-mono font-bold text-cyan-300">#{t.id}</td>
                          <td className="p-3 font-bold text-white">{t.medicine}</td>
                          <td className="p-3 text-slate-300">{t.from_phc_name}</td>
                          <td className="p-3 text-slate-300 font-semibold">{t.to_phc_name}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">{Math.round(t.quantity)} Units</td>
                          <td className="p-3 text-slate-400">{t.distance_km} km {t.cross_district ? '• Cross-District' : ''}</td>
                          <td className="p-3 font-mono text-cyan-300 font-bold">+{t.days_of_cover_gained.toFixed(1)} Days</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleApprove(t.id)}
                              disabled={isApproved}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                isApproved
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                              }`}
                            >
                              {isApproved ? '✓ Dispatched' : 'Approve Order'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* International Mutual Aid Quotas */}
            {redistribution?.international_aid?.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Transnational BRICS Mutual Aid Allocations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {redistribution.international_aid.map((aid, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex justify-between items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                            {aid.requesting_country}
                          </span>
                          <span className="text-xs text-slate-300">Deficit Declaration</span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white">
                          Requires {Math.round(aid.deficit_units)} Units of {aid.medicine}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Designated Donors: <span className="text-emerald-400 font-semibold">{aid.potential_donors.join(', ')}</span>
                        </p>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-[0_0_12px_rgba(245,158,11,0.4)] shrink-0">
                        Coordinate Aid
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: FEDERATION LAB ── */}
        {tab === 'federation' && (
          <div className="flex-1 glass-panel p-4 sm:p-6 flex flex-col gap-5 overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-emerald-400" />
                  Sovereign Federated Learning Consensus Lab (FedAvg)
                </h2>
                <p className="text-xs text-slate-400">
                  Shared epidemiological modeling without transmitting patient records or hospital logs
                </p>
              </div>

              <button
                onClick={handleFederationTrain}
                disabled={trainingRound}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 disabled:opacity-50 w-fit"
              >
                <RefreshCw className={`w-4 h-4 ${trainingRound ? 'animate-spin' : ''}`} />
                {trainingRound ? 'Executing Consensus Round…' : 'Trigger Federated Round'}
              </button>
            </div>

            {/* Privacy Guarantee Banner */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                  Mathematical Sovereignty Guarantee
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {federation?.privacy_note || 'Raw patient and stock records never cross national boundaries. Only low-dimensional Ridge weight vectors (w) and sample counts (n) are federated.'}
                </p>
              </div>
            </div>

            {/* Comparison Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* Chart 1: Bar Chart Local vs Federated MAPE */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 sm:mb-4">
                  Local-Only vs Federated Model Error Rate (MAPE %)
                </h4>
                <div className="h-[200px] sm:h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(federation?.per_country || []).map(c => ({
                        country: c.country,
                        'Local Only': c.local_mape,
                        'Federated Model': c.federated_mape,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="country" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(13,22,41,0.95)',
                          border: '1px solid rgba(56,189,248,0.3)',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Local Only" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Federated Model" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Convergence over Rounds */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 sm:mb-4">
                  Round-by-Round Convergence Tracking
                </h4>
                <div className="h-[200px] sm:h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={(federation?.round_history || []).map(r => ({
                        round: `R${r.round}`,
                        ...r.per_country,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="round" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(13,22,41,0.95)',
                          border: '1px solid rgba(56,189,248,0.3)',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="IN" stroke="#f97316" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="BR" stroke="#22c55e" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="RU" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="CN" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ZA" stroke="#a855f7" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Performance Summary Table with Horizontal Scroll */}
            <div className="rounded-xl border border-slate-800 overflow-x-auto bg-slate-950/60">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Country / Cluster</th>
                    <th className="p-3 text-right">Sample Observations</th>
                    <th className="p-3 text-right">Local Model MAPE</th>
                    <th className="p-3 text-right">Federated Consensus MAPE</th>
                    <th className="p-3 text-right">Accuracy Improvement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {federation?.per_country?.map(c => {
                    const isZA = c.country === 'ZA';
                    return (
                      <tr key={c.country} className={isZA ? 'bg-cyan-500/10 font-bold' : ''}>
                        <td className="p-3 text-slate-200">
                          {c.country} {isZA ? '🇿🇦 (Sparse Cold-Start Pilot)' : ''}
                        </td>
                        <td className="p-3 text-right text-slate-400">{c.sample_count.toLocaleString()}</td>
                        <td className="p-3 text-right text-red-400">{c.local_mape.toFixed(1)}%</td>
                        <td className="p-3 text-right text-emerald-400">{c.federated_mape.toFixed(1)}%</td>
                        <td className="p-3 text-right text-cyan-300">
                          {c.improvement_pct > 0 ? `+${c.improvement_pct.toFixed(1)}%` : 'Consensus'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── Slide-Out PHC Detail & Forecast Drawer ── */}
      <PHCDetailDrawer phcId={selectedPHC} onClose={() => setSelectedPHC(null)} />

      {/* ── Outbreak Simulator Modal ── */}
      <ScenarioModal isOpen={scenarioOpen} onClose={() => setScenarioOpen(false)} onApply={handleScenario} />
    </div>
  );
}
