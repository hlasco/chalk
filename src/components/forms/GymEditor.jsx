import { useState } from 'react';
import { gradesFor } from '../../utils/gradeUtils';
import { clsx } from 'clsx';
import { Trash2 } from 'lucide-react';
import { inp } from '../../styles/shared';
import Lbl from '../ui/Lbl';
import InlineDelete from '../InlineDelete';

export default function GymEditor({ gym, gradeSystem, onSave, onCancel, onDelete }) {
  const grades = gradesFor(gradeSystem);
  const [name, setName] = useState(gym.name);
  const [ranges, setRanges] = useState(gym.ranges||[]);

  const addRange = () => {
    const lastMax = ranges.length ? ranges[ranges.length-1].maxGi : -1;
    setRanges(p=>[...p,{name:"New",color:"#888888",minGi:Math.min(lastMax+1,grades.length-1),maxGi:Math.min(lastMax+2,grades.length-1)}]);
  };
  const updRange = (i,k,v) => setRanges(p=>p.map((r,j)=>j===i?{...r,[k]:v}:r));
  const delRange = i => setRanges(p=>p.filter((_,j)=>j!==i));

  return (
    <div className="fixed inset-0 bg-black/85 z-[300] flex items-end">
      <div className="bg-surface rounded-t-[20px] w-full max-w-[430px] mx-auto p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <span className="font-sans text-[17px] font-extrabold text-text">{gym.name?"Edit gym":"New gym"}</span>
          <button onClick={onCancel} className="bg-transparent border-none text-muted text-[22px] cursor-pointer">✕</button>
        </div>

        <Lbl>NAME</Lbl>
        <input value={name} onChange={e=>setName(e.target.value)} className={clsx(inp, "mb-5")}/>

        <Lbl>COLOR TIERS <span className="text-dim font-light">(map a colour to a grade range)</span></Lbl>
        <div className="font-mono text-[9px] text-dim mb-2.5">
          Leave empty to use the default grade palette. Grade system: {gradeSystem}
        </div>

        <div className="flex flex-col gap-2.5 mb-2.5">
          {ranges.map((r,i)=>(
            <div key={i} className="bg-s2 border border-border rounded-[8px] p-3">
              <div className="flex gap-2 items-center mb-2.5">
                <input type="color" value={r.color} onChange={e=>updRange(i,"color",e.target.value)}
                  style={{width:36,height:36,borderRadius:6,border:"1px solid var(--color-border)",cursor:"pointer",padding:2,background:"none"}}/>
                <input value={r.name} onChange={e=>updRange(i,"name",e.target.value)}
                  placeholder="Tier name…" className={clsx(inp, "flex-1")}/>
                <button onClick={()=>delRange(i)} className="bg-transparent border-none text-muted cursor-pointer p-1"><Trash2 size={15}/></button>
              </div>
              <div className="flex gap-2 items-center">
                <span className="font-mono text-[10px] text-muted">From</span>
                <select value={r.minGi} onChange={e=>updRange(i,"minGi",+e.target.value)} className={clsx(inp, "flex-1")} style={{appearance:"menulist"}}>
                  {grades.map((g,gi)=>(<option key={gi} value={gi}>{g}</option>))}
                </select>
                <span className="font-mono text-[10px] text-muted">to</span>
                <select value={r.maxGi} onChange={e=>updRange(i,"maxGi",+e.target.value)} className={clsx(inp, "flex-1")} style={{appearance:"menulist"}}>
                  {grades.map((g,gi)=>(<option key={gi} value={gi}>{g}</option>))}
                </select>
              </div>
              <div className="flex gap-1 mt-2.5 flex-wrap">
                {grades.slice(r.minGi,r.maxGi+1).map((g,gi)=>(
                  <div key={gi} className="px-2 py-0.5 rounded-[4px] font-mono text-[10px]"
                    style={{background:`${r.color}22`,color:r.color}}>{g}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={addRange} className="w-full py-[9px] rounded-[8px] border border-dashed border-border bg-transparent text-muted font-mono text-[11px] cursor-pointer mb-[22px]">
          + Add tier
        </button>

        <div className="flex gap-2.5">
          {gym.id && onDelete && <InlineDelete size="large" onDelete={()=>onDelete(gym.id)}/>}
          <button onClick={onCancel} className="flex-1 py-[11px] rounded-[8px] border border-border bg-transparent text-muted font-mono text-xs cursor-pointer">Cancel</button>
          <button onClick={()=>onSave({...gym,name:name.trim()||"Unnamed",ranges})} className="flex-[2] py-[11px] rounded-[8px] border-none bg-accent text-bg font-sans text-[13px] font-extrabold cursor-pointer">Save</button>
        </div>
      </div>
    </div>
  );
}
