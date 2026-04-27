import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import Empty from '../components/ui/Empty';

const DAYS_MAP = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, all: null };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const COLOR_SEND  = 'var(--color-accent)';
const COLOR_FLASH = 'var(--color-purple)';

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
const GRAD_SEND   = 'grad-maxsend';
const GRAD_FLASH  = 'grad-maxflash';

const getWeekKey = d => {
  const dt = new Date(d + 'T12:00:00');
  const jan1 = new Date(dt.getFullYear(), 0, 1);
  const wk = Math.ceil(((dt - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${dt.getFullYear()}-W${String(wk).padStart(2, '0')}`;
};

export default function MaxGradeWidget({ allSessions, grades, period, agg }) {
  const data = useMemo(() => {
    const days = DAYS_MAP[period] ?? null;
    const cutoff = days
      ? new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
      : null;

    const ended = [...(allSessions || [])]
      .filter(s => s.ended && (!cutoff || s.date >= cutoff))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Build raw points per session
    const rawPts = ended.map(s => {
      const boulders = s.boulders || [];
      const sends  = boulders.filter(b => b.sends > 0);
      const flashes = boulders.filter(b => b.sends > 0 && b.attempts === 1);
      return {
        date: s.date,
        maxSend:  sends.length  ? Math.max(...sends.map(b => b.gi))  : null,
        maxFlash: flashes.length ? Math.max(...flashes.map(b => b.gi)) : null,
      };
    }).filter(p => p.maxSend !== null || p.maxFlash !== null);

    const toTs = d => new Date(d + 'T12:00:00').getTime();

    if (agg === 'session') {
      const byDay = {};
      rawPts.forEach(p => {
        if (!byDay[p.date]) byDay[p.date] = { date: p.date, maxSend: null, maxFlash: null };
        const d = byDay[p.date];
        if (p.maxSend  !== null) d.maxSend  = d.maxSend  === null ? p.maxSend  : Math.max(d.maxSend,  p.maxSend);
        if (p.maxFlash !== null) d.maxFlash = d.maxFlash === null ? p.maxFlash : Math.max(d.maxFlash, p.maxFlash);
      });
      return Object.values(byDay)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(d => ({ ts: toTs(d.date), maxSend: d.maxSend, maxFlash: d.maxFlash }));
    }

    // Group by week or month
    const grouped = {};
    rawPts.forEach(p => {
      const key = agg === 'weekly' ? getWeekKey(p.date) : p.date.slice(0, 7);
      if (!grouped[key]) grouped[key] = { key, firstDate: p.date, sends: [], flashes: [] };
      if (p.maxSend  !== null) grouped[key].sends.push(p.maxSend);
      if (p.maxFlash !== null) grouped[key].flashes.push(p.maxFlash);
    });

    return Object.values(grouped)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(g => ({
        ts: agg === 'monthly'
          ? new Date(g.key + '-01T12:00:00').getTime()
          : toTs(g.firstDate),
        maxSend:  g.sends.length  ? Math.max(...g.sends)  : null,
        maxFlash: g.flashes.length ? Math.max(...g.flashes) : null,
      }));
  }, [allSessions, period, agg]);

  const allGis = data.flatMap(d => [d.maxSend, d.maxFlash].filter(v => v !== null));
  const minGi  = allGis.length ? Math.min(...allGis) : 0;
  const maxGi  = allGis.length ? Math.max(...allGis) : 1;

  if (data.length < 2) return <Empty>Not enough data</Empty>;

  return (
    <div style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}>
      {/* Legend */}
      <div style={{
        display: 'flex', gap: 14, marginBottom: 6, paddingLeft: 4,
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8,
            borderRadius: '50%', background: COLOR_SEND,
          }} />
          Top
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8,
            borderRadius: '50%', background: COLOR_FLASH,
          }} />
          Flash ⚡
        </span>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 10, right: 22, left: -4, bottom: 0 }}>
          <defs>
            <linearGradient id={GRAD_SEND} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLOR_SEND} stopOpacity={0.25} />
              <stop offset="95%" stopColor={COLOR_SEND} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={GRAD_FLASH} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLOR_FLASH} stopOpacity={0.22} />
              <stop offset="95%" stopColor={COLOR_FLASH} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.6} />
          <XAxis
            dataKey="ts" type="number" scale="time"
            domain={['dataMin', 'dataMax']}
            tickCount={4} minTickGap={36}
            tickFormatter={ts => { const d = new Date(ts); return MONTHS[d.getMonth()].slice(0,3) + ' ' + d.getDate(); }}
            tick={{ fontSize: 8, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            domain={[Math.max(0, minGi - 1), maxGi + 1]}
            tickFormatter={v => grades?.[Math.round(v)] ?? ''}
            tickCount={Math.min(6, maxGi - minGi + 3)}
            tick={{ fontSize: 8, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
            axisLine={false} tickLine={false} width={28}
          />
          <Tooltip
            content={
              <ChartTooltip
                valueFormatter={(v, name) => {
                  const label = name === 'maxFlash' ? 'Flash' : 'Top';
                  return `${label}: ${grades?.[Math.round(v)] ?? `#${Math.round(v)}`}`;
                }}
              />
            }
            cursor={{ stroke: COLOR_SEND, strokeWidth: 1, strokeOpacity: 0.4 }}
          />
          <Area type="monotone" dataKey="maxSend" stroke={COLOR_SEND} strokeWidth={2}
            fill={`url(#${GRAD_SEND})`}
            dot={makeDot(COLOR_SEND, v => grades?.[Math.round(v)] ?? '')}
            activeDot={{ r: 4, fill: COLOR_SEND, strokeWidth: 0 }}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="maxFlash"
            stroke={COLOR_FLASH}
            strokeWidth={2}
            fill={`url(#${GRAD_FLASH})`}
            dot={makeDot(COLOR_FLASH, v => grades?.[Math.round(v)] ?? '')}
            activeDot={{ r: 4, fill: COLOR_FLASH, strokeWidth: 0 }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
