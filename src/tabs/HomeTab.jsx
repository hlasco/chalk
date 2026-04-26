import { useState } from 'react';
import { clsx } from 'clsx';
import { inp, pill } from '../styles/shared';
import { useFilters } from '../contexts/FilterContext';
import { useFilteredSessions } from '../hooks/useFilteredSessions';
import { useStats } from '../hooks/useStats';
import { useDashboard } from '../hooks/useDashboard';
import Lbl from '../components/ui/Lbl';
import StyleSelector from '../components/pickers/StyleSelector';
import DashboardGrid from '../widgets/DashboardGrid';

export default function HomeTab({ sessions, exercises, gyms, gradeSystem, grades }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [period, setPeriod] = useState('all');
  const [agg,    setAgg]    = useState('session');
  const { fStyles, setFStyles, fResult, setFResult, fMinGi, setFMinGi, fMaxGi, setFMaxGi,
          fGymIds, setFGymIds, fDateFrom, setFDateFrom, fDateTo, setFDateTo,
          filterActive, clearFilters } = useFilters();

  const filteredSessions = useFilteredSessions(sessions, { fGymIds, fDateFrom, fDateTo, fStyles, fResult, fMinGi, fMaxGi });
  const stats = useStats(filteredSessions, grades);
  const { widgets, addWidget, removeWidget, moveUp, moveDown, resetDashboard } = useDashboard();

  // Context passed to every widget
  const ctx = { stats, sessions: filteredSessions, allSessions: sessions, exercises, gyms, grades, gradeSystem, period, setPeriod, agg, setAgg };

  return (
    <div className="flex-1 overflow-y-auto p-5">
      {/* Filter toggle */}
      <button onClick={() => setFilterOpen(p => !p)} className={clsx(
        'w-full px-3.5 py-[10px] rounded-[10px] mb-3 font-mono text-[11px] flex justify-between items-center border cursor-pointer',
        filterActive ? 'border-accent text-accent' : 'border-border bg-surface text-muted'
      )} style={filterActive ? { background: 'color-mix(in srgb,var(--color-accent) 7%,transparent)' } : {}}>
        <span>FILTERS {filterActive ? '(active)' : ''}</span>
        <span>{filterOpen ? '▲' : '▼'}</span>
      </button>

      {filterOpen && (
        <div className="bg-surface border border-border rounded-[12px] p-4 mb-4">
          <Lbl>RESULT</Lbl>
          <div className="flex gap-1.5 mb-3.5">
            {[['all', 'All'], ['sends', 'Sends only'], ['fails', 'Failed only']].map(([val, label]) => (
              <button key={val} onClick={() => setFResult(val)} className={clsx(pill(fResult === val), 'flex-1 text-center')} style={{ padding: '8px 4px', fontSize: 10 }}>{label}</button>
            ))}
          </div>
          <Lbl>STYLE</Lbl>
          <div className="mb-3.5">
            <StyleSelector selected={fStyles} setSelected={setFStyles} size="compact" />
          </div>
          <Lbl>GRADE RANGE</Lbl>
          <div className="flex gap-2 items-center mb-3.5">
            <select value={fMinGi} onChange={e => setFMinGi(e.target.value)} className={clsx(inp, 'flex-1')} style={{ appearance: 'menulist' }}>
              <option value="">Min grade</option>
              {grades.map((g, gi) => (<option key={gi} value={gi}>{g}</option>))}
            </select>
            <span className="text-muted font-mono text-xs">–</span>
            <select value={fMaxGi} onChange={e => setFMaxGi(e.target.value)} className={clsx(inp, 'flex-1')} style={{ appearance: 'menulist' }}>
              <option value="">Max grade</option>
              {grades.map((g, gi) => (<option key={gi} value={gi}>{g}</option>))}
            </select>
          </div>
          <Lbl>LOCATION</Lbl>
          <div className="flex flex-wrap gap-[5px] mb-3.5">
            {gyms.map(g => (
              <button key={g.id} onClick={() => setFGymIds(p => p.includes(g.id) ? p.filter(x => x !== g.id) : [...p, g.id])} className={pill(fGymIds.includes(g.id))} style={{ fontSize: 10, padding: '4px 10px' }}>{g.name}</button>
            ))}
          </div>
          <Lbl>DATE RANGE</Lbl>
          <div className="flex gap-2 mb-3.5">
            <input type="date" value={fDateFrom} onChange={e => setFDateFrom(e.target.value)} className={clsx(inp, 'flex-1')} />
            <input type="date" value={fDateTo} onChange={e => setFDateTo(e.target.value)} className={clsx(inp, 'flex-1')} />
          </div>
          {filterActive && (
            <button onClick={clearFilters} className="w-full py-[9px] rounded-[8px] font-mono text-[11px] cursor-pointer"
              style={{ border: '1px solid color-mix(in srgb,var(--color-red) 35%,transparent)', background: 'color-mix(in srgb,var(--color-red) 7%,transparent)', color: 'var(--color-red)' }}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Shared chart controls */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex rounded-[6px] overflow-hidden border border-border">
          {[{id:'1M',days:30},{id:'3M',days:90},{id:'6M',days:180},{id:'1Y',days:365},{id:'all'}].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{
              padding:'3px 8px', fontFamily:'var(--font-mono)', fontSize:9, cursor:'pointer', border:'none',
              background: period===p.id ? 'var(--color-accent)' : 'transparent',
              color:      period===p.id ? 'var(--color-bg)'     : 'var(--color-muted)',
            }}>{p.id==='all' ? 'All' : p.id}</button>
          ))}
        </div>
        <div className="flex rounded-[6px] overflow-hidden border border-border">
          {[{id:'session',label:'Sess.'},{id:'weekly',label:'Wk'},{id:'monthly',label:'Mo'}].map(a => (
            <button key={a.id} onClick={() => setAgg(a.id)} style={{
              padding:'3px 8px', fontFamily:'var(--font-mono)', fontSize:9, cursor:'pointer', border:'none',
              background: agg===a.id ? 'var(--color-accent)' : 'transparent',
              color:      agg===a.id ? 'var(--color-bg)'     : 'var(--color-muted)',
            }}>{a.label}</button>
          ))}
        </div>
      </div>

      <DashboardGrid
        widgets={widgets}
        onAdd={addWidget}
        onRemove={removeWidget}
        onMoveUp={moveUp}
        onMoveDown={moveDown}
        onReset={resetDashboard}
        ctx={ctx}
      />
    </div>
  );
}
