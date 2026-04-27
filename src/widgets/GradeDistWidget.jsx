import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import Empty from '../components/ui/Empty';

const DAYS_MAP = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, all: null };

export default function GradeDistWidget({ allSessions, period, grades }) {
  const data = useMemo(() => {
    const days = DAYS_MAP[period] ?? null;
    const cutoff = days
      ? new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
      : null;

    const ended = (allSessions || []).filter(s => s.ended && (!cutoff || s.date >= cutoff));

    const byGi = {};
    ended.forEach(s => {
      (s.boulders || []).forEach(b => {
        byGi[b.gi] = (byGi[b.gi] || 0) + b.attempts;
      });
    });

    return Object.keys(byGi)
      .map(Number)
      .sort((a, b) => a - b)
      .map(gi => ({ grade: grades?.[gi] ?? `#${gi}`, attempts: byGi[gi] }));
  }, [allSessions, period, grades]);

  if (!data.length) return <Empty>No attempts logged yet</Empty>;

  return (
    <ResponsiveContainer width="100%" height={110}>
      <BarChart data={data} margin={{ top: 10, right: 22, left: -4, bottom: 0 }} barSize={14}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.6} />
        <XAxis dataKey="grade" tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          width={28}
          label={{ value: 'n', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' } }}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={v => `${v} attempt${v !== 1 ? 's' : ''}`} />}
          cursor={{ fill: 'var(--color-border)', opacity: 0.5 }}
        />
        <Bar dataKey="attempts" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
