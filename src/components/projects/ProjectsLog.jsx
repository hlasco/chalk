import { useState, useMemo } from 'react';
import { uid } from '../../utils/uid';
import { gradeColor } from '../../utils/gradeUtils';
import GradeSelector from '../pickers/GradeSelector';
import Lbl from '../ui/Lbl';

const getStatus = p => {
  const sent = [...p.history].reverse().find(h => h.result === 'sent' || h.result === 'flashed');
  return sent ? sent.result : 'active';
};

const totalAttempts = p => p.history.reduce((a, h) => a + (h.attempts || 0), 0);

const RESULT_COLORS = {
  flashed: 'var(--color-accent)',
  sent:    'var(--color-green)',
  working: 'var(--color-muted)',
};
const RESULT_LABELS = { flashed: '⚡ Flash', sent: '✓ Send', working: 'Working' };

export default function ProjectsLog({
  projects,
  onAdd, onLog, onDelete,
  active, activeId, activeGym,
  grades, gradeSystem,
}) {
  const [adding, setAdding]       = useState(false);
  const [newName, setNewName]     = useState('');
  const [newGi, setNewGi]         = useState(8);
  const [expanded, setExpanded]   = useState(null);
  const [sessAtts, setSessAtts]   = useState({});  // projectId → attempts

  const sorted = useMemo(() => [...projects].sort((a, b) => {
    const aActive = getStatus(a) === 'active', bActive = getStatus(b) === 'active';
    if (aActive !== bActive) return aActive ? -1 : 1;
    const aLast = a.history.at(-1)?.date ?? a.createdAt;
    const bLast = b.history.at(-1)?.date ?? b.createdAt;
    return bLast.localeCompare(aLast);
  }), [projects]);

  const getSessionLog = p => active ? p.history.find(h => h.sessionId === active.id) : null;

  const handleCreate = () => {
    if (!newName.trim()) return;
    onAdd({
      id: `proj_${uid()}`,
      name: newName.trim(),
      gi: newGi,
      gymId: activeGym?.id ?? null,
      createdAt: new Date().toISOString().slice(0, 10),
      history: [],
    });
    setNewName('');
    setNewGi(8);
    setAdding(false);
  };

  const handleLog = (projectId, result) => {
    if (!activeId || !active) return;
    const sessLog = getSessionLog(projects.find(p => p.id === projectId));
    const attempts = sessAtts[projectId] ?? sessLog?.attempts ?? 1;
    onLog({ projectId, sessionId: active.id, date: active.date, attempts, result });
    setSessAtts(prev => ({ ...prev, [projectId]: 1 }));
  };

  const bump = (projectId, delta) => {
    setSessAtts(prev => {
      const p = projects.find(pr => pr.id === projectId);
      const base = prev[projectId] ?? getSessionLog(p)?.attempts ?? 1;
      return { ...prev, [projectId]: Math.max(1, base + delta) };
    });
  };

  return (
    <div className="fade-up flex flex-col gap-3">
      {/* Add new */}
      {adding ? (
        <div className="bg-surface border border-border rounded-[12px] p-4">
          <Lbl>PROJECT NAME</Lbl>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="Name this project…"
            style={{ outline: 'none' }}
            className="w-full bg-s2 border border-border rounded-[8px] px-3 py-2 font-sans text-[14px] text-text placeholder:text-muted mb-4"
          />
          <Lbl>GRADE</Lbl>
          <GradeSelector gi={newGi} setGi={setNewGi} grades={grades} gym={activeGym} mode="grid" />
          <div className="flex gap-2 mt-4">
            <button onClick={() => setAdding(false)}
              className="flex-1 py-2.5 rounded-[10px] border border-border text-muted font-mono text-[12px] cursor-pointer bg-transparent">
              Cancel
            </button>
            <button onClick={handleCreate}
              className="flex-[2] py-2.5 rounded-[10px] bg-accent text-bg font-sans font-bold text-[13px] cursor-pointer border-none">
              Add Project
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full py-3 rounded-[10px] border border-dashed border-border bg-transparent text-muted font-mono text-[11px] cursor-pointer hover:border-muted transition-colors">
          + New project
        </button>
      )}

      {sorted.length === 0 && (
        <div className="text-center py-10 font-mono text-[12px] text-muted">No projects yet</div>
      )}

      {sorted.map(p => {
        const status    = getStatus(p);
        const total     = totalAttempts(p);
        const sessLog   = getSessionLog(p);
        const isOpen    = expanded === p.id;
        const gradeCol  = gradeColor(p.gi, null);
        const curAtts   = sessAtts[p.id] ?? sessLog?.attempts ?? 1;

        return (
          <div key={p.id} className="bg-surface border border-border rounded-[12px] overflow-hidden">
            {/* Row header */}
            <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
              onClick={() => setExpanded(isOpen ? null : p.id)}>
              <div className="flex-shrink-0 px-2 py-1 rounded-[6px] font-mono text-[11px] font-bold"
                style={{ border: `1px solid ${gradeCol}`, color: gradeCol, background: `${gradeCol}18` }}>
                {grades[p.gi] ?? `#${p.gi}`}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-sans text-[14px] font-semibold truncate"
                  style={{ color: status === 'active' ? 'var(--color-text)' : 'var(--color-muted)' }}>
                  {p.name}
                </div>
                <div className="font-mono text-[10px] text-muted mt-0.5 flex items-center gap-2">
                  <span>{total} att · {p.history.length} sess</span>
                  {status !== 'active' && (
                    <span style={{ color: RESULT_COLORS[status] }}>{RESULT_LABELS[status]}</span>
                  )}
                  {sessLog && status === 'active' && (
                    <span className="text-blue">• logged today</span>
                  )}
                </div>
              </div>
              <span className="font-mono text-[11px] text-muted">{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-border pt-3 flex flex-col gap-4">

                {/* Log attempts (only during active session) */}
                {activeId && (
                  <div>
                    <Lbl style={{ marginBottom: 6 }}>
                      {sessLog ? 'UPDATE THIS SESSION' : 'LOG ATTEMPTS'}
                    </Lbl>
                    {sessLog && (
                      <div className="font-mono text-[11px] mb-3 flex items-center gap-2">
                        <span className="text-muted">Previously:</span>
                        <span className="text-text">{sessLog.attempts} att</span>
                        <span style={{ color: RESULT_COLORS[sessLog.result] }}>
                          {RESULT_LABELS[sessLog.result]}
                        </span>
                      </div>
                    )}
                    {/* Attempt counter */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-[11px] text-muted">Attempts</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => bump(p.id, -1)}
                          className="w-8 h-8 rounded-[6px] border border-border text-muted font-mono font-bold cursor-pointer bg-s2">
                          −
                        </button>
                        <span className="font-mono text-[16px] w-6 text-center text-text">{curAtts}</span>
                        <button onClick={() => bump(p.id, 1)}
                          className="w-8 h-8 rounded-[6px] border border-border text-muted font-mono font-bold cursor-pointer bg-s2">
                          +
                        </button>
                      </div>
                    </div>
                    {/* Result buttons */}
                    <div className="flex gap-2">
                      <button onClick={() => handleLog(p.id, 'working')}
                        className="flex-1 py-2.5 rounded-[10px] border border-border bg-transparent text-muted font-mono text-[11px] cursor-pointer">
                        Working
                      </button>
                      <button onClick={() => handleLog(p.id, 'sent')}
                        className="flex-1 py-2.5 rounded-[10px] font-mono text-[11px] cursor-pointer"
                        style={{ border: '1px solid var(--color-green)', color: 'var(--color-green)', background: 'color-mix(in srgb,var(--color-green) 8%,transparent)' }}>
                        ✓ Send
                      </button>
                      <button onClick={() => handleLog(p.id, 'flashed')}
                        className="flex-1 py-2.5 rounded-[10px] font-mono text-[11px] font-bold cursor-pointer"
                        style={{ border: '1px solid var(--color-accent)', color: 'var(--color-bg)', background: 'var(--color-accent)' }}>
                        ⚡ Flash
                      </button>
                    </div>
                  </div>
                )}

                {/* Session history */}
                {p.history.length > 0 && (
                  <div>
                    <Lbl style={{ marginBottom: 6 }}>HISTORY</Lbl>
                    <div className="flex flex-col">
                      {[...p.history].reverse().map((h, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                          <span className="font-mono text-[11px] text-muted">{h.date}</span>
                          <span className="font-mono text-[11px] text-muted">{h.attempts} att</span>
                          <span className="font-mono text-[11px]"
                            style={{ color: RESULT_COLORS[h.result] }}>
                            {RESULT_LABELS[h.result]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delete */}
                <button onClick={() => { onDelete(p.id); setExpanded(null); }}
                  className="self-start font-mono text-[10px] cursor-pointer bg-transparent border-none p-0"
                  style={{ color: 'var(--color-red)' }}>
                  Delete project
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
