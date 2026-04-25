import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DEFAULT_GRADE_COLORS } from '../utils/gradeUtils';
import { gradesFor } from '../utils/gradeUtils';
import ChartTooltip from './ChartTooltip';
import Empty from '../components/ui/Empty';

export default function SendPyramidWidget({ sessions, gradeSystem }) {
  const grades = gradesFor(gradeSystem);
  const counts = {};
  sessions.forEach(s => {
    s.boulders.forEach(b => { if (b.sends > 0) counts[b.gi] = (counts[b.gi] || 0) + b.sends; });
    s.training.forEach(t =>
      (Array.isArray(t.setLogs) ? t.setLogs : []).forEach(sl =>
        (sl.climbs || []).forEach(c => { if (c.sent) counts[c.gi] = (counts[c.gi] || 0) + 1; })
      )
    );
  });

  const gis = Object.keys(counts).map(Number).sort((a, b) => b - a);
  if (!gis.length) return <Empty>No sends yet</Empty>;

  const data = gis.map(gi => ({
    grade: grades[gi] ?? `#${gi}`,
    sends: counts[gi],
    color: DEFAULT_GRADE_COLORS[gi] ?? '#888',
    gi,
  }));

  return (
    <ResponsiveContainer width="100%" height={data.length * 30 + 8}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, left: 2, bottom: 0 }} barSize={12}>
        <XAxis type="number" hide />
        <YAxis
          type="category" dataKey="grade" width={32} axisLine={false} tickLine={false}
          tick={{ fontSize: 10, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={v => `${v} send${v !== 1 ? 's' : ''}`} />}
          cursor={{ fill: 'var(--color-border)', opacity: 0.4 }}
        />
        <Bar dataKey="sends" radius={[0, 4, 4, 0]} minPointSize={3}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
