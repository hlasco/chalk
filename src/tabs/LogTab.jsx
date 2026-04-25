import { clsx } from 'clsx';
import { gradeColor, V_GRADES, FONT_GRADES, V_TO_FONT, FONT_TO_V } from '../utils/gradeUtils';
import { fmtDuration } from '../utils/formatters';
import { pill } from '../styles/shared';
import { Button } from '@/components/ui/button';
import Lbl from '../components/ui/Lbl';
import BoulderRow from '../components/BoulderRow';
import InlineDelete from '../components/InlineDelete';
import GradeSelector from '../components/pickers/GradeSelector';
import StyleSelector from '../components/pickers/StyleSelector';
import SendFellToggle from '../components/pickers/SendFellToggle';
import TrainingForm from '../components/forms/TrainingForm';

export default function LogTab({
  activeId, sessions, active, activeGym, gradeSystem, grades, elapsedMin, exercises, setExercises,
  onLogBoulders,
  logTab, setLogTab,
  selGi, setSelGi, selStyles, setSelStyles, selPerc, setSelPerc,
  selResult, setSelResult, selAttempts, setSelAttempts,
  useColors, setUseColors, gymHasRanges,
  logBoulder, logTraining, deleteLiveBoulder, deleteLiveTraining,
  setShowNew, setTab, setShowEnd,
}) {
  const otherGrades = gradeSystem === 'V-Scale' ? FONT_GRADES : V_GRADES;
  const convIdx = gradeSystem === 'V-Scale' ? V_TO_FONT[selGi] : FONT_TO_V[selGi];
  const convGrade = convIdx != null ? otherGrades[convIdx] : null;
  const GradeGrid = () => (
    <GradeSelector
      gi={selGi} setGi={setSelGi} grades={grades} gym={activeGym}
      mode={gymHasRanges && useColors ? 'tiers' : 'grid'}
      useColors={useColors}
    />
  );

  return (
    <div className="flex-1 overflow-y-auto p-5">
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
            {[['boulder','BOULDER'],['onwall','ON WALL'],['training','TRAINING']].map(([lt, lbl]) => (
              <button key={lt} onClick={() => setLogTab(lt)}
                className={clsx(pill(logTab === lt), 'flex-1 text-center py-3 text-[11px]')}>
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

              {/* Result + Attempts */}
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <Lbl>RESULT</Lbl>
                  <SendFellToggle sent={selResult === 'send'} setSent={v => setSelResult(v ? 'send' : 'proj')} />
                </div>
                <div>
                  <Lbl>ATTEMPTS</Lbl>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setSelAttempts(n)} style={{
                        width: 40, height: 40, borderRadius: 8,
                        border: `1px solid ${selAttempts === n ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        background: selAttempts === n ? 'color-mix(in srgb,var(--color-accent) 12%,transparent)' : 'var(--color-surface)',
                        color: selAttempts === n ? 'var(--color-accent)' : 'var(--color-muted)',
                        fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer',
                      }}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Log button */}
              <Button onClick={logBoulder}
                className="w-full h-14 bg-accent text-bg hover:bg-accent/90 font-sans text-[15px] font-extrabold rounded-[12px] tracking-[1px]">
                LOG {selResult === 'send' ? 'SEND' : 'PROJ'} — {grades[selGi]}
              </Button>

              {/* Session log */}
              {active.boulders.length > 0 && (
                <div>
                  <Lbl>THIS SESSION</Lbl>
                  {[...active.boulders].reverse().map(b => (
                    <BoulderRow key={b.id} boulder={b} gym={activeGym} grades={grades}
                      onDelete={() => deleteLiveBoulder(b.id)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── On Wall tab ── */}
          {logTab === 'onwall' && (
            <div className="fade-up">
              <TrainingForm exercises={exercises} onLog={logTraining} gradeSystem={gradeSystem}
                sessions={sessions} activeGym={activeGym} setExercises={setExercises}
                onLogBoulders={onLogBoulders} lockedCategory="On-the-wall" />
            </div>
          )}

          {/* ── Training tab ── */}
          {logTab === 'training' && (
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
                                      {sl.climbs.map((c, ci) => {
                                        const col = gradeColor(c.gi, activeGym);
                                        return (
                                          <div key={ci}
                                            className="px-1.5 py-0.5 rounded-[4px] font-mono text-[9px] flex items-center gap-[3px]"
                                            style={{ border: `1px solid ${col}`, background: '#181818', color: col }}>
                                            {grades[c.gi] ?? c.gi}
                                            <span style={{ color: c.sent ? 'var(--color-green)' : 'var(--color-red)' }}>
                                              {c.sent ? '✓' : '✗'}
                                            </span>
                                          </div>
                                        );
                                      })}
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
