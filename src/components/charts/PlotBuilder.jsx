import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { PC } from '../../constants';
import { gradesFor } from '../../utils/gradeUtils';
import { inp, pill } from '../../styles/shared';
import Lbl from '../ui/Lbl';
import Empty from '../ui/Empty';
import ScatterChart from './ScatterChart';

function buildMetricsCatalog(exercises) {
  const metrics = [
    { id:"sends",     group:"Bouldering", label:"Sends / session",     fromSession:s=>s.boulders.filter(b=>b.sends>0).length, unit:"" },
    { id:"attempts",  group:"Bouldering", label:"Attempts / session",  fromSession:s=>s.boulders.reduce((a,b)=>a+b.attempts,0), unit:"" },
    { id:"send_rate", group:"Bouldering", label:"Send rate %",         fromSession:s=>{const a=s.boulders.length,sn=s.boulders.filter(b=>b.sends>0).length;return a?Math.round(sn/a*100):null;}, unit:"%" },
    { id:"max_grade", group:"Bouldering", label:"Max grade",           fromSession:s=>{const sn=s.boulders.filter(b=>b.sends>0);return sn.length?Math.max(...sn.map(b=>b.gi)):null;}, unit:"grade" },
    { id:"avg_grade", group:"Bouldering", label:"Avg grade attempted", fromSession:s=>{if(!s.boulders.length)return null;return s.boulders.reduce((a,b)=>a+b.gi,0)/s.boulders.length;}, unit:"grade" },
    { id:"duration",  group:"Session",    label:"Duration (min)",      fromSession:s=>s.durationMin??null, unit:"min" },
  ];
  exercises.forEach(ex=>{
    ex.fields.forEach(f=>{
      if (f.key === "sets") return;
      metrics.push({
        id: `ex:${ex.id}:${f.key}`,
        group: ex.category || "Training",
        label: `${ex.name} — ${f.label}${f.unit?` (${f.unit})`:""}`,
        unit: f.unit,
        exId: ex.id,
        fieldKey: f.key,
        fromSession: s => {
          const rel = s.training.filter(t=>t.exId===ex.id);
          const vals = rel.map(t=>t.values?.[f.key]).filter(v=>v!=null && v!=="" && !isNaN(v));
          return vals.length ? Math.max(...vals) : null;
        },
        fromEntry: t => t.exId===ex.id ? (t.values?.[f.key]) : null,
      });
    });
  });
  return metrics;
}

