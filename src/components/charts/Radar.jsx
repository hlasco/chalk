export default function Radar({ data }) {
  if (!data || data.length < 3) return null;
  const n=data.length, cx=110,cy=110,r=76;
  const ang=i=>(i/n)*2*Math.PI-Math.PI/2;
  const pt=(i,rad)=>[cx+rad*Math.cos(ang(i)),cy+rad*Math.sin(ang(i))];
  return (
    <svg width="100%" viewBox="0 0 220 220">
      {[.25,.5,.75,1].map(t=>(<polygon key={t} points={data.map((_,i)=>pt(i,r*t).join(",")).join(" ")} fill="none" stroke="var(--color-dim)" strokeWidth="1"/>))}
      {data.map((_,i)=>{const [x2,y2]=pt(i,r);return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke="var(--color-dim)" strokeWidth="1"/>;})}
      <polygon points={data.map((d,i)=>pt(i,r*Math.max(.04,d.v)).join(",")).join(" ")} fill="color-mix(in srgb,var(--color-accent) 10%,transparent)" stroke="var(--color-accent)" strokeWidth="1.5"/>
      {data.map((d,i)=>{const [x,y]=pt(i,r*Math.max(.04,d.v));return <circle key={i} cx={x} cy={y} r="3.5" fill="var(--color-accent)"/>;})}
      {data.map((d,i)=>{const [x,y]=pt(i,r+20);return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" style={{fontFamily:"var(--font-mono)",fontSize:9,fill:"#888"}}>{d.label}</text>;})}
    </svg>
  );
}
