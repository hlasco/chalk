import { EXERCISE_CATEGORIES, BUILTIN_TIMER_IDS } from '../constants';
import { uid } from '../utils/uid';
import { inp } from '../styles/shared';
import Lbl from '../components/ui/Lbl';
import InlineDelete from '../components/InlineDelete';

export default function LibraryTab({ exercises, setExercises, exercisesByCategory, setEditingEx }) {
  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex justify-between items-center mb-6">
        <Lbl style={{marginBottom:0}}>EXERCISE LIBRARY</Lbl>
        <button onClick={()=>setEditingEx({id:`ex_${uid()}`,name:"",category:"Custom",fields:[{key:"sets",label:"Sets",unit:""}],builtin:false})}
          className="bg-accent text-bg border-none rounded-[8px] font-sans text-[11px] font-bold px-3 py-[7px]">
          + NEW
        </button>
      </div>

      {EXERCISE_CATEGORIES.map(cat=>{
        const items = exercisesByCategory[cat]||[];
        if (!items.length) return null;
        return (
          <div key={cat} className="mb-8">
            <div className="font-mono text-[9px] text-accent tracking-[3px] mb-3">{cat.toUpperCase()}</div>
            <div className="flex flex-col gap-3">
              {items.map(e=>{
                const isBuiltin = e.builtin && BUILTIN_TIMER_IDS.includes(e.id);
                const timerMode = !e.timerCfg ? (isBuiltin ? 'default' : 'off') : e.timerCfg.type;
                const secFields = e.fields.filter(f=>f.unit==="s"||f.unit==="min");

                const setExTimer = (mode) => {
                  if (mode === 'default') {
                    setExercises(p=>p.map(x=>x.id===e.id?{...x,timerCfg:null}:x));
                  } else if (mode === 'off') {
                    setExercises(p=>p.map(x=>x.id===e.id?{...x,timerCfg:{type:'off'}}:x));
                  } else if (mode === 'tap') {
                    setExercises(p=>p.map(x=>x.id===e.id?{...x,timerCfg:{type:'tap',label:e.name,durationKey:secFields[0]?.key||''}}:x));
                  } else {
                    setExercises(p=>p.map(x=>x.id===e.id?{...x,timerCfg:{type:'timed',label:e.name,durationKey:secFields[0]?.key||''}}:x));
                  }
                };
                const updExTimer = (k,v) => setExercises(p=>p.map(x=>x.id===e.id?{...x,timerCfg:{...x.timerCfg,[k]:v}}:x));

                return (
                  <div key={e.id} className="bg-surface border border-border rounded-[12px] px-4 py-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-sans text-[14px] font-semibold text-text">{e.name}</div>
                        <div className="font-mono text-[10px] text-muted mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {e.fields.map(f=>`${f.label}${f.unit?` · ${f.unit}`:""}`).join("  /  ")}
                        </div>
                      </div>
                      <div className="flex gap-1.5 ml-3 shrink-0">
                        <button onClick={()=>setEditingEx(e)} className="bg-s2 border border-border text-muted font-mono text-[10px] px-2.5 py-[5px] rounded-[6px]">Edit</button>
                        <InlineDelete onDelete={()=>setExercises(p=>p.filter(x=>x.id!==e.id))}/>
                      </div>
                    </div>

                    <div className="border-t border-border pt-3">
                      <div className="font-mono text-[9px] text-muted tracking-[2px] mb-2">TIMER</div>
                      <div className="flex gap-[5px] flex-wrap">
                        {[
                          ...(isBuiltin ? [['default','Built-in']] : []),
                          ['off','Off'],
                          ['tap','Tap'],
                          ['timed','Countdown'],
                        ].map(([mode,lbl])=>{
                          const isActive = timerMode === mode;
                          const col = mode==='default'?'var(--color-accent)':mode==='timed'?'var(--color-green)':mode==='tap'?'var(--color-blue)':'var(--color-muted)';
                          return (
                            <button key={mode} onClick={()=>setExTimer(mode)} style={{
                              padding:'5px 11px', borderRadius:20,
                              fontFamily:'var(--font-mono)', fontSize:10,
                              border:`1px solid ${isActive?col:'var(--color-border)'}`,
                              background: isActive ? `color-mix(in srgb,${col} 12%,transparent)` : 'transparent',
                              color: isActive ? col : 'var(--color-muted)',
                            }}>{lbl}</button>
                          );
                        })}
                      </div>

                      {timerMode==='timed' && (
                        <div className="flex gap-2 mt-2.5">
                          <div className="flex-1">
                            <div className="font-mono text-[9px] text-muted mb-1">DURATION FIELD</div>
                            <select value={e.timerCfg?.durationKey||""} onChange={ev=>updExTimer("durationKey",ev.target.value)}
                              className={inp} style={{appearance:"menulist",fontSize:11,padding:"6px 10px"}}>
                              <option value="">— pick —</option>
                              {secFields.map((f,i)=>(<option key={i} value={f.key}>{f.label} ({f.unit})</option>))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <div className="font-mono text-[9px] text-muted mb-1">LABEL</div>
                            <input value={e.timerCfg?.label||""} onChange={ev=>updExTimer("label",ev.target.value)}
                              className={inp} style={{fontSize:11,padding:"6px 10px"}} placeholder="GO"/>
                          </div>
                        </div>
                      )}
                      {timerMode==='tap' && (
                        <div className="mt-2.5">
                          <div className="font-mono text-[9px] text-muted mb-1">LABEL</div>
                          <input value={e.timerCfg?.label||""} onChange={ev=>updExTimer("label",ev.target.value)}
                            className={inp} style={{fontSize:11,padding:"6px 10px"}} placeholder="GO"/>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
