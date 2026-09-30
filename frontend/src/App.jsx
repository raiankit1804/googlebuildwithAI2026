/**
 * Sanjeevani Grid — Main Application
 * Federated AI platform for national-scale health resource management
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const API = '/api';

/* ── Helpers ─────────────────────────────────────────────────────── */
const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
};

const poster = async (url, body) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
};

const statusColor = {
  critical: '#ef4444',
  warning: '#f59e0b',
  watch: '#3b82f6',
  ok: '#22c55e',
};

const severityBadge = {
  critical: 'bg-red-600/20 text-red-400 border-red-500/30',
  warning: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
  watch: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
};

const COUNTRIES = [
  { code: 'ALL', name: 'All BRICS' },
  { code: 'IN', name: '🇮🇳 India' },
  { code: 'BR', name: '🇧🇷 Brazil' },
  { code: 'RU', name: '🇷🇺 Russia' },
  { code: 'CN', name: '🇨🇳 China' },
  { code: 'ZA', name: '🇿🇦 South Africa' },
];

/* ── Skeleton loader ─────────────────────────────────────────────── */
function Skeleton({ className }) {
  return <div className={`skeleton ${className}`}>&nbsp;</div>;
}

/* ── KPI Card ────────────────────────────────────────────────────── */
function KPICard({ title, value, unit, icon, trend, color }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 
                    hover:border-[var(--accent)] transition-all duration-300 animate-fade-in
                    hover:shadow-[0_0_20px_var(--accent-glow)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[var(--text-muted)] text-sm font-medium">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold`} style={{ color }}>{value}</span>
        {unit && <span className="text-[var(--text-muted)] text-sm">{unit}</span>}
      </div>
    </div>
  );
}

/* ── Map fly-to component ────────────────────────────────────────── */
function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 6, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

