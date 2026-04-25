import { useState } from 'react';
import { clsx } from 'clsx';
import { gradeColor } from '../../utils/gradeUtils';

function GradeCompactPicker({ gi, setGi, grades, gym }) {
  const [offset, setOffset] = useState(0);
  const centre = gi + offset;
  const windowGrades = [-2,-1,0,1,2].map(off => {
    const idx = centre + off;
    return { idx, label: idx>=0&&idx<grades.length ? grades[idx] : null };
  });
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={()=>setOffset(p=>p-1)} className="bg-transparent border border-border rounded-[6px] text-muted px-2 py-1 font-mono text-[14px]">‹</button>
      <div className="flex-1 flex gap-[5px] justify-center">
        {windowGrades.map(({idx,label:gl})=>{
          if (!gl) return <div key={idx} className="w-11"/>;
          const on = idx === gi;
          const c = gradeColor(idx, gym);
          return (
            <button key={idx} onClick={()=>{setGi(idx);setOffset(0);}} style={{borderColor:on?c:undefined,color:on?c:undefined}} className={clsx(
              'py-2 px-1 rounded-[6px] min-w-[44px] font-mono text-xs',
              on ? 'border font-semibold bg-[#242424]' : 'border border-border font-light bg-s2 text-muted'
            )}>{gl}</button>
          );
        })}
      </div>
      <button onClick={()=>setOffset(p=>p+1)} className="bg-transparent border border-border rounded-[6px] text-muted px-2 py-1 font-mono text-[14px]">›</button>
    </div>
  );
}

export default function GradeSelector({ gi, setGi, grades, gym, mode="grid", useColors=false }) {
  const gymHasRanges = !!gym?.ranges?.length;

  if (mode === "tiers" && gymHasRanges && useColors) {
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {gym.ranges.map((r,i)=>{
          const midGi = Math.round((r.minGi + r.maxGi) / 2);
          const on = gi >= r.minGi && gi <= r.maxGi;
          const fromLabel = grades[r.minGi] ?? `#${r.minGi}`;
          const toLabel   = grades[r.maxGi] ?? `#${r.maxGi}`;
          const rangeStr  = r.minGi === r.maxGi ? fromLabel : `${fromLabel} ${toLabel}`;
          return (
            <button key={i} onClick={()=>setGi(midGi)} style={{borderColor:r.color,color:r.color,filter:on?"none":"brightness(0.55)"}}
              className={clsx('py-3 px-1.5 rounded-[8px] font-mono text-xs flex flex-col items-center gap-1',on?'bg-[#242424] font-semibold':'bg-[#1a1a1a] font-light')}>
              <div className="flex items-center gap-1.5">
                <span className="w-[9px] h-[9px] rounded-full shrink-0 inline-block" style={{background:r.color}}/>
                <span>{r.name||"—"}</span>
              </div>
              <span className="text-[9px] tracking-[1px]">{rangeStr}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (mode === "compact") {
    return <GradeCompactPicker gi={gi} setGi={setGi} grades={grades} gym={gym}/>;
  }

  if (gymHasRanges) {
    return (
      <div className="grid grid-cols-5 gap-[5px]">
        {grades.map((g,gidx)=>{
          const tier = gym.ranges.find(r => gidx >= r.minGi && gidx <= r.maxGi);
          const col  = tier?.color;
          const on   = gi === gidx;
          return (
            <button key={gidx} onClick={()=>setGi(gidx)} style={{borderColor:col,color:col,filter:on?"brightness(0.9)":"brightness(0.45)"}}
              className={clsx('py-[11px] rounded-[8px] border font-mono text-xs',on?'bg-[#242424] font-semibold':'bg-[#1a1a1a] font-light')}>{g}</button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-[5px]">
      {grades.map((g,gidx)=>{
        const on = gi === gidx;
        return (
          <button key={gidx} onClick={()=>setGi(gidx)} className={clsx(
            'py-[11px] rounded-[8px] border font-mono text-xs',
            on ? 'border-text bg-[#242424] text-text font-semibold' : 'border-border bg-s2 text-muted font-light'
          )}>{g}</button>
        );
      })}
    </div>
  );
}
