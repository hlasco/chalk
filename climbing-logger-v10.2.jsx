import { useState, useMemo, useEffect, useRef, useCallback } from "react";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap";
document.head.appendChild(fontLink);

// ── Grade systems ─────────────────────────────────────────────────────────────
const V_GRADES     = ["VB","V0","V1","V2","V3","V4","V5","V6","V7","V8","V9","V10","V11","V12","V13","V14","V15","V16","V17"];
const FONT_GRADES  = ["3","3+","4","4+","5","5+","6A","6A+","6B","6B+","6C","6C+","7A","7A+","7B","7B+","7C","7C+","8A","8A+","8B","8B+","8C","8C+","9A"];

const DEFAULT_GRADE_COLORS = [
  "#6be87a","#6be87a","#9fef68","#d4f542","#f5d420","#f5a020","#f06828",
  "#e83838","#e038a0","#b038e8","#8b5cf6","#6366f1","#3b82f6","#0ea5e9",
  "#06b6d4","#10b981","#34d399","#6ee7b7","#fbbf24","#fb923c","#f87171",
  "#ec4899","#d946ef","#a855f7","#7c3aed",
];

const gradesFor = system => (system === "Font" ? FONT_GRADES : V_GRADES);

// Resolve a grade's colour: gym ranges first, then default palette
const gradeColor = (gi, gym) => {
  if (gym?.ranges?.length) {
    const r = gym.ranges.find(r => gi >= r.minGi && gi <= r.maxGi);
    if (r) return r.color;
  }
  return DEFAULT_GRADE_COLORS[gi] ?? "#888";
};

// Resolve the tier NAME for a grade (e.g. "Yellow") for display alongside
const gradeTierName = (gi, gym) => {
  if (!gym?.ranges?.length) return null;
  return gym.ranges.find(r => gi >= r.minGi && gi <= r.maxGi)?.name || null;
};

// ── Styles (boards included as tags) ──────────────────────────────────────────
const STYLES = [
  "Crimp","Sloper","Pinch","Jug",
  "Overhang","Slab","Vertical","Roof",
  "Dynamic","Technical","Compression",
  "Kilter","Tension","Moon Board","Spray Wall",
];

// ── Session goal presets ──────────────────────────────────────────────────────
const SESSION_GOALS = [
  "Free session","Max Boulder","Power","Endurance",
  "Technique","Volume","Project","Strength",
];
const EXERCISE_CATEGORIES = ["Strength","Power","Endurance","On-the-wall","Mobility","Technique","Custom"];

const BUILTIN_EXERCISES = [
  // Strength
  { id:"ex_hang",    name:"Hangboard Repeaters", builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"reps",label:"Reps/Set",unit:""},{key:"hangSec",label:"Hang",unit:"s"},{key:"restSec",label:"Rep Rest",unit:"s"},{key:"edgeMm",label:"Edge",unit:"mm"},{key:"weightKg",label:"Weight",unit:"kg"}] },
  { id:"ex_maxhang", name:"Max Hang",         builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"hangSec",label:"Hang",unit:"s"},{key:"edgeMm",label:"Edge",unit:"mm"},{key:"weightKg",label:"Weight",unit:"kg"}] },
  { id:"ex_pullup",  name:"Weighted Pull-up", builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"reps",label:"Reps",unit:""},{key:"weightKg",label:"Weight",unit:"kg"}] },
  { id:"ex_lock",    name:"Lock-off",         builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"holdSec",label:"Hold",unit:"s"},{key:"weightKg",label:"Weight",unit:"kg"}] },
  { id:"ex_core",    name:"Core",             builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"holdSec",label:"Hold",unit:"s"}] },

  // Power
  { id:"ex_campus",  name:"Campus Ladders",   builtin:true, category:"Power",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"reps",label:"Reps",unit:""}] },
  { id:"ex_limit",   name:"Limit Bouldering", builtin:true, category:"Power",
    fields:[{key:"problems",label:"Problems",unit:""},{key:"attempts",label:"Attempts",unit:""}] },

  // On-the-wall
  { id:"ex_4x4",     name:"4×4", builtin:true, category:"On-the-wall",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"climbs",label:"Climbs/Set",unit:""},{key:"targetGi",label:"Target Grade",unit:"idx"}] },
  { id:"ex_arc",     name:"ARC / Traverse", builtin:true, category:"On-the-wall",
    fields:[{key:"durationMin",label:"Duration",unit:"min"},{key:"intensity",label:"Intensity",unit:"/10"}] },
  { id:"ex_linkups", name:"Link-ups", builtin:true, category:"On-the-wall",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"problems",label:"Problems/Set",unit:""}] },

  // Endurance
  { id:"ex_laps",    name:"Route Laps", builtin:true, category:"Endurance",
    fields:[{key:"laps",label:"Laps",unit:""},{key:"gradeGi",label:"Grade",unit:"idx"}] },

  // Mobility
  { id:"ex_stretch", name:"Stretching", builtin:true, category:"Mobility",
    fields:[{key:"durationMin",label:"Duration",unit:"min"}] },

  // Technique
  { id:"ex_silent",  name:"Silent Feet", builtin:true, category:"Technique",
    fields:[{key:"durationMin",label:"Duration",unit:"min"},{key:"problems",label:"Problems",unit:""}] },
];

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#080808", surface:"#111", s2:"#181818", border:"#222",
  accent:"#d4f542", text:"#f0f0f0", muted:"#555", dim:"#252525",
  red:"#f06060", green:"#4ade80", blue:"#60a8f8", purple:"#a78bfa",
  font:"Syne,sans-serif", mono:"'DM Mono',monospace",
};

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${T.bg};overscroll-behavior:none;}
  button{-webkit-appearance:none;appearance:none;cursor:pointer;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:#252525;border-radius:2px;}
  input,textarea,select{outline:none;}
  input[type=number]{-moz-appearance:textfield;}
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .fade-up{animation:fadeUp 0.15s ease both;}
`;

// ── Seed data ─────────────────────────────────────────────────────────────────
const mkDate = d => new Date(Date.now()-d*86400000).toISOString().slice(0,10);
let _id = 600;
const uid = () => ++_id;

const DEFAULT_GYMS = [
  { id:"gym_arch", name:"The Arch", ranges:[] },  // no ranges → default palette
  { id:"gym_home", name:"Home Board", ranges:[] },
  { id:"gym_bloc", name:"Bloc Shop",
    ranges:[
      { name:"Yellow",  color:"#f5e030", minGi:0, maxGi:2 },
      { name:"Green",   color:"#4ade80", minGi:3, maxGi:4 },
      { name:"Blue",    color:"#60a5fa", minGi:5, maxGi:6 },
      { name:"Red",     color:"#f87171", minGi:7, maxGi:8 },
      { name:"Purple",  color:"#c084fc", minGi:9, maxGi:10 },
      { name:"Black",   color:"#e5e5e5", minGi:11, maxGi:14 },
    ],
  },
];

const SEED_SESSIONS = [
  { id:1,gymId:"gym_arch",date:mkDate(22),ended:true, startedAt:Date.now()-22*86400000, durationMin:105, boulders:[
    {id:1,gi:4,styles:["Crimp","Overhang"],perceived:2,sends:1,attempts:3},
    {id:2,gi:4,styles:["Sloper"],perceived:1,sends:1,attempts:2},
    {id:3,gi:5,styles:["Dynamic"],perceived:0,sends:1,attempts:1},
    {id:4,gi:5,styles:["Crimp"],perceived:2,sends:0,attempts:4},
    {id:5,gi:3,styles:["Slab"],perceived:1,sends:1,attempts:1},
  ],training:[]},
  { id:2,gymId:"gym_arch",date:mkDate(17),ended:true, durationMin:95, boulders:[
    {id:1,gi:5,styles:["Crimp"],perceived:1,sends:1,attempts:2},
    {id:2,gi:5,styles:["Compression"],perceived:2,sends:0,attempts:5},
    {id:3,gi:6,styles:["Dynamic"],perceived:2,sends:0,attempts:3},
  ],training:[
    {id:1,exId:"ex_hang",values:{sets:6,hangSec:7,restSec:3,edgeMm:20,weightKg:0},note:""},
    {id:2,exId:"ex_4x4",values:{sets:4,climbs:4,targetGi:4},note:"on comp wall"},
  ]},
  { id:3,gymId:"gym_home",date:mkDate(12),ended:true, durationMin:75, boulders:[
    {id:1,gi:5,styles:["Kilter","Overhang"],perceived:1,sends:1,attempts:3},
    {id:2,gi:6,styles:["Kilter","Crimp"],perceived:2,sends:0,attempts:4},
  ], training:[
    {id:1,exId:"ex_pullup",values:{sets:4,reps:5,weightKg:15},note:""},
    {id:2,exId:"ex_maxhang",values:{sets:5,hangSec:10,edgeMm:20,weightKg:10},note:""},
  ]},
  { id:4,gymId:"gym_arch",date:mkDate(7),ended:true, durationMin:120, boulders:[
    {id:1,gi:6,styles:["Crimp","Vertical"],perceived:1,sends:1,attempts:3},
    {id:2,gi:6,styles:["Overhang","Dynamic"],perceived:2,sends:0,attempts:6},
    {id:3,gi:5,styles:["Sloper"],perceived:1,sends:1,attempts:2},
    {id:4,gi:7,styles:["Dynamic"],perceived:2,sends:0,attempts:3},
  ],training:[
    {id:1,exId:"ex_pullup",values:{sets:4,reps:5,weightKg:17.5},note:""},
    {id:2,exId:"ex_maxhang",values:{sets:5,hangSec:10,edgeMm:18,weightKg:12},note:""},
  ]},
  { id:5,gymId:"gym_bloc",date:mkDate(4),ended:true, durationMin:90, boulders:[
    {id:1,gi:4,styles:["Jug"],perceived:1,sends:1,attempts:1},
    {id:2,gi:5,styles:["Crimp"],perceived:0,sends:1,attempts:2},
    {id:3,gi:6,styles:["Dynamic"],perceived:1,sends:1,attempts:3},
  ],training:[]},
  { id:6,gymId:"gym_home",date:mkDate(1),ended:true, durationMin:60, boulders:[], training:[
    {id:1,exId:"ex_pullup",values:{sets:4,reps:6,weightKg:20},note:""},
    {id:2,exId:"ex_maxhang",values:{sets:5,hangSec:10,edgeMm:20,weightKg:12.5},note:""},
    {id:3,exId:"ex_maxhang",values:{sets:5,hangSec:10,edgeMm:15,weightKg:5},note:""},
  ]},
];

// ── UI atoms ──────────────────────────────────────────────────────────────────
const Lbl = ({children,style={}}) => (
  <div style={{fontFamily:T.mono,fontSize:10,color:T.muted,letterSpacing:2,marginBottom:8,...style}}>{children}</div>
);
const Empty = ({children}) => (
  <div style={{fontFamily:T.mono,fontSize:12,color:T.muted,padding:"20px 0",textAlign:"center"}}>{children}</div>
);
const Inp = {
  background:T.s2,border:`1px solid ${T.border}`,borderRadius:6,
  color:T.text,fontFamily:T.mono,fontSize:12,padding:"9px 12px",width:"100%",
};
const pill = (on, col=T.accent) => ({
  padding:"6px 14px",borderRadius:20,
  border:`1px solid ${on?col:T.border}`,
  background:on?`${col}20`:"transparent",
  color:on?col:T.muted,
  fontFamily:T.mono,fontSize:11,cursor:"pointer",whiteSpace:"nowrap",
});

// ── Elapsed-time hook ─────────────────────────────────────────────────────────
function useElapsedMinutes(startedAt) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [startedAt]);
  if (!startedAt) return 0;
  return Math.floor((now - startedAt) / 60000);
}
const fmtDuration = min => {
  if (!min && min!==0) return "—";
  if (min < 60) return `${min}m`;
  return `${Math.floor(min/60)}h ${min%60}m`;
};

// ── InlineDelete — no modals, no z-index, just works ─────────────────────────
// Tap ✕ → shows "Sure? Yes No" in place. Yes calls onDelete. No resets.
function InlineDelete({ onDelete, size = "small" }) {
  const [asking, setAsking] = useState(false);
  const btnBase = {
    background:"none", border:`1px solid ${T.border}`, borderRadius:6,
    fontFamily:T.mono, cursor:"pointer", lineHeight:1,
    padding: size==="large" ? "9px 14px" : "3px 8px",
    fontSize: size==="large" ? 12 : 10,
  };
  if (asking) return (
    <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
      <span style={{fontFamily:T.mono,fontSize:10,color:T.muted}}>Sure?</span>
      <button onClick={()=>{setAsking(false);onDelete();}} style={{...btnBase,color:T.red,borderColor:`${T.red}55`}}>Yes</button>
      <button onClick={()=>setAsking(false)} style={{...btnBase,color:T.muted}}>No</button>
    </div>
  );
  return (
    <button onClick={()=>setAsking(true)} style={{...btnBase,color:T.muted}}>✕</button>
  );
}

// ── Boulder factory — single source of truth for boulder-shaped data ─────────
// Used by both the main log form and by SetLogPanel's climb entries.
function makeBoulder({ gi, styles=[], sent=true, attempts=1, perceived=1, source=null }) {
  return {
    id: uid(),
    gi,
    styles: [...styles],
    perceived,              // 0=Soft, 1=On, 2=Hard
    sends: sent ? 1 : 0,
    attempts,
    ...(source ? { source } : {}),
  };
}

// ── GradeSelector — THE grade picker, three display modes ────────────────────
// mode: "grid"    = full rainbow 5-col grid (used in main log + stats filters)
//       "tiers"   = 3-col color tier buttons (used when gym has colors + useColors)
//       "compact" = 5-grade scrolling window (used inside SetLogPanel rows)
function GradeSelector({ gi, setGi, grades, gym, mode="grid", useColors=false }) {
  const gymHasRanges = !!gym?.ranges?.length;

  // TIERS MODE — 3-col color buttons, used when user explicitly wants color mode
  if (mode === "tiers" && gymHasRanges && useColors) {
    return (
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
        {gym.ranges.map((r,i)=>{
          const midGi = Math.round((r.minGi + r.maxGi) / 2);
          const on = gi >= r.minGi && gi <= r.maxGi;
          const fromLabel = grades[r.minGi] ?? `#${r.minGi}`;
          const toLabel   = grades[r.maxGi] ?? `#${r.maxGi}`;
          const rangeStr  = r.minGi === r.maxGi ? fromLabel : `${fromLabel} ${toLabel}`;
          return (
            <button key={i} onClick={()=>setGi(midGi)} style={{
              padding:"12px 6px", borderRadius:8,
              border:`1px solid ${r.color}`,
              background: on ? "#242424" : "#1a1a1a",
              color: r.color,
              fontFamily:T.mono, fontSize:12,
              fontWeight: on ? 600 : 300,
              display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              filter: on ? "none" : "brightness(0.55)",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:9,height:9,borderRadius:"50%",background:r.color,flexShrink:0,display:"inline-block"}}/>
                <span>{r.name||"—"}</span>
              </div>
              <span style={{fontSize:9,letterSpacing:1}}>{rangeStr}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // COMPACT MODE — 5-grade window with scroll arrows (used in SetLogPanel)
  if (mode === "compact") {
    return <GradeCompactPicker gi={gi} setGi={setGi} grades={grades} gym={gym}/>;
  }

  // GRID MODE — default full grid
  // With gym colours but showing grades: tinted by tier colour, dim when unselected
  if (gymHasRanges) {
    return (
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
        {grades.map((g,gidx)=>{
          const tier = gym.ranges.find(r => gidx >= r.minGi && gidx <= r.maxGi);
          const col  = tier?.color ?? T.muted;
          const on   = gi === gidx;
          return (
            <button key={gidx} onClick={()=>setGi(gidx)} style={{
              padding:"11px 0", borderRadius:8,
              border:`1px solid ${col}`,
              background: on ? "#242424" : "#1a1a1a",
              color: col,
              fontFamily:T.mono, fontSize:12,
              fontWeight: on ? 600 : 300,
              filter: on ? "brightness(0.9)" : "brightness(0.45)",
            }}>{g}</button>
          );
        })}
      </div>
    );
  }

  // No gym colour scale — fully neutral
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
      {grades.map((g,gidx)=>{
        const on = gi === gidx;
        return (
          <button key={gidx} onClick={()=>setGi(gidx)} style={{
            padding:"11px 0", borderRadius:8,
            border:`1px solid ${on ? T.text : T.border}`,
            background: on ? "#242424" : "#1a1a1a",
            color: on ? T.text : T.muted,
            fontFamily:T.mono, fontSize:12,
            fontWeight: on ? 600 : 300,
          }}>{g}</button>
        );
      })}
    </div>
  );
}

