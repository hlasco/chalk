import { useState } from 'react';
import { clsx } from 'clsx';
import { gradeColor, alphaColor, V_GRADES, FONT_GRADES, V_TO_FONT, FONT_TO_V } from '../utils/gradeUtils';
import { fmtDuration } from '../utils/formatters';
import { pill } from '../styles/shared';
import { Button } from '@/components/ui/button';
import Lbl from '../components/ui/Lbl';
import BoulderRow from '../components/BoulderRow';
import InlineDelete from '../components/InlineDelete';
import GradeSelector from '../components/pickers/GradeSelector';
import StyleSelector from '../components/pickers/StyleSelector';

import TrainingForm from '../components/forms/TrainingForm';
import ProjectLogModal from '../components/projects/ProjectLogModal';
import { uid } from '../utils/uid';

const isActiveProject = p => !p.history.some(h => h.result === 'sent' || h.result === 'abandoned');

export default function LogTab({
  activeId, sessions, active, activeGym, gradeSystem, grades, elapsedMin, exercises, setExercises,
  onLogBoulders,
  logTab, setLogTab,
  selGi, setSelGi, selStyles, setSelStyles, selPerc, setSelPerc,
  selResult, setSelResult, selAttempts, setSelAttempts,
  useColors, setUseColors, gymHasRanges,
  logBoulder, logTraining, deleteLiveBoulder, deleteLiveTraining,
  setShowNew, setTab, setShowEnd,
  projects, onAddProject, onLogProject, onDeleteProject, onAbandonProject,
}) {
  const otherGrades = gradeSystem === 'V-Scale' ? FONT_GRADES : V_GRADES;
  const convIdx = gradeSystem === 'V-Scale' ? V_TO_FONT[selGi] : FONT_TO_V[selGi];
  const convGrade = convIdx != null ? otherGrades[convIdx] : null;
  const [loggingProject, setLoggingProject] = useState(null);
  const [addingProject, setAddingProject]   = useState(false);
  const [newProjName, setNewProjName]       = useState('');
  const [newProjGi, setNewProjGi]           = useState(8);

  const GradeGrid = () => (
    <GradeSelector
      gi={selGi} setGi={setSelGi} grades={grades} gym={activeGym}
      mode={gymHasRanges && useColors ? 'tiers' : 'grid'}
      useColors={useColors}
    />
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-4">
      {!activeId ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center pt-16 gap-5">
          <div className="text-[64px]">🧗</div>
          <div className="font-sans text-[22px] font-extrabold text-text text-center">Ready to climb?</div>
          <div className="font-mono text-[12px] text-muted text-center max-w-[260px] leading-relaxed">
            Start a session to log your boulders and training
          </div>
          <Button onClick={() => setShowNew(true)}
            className="mt-2 px-12 py-6 text-[16px] bg-accent text-bg hover:bg-accent/90 font-extrabold rounded-[14px]">
            + Start Session
          </Button>
          {sessions.filter(s => s.ended).length > 0 && (
            <Button variant="outline" onClick={() => setTab('history')}
              className="border-border text-muted font-mono text-[12px]">
              View history ({sessions.filter(s => s.ended).length} sessions)
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* ── Session header ── */}
          <div className="bg-surface rounded-[14px] px-4 py-4 mb-6 flex justify-between items-center"
            style={{ border: '1px solid color-mix(in srgb,var(--color-accent) 21%,transparent)' }}>
            <div>
              <div className="font-sans text-[16px] font-bold text-text">{activeGym?.name}</div>
              <div className="font-mono text-[11px] text-muted mt-1">
                {active.date} · {gradeSystem} · {fmtDuration(elapsedMin)}
                {active.goal && <span className="text-accent"> · {active.goal}</span>}
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="text-right">
                <div className="font-mono text-[24px] text-accent font-medium leading-none">
                  {active.boulders.filter(b => b.sends > 0).length}
                </div>
                <div className="font-mono text-[10px] text-muted mt-1">SENDS</div>
              </div>
              <Button variant="outline" size="sm"
                className="border-red/30 bg-red/8 text-red font-mono text-[12px] h-9"
                onClick={() => setShowEnd(true)}>
                End ■
              </Button>
            </div>
          </div>

          {/* ── Tab toggle ── */}
          <div className="flex gap-2 mb-6">
            {[['boulder','BOULDER'],['training','TRAINING']].map(([lt, lbl]) => (
              <button key={lt} onClick={() => setLogTab(lt)}
                className={clsx(pill(logTab === lt || (lt === 'training' && logTab === 'onwall')), 'flex-1 text-center py-3 text-[11px]')}>
                {lbl}
              </button>
            ))}
          </div>

          {/* ── Boulder tab ── */}
          {logTab === 'boulder' && (
            <div className="fade-up flex flex-col gap-6">

              {/* Grade */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Lbl style={{ marginBottom: 0 }}>GRADE</Lbl>
                  <div className="flex items-center gap-2.5">
                    {gymHasRanges && (
                      <div className="flex border border-border rounded-full overflow-hidden">
                        {[['Grades', false], ['Colors', true]].map(([label, val]) => (
                          <button key={label} onClick={() => setUseColors(val)}
                            className={clsx('px-3 py-1.5 font-mono text-[10px] border-none cursor-pointer',
                              useColors === val ? 'bg-accent text-bg font-medium' : 'bg-transparent text-muted'
                            )}>{label}</button>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-[18px] font-semibold tracking-[1px]"
                        style={{ color: gradeColor(selGi, null) }}>
                        {grades[selGi]}
                      </span>
                      {convGrade && (
                        <span className="font-mono text-[10px] text-muted leading-none mt-0.5">
                          ≈ {convGrade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <GradeGrid />
              </div>

              {/* Style */}
              <div>
                <Lbl>STYLE <span className="text-dim font-light">(optional)</span></Lbl>
                <StyleSelector selected={selStyles} setSelected={setSelStyles} />
              </div>

              {/* Perceived */}
              <div>
                <Lbl>PERCEIVED</Lbl>
                <div className="flex gap-2">
                  {[['Soft', 'green'], ['On', 'accent'], ['Hard', 'red']].map(([label, col], i) => (
                    <button key={label} onClick={() => setSelPerc(i)}
                      className={clsx(pill(selPerc === i, col), 'flex-1 text-center py-3 text-[12px]')}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result */}
              <div>
                <Lbl>RESULT</Lbl>
                <div className="flex gap-2">
                  {[
                    { key: 'flash',   label: '⚡ Flash', col: 'var(--color-accent)'  },
                    { key: 'send',    label: '✓ Send',   col: 'var(--color-green)'   },
                    { key: 'attempt', label: '✗ Fell',   col: 'var(--color-red)'     },
                  ].map(({ key, label, col }) => {
                    const on = selResult === key;
                    return (
                      <button key={key} onClick={() => setSelResult(key)} style={{
                        flex: 1, padding: '11px 4px', textAlign: 'center',
                        borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12,
                        border: `1px solid ${on ? col : 'var(--color-border)'}`,
                        background: on ? alphaColor(col, 12) : 'transparent',
                        color: on ? col : 'var(--color-muted)',
                        cursor: 'pointer',
                      }}>{label}</button>
                    );
                  })}
                </div>
              </div>

              {/* Attempts — hidden for flash (always 1) */}
              {selResult !== 'flash' && (
                <div>
                  <Lbl>ATTEMPTS</Lbl>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setSelAttempts(n)} style={{
                        width: 40, height: 40, borderRadius: 8,
                        border: `1px solid ${selAttempts === n ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        background: selAttempts === n ? alphaColor('var(--color-accent)', 12) : 'var(--color-surface)',
                        color: selAttempts === n ? 'var(--color-accent)' : 'var(--color-muted)',
                        fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer',
                      }}>{n}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Log button */}
              <Button onClick={logBoulder}
                className="w-full h-14 bg-accent text-bg hover:bg-accent/90 font-sans text-[15px] font-extrabold rounded-[12px] tracking-[1px]">
                LOG {selResult === 'flash' ? '⚡ FLASH' : selResult === 'send' ? 'SEND' : 'ATTEMPT'} — {grades[selGi]}
              </Button>

              {/* Projects section */}
              {(() => {
                const allProjects    = (projects || []).slice().sort((a,b) => {
                  const aA = isActiveProject(a), bA = isActiveProject(b);
                  if (aA !== bA) return aA ? -1 : 1;
                  const aL = a.history.at(-1)?.date ?? a.createdAt;
                  const bL = b.history.at(-1)?.date ?? b.createdAt;
                  return bL.localeCompare(aL);
                });
                const activeProjects  = allProjects.filter(isActiveProject);
                const doneProjects    = allProjects.filter(p => !isActiveProject(p));
                const createProject = () => {
                  if (!newProjName.trim()) return;
                  onAddProject({ id:`proj_${uid()}`, name:newProjName.trim(), gi:newProjGi, gymId:activeGym?.id??null, createdAt:active.date, history:[] });
                  setNewProjName(''); setNewProjGi(8); setAddingProject(false);
                };
                return (
                  <div>
                    <div className="flex justify-between items-center mb-3 mt-2">
                      <Lbl style={{ marginBottom: 0 }}>PROJECTS</Lbl>
                      <button onClick={() => setAddingProject(p => !p)}
                        className="font-mono text-[10px] cursor-pointer bg-transparent border-none"
                        style={{ color: addingProject ? 'var(--color-muted)' : 'var(--color-accent)' }}>
                        {addingProject ? 'Cancel' : '+ New'}
                      </button>
                    </div>

                    {addingProject && (
                      <div className="mb-4 p-3 rounded-[12px] bg-s2 border border-border flex flex-col gap-3">
                        <input autoFocus value={newProjName} onChange={e => setNewProjName(e.target.value)}
                          onKeyDown={e => { if (e.key==='Enter') createProject(); if (e.key==='Escape') setAddingProject(false); }}
                          placeholder="Project name…" style={{ outline:'none' }}
                          className="w-full bg-surface border border-border rounded-[8px] px-3 py-2 font-sans text-[13px] text-text placeholder:text-muted" />
                        <GradeSelector gi={newProjGi} setGi={setNewProjGi} grades={grades} gym={activeGym} mode="grid" />
                        <button onClick={createProject}
                          className="w-full py-2.5 rounded-[10px] bg-accent text-bg font-sans font-bold text-[13px] cursor-pointer border-none">
                          Add Project
                        </button>
                      </div>
                    )}

                    {activeProjects.length === 0 && !addingProject && (
                      <div className="py-3 font-mono text-[11px] text-dim text-center">No active projects</div>
                    )}

                    {[
                      ...activeProjects.map(p => ({ p, done: false })),
                      ...doneProjects.map(p => ({ p, done: true })),
                    ].map(({ p, done }) => {
                      const sessLog  = p.history.find(h => h.sessionId === active.id);
                      const total    = p.history.reduce((a, h) => a + (h.attempts||0), 0);
                      const col      = gradeColor(p.gi, null);
                      const lastH    = [...p.history].reverse().find(h => h.result === 'sent' || h.result === 'abandoned');
                      const isAbandoned = lastH?.result === 'abandoned';
                      return (
                        <div key={p.id}
                          className="flex items-center gap-3 py-3 border-b border-border last:border-b-0 cursor-pointer"
                          style={{ opacity: done ? 0.55 : 1 }}
                          onClick={() => setLoggingProject(p)}>
                          <div className="flex-shrink-0 px-2 py-1 rounded-[6px] font-mono text-[10px] font-bold"
                            style={{ border:`1px solid ${col}`, color:col, background:alphaColor(col,12) }}>
                            {grades[p.gi]??`#${p.gi}`}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-sans text-[13px] truncate" style={{ color: done ? 'var(--color-muted)' : 'var(--color-text)' }}>{p.name}</div>
                            <div className="font-mono text-[10px] text-muted">{total} att · {p.history.length} sess</div>
                          </div>
                          <span className="font-mono text-[10px] flex-shrink-0" style={{
                            color: isAbandoned ? 'var(--color-red)' : done
                              ? 'var(--color-green)'
                              : sessLog
                                ? (sessLog.result === 'working' ? 'var(--color-blue)' : 'var(--color-green)')
                                : 'var(--color-muted)',
                          }}>
                            {isAbandoned ? '✗ abandoned' : done
                              ? '✓ sent'
                              : sessLog
                                ? (sessLog.result === 'working' ? 'working' : '✓ done')
                                : 'log →'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Session log */}
              {active.boulders.filter(b => b.source !== 'training' && b.source !== 'project').length > 0 && (
                <div className="mt-2">
                  <Lbl>THIS SESSION</Lbl>
                  {[...active.boulders].reverse().filter(b => b.source !== 'training' && b.source !== 'project').map(b => (
                    <BoulderRow key={b.id} boulder={b} gym={activeGym} grades={grades}
                      onDelete={() => deleteLiveBoulder(b.id)} />
                  ))}
                </div>
              )}

              {/* Project log modal */}
              {loggingProject && (
                <ProjectLogModal
                  project={loggingProject}
                  grades={grades}
                  sessionLog={loggingProject.history.find(h => h.sessionId === active?.id)}
                  onLog={({ attempts, result }) => onLogProject({ projectId:loggingProject.id, sessionId:active.id, date:active.date, attempts, result })}
                  onClose={() => setLoggingProject(null)}
                  onAbandon={onAbandonProject}
                  onDelete={onDeleteProject}
                />
              )}
            </div>
          )}

          {/* ── Training tab ── */}
          {(logTab === 'training' || logTab === 'onwall') && (
            <div className="fade-up">
              <TrainingForm exercises={exercises} onLog={logTraining} gradeSystem={gradeSystem}
                sessions={sessions} activeGym={activeGym} setExercises={setExercises}
                onLogBoulders={onLogBoulders} />
              {active.training.length > 0 && (
                <div className="mt-8">
                  <Lbl>THIS SESSION</Lbl>
                  {[...active.training].reverse().map(t => {
                    const ex = exercises.find(e => e.id === t.exId);
                    const summary = ex?.fields.map(f => {
                      const v = t.values?.[f.key];
                      if (v == null) return null;
                      if (f.unit === 'idx') return `${f.label} ${grades[v] ?? v}`;
                      return `${f.label} ${v}${f.unit}`;
                    }).filter(Boolean).join(' · ');
                    const hasSetLogs = Array.isArray(t.setLogs) && t.setLogs.length > 0;
                    return (
                      <div key={t.id} className="py-3.5 border-b border-border">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-sans text-[14px] font-semibold text-blue">{ex?.name}</div>
                            <div className="font-mono text-[11px] text-muted mt-1">{summary}</div>
                            {t.note && <div className="font-mono text-[11px] text-muted mt-0.5">{t.note}</div>}
                            {hasSetLogs && (
                              <div className="mt-2.5 flex flex-col gap-1.5">
                                {t.setLogs.map(sl => (
                                  <div key={sl.set} className="flex gap-1.5 items-center">
                                    <span className="font-mono text-[10px] text-muted w-8">S{sl.set}</span>
                                    <div className="flex gap-1">
                                      {sl.climbs.map((c, ci) => (
                                        <div key={ci}
                                          className="px-1.5 py-0.5 rounded-[4px] font-mono text-[9px] flex items-center gap-[3px]"
                                          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                                          {grades[c.gi] ?? c.gi}
                                          <span style={{ color: c.sent ? 'var(--color-green)' : 'var(--color-red)' }}>
                                            {c.sent ? '✓' : '✗'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <InlineDelete onDelete={() => deleteLiveTraining(t.id)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