/* ── Scenario Modal ──────────────────────────────────────────────── */
function ScenarioModal({ isOpen, onClose, onApply }) {
  const [type, setType] = useState('dengue');
  const [districts, setDistricts] = useState('Pune, Delhi');
  const [multiplier, setMultiplier] = useState(3);
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
         onClick={onClose}>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 w-[480px] max-w-[90vw]
                      shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-fade-in"
           onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="text-2xl">🦠</span> Simulate Outbreak
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Outbreak Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2.5
                               text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
              <option value="dengue">🦟 Dengue</option>
              <option value="cholera">💧 Cholera</option>
              <option value="flu">🤧 Influenza</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Affected Districts</label>
            <input type="text" value={districts} onChange={e => setDistricts(e.target.value)}
                   className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2.5
                              text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                   placeholder="Pune, Delhi" />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">
              Demand Multiplier: <span className="text-[var(--accent)] font-bold">{multiplier}x</span>
            </label>
            <input type="range" min="1" max="4" step="0.5" value={multiplier}
                   onChange={e => setMultiplier(parseFloat(e.target.value))}
                   className="w-full accent-[var(--accent)]" />
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>1x</span><span>2x</span><span>3x</span><span>4x</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)]
                             rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                             transition-colors">
            Cancel
          </button>
          <button onClick={handleApply} disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg font-semibold
                             transition-colors disabled:opacity-50">
            {loading ? '⏳ Applying…' : '🚨 Apply Scenario'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── PHC Side Panel ──────────────────────────────────────────────── */
function PHCPanel({ phcId, onClose }) {
  const [data, setData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [selectedMed, setSelectedMed] = useState(null);

  useEffect(() => {
    if (!phcId) return;
    fetcher(`${API}/phc/${phcId}`).then(d => {
      setData(d);
      if (d.stock?.length > 0) setSelectedMed(d.stock[0].medicine);
    });
  }, [phcId]);

  useEffect(() => {
    if (!phcId || !selectedMed) return;
    fetcher(`${API}/forecast?phc_id=${phcId}&medicine=${encodeURIComponent(selectedMed)}`)
      .then(setForecast)
      .catch(() => setForecast(null));
  }, [phcId, selectedMed]);

  if (!phcId) return null;

  const chartData = forecast ? [
    ...forecast.history.map(h => ({ date: h.date.slice(5), actual: h.actual })),
    ...forecast.forecast.map(f => ({ date: f.date.slice(5), predicted: f.predicted, lower: f.lower, upper: f.upper })),
  ] : [];

  return (
    <div className="fixed right-0 top-0 h-full w-[440px] max-w-[90vw] bg-[var(--bg-secondary)] 
                    border-l border-[var(--border)] z-[1000] overflow-y-auto animate-fade-in
                    shadow-[-8px_0_30px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border)] p-5 z-10">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold">{data?.name || 'Loading…'}</h2>
            <p className="text-sm text-[var(--text-muted)]">{data?.district}, {data?.country}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white text-xl p-1">✕</button>
        </div>
        {data && (
          <div className="flex gap-3 mt-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium border"
                  style={{
                    color: statusColor[data.status],
                    borderColor: statusColor[data.status] + '50',
                    backgroundColor: statusColor[data.status] + '15',
                  }}>
              {data.status.toUpperCase()}
            </span>
            <span className="text-sm text-[var(--text-muted)]">
              🛏️ {data.beds_occupied}/{data.beds_total} beds
            </span>
            <span className="text-sm text-[var(--text-muted)]">
              👨‍⚕️ {data.staff_present}/{data.staff_total} staff
            </span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-6">
        {/* Medicine Stock Table */}
        {data?.stock && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Medicine Stock
            </h3>
            <div className="space-y-1.5">
              {data.stock.map(s => (
                <div key={s.medicine}
                     className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors
                                ${selectedMed === s.medicine ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30' 
                                                              : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]'}`}
                     onClick={() => setSelectedMed(s.medicine)}>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{s.medicine}</span>
                    <span className="text-xs text-[var(--text-muted)] ml-2">{Math.round(s.stock_on_hand)} units</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full border font-medium"
                          style={{
                            color: statusColor[s.status],
                            borderColor: statusColor[s.status] + '50',
                            backgroundColor: statusColor[s.status] + '15',
                          }}>
                      {s.days_of_cover.toFixed(0)}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Forecast Chart */}
        {selectedMed && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              {selectedMed} — 30d History + 14d Forecast
            </h3>
            {chartData.length > 0 ? (
              <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3654" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} interval={5} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8 }}
                             labelStyle={{ color: '#e2e8f0' }} />
                    <Area type="monotone" dataKey="upper" stroke="none" fill="#3b82f6" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="lower" stroke="none" fill="#0a0f1e" fillOpacity={1} />
                    <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} dot={false} name="Actual" />
                    <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} dot={false}
                          strokeDasharray="5 3" name="Forecast" />
                  </AreaChart>
                </ResponsiveContainer>
                {forecast?.mape && (
                  <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
                    Model MAPE: {forecast.mape.toFixed(1)}% · Shaded: uncertainty band
                  </p>
                )}
              </div>
            ) : (
              <Skeleton className="h-[220px]" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Alerts Feed ─────────────────────────────────────────────────── */
function AlertsFeed({ alerts, onFocusPHC }) {
  if (!alerts) return <Skeleton className="h-40" />;
  if (alerts.length === 0) return (
    <div className="text-center text-[var(--text-muted)] py-8">
      <span className="text-4xl block mb-2">✅</span>
      No active alerts
    </div>
  );

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {alerts.slice(0, 20).map(a => (
        <div key={a.id}
             className="flex items-center gap-3 p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]
                        hover:border-[var(--accent)] cursor-pointer transition-all group"
             onClick={() => onFocusPHC(a.phc_id)}>
          <span className={`shrink-0 px-2 py-1 rounded text-xs font-bold border ${severityBadge[a.severity]}`}>
            {a.days_of_cover.toFixed(0)}d
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate group-hover:text-[var(--accent)] transition-colors">
              {a.phc_name}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate">{a.reason}</p>
          </div>
          <span className="text-xs text-[var(--text-muted)] shrink-0">{a.medicine}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Redistribution Tab ──────────────────────────────────────────── */
function RedistributionTab({ data, onApprove, approvedIds }) {
  if (!data) return <Skeleton className="h-60" />;

  const transfers = data.transfers || [];
  const intlAid = data.international_aid || [];

  return (
    <div className="space-y-4">
      {transfers.length === 0 ? (
        <div className="text-center text-[var(--text-muted)] py-8">
          <span className="text-4xl block mb-2">📦</span>
          No redistributions needed
        </div>
      ) : (
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {transfers.slice(0, 15).map(t => (
            <div key={t.id}
                 className={`p-3 rounded-lg border transition-all ${
                   t.approved || approvedIds.has(t.id)
                     ? 'bg-green-900/20 border-green-700/30'
                     : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--accent)]'
                 }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-[var(--accent)]">{t.medicine}</span>
                <span className="text-xs px-2 py-0.5 bg-[var(--bg-secondary)] rounded text-[var(--text-muted)]">
                  {t.distance_km} km {t.cross_district ? '· cross-district' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm mb-2">
                <span className="text-[var(--text-secondary)]">{t.from_phc_name}</span>
                <span className="text-[var(--accent)]">→</span>
                <span className="text-[var(--text-primary)]">{t.to_phc_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">
                  {Math.round(t.quantity)} units · +{t.days_of_cover_gained.toFixed(0)}d cover
                </span>
                {t.approved || approvedIds.has(t.id) ? (
                  <span className="text-xs text-green-400 font-medium">✓ Approved</span>
                ) : (
                  <button onClick={() => onApprove(t.id)}
                          className="px-3 py-1 bg-[var(--accent)] hover:bg-blue-500 rounded text-xs font-medium
                                     transition-colors">
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* International Aid */}
      {intlAid.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            🌍 International Mutual Aid
          </h4>
          <div className="space-y-1.5">
            {intlAid.map((a, i) => (
              <div key={i} className="p-2.5 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] text-sm">
                <span className="font-medium text-[var(--warning)]">{a.requesting_country}</span>
                {' needs '}<span className="font-medium">{Math.round(a.deficit_units)} units</span>
                {' of '}<span className="text-[var(--accent)]">{a.medicine}</span>
                {' · Donors: '}<span className="text-[var(--success)]">{a.potential_donors.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Federation Tab ──────────────────────────────────────────────── */
function FederationTab({ data, onTrain, trainingRound }) {
  if (!data) return <Skeleton className="h-60" />;

  const { per_country, round_history, privacy_note } = data;

  // Bar chart: local vs federated
  const barData = (per_country || []).map(c => ({
    country: c.country,
    'Local MAPE': c.local_mape,
    'Federated MAPE': c.federated_mape,
  }));

  // Line chart: round-by-round per country
  const lineData = (round_history || []).map(r => ({
    round: `R${r.round}`,
    ...r.per_country,
  }));

  return (
    <div className="space-y-5">
      {/* Privacy Note */}
      <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-xl text-sm">
        <div className="flex items-start gap-2">
          <span className="text-lg">🔒</span>
          <div>
            <p className="font-semibold text-green-400 mb-1">Privacy-Preserving Federation</p>
            <p className="text-[var(--text-secondary)]">{privacy_note}</p>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Local vs Federated MAPE by Country
        </h4>
        <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3654" />
              <XAxis dataKey="country" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
              <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="Local MAPE" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Federated MAPE" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Round-by-round line chart */}
      {lineData.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            MAPE by Round
          </h4>
          <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3654" />
                <XAxis dataKey="round" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="IN" stroke="#f97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="BR" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="RU" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="CN" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ZA" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Train button */}
      <button onClick={onTrain} disabled={trainingRound}
              className="w-full py-3 bg-[var(--accent)] hover:bg-blue-500 rounded-xl font-semibold 
                         transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {trainingRound ? '⏳ Training…' : '🧠 Run Federated Round'}
      </button>

      {/* Improvement table */}
      {per_country && per_country.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Improvement Summary
          </h4>
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left p-3 text-[var(--text-muted)] font-medium">Country</th>
                  <th className="text-right p-3 text-[var(--text-muted)] font-medium">Local</th>
                  <th className="text-right p-3 text-[var(--text-muted)] font-medium">Federated</th>
                  <th className="text-right p-3 text-[var(--text-muted)] font-medium">Improvement</th>
                </tr>
              </thead>
              <tbody>
                {per_country.map(c => (
                  <tr key={c.country} className="border-b border-[var(--border)] last:border-0">
                    <td className="p-3 font-medium">{c.country}</td>
                    <td className="p-3 text-right text-red-400">{c.local_mape.toFixed(1)}%</td>
                    <td className="p-3 text-right text-green-400">{c.federated_mape.toFixed(1)}%</td>
                    <td className="p-3 text-right">
                      <span className={c.improvement_pct > 0 ? 'text-green-400' : 'text-red-400'}>
                        {c.improvement_pct > 0 ? '+' : ''}{c.improvement_pct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


/* ════════════════════════════════════════════════════════════════════
 *  MAIN APP
 * ════════════════════════════════════════════════════════════════════ */
export default function App() {
  // ── State ────────────────────────────────────────────────────────
  const [country, setCountry] = useState('ALL');
  const [tab, setTab] = useState('map');        // map | redistribution | federation
  const [overview, setOverview] = useState(null);
  const [phcs, setPhcs] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [redistribution, setRedistribution] = useState(null);
  const [federation, setFederation] = useState(null);
  const [selectedPHC, setSelectedPHC] = useState(null);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [approvedIds, setApprovedIds] = useState(new Set());
  const [approvedTransfers, setApprovedTransfers] = useState([]);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(null);
  const [trainingRound, setTrainingRound] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Data fetching ────────────────────────────────────────────────
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
    } catch (err) {
      console.error('Failed to load data:', err);
    }
    setLoading(false);
  }, [country]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleScenario = async (scenario) => {
    await poster(`${API}/scenario`, scenario);
    await loadAll();
  };

  const handleApprove = async (transferId) => {
    const result = await poster(`${API}/redistribution/approve`, { transfer_id: transferId });
    if (result.success) {
      setApprovedIds(prev => new Set([...prev, transferId]));
      // Track approved transfer for map lines
      const transfer = redistribution.transfers.find(t => t.id === transferId);
      if (transfer) {
        setApprovedTransfers(prev => [...prev, transfer]);
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

  const handleFocusPHC = (phcId) => {
    const phc = phcs?.find(p => p.id === phcId);
    if (phc) {
      setMapCenter([phc.lat, phc.lon]);
      setMapZoom(10);
      setSelectedPHC(phcId);
      setTab('map');
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 bg-[var(--bg-secondary)] 
                         border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg 
                          flex items-center justify-center text-white font-bold text-sm">S</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Sanjeevani Grid</h1>
            <p className="text-[10px] text-[var(--text-muted)] -mt-0.5 tracking-widest uppercase">
              BRICS Health Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Country selector */}
          <select value={country} onChange={e => setCountry(e.target.value)}
                  className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm
                             text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>

          {/* Simulate button */}
          <button onClick={() => setScenarioOpen(true)}
                  className="px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg
                             text-sm font-medium hover:bg-red-600/30 transition-colors flex items-center gap-1.5">
            🦠 Simulate Outbreak
          </button>
        </div>
      </header>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4 shrink-0">
        {overview ? (
          <>
            <KPICard title="Stock-out Risk" value={overview.stockout_risk_count} unit="PHCs"
                     icon="⚠️" color={overview.stockout_risk_count > 10 ? '#ef4444' : '#f59e0b'} />
            <KPICard title="Avg Days of Cover" value={overview.avg_days_of_cover.toFixed(1)} unit="days"
                     icon="📦" color={overview.avg_days_of_cover < 15 ? '#f59e0b' : '#22c55e'} />
            <KPICard title="Bed Occupancy" value={overview.bed_occupancy_pct.toFixed(1)} unit="%"
                     icon="🛏️" color={overview.bed_occupancy_pct > 85 ? '#ef4444' : '#3b82f6'} />
            <KPICard title="Staff Attendance" value={overview.staff_attendance_pct.toFixed(1)} unit="%"
                     icon="👨‍⚕️" color={overview.staff_attendance_pct > 80 ? '#22c55e' : '#f59e0b'} />
          </>
        ) : (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)
        )}
      </div>

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden px-6 pb-4 gap-4">
        {/* Left panel: Map + tabs */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          <div className="flex gap-1 mb-3 bg-[var(--bg-card)] p-1 rounded-lg w-fit border border-[var(--border)]">
            {[
              { id: 'map', label: '🗺️ Map & Alerts', },
              { id: 'redistribution', label: '📦 Redistribution' },
              { id: 'federation', label: '🌐 Federation' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                                  ${tab === t.id
                                    ? 'bg-[var(--accent)] text-white'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 flex gap-4 overflow-hidden">
            {tab === 'map' && (
              <>
                {/* Map */}
                <div className="flex-1 rounded-xl overflow-hidden border border-[var(--border)]">
                  <MapContainer center={[20, 40]} zoom={2} style={{ height: '100%', width: '100%' }}
                                zoomControl={true}>
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mapCenter && <FlyTo center={mapCenter} zoom={mapZoom} />}

                    {/* PHC markers */}
                    {phcs?.map(p => (
                      <CircleMarker key={p.id}
                                    center={[p.lat, p.lon]}
                                    radius={8}
                                    fillColor={statusColor[p.status]}
                                    color={statusColor[p.status]}
                                    weight={2}
                                    opacity={0.8}
                                    fillOpacity={0.6}
                                    eventHandlers={{
                                      click: () => {
                                        setSelectedPHC(p.id);
                                        setMapCenter([p.lat, p.lon]);
                                        setMapZoom(10);
                                      },
                                    }}>
                        <Popup>
                          <div className="text-sm">
                            <strong>{p.name}</strong><br />
                            <span>Status: {p.status}</span><br />
                            <span>Worst DoC: {p.worst_days_of_cover.toFixed(1)}d</span>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}

                    {/* Approved transfer lines */}
                    {approvedTransfers.map((t, i) => (
                      <Polyline key={i}
                                positions={[[t.from_lat, t.from_lon], [t.to_lat, t.to_lon]]}
                                color="#22c55e"
                                weight={2}
                                opacity={0.7}
                                dashArray="8 4"
                                className="transfer-line" />
                    ))}
                  </MapContainer>
                </div>

                {/* Alerts sidebar */}
                <div className="w-[320px] shrink-0 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3
                                 flex items-center gap-2">
                    <span className="text-lg">🚨</span> Early Warnings
                    {alerts && <span className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full">
                      {alerts.length}
                    </span>}
                  </h3>
                  <AlertsFeed alerts={alerts} onFocusPHC={handleFocusPHC} />
                </div>
              </>
            )}

            {tab === 'redistribution' && (
              <div className="flex-1 overflow-y-auto">
                <RedistributionTab data={redistribution} onApprove={handleApprove} approvedIds={approvedIds} />
              </div>
            )}

            {tab === 'federation' && (
              <div className="flex-1 overflow-y-auto">
                <FederationTab data={federation} onTrain={handleFederationTrain} trainingRound={trainingRound} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PHC Side Panel (over map) ───────────────────────────── */}
      <PHCPanel phcId={selectedPHC} onClose={() => setSelectedPHC(null)} />

      {/* ── Scenario Modal ──────────────────────────────────────── */}
      <ScenarioModal isOpen={scenarioOpen} onClose={() => setScenarioOpen(false)} onApply={handleScenario} />
    </div>
  );
}
