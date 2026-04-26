import { useState, useMemo } from 'react';
import Empty from '../components/ui/Empty';

const DAYS_MAP = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, all: null };
const BAR_H = 18;
const TOP_N = 10;

export default function SendPyramidWidget({ allSessions, grades, period }) {
  const [expanded, setExpanded] = useState(false);

  const { rows, totalSends } = useMemo(() => {
    const days = DAYS_MAP[period] ?? null;
    const cutoff = days
      ? new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
      : null;

    const ended = (allSessions || []).filter(s => s.ended && (!cutoff || s.date >= cutoff));

    // Per grade: accumulate attempts, sends, flashes
    const byGi = {};
    ended.forEach(s => {
      (s.boulders || []).forEach(b => {
        if (!byGi[b.gi]) byGi[b.gi] = { attempts: 0, sends: 0, flashes: 0 };
        byGi[b.gi].attempts += b.attempts ?? 0;
        if (b.sends > 0) {
          byGi[b.gi].sends += 1;
          if (b.attempts === 1) byGi[b.gi].flashes += 1;
        }
      });
    });

    const gis = Object.keys(byGi).map(Number).sort((a, b) => b - a);
    if (!gis.length) return { rows: [], totalSends: 0 };

    const maxAttempts = Math.max(...gis.map(gi => byGi[gi].attempts));
    const builtRows = gis.map(gi => ({
      gi,
      label: grades?.[gi] ?? `#${gi}`,
      attempts: byGi[gi].attempts,
      sends: byGi[gi].sends,
      flashes: byGi[gi].flashes,
      attemptPct: maxAttempts > 0 ? byGi[gi].attempts / maxAttempts : 0,
      sendPct: maxAttempts > 0 ? byGi[gi].sends / maxAttempts : 0,
    }));

    const total = builtRows.reduce((acc, r) => acc + r.sends, 0);
    return { rows: builtRows, totalSends: total };
  }, [allSessions, grades, period]);

  if (!rows.length) return <Empty>No sends yet</Empty>;

  const visible = expanded ? rows : rows.slice(0, TOP_N);
  const hasMore = rows.length > TOP_N;

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visible.map(row => (
          <div key={row.gi} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Grade label */}
            <div
              style={{
                width: 28,
                flexShrink: 0,
                color: 'var(--color-muted)',
                textAlign: 'right',
                fontSize: 10,
              }}
            >
              {row.label}
            </div>

            {/* Bar container */}
            <div style={{ flex: 1, position: 'relative', height: BAR_H }}>
              {/* Dark background bar (attempts) */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: BAR_H,
                  width: `${Math.max(row.attemptPct * 100, 4)}%`,
                  background: 'color-mix(in srgb, var(--color-accent) 18%, transparent)',
                  borderRadius: 999,
                }}
              />
              {/* Bright accent bar (sends) */}
              {row.sends > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: BAR_H,
                    width: `${Math.max(row.sendPct * 100, 4)}%`,
                    background: 'var(--color-accent)',
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 6,
                    paddingRight: 4,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  {row.flashes > 0 && (
                    <span
                      style={{
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        lineHeight: 1,
                      }}
                    >
                      ⚡{row.flashes}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Sends count (right) */}
            <div
              style={{
                width: 20,
                flexShrink: 0,
                color: 'var(--color-accent)',
                textAlign: 'right',
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {row.sends}
            </div>
          </div>
        ))}
      </div>

      {/* Expand / collapse */}
      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            marginTop: 8,
            background: 'none',
            border: 'none',
            color: 'var(--color-muted)',
            fontSize: 10,
            cursor: 'pointer',
            padding: '2px 0',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {expanded ? '▲ Show less' : `▼ Show all ${rows.length} grades`}
        </button>
      )}

      {/* Total */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          color: 'var(--color-muted)',
          fontSize: 10,
        }}
      >
        <span>Total sends</span>
        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{totalSends}</span>
      </div>
    </div>
  );
}
