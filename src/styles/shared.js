import { clsx } from 'clsx';

export const inp = 'bg-s2 border border-border rounded-[6px] text-text font-mono text-xs px-3 py-[9px] w-full';

export const pill = (on, col = 'accent') => clsx(
  'px-3.5 py-1.5 rounded-full font-mono text-[11px] tracking-[1px] cursor-pointer whitespace-nowrap border',
  on
    ? `border-${col} bg-${col}/10 text-${col}`
    : 'border-border bg-transparent text-muted'
);
