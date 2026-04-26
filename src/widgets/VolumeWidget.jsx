import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import Empty from '../components/ui/Empty';

const DAYS_MAP = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, all: null };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const COLOR_SENDS  = 'var(--color-blue)';
const COLOR_FLASH  = 'var(--color-purple)';

const makeDot = (color, fmt) => (props) => {
  const { cx, cy, value } = props;
  if (value == null || isNaN(cx) || isNaN(cy)) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={2.5} fill={color}/>
      <text x={cx} y={cy - 6} textAnchor="middle"
        style={{ fontSize:7, fill:color, fontFamily:'var(--font-mono)', userSelect:'none' }}>
        {fmt ? fmt(value) : value}
      </text>
    </g>
  );
};
const GRAD_SENDS   = 'grad-vol-sends';
const GRAD_FLASH   = 'grad-vol-flash';

const getWeekKey = d => {
  const dt = new Date(d + 'T12:00:00');
  const jan1 = new Date(dt.getFullYear(), 0, 1);
  const wk = Math.ceil(((dt - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${dt.getFullYear()}-W${String(wk).padStart(2, '0')}`;
};

export default function VolumeWidget({ allSessions, period, agg }) {
  const { data, totalSends, totalFlashes } = useMemo(() => {
    const days = DAYS_MAP[period] ?? null;
    const cutoff = days
      ? new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
      : null;

    const ended = [...(allSessions || [])]
      .filter(s => s.ended && (!cutoff || s.date >= cutoff))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Raw per-session points
    const rawPts = ended.map(s => {
      const boulders = s.boulders || [];
      const sends  = boulders.filter(b => b.sends > 0).length;
      const flashes = boulders.filter(b => b.sends > 0 && b.attempts === 1).length;
      return { date: s.date, sends, flashes };
    });

    // Period totals (all sessions, not just chart points)
    const tSends  = rawPts.reduce((a, p) => a + p.sends, 0);
    const tFlashes = rawPts.reduce((a, p) => a + p.flashes, 0);

    const toTs = d => new Date(d + 'T12:00:00').getTime();

    let chartData;
    if (agg === 'session') {
      const byDay = {};
      rawPts.forEach(p => {
        if (!byDay[p.date]) byDay[p.date] = { date: p.date, sends: 0, flashes: 0 };
        byDay[p.date].sends   += p.sends;
        byDay[p.date].flashes += p.flashes;
      });
      chartData = Object.values(byDay)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(d => ({ ts: toTs(d.date), sends: d.sends, flashes: d.flashes }));
    } else {
      const grouped = {};
      rawPts.forEach(p => {
        const key = agg === 'weekly' ? getWeekKey(p.date) : p.date.slice(0, 7);
        if (!grouped[key]) grouped[key] = { key, firstDate: p.date, sends: [], flashes: [] };
        grouped[key].sends.push(p.sends);
        grouped[key].flashes.push(p.flashes);
      });
      const sum = arr => arr.reduce((a, v) => a + v, 0);
      chartData = Object.values(grouped)
        .sort((a, b) => a.key.localeCompare(b.key))
        .map(g => ({
          ts: agg === 'monthly'
            ? new Date(g.key + '-01T12:00:00').getTime()
            : toTs(g.firstDate),
          sends:   Math.round(sum(g.sends)  / g.sends.length),
          flashes: Math.round(sum(g.flashes) / g.flashes.length),
        }));
    }

    return { data: chartData, totalSends: tSends, totalFlashes: tFlashes };
  }, [allSessions, period, agg]);

  const flashPct = totalSends > 0 ? Math.round((totalFlashes / totalSends) * 100) : 0;

  if (data.length < 2) return <Empty>Not enough data</Empty>;

  return (
    <div style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}>
      {/* Stats row */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 8, paddingLeft: 2,
        fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'var(--color-muted)',
      }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span>Sends</span>
          <strong style={{ color: COLOR_SENDS, fontSize: 13 }}>{totalSends}</strong>
        </span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span>Flash</span>
          <strong style={{ color: COLOR_FLASH, fontSize: 13 }}>{flashPct}%</strong>
        </span>
      </div>

      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id={GRAD_SENDS} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLOR_SENDS} stopOpacity={0.22} />
              <stop offset="95%" stopColor={COLOR_SENDS} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={GRAD_FLASH} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLOR_FLASH} stopOpacity={0.22} />
              <stop offset="95%" stopColor={COLOR_FLASH} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="ts" type="number" scale="time"
            domain={['dataMin', 'dataMax']}
            tickCount={4} minTickGap={36}
            tickFormatter={ts => { const d = new Date(ts); return MONTHS[d.getMonth()].slice(0,3) + ' ' + d.getDate(); }}
            tick={{ fontSize: 8, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tickCount={4}
            tick={{ fontSize: 8, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
            axisLine={false} tickLine={false} width={24}
          />
          <Tooltip
            content={
              <ChartTooltip
                valueFormatter={(v, name) =>
                  name === 'flashes' ? `Flash: ${v}` : `Sends: ${v}`
                }
              />
            }
            cursor={{ stroke: COLOR_SENDS, strokeWidth: 1, strokeOpacity: 0.3 }}
          />
          <Area type="monotone" dataKey="sends" stroke={COLOR_SENDS} strokeWidth={2}
            fill={`url(#${GRAD_SENDS})`}
            dot={makeDot(COLOR_SENDS)}
            activeDot={{ r: 4, fill: COLOR_SENDS, strokeWidth: 0 }}
          />
          <Area type="monotone" dataKey="flashes" stroke={COLOR_FLASH} strokeWidth={2}
            fill={`url(#${GRAD_FLASH})`}
            dot={makeDot(COLOR_FLASH)}
            activeDot={{ r: 4, fill: COLOR_FLASH, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
