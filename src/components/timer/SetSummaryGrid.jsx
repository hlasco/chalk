import { gradeColor } from '../../utils/gradeUtils';

export default function SetSummaryGrid({ setLogs, sets, climbs, grades, gym }) {
  return (
    <div className="w-full max-w-[380px] px-1">
      {Array.from({length:sets},(_,si)=>{
        const log = setLogs[si];
        return (
          <div key={si} className="mb-1.5">
            <div className="font-mono text-[9px] text-muted tracking-[2px] mb-1">SET {si+1}</div>
            <div className="flex gap-[5px] flex-wrap">
              {Array.from({length:climbs},(_,ci)=>{
                const c = log?.climbs?.[ci];
                const col = c ? gradeColor(c.gi,gym) : "var(--color-border)";
                return (
                  <div key={ci} style={{
                    padding:"5px 8px",borderRadius:6,minWidth:42,textAlign:"center",
                    border:`1px solid ${col}`,
                    background:c?"#1a1a1a":"#0f0f0f",
                    fontFamily:"var(--font-mono)",fontSize:11,color:c?col:"var(--color-dim)",
                  }}>
                    {c ? <>
                      {grades[c.gi]??`#${c.gi}`}
                      <div style={{fontSize:8,color:c.sent?"var(--color-green)":"var(--color-red)",marginTop:1}}>
                        {c.sent?"✓":"✗"}
                      </div>
                    </> : <span style={{color:"var(--color-dim)"}}>—</span>}
                  </div>
                );
              })}
              {!log && (
                <div className="font-mono text-[9px] text-dim self-center ml-1">not logged</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
