import { useState, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import { PC } from '../../constants';
import { gradesFor } from '../../utils/gradeUtils';
import { inp } from '../../styles/shared';
import Lbl from '../ui/Lbl';
import Empty from '../ui/Empty';
import ScatterChart from './ScatterChart';

// ── Metric catalog ────────────────────────────────────────────
function buildMetricsCatalog(exercises) {
  const metrics = [
    { id:"sends",     group:"Bouldering", label:"Sends",         unit:"",      fromSession:s=>s.boulders.filter(b=>b.sends>0).length },
    { id:"attempts",  group:"Bouldering", label:"Attempts",      unit:"",      fromSession:s=>s.boulders.reduce((a,b)=>a+b.attempts,0) },
    { id:"send_rate", group:"Bouldering", label:"Send rate",      unit:"%",     fromSession:s=>{const a=s.boulders.length,sn=s.boulders.filter(b=>b.sends>0).length;return a?Math.round(sn/a*100):null} },
    { id:"max_grade", group:"Bouldering", label:"Max grade",      unit:"grade", fromSession:s=>{const sn=s.boulders.filter(b=>b.sends>0);return sn.length?Math.max(...sn.map(b=>b.gi)):null} },
    { id:"avg_grade", group:"Bouldering", label:"Avg grade",      unit:"grade", fromSession:s=>s.boulders.length?s.boulders.reduce((a,b)=>a+b.gi,0)/s.boulders.length:null },
    { id:"duration",  group:"Session",    label:"Duration (min)", unit:"min",   fromSession:s=>s.durationMin??null },
  ];
  exercises.forEach(ex => {
    ex.fields.forEach(f => {
      if (f.key === "sets") return;
      metrics.push({
        id: `ex:${ex.id}:${f.key}`,
        group: ex.category || "Training",
        label: `${ex.name} — ${f.label}${f.unit ? ` (${f.unit})` : ""}`,
        unit: f.unit,
        exId: ex.id,
        fieldKey: f.key,
        fromSession: s => {
          const rel = s.training.filter(t => t.exId === ex.id);
          const vals = rel.map(t => t.values?.[f.key]).filter(v => v != null && v !== "" && !isNaN(v));
          return vals.length ? Math.max(...vals) : null;
        },
        fromEntry: t => t.exId === ex.id ? t.values?.[f.key] : null,
      });
    });
  });
  return metrics;
}

// ── Helpers ───────────────────────────────────────────────────
const getWeekKey = dateStr => {
  const d = new Date(dateStr + 'T12:00:00');
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const wk = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(wk).padStart(2,'0')}`;
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const aggLabel = (key, agg) => {
  if (agg === 'session') return key.slice(5);           // MM-DD
  if (agg === 'weekly')  return key.replace(/^\d{4}-/,''); // WNN
  const m = parseInt(key.slice(5)) - 1;
  return MONTHS[m] ?? key.slice(5);
};

const noSelect = { WebkitTapHighlightColor:'transparent', userSelect:'none', outline:'none' };

// ── Component ─────────────────────────────────────────────────
export default function PlotBuilder({ sessions, exercises, gyms, gradeSystem, period, agg }) {
  const grades  = gradesFor(gradeSystem);
  const metrics = useMemo(() => buildMetricsCatalog(exercises), [exercises]);

  const [mode,     setMode]     = useState('line');
  const [sel,      setSel]      = useState(['sends','max_grade']);
  const [scatterX, setScatterX] = useState('ex:ex_maxhang:edgeMm');
  const [scatterY, setScatterY] = useState('ex:ex_maxhang:weightKg');

  const toggle = id => setSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const ended = useMemo(() =>
    [...sessions].filter(s => s.ended).sort((a,b) => a.date.localeCompare(b.date)),
  [sessions]);

  const periodEnded = useMemo(() => {
    const days = { '1M':30, '3M':90, '6M':180, '1Y':365 }[period] ?? null;
    if (!days) return ended;
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0,10);
    return ended.filter(s => s.date >= cutoff);
  }, [ended, period]);

  const doAgg = useCallback((rawPts) => {
    if (agg === 'session') return rawPts.map(p => ({ ...p, label: p.date.slice(5), key: p.date, count:1 }));
    const grouped = {};
    rawPts.forEach(p => {
      const key = agg === 'weekly' ? getWeekKey(p.date) : p.date.slice(0,7);
      if (!grouped[key]) grouped[key] = { key, values:[], firstDate:p.date };
      grouped[key].values.push(p.v);
    });
    return Object.values(grouped)
      .sort((a,b) => a.key.localeCompare(b.key))
      .map(g => ({
        date: g.firstDate,
        key:  g.key,
        label: aggLabel(g.key, agg),
        v: g.values.reduce((a,b) => a+b, 0) / g.values.length,
        count: g.values.length,
      }));
  }, [agg]);

  const formatValue = (m, v) => {
    if (v == null) return '';
    if (m?.unit === 'grade' || m?.unit === 'idx') return grades[Math.round(v)] ?? `#${Math.round(v)}`;
    if (m?.unit === '%') return `${Math.round(v)}%`;
    return Number.isInteger(v) ? `${v}` : v.toFixed(1);
  };

  // Build series data
  const lineSeries = useMemo(() => sel.map((id, si) => {
    const m = metrics.find(x => x.id === id);
    if (!m) return null;
    const rawPts = periodEnded
      .map(s => ({ date: s.date, v: m.fromSession(s) }))
      .filter(p => p.v != null);
    const aggPts = doAgg(rawPts);
    if (!aggPts.length) return null;
    const vals = aggPts.map(p => p.v);
    const mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1;
    return {
      id, m, color: PC[si % PC.length],
      rawPts,                                          // individual sessions
      aggPts: aggPts.map(p => ({ ...p, n: (p.v - mn) / rng })),
      mn, mx,
    };
  }).filter(Boolean), [sel, periodEnded, doAgg, metrics]);

  // Time-based x scale across all data
  const { xForDate, xForDateRaw, allAggLabels } = useMemo(() => {
    const dates = [...new Set(lineSeries.flatMap(s => [
      ...s.rawPts.map(p => p.date),
      ...s.aggPts.map(p => p.date),
    ]))].sort();
    if (!dates.length) return { xForDate: ()=>30, xForDateRaw: ()=>30, allAggLabels:[] };

    const t0 = new Date(dates[0]  + 'T12:00:00').getTime();
    const t1 = new Date(dates[dates.length-1] + 'T12:00:00').getTime();
    const span = t1 - t0 || 1;
    const W = 320, padX = 28, chartW = W - padX * 2;

    const toX = dateStr => padX + ((new Date(dateStr+'T12:00:00').getTime() - t0) / span) * chartW;

    // Labels: deduplicated from all aggPts, thinned if too many
    const labels = [...new Set(lineSeries.flatMap(s => s.aggPts.map(p => ({ label:p.label, date:p.date }))))]
      .sort((a,b) => a.date.localeCompare(b.date));
    const step = Math.ceil(labels.length / 7);
    const thinned = labels.filter((_,i) => i % step === 0 || i === labels.length-1);

    return { xForDate: toX, xForDateRaw: toX, allAggLabels: thinned };
  }, [lineSeries]);

  // Chart dimensions
  const W=320, H=140, padX=28, padY=18;
  const yp = n => padY + (1 - Math.max(0, Math.min(1, n))) * (H - padY * 2);

  // Scatter
  const scatterData = useMemo(() => {
    const xm = metrics.find(m => m.id === scatterX);
    const ym = metrics.find(m => m.id === scatterY);
    if (!xm?.fromEntry || !ym?.fromEntry) return { xm, ym, points:[] };
    const points = [];
    ended.forEach(s => s.training.forEach(t => {
      const x = xm.fromEntry(t), y = ym.fromEntry(t);
      if (x != null && y != null && !isNaN(x) && !isNaN(y) && x !== "" && y !== "")
        points.push({ x:+x, y:+y, date:s.date });
    }));
    return { xm, ym, points };
  }, [ended, scatterX, scatterY, metrics]);

  const groups = [...new Set(metrics.map(m => m.group))];
  const trainingMetrics = metrics.filter(m => m.exId);

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex gap-1.5 mb-5">
        {[{id:'line',label:'Time series'},{id:'scatter',label:'X vs Y'}].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className="flex-1 text-center py-2.5 rounded-full font-mono text-[11px] border cursor-pointer"
            style={{
              borderColor: mode===m.id ? 'var(--color-accent)' : 'var(--color-border)',
              background:  mode===m.id ? 'color-mix(in srgb,var(--color-accent) 12%,transparent)' : 'transparent',
              color:       mode===m.id ? 'var(--color-accent)' : 'var(--color-muted)',
            }}>{m.label}</button>
        ))}
      </div>

      {mode === 'line' && (
        <>
          {/* Metric selector */}
          <div className="mb-4">
            {groups.map(g => (
              <div key={g} className="mb-3">
                <div className="font-mono text-[9px] text-dim tracking-[2px] mb-1.5">{g.toUpperCase()}</div>
                <div className="flex flex-wrap gap-1.5">
                  {metrics.filter(m => m.group === g).map(m => {
                    const on = sel.includes(m.id);
                    const ci = sel.indexOf(m.id);
                    const col = on ? PC[ci % PC.length] : 'var(--color-border)';
                    return (
                      <button key={m.id} onClick={() => toggle(m.id)} style={{
                        padding:'4px 10px', borderRadius:20, fontFamily:'var(--font-mono)', fontSize:10,
                        cursor:'pointer', border:`1px solid ${col}`,
                        background: on ? `${PC[ci%PC.length]}18` : 'transparent',
                        color: on ? PC[ci%PC.length] : 'var(--color-muted)',
                        ...noSelect,
                      }}>{m.label}</button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-s2 border border-border rounded-[10px] p-4" style={noSelect}>
            {lineSeries.length === 0
              ? <Empty>Select metrics with logged data</Empty>
              : (
              <>
                <svg width="100%" viewBox={`0 0 ${W} ${H+22}`} style={{ overflow:'visible', ...noSelect }}>
                  {/* Horizontal grid lines */}
                  {[0, 0.5, 1].map(t => (
                    <line key={t} x1={padX} x2={W-padX} y1={yp(t)} y2={yp(t)}
                      stroke="var(--color-dim)" strokeWidth="1"/>
                  ))}

                  {/* Raw session dots (only when aggregating) */}
                  {agg !== 'session' && lineSeries.map(s => {
                    const vals = s.rawPts.map(p => p.v);
                    const mn2  = Math.min(...vals), rng2 = (Math.max(...vals) - mn2) || 1;
                    return s.rawPts.map((p, i) => (
                      <circle key={`raw-${s.id}-${i}`}
                        cx={xForDateRaw(p.date)} cy={yp((p.v - mn2) / rng2)}
                        r="2" fill={s.color} opacity="0.28"/>
                    ));
                  })}

                  {/* Aggregated line + dots + value labels */}
                  {lineSeries.map(s => {
                    const ptsStr = s.aggPts.map(p => `${xForDate(p.date)},${yp(p.n)}`).join(' ');
                    const dotR   = agg !== 'session' ? 4 : 3;
                    return (
                      <g key={s.id}>
                        <polyline points={ptsStr} fill="none" stroke={s.color}
                          strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
                        {s.aggPts.map((p, i) => (
                          <g key={i}>
                            <circle cx={xForDate(p.date)} cy={yp(p.n)}
                              r={dotR} fill={s.color}/>
                            {/* Show count badge for aggregated view */}
                            {agg !== 'session' && p.count > 1 && (
                              <text x={xForDate(p.date)} y={yp(p.n)-dotR-4}
                                textAnchor="middle"
                                style={{fontFamily:'var(--font-mono)',fontSize:7,fill:s.color,opacity:0.65}}>
                                {p.count}×
                              </text>
                            )}
                            <text x={xForDate(p.date)} y={yp(p.n)+dotR+9}
                              textAnchor="middle"
                              style={{fontFamily:'var(--font-mono)',fontSize:8,fill:s.color}}>
                              {formatValue(s.m, p.v)}
                            </text>
                          </g>
                        ))}
                      </g>
                    );
                  })}

                  {/* X-axis labels */}
                  {allAggLabels.map((item, i) => (
                    <text key={i} x={xForDate(item.date)} y={H+15}
                      textAnchor="middle"
                      style={{fontFamily:'var(--font-mono)',fontSize:8,fill:'var(--color-muted)'}}>
                      {item.label}
                    </text>
                  ))}
                </svg>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-2">
                  {lineSeries.map(s => (
                    <div key={s.id} className="flex items-center gap-1.5">
                      <div style={{width:16,height:2.5,background:s.color,borderRadius:2}}/>
                      <span className="font-mono text-[9px] text-muted">{s.m?.label}</span>
                      <span className="font-mono text-[9px]" style={{color:s.color}}>
                        {formatValue(s.m, s.mn)}–{formatValue(s.m, s.mx)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {mode === 'scatter' && (
        <>
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div>
              <Lbl>X AXIS</Lbl>
              <select value={scatterX} onChange={e => setScatterX(e.target.value)} className={inp} style={{appearance:'menulist'}}>
                {trainingMetrics.map(m => (<option key={m.id} value={m.id}>{m.label}</option>))}
              </select>
            </div>
            <div>
              <Lbl>Y AXIS</Lbl>
              <select value={scatterY} onChange={e => setScatterY(e.target.value)} className={inp} style={{appearance:'menulist'}}>
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
                    xFormat={v => scatterData.xm?.unit==='idx' ? grades[Math.round(v)] : v.toFixed(1)}
                    yFormat={v => scatterData.ym?.unit==='idx' ? grades[Math.round(v)] : v.toFixed(1)}/>
                </>
            }
          </div>
        </>
      )}
    </div>
  );
}
