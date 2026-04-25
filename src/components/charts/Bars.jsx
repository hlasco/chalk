export default function Bars({ data, colorFn }) {
  const max = Math.max(...data.map(d=>d.v),1);
  return (
    <div className="flex items-end gap-[5px] h-[100px]">
      {data.map((d,i)=>{
        const col = colorFn ? colorFn(d,i) : 'var(--color-accent)';
        return (
          <div key={i} className="flex flex-col items-center flex-1 gap-[3px]">
            <span className="font-mono text-[9px]" style={{color:col}}>{d.v||""}</span>
            <div className="w-full flex-1 flex items-end">
              <div className="w-full rounded-t-[3px]" style={{height:`${Math.max(3,(d.v/max)*100)}%`,background:col}}/>
            </div>
            <span className="font-mono text-[9px] text-muted text-center leading-tight">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
