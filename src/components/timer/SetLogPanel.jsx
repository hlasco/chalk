import { useState } from 'react';
import { gradeColor, alphaColor } from '../../utils/gradeUtils';
import GradeSelector from '../pickers/GradeSelector';
import StyleSelector from '../pickers/StyleSelector';
import SendFellToggle from '../pickers/SendFellToggle';

export default function SetLogPanel({ n, targetGi=4, grades, gym, existing, onSave, onSkip, label="CLIMB", fullScreen=false, showAttempts=false }) {
  const initSlots = () => Array.from({length:n}, (_,i) => ({
    gi: existing?.[i]?.gi ?? targetGi,
    styles: existing?.[i]?.styles ?? [],
    sent: existing?.[i]?.sent ?? !showAttempts,
    attempts: existing?.[i]?.attempts ?? 1,
  }));

  const [slots, setSlots] = useState(initSlots);
  const [activeSlot, setActiveSlot] = useState(null);

  const updSlot = (i, patch) => setSlots(p => p.map((s,j) => j===i ? {...s,...patch} : s));
  const save = () => onSave(slots.map(({gi,styles,sent,attempts})=>({gi,styles,sent,attempts})));

  return (
    <div className={fullScreen
      ? "flex-1 overflow-y-auto px-5 pt-6 pb-6"
      : "border-t border-border px-5 pt-4 pb-6 max-h-[60vh] overflow-y-auto"
    } style={{ background: 'var(--color-surface)' }}>
      <div className="flex justify-between items-center mb-4">
        <div className="font-mono text-[11px] text-muted tracking-[2px]">
          LOG {n} {label.toUpperCase()}{n!==1?"S":""}
        </div>
        <button onClick={onSkip} className="font-mono text-[11px] text-dim bg-transparent border-none tracking-[1px]">
          skip
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {slots.map((slot,i)=>{
          const col = gradeColor(slot.gi, gym);
          const isOpen = activeSlot === i;
          return (
            <div key={i} className="rounded-[12px] overflow-hidden"
              style={{border:`1px solid ${isOpen?"var(--color-accent)":"var(--color-border)"}`}}>

              {/* Main row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="font-mono text-[12px] text-dim w-4 shrink-0">{i+1}</div>

                {/* Grade button — primary action, large tap target */}
                <button onClick={()=>setActiveSlot(isOpen?null:i)} style={{
                  width:72, height:48, borderRadius:10, flexShrink:0,
                  border:`1px solid ${isOpen ? col : 'var(--color-border)'}`,
                  background: isOpen ? alphaColor(col, 14) : 'var(--color-s2)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600, letterSpacing: 1,
                }}>{grades[slot.gi] ?? `#${slot.gi}`}</button>

                {/* Sent/fell or attempts stepper */}
                {showAttempts ? (
                  <div className="flex items-center gap-1.5">
                    <button onClick={()=>updSlot(i,{attempts:Math.max(1,(slot.attempts||1)-1)})}
                      style={{width:26,height:26,borderRadius:6,border:'1px solid var(--color-border)',background:'transparent',color:'var(--color-muted)',fontFamily:'var(--font-mono)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:13,color:'var(--color-text)',minWidth:16,textAlign:'center'}}>{slot.attempts||1}</span>
                    <button onClick={()=>updSlot(i,{attempts:(slot.attempts||1)+1})}
                      style={{width:26,height:26,borderRadius:6,border:'1px solid var(--color-border)',background:'transparent',color:'var(--color-muted)',fontFamily:'var(--font-mono)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                    <div style={{width:1,height:20,background:'var(--color-border)',margin:'0 2px'}}/>
                    <SendFellToggle sent={slot.sent} setSent={v=>updSlot(i,{sent:v})} size="compact"/>
                  </div>
                ) : (
                  <div className="flex-1">
                    <SendFellToggle sent={slot.sent} setSent={v=>updSlot(i,{sent:v})} size="compact"/>
                  </div>
                )}

                {/* Style badges */}
                <div className="flex gap-1 shrink-0">
                  {slot.styles.slice(0,2).map(s=>(
                    <span key={s} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-mono text-[9px]">{s}</span>
                  ))}
                  {slot.styles.length>2&&<span className="font-mono text-[9px] text-muted">+{slot.styles.length-2}</span>}
                </div>
              </div>

              {/* Expanded grade + style picker */}
              {isOpen && (
                <div className="border-t border-border px-4 py-3 flex flex-col gap-3">
                  <GradeSelector gi={slot.gi} setGi={v=>updSlot(i,{gi:v})} grades={grades} gym={gym} mode="compact"/>
                  {n > 1 && (
                    <button onClick={()=>setSlots(p=>p.map(s=>({...s,gi:slot.gi})))}
                      className="w-full py-2 rounded-[8px] bg-s2 border border-border font-mono text-[10px] text-muted tracking-[1px]">
                      apply this grade to all {n} climbs
                    </button>
                  )}
                  <StyleSelector
                    selected={slot.styles}
                    setSelected={v=>updSlot(i,{styles:typeof v==="function"?v(slot.styles):v})}
                    size="compact"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={save} className="w-full mt-4 py-[14px] rounded-[10px] border-none bg-accent text-bg font-sans text-[14px] font-extrabold tracking-[1px]">
        SAVE SET →
      </button>
    </div>
  );
}
