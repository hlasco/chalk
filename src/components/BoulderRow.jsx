import { gradeColor } from '../utils/gradeUtils';
import InlineDelete from './InlineDelete';

export default function BoulderRow({ boulder, gym, grades, onDelete }) {
  const col = gradeColor(boulder.gi, null);
  const tierCol = gym?.ranges?.length ? gradeColor(boulder.gi, gym) : null;
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-border">
      {tierCol && <span className="w-[9px] h-[9px] rounded-full shrink-0 inline-block" style={{background:tierCol}}/>}
      <div className="font-mono text-[13px] font-medium w-[38px]" style={{color:col}}>{grades[boulder.gi]??boulder.gi}</div>
      <div className="flex-1 font-mono text-[10px] text-muted">
        {boulder.styles.join(", ")||"—"}{boulder.perceived!=null?` · ${["Soft","On","Hard"][boulder.perceived]}`:""}
      </div>
      <div className="font-mono text-[11px]" style={{color:boulder.sends>0?"var(--color-green)":"var(--color-red)"}}>
        {boulder.sends>0?"✓":"✗"} ({boulder.attempts})
      </div>
      {onDelete && <InlineDelete onDelete={onDelete}/>}
    </div>
  );
}
