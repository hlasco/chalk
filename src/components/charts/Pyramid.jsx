import { gradesFor, DEFAULT_GRADE_COLORS } from '../../utils/gradeUtils';
import Empty from '../ui/Empty';

export default function Pyramid({ sessions, gradeSystem }) {
  const grades = gradesFor(gradeSystem);
  const counts = {};
  sessions.forEach(s=>{
    s.boulders.forEach(b=>{
      if (b.sends>0) counts[b.gi]=(counts[b.gi]||0)+b.sends;
    });
    s.training.forEach(t=>{
      (Array.isArray(t.setLogs)?t.setLogs:[]).forEach(sl=>{
        (sl.climbs||[]).forEach(c=>{
          if (c.sent) counts[c.gi]=(counts[c.gi]||0)+1;
        });
      });
    });
  });
  const gis = Object.keys(counts).map(Number).sort((a,b)=>a-b);
  if (!gis.length) return <Empty>No sends yet</Empty>;
  const max = Math.max(...gis.map(i=>counts[i]));
  return (
    <div className="flex flex-col gap-1.5">
      {[...gis].reverse().map(gi=>{
        const col = DEFAULT_GRADE_COLORS[gi] ?? "#888";
        return (
          <div key={gi} className="flex items-center gap-2">
            <div className="font-mono text-[11px] w-[38px] text-right" style={{color:col}}>{grades[gi]??`#${gi}`}</div>
            <div className="flex-1 h-[11px] bg-s2 rounded-[2px] overflow-hidden">
              <div className="h-full rounded-[2px]" style={{width:`${(counts[gi]/max)*100}%`,background:col}}/>
            </div>
            <div className="font-mono text-[10px] text-muted w-[14px]">{counts[gi]}</div>
          </div>
        );
      })}
    </div>
  );
}
