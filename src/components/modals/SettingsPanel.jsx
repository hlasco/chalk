import Lbl from '../ui/Lbl';
import { THEMES } from '../../data/themes';

const COLOR_FIELDS = [
  { key: 'bg',     label: 'Background' },
  { key: 'accent', label: 'Highlight'  },
  { key: 'text',   label: 'Text'       },
  { key: 'muted',  label: 'Muted'      },
  { key: 'green',  label: 'Green'      },
  { key: 'blue',   label: 'Blue'       },
  { key: 'purple', label: 'Purple'     },
  { key: 'red',    label: 'Red'        },
];

function Picker({ label, value, onChange, isCustom, onReset }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: value,
          border: isCustom
            ? `2px solid ${value}`
            : '2px solid var(--color-border)',
          boxShadow: isCustom ? `0 0 8px ${value}55` : 'none',
          transition: 'box-shadow 0.2s',
        }} />
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{
            position: 'absolute', inset: 0, opacity: 0,
            width: '100%', height: '100%', cursor: 'pointer',
          }} />
      </div>
      <span className="font-mono text-[9px] text-muted">{label}</span>
      {isCustom && (
        <button onClick={onReset}
          className="font-mono text-[8px] cursor-pointer bg-transparent border-none"
          style={{ color: 'var(--color-accent)', lineHeight: 1, padding: 0 }}>
          ↺
        </button>
      )}
    </div>
  );
}

export default function SettingsPanel({
  gradeSystem, setGradeSystem,
  gyms, onEditGym, onNewGym, onClose,
  themeKey, setThemeKey,
  customColors, setCustomColors,
}) {
  const hasCustom = Object.keys(customColors).length > 0;
  const base = THEMES[themeKey]?.vars ?? {};

  const resolveKey = cssVar => {
    const k = cssVar.replace('--color-', '');
    return k;
  };

  const getValue = key => {
    if (key in customColors) return customColors[key];
    return base[`--color-${key}`] ?? '#000000';
  };

  const setValue = (key, val) => setCustomColors(prev => ({ ...prev, [key]: val }));
  const resetKey = key => setCustomColors(prev => {
    const next = { ...prev };
    delete next[key];
    return next;
  });

  return (
    <div className="fixed inset-0 bg-black/85 z-[250] flex items-end">
      <div className="bg-surface rounded-t-[20px] w-full max-w-[430px] mx-auto p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <span className="font-sans text-[17px] font-extrabold text-text">Settings</span>
          <button onClick={onClose} className="bg-transparent border-none text-muted text-[22px] cursor-pointer">✕</button>
        </div>

        {/* Theme grid */}
        <Lbl>THEME</Lbl>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Object.entries(THEMES).map(([key, t]) => {
            const active = themeKey === key;
            const bg  = t.vars['--color-bg'];
            const acc = t.vars['--color-accent'];
            const txt = t.vars['--color-text'];
            return (
              <button key={key}
                onClick={() => { setThemeKey(key); setCustomColors({}); }}
                className="flex flex-col overflow-hidden rounded-[10px] cursor-pointer border-none p-0"
                style={{
                  outline: active ? `2px solid ${acc}` : '2px solid transparent',
                  outlineOffset: 2,
                }}>
                {/* Swatch preview */}
                <div style={{ background: bg, padding: '10px 8px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {/* mini bars */}
                  <div style={{ height: 5, borderRadius: 3, background: acc, width: '70%' }} />
                  <div style={{ height: 3, borderRadius: 2, background: txt, opacity: 0.5, width: '90%' }} />
                  <div style={{ height: 3, borderRadius: 2, background: txt, opacity: 0.25, width: '60%' }} />
                </div>
                <div style={{
                  background: bg,
                  borderTop: `1px solid ${acc}22`,
                  padding: '4px 6px 6px',
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: active ? acc : txt,
                  opacity: active ? 1 : 0.7,
                  textAlign: 'center',
                }}>
                  {t.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Per-color overrides */}
        <div className="flex justify-between items-center mb-2">
          <Lbl style={{ marginBottom: 0 }}>CUSTOMISE</Lbl>
          {hasCustom && (
            <button onClick={() => setCustomColors({})}
              className="font-mono text-[9px] text-muted bg-transparent border-none cursor-pointer">
              Reset all
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-x-2 gap-y-3 mb-6 px-1">
          {COLOR_FIELDS.map(({ key, label }) => (
            <Picker
              key={key}
              label={label}
              value={getValue(key)}
              onChange={val => setValue(key, val)}
              isCustom={key in customColors}
              onReset={() => resetKey(key)}
            />
          ))}
        </div>

        {/* Grade system */}
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

        {/* Gyms */}
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
