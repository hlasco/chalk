import { useState } from 'react';
import { EXERCISE_CATEGORIES } from '../../constants';
import { uid } from '../../utils/uid';
import { clsx } from 'clsx';
import { inp, pill } from '../../styles/shared';
import Lbl from '../ui/Lbl';

export default function ExerciseEditor({ exercise, onSave, onCancel }) {
  const [name,     setName]     = useState(exercise.name);
  const [category, setCategory] = useState(exercise.category || "Custom");
  const [fields,   setFields]   = useState(exercise.fields);

  const addField = () => setFields(p=>[...p,{key:`f_${uid()}`,label:"",unit:""}]);
  const updField = (i,k,v) => setFields(p=>p.map((f,j)=>j===i?{...f,[k]:v}:f));
  const delField = i => setFields(p=>p.filter((_,j)=>j!==i));

  return (
    <div className="fixed inset-0 bg-black/85 z-[300] flex items-end">
      <div className="bg-surface rounded-t-[20px] w-full max-w-[430px] mx-auto p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <span className="font-sans text-[17px] font-extrabold text-text">{exercise.name?"Edit":"New"} exercise</span>
          <button onClick={onCancel} className="bg-transparent border-none text-muted text-[22px]">✕</button>
        </div>

        <Lbl>NAME</Lbl>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. One-arm hang" className={clsx(inp, "mb-4")}/>

        <Lbl>CATEGORY</Lbl>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {EXERCISE_CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setCategory(c)} className={pill(category===c)}>{c}</button>
          ))}
        </div>

        <Lbl>MEASUREMENTS</Lbl>
        <div className="font-mono text-[9px] text-dim mb-2">
          Unit examples: s, min, kg, mm, %, /10 — use "idx" for a grade picker
        </div>
        <div className="flex flex-col gap-2 mb-2.5">
          {fields.map((f,i)=>(
            <div key={i} className="flex gap-1.5 items-center">
              <input value={f.label} onChange={e=>updField(i,"label",e.target.value)} placeholder="Label" className={clsx(inp, "flex-[2]")}/>
              <input value={f.unit} onChange={e=>updField(i,"unit",e.target.value)} placeholder="unit" className={clsx(inp, "flex-1")}/>
              <button onClick={()=>delField(i)} className="bg-transparent border-none text-muted text-[18px] px-2">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addField} className="w-full py-[9px] rounded-[8px] border border-dashed border-border bg-transparent text-muted font-mono text-[11px] mb-[22px]">
          + Add field
        </button>

        <div className="flex gap-2.5">
          <button onClick={onCancel} className="flex-1 py-[11px] rounded-[8px] border border-border bg-transparent text-muted font-mono text-xs">Cancel</button>
          <button onClick={()=>onSave({...exercise,name:name.trim()||"Unnamed",category,fields,timerCfg:exercise.timerCfg||null})} className="flex-[2] py-[11px] rounded-[8px] border-none bg-accent text-bg font-sans text-[13px] font-extrabold">Save</button>
        </div>
      </div>
    </div>
  );
}