// Internal: compact 5-grade scrolling picker (used inside slot rows)
function GradeCompactPicker({ gi, setGi, grades, gym }) {
  const [offset, setOffset] = useState(0);
  const centre = gi + offset;
  const windowGrades = [-2,-1,0,1,2].map(off => {
    const idx = centre + off;
    return { idx, label: idx>=0&&idx<grades.length ? grades[idx] : null };
  });
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <button onClick={()=>setOffset(p=>p-1)} style={{
        background:"none",border:`1px solid ${T.border}`,borderRadius:6,
        color:T.muted,padding:"4px 8px",fontFamily:T.mono,fontSize:14,
      }}>‹</button>
      <div style={{flex:1,display:"flex",gap:5,justifyContent:"center"}}>
        {windowGrades.map(({idx,label:gl})=>{
          if (!gl) return <div key={idx} style={{width:44}}/>;
          const on = idx === gi;
          const c = gradeColor(idx, gym);
          return (
            <button key={idx} onClick={()=>{setGi(idx);setOffset(0);}} style={{
              padding:"8px 4px",borderRadius:6,minWidth:44,
              border:`1px solid ${on?c:T.border}`,
              background:on?"#242424":"#181818",
              color:on?c:T.muted,
              fontFamily:T.mono,fontSize:12,fontWeight:on?600:300,
            }}>{gl}</button>
          );
        })}
      </div>
      <button onClick={()=>setOffset(p=>p+1)} style={{
        background:"none",border:`1px solid ${T.border}`,borderRadius:6,
        color:T.muted,padding:"4px 8px",fontFamily:T.mono,fontSize:14,
      }}>›</button>
    </div>
  );
}

// ── StyleSelector — shared style-chip row (pill toggle multi-select) ─────────
function StyleSelector({ selected, setSelected, size="normal" }) {
  const toggle = s => setSelected(p => p.includes(s) ? p.filter(x=>x!==s) : [...p,s]);
  const compact = size === "compact";
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap: compact?5:6}}>
      {STYLES.map(s=>{
        const on = selected.includes(s);
        return (
          <button key={s} onClick={()=>toggle(s)} style={{
            padding: compact ? "4px 10px" : "6px 14px",
            borderRadius: compact ? 14 : 20,
            border:`1px solid ${on?T.accent:T.border}`,
            background:on?`${T.accent}18`:"transparent",
            color:on?T.accent:T.muted,
            fontFamily:T.mono, fontSize: compact ? 9 : 11,
            whiteSpace:"nowrap",
          }}>{s}</button>
        );
      })}
    </div>
  );
}

// ── SendFellToggle — shared send/fell button (used in main log + setLog) ────
function SendFellToggle({ sent, setSent, size="normal" }) {
  const compact = size === "compact";
  if (compact) {
    return (
      <button onClick={()=>setSent(!sent)} style={{
        padding:"6px 10px", borderRadius:6,
        border:`1px solid ${sent?T.green:T.red}`,
        background:"none", color:sent?T.green:T.red,
        fontFamily:T.mono, fontSize:11, whiteSpace:"nowrap",
      }}>{sent?"✓ SEND":"✗ FELL"}</button>
    );
  }
  // Full two-button version for main form
  return (
    <div style={{display:"flex",gap:8}}>
      <button onClick={()=>setSent(true)} style={{...pill(sent,T.green),flex:1,textAlign:"center"}}>✓ SEND</button>
      <button onClick={()=>setSent(false)} style={{...pill(!sent,T.red),flex:1,textAlign:"center"}}>✗ PROJ</button>
    </div>
  );
}

// ── BoulderRow — shared "This session" and setLog row rendering ──────────────
// Renders a single logged boulder. `tierDot` shows small colored dot when gym has ranges.
function BoulderRow({ boulder, gym, grades, onDelete, compact=false }) {
  const col = gradeColor(boulder.gi, null);
  const tierCol = gym?.ranges?.length ? gradeColor(boulder.gi, gym) : null;
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
      {tierCol && <span style={{width:9,height:9,borderRadius:"50%",background:tierCol,flexShrink:0,display:"inline-block"}}/>}
      <div style={{fontFamily:T.mono,fontSize:13,fontWeight:500,color:col,width:38}}>{grades[boulder.gi]??boulder.gi}</div>
      <div style={{flex:1,fontFamily:T.mono,fontSize:10,color:T.muted}}>
        {boulder.styles.join(", ")||"—"}{boulder.perceived!=null?` · ${["Soft","On","Hard"][boulder.perceived]}`:""}
      </div>
      <div style={{fontFamily:T.mono,fontSize:11,color:boulder.sends>0?T.green:T.red}}>
        {boulder.sends>0?"✓":"✗"} ({boulder.attempts})
      </div>
      {onDelete && <InlineDelete onDelete={onDelete}/>}
    </div>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────────
function LineChart({ data, color=T.accent, yFormat }) {
  if (!data || data.length < 2) return <Empty>Not enough data yet</Empty>;
  const vals = data.map(d=>d.v);
  const min = Math.min(...vals), max = Math.max(...vals), rng = max-min||1;
  const W=300,H=90,px=22;
  const sx=i=>px+(i/(data.length-1))*(W-px*2);
  const sy=v=>H-px-((v-min)/rng)*(H-px*2);
  const pts=vals.map((v,i)=>`${sx(i)},${sy(v)}`).join(" ");
  const id=`g${color.replace(/\W/g,"")}`;
  const fmt = v => yFormat ? yFormat(v) : (Number.isInteger(v)?v:v.toFixed(1));
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points={`${sx(0)},${H-px} ${pts} ${sx(data.length-1)},${H-px}`} fill={`url(#${id})`}/>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
        {vals.map((v,i)=>(
          <g key={i}>
            <circle cx={sx(i)} cy={sy(v)} r="3.5" fill={color}/>
            <text x={sx(i)} y={sy(v)-9} textAnchor="middle" style={{fontFamily:T.mono,fontSize:9,fill:color}}>{fmt(v)}</text>
          </g>
        ))}
      </svg>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
        {data.map((d,i)=><span key={i} style={{fontFamily:T.mono,fontSize:8,color:T.muted}}>{d.label}</span>)}
      </div>
    </div>
  );
}

function ScatterChart({ data, xLabel, yLabel, color=T.accent, xFormat, yFormat }) {
  if (!data || data.length < 2) return <Empty>Not enough data yet</Empty>;
  const xs = data.map(d=>d.x), ys = data.map(d=>d.y);
  const xmin=Math.min(...xs), xmax=Math.max(...xs), xrng=xmax-xmin||1;
  const ymin=Math.min(...ys), ymax=Math.max(...ys), yrng=ymax-ymin||1;
  const W=300,H=150,px=36;
  const sx=v=>px+((v-xmin)/xrng)*(W-px*2);
  const sy=v=>H-px-((v-ymin)/yrng)*(H-px*2);
  const fmtX=v=>xFormat?xFormat(v):(Number.isInteger(v)?v:v.toFixed(1));
  const fmtY=v=>yFormat?yFormat(v):(Number.isInteger(v)?v:v.toFixed(1));
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H+6}`} style={{overflow:"visible"}}>
      <line x1={px} y1={H-px} x2={W-px} y2={H-px} stroke={T.dim} strokeWidth="1"/>
      <line x1={px} y1={px} x2={px} y2={H-px} stroke={T.dim} strokeWidth="1"/>
      {[0,0.5,1].map(t=>{const v=ymin+t*yrng;return(
        <g key={`y${t}`}>
          <line x1={px-3} x2={px} y1={sy(v)} y2={sy(v)} stroke={T.muted} strokeWidth="1"/>
          <text x={px-5} y={sy(v)+3} textAnchor="end" style={{fontFamily:T.mono,fontSize:8,fill:T.muted}}>{fmtY(v)}</text>
        </g>
      );})}
      {[0,0.5,1].map(t=>{const v=xmin+t*xrng;return(
        <g key={`x${t}`}>
          <line x1={sx(v)} x2={sx(v)} y1={H-px} y2={H-px+3} stroke={T.muted} strokeWidth="1"/>
          <text x={sx(v)} y={H-px+12} textAnchor="middle" style={{fontFamily:T.mono,fontSize:8,fill:T.muted}}>{fmtX(v)}</text>
        </g>
      );})}
      <text x={W/2} y={H+4} textAnchor="middle" style={{fontFamily:T.mono,fontSize:9,fill:T.muted,letterSpacing:1}}>{xLabel}</text>
      <text x={6} y={H/2} textAnchor="middle" transform={`rotate(-90 6 ${H/2})`} style={{fontFamily:T.mono,fontSize:9,fill:T.muted,letterSpacing:1}}>{yLabel}</text>
      {data.map((d,i)=>(<circle key={i} cx={sx(d.x)} cy={sy(d.y)} r="4" fill={color} stroke={T.bg} strokeWidth="1"/>))}
    </svg>
  );
}

function Bars({ data, colorFn }) {
  const max = Math.max(...data.map(d=>d.v),1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:5,height:100}}>
      {data.map((d,i)=>{
        const col=colorFn?colorFn(d,i):T.accent;
        return (
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,gap:3}}>
            <span style={{fontFamily:T.mono,fontSize:9,color:col}}>{d.v||""}</span>
            <div style={{width:"100%",flex:1,display:"flex",alignItems:"flex-end"}}>
              <div style={{width:"100%",height:`${Math.max(3,(d.v/max)*100)}%`,background:col,borderRadius:"3px 3px 0 0"}}/>
            </div>
            <span style={{fontFamily:T.mono,fontSize:9,color:T.muted,textAlign:"center",lineHeight:1.2}}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Radar({ data }) {
  if (!data || data.length < 3) return null;
  const n=data.length, cx=110,cy=110,r=76;
  const ang=i=>(i/n)*2*Math.PI-Math.PI/2;
  const pt=(i,rad)=>[cx+rad*Math.cos(ang(i)),cy+rad*Math.sin(ang(i))];
  return (
    <svg width="100%" viewBox="0 0 220 220">
      {[.25,.5,.75,1].map(t=>(<polygon key={t} points={data.map((_,i)=>pt(i,r*t).join(",")).join(" ")} fill="none" stroke={T.dim} strokeWidth="1"/>))}
      {data.map((_,i)=>{const [x2,y2]=pt(i,r);return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke={T.dim} strokeWidth="1"/>;})}
      <polygon points={data.map((d,i)=>pt(i,r*Math.max(.04,d.v)).join(",")).join(" ")} fill={`${T.accent}18`} stroke={T.accent} strokeWidth="1.5"/>
      {data.map((d,i)=>{const [x,y]=pt(i,r*Math.max(.04,d.v));return <circle key={i} cx={x} cy={y} r="3.5" fill={T.accent}/>;})}
      {data.map((d,i)=>{const [x,y]=pt(i,r+20);return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" style={{fontFamily:T.mono,fontSize:9,fill:"#888"}}>{d.label}</text>;})}
    </svg>
  );
}

function Pyramid({ sessions, gradeSystem }) {
  const grades = gradesFor(gradeSystem);
  const counts={};
  sessions.forEach(s=>{
    // Regular boulders
    s.boulders.forEach(b=>{
      if(b.sends>0) counts[b.gi]=(counts[b.gi]||0)+b.sends;
    });
    // On-the-wall exercise setLogs (4x4, link-ups, etc.)
    s.training.forEach(t=>{
      (Array.isArray(t.setLogs)?t.setLogs:[]).forEach(sl=>{
        (sl.climbs||[]).forEach(c=>{
          if(c.sent) counts[c.gi]=(counts[c.gi]||0)+1;
        });
      });
    });
  });
  const gis=Object.keys(counts).map(Number).sort((a,b)=>a-b);
  if(!gis.length) return <Empty>No sends yet</Empty>;
  const max=Math.max(...gis.map(i=>counts[i]));
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {[...gis].reverse().map(gi=>{
        const col = DEFAULT_GRADE_COLORS[gi] ?? "#888";
        return (
          <div key={gi} style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontFamily:T.mono,fontSize:11,color:col,width:38,textAlign:"right"}}>{grades[gi]??`#${gi}`}</div>
            <div style={{flex:1,height:11,background:T.s2,borderRadius:2,overflow:"hidden"}}>
              <div style={{width:`${(counts[gi]/max)*100}%`,height:"100%",background:col,borderRadius:2}}/>
            </div>
            <div style={{fontFamily:T.mono,fontSize:10,color:T.muted,width:14}}>{counts[gi]}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Plot metrics catalog ──────────────────────────────────────────────────────
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

