import { clsx } from 'clsx';
import { pill } from '../../styles/shared';

export default function SendFellToggle({ sent, setSent, size="normal" }) {
  if (size === "compact") {
    return (
      <button onClick={()=>setSent(!sent)} className={clsx(
        'px-2.5 py-1.5 rounded-[6px] border bg-transparent font-mono text-[11px] whitespace-nowrap',
        sent ? 'border-green text-green' : 'border-red text-red'
      )}>
        {sent?"✓ SEND":"✗ FELL"}
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      <button onClick={()=>setSent(true)} className={clsx(pill(sent,'green'),'flex-1 text-center')}>✓ SEND</button>
      <button onClick={()=>setSent(false)} className={clsx(pill(!sent,'red'),'flex-1 text-center')}>✗ PROJ</button>
    </div>
  );
}
