import { useState, useEffect, useRef } from 'react';
import { PREP_SEC } from '../../constants';
import { makeBeep } from '../../utils/timerConfig';
import SetLogPanel from './SetLogPanel';
import SetSummaryGrid from './SetSummaryGrid';

export default function SetTimer({ config, onClose, onLog, grades, gym }) {
  const { sets=1, repsPerSet=1, workLabel="GO", workSec=null,
    shortRestSec=0, setRestSec=120, edgeMm, weightKg,
    logPerSet=false, climbsPerSet=null, targetGi=4 } = config;
  const logSlots = climbsPerSet ?? repsPerSet;

  const r = useRef({ phase:"prep", set:1, rep:1, left:PREP_SEC, paused:false, elapsed:0 });
  const [disp, setDisp]       = useState({...r.current});
  const [setLogs, setSetLogs] = useState({});
  const [showLogPanel, setShowLogPanel] = useState(false);
  const advanceRef = useRef(null);

  useEffect(() => {
    makeBeep(660, 0.1);

    const doAdvance = () => {
      const s = r.current;
      if (s.phase === "prep") {
        r.current = {...s, phase:"work", left:workSec??0, elapsed:0};
        makeBeep(1047, 0.12);
        setShowLogPanel(false);
      } else if (s.phase === "work") {
        const lastRep = s.rep >= repsPerSet, lastSet = s.set >= sets;
        if (!lastRep) {
          if (shortRestSec > 0) {
            r.current = {...s, phase:"shortRest", left:shortRestSec, elapsed:0};
            makeBeep(440, 0.09);
          } else {
            r.current = {...s, phase:"work", rep:s.rep+1, left:workSec??0, elapsed:0};
            makeBeep(880, 0.06, 0.2);
          }
          setShowLogPanel(false);
        } else if (!lastSet) {
          if (setRestSec > 0) {
            r.current = {...s, phase:"setRest", set:s.set+1, rep:1, left:setRestSec, elapsed:0};
            makeBeep(330, 0.15);
          } else {
            r.current = {...s, phase:"work", set:s.set+1, rep:1, left:workSec??0, elapsed:0};
            makeBeep(1047, 0.12);
          }
          if (logPerSet) setShowLogPanel(true);
        } else {
          r.current = {...s, phase:"done", elapsed:0};
          makeBeep(660,0.12); setTimeout(()=>makeBeep(880,0.12),180); setTimeout(()=>makeBeep(1100,0.2),360);
          if (logPerSet) setShowLogPanel(true);
        }
      } else if (s.phase === "shortRest") {
        r.current = {...s, phase:"work", rep:s.rep+1, left:workSec??0, elapsed:0};
        makeBeep(1047, 0.12);
        setShowLogPanel(false);
      } else if (s.phase === "setRest") {
        r.current = {...s, phase:"work", left:workSec??0, elapsed:0};
        makeBeep(1047, 0.12);
        setShowLogPanel(false);
      }
      setDisp({...r.current});
    };

    advanceRef.current = doAdvance;

    const id = setInterval(() => {
      const s = r.current;
      if (s.paused || s.phase==="done") return;
      if (s.phase==="work" && workSec===null) {
        r.current = {...s, elapsed:+(s.elapsed+0.1).toFixed(1)};
        setDisp({...r.current});
        return;
      }
      const newLeft = +(s.left-0.1).toFixed(1);
      if (s.phase==="work" && workSec!==null) {
        if (newLeft===3.0||newLeft===2.0||newLeft===1.0) makeBeep(660,0.05,0.18);
      }
      if (newLeft <= 0) { doAdvance(); }
      else { r.current = {...s, left:newLeft}; setDisp({...r.current}); }
    }, 100);

    return () => clearInterval(id);
  }, []); // eslint-disable-line

  const togglePause = () => { r.current={...r.current,paused:!r.current.paused}; setDisp({...r.current}); };

  const { phase, set, rep, left, paused, elapsed } = disp;
  const completedSet = phase==="done" ? sets : (set-1);

  const saveSetLog = (climbs) => {
    setSetLogs(p => ({...p, [completedSet]: {climbs}}));
    setShowLogPanel(false);
  };

  const phaseColor = {
    prep:"var(--color-accent)", work:"var(--color-green)",
    shortRest:"var(--color-blue)", setRest:"var(--color-purple)", done:"var(--color-accent)",
  }[phase] ?? "var(--color-accent)";

  const phaseTitle =
    phase==="prep"      ? "GET READY" :
    phase==="work"      ? (repsPerSet>1 ? `${workLabel}  ${rep} / ${repsPerSet}` : workLabel) :
    phase==="shortRest" ? "BREATHE" :
    phase==="setRest"   ? "REST" : "DONE";
  const setInfo =
    phase==="done"  ? "ALL SETS COMPLETE" :
    phase==="prep"  ? `${sets} SET${sets!==1?"S":""}  ·  ${workSec?`${workSec}s`:"TAP TO FINISH"}` :
    `SET  ${set} / ${sets}`;

  const durMap = {prep:PREP_SEC, work:workSec||1, shortRest:shortRestSec||1, setRest:setRestSec||1, done:1};
  const progress = phase==="done" ? 1 : (phase==="work"&&workSec===null) ? 0 : Math.max(0,1-left/(durMap[phase]||1));
  const R=70,CX=88,CY=88,circ=2*Math.PI*R;

  const infoItems = [
    workSec ? `${workSec}s work` : "tap to finish",
    shortRestSec>0 ? `${shortRestSec}s rep rest` : null,
    setRestSec>0 ? `${setRestSec}s set rest` : null,
    edgeMm ? `${edgeMm}mm` : null,
    weightKg>0 ? `+${weightKg}kg` : null,
  ].filter(Boolean).join("  ·  ");

  const buildSetLogsArray = () =>
    Object.entries(setLogs)
      .sort(([a],[b])=>+a-+b)
      .map(([setNum,{climbs}]) => ({set:+setNum, climbs}));

  const handleLogAndClose = () => {
    onLog(buildSetLogsArray());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[500] bg-[#030303] flex flex-col">

      {/* Full-screen log panel — hides the timer while active */}
      {logPerSet && showLogPanel && (
        <SetLogPanel
          n={logSlots}
          targetGi={targetGi}
          grades={grades}
          gym={gym}
          label="CLIMB"
          existing={setLogs[completedSet]?.climbs}
          onSave={saveSetLog}
          onSkip={()=>setShowLogPanel(false)}
          fullScreen
        />
      )}

      {/* Timer UI — hidden while log panel is open */}
      {!showLogPanel && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center py-5 pb-[10px]">
            <div className="font-mono text-[11px] tracking-[5px] mb-1 transition-colors" style={{color:phaseColor}}>
              {phaseTitle}
            </div>
            <div className="font-mono text-[10px] text-muted mb-4 text-center tracking-[1px]">
              {setInfo}
            </div>

            {phase==="work" && workSec===null ? (
              <button onClick={()=>advanceRef.current?.()} style={{
                width:176,height:176,borderRadius:"50%",
                border:"2px solid var(--color-green)",background:"#081208",
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,
              }}>
                <div style={{fontFamily:"var(--font-mono)",fontSize:9,color:"var(--color-green)",letterSpacing:3}}>TAP WHEN DONE</div>
                {elapsed>0.5&&<div style={{fontFamily:"var(--font-mono)",fontSize:28,color:"var(--color-green)",fontWeight:300}}>{Math.floor(elapsed)}s</div>}
              </button>
            ) : phase==="done" && logPerSet ? (
              <div className="font-sans text-[52px] font-extrabold text-accent mb-1">✓</div>
            ) : (
              <div className="relative w-[176px] h-[176px]">
                <svg width="176" height="176" style={{position:"absolute",top:0,left:0}}>
                  <circle cx={CX} cy={CY} r={R} fill="none" stroke="#181818" strokeWidth="9"/>
                  <circle cx={CX} cy={CY} r={R} fill="none" stroke={phaseColor} strokeWidth="9"
                    strokeDasharray={circ} strokeDashoffset={circ*(1-progress)}
                    strokeLinecap="round" transform={`rotate(-90 ${CX} ${CY})`}
                    style={{transition:"stroke-dashoffset 0.1s linear, stroke 0.4s"}}/>
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  {phase==="done"
                    ? <div className="font-sans text-[36px] font-extrabold text-accent">✓</div>
                    : <div className="font-mono text-[44px] font-medium text-text leading-none">{Math.ceil(left)}</div>
                  }
                </div>
              </div>
            )}

            <div className="font-mono text-[9px] text-[#3a3a3a] tracking-[1px] mt-3 text-center">{infoItems}</div>

            {phase==="done" && !logPerSet ? (
              <div className="flex flex-col gap-2.5 w-[220px] mt-5">
                <button onClick={handleLogAndClose} className="py-[14px] rounded-[10px] border-none bg-accent text-bg font-sans text-[14px] font-extrabold">
                  Log &amp; Close
                </button>
                <button onClick={onClose} className="py-3 rounded-[10px] border border-border bg-transparent text-muted font-mono text-xs">
                  Close without logging
                </button>
              </div>
            ) : phase!=="done" && (
              <div className="flex flex-col items-center gap-2 mt-4">
                <div className="flex gap-2.5">
                  <button onClick={togglePause} className="py-[11px] px-6 rounded-[10px] border border-border bg-surface text-text font-mono text-[13px] tracking-[1px]">
                    {paused?"▶ RESUME":"⏸ PAUSE"}
                  </button>
                  <button onClick={onClose} className="py-[11px] px-4 rounded-[10px] border border-border bg-transparent text-muted font-mono text-[13px]">
                    ✕
                  </button>
                </div>
                {(phase==="shortRest"||phase==="setRest") && !paused && (
                  <button onClick={()=>advanceRef.current?.()} className="py-[7px] px-[22px] rounded-full border border-muted bg-transparent text-muted font-mono text-[10px] tracking-[1px]">
                    SKIP REST →
                  </button>
                )}
                {logPerSet && (phase==="setRest"||phase==="done") && (
                  <button onClick={()=>setShowLogPanel(true)} style={{
                    padding:"7px 22px",borderRadius:20,
                    border:"1px solid var(--color-accent)",background:"color-mix(in srgb,var(--color-accent) 8%,transparent)",
                    color:"var(--color-accent)",fontFamily:"var(--font-mono)",fontSize:10,letterSpacing:1,
                  }}>+ LOG SET {completedSet}</button>
                )}
              </div>
            )}
          </div>

          {/* Done summary */}
          {logPerSet && phase==="done" && (
            <div className="bg-[#0c0c0c] border-t border-border px-5 pt-4 pb-5 overflow-y-auto max-h-[45vh]">
              <div className="font-mono text-[10px] text-muted tracking-[2px] mb-3">SESSION SUMMARY</div>
              <SetSummaryGrid
                setLogs={Object.entries(setLogs).reduce((acc,[k,v])=>({...acc,[k]:v}),{})}
                sets={sets} climbs={logSlots}
                grades={grades} gym={gym}
              />
              <div className="flex gap-2.5 mt-3.5">
                <button onClick={handleLogAndClose} className="flex-1 py-[13px] rounded-[10px] border-none bg-accent text-bg font-sans text-[13px] font-extrabold">
                  Log &amp; Close
                </button>
                <button onClick={onClose} className="py-[13px] px-4 rounded-[10px] border border-border bg-transparent text-muted font-mono text-xs">
                  Skip
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
