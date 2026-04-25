import { useMemo } from 'react';
import { STYLES } from '../constants';
import { makeBoulder } from '../utils/boulderFactory';

export function useStats(filteredSessions, grades) {
  return useMemo(() => {
    const ended = filteredSessions;

    const setLogBoulders = ended.flatMap(s =>
      s.training.flatMap(t =>
        (Array.isArray(t.setLogs) ? t.setLogs : []).flatMap(sl =>
          (sl.climbs || []).map(c => makeBoulder({
            gi: c.gi,
            styles: c.styles || [],
            sent: c.sent,
            perceived: 1,
            attempts: 1,
            source: "setLog",
          }))
        )
      )
    );

    const allB = [...ended.flatMap(s => s.boulders), ...setLogBoulders];
    const totalSends = allB.reduce((a, b) => a + b.sends, 0);
    const totalAtt   = allB.reduce((a, b) => a + b.attempts, 0);

    const maxGi = allB.length ? Math.max(...allB.map(b => b.gi)) : 0;
    const gradeDist = Array.from({ length: maxGi + 1 }, (_, gi) => ({
      gi,
      label: grades[gi] ?? `#${gi}`,
      v: allB.filter(b => b.gi === gi).reduce((a, b) => a + b.attempts, 0),
    })).filter(d => d.v > 0);

    const styleMap = {};
    STYLES.forEach(st => {
      const rel = allB.filter(b => b.styles.includes(st));
      if (!rel.length) return;
      styleMap[st] = { sends: rel.reduce((a, b) => a + b.sends, 0), total: rel.length };
    });
    const styleRadar = Object.entries(styleMap).map(([label, { sends, total }]) => ({ label, v: sends / total }));

    const sorted = [...ended].sort((a, b) => a.date.localeCompare(b.date)).slice(-8);
    const sessionVol = sorted.map(s => ({ label: s.date.slice(5), v: s.boulders.reduce((a, b) => a + b.attempts, 0) }));
    const maxGradeHist = sorted.map(s => {
      const regularSends = s.boulders.filter(b => b.sends > 0).map(b => b.gi);
      const setLogSends  = s.training.flatMap(t =>
        (Array.isArray(t.setLogs) ? t.setLogs : []).flatMap(sl => (sl.climbs || []).filter(c => c.sent).map(c => c.gi))
      );
      const allSends = [...regularSends, ...setLogSends];
      return { label: s.date.slice(5), v: allSends.length ? Math.max(...allSends) : null };
    }).filter(d => d.v != null);

    return { totalSends, totalAtt, gradeDist, styleRadar, sessionVol, maxGradeHist };
  }, [filteredSessions, grades]); // eslint-disable-line
}
