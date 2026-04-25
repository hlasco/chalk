import Lbl from '../ui/Lbl';

export default function SettingsPanel({ gradeSystem, setGradeSystem, gyms, onEditGym, onNewGym, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/85 z-[250] flex items-end">
      <div className="bg-surface rounded-t-[20px] w-full max-w-[430px] mx-auto p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <span className="font-sans text-[17px] font-extrabold text-text">Settings</span>
          <button onClick={onClose} className="bg-transparent border-none text-muted text-[22px] cursor-pointer">✕</button>
        </div>

        <Lbl>GRADE SYSTEM</Lbl>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {["V-Scale","Font"].map(s=>(
            <button key={s} onClick={()=>setGradeSystem(s)}
              className="py-[10px] px-1 rounded-[8px] text-center font-mono text-[11px] cursor-pointer"
              style={{
                border:`1px solid ${gradeSystem===s?"var(--color-accent)":"var(--color-border)"}`,
                background:gradeSystem===s?"color-mix(in srgb,var(--color-accent) 9%,transparent)":"var(--color-s2)",
                color:gradeSystem===s?"var(--color-accent)":"var(--color-muted)",
              }}>{s}</button>
          ))}
        </div>

        <Lbl>GYMS</Lbl>
        <div className="flex flex-col gap-2 mb-3">
          {gyms.map(g=>(
            <button key={g.id} onClick={()=>onEditGym(g)}
              className="flex items-center justify-between bg-s2 border border-border rounded-[10px] px-3.5 py-3 cursor-pointer">
              <div className="text-left">
                <div className="font-sans text-[13px] font-bold text-text">{g.name}</div>
                <div className="font-mono text-[9px] text-muted mt-[3px]">
                  {g.ranges?.length?`${g.ranges.length} color tiers`:"Default palette"}
                </div>
                {g.ranges?.length>0 && (
                  <div className="flex gap-1 mt-1.5">
                    {g.ranges.map((r,i)=>(
                      <div key={i} title={r.name} className="w-3 h-3 rounded-full border border-border" style={{background:r.color}}/>
                    ))}
                  </div>
                )}
              </div>
              <span className="font-mono text-[11px] text-muted">Edit</span>
            </button>
          ))}
        </div>
        <button onClick={onNewGym} className="w-full py-[11px] rounded-[8px] border border-dashed border-border bg-transparent text-muted font-mono text-[11px] cursor-pointer">
          + New gym
        </button>
      </div>
    </div>
  );
}