export default function PlotBuilder({ sessions, exercises, gyms, gradeSystem }) {
  const grades = gradesFor(gradeSystem);
  const metrics = useMemo(()=>buildMetricsCatalog(exercises),[exercises]);
  const [mode, setMode] = useState("line");
  const [sel, setSel] = useState(["sends","ex:ex_pullup:weightKg"]);
  const [scatterX, setScatterX] = useState("ex:ex_maxhang:edgeMm");
  const [scatterY, setScatterY] = useState("ex:ex_maxhang:weightKg");

  const toggle = id => setSel(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const ended = [...sessions].filter(s=>s.ended).sort((a,b)=>a.date.localeCompare(b.date));

  const formatValue = (m, v) => {
    if (v == null) return "";
    if (m?.unit === "grade") return grades[Math.round(v)] ?? `#${Math.round(v)}`;
    if (m?.unit === "idx")   return grades[Math.round(v)] ?? `#${Math.round(v)}`;
    if (m?.unit === "%")     return `${Math.round(v)}%`;
    if (Number.isInteger(v)) return `${v}`;
    return v.toFixed(1);
  };

  const groups = [...new Set(metrics.map(m=>m.group))];

  const computeLine = metricId => {
    const m = metrics.find(x=>x.id===metricId);
    if (!m) return {m, pts:[]};
    const pts = ended.map(s=>({label:s.date.slice(5), v:m.fromSession(s)})).filter(p=>p.v!=null);
    return {m, pts};
  };
  const lineSeries = sel.map((id,si)=>{
    const {m,pts}=computeLine(id);
    return {id,m,pts,color:PC[si%PC.length]};
  }).filter(s=>s.pts.length>=2);

  const W=320,H=130,px=30;
  const allLabels=[...new Set(lineSeries.flatMap(s=>s.pts.map(p=>p.label)))].sort();
  const xp=l=>px+(allLabels.indexOf(l)/(allLabels.length-1||1))*(W-px*2);
  const lineNorm = lineSeries.map(s=>{
    const vals=s.pts.map(p=>p.v),mn=Math.min(...vals),mx=Math.max(...vals),rng=mx-mn||1;
    return{...s,mn,mx,npts:s.pts.map(p=>({...p,n:(p.v-mn)/rng}))};
  });

  const scatterData = useMemo(()=>{
    const xm = metrics.find(m=>m.id===scatterX);
    const ym = metrics.find(m=>m.id===scatterY);
    if (!xm?.fromEntry || !ym?.fromEntry) return {xm, ym, points: []};
    const points = [];
    ended.forEach(s=>s.training.forEach(t=>{
      const x = xm.fromEntry(t), y = ym.fromEntry(t);
      if (x!=null && y!=null && !isNaN(x) && !isNaN(y) && x!=="" && y!=="") {
        points.push({x:+x, y:+y, date:s.date});
      }
    }));
    return {xm, ym, points};
  },[ended, scatterX, scatterY, metrics]);

  const trainingMetrics = metrics.filter(m=>m.exId);

  return (
    <div>
      <div className="flex gap-1.5 mb-4">
        {[{id:"line",label:"Time series"},{id:"scatter",label:"X vs Y"}].map(m=>(
          <button key={m.id} onClick={()=>setMode(m.id)} className={clsx(pill(mode===m.id), "flex-1 text-center py-[9px]")}>{m.label}</button>
        ))}
      </div>

      {mode==="line" && (
        <>
          <Lbl>SELECT METRICS</Lbl>
          {groups.map(g=>(
            <div key={g} className="mb-3.5">
              <div className="font-mono text-[9px] text-dim tracking-[2px] mb-[7px]">{g.toUpperCase()}</div>
              <div className="flex flex-wrap gap-1.5">
                {metrics.filter(m=>m.group===g).map(m=>{
                  const on=sel.includes(m.id),ci=sel.indexOf(m.id);
                  const col=on?PC[ci%PC.length]:"var(--color-border)";
                  return (
                    <button key={m.id} onClick={()=>toggle(m.id)} style={{
                      padding:"5px 12px",borderRadius:20,fontFamily:"var(--font-mono)",fontSize:10,cursor:"pointer",
                      border:`1px solid ${col}`,
                      background:on?`${PC[ci%PC.length]}18`:"transparent",
                      color:on?PC[ci%PC.length]:"var(--color-muted)",
                    }}>{m.label}</button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="bg-s2 border border-border rounded-[10px] p-3.5 mt-1">
            {lineNorm.length===0 ? <Empty>Select metrics with logged data</Empty> : (
              <>
                <svg width="100%" viewBox={`0 0 ${W} ${H+20}`} style={{overflow:"visible"}}>
                  {[0,.5,1].map(t=><line key={t} x1={px} x2={W-px} y1={px+(1-t)*(H-px*2)} y2={px+(1-t)*(H-px*2)} stroke="var(--color-dim)" strokeWidth="1"/>)}
                  {lineNorm.map(s=>{
                    const pts=s.npts.map(p=>`${xp(p.label)},${px+(1-p.n)*(H-px*2)}`).join(" ");
                    return (
                      <g key={s.id}>
                        <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round"/>
                        {s.npts.map((p,i)=>(
                          <g key={i}>
                            <circle cx={xp(p.label)} cy={px+(1-p.n)*(H-px*2)} r="4" fill={s.color}/>
                            <text x={xp(p.label)} y={px+(1-p.n)*(H-px*2)-10} textAnchor="middle" style={{fontFamily:"var(--font-mono)",fontSize:8.5,fill:s.color}}>{formatValue(s.m,p.v)}</text>
                          </g>
                        ))}
                      </g>
                    );
                  })}
                  {allLabels.map((l,i)=>(<text key={i} x={xp(l)} y={H+14} textAnchor="middle" style={{fontFamily:"var(--font-mono)",fontSize:8,fill:"var(--color-muted)"}}>{l}</text>))}
                </svg>
                <div className="flex flex-wrap gap-2.5 mt-1">
                  {lineNorm.map(s=>(
                    <div key={s.id} className="flex items-center gap-1.5">
                      <div style={{width:14,height:3,background:s.color,borderRadius:2}}/>
                      <span className="font-mono text-[9px] text-muted">{s.m?.label}</span>
                      <span className="font-mono text-[9px]" style={{color:s.color}}>[{formatValue(s.m,s.mn)} – {formatValue(s.m,s.mx)}]</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {mode==="scatter" && (
        <>
          <div className="grid grid-cols-2 gap-2.5 mb-3.5">
            <div><Lbl>X AXIS</Lbl>
              <select value={scatterX} onChange={e=>setScatterX(e.target.value)} className={inp} style={{appearance:"menulist"}}>
                {trainingMetrics.map(m=>(<option key={m.id} value={m.id}>{m.label}</option>))}
              </select>
            </div>
            <div><Lbl>Y AXIS</Lbl>
              <select value={scatterY} onChange={e=>setScatterY(e.target.value)} className={inp} style={{appearance:"menulist"}}>
                {trainingMetrics.map(m=>(<option key={m.id} value={m.id}>{m.label}</option>))}
              </select>
            </div>
          </div>
          <div className="bg-s2 border border-border rounded-[10px] p-3.5">
            {scatterData.points.length < 2 ? <Empty>Need 2+ entries with both metrics logged</Empty> : (
              <>
                <div className="font-mono text-[9px] text-muted mb-1.5">
                  {scatterData.points.length} entries
                </div>
                <ScatterChart data={scatterData.points}
                  xLabel={scatterData.xm?.label} yLabel={scatterData.ym?.label}
                  color="var(--color-accent)"
                  xFormat={v=>scatterData.xm?.unit==="idx"?grades[Math.round(v)]:v.toFixed(1)}
                  yFormat={v=>scatterData.ym?.unit==="idx"?grades[Math.round(v)]:v.toFixed(1)}/>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
