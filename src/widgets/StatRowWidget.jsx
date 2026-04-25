export default function StatRowWidget({ stats, sessions }) {
  const items = [
    { label: 'SESSIONS', value: sessions.length, color: 'var(--color-accent)' },
    { label: 'SENDS',    value: stats.totalSends,         color: 'var(--color-green)'  },
    { label: 'ATTEMPTS', value: stats.totalAtt,           color: 'var(--color-muted)'  },
  ];
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map(({ label, value, color }) => (
        <div key={label} className="bg-surface border border-border rounded-[10px] py-3.5 text-center">
          <div className="font-mono text-[22px] font-medium" style={{ color }}>{value}</div>
          <div className="font-mono text-[8px] text-muted tracking-[2px] mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}
