// Shared dark-theme tooltip for all Recharts widgets
export default function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-s2 border border-border rounded-[8px] px-2.5 py-2">
      {label && <div className="font-mono text-[9px] text-muted mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="font-mono text-[11px]" style={{ color: p.color || 'var(--color-text)' }}>
          {valueFormatter ? valueFormatter(p.value, p.name) : p.value}
        </div>
      ))}
    </div>
  );
}
