import PlotBuilder from '../components/charts/PlotBuilder';

export default function CustomPlotWidget({ allSessions, exercises, gyms, gradeSystem, period, agg }) {
  return (
    <PlotBuilder
      sessions={allSessions}
      exercises={exercises}
      gyms={gyms}
      gradeSystem={gradeSystem}
      period={period}
      agg={agg}
    />
  );
}
