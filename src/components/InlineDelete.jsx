import { useState } from 'react';
import { clsx } from 'clsx';
import { Trash2 } from 'lucide-react';

const btn = (large) => clsx(
  'bg-transparent border border-border rounded-[6px] font-mono cursor-pointer leading-none text-muted',
  large ? 'px-3.5 py-[9px] text-xs' : 'px-2 py-[3px] text-[10px]'
);

export default function InlineDelete({ onDelete, size = "small" }) {
  const [asking, setAsking] = useState(false);
  const large = size === "large";
  if (asking) return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="font-mono text-[10px] text-muted">Sure?</span>
      <button onClick={()=>{setAsking(false);onDelete();}} className={clsx(btn(large),'text-red border-red/35')}>Yes</button>
      <button onClick={()=>setAsking(false)} className={btn(large)}>No</button>
    </div>
  );
  return <button onClick={()=>setAsking(true)} className={btn(large)} style={{ display:'flex', alignItems:'center', gap:4 }}><Trash2 size={large?14:12}/></button>;
}
