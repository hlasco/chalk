import SendPyramidWidget  from './SendPyramidWidget';
import MaxGradeWidget     from './MaxGradeWidget';
import VolumeWidget       from './VolumeWidget';
import GradeDistWidget    from './GradeDistWidget';
import StyleRadarWidget   from './StyleRadarWidget';
import StatRowWidget      from './StatRowWidget';
import CustomPlotWidget   from './CustomPlotWidget';

// Each entry describes a widget type available in the picker.
// Adding a new widget = add one entry here + create the component file.
export const WIDGET_REGISTRY = {
  stat_row: {
    id: 'stat_row',
    label: 'Stats Summary',
    description: 'Sessions · Sends · Attempts at a glance',
    category: 'Overview',
    icon: '📊',
    component: StatRowWidget,
    singleton: true, // suggest only one instance
  },
  send_pyramid: {
    id: 'send_pyramid',
    label: 'Send Pyramid',
    description: 'Number of sends per grade',
    category: 'Climbing',
    icon: '▲',
    component: SendPyramidWidget,
  },
  max_grade: {
    id: 'max_grade',
    label: 'Max Grade Trend',
    description: 'Highest grade sent per session over time',
    category: 'Climbing',
    icon: '📈',
    component: MaxGradeWidget,
  },
  attempt_volume: {
    id: 'attempt_volume',
    label: 'Attempt Volume',
    description: 'Total attempts per session over time',
    category: 'Climbing',
    icon: '🔁',
    component: VolumeWidget,
  },
  grade_dist: {
    id: 'grade_dist',
    label: 'Attempts by Grade',
    description: 'How many attempts at each grade',
    category: 'Climbing',
    icon: '📊',
    component: GradeDistWidget,
  },
  style_radar: {
    id: 'style_radar',
    label: 'Style Send Rate',
    description: 'Send rate across different hold styles',
    category: 'Climbing',
    icon: '🕸',
    component: StyleRadarWidget,
  },
  custom_plot: {
    id: 'custom_plot',
    label: 'Custom Plot',
    description: 'Build your own chart from any metric',
    category: 'Custom',
    icon: '🔧',
    component: CustomPlotWidget,
  },
};

export const WIDGET_CATEGORIES = ['Overview', 'Climbing', 'Custom'];
