import { clsx } from 'clsx';

export default function Lbl({ children, className, style }) {
  return (
    <div className={clsx('font-mono text-[11px] text-muted tracking-[2px] mb-3', className)} style={style}>
      {children}
    </div>
  );
}
