import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import Empty from '../components/ui/Empty';

const COLOR = 'var(--color-accent)';

export default function StyleRadarWidget({ stats }) {
  const { styleRadar } = stats;
  if (!styleRadar || styleRadar.length < 3) return <Empty>Need 3+ styles attempted</Empty>;

  const data = styleRadar.map(d => ({ label: d.label, value: Math.round(d.v * 100) }));

  return (
    <ResponsiveContainer width="100%" height={210}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="68%">
        <PolarGrid stroke="var(--color-border)" />
        <PolarAngleAxis
          dataKey="label"
          tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={v => `${v}% sends`} />}
        />
        <Radar
          dataKey="value" name="Send rate"
          stroke={COLOR} strokeWidth={1.5}
          fill={COLOR} fillOpacity={0.12}
          dot={{ r: 3, fill: COLOR, strokeWidth: 0 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
