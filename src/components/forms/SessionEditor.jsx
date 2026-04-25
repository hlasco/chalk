import { useState } from 'react';
import { gradesFor, gradeColor } from '../../utils/gradeUtils';
import { fmtDuration } from '../../utils/formatters';
import { inp } from '../../styles/shared';
import Lbl from '../ui/Lbl';
import BoulderRow from '../BoulderRow';
import InlineDelete from '../InlineDelete';

function SessionStats({ s, grades, gym }) {
  // Merge regular boulders with setLog climbs (for sessions without training-sourced boulders)
  const setLogClimbs = s.training.flatMap(t =>
    (Array.isArray(t.setLogs) ? t.setLogs : []).flatMap(sl => sl.climbs || [])
  );
  const hasTrainingB = s.boulders.some(b => b.source === 'training');
  const allClimbs = [
    ...s.boulders.map(b => ({ gi: b.gi, sent: b.sends > 0, attempts: b.attempts })),
    ...(!hasTrainingB ? setLogClimbs.map(c => ({ gi: c.gi, sent: c.sent, attempts: 1 })) : []),
  ];

  const sends    = allClimbs.filter(c => c.sent).length;
  const totalAtt = allClimbs.reduce((a, c) => a + c.attempts, 0);
  const failedAtt = totalAtt - sends;
  const maxGi    = allClimbs.filter(c => c.sent).length
    ? Math.max(...allClimbs.filter(c => c.sent).map(c => c.gi))
    : null;

  // Grade distribution — group by gi
  const byGrade = {};
  allClimbs.forEach(c => {
    if (!byGrade[c.gi]) byGrade[c.gi] = { sends: 0, fails: 0 };
    if (c.sent) byGrade[c.gi].sends++;
    else byGrade[c.gi].fails += c.attempts;
  });
  const dist = Object.entries(byGrade)
    .sort(([a], [b]) => +a - +b)
    .map(([gi, v]) => ({ gi: +gi, ...v }));
  const maxCount = dist.length ? Math.max(...dist.map(d => d.sends + d.fails)) : 1;

  if (!allClimbs.length && !s.training.length) return null;

  return (
    <div className="bg-s2 border border-border rounded-[12px] p-4 mb-5">
      {/* Key numbers */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="font-mono text-[22px] text-accent font-medium leading-none">{sends}</div>
          <div className="font-mono text-[9px] text-muted mt-1 tracking-[1px]">SENDS</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-[22px] text-red font-medium leading-none">{failedAtt}</div>
          <div className="font-mono text-[9px] text-muted mt-1 tracking-[1px]">FAILS</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-[22px] text-text font-light leading-none">{totalAtt}</div>
          <div className="font-mono text-[9px] text-muted mt-1 tracking-[1px]">ATTEMPTS</div>
        </div>
      </div>

      {/* Top grade + duration */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {maxGi != null && (
          <span className="font-mono text-[11px] px-2.5 py-1 rounded-full"
            style={{ color: gradeColor(maxGi, gym), background: `${gradeColor(maxGi, gym)}18`, border: `1px solid ${gradeColor(maxGi, gym)}40` }}>
            TOP {grades[maxGi] ?? maxGi}
          </span>
        )}
        {s.durationMin && (
          <span className="font-mono text-[11px] px-2.5 py-1 rounded-full border border-border text-muted">
            {fmtDuration(s.durationMin)}
          </span>
        )}
        {s.training.length > 0 && (
          <span className="font-mono text-[11px] px-2.5 py-1 rounded-full border border-border text-blue">
            {s.training.length} training
          </span>
        )}
      </div>

      {/* Grade distribution bars */}
      {dist.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {dist.map(({ gi, sends: s2, fails }) => {
            const col = gradeColor(gi, gym);
            const total = s2 + fails;
            const sendW = Math.round((s2 / maxCount) * 100);
            const failW = Math.round((fails / maxCount) * 100);
            return (
              <div key={gi} className="flex items-center gap-2">
                <div className="font-mono text-[10px] w-8 shrink-0 text-right" style={{ color: col }}>
                  {grades[gi] ?? gi}
                </div>
                <div className="flex-1 flex gap-[2px] h-[14px] items-center">
                  {s2 > 0 && (
                    <div className="h-full rounded-[3px] transition-all" style={{ width: `${sendW}%`, background: col, opacity: 0.85 }} />
                  )}
                  {fails > 0 && (
                    <div className="h-full rounded-[3px] transition-all" style={{ width: `${failW}%`, background: col, opacity: 0.25 }} />
                  )}
                </div>
                <div className="font-mono text-[9px] text-muted w-6 text-right shrink-0">{total}</div>
              </div>
            );
          })}
          <div className="flex gap-3 mt-1.5">
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-[2px] bg-accent opacity-85"/><span className="font-mono text-[9px] text-muted">send</span></div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-[2px] bg-accent opacity-25"/><span className="font-mono text-[9px] text-muted">fail</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionEditor({ session, gyms, exercises, gradeSystem, onSave, onDelete, onClose }) {
  const [s, setS] = useState(session);
  const grades = gradesFor(gradeSystem);
  const gym = gyms.find(g => g.id === s.gymId);

  const delBoulder = id => setS(p => ({...p, boulders: p.boulders.filter(b => b.id !== id)}));
  const delTraining = id => setS(p => ({...p, training: p.training.filter(t => t.id !== id)}));

  return (
    <div className="fixed inset-0 bg-black/85 z-[300] flex items-end">
      <div className="bg-surface rounded-t-[20px] w-full max-w-[430px] mx-auto p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <span className="font-sans text-[17px] font-extrabold text-text">Session Details</span>
            <div className="font-mono text-[10px] text-muted mt-0.5">{s.date} · {gym?.name ?? s.gymId}</div>
          </div>
          <button onClick={onClose} className="bg-transparent border-none text-muted text-[22px] cursor-pointer">✕</button>
        </div>

        {/* Stats */}
        <SessionStats s={s} grades={grades} gym={gym} />

        {/* Edit fields */}
        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          <div>
            <Lbl>DATE</Lbl>
            <input type="date" value={s.date} onChange={e => setS(p => ({...p, date: e.target.value}))} className={inp}/>
          </div>
          <div>
            <Lbl>GYM</Lbl>
            <select value={s.gymId} onChange={e => setS(p => ({...p, gymId: e.target.value}))}
              className={inp} style={{appearance: "menulist"}}>
              {gyms.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <Lbl>DURATION (min)</Lbl>
          <input type="number" value={s.durationMin ?? ""} onChange={e => setS(p => ({...p, durationMin: e.target.value === "" ? null : +e.target.value}))}
            className={inp} placeholder="—"/>
        </div>

        {s.boulders.length > 0 && (
          <>
            <Lbl>BOULDERS ({s.boulders.length})</Lbl>
            <div className="flex flex-col mb-4">
              {s.boulders.map(b => (
                <BoulderRow key={b.id} boulder={b} gym={gym} grades={grades} onDelete={() => delBoulder(b.id)}/>
              ))}
            </div>
          </>
        )}

        {s.training.length > 0 && (
          <>
            <Lbl>TRAINING ({s.training.length})</Lbl>
            <div className="flex flex-col gap-1.5 mb-4">
              {s.training.map(t => {
                const ex = exercises.find(e => e.id === t.exId);
                const summary = ex?.fields.map(f => {
                  const v = t.values?.[f.key];
                  if (v == null) return null;
                  if (f.unit === "idx") return `${f.label} ${grades[v] ?? v}`;
                  return `${f.label} ${v}${f.unit}`;
                }).filter(Boolean).join(" · ");
                return (
                  <div key={t.id} className="flex items-center gap-2.5 bg-s2 border border-border rounded-[8px] px-3 py-2">
                    <div className="flex-1">
                      <div className="font-sans text-xs font-semibold text-blue">{ex?.name ?? "Unknown"}</div>
                      <div className="font-mono text-[9px] text-muted mt-0.5">{summary}</div>
                    </div>
                    <InlineDelete onDelete={() => delTraining(t.id)}/>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="flex gap-2.5 mt-2">
          <InlineDelete size="large" onDelete={() => onDelete(s.id)}/>
          <button onClick={() => onSave(s)}
            className="flex-1 py-[11px] rounded-[8px] border-none bg-accent text-bg font-sans text-[13px] font-extrabold cursor-pointer">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
