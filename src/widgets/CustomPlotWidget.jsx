import PlotBuilder from '../components/charts/PlotBuilder';

export default function CustomPlotWidget({ allSessions, exercises, gyms, gradeSystem }) {
  return (
    <PlotBuilder
      sessions={allSessions}
      exercises={exercises}
      gyms={gyms}
      gradeSystem={gradeSystem}
    />
  );
}
