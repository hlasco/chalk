import { useMemo } from 'react';

export function useFilteredSessions(sessions, { fGymIds, fDateFrom, fDateTo, fStyles, fResult, fMinGi, fMaxGi }) {
  return useMemo(() => {
    let ss = sessions.filter(s => s.ended);
    if (fGymIds.length) ss = ss.filter(s => fGymIds.includes(s.gymId));
    if (fDateFrom) ss = ss.filter(s => s.date >= fDateFrom);
    if (fDateTo)   ss = ss.filter(s => s.date <= fDateTo);
    return ss.map(s => ({
      ...s,
      boulders: s.boulders.filter(b => {
        if (fStyles.length && !fStyles.some(st => b.styles.includes(st))) return false;
        if (fResult === "sends" && b.sends === 0) return false;
        if (fResult === "fails" && b.sends > 0) return false;
        if (fMinGi !== "" && b.gi < +fMinGi) return false;
        if (fMaxGi !== "" && b.gi > +fMaxGi) return false;
        return true;
      }),
    }));
  }, [sessions, fGymIds, fDateFrom, fDateTo, fStyles, fResult, fMinGi, fMaxGi]); // eslint-disable-line
}
