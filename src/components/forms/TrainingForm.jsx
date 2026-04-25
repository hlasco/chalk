import { useState, useEffect } from 'react';
import { BUILTIN_TIMER_IDS } from '../../constants';
import { gradesFor } from '../../utils/gradeUtils';
import { buildTimerConfig } from '../../utils/timerConfig';
import { makeBoulder } from '../../utils/boulderFactory';
import { uid } from '../../utils/uid';
import { clsx } from 'clsx';
import { inp, pill } from '../../styles/shared';
import Lbl from '../ui/Lbl';
import Empty from '../ui/Empty';
import SetTimer from '../timer/SetTimer';

export default function TrainingForm({
  exercises, onLog, gradeSystem, sessions, activeGym,
  setExercises, onLogBoulders, lockedCategory,
}) {
  const grades = gradesFor(gradeSystem);
  const cats = [...new Set(exercises.map(e => e.category || "Custom"))];

  const [category, setCategory]   = useState(lockedCategory ?? "Strength");
  const visibleExs = exercises.filter(e => (e.category || "Custom") === category);

  const [exId, setExId]     = useState(visibleExs[0]?.id || exercises[0]?.id);
  const [values, setValues] = useState({});
  const [note, setNote]     = useState("");
  const [showTimer, setShowTimer] = useState(false);
  const [prefillDate, setPrefillDate] = useState(null);

  const ex = exercises.find(e => e.id === exId);

  // Sync category when lockedCategory changes (e.g. tab switch)
  useEffect(() => {
    if (lockedCategory) setCategory(lockedCategory);
  }, [lockedCategory]);

  useEffect(() => {
    let id = exId;
    if (!visibleExs.find(e => e.id === id)) {
      id = visibleExs[0]?.id;
      setExId(id);
    }
    let lastValues = null, lastDate = null;
    for (const s of (sessions || []).filter(x => x.ended).sort((a, b) => b.date.localeCompare(a.date))) {
      const t = [...s.training].reverse().find(t => t.exId === id);
      if (t) { lastValues = t.values; lastDate = s.date; break; }
    }
    setValues(lastValues ? {...lastValues} : {});
    setPrefillDate(lastDate);
    setNote("");
  }, [exId, category]); // eslint-disable-line

  const handle = (setLogs) => {
    if (!ex) return;
    const cleaned = {};
    ex.fields.forEach(f => {
      const v = values[f.key];
      cleaned[f.key] = v === "" || v == null ? null : +v;
    });
    if (values.restBetweenSetsSec !== undefined && values.restBetweenSetsSec !== "")
      cleaned.restBetweenSetsSec = +values.restBetweenSetsSec;
    const validSetLogs = Array.isArray(setLogs) && setLogs.length > 0 ? setLogs : null;
    onLog({ id: uid(), exId, values: cleaned, note, setLogs: validSetLogs });

    // Auto-log climbs as boulder sends for on-the-wall exercises
    if (onLogBoulders) {
      const gradeField = ex.fields.find(f => f.unit === 'idx');
      if (gradeField) {
        let boulders = [];
        if (validSetLogs) {
          // From timer: use actual grade + send/fell data per climb
          boulders = validSetLogs.flatMap(sl =>
            (sl.climbs || []).map(c => makeBoulder({
              gi: c.gi, styles: c.styles || [], sent: c.sent, attempts: 1, source: 'training',
            }))
          );
        } else {
          // From LOG button: default all to sends at the target grade
          const gi = +(values[gradeField.key] ?? cleaned[gradeField.key]);
          if (!isNaN(gi)) {
            const setsCount   = Math.max(1, +(values.sets   || cleaned.sets   || 1));
            const perSet      = Math.max(1, +(values.climbs || values.problems || cleaned.climbs || cleaned.problems || 1));
            boulders = Array.from({ length: setsCount * perSet }, () =>
              makeBoulder({ gi, styles: [], sent: true, attempts: 1, source: 'training' })
            );
          }
        }
        if (boulders.length) onLogBoulders(boulders);
      }
    }

    setValues({});
    setNote("");
    setPrefillDate(null);
  };

  const hasSets = ex?.fields.some(f => f.key === "sets");
  const isBuiltinEx = !!ex && BUILTIN_TIMER_IDS.includes(exId);
  const hasBuiltinTimer = isBuiltinEx && !ex.timerCfg;
  const hasCustomTimer  = !!ex?.timerCfg && ex.timerCfg.type !== 'off';
  const hasTimer = hasBuiltinTimer || hasCustomTimer;
  const canTimer = hasTimer && (!hasSets || !!values.sets);
  const timerConfig = canTimer ? buildTimerConfig(exId, values, ex) : null;

  const setExTimerMode = (mode) => {
    if (!setExercises) return;
    if (mode === 'default') {
      setExercises(p => p.map(x => x.id === exId ? {...x, timerCfg: null} : x));
    } else if (mode === 'off') {
      setExercises(p => p.map(x => x.id === exId ? {...x, timerCfg: {type: 'off'}} : x));
    } else if (mode === 'tap') {
      setExercises(p => p.map(x => x.id === exId ? {...x, timerCfg: {type: 'tap', label: ex.name}} : x));
    } else {
      const dk = ex.fields.find(f => f.unit === 's' || f.unit === 'min')?.key || '';
      setExercises(p => p.map(x => x.id === exId ? {...x, timerCfg: {type: 'timed', label: ex.name, durationKey: dk}} : x));
    }
  };
  const updExTimer = (k, v) =>
    setExercises && setExercises(p => p.map(x => x.id === exId ? {...x, timerCfg: {...x.timerCfg, [k]: v}} : x));

  const timerMode = !ex?.timerCfg ? (isBuiltinEx ? 'default' : 'off') : ex.timerCfg.type;
  const secFields = ex?.fields.filter(f => f.unit === 's' || f.unit === 'min') ?? [];

  return (
    <>
      {showTimer && timerConfig && (
        <SetTimer
          config={timerConfig}
          onClose={() => setShowTimer(false)}
          onLog={(setLogs) => handle(setLogs)}
          grades={grades}
          gym={activeGym}
        />
      )}

      {/* Category selector — hidden when locked */}
      {!lockedCategory && (
        <>
          <Lbl>CATEGORY</Lbl>
          <div className="flex flex-wrap gap-2 mb-5">
            {cats.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={pill(category === c)}>{c}</button>
            ))}
          </div>
        </>
      )}

      <Lbl>EXERCISE</Lbl>
      <div className="flex flex-wrap gap-2 mb-6">
        {visibleExs.map(e => (
          <button key={e.id} onClick={() => setExId(e.id)} className={pill(exId === e.id)}>{e.name}</button>
        ))}
        {!visibleExs.length && <Empty>No exercises in this category yet</Empty>}
      </div>

      {ex && (
        <>
          {prefillDate && (
            <div className="font-mono text-[9px] text-muted tracking-[1px] mb-3">
              PREFILLED FROM {prefillDate} — tap any field to edit
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-5">
            {ex.fields.map(f => (
              <div key={f.key}>
                <Lbl>{f.label.toUpperCase()}{f.unit && f.unit !== "idx" ? ` (${f.unit})` : ""}</Lbl>
                {f.unit === "idx" ? (
                  <select value={values[f.key] ?? ""} onChange={e => setValues(p => ({...p, [f.key]: e.target.value}))}
                    className={inp} style={{appearance: "menulist"}}>
                    <option value="">—</option>
                    {grades.map((g, gi) => (<option key={gi} value={gi}>{g}</option>))}
                  </select>
                ) : (
                  <input type="number" step="any" value={values[f.key] ?? ""}
                    onChange={e => setValues(p => ({...p, [f.key]: e.target.value}))} className={inp}/>
                )}
              </div>
            ))}
            {hasSets && (
              <div>
                <Lbl>SET REST (s)</Lbl>
                <input type="number" value={values.restBetweenSetsSec ?? ""}
                  onChange={e => setValues(p => ({...p, restBetweenSetsSec: e.target.value}))}
                  className={inp} placeholder="120"/>
              </div>
            )}
          </div>

          {/* Inline timer config */}
          {setExercises && (
            <div className="mb-5">
              <Lbl>TIMER</Lbl>
              <div className="flex gap-[5px] flex-wrap">
                {[
                  ...(isBuiltinEx ? [['default', 'Built-in']] : []),
                  ['off', 'Off'],
                  ['tap', 'Tap'],
                  ['timed', 'Countdown'],
                ].map(([mode, lbl]) => {
                  const isActive = timerMode === mode;
                  const col = mode === 'default' ? 'var(--color-accent)' : mode === 'timed' ? 'var(--color-green)' : mode === 'tap' ? 'var(--color-blue)' : 'var(--color-muted)';
                  return (
                    <button key={mode} onClick={() => setExTimerMode(mode)}
                      className="border rounded-full font-mono text-[11px] px-3 py-1.5"
                      style={{
                        borderColor: isActive ? col : 'var(--color-border)',
                        background: isActive ? `color-mix(in srgb,${col} 12%,transparent)` : 'transparent',
                        color: isActive ? col : 'var(--color-muted)',
                      }}>{lbl}</button>
                  );
                })}
              </div>
              {timerMode === 'timed' && (
                <div className="flex gap-2 mt-3">
                  <div className="flex-1">
                    <div className="font-mono text-[9px] text-muted mb-1.5">DURATION FIELD</div>
                    <select value={ex.timerCfg?.durationKey || ''} onChange={ev => updExTimer('durationKey', ev.target.value)}
                      className={inp} style={{appearance: 'menulist', fontSize: 11}}>
                      <option value=''>— pick —</option>
                      {secFields.map((f, i) => (<option key={i} value={f.key}>{f.label} ({f.unit})</option>))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-[9px] text-muted mb-1.5">LABEL</div>
                    <input value={ex.timerCfg?.label || ''} onChange={ev => updExTimer('label', ev.target.value)}
                      className={inp} style={{fontSize: 11}} placeholder="GO"/>
                  </div>
                </div>
              )}
              {timerMode === 'tap' && (
                <div className="mt-3">
                  <div className="font-mono text-[9px] text-muted mb-1.5">LABEL</div>
                  <input value={ex.timerCfg?.label || ''} onChange={ev => updExTimer('label', ev.target.value)}
                    className={inp} style={{fontSize: 11}} placeholder="GO"/>
                </div>
              )}
            </div>
          )}

          <Lbl>NOTE</Lbl>
          <input value={note} onChange={e => setNote(e.target.value)} className={clsx(inp, "mb-5")} placeholder="Optional…"/>

          <div className="flex gap-2">
            {canTimer && timerConfig && (
              <button onClick={() => setShowTimer(true)}
                className="flex-none px-[18px] py-[14px] rounded-[10px] border-none bg-green text-bg font-mono text-[13px] font-medium tracking-[1px]">
                ▶ Timer
              </button>
            )}
            <button onClick={() => handle()}
              className="flex-1 py-[14px] rounded-[10px] border-none bg-accent text-bg font-sans text-[14px] font-extrabold">
              LOG — {ex.name}
            </button>
          </div>
        </>
      )}
    </>
  );
}
