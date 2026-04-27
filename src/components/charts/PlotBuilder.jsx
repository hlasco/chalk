import { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { gradesFor } from '../../utils/gradeUtils';
import { inp } from '../../styles/shared';
import Lbl from '../ui/Lbl';
import Empty from '../ui/Empty';
import ScatterChart from './ScatterChart';

const THEME_COLORS = [
  'var(--color-accent)',
  'var(--color-blue)',
  'var(--color-green)',
  'var(--color-purple)',
  'var(--color-red)',
  'var(--color-muted)',
];

const resolveToHex = color => {
  if (!color?.startsWith('var(')) return color || '#888888';
  try {
    const name = color.slice(4, -1);
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888888';
  } catch { return '#888888'; }
};

// ── Metric catalog ────────────────────────────────────────────
function buildMetricsCatalog(exercises) {
  const metrics = [
    { id:'sends',     group:'Bouldering', label:'Sends',         unit:'',      fromSession:s=>s.boulders.filter(b=>b.sends>0).length },
    { id:'attempts',  group:'Bouldering', label:'Attempts',      unit:'',      fromSession:s=>s.boulders.reduce((a,b)=>a+b.attempts,0) },
    { id:'send_rate', group:'Bouldering', label:'Send rate',      unit:'%',     fromSession:s=>{const a=s.boulders.length,sn=s.boulders.filter(b=>b.sends>0).length;return a?Math.round(sn/a*100):null} },
    { id:'max_grade', group:'Bouldering', label:'Max grade',      unit:'grade', fromSession:s=>{const sn=s.boulders.filter(b=>b.sends>0);return sn.length?Math.max(...sn.map(b=>b.gi)):null} },
    { id:'avg_grade', group:'Bouldering', label:'Avg grade',      unit:'grade', fromSession:s=>s.boulders.length?s.boulders.reduce((a,b)=>a+b.gi,0)/s.boulders.length:null },
    { id:'duration',  group:'Session',    label:'Duration (min)', unit:'min',   fromSession:s=>s.durationMin??null },
  ];
  exercises.forEach(ex => {
    ex.fields.forEach(f => {
      if (f.key === 'sets') return;
      metrics.push({
        id: `ex:${ex.id}:${f.key}`,
        group: ex.category || 'Training',
        label: `${ex.name} — ${f.label}${f.unit ? ` (${f.unit})` : ''}`,
        unit: f.unit,
        exId: ex.id,
        fieldKey: f.key,
        fromSession: s => {
          const rel = s.training.filter(t => t.exId === ex.id);
          const vals = rel.map(t => t.values?.[f.key]).filter(v => v != null && v !== '' && !isNaN(v));
          return vals.length ? Math.max(...vals) : null;
        },
        fromEntry: t => t.exId === ex.id ? t.values?.[f.key] : null,
      });
    });
  });
  return metrics;
}

// ── Aggregation ───────────────────────────────────────────────
const AGG_FNS = [
  { id: 'avg', label: 'avg' },
  { id: 'sum', label: 'sum' },
  { id: 'max', label: 'max' },
];

const defaultAggFn = id => {
  if (id === 'max_grade') return 'max';
  if (id === 'sends' || id === 'attempts' || id === 'duration') return 'sum';
  return 'avg';
};

const applyAggFn = (values, fn) => {
  if (!values.length) return null;
  if (fn === 'sum') return values.reduce((a, b) => a + b, 0);
  if (fn === 'max') return Math.max(...values);
  return values.reduce((a, b) => a + b, 0) / values.length;
};

// ── Date helpers ──────────────────────────────────────────────
const getWeekKey = dateStr => {
  const d = new Date(dateStr + 'T12:00:00');
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const wk = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(wk).padStart(2, '0')}`;
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const noSelect = { WebkitTapHighlightColor: 'transparent', userSelect: 'none', outline: 'none' };

// ── Component ─────────────────────────────────────────────────
export default function PlotBuilder({ sessions, exercises, gradeSystem, period, agg }) {
  const grades  = gradesFor(gradeSystem);
  const metrics = useMemo(() => buildMetricsCatalog(exercises), [exercises]);

  const [mode,         setMode]         = useState('line');
  const [sel,          setSel]          = useState(['sends', 'max_grade']);
  const [colors,       setColors]       = useState({});
  const [aggFns,       setAggFns]       = useState({});
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [scatterX, setScatterX] = useState('ex:ex_maxhang:edgeMm');
  const [scatterY, setScatterY] = useState('ex:ex_maxhang:weightKg');

  const toggle   = id => setSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const getColor = (id, si) => colors[id] ?? THEME_COLORS[si % THEME_COLORS.length];
  const getAggFn = id => aggFns[id] ?? defaultAggFn(id);

  const ended = useMemo(() =>
    [...sessions].filter(s => s.ended).sort((a, b) => a.date.localeCompare(b.date)),
  [sessions]);

  const periodEnded = useMemo(() => {
    const days = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[period] ?? null;
    if (!days) return ended;
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    return ended.filter(s => s.date >= cutoff);
  }, [ended, period]);

  // Group by day (session), week, or month — same-day sessions are merged
  const doAgg = useCallback((rawPts, fn) => {
    const bucket = agg === 'weekly' ? (p => getWeekKey(p.date)) :
                   agg === 'monthly' ? (p => p.date.slice(0, 7)) :
                                       (p => p.date);
    const grouped = {};
    rawPts.forEach(p => {
      const key = bucket(p);
      if (!grouped[key]) grouped[key] = { key, values: [], firstDate: p.date };
      grouped[key].values.push(p.v);
    });
    return Object.values(grouped)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(g => ({
        date:  g.firstDate,
        ts:    new Date(g.firstDate + 'T12:00:00').getTime(),
        v:     applyAggFn(g.values, fn),
        count: g.values.length,
      }));
  }, [agg]);

  const formatValue = useCallback((m, v) => {
    if (v == null || isNaN(v)) return '';
    if (m?.unit === 'grade') return grades[Math.round(v)] ?? `#${Math.round(v)}`;
    if (m?.unit === '%') return `${Math.round(v)}%`;
    return Number.isInteger(v) ? `${v}` : parseFloat(v.toFixed(1));
  }, [grades]);

  // Build per-series aggregated points
  const lineSeries = useMemo(() => sel.map((id, si) => {
    const m = metrics.find(x => x.id === id);
    if (!m) return null;
    const fn = getAggFn(id);
    const rawPts = periodEnded.map(s => ({ date: s.date, v: m.fromSession(s) })).filter(p => p.v != null);
    const aggPts = doAgg(rawPts, fn);
    if (!aggPts.length) return null;
    return { id, m, fn, color: getColor(id, si), aggPts };
  }).filter(Boolean), [sel, periodEnded, doAgg, metrics, colors, aggFns]); // eslint-disable-line

  // Merge all series into one recharts-compatible data array keyed by timestamp
  const chartData = useMemo(() => {
    const byTs = {};
    lineSeries.forEach(s => {
      s.aggPts.forEach(p => {
        if (!byTs[p.ts]) byTs[p.ts] = { ts: p.ts };
        byTs[p.ts][s.id] = p.v;
      });
    });
    return Object.values(byTs).sort((a, b) => a.ts - b.ts);
  }, [lineSeries]);

  // Tick formatter per metric — grade metrics show grade names
  const makeTickFmt = m => v => {
    if (v == null || isNaN(v)) return '';
    if (m?.unit === 'grade') return grades[Math.round(v)] ?? '';
    if (m?.unit === '%') return `${Math.round(v)}%`;
    return Number.isInteger(v) ? `${v}` : parseFloat(v.toFixed(1));
  };

  // Inline tooltip with per-series formatting
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const ts = payload[0]?.payload?.ts;
    const dateStr = ts ? new Date(ts).toISOString().slice(0, 10) : '';
    return (
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 8, padding: '6px 10px',
        fontFamily: 'var(--font-mono)', fontSize: 10,
      }}>
        {dateStr && <div style={{ color: 'var(--color-muted)', fontSize: 9, marginBottom: 4 }}>{dateStr}</div>}
        {payload.map((entry, i) => {
          const s = lineSeries.find(s => s.id === entry.dataKey);
          return (
            <div key={i} style={{ color: entry.stroke }}>
              {s?.m?.label}: {s ? formatValue(s.m, entry.value) : entry.value}
            </div>
          );
        })}
      </div>
    );
  }, [lineSeries, formatValue]);

  // Scatter data
  const scatterData = useMemo(() => {
    const xm = metrics.find(m => m.id === scatterX);
    const ym = metrics.find(m => m.id === scatterY);
    if (!xm?.fromEntry || !ym?.fromEntry) return { xm, ym, points: [] };
    const points = [];
    ended.forEach(s => s.training.forEach(t => {
      const x = xm.fromEntry(t), y = ym.fromEntry(t);
      if (x != null && y != null && !isNaN(x) && !isNaN(y) && x !== '' && y !== '')
        points.push({ x: +x, y: +y, date: s.date });
    }));
    return { xm, ym, points };
  }, [ended, scatterX, scatterY, metrics]);

  const groups          = [...new Set(metrics.map(m => m.group))];
  const trainingMetrics = metrics.filter(m => m.exId);
  const hasRight        = lineSeries.length > 1;

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex gap-1.5 mb-5">
        {[{ id: 'line', label: 'Time series' }, { id: 'scatter', label: 'X vs Y' }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className="flex-1 text-center py-2.5 rounded-full font-mono text-[11px] border cursor-pointer"
            style={{
              borderColor: mode === m.id ? 'var(--color-accent)' : 'var(--color-border)',
              background:  mode === m.id ? 'color-mix(in srgb,var(--color-accent) 12%,transparent)' : 'transparent',
              color:       mode === m.id ? 'var(--color-accent)' : 'var(--color-muted)',
            }}>{m.label}</button>
        ))}
      </div>

      {mode === 'line' && (
        <>
          {/* Metric selector */}
          <div className="mb-4">
            <button onClick={() => setSelectorOpen(p => !p)} style={{
              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid var(--color-border)',
              background: selectorOpen ? 'var(--color-s2)' : 'transparent',
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)',
              ...noSelect,
            }}>
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sel.length === 0
                  ? 'Select metrics…'
                  : sel.map(id => metrics.find(m => m.id === id)?.label ?? id).join('  ·  ')}
              </span>
              <span style={{ marginLeft: 8, flexShrink: 0 }}>{selectorOpen ? '▲' : '▼'}</span>
            </button>

            {selectorOpen && (
              <div className="mt-2 p-3 rounded-[8px] border border-border bg-s2 flex flex-col gap-3">
                {groups.map(g => (
                  <div key={g}>
                    <div className="font-mono text-[9px] text-dim tracking-[2px] mb-1.5">{g.toUpperCase()}</div>
                    <div className="flex flex-col gap-1.5">
                      {metrics.filter(m => m.group === g).map(m => {
                        const on            = sel.includes(m.id);
                        const ci            = sel.indexOf(m.id);
                        const assignedColor = getColor(m.id, ci);
                        const currentAggFn  = getAggFn(m.id);
                        return (
                          <div key={m.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <button onClick={() => toggle(m.id)} style={{
                                padding: '4px 10px', borderRadius: 20,
                                fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
                                border: `1px solid ${on ? assignedColor : 'var(--color-border)'}`,
                                background: on ? `color-mix(in srgb,${assignedColor} 12%,transparent)` : 'transparent',
                                color: on ? assignedColor : 'var(--color-muted)',
                                ...noSelect,
                              }}>{m.label}</button>
                              {on && (
                                <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: assignedColor, border: '1.5px solid var(--color-border)' }} />
                                  <input type="color" value={resolveToHex(assignedColor)}
                                    onChange={e => setColors(prev => ({ ...prev, [m.id]: e.target.value }))}
                                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', padding: 0, border: 'none' }}
                                  />
                                </label>
                              )}
                            </div>
                            {on && (
                              <div style={{ display: 'flex', gap: 3, marginTop: 4, marginLeft: 2 }}>
                                {AGG_FNS.map(({ id: fn, label }) => {
                                  const active = currentAggFn === fn;
                                  return (
                                    <button key={fn} onClick={() => setAggFns(p => ({ ...p, [m.id]: fn }))} style={{
                                      padding: '2px 7px', borderRadius: 4,
                                      fontFamily: 'var(--font-mono)', fontSize: 9, cursor: 'pointer',
                                      border: `1px solid ${active ? assignedColor : 'var(--color-border)'}`,
                                      background: active ? `color-mix(in srgb,${assignedColor} 15%,transparent)` : 'transparent',
                                      color: active ? assignedColor : 'var(--color-dim)',
                                      ...noSelect,
                                    }}>{label}</button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chart */}
          {lineSeries.length === 0
            ? <Empty>Select metrics with logged data</Empty>
            : (
            <div style={noSelect}>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData} margin={{ top: 10, right: hasRight ? 28 : 10, left: -4, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.6} />
                  <XAxis
                    dataKey="ts" type="number" scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickCount={4} minTickGap={36}
                    tickFormatter={ts => { const d = new Date(ts); return MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate(); }}
                    tick={{ fontSize: 8, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
                    axisLine={false} tickLine={false}
                  />
                  {/* Left y-axis — first series */}
                  <YAxis yAxisId="left" orientation="left"
                    tickFormatter={makeTickFmt(lineSeries[0]?.m)}
                    tick={{ fontSize: 8, fill: lineSeries[0]?.color, fontFamily: 'var(--font-mono)' }}
                    axisLine={false} tickLine={false} width={28}
                    allowDecimals={lineSeries[0]?.m?.unit !== 'grade'}
                    tickCount={4}
                  />
                  {/* Right y-axis — second series only */}
                  {hasRight && (
                    <YAxis yAxisId="right" orientation="right"
                      tickFormatter={makeTickFmt(lineSeries[1]?.m)}
                      tick={{ fontSize: 8, fill: lineSeries[1]?.color, fontFamily: 'var(--font-mono)' }}
                      axisLine={false} tickLine={false} width={28}
                      allowDecimals={lineSeries[1]?.m?.unit !== 'grade'}
                      tickCount={4}
                    />
                  )}
                  <Tooltip content={<CustomTooltip />}
                    cursor={{ stroke: 'var(--color-dim)', strokeWidth: 1, strokeOpacity: 0.5 }} />
                  {lineSeries.map((s, i) => (
                    <Line key={s.id}
                      type="monotone"
                      dataKey={s.id}
                      yAxisId={i === 1 ? 'right' : 'left'}
                      stroke={s.color} strokeWidth={2}
                      dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                      activeDot={{ r: 4, fill: s.color, strokeWidth: 0 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-1">
                {lineSeries.map(s => (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <div style={{ width: 16, height: 2.5, background: s.color, borderRadius: 2 }}/>
                    <span className="font-mono text-[9px] text-muted">{s.m?.label}</span>
                    <span className="font-mono text-[8px]" style={{ color: 'var(--color-dim)' }}>{s.fn}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'scatter' && (
        <>
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div>
              <Lbl>X AXIS</Lbl>
              <select value={scatterX} onChange={e => setScatterX(e.target.value)} className={inp} style={{ appearance: 'menulist' }}>
                {trainingMetrics.map(m => (<option key={m.id} value={m.id}>{m.label}</option>))}
              </select>
            </div>
            <div>
              <Lbl>Y AXIS</Lbl>
              <select value={scatterY} onChange={e => setScatterY(e.target.value)} className={inp} style={{ appearance: 'menulist' }}>
                {trainingMetrics.map(m => (<option key={m.id} value={m.id}>{m.label}</option>))}
              </select>
            </div>
          </div>
          <div className="bg-s2 border border-border rounded-[10px] p-4" style={noSelect}>
            {scatterData.points.length < 2
              ? <Empty>Need 2+ entries with both metrics logged</Empty>
              : <>
                  <div className="font-mono text-[9px] text-muted mb-2">{scatterData.points.length} data points</div>
                  <ScatterChart data={scatterData.points}
                    xLabel={scatterData.xm?.label} yLabel={scatterData.ym?.label}
                    color="var(--color-accent)"
                    xFormat={v => scatterData.xm?.unit === 'idx' ? grades[Math.round(v)] : v.toFixed(1)}
                    yFormat={v => scatterData.ym?.unit === 'idx' ? grades[Math.round(v)] : v.toFixed(1)}/>
                </>
            }
          </div>
        </>
      )}
    </div>
  );
}