const PC = [T.accent,"#60a8f8","#f87171","#a78bfa","#34d399","#fb923c"];

// ── Plot Builder ──────────────────────────────────────────────────────────────
function PlotBuilder({ sessions, exercises, gyms, gradeSystem }) {
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
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[{id:"line",label:"Time series"},{id:"scatter",label:"X vs Y"}].map(m=>(
          <button key={m.id} onClick={()=>setMode(m.id)} style={{...pill(mode===m.id),flex:1,textAlign:"center",padding:"9px 4px"}}>{m.label}</button>
        ))}
      </div>

      {mode==="line" && (
        <>
          <Lbl>SELECT METRICS</Lbl>
          {groups.map(g=>(
            <div key={g} style={{marginBottom:14}}>
              <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,letterSpacing:2,marginBottom:7}}>{g.toUpperCase()}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {metrics.filter(m=>m.group===g).map(m=>{
                  const on=sel.includes(m.id),ci=sel.indexOf(m.id);
                  const col=on?PC[ci%PC.length]:T.border;
                  return (
                    <button key={m.id} onClick={()=>toggle(m.id)} style={{
                      padding:"5px 12px",borderRadius:20,fontFamily:T.mono,fontSize:10,cursor:"pointer",
                      border:`1px solid ${col}`,
                      background:on?`${PC[ci%PC.length]}18`:"transparent",
                      color:on?PC[ci%PC.length]:T.muted,
                    }}>{m.label}</button>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{background:T.s2,border:`1px solid ${T.border}`,borderRadius:10,padding:14,marginTop:4}}>
            {lineNorm.length===0 ? <Empty>Select metrics with logged data</Empty> : (
              <>
                <svg width="100%" viewBox={`0 0 ${W} ${H+20}`} style={{overflow:"visible"}}>
                  {[0,.5,1].map(t=><line key={t} x1={px} x2={W-px} y1={px+(1-t)*(H-px*2)} y2={px+(1-t)*(H-px*2)} stroke={T.dim} strokeWidth="1"/>)}
                  {lineNorm.map(s=>{
                    const pts=s.npts.map(p=>`${xp(p.label)},${px+(1-p.n)*(H-px*2)}`).join(" ");
                    return (
                      <g key={s.id}>
                        <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round"/>
                        {s.npts.map((p,i)=>(
                          <g key={i}>
                            <circle cx={xp(p.label)} cy={px+(1-p.n)*(H-px*2)} r="4" fill={s.color}/>
                            <text x={xp(p.label)} y={px+(1-p.n)*(H-px*2)-10} textAnchor="middle" style={{fontFamily:T.mono,fontSize:8.5,fill:s.color}}>{formatValue(s.m,p.v)}</text>
                          </g>
                        ))}
                      </g>
                    );
                  })}
                  {allLabels.map((l,i)=>(<text key={i} x={xp(l)} y={H+14} textAnchor="middle" style={{fontFamily:T.mono,fontSize:8,fill:T.muted}}>{l}</text>))}
                </svg>
                <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:4}}>
                  {lineNorm.map(s=>(
                    <div key={s.id} style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:14,height:3,background:s.color,borderRadius:2}}/>
                      <span style={{fontFamily:T.mono,fontSize:9,color:"#888"}}>{s.m?.label}</span>
                      <span style={{fontFamily:T.mono,fontSize:9,color:s.color}}>[{formatValue(s.m,s.mn)} – {formatValue(s.m,s.mx)}]</span>
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div><Lbl>X AXIS</Lbl>
              <select value={scatterX} onChange={e=>setScatterX(e.target.value)} style={{...Inp,appearance:"menulist"}}>
                {trainingMetrics.map(m=>(<option key={m.id} value={m.id}>{m.label}</option>))}
              </select>
            </div>
            <div><Lbl>Y AXIS</Lbl>
              <select value={scatterY} onChange={e=>setScatterY(e.target.value)} style={{...Inp,appearance:"menulist"}}>
                {trainingMetrics.map(m=>(<option key={m.id} value={m.id}>{m.label}</option>))}
              </select>
            </div>
          </div>
          <div style={{background:T.s2,border:`1px solid ${T.border}`,borderRadius:10,padding:14}}>
            {scatterData.points.length < 2 ? <Empty>Need 2+ entries with both metrics logged</Empty> : (
              <>
                <div style={{fontFamily:T.mono,fontSize:9,color:T.muted,marginBottom:6}}>
                  {scatterData.points.length} entries
                </div>
                <ScatterChart data={scatterData.points}
                  xLabel={scatterData.xm?.label} yLabel={scatterData.ym?.label}
                  color={T.accent}
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

// ── Timer ─────────────────────────────────────────────────────────────────────
function makeBeep(freq, dur=0.09, vol=0.42) {
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
    osc.start(); osc.stop(ctx.currentTime+dur+0.05);
  } catch(e) {}
}

// Build a unified timer config from exercise id + current form values
function buildTimerConfig(exId, values, ex) {
  const sets       = Math.max(1, +values.sets   || 1);
  const setRestSec = +values.restBetweenSetsSec >= 0 ? +values.restBetweenSetsSec : 120;

  const timed = (workLabel, workSec, repsPerSet=1, shortRestSec=0, extra={}) =>
    ({ sets, repsPerSet, workLabel, workSec:Math.max(1,workSec), shortRestSec:Math.max(0,shortRestSec), setRestSec, ...extra });
  const tap = (workLabel, repsPerSet=1, shortRestSec=0, extra={}) =>
    ({ sets, repsPerSet, workLabel, workSec:null, shortRestSec:Math.max(0,shortRestSec), setRestSec, ...extra });

  if (exId==="ex_hang")    return timed("HANG",  +values.hangSec||7,  Math.max(1,+values.reps||1), +values.restSec||3,  {edgeMm:+values.edgeMm||null, weightKg:+values.weightKg||0});
  if (exId==="ex_maxhang") return timed("HANG",  +values.hangSec||10, 1, 0, {edgeMm:+values.edgeMm||null, weightKg:+values.weightKg||0});
  if (exId==="ex_lock")    return timed("HOLD",  +values.holdSec||10, 1, 0, {weightKg:+values.weightKg||0});
  if (exId==="ex_core")    return timed("HOLD",  +values.holdSec||30);
  if (exId==="ex_arc")     return {...timed("TRAVERSE", (+values.durationMin||20)*60), sets:1, setRestSec:0};
  if (exId==="ex_pullup")  return tap(`${+values.reps||"?"}× PULL-UPS`, 1, 0, {weightKg:+values.weightKg||0});
  if (exId==="ex_pushup")  return tap(`${+values.reps||"?"}× PUSH-UPS`);
  if (exId==="ex_campus")  return tap("CAMPUS",  Math.max(1,+values.reps||1), 10);
  if (exId==="ex_4x4")     return tap("SET",     1, 0, {logPerSet:true, climbsPerSet:Math.max(1,+values.climbs||4), targetGi:+values.targetGi||4});
  if (exId==="ex_linkups") return tap("SET",     1, 0, {logPerSet:true, climbsPerSet:Math.max(1,+values.problems||1), targetGi:4});
  if (exId==="ex_limit")   return {...tap("PROBLEM", 1, 30, {logPerSet:true, climbsPerSet:1, targetGi:4}), sets:Math.max(1,+values.problems||3)};
  if (exId==="ex_silent")  return {...tap("PROBLEM", Math.max(1,+values.problems||1), 10), sets:1, setRestSec:0};
  // Custom exercise: use timerCfg if defined on the exercise
  if (ex?.timerCfg) {
    if (ex.timerCfg.type === "tap") return tap(ex.timerCfg.label || "GO");
    if (ex.timerCfg.type === "timed" && ex.timerCfg.durationKey) {
      const dur = +values[ex.timerCfg.durationKey] || 30;
      return timed(ex.timerCfg.label || "GO", dur);
    }
  }
  // Auto-detect: use first seconds field if present
  const durField = ex?.fields?.find(f => f.unit==="s" && values[f.key]);
  if (durField) return timed("GO", +values[durField.key]);
  return tap("GO");
}

const PREP_SEC = 3;

// ── SetLogPanel — compact climb logger used inside SetTimer ───────────────────
// Shows during set rest so user can log what they just climbed.
// `n` = number of climb slots, `targetGi` = default grade to pre-fill.
// `existing` = already-saved array for this set (if revisiting).
// Calls `onSave([{gi, styles, sent}])` when done.
function SetLogPanel({ n, targetGi=4, grades, gym, existing, onSave, onSkip, label="CLIMB" }) {
  const initSlots = () => Array.from({length:n}, (_,i) => ({
    gi: existing?.[i]?.gi ?? targetGi,
    styles: existing?.[i]?.styles ?? [],
    sent: existing?.[i]?.sent ?? true,
  }));

  const [slots, setSlots] = useState(initSlots);
  const [activeSlot, setActiveSlot] = useState(null);

  const updSlot = (i, patch) => setSlots(p => p.map((s,j) => j===i ? {...s,...patch} : s));

  const save = () => onSave(slots.map(({gi,styles,sent})=>({gi,styles,sent})));

  return (
    <div style={{
      background:"#0c0c0c", borderTop:`1px solid ${T.border}`,
      padding:"16px 20px 20px", maxHeight:"55vh", overflowY:"auto",
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:T.mono,fontSize:10,color:T.muted,letterSpacing:2}}>
          LOG {n} {label.toUpperCase()}{n!==1?"S":""}
        </div>
        <button onClick={onSkip} style={{
          fontFamily:T.mono,fontSize:10,color:T.dim,background:"none",border:"none",letterSpacing:1,
        }}>skip</button>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {slots.map((slot,i)=>{
          const col = gradeColor(slot.gi, gym);
          const isOpen = activeSlot === i;
          return (
            <div key={i} style={{background:T.surface,borderRadius:10,overflow:"hidden",
              border:`1px solid ${isOpen?T.accent:T.border}`}}>
              {/* Slot header: index, grade button, send/fell, tiny style preview */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px"}}>
                <div style={{fontFamily:T.mono,fontSize:10,color:T.muted,width:14}}>{i+1}</div>

                <button onClick={()=>setActiveSlot(isOpen?null:i)} style={{
                  padding:"6px 12px",borderRadius:6,
                  border:`1px solid ${col}`,background:isOpen?`${col}20`:"#181818",
                  color:col,fontFamily:T.mono,fontSize:13,fontWeight:500,letterSpacing:1,
                  minWidth:46,textAlign:"center",
                }}>{grades[slot.gi]??`#${slot.gi}`}</button>

                <SendFellToggle
                  sent={slot.sent}
                  setSent={v=>updSlot(i,{sent:v})}
                  size="compact"
                />

                <div style={{flex:1,display:"flex",flexWrap:"wrap",gap:4}}>
                  {slot.styles.slice(0,2).map(s=>(
                    <span key={s} style={{
                      padding:"2px 8px",borderRadius:10,background:`${T.accent}18`,
                      color:T.accent,fontFamily:T.mono,fontSize:9,
                    }}>{s}</span>
                  ))}
                  {slot.styles.length>2&&<span style={{fontFamily:T.mono,fontSize:9,color:T.muted}}>+{slot.styles.length-2}</span>}
                </div>
              </div>

              {/* Expanded: compact grade picker + styles */}
              {isOpen && (
                <div style={{borderTop:`1px solid ${T.border}`,padding:"10px 12px"}}>
                  <div style={{marginBottom:10}}>
                    <GradeSelector
                      gi={slot.gi}
                      setGi={v=>updSlot(i,{gi:v})}
                      grades={grades}
                      gym={gym}
                      mode="compact"
                    />
                  </div>
                  <StyleSelector
                    selected={slot.styles}
                    setSelected={v=>updSlot(i,{styles:typeof v==="function"?v(slot.styles):v})}
                    size="compact"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={save} style={{
        width:"100%",marginTop:14,padding:"13px",borderRadius:10,border:"none",
        background:T.accent,color:"#080808",fontFamily:T.font,fontSize:13,fontWeight:800,
      }}>SAVE SET →</button>
    </div>
  );
}

// ── Summary grid shown on done screen ─────────────────────────────────────────
function SetSummaryGrid({ setLogs, sets, climbs, grades, gym, onUpdate }) {
  return (
    <div style={{width:"100%",maxWidth:380,padding:"0 4px"}}>
      {Array.from({length:sets},(_,si)=>{
        const log = setLogs[si]; // may be undefined if skipped
        return (
          <div key={si} style={{marginBottom:6}}>
            <div style={{fontFamily:T.mono,fontSize:9,color:T.muted,letterSpacing:2,marginBottom:4}}>SET {si+1}</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {Array.from({length:climbs},(_,ci)=>{
                const c = log?.climbs?.[ci];
                const col = c ? gradeColor(c.gi,gym) : T.border;
                return (
                  <div key={ci} style={{
                    padding:"5px 8px",borderRadius:6,minWidth:42,textAlign:"center",
                    border:`1px solid ${col}`,
                    background:c?"#1a1a1a":"#0f0f0f",
                    fontFamily:T.mono,fontSize:11,color:c?col:T.dim,
                  }}>
                    {c ? <>
                      {grades[c.gi]??`#${c.gi}`}
                      <div style={{fontSize:8,color:c.sent?T.green:T.red,marginTop:1}}>
                        {c.sent?"✓":"✗"}
                      </div>
                    </> : <span style={{color:T.dim}}>—</span>}
                  </div>
                );
              })}
              {!log && (
                <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,alignSelf:"center",marginLeft:4}}>
                  not logged
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SetTimer({ config, onClose, onLog, grades, gym }) {
  const { sets=1, repsPerSet=1, workLabel="GO", workSec=null,
    shortRestSec=0, setRestSec=120, edgeMm, weightKg,
    logPerSet=false, climbsPerSet=null, targetGi=4 } = config;
  // climbsPerSet: number of slots shown in SetLogPanel (for 4x4 = climbs/set).
  // Defaults to repsPerSet for backward compat.
  const logSlots = climbsPerSet ?? repsPerSet;

  const r = useRef({ phase:"prep", set:1, rep:1, left:PREP_SEC, paused:false, elapsed:0 });
  const [disp, setDisp]       = useState({...r.current});
  const [setLogs, setSetLogs] = useState({}); // {setNum: {climbs:[{gi,styles,sent}]}}
  const [showLogPanel, setShowLogPanel] = useState(false);
  const advanceRef = useRef(null);

  useEffect(() => {
    makeBeep(660, 0.1);

    const doAdvance = () => {
      const s = r.current;
      if (s.phase === "prep") {
        r.current = {...s, phase:"work", left:workSec??0, elapsed:0};
        makeBeep(1047, 0.12);
        setShowLogPanel(false);
      } else if (s.phase === "work") {
        const lastRep = s.rep >= repsPerSet, lastSet = s.set >= sets;
        if (!lastRep) {
          if (shortRestSec > 0) {
            r.current = {...s, phase:"shortRest", left:shortRestSec, elapsed:0};
            makeBeep(440, 0.09);
          } else {
            r.current = {...s, phase:"work", rep:s.rep+1, left:workSec??0, elapsed:0};
            makeBeep(880, 0.06, 0.2);
          }
          setShowLogPanel(false);
        } else if (!lastSet) {
          if (setRestSec > 0) {
            r.current = {...s, phase:"setRest", set:s.set+1, rep:1, left:setRestSec, elapsed:0};
            makeBeep(330, 0.15);
          } else {
            r.current = {...s, phase:"work", set:s.set+1, rep:1, left:workSec??0, elapsed:0};
            makeBeep(1047, 0.12);
          }
          // Show log panel for the completed set if logPerSet
          if (logPerSet) setShowLogPanel(true);
        } else {
          r.current = {...s, phase:"done", elapsed:0};
          makeBeep(660,0.12); setTimeout(()=>makeBeep(880,0.12),180); setTimeout(()=>makeBeep(1100,0.2),360);
          if (logPerSet) setShowLogPanel(true);
        }
      } else if (s.phase === "shortRest") {
        r.current = {...s, phase:"work", rep:s.rep+1, left:workSec??0, elapsed:0};
        makeBeep(1047, 0.12);
        setShowLogPanel(false);
      } else if (s.phase === "setRest") {
        r.current = {...s, phase:"work", left:workSec??0, elapsed:0};
        makeBeep(1047, 0.12);
        setShowLogPanel(false);
      }
      setDisp({...r.current});
    };

    advanceRef.current = doAdvance;

    const id = setInterval(() => {
      const s = r.current;
      if (s.paused || s.phase==="done") return;
      if (s.phase==="work" && workSec===null) {
        r.current = {...s, elapsed:+(s.elapsed+0.1).toFixed(1)};
        setDisp({...r.current});
        return;
      }
      const newLeft = +(s.left-0.1).toFixed(1);
      if (s.phase==="work" && workSec!==null) {
        if (newLeft===3.0||newLeft===2.0||newLeft===1.0) makeBeep(660,0.05,0.18);
      }
      if (newLeft <= 0) { doAdvance(); }
      else { r.current = {...s, left:newLeft}; setDisp({...r.current}); }
    }, 100);

    return () => clearInterval(id);
  }, []); // eslint-disable-line

  const togglePause = () => { r.current={...r.current,paused:!r.current.paused}; setDisp({...r.current}); };

  const { phase, set, rep, left, paused, elapsed } = disp;

  // Which set was JUST completed? (for the log panel during setRest, it's set-1; during done, it's `sets`)
  const completedSet = phase==="done" ? sets : (set-1);

  const saveSetLog = (climbs) => {
    setSetLogs(p => ({...p, [completedSet]: {climbs}}));
    setShowLogPanel(false);
    // Don't auto-advance — user can rest normally, tap SKIP REST if they want to move on
  };

  const phaseColor = {prep:T.accent, work:T.green, shortRest:T.blue, setRest:T.purple, done:T.accent}[phase]??T.accent;
  const phaseTitle =
    phase==="prep"      ? "GET READY" :
    phase==="work"      ? (repsPerSet>1 ? `${workLabel}  ${rep} / ${repsPerSet}` : workLabel) :
    phase==="shortRest" ? "BREATHE" :
    phase==="setRest"   ? "REST" : "DONE";
  const setInfo =
    phase==="done"  ? "ALL SETS COMPLETE" :
    phase==="prep"  ? `${sets} SET${sets!==1?"S":""}  ·  ${workSec?`${workSec}s`:"TAP TO FINISH"}` :
    `SET  ${set} / ${sets}`;

  const durMap = {prep:PREP_SEC, work:workSec||1, shortRest:shortRestSec||1, setRest:setRestSec||1, done:1};
  const progress = phase==="done" ? 1 : (phase==="work"&&workSec===null) ? 0 : Math.max(0,1-left/(durMap[phase]||1));
  const R=70,CX=88,CY=88,circ=2*Math.PI*R;

  const infoItems = [
    workSec ? `${workSec}s work` : "tap to finish",
    shortRestSec>0 ? `${shortRestSec}s rep rest` : null,
    setRestSec>0 ? `${setRestSec}s set rest` : null,
    edgeMm ? `${edgeMm}mm` : null,
    weightKg>0 ? `+${weightKg}kg` : null,
  ].filter(Boolean).join("  ·  ");

  const buildSetLogsArray = () =>
    Object.entries(setLogs)
      .sort(([a],[b])=>+a-+b)
      .map(([setNum,{climbs}]) => ({set:+setNum, climbs}));

  const handleLogAndClose = () => {
    onLog(buildSetLogsArray());
    onClose();
  };

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:500,background:"#030303",
      display:"flex",flexDirection:"column",
    }}>
      {/* Timer area — upper portion */}
      <div style={{
        flex:1,display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",
        padding:"20px 0 10px",
      }}>
        <div style={{fontFamily:T.mono,fontSize:11,letterSpacing:5,color:phaseColor,marginBottom:4,transition:"color 0.3s"}}>
          {phaseTitle}
        </div>
        <div style={{fontFamily:T.mono,fontSize:10,color:T.muted,marginBottom:16,textAlign:"center",letterSpacing:1}}>
          {setInfo}
        </div>

        {/* Ring or tap circle */}
        {phase==="work" && workSec===null ? (
          <button onClick={()=>advanceRef.current?.()} style={{
            width:176,height:176,borderRadius:"50%",
            border:`2px solid ${T.green}`,background:"#081208",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,
          }}>
            <div style={{fontFamily:T.mono,fontSize:9,color:T.green,letterSpacing:3}}>TAP WHEN DONE</div>
            {elapsed>0.5&&<div style={{fontFamily:T.mono,fontSize:28,color:T.green,fontWeight:300}}>{Math.floor(elapsed)}s</div>}
          </button>
        ) : phase==="done" && logPerSet ? (
          <div style={{fontFamily:T.font,fontSize:52,fontWeight:800,color:T.accent,marginBottom:4}}>✓</div>
        ) : (
          <div style={{position:"relative",width:176,height:176}}>
            <svg width="176" height="176" style={{position:"absolute",top:0,left:0}}>
              <circle cx={CX} cy={CY} r={R} fill="none" stroke="#181818" strokeWidth="9"/>
              <circle cx={CX} cy={CY} r={R} fill="none" stroke={phaseColor} strokeWidth="9"
                strokeDasharray={circ} strokeDashoffset={circ*(1-progress)}
                strokeLinecap="round" transform={`rotate(-90 ${CX} ${CY})`}
                style={{transition:"stroke-dashoffset 0.1s linear, stroke 0.4s"}}/>
            </svg>
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
              {phase==="done"
                ? <div style={{fontFamily:T.font,fontSize:36,fontWeight:800,color:T.accent}}>✓</div>
                : <div style={{fontFamily:T.mono,fontSize:44,fontWeight:500,color:T.text,lineHeight:1}}>{Math.ceil(left)}</div>
              }
            </div>
          </div>
        )}

        <div style={{fontFamily:T.mono,fontSize:9,color:"#3a3a3a",letterSpacing:1,marginTop:12,textAlign:"center"}}>{infoItems}</div>

        {/* Controls */}
        {phase==="done" && !logPerSet ? (
          <div style={{display:"flex",flexDirection:"column",gap:10,width:220,marginTop:20}}>
            <button onClick={handleLogAndClose} style={{
              padding:"14px",borderRadius:10,border:"none",background:T.accent,
              color:"#080808",fontFamily:T.font,fontSize:14,fontWeight:800,
            }}>Log &amp; Close</button>
            <button onClick={onClose} style={{
              padding:"12px",borderRadius:10,border:`1px solid ${T.border}`,
              background:"none",color:T.muted,fontFamily:T.mono,fontSize:12,
            }}>Close without logging</button>
          </div>
        ) : phase!=="done" && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,marginTop:16}}>
            <div style={{display:"flex",gap:10}}>
              <button onClick={togglePause} style={{
                padding:"11px 24px",borderRadius:10,border:`1px solid ${T.border}`,
                background:T.surface,color:T.text,fontFamily:T.mono,fontSize:13,letterSpacing:1,
              }}>{paused?"▶ RESUME":"⏸ PAUSE"}</button>
              <button onClick={onClose} style={{
                padding:"11px 16px",borderRadius:10,border:`1px solid ${T.border}`,
                background:"none",color:T.muted,fontFamily:T.mono,fontSize:13,
              }}>✕</button>
            </div>
            {(phase==="shortRest"||phase==="setRest") && !paused && !showLogPanel && (
              <button onClick={()=>advanceRef.current?.()} style={{
                padding:"7px 22px",borderRadius:20,border:`1px solid ${T.muted}`,
                background:"none",color:T.muted,fontFamily:T.mono,fontSize:10,letterSpacing:1,
              }}>SKIP REST →</button>
            )}
            {logPerSet && (phase==="setRest"||phase==="done") && !showLogPanel && (
              <button onClick={()=>setShowLogPanel(true)} style={{
                padding:"7px 22px",borderRadius:20,
                border:`1px solid ${T.accent}`,background:`${T.accent}15`,
                color:T.accent,fontFamily:T.mono,fontSize:10,letterSpacing:1,
              }}>+ LOG SET {completedSet}</button>
            )}
          </div>
        )}
      </div>

      {/* SetLogPanel — slides up from bottom during rest or on done */}
      {logPerSet && showLogPanel && (
        <SetLogPanel
          n={logSlots}
          targetGi={targetGi}
          grades={grades}
          gym={gym}
          label="CLIMB"
          existing={setLogs[completedSet]?.climbs}
          onSave={saveSetLog}
          onSkip={()=>setShowLogPanel(false)}
        />
      )}

      {/* Done screen with summary + log action — only when logPerSet */}
      {logPerSet && phase==="done" && !showLogPanel && (
        <div style={{
          background:"#0c0c0c",borderTop:`1px solid ${T.border}`,
          padding:"16px 20px 20px",maxHeight:"55vh",overflowY:"auto",
        }}>
          <div style={{fontFamily:T.mono,fontSize:10,color:T.muted,letterSpacing:2,marginBottom:12}}>SESSION SUMMARY</div>
          <SetSummaryGrid
            setLogs={Object.entries(setLogs).reduce((acc,[k,v])=>({...acc,[k]:v}),{})}
            sets={sets} climbs={logSlots}
            grades={grades} gym={gym}
          />
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <button onClick={handleLogAndClose} style={{
              flex:1,padding:"13px",borderRadius:10,border:"none",
              background:T.accent,color:"#080808",fontFamily:T.font,fontSize:13,fontWeight:800,
            }}>Log &amp; Close</button>
            <button onClick={onClose} style={{
              padding:"13px 16px",borderRadius:10,border:`1px solid ${T.border}`,
              background:"none",color:T.muted,fontFamily:T.mono,fontSize:12,
            }}>Skip</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TrainingForm({ exercises, onLog, gradeSystem, sessions, activeGym }) {
  const grades = gradesFor(gradeSystem);
  const [category,  setCategory] = useState("Strength");
  const cats       = [...new Set(exercises.map(e=>e.category||"Custom"))];
  const visibleExs = exercises.filter(e=>(e.category||"Custom")===category);

  const [exId, setExId]     = useState(visibleExs[0]?.id || exercises[0]?.id);
  const [values, setValues] = useState({});
  const [note, setNote]     = useState("");
  const [showTimer, setShowTimer] = useState(false);
  const [prefillDate, setPrefillDate] = useState(null);

  const ex = exercises.find(e=>e.id===exId);

  useEffect(()=>{
    let id = exId;
    if (!visibleExs.find(e=>e.id===id)) {
      id = visibleExs[0]?.id;
      setExId(id);
    }
    let lastValues = null, lastDate = null;
    for (const s of (sessions||[]).filter(x=>x.ended).sort((a,b)=>b.date.localeCompare(a.date))) {
      const t = [...s.training].reverse().find(t=>t.exId===id);
      if (t) { lastValues = t.values; lastDate = s.date; break; }
    }
    setValues(lastValues ? {...lastValues} : {});
    setPrefillDate(lastDate);
    setNote("");
  },[exId, category]); // eslint-disable-line

  // setLogs: array of {set, climbs:[{gi,styles,sent}]} — from SetTimer when logPerSet
  const handle = (setLogs) => {
    if (!ex) return;
    const cleaned = {};
    ex.fields.forEach(f=>{
      const v = values[f.key];
      cleaned[f.key] = v===""||v==null ? null : +v;
    });
    if (values.restBetweenSetsSec!==undefined && values.restBetweenSetsSec!=="")
      cleaned.restBetweenSetsSec = +values.restBetweenSetsSec;
    // Defensive: only persist setLogs when it's actually an array
    const validSetLogs = Array.isArray(setLogs) && setLogs.length > 0 ? setLogs : null;
    onLog({id:uid(), exId, values:cleaned, note, setLogs: validSetLogs});
    setValues({});
    setNote("");
    setPrefillDate(null);
  };

  const hasSets   = ex?.fields.some(f=>f.key==="sets");
  const BUILTIN_TIMER_IDS = ["ex_hang","ex_maxhang","ex_lock","ex_core","ex_arc","ex_pullup","ex_pushup","ex_campus","ex_4x4","ex_linkups","ex_limit","ex_silent"];
  const hasBuiltinTimer = !!ex && BUILTIN_TIMER_IDS.includes(exId);
  const hasCustomTimer  = !!ex?.timerCfg;
  // Timer button is available when:
  //   - Exercise has a built-in timer AND the user has filled in sets
  //   - OR the exercise has a custom timerCfg (sets implied = 1 if no field)
  const canTimer = (hasBuiltinTimer && hasSets && values.sets) || hasCustomTimer;
  const timerConfig = canTimer ? buildTimerConfig(exId, values, ex) : null;

  return (
    <>
      {showTimer && timerConfig && (
        <SetTimer
          config={timerConfig}
          onClose={()=>setShowTimer(false)}
          onLog={(setLogs)=>handle(setLogs)}
          grades={grades}
          gym={activeGym}
        />
      )}

      <Lbl>CATEGORY</Lbl>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setCategory(c)} style={pill(category===c)}>{c}</button>
        ))}
      </div>

      <Lbl>EXERCISE</Lbl>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {visibleExs.map(e=>(
          <button key={e.id} onClick={()=>setExId(e.id)} style={pill(exId===e.id)}>{e.name}</button>
        ))}
        {!visibleExs.length && <Empty>No exercises in this category yet</Empty>}
      </div>

      {ex && (
        <>
          {prefillDate && (
            <div style={{fontFamily:T.mono,fontSize:9,color:T.muted,letterSpacing:1,marginBottom:10}}>
              PREFILLED FROM {prefillDate} — tap any field to edit
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {ex.fields.map(f=>(
              <div key={f.key}>
                <Lbl>{f.label.toUpperCase()}{f.unit&&f.unit!=="idx"?` (${f.unit})`:""}</Lbl>
                {f.unit==="idx" ? (
                  <select value={values[f.key]??""} onChange={e=>setValues(p=>({...p,[f.key]:e.target.value}))} style={{...Inp,appearance:"menulist"}}>
                    <option value="">—</option>
                    {grades.map((g,gi)=>(<option key={gi} value={gi}>{g}</option>))}
                  </select>
                ) : (
                  <input type="number" step="any" value={values[f.key]??""} onChange={e=>setValues(p=>({...p,[f.key]:e.target.value}))} style={Inp}/>
                )}
              </div>
            ))}
            {/* Universal rest-between-sets, shown for any exercise with sets */}
            {hasSets && (
              <div>
                <Lbl>SET REST (s)</Lbl>
                <input type="number" value={values.restBetweenSetsSec??""} onChange={e=>setValues(p=>({...p,restBetweenSetsSec:e.target.value}))} style={Inp} placeholder="120"/>
              </div>
            )}
          </div>

          <Lbl>NOTE</Lbl>
          <input value={note} onChange={e=>setNote(e.target.value)} style={{...Inp,marginBottom:16}} placeholder="Optional…"/>

          <div style={{display:"flex",gap:8}}>
            {canTimer && (
              <button onClick={()=>setShowTimer(true)} style={{
                flex:"0 0 auto",padding:"14px 18px",borderRadius:10,border:"none",
                background:T.green,color:"#080808",fontFamily:T.mono,fontSize:13,fontWeight:500,letterSpacing:1,
              }}>▶ Timer</button>
            )}
            <button onClick={()=>handle()} style={{
              flex:1,padding:"14px",borderRadius:10,border:"none",
              background:T.accent,color:"#080808",fontFamily:T.font,fontSize:14,fontWeight:800,
            }}>LOG — {ex.name}</button>
          </div>
        </>
      )}
    </>
  );
}

// ── Exercise editor (used from Library tab) ───────────────────────────────────
function ExerciseEditor({ exercise, onSave, onCancel }) {
  const [name,     setName]     = useState(exercise.name);
  const [category, setCategory] = useState(exercise.category || "Custom");
  const [fields,   setFields]   = useState(exercise.fields);

  const addField = () => setFields(p=>[...p,{key:`f_${uid()}`,label:"",unit:""}]);
  const updField = (i,k,v) => setFields(p=>p.map((f,j)=>j===i?{...f,[k]:v}:f));
  const delField = i => setFields(p=>p.filter((_,j)=>j!==i));

  return (
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:300,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:T.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,margin:"0 auto",padding:24,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontFamily:T.font,fontSize:17,fontWeight:800,color:T.text}}>{exercise.name?"Edit":"New"} exercise</span>
          <button onClick={onCancel} style={{background:"none",border:"none",color:T.muted,fontSize:22}}>✕</button>
        </div>

        <Lbl>NAME</Lbl>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. One-arm hang" style={{...Inp,marginBottom:16}}/>

        <Lbl>CATEGORY</Lbl>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20}}>
          {EXERCISE_CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setCategory(c)} style={pill(category===c)}>{c}</button>
          ))}
        </div>

        <Lbl>MEASUREMENTS</Lbl>
        <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,marginBottom:8}}>
          Unit examples: s, min, kg, mm, %, /10 — use "idx" for a grade picker
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
          {fields.map((f,i)=>(
            <div key={i} style={{display:"flex",gap:6,alignItems:"center"}}>
              <input value={f.label} onChange={e=>updField(i,"label",e.target.value)} placeholder="Label" style={{...Inp,flex:2}}/>
              <input value={f.unit} onChange={e=>updField(i,"unit",e.target.value)} placeholder="unit" style={{...Inp,flex:1}}/>
              <button onClick={()=>delField(i)} style={{background:"none",border:"none",color:T.muted,fontSize:18,padding:"0 8px"}}>✕</button>
            </div>
          ))}
        </div>
        <button onClick={addField} style={{
          width:"100%",padding:"9px",borderRadius:8,border:`1px dashed ${T.border}`,
          background:"none",color:T.muted,fontFamily:T.mono,fontSize:11,marginBottom:22,
        }}>+ Add field</button>

        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,padding:"11px",borderRadius:8,border:`1px solid ${T.border}`,background:"none",color:T.muted,fontFamily:T.mono,fontSize:12}}>Cancel</button>
          <button onClick={()=>onSave({...exercise,name:name.trim()||"Unnamed",category,fields,timerCfg:exercise.timerCfg||null})} style={{flex:2,padding:"11px",borderRadius:8,border:"none",background:T.accent,color:"#080808",fontFamily:T.font,fontSize:13,fontWeight:800}}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Gym editor ────────────────────────────────────────────────────────────────
function GymEditor({ gym, gradeSystem, onSave, onCancel, onDelete }) {
  const grades = gradesFor(gradeSystem);
  const [name, setName] = useState(gym.name);
  const [ranges, setRanges] = useState(gym.ranges||[]);

  const addRange = () => {
    const lastMax = ranges.length ? ranges[ranges.length-1].maxGi : -1;
    setRanges(p=>[...p,{name:"New",color:"#888888",minGi:Math.min(lastMax+1,grades.length-1),maxGi:Math.min(lastMax+2,grades.length-1)}]);
  };
  const updRange = (i,k,v) => setRanges(p=>p.map((r,j)=>j===i?{...r,[k]:v}:r));
  const delRange = i => setRanges(p=>p.filter((_,j)=>j!==i));

  return (
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:300,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:T.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,margin:"0 auto",padding:24,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontFamily:T.font,fontSize:17,fontWeight:800,color:T.text}}>{gym.name?"Edit gym":"New gym"}</span>
          <button onClick={onCancel} style={{background:"none",border:"none",color:T.muted,fontSize:22,cursor:"pointer"}}>✕</button>
        </div>

        <Lbl>NAME</Lbl>
        <input value={name} onChange={e=>setName(e.target.value)} style={{...Inp,marginBottom:20}}/>

        <Lbl>COLOR TIERS <span style={{color:T.dim,fontWeight:300}}>(map a colour to a grade range)</span></Lbl>
        <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,marginBottom:10}}>
          Leave empty to use the default grade palette. Grade system: {gradeSystem}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:10}}>
          {ranges.map((r,i)=>(
            <div key={i} style={{background:T.s2,border:`1px solid ${T.border}`,borderRadius:8,padding:12}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                <input type="color" value={r.color} onChange={e=>updRange(i,"color",e.target.value)}
                  style={{width:36,height:36,borderRadius:6,border:`1px solid ${T.border}`,cursor:"pointer",padding:2,background:"none"}}/>
                <input value={r.name} onChange={e=>updRange(i,"name",e.target.value)}
                  placeholder="Tier name…" style={{...Inp,flex:1}}/>
                <button onClick={()=>delRange(i)} style={{background:"none",border:"none",color:T.muted,fontSize:18,cursor:"pointer",padding:"0 4px"}}>✕</button>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontFamily:T.mono,fontSize:10,color:T.muted}}>From</span>
                <select value={r.minGi} onChange={e=>updRange(i,"minGi",+e.target.value)} style={{...Inp,appearance:"menulist",flex:1}}>
                  {grades.map((g,gi)=>(<option key={gi} value={gi}>{g}</option>))}
                </select>
                <span style={{fontFamily:T.mono,fontSize:10,color:T.muted}}>to</span>
                <select value={r.maxGi} onChange={e=>updRange(i,"maxGi",+e.target.value)} style={{...Inp,appearance:"menulist",flex:1}}>
                  {grades.map((g,gi)=>(<option key={gi} value={gi}>{g}</option>))}
                </select>
              </div>
              {/* preview */}
              <div style={{display:"flex",gap:4,marginTop:10,flexWrap:"wrap"}}>
                {grades.slice(r.minGi,r.maxGi+1).map((g,gi)=>(
                  <div key={gi} style={{
                    padding:"2px 8px",borderRadius:4,
                    background:`${r.color}22`,
                    color:r.color,
                    fontFamily:T.mono,fontSize:10,
                  }}>{g}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={addRange} style={{
          width:"100%",padding:"9px",borderRadius:8,border:`1px dashed ${T.border}`,
          background:"none",color:T.muted,fontFamily:T.mono,fontSize:11,cursor:"pointer",marginBottom:22,
        }}>+ Add tier</button>

        <div style={{display:"flex",gap:10}}>
          {gym.id && onDelete && <InlineDelete size="large" onDelete={()=>onDelete(gym.id)}/>}
          <button onClick={onCancel} style={{flex:1,padding:"11px",borderRadius:8,border:`1px solid ${T.border}`,background:"none",color:T.muted,fontFamily:T.mono,fontSize:12,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>onSave({...gym,name:name.trim()||"Unnamed",ranges})} style={{flex:2,padding:"11px",borderRadius:8,border:"none",background:T.accent,color:"#080808",fontFamily:T.font,fontSize:13,fontWeight:800,cursor:"pointer"}}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Session Editor ────────────────────────────────────────────────────────────
function SessionEditor({ session, gyms, exercises, gradeSystem, onSave, onDelete, onClose }) {
  const [s, setS] = useState(session);
  const grades = gradesFor(gradeSystem);
  const gym = gyms.find(g=>g.id===s.gymId);

  const delBoulder = id => setS(p=>({...p,boulders:p.boulders.filter(b=>b.id!==id)}));
  const delTraining = id => setS(p=>({...p,training:p.training.filter(t=>t.id!==id)}));

  return (
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:300,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:T.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,margin:"0 auto",padding:24,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontFamily:T.font,fontSize:17,fontWeight:800,color:T.text}}>Edit Session</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,fontSize:22,cursor:"pointer"}}>✕</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div><Lbl>DATE</Lbl>
            <input type="date" value={s.date} onChange={e=>setS(p=>({...p,date:e.target.value}))} style={Inp}/>
          </div>
          <div><Lbl>GYM</Lbl>
            <select value={s.gymId} onChange={e=>setS(p=>({...p,gymId:e.target.value}))} style={{...Inp,appearance:"menulist"}}>
              {gyms.map(g=>(<option key={g.id} value={g.id}>{g.name}</option>))}
            </select>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <Lbl>DURATION (min)</Lbl>
          <input type="number" value={s.durationMin??""} onChange={e=>setS(p=>({...p,durationMin:e.target.value===""?null:+e.target.value}))} style={Inp} placeholder="—"/>
        </div>

        {s.boulders.length>0 && (
          <>
            <Lbl>BOULDERS ({s.boulders.length})</Lbl>
            <div style={{display:"flex",flexDirection:"column",marginBottom:16}}>
              {s.boulders.map(b=>(
                <BoulderRow
                  key={b.id}
                  boulder={b}
                  gym={gym}
                  grades={grades}
                  onDelete={()=>delBoulder(b.id)}
                />
              ))}
            </div>
          </>
        )}

        {s.training.length>0 && (
          <>
            <Lbl>TRAINING ({s.training.length})</Lbl>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
              {s.training.map(t=>{
                const ex=exercises.find(e=>e.id===t.exId);
                const summary = ex?.fields.map(f=>{
                  const v=t.values?.[f.key];
                  if (v==null) return null;
                  if (f.unit==="idx") return `${f.label} ${grades[v]??v}`;
                  return `${f.label} ${v}${f.unit}`;
                }).filter(Boolean).join(" · ");
                return (
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,background:T.s2,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px"}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:T.font,fontSize:12,fontWeight:600,color:T.blue}}>{ex?.name??"Unknown"}</div>
                      <div style={{fontFamily:T.mono,fontSize:9,color:T.muted,marginTop:2}}>{summary}</div>
                    </div>
                    <InlineDelete onDelete={()=>delTraining(t.id)}/>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div style={{display:"flex",gap:10,marginTop:8}}>
          <InlineDelete size="large" onDelete={()=>onDelete(s.id)}/>
          <button onClick={()=>onSave(s)} style={{flex:1,padding:"11px",borderRadius:8,border:"none",background:T.accent,color:"#080808",fontFamily:T.font,fontSize:13,fontWeight:800,cursor:"pointer"}}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({ gradeSystem, setGradeSystem, gyms, onEditGym, onNewGym, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:250,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:T.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,margin:"0 auto",padding:24,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontFamily:T.font,fontSize:17,fontWeight:800,color:T.text}}>Settings</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,fontSize:22,cursor:"pointer"}}>✕</button>
        </div>

        <Lbl>GRADE SYSTEM</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24}}>
          {["V-Scale","Font"].map(s=>(
            <button key={s} onClick={()=>setGradeSystem(s)} style={{
              padding:"10px 4px",borderRadius:8,textAlign:"center",fontFamily:T.mono,fontSize:11,cursor:"pointer",
              border:`1px solid ${gradeSystem===s?T.accent:T.border}`,
              background:gradeSystem===s?`${T.accent}18`:T.s2,
              color:gradeSystem===s?T.accent:T.muted,
            }}>{s}</button>
          ))}
        </div>

        <Lbl>GYMS</Lbl>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
          {gyms.map(g=>(
            <button key={g.id} onClick={()=>onEditGym(g)} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              background:T.s2,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",
            }}>
              <div style={{textAlign:"left"}}>
                <div style={{fontFamily:T.font,fontSize:13,fontWeight:700,color:T.text}}>{g.name}</div>
                <div style={{fontFamily:T.mono,fontSize:9,color:T.muted,marginTop:3}}>
                  {g.ranges?.length?`${g.ranges.length} color tiers`:"Default palette"}
                </div>
                {g.ranges?.length>0 && (
                  <div style={{display:"flex",gap:4,marginTop:6}}>
                    {g.ranges.map((r,i)=>(
                      <div key={i} title={r.name} style={{width:12,height:12,borderRadius:"50%",background:r.color,border:`1px solid ${T.border}`}}/>
                    ))}
                  </div>
                )}
              </div>
              <span style={{fontFamily:T.mono,fontSize:11,color:T.muted}}>Edit</span>
            </button>
          ))}
        </div>
        <button onClick={onNewGym} style={{
          width:"100%",padding:"11px",borderRadius:8,border:`1px dashed ${T.border}`,
          background:"none",color:T.muted,fontFamily:T.mono,fontSize:11,cursor:"pointer",
        }}>+ New gym</button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [sessions,  setSessions]  = useState(SEED_SESSIONS);
  const [gyms,      setGyms]      = useState(DEFAULT_GYMS);
  const [exercises, setExercises] = useState(BUILTIN_EXERCISES);
  const [gradeSystem, setGradeSystem] = useState("V-Scale");

  const [activeId, setActiveId] = useState(null);
  const [tab,      setTab]      = useState("home");
  const [logTab,   setLogTab]   = useState("boulder");
  const [statsTab, setStatsTab] = useState("climbing");

  // ── Dashboard widgets ─────────────────────────────────────────────────────
  const [dashWidgets, setDashWidgets] = useState([
    {id:"dw1", metricId:"max_grade"},
    {id:"dw2", metricId:"sends"},
    {id:"dw3", metricId:"ex:ex_pullup:weightKg"},
  ]);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  // ── Stats filter ──────────────────────────────────────────────────────────
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [fStyles,      setFStyles]      = useState([]);         // [] = all styles
  const [fResult,      setFResult]      = useState("all");      // all | sends | fails
  const [fMinGi,       setFMinGi]       = useState("");
  const [fMaxGi,       setFMaxGi]       = useState("");
  const [fGymIds,      setFGymIds]      = useState([]);         // [] = all gyms
  const [fDateFrom,    setFDateFrom]    = useState("");
  const [fDateTo,      setFDateTo]      = useState("");

  // ── New session goal ──────────────────────────────────────────────────────
  const [newGoal, setNewGoal] = useState("Free session");

  // Modals
  const [showNew,     setShowNew]   = useState(false);
  const [newGymId,    setNewGymId]  = useState(gyms[0].id);
  const [addingGym,   setAddingGym]= useState(false);
  const [gymName,     setGymName]  = useState("");
  const [showEnd,     setShowEnd]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingGym,   setEditingGym] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editingEx,    setEditingEx] = useState(null);

  // Boulder form
  const [selGi, setSelGi] = useState(4);
  const [selStyles, setSelStyles] = useState([]);
  const [selPerc, setSelPerc] = useState(1);
  const [selResult, setSelResult] = useState("send");
  const [selAttempts, setSelAttempts] = useState(1);
  const [useColors, setUseColors] = useState(false); // toggle: color tiers vs grade names

  const grades = gradesFor(gradeSystem);
  const active = sessions.find(s=>s.id===activeId);
  const activeGym = active ? gyms.find(g=>g.id===active.gymId) : null;
  const elapsedMin = useElapsedMinutes(active?.startedAt);

  const startSession = () => {
    const now = Date.now();
    const s = {id:uid(),gymId:newGymId,goal:newGoal,date:new Date().toISOString().slice(0,10),ended:false,startedAt:now,durationMin:null,boulders:[],training:[]};
    setSessions(p=>[s,...p]);
    setActiveId(s.id);
    setShowNew(false);
    setAddingGym(false);
    setTab("log");
  };

  const quickAddGym = () => {
    if (!gymName.trim()) return;
    const g = {id:`gym_${uid()}`,name:gymName.trim(),ranges:[]};
    setGyms(p=>[...p,g]);
    setNewGymId(g.id);
    setGymName("");
    setAddingGym(false);
  };

  const endSession = () => {
    setSessions(p=>p.map(s=>{
      if (s.id!==activeId) return s;
      const dur = s.startedAt ? Math.max(1, Math.round((Date.now()-s.startedAt)/60000)) : (s.durationMin||null);
      return {...s,ended:true,durationMin:dur};
    }));
    setActiveId(null);
    setShowEnd(false);
    setTab("history");
  };

  const logBoulder = () => {
    if (!activeId) return;
    const b = makeBoulder({
      gi: selGi,
      styles: selStyles,
      sent: selResult === "send",
      attempts: selAttempts,
      perceived: selPerc,
    });
    setSessions(p=>p.map(s=>s.id===activeId?{...s,boulders:[...s.boulders, b]}:s));
    setSelStyles([]);
    setSelAttempts(1);
  };

  const deleteLiveBoulder = id => {
    setSessions(p=>p.map(s=>s.id===activeId?{...s,boulders:s.boulders.filter(b=>b.id!==id)}:s));
  };

  const deleteLiveTraining = id => {
    setSessions(p=>p.map(s=>s.id===activeId?{...s,training:s.training.filter(t=>t.id!==id)}:s));
  };

  const logTraining = entry => {
    if (!activeId) return;
    setSessions(p=>p.map(s=>s.id===activeId?{...s,training:[...s.training,entry]}:s));
  };

  const saveEdited = updated => {
    setSessions(p=>p.map(s=>s.id===updated.id?updated:s));
    setEditingSession(null);
  };
  const deleteSession = id => {
    setSessions(p=>p.filter(s=>s.id!==id));
    if (activeId === id) setActiveId(null);
    setEditingSession(null);
  };

  const saveGym = updated => {
    setGyms(p=>p.some(g=>g.id===updated.id)?p.map(g=>g.id===updated.id?updated:g):[...p,updated]);
    setEditingGym(null);
  };
  const deleteGym = id => {
    setGyms(p=>p.filter(g=>g.id!==id));
    setEditingGym(null);
  };

  const saveExercise = updated => {
    setExercises(p=>p.some(e=>e.id===updated.id)?p.map(e=>e.id===updated.id?updated:e):[...p,updated]);
    setEditingEx(null);
  };
  const deleteExercise = id => {
    setExercises(p => p.filter(e => e.id !== id));
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const filteredSessions = useMemo(()=>{
    let ss = sessions.filter(s=>s.ended);
    if (fGymIds.length) ss = ss.filter(s=>fGymIds.includes(s.gymId));
    if (fDateFrom) ss = ss.filter(s=>s.date >= fDateFrom);
    if (fDateTo)   ss = ss.filter(s=>s.date <= fDateTo);
    return ss.map(s=>({
      ...s,
      boulders: s.boulders.filter(b=>{
        if (fStyles.length && !fStyles.some(st=>b.styles.includes(st))) return false;
        if (fResult==="sends" && b.sends===0) return false;
        if (fResult==="fails" && b.sends>0) return false;
        if (fMinGi!=="" && b.gi < +fMinGi) return false;
        if (fMaxGi!=="" && b.gi > +fMaxGi) return false;
        return true;
      }),
    }));
  },[sessions, fGymIds, fDateFrom, fDateTo, fStyles, fResult, fMinGi, fMaxGi]);

  const filterActive = fStyles.length||fResult!=="all"||fMinGi!==""||fMaxGi!==""||fGymIds.length||fDateFrom||fDateTo;

  const stats = useMemo(()=>{
    const ended = filteredSessions;

    // Extract boulders from setLogs (on-the-wall exercises) and merge with regular boulders
    const setLogBoulders = ended.flatMap(s =>
      s.training.flatMap(t =>
        (Array.isArray(t.setLogs) ? t.setLogs : []).flatMap(sl =>
          (sl.climbs||[]).map(c => makeBoulder({
            gi: c.gi,
            styles: c.styles || [],
            sent: c.sent,
            perceived: 1,
            attempts: 1,
            source: "setLog",
          }))
        )
      )
    );

    const allB = [...ended.flatMap(s=>s.boulders), ...setLogBoulders];
    const totalSends = allB.reduce((a,b)=>a+b.sends,0);
    const totalAtt = allB.reduce((a,b)=>a+b.attempts,0);

    const maxGi = allB.length?Math.max(...allB.map(b=>b.gi)):0;
    const gradeDist = Array.from({length:maxGi+1},(_,gi)=>({
      gi,label:grades[gi]??`#${gi}`,
      v:allB.filter(b=>b.gi===gi).reduce((a,b)=>a+b.attempts,0),
    })).filter(d=>d.v>0);

    const styleMap = {};
    STYLES.forEach(st=>{
      const rel=allB.filter(b=>b.styles.includes(st));
      if(!rel.length) return;
      styleMap[st]={sends:rel.reduce((a,b)=>a+b.sends,0),total:rel.length};
    });
    const styleRadar = Object.entries(styleMap).map(([label,{sends,total}])=>({label,v:sends/total}));

    const sorted = [...ended].sort((a,b)=>a.date.localeCompare(b.date)).slice(-8);
    const sessionVol = sorted.map(s=>({label:s.date.slice(5),v:s.boulders.reduce((a,b)=>a+b.attempts,0)}));
    const maxGradeHist = sorted.map(s=>{
      const regularSends = s.boulders.filter(b=>b.sends>0).map(b=>b.gi);
      const setLogSends  = s.training.flatMap(t=>
        (Array.isArray(t.setLogs)?t.setLogs:[]).flatMap(sl=>(sl.climbs||[]).filter(c=>c.sent).map(c=>c.gi))
      );
      const allSends = [...regularSends, ...setLogSends];
      return {label:s.date.slice(5), v:allSends.length?Math.max(...allSends):null};
    }).filter(d=>d.v!=null);

    return {totalSends,totalAtt,gradeDist,styleRadar,sessionVol,maxGradeHist};
  },[filteredSessions,grades]);

  const Chart=({title,children})=>(
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:18,marginBottom:14}}>
      <Lbl style={{marginBottom:14}}>{title}</Lbl>{children}
    </div>
  );
  const StatCard=(label,val,col=T.accent)=>(
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 0",textAlign:"center"}}>
      <div style={{fontFamily:T.mono,fontSize:22,fontWeight:500,color:col}}>{val}</div>
      <div style={{fontFamily:T.mono,fontSize:8,color:T.muted,letterSpacing:2,marginTop:4}}>{label}</div>
    </div>
  );

  // ── Grade button grid ───────────────────────────────────────────────────
  const gymHasRanges = !!activeGym?.ranges?.length;

  // Main grade picker — now a thin wrapper around the shared GradeSelector
  const GradeGrid = () => (
    <GradeSelector
      gi={selGi}
      setGi={setSelGi}
      grades={grades}
      gym={activeGym}
      mode={gymHasRanges && useColors ? "tiers" : "grid"}
      useColors={useColors}
    />
  );

  const exercisesByCategory = useMemo(()=>{
    const grouped = {};
    EXERCISE_CATEGORIES.forEach(c=>grouped[c]=[]);
    exercises.forEach(e=>{
      const c = e.category||"Custom";
      if (!grouped[c]) grouped[c] = [];
      grouped[c].push(e);
    });
    return grouped;
  },[exercises]);

  return (
    <>
      <style>{CSS}</style>

      {showSettings && (
        <SettingsPanel
          gradeSystem={gradeSystem} setGradeSystem={setGradeSystem}
          gyms={gyms}
          onEditGym={setEditingGym}
          onNewGym={()=>setEditingGym({id:"",name:"",ranges:[]})}
          onClose={()=>setShowSettings(false)}
        />
      )}

      {editingGym && (
        <GymEditor
          gym={editingGym.id?editingGym:{...editingGym,id:`gym_${uid()}`}}
          gradeSystem={gradeSystem}
          onSave={saveGym}
          onDelete={editingGym.id?deleteGym:null}
          onCancel={()=>setEditingGym(null)}
        />
      )}

      {editingSession && (
        <SessionEditor
          session={editingSession}
          gyms={gyms} exercises={exercises}
          gradeSystem={gradeSystem}
          onSave={saveEdited} onDelete={deleteSession}
          onClose={()=>setEditingSession(null)}
        />
      )}

      {editingEx && (
        <ExerciseEditor
          exercise={editingEx}
          onSave={saveExercise}
          onCancel={()=>setEditingEx(null)}
        />
      )}

      {showEnd && (
        <div style={{position:"fixed",inset:0,background:"#000d",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:28,width:300,textAlign:"center"}}>
            <div style={{fontFamily:T.font,fontSize:16,fontWeight:700,color:T.text,marginBottom:8}}>End session?</div>
            <div style={{fontFamily:T.mono,fontSize:12,color:T.muted,marginBottom:22}}>
              {active?.boulders.filter(b=>b.sends>0).length} sends · {active?.boulders.reduce((a,b)=>a+b.attempts,0)} attempts · {active?.training.length} training · {fmtDuration(elapsedMin)}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowEnd(false)} style={{flex:1,padding:"11px",borderRadius:8,border:`1px solid ${T.border}`,background:"none",color:T.muted,fontFamily:T.mono,fontSize:12,cursor:"pointer"}}>Keep going</button>
              <button onClick={endSession} style={{flex:1,padding:"11px",borderRadius:8,border:"none",background:T.red,color:"#fff",fontFamily:T.font,fontSize:13,fontWeight:700,cursor:"pointer"}}>End</button>
            </div>
          </div>
        </div>
      )}

      {showNew && (
        <div style={{position:"fixed",inset:0,background:"#000d",zIndex:200,display:"flex",alignItems:"flex-end"}}>
          <div style={{background:T.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,margin:"0 auto",padding:24,maxHeight:"80vh",overflowY:"auto"}}>
            <div style={{fontFamily:T.font,fontSize:17,fontWeight:800,color:T.text,marginBottom:20}}>New Session</div>
            <Lbl>SESSION GOAL</Lbl>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
              {SESSION_GOALS.map(g=>(
                <button key={g} onClick={()=>setNewGoal(g)} style={{
                  padding:"10px 8px",borderRadius:8,textAlign:"left",
                  border:`1px solid ${newGoal===g?T.accent:T.border}`,
                  background:newGoal===g?`${T.accent}15`:T.s2,
                  color:newGoal===g?T.accent:T.muted,
                  fontFamily:T.mono,fontSize:11,
                }}>{g}</button>
              ))}
            </div>
            <Lbl>WHERE ARE YOU?</Lbl>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
              {gyms.map(g=>(
                <button key={g.id} onClick={()=>setNewGymId(g.id)} style={{
                  display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"12px 14px",borderRadius:10,cursor:"pointer",
                  border:`1px solid ${newGymId===g.id?T.accent:T.border}`,
                  background:newGymId===g.id?`${T.accent}15`:T.s2,
                }}>
                  <div style={{textAlign:"left"}}>
                    <div style={{fontFamily:T.font,fontSize:13,fontWeight:700,color:newGymId===g.id?T.accent:T.text}}>{g.name}</div>
                    {g.ranges?.length>0 && (
                      <div style={{display:"flex",gap:3,marginTop:4}}>
                        {g.ranges.map((r,i)=>(<div key={i} style={{width:10,height:10,borderRadius:"50%",background:r.color}}/>))}
                      </div>
                    )}
                  </div>
                  {newGymId===g.id&&<span style={{fontFamily:T.mono,fontSize:14,color:T.accent}}>✓</span>}
                </button>
              ))}
            </div>

            {addingGym ? (
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                <input autoFocus value={gymName} onChange={e=>setGymName(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")quickAddGym();if(e.key==="Escape")setAddingGym(false);}}
                  style={{...Inp,flex:1}} placeholder="New gym name…"/>
                <button onClick={quickAddGym} style={{padding:"9px 16px",borderRadius:8,border:"none",background:T.accent,color:"#080808",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer"}}>Add</button>
                <button onClick={()=>setAddingGym(false)} style={{padding:"9px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:"none",color:T.muted,fontFamily:T.mono,fontSize:12,cursor:"pointer"}}>✕</button>
              </div>
            ) : (
              <button onClick={()=>setAddingGym(true)} style={{width:"100%",padding:"10px",borderRadius:8,border:`1px dashed ${T.border}`,background:"none",color:T.muted,fontFamily:T.mono,fontSize:11,cursor:"pointer",marginBottom:16}}>+ New gym</button>
            )}

            <div style={{display:"flex",gap:10,marginTop:4}}>
              <button onClick={()=>{setShowNew(false);setAddingGym(false);}} style={{flex:1,padding:"11px",borderRadius:8,border:`1px solid ${T.border}`,background:"none",color:T.muted,fontFamily:T.mono,fontSize:12,cursor:"pointer"}}>Cancel</button>
              <button onClick={startSession} style={{flex:2,padding:"11px",borderRadius:8,border:"none",background:T.accent,color:"#080808",fontFamily:T.font,fontSize:13,fontWeight:800,cursor:"pointer"}}>Start at {gyms.find(g=>g.id===newGymId)?.name}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Shell ─────────────────────────────────────────────────────── */}
      <div style={{background:T.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",display:"flex",flexDirection:"column",paddingBottom:24}}>

        {/* Header */}
        <div style={{padding:"18px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontFamily:T.font,fontSize:24,fontWeight:800,color:T.text,letterSpacing:-0.5}}>CHALK</div>
            <div style={{fontFamily:T.mono,fontSize:9,color:T.muted,letterSpacing:3}}>CLIMBING LOG</div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {/* Grade system clear toggle */}
            <button onClick={()=>setGradeSystem(gradeSystem==="V-Scale"?"Font":"V-Scale")} style={{
              background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,
              color:T.text,fontFamily:T.mono,fontSize:9,fontWeight:500,padding:"7px 10px",cursor:"pointer",
              letterSpacing:1,display:"flex",flexDirection:"column",alignItems:"center",lineHeight:1.2,
            }}>
              <span style={{fontSize:8,color:T.muted}}>SYSTEM</span>
              <span style={{color:T.accent,fontSize:10,marginTop:1}}>{gradeSystem}</span>
            </button>
            {activeId && (
              <button onClick={()=>setTab("log")} style={{
                fontFamily:T.mono,fontSize:10,color:T.accent,
                background:`${T.accent}12`,border:`1px solid ${T.accent}30`,
                padding:"5px 10px",borderRadius:20,cursor:"pointer",
                display:"flex",alignItems:"center",gap:6,
              }}>
                <span>● LIVE</span>
                <span style={{color:T.muted,fontSize:9}}>{fmtDuration(elapsedMin)}</span>
              </button>
            )}
            <button onClick={()=>setShowSettings(true)} style={{
              background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,
              color:T.muted,width:34,height:34,cursor:"pointer",fontSize:15,
            }}>⚙</button>
            <button onClick={()=>setShowNew(true)} style={{
              background:T.accent,color:"#080808",border:"none",borderRadius:8,
              fontFamily:T.font,fontSize:12,fontWeight:700,padding:"8px 12px",cursor:"pointer",
            }}>+</button>
          </div>
        </div>

        {/* Nav */}
        <div style={{display:"flex",padding:"14px 20px 0",borderBottom:`1px solid ${T.border}`,marginTop:10}}>
          {[["home","Home"],["log","Log"],["history","Hist"],["library","Lib"]].map(([t,label])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              flex:1,padding:"10px 0",background:"none",border:"none",
              borderBottom:`2px solid ${tab===t?T.accent:"transparent"}`,
              color:tab===t?T.accent:T.muted,
              fontFamily:T.mono,fontSize:9,letterSpacing:1,textTransform:"uppercase",
            }}>{label}</button>
          ))}
        </div>

        {/* ── HOME ─────────────────────────────────────────────────────── */}
        {tab==="home" && (
          <div style={{flex:1,overflowY:"auto",padding:20}}>

            {/* Filter panel */}
            <button onClick={()=>setFilterOpen(p=>!p)} style={{
              width:"100%",padding:"10px 14px",borderRadius:10,marginBottom:12,
              border:`1px solid ${filterActive?T.accent:T.border}`,
              background:filterActive?`${T.accent}12`:T.surface,
              color:filterActive?T.accent:T.muted,
              fontFamily:T.mono,fontSize:11,display:"flex",justifyContent:"space-between",alignItems:"center",
            }}>
              <span>FILTERS {filterActive?`(active)`:""}</span>
              <span>{filterOpen?"▲":"▼"}</span>
            </button>

            {filterOpen && (
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:16,marginBottom:16}}>
                <Lbl>RESULT</Lbl>
                <div style={{display:"flex",gap:6,marginBottom:14}}>
                  {[["all","All"],["sends","Sends only"],["fails","Failed only"]].map(([val,label])=>(
                    <button key={val} onClick={()=>setFResult(val)} style={{...pill(fResult===val),flex:1,textAlign:"center",padding:"8px 4px",fontSize:10}}>{label}</button>
                  ))}
                </div>
                <Lbl>STYLE</Lbl>
                <div style={{marginBottom:14}}>
                  <StyleSelector selected={fStyles} setSelected={setFStyles} size="compact"/>
                </div>
                <Lbl>GRADE RANGE</Lbl>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14}}>
                  <select value={fMinGi} onChange={e=>setFMinGi(e.target.value)} style={{...Inp,appearance:"menulist",flex:1}}>
                    <option value="">Min grade</option>
                    {grades.map((g,gi)=>(<option key={gi} value={gi}>{g}</option>))}
                  </select>
                  <span style={{color:T.muted,fontFamily:T.mono,fontSize:12}}>–</span>
                  <select value={fMaxGi} onChange={e=>setFMaxGi(e.target.value)} style={{...Inp,appearance:"menulist",flex:1}}>
                    <option value="">Max grade</option>
                    {grades.map((g,gi)=>(<option key={gi} value={gi}>{g}</option>))}
                  </select>
                </div>
                <Lbl>LOCATION</Lbl>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
                  {gyms.map(g=>(
                    <button key={g.id} onClick={()=>setFGymIds(p=>p.includes(g.id)?p.filter(x=>x!==g.id):[...p,g.id])} style={{...pill(fGymIds.includes(g.id)),fontSize:10,padding:"4px 10px"}}>{g.name}</button>
                  ))}
                </div>
                <Lbl>DATE RANGE</Lbl>
                <div style={{display:"flex",gap:8,marginBottom:14}}>
                  <input type="date" value={fDateFrom} onChange={e=>setFDateFrom(e.target.value)} style={{...Inp,flex:1}}/>
                  <input type="date" value={fDateTo} onChange={e=>setFDateTo(e.target.value)} style={{...Inp,flex:1}}/>
                </div>
                {filterActive && (
                  <button onClick={()=>{setFStyles([]);setFResult("all");setFMinGi("");setFMaxGi("");setFGymIds([]);setFDateFrom("");setFDateTo("");}} style={{
                    width:"100%",padding:"9px",borderRadius:8,border:`1px solid ${T.red}55`,
                    background:`${T.red}12`,color:T.red,fontFamily:T.mono,fontSize:11,
                  }}>Clear all filters</button>
                )}
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
              {StatCard("SESSIONS",filteredSessions.length)}
              {StatCard("SENDS",stats.totalSends,T.green)}
              {StatCard("ATTEMPTS",stats.totalAtt,T.muted)}
            </div>
            <div style={{display:"flex",gap:6,marginBottom:20}}>
              {["climbing","custom"].map(st=>(
                <button key={st} onClick={()=>setStatsTab(st)} style={{...pill(statsTab===st),flex:1,textAlign:"center",padding:"9px 4px"}}>{st.toUpperCase()}</button>
              ))}
            </div>
            {statsTab==="climbing" && (
              <>
                <Chart title="SEND PYRAMID"><Pyramid sessions={filteredSessions} gradeSystem={gradeSystem}/></Chart>
                {stats.maxGradeHist.length>=2 && (
                  <Chart title="MAX GRADE / SESSION">
                    <LineChart data={stats.maxGradeHist} color={T.accent} yFormat={v=>grades[Math.round(v)]??`#${Math.round(v)}`}/>
                  </Chart>
                )}
                <Chart title="ATTEMPT VOLUME / SESSION"><LineChart data={stats.sessionVol} color={T.blue}/></Chart>
                {stats.gradeDist.length>0 && <Chart title="ATTEMPTS BY GRADE"><Bars data={stats.gradeDist} colorFn={d=>DEFAULT_GRADE_COLORS[d.gi]??T.accent}/></Chart>}
                {stats.styleRadar.length>=3 && <Chart title="STYLE SEND RATE"><Radar data={stats.styleRadar}/></Chart>}
              </>
            )}
            {statsTab==="custom" && (
              <Chart title="CUSTOM PLOT BUILDER">
                <PlotBuilder sessions={sessions} exercises={exercises} gyms={gyms} gradeSystem={gradeSystem}/>
              </Chart>
            )}
          </div>
        )}

        {/* ── LOG ─────────────────────────────────────────────────────── */}
        {tab==="log" && (
          <div style={{flex:1,overflowY:"auto",padding:20}}>
            {!activeId ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:48,gap:16}}>
                <div style={{fontSize:56}}>🧗</div>
                <div style={{fontFamily:T.font,fontSize:20,fontWeight:800,color:T.text,textAlign:"center"}}>Ready to climb?</div>
                <div style={{fontFamily:T.mono,fontSize:12,color:T.muted,textAlign:"center",maxWidth:260}}>Start a session to log your boulders and training</div>
                <button onClick={()=>setShowNew(true)} style={{
                  marginTop:8,padding:"16px 40px",borderRadius:12,border:"none",
                  background:T.accent,color:"#080808",
                  fontFamily:T.font,fontSize:16,fontWeight:800,letterSpacing:0.5,
                }}>+ Start Session</button>
                {sessions.filter(s=>s.ended).length>0 && (
                  <button onClick={()=>setTab("history")} style={{
                    padding:"10px 24px",borderRadius:10,
                    border:`1px solid ${T.border}`,background:"none",
                    color:T.muted,fontFamily:T.mono,fontSize:11,
                  }}>View history ({sessions.filter(s=>s.ended).length} sessions)</button>
                )}
              </div>
            ) : (
              <>
                <div style={{background:T.surface,border:`1px solid ${T.accent}35`,borderRadius:12,padding:"13px 16px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:T.font,fontSize:14,fontWeight:700,color:T.text}}>{activeGym?.name}</div>
                    <div style={{fontFamily:T.mono,fontSize:10,color:T.muted,marginTop:2}}>
                      {active.date} · {gradeSystem} · {fmtDuration(elapsedMin)}
                      {active.goal && <span style={{color:T.accent}}> · {active.goal}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:14,alignItems:"center"}}>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:T.mono,fontSize:18,color:T.accent,fontWeight:500}}>{active.boulders.filter(b=>b.sends>0).length}</div>
                      <div style={{fontFamily:T.mono,fontSize:9,color:T.muted}}>SENDS</div>
                    </div>
                    <button onClick={()=>setShowEnd(true)} style={{padding:"7px 13px",borderRadius:8,border:`1px solid ${T.red}55`,background:`${T.red}14`,color:T.red,fontFamily:T.mono,fontSize:11,cursor:"pointer"}}>End ■</button>
                  </div>
                </div>

                <div style={{display:"flex",gap:8,marginBottom:20}}>
                  {["boulder","training"].map(lt=>(
                    <button key={lt} onClick={()=>setLogTab(lt)} style={{...pill(logTab===lt),flex:1,textAlign:"center",padding:"10px"}}>{lt.toUpperCase()}</button>
                  ))}
                </div>

                {logTab==="boulder" && (
                  <div className="fade-up">
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <Lbl style={{marginBottom:0}}>GRADE</Lbl>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {gymHasRanges && (
                          <div style={{display:"flex",gap:0,border:`1px solid ${T.border}`,borderRadius:20,overflow:"hidden"}}>
                            {[["Grades",false],["Colors",true]].map(([label,val])=>(
                              <button key={label} onClick={()=>setUseColors(val)} style={{
                                padding:"4px 10px",background:useColors===val?T.accent:"transparent",
                                color:useColors===val?"#080808":T.muted,
                                fontFamily:T.mono,fontSize:9,border:"none",cursor:"pointer",
                                fontWeight:useColors===val?500:300,
                              }}>{label}</button>
                            ))}
                          </div>
                        )}
                        <span style={{fontFamily:T.mono,fontSize:14,fontWeight:500,color:gradeColor(selGi,null),letterSpacing:1}}>
                          {grades[selGi]}
                        </span>
                      </div>
                    </div>
                    <div style={{marginBottom:20}}>
                      <GradeGrid/>
                    </div>

                    <Lbl>STYLE <span style={{color:T.dim,fontWeight:300}}>(optional)</span></Lbl>
                    <div style={{marginBottom:20}}>
                      <StyleSelector selected={selStyles} setSelected={setSelStyles}/>
                    </div>

                    <Lbl>PERCEIVED</Lbl>
                    <div style={{display:"flex",gap:8,marginBottom:20}}>
                      {[["Soft",T.green],["On",T.accent],["Hard",T.red]].map(([label,col],i)=>(
                        <button key={label} onClick={()=>setSelPerc(i)} style={{...pill(selPerc===i,col),flex:1,textAlign:"center"}}>{label}</button>
                      ))}
                    </div>

                    <div style={{display:"flex",gap:14,marginBottom:24,alignItems:"flex-start"}}>
                      <div style={{flex:1}}>
                        <Lbl>RESULT</Lbl>
                        <SendFellToggle
                          sent={selResult==="send"}
                          setSent={v=>setSelResult(v?"send":"proj")}
                        />
                      </div>
                      <div>
                        <Lbl>ATTEMPTS</Lbl>
                        <div style={{display:"flex",gap:5}}>
                          {[1,2,3,4,5].map(n=>(
                            <button key={n} onClick={()=>setSelAttempts(n)} style={{
                              width:34,height:34,borderRadius:6,
                              border:`1px solid ${selAttempts===n?T.accent:T.border}`,
                              background:selAttempts===n?`${T.accent}20`:T.surface,
                              color:selAttempts===n?T.accent:T.muted,
                              fontFamily:T.mono,fontSize:12,cursor:"pointer",
                            }}>{n}</button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button onClick={logBoulder} style={{
                      width:"100%",padding:"15px",borderRadius:10,border:"none",
                      background:T.accent,color:"#080808",fontFamily:T.font,fontSize:14,fontWeight:800,cursor:"pointer",letterSpacing:1,
                    }}>LOG {selResult==="send"?"SEND":"PROJ"} — {grades[selGi]}</button>

                    {active.boulders.length>0 && (
                      <div style={{marginTop:24}}>
                        <Lbl>THIS SESSION</Lbl>
                        {[...active.boulders].reverse().map(b=>(
                          <BoulderRow
                            key={b.id}
                            boulder={b}
                            gym={activeGym}
                            grades={grades}
                            onDelete={()=>deleteLiveBoulder(b.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {logTab==="training" && (
                  <div className="fade-up">
                    <TrainingForm exercises={exercises} onLog={logTraining} gradeSystem={gradeSystem} sessions={sessions} activeGym={activeGym}/>
                    {active.training.length>0 && (
                      <div style={{marginTop:24}}>
                        <Lbl>THIS SESSION</Lbl>
                        {[...active.training].reverse().map(t=>{
                          const ex=exercises.find(e=>e.id===t.exId);
                          const summary = ex?.fields.map(f=>{
                            const v=t.values?.[f.key];
                            if (v==null) return null;
                            if (f.unit==="idx") return `${f.label} ${grades[v]??v}`;
                            return `${f.label} ${v}${f.unit}`;
                          }).filter(Boolean).join(" · ");
                          const hasSetLogs = Array.isArray(t.setLogs) && t.setLogs.length > 0;
                          return (
                            <div key={t.id} style={{padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontFamily:T.font,fontSize:13,fontWeight:600,color:T.blue}}>{ex?.name}</div>
                                  <div style={{fontFamily:T.mono,fontSize:10,color:T.muted,marginTop:2}}>{summary}</div>
                                  {t.note&&<div style={{fontFamily:T.mono,fontSize:10,color:T.muted,marginTop:2}}>{t.note}</div>}
                                  {/* SetLogs mini summary */}
                                  {hasSetLogs && (
                                    <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
                                      {t.setLogs.map(sl=>(
                                        <div key={sl.set} style={{display:"flex",gap:4,alignItems:"center"}}>
                                          <span style={{fontFamily:T.mono,fontSize:9,color:T.muted,width:32}}>S{sl.set}</span>
                                          <div style={{display:"flex",gap:3}}>
                                            {sl.climbs.map((c,ci)=>{
                                              const col = gradeColor(c.gi, activeGym);
                                              return (
                                                <div key={ci} style={{
                                                  padding:"2px 6px",borderRadius:4,
                                                  border:`1px solid ${col}`,
                                                  background:"#181818",
                                                  fontFamily:T.mono,fontSize:9,color:col,
                                                  display:"flex",alignItems:"center",gap:3,
                                                }}>
                                                  {grades[c.gi]??c.gi}
                                                  <span style={{color:c.sent?T.green:T.red}}>{c.sent?"✓":"✗"}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <InlineDelete onDelete={()=>deleteLiveTraining(t.id)}/>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── HISTORY ──────────────────────────────────────────────────── */}
        {tab==="history" && (
          <div style={{flex:1,overflowY:"auto",padding:20}}>
            {sessions.length===0 && <Empty>No sessions yet</Empty>}
            {sessions.map(s=>{
              const gym=gyms.find(g=>g.id===s.gymId);
              const sends=s.boulders.filter(b=>b.sends>0);
              const maxGi=sends.length?Math.max(...sends.map(b=>b.gi)):null;
              const topCol=maxGi!=null?gradeColor(maxGi,null):null;
              const topTierCol=maxGi!=null?gradeColor(maxGi,gym):null;
              const topLbl=maxGi!=null?(grades[maxGi]??maxGi):null;
              return (
                <div key={s.id} style={{
                  background:T.surface,border:`1px solid ${s.id===activeId?T.accent:T.border}`,
                  borderRadius:12,padding:16,marginBottom:12,
                }}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1,cursor:!s.ended?"pointer":"default"}} onClick={()=>{if(!s.ended){setActiveId(s.id);setTab("log");}}}>
                      <div style={{fontFamily:T.font,fontSize:14,fontWeight:700,color:T.text}}>{gym?.name??s.gymId}</div>
                      <div style={{fontFamily:T.mono,fontSize:10,color:T.muted,marginTop:2}}>
                        {s.date} {s.durationMin?`· ${fmtDuration(s.durationMin)}`:""}{s.goal?` · ${s.goal}`:""}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      {maxGi!=null&&(
                        <div style={{display:"flex",alignItems:"center",gap:5,fontFamily:T.mono,fontSize:11,color:topCol,background:`${topCol}18`,border:`1px solid ${topCol}40`,padding:"3px 10px",borderRadius:20}}>
                          {gym?.ranges?.length && topTierCol && <span style={{width:8,height:8,borderRadius:"50%",background:topTierCol,display:"inline-block"}}/>}
                          TOP {topLbl}
                        </div>
                      )}
                      {s.id===activeId&&<div style={{fontFamily:T.mono,fontSize:10,color:T.accent}}>● LIVE</div>}
                      <button onClick={()=>setEditingSession(s)} style={{background:T.s2,border:`1px solid ${T.border}`,borderRadius:6,color:T.muted,fontFamily:T.mono,fontSize:10,padding:"5px 10px",cursor:"pointer"}}>Edit</button>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:20,marginTop:12}}>
                    <div><div style={{fontFamily:T.mono,fontSize:18,color:T.accent,fontWeight:500}}>{sends.length}</div><div style={{fontFamily:T.mono,fontSize:9,color:T.muted}}>SENDS</div></div>
                    <div><div style={{fontFamily:T.mono,fontSize:18,color:T.text,fontWeight:300}}>{s.boulders.reduce((a,b)=>a+b.attempts,0)}</div><div style={{fontFamily:T.mono,fontSize:9,color:T.muted}}>ATTEMPTS</div></div>
                    {s.training.length>0&&<div><div style={{fontFamily:T.mono,fontSize:18,color:T.blue,fontWeight:300}}>{s.training.length}</div><div style={{fontFamily:T.mono,fontSize:9,color:T.muted}}>TRAINING</div></div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LIBRARY ──────────────────────────────────────────────────── */}
        {tab==="library" && (
          <div style={{flex:1,overflowY:"auto",padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <Lbl style={{marginBottom:0}}>EXERCISE LIBRARY</Lbl>
              <button onClick={()=>setEditingEx({id:`ex_${uid()}`,name:"",category:"Custom",fields:[{key:"sets",label:"Sets",unit:""}],builtin:false})}
                style={{background:T.accent,color:"#080808",border:"none",borderRadius:8,fontFamily:T.font,fontSize:11,fontWeight:700,padding:"7px 12px"}}>
                + NEW
              </button>
            </div>

            {EXERCISE_CATEGORIES.map(cat=>{
              const items = exercisesByCategory[cat]||[];
              if (!items.length) return null;
              return (
                <div key={cat} style={{marginBottom:22}}>
                  <div style={{fontFamily:T.mono,fontSize:9,color:T.accent,letterSpacing:3,marginBottom:10}}>{cat.toUpperCase()}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {items.map(e=>{
                      // Built-in exercises with known timer IDs have hardcoded timer support
                      const BUILTIN_TIMER_IDS = ["ex_hang","ex_maxhang","ex_lock","ex_core","ex_arc","ex_pullup","ex_pushup","ex_campus","ex_4x4","ex_linkups","ex_limit","ex_silent"];
                      const hasBuiltinTimer = e.builtin && BUILTIN_TIMER_IDS.includes(e.id);
                      const timerMode = e.timerCfg?.type || "off";
                      const secFields = e.fields.filter(f=>f.unit==="s"||f.unit==="min");
                      const setExTimer = (mode, extra={}) => {
                        const cfg = mode==="off" ? null : { type:mode, label:e.name, durationKey: secFields[0]?.key||"", ...extra };
                        setExercises(p=>p.map(x=>x.id===e.id?{...x,timerCfg:cfg}:x));
                      };
                      const updExTimer = (k,v) => setExercises(p=>p.map(x=>x.id===e.id?{...x,timerCfg:{...x.timerCfg,[k]:v}}:x));
                      return (
                        <div key={e.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontFamily:T.font,fontSize:13,fontWeight:600,color:T.text}}>{e.name}</div>
                              <div style={{fontFamily:T.mono,fontSize:9,color:T.muted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                {e.fields.map(f=>`${f.label}${f.unit?`·${f.unit}`:""}`).join(" / ")}
                              </div>
                            </div>
                            <div style={{display:"flex",gap:4,marginLeft:10,flexShrink:0}}>
                              <button onClick={()=>setEditingEx(e)} style={{background:T.s2,border:`1px solid ${T.border}`,color:T.muted,fontFamily:T.mono,fontSize:10,padding:"5px 10px",borderRadius:6}}>Edit</button>
                              <InlineDelete onDelete={()=>deleteExercise(e.id)}/>
                            </div>
                          </div>

                          {/* Inline timer config — always visible, no modal */}
                          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:8,marginTop:4}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                              <div style={{fontFamily:T.mono,fontSize:9,color:T.muted,letterSpacing:2}}>TIMER</div>
                              {hasBuiltinTimer && (
                                <div style={{fontFamily:T.mono,fontSize:9,color:T.green,letterSpacing:1}}>● BUILT-IN</div>
                              )}
                            </div>
                            {hasBuiltinTimer ? (
                              <div style={{fontFamily:T.mono,fontSize:9,color:T.dim,lineHeight:1.6}}>
                                Uses a predefined timer for this exercise type — not customisable.
                              </div>
                            ) : (
                              <>
                                <div style={{display:"flex",gap:5}}>
                                  {[["off","Off"],["tap","Tap"],["timed","Countdown"]].map(([mode,label])=>(
                                    <button key={mode} onClick={()=>setExTimer(mode)} style={{
                                      padding:"5px 10px",borderRadius:16,fontFamily:T.mono,fontSize:10,
                                      border:`1px solid ${timerMode===mode?(mode==="timed"?T.green:mode==="tap"?T.blue:T.muted):T.border}`,
                                      background: timerMode===mode ? T.s2 : "transparent",
                                      color: timerMode===mode ? (mode==="timed"?T.green:mode==="tap"?T.blue:T.muted) : T.muted,
                                    }}>{label}</button>
                                  ))}
                                </div>
                                {timerMode==="timed" && (
                                  <div style={{display:"flex",gap:8,marginTop:8,alignItems:"center"}}>
                                    <div style={{flex:1}}>
                                      <div style={{fontFamily:T.mono,fontSize:9,color:T.muted,marginBottom:4}}>DURATION FIELD</div>
                                      <select value={e.timerCfg?.durationKey||""} onChange={ev=>updExTimer("durationKey",ev.target.value)} style={{...Inp,appearance:"menulist",fontSize:11,padding:"6px 10px"}}>
                                        <option value="">— pick —</option>
                                        {secFields.map((f,i)=>(<option key={i} value={f.key}>{f.label} ({f.unit})</option>))}
                                      </select>
                                    </div>
                                    <div style={{flex:1}}>
                                      <div style={{fontFamily:T.mono,fontSize:9,color:T.muted,marginBottom:4}}>LABEL</div>
                                      <input value={e.timerCfg?.label||""} onChange={ev=>updExTimer("label",ev.target.value)} style={{...Inp,fontSize:11,padding:"6px 10px"}} placeholder="GO"/>
                                    </div>
                                  </div>
                                )}
                                {timerMode==="tap" && (
                                  <div style={{marginTop:8}}>
                                    <div style={{fontFamily:T.mono,fontSize:9,color:T.muted,marginBottom:4}}>LABEL</div>
                                    <input value={e.timerCfg?.label||""} onChange={ev=>updExTimer("label",ev.target.value)} style={{...Inp,fontSize:11,padding:"6px 10px"}} placeholder="GO"/>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}
