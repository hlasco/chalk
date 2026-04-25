import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { DEFAULT_GRADE_COLORS } from '../utils/gradeUtils';
import ChartTooltip from './ChartTooltip';
import Empty from '../components/ui/Empty';

export default function GradeDistWidget({ stats }) {
  const { gradeDist } = stats;
  if (!gradeDist || !gradeDist.length) return <Empty>No attempts logged yet</Empty>;

  const data = gradeDist.map(d => ({
    grade: d.label,
    attempts: d.v,
    color: DEFAULT_GRADE_COLORS[d.gi] ?? '#888',
  }));

  return (
    <ResponsiveContainer width="100%" height={110}>
      <BarChart data={data} margin={{ top: 12, right: 4, left: -24, bottom: 0 }} barSize={14}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.6} />
        <XAxis dataKey="grade" tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} width={24} />
        <Tooltip
          content={<ChartTooltip valueFormatter={v => `${v} attempt${v !== 1 ? 's' : ''}`} />}
          cursor={{ fill: 'var(--color-border)', opacity: 0.5 }}
        />
        <Bar dataKey="attempts" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
