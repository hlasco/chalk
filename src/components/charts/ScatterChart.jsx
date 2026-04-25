import Empty from '../ui/Empty';

export default function ScatterChart({ data, xLabel, yLabel, color='var(--color-accent)', xFormat, yFormat }) {
  if (!data || data.length < 2) return <Empty>Not enough data yet</Empty>;
  const xs = data.map(d=>d.x), ys = data.map(d=>d.y);
  const xmin=Math.min(...xs), xmax=Math.max(...xs), xrng=xmax-xmin||1;
  const ymin=Math.min(...ys), ymax=Math.max(...ys), yrng=ymax-ymin||1;
  const W=300,H=150,px=36;
  const sx=v=>px+((v-xmin)/xrng)*(W-px*2);
  const sy=v=>H-px-((v-ymin)/yrng)*(H-px*2);
  const fmtX=v=>xFormat?xFormat(v):(Number.isInteger(v)?v:v.toFixed(1));
  const fmtY=v=>yFormat?yFormat(v):(Number.isInteger(v)?v:v.toFixed(1));
  const mono = 'var(--font-mono)';
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H+6}`} style={{overflow:"visible"}}>
      <line x1={px} y1={H-px} x2={W-px} y2={H-px} stroke="var(--color-dim)" strokeWidth="1"/>
      <line x1={px} y1={px} x2={px} y2={H-px} stroke="var(--color-dim)" strokeWidth="1"/>
      {[0,0.5,1].map(t=>{const v=ymin+t*yrng;return(
        <g key={`y${t}`}>
          <line x1={px-3} x2={px} y1={sy(v)} y2={sy(v)} stroke="var(--color-muted)" strokeWidth="1"/>
          <text x={px-5} y={sy(v)+3} textAnchor="end" style={{fontFamily:mono,fontSize:8,fill:"var(--color-muted)"}}>{fmtY(v)}</text>
        </g>
      );})}
      {[0,0.5,1].map(t=>{const v=xmin+t*xrng;return(
        <g key={`x${t}`}>
          <line x1={sx(v)} x2={sx(v)} y1={H-px} y2={H-px+3} stroke="var(--color-muted)" strokeWidth="1"/>
          <text x={sx(v)} y={H-px+12} textAnchor="middle" style={{fontFamily:mono,fontSize:8,fill:"var(--color-muted)"}}>{fmtX(v)}</text>
        </g>
      );})}
      <text x={W/2} y={H+4} textAnchor="middle" style={{fontFamily:mono,fontSize:9,fill:"var(--color-muted)",letterSpacing:1}}>{xLabel}</text>
      <text x={6} y={H/2} textAnchor="middle" transform={`rotate(-90 6 ${H/2})`} style={{fontFamily:mono,fontSize:9,fill:"var(--color-muted)",letterSpacing:1}}>{yLabel}</text>
      {data.map((d,i)=>(<circle key={i} cx={sx(d.x)} cy={sy(d.y)} r="4" fill={color} stroke="var(--color-bg)" strokeWidth="1"/>))}
    </svg>
  );
}
