import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import Empty from '../components/ui/Empty';

const COLOR = 'var(--color-accent)';
const GRAD_ID = 'grad-maxgrade';

export default function MaxGradeWidget({ stats, grades }) {
  const { maxGradeHist } = stats;
  if (!maxGradeHist || maxGradeHist.length < 2) return <Empty>Need 2+ sessions with sends</Empty>;

  const data = maxGradeHist.map(d => ({ label: d.label, gi: d.v }));
  const allGis = data.map(d => d.gi);
  const minGi = Math.min(...allGis);
  const maxGi = Math.max(...allGis);

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={GRAD_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={COLOR} stopOpacity={0.25} />
            <stop offset="95%" stopColor={COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.6} />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
        <YAxis
          domain={[Math.max(0, minGi - 1), maxGi + 1]}
          tickFormatter={v => grades[Math.round(v)] ?? `#${Math.round(v)}`}
          tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
          axisLine={false} tickLine={false} width={28}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={v => grades[Math.round(v)] ?? `#${Math.round(v)}`} />}
          cursor={{ stroke: COLOR, strokeWidth: 1, strokeOpacity: 0.4 }}
        />
        <Area
          type="monotone" dataKey="gi" stroke={COLOR} strokeWidth={2}
          fill={`url(#${GRAD_ID})`}
          dot={{ r: 3.5, fill: COLOR, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: COLOR, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
