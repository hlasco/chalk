import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import Empty from '../components/ui/Empty';

const COLOR = 'var(--color-blue)';
const GRAD_ID = 'grad-volume';

export default function VolumeWidget({ stats }) {
  const { sessionVol } = stats;
  if (!sessionVol || sessionVol.length < 2) return <Empty>Need 2+ sessions</Empty>;

  const data = sessionVol.map(d => ({ label: d.label, attempts: d.v }));

  return (
    <ResponsiveContainer width="100%" height={110}>
      <AreaChart data={data} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={GRAD_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={COLOR} stopOpacity={0.25} />
            <stop offset="95%" stopColor={COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.6} />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} width={24} />
        <Tooltip
          content={<ChartTooltip valueFormatter={v => `${v} attempts`} />}
          cursor={{ stroke: COLOR, strokeWidth: 1, strokeOpacity: 0.4 }}
        />
        <Area
          type="monotone" dataKey="attempts" stroke={COLOR} strokeWidth={2}
          fill={`url(#${GRAD_ID})`}
          dot={{ r: 3.5, fill: COLOR, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: COLOR, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
