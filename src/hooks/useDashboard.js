import { useState, useCallback } from 'react';
import { uid } from '../utils/uid';

export const DEFAULT_DASHBOARD = [
  { uid: 'd_stats',   widgetId: 'stat_row',       config: {} },
  { uid: 'd_pyramid', widgetId: 'send_pyramid',   config: {} },
  { uid: 'd_maxgrade',widgetId: 'max_grade',      config: {} },
  { uid: 'd_volume',  widgetId: 'attempt_volume', config: {} },
  { uid: 'd_graddist',widgetId: 'grade_dist',     config: {} },
  { uid: 'd_radar',   widgetId: 'style_radar',    config: {} },
];

const STORAGE_KEY = 'chalk_dashboard_v1';

function load() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return DEFAULT_DASHBOARD;
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_DASHBOARD;
  } catch {
    return DEFAULT_DASHBOARD;
  }
}

function persist(dashboard) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboard)); } catch {}
}

export function useDashboard() {
  const [widgets, setWidgets] = useState(load);

  const update = useCallback(fn => {
    setWidgets(p => { const next = fn(p); persist(next); return next; });
  }, []);

  const addWidget = useCallback((widgetId, config = {}) => {
    update(p => [...p, { uid: uid(), widgetId, config }]);
  }, [update]);

  const removeWidget = useCallback(id => {
    update(p => p.filter(w => w.uid !== id));
  }, [update]);

  const moveUp = useCallback(id => {
    update(p => {
      const i = p.findIndex(w => w.uid === id);
      if (i <= 0) return p;
      const next = [...p];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  }, [update]);

  const moveDown = useCallback(id => {
    update(p => {
      const i = p.findIndex(w => w.uid === id);
      if (i < 0 || i >= p.length - 1) return p;
      const next = [...p];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  }, [update]);

  const updateConfig = useCallback((id, patch) => {
    update(p => p.map(w => w.uid === id ? { ...w, config: { ...w.config, ...patch } } : w));
  }, [update]);

  const resetDashboard = useCallback(() => {
    update(() => DEFAULT_DASHBOARD);
  }, [update]);

  return { widgets, addWidget, removeWidget, moveUp, moveDown, updateConfig, resetDashboard };
}
