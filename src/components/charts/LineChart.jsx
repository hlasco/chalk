import Empty from '../ui/Empty';

export default function LineChart({ data, color='var(--color-accent)', yFormat }) {
  if (!data || data.length < 2) return <Empty>Not enough data yet</Empty>;
  const vals = data.map(d=>d.v);
  const min = Math.min(...vals), max = Math.max(...vals), rng = max-min||1;
  const W=300,H=90,px=22;
  const sx=i=>px+(i/(data.length-1))*(W-px*2);
  const sy=v=>H-px-((v-min)/rng)*(H-px*2);
  const pts=vals.map((v,i)=>`${sx(i)},${sy(v)}`).join(" ");
  const id=`g${color.replace(/\W/g,"")}`;
  const fmt = v => yFormat ? yFormat(v) : (Number.isInteger(v)?v:v.toFixed(1));
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points={`${sx(0)},${H-px} ${pts} ${sx(data.length-1)},${H-px}`} fill={`url(#${id})`}/>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
        {vals.map((v,i)=>(
          <g key={i}>
            <circle cx={sx(i)} cy={sy(v)} r="3.5" fill={color}/>
            <text x={sx(i)} y={sy(v)-9} textAnchor="middle" style={{fontFamily:"var(--font-mono)",fontSize:9,fill:color}}>{fmt(v)}</text>
          </g>
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d,i)=><span key={i} className="font-mono text-[8px] text-muted">{d.label}</span>)}
      </div>
    </div>
  );
}
