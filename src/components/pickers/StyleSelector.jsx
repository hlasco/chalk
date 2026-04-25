import { clsx } from 'clsx';
import { STYLES } from '../../constants';

export default function StyleSelector({ selected, setSelected, size="normal" }) {
  const toggle = s => setSelected(p => p.includes(s) ? p.filter(x=>x!==s) : [...p,s]);
  const compact = size === "compact";
  return (
    <div className={clsx('flex flex-wrap', compact ? 'gap-[5px]' : 'gap-1.5')}>
      {STYLES.map(s=>{
        const on = selected.includes(s);
        return (
          <button key={s} onClick={()=>toggle(s)} className={clsx(
            'border font-mono whitespace-nowrap',
            compact ? 'px-2.5 py-1 rounded-[14px] text-[9px]' : 'px-3.5 py-1.5 rounded-full text-[11px]',
            on ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-transparent text-muted'
          )}>
            {s}
          </button>
        );
      })}
    </div>
  );
}
