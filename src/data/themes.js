export const THEMES = {
  ember: {
    name: 'Ember',
    dark: true,
    vars: {
      '--color-bg':      '#0a0704',
      '--color-surface': '#130e09',
      '--color-s2':      '#1c1510',
      '--color-border':  '#2a1e12',
      '--color-dim':     '#332416',
      '--color-accent':  '#ff6b35',
      '--color-text':    '#f5ede6',
      '--color-muted':   '#6b4a35',
      '--color-red':     '#f06060',
      '--color-green':   '#4ade80',
      '--color-blue':    '#60a8f8',
      '--color-purple':  '#a78bfa',
    },
  },
  chalk: {
    name: 'Chalk',
    dark: false,
    vars: {
      '--color-bg':      '#f7f4ee',
      '--color-surface': '#fdfcfa',
      '--color-s2':      '#edeae2',
      '--color-border':  '#dcd7cc',
      '--color-dim':     '#cac4b8',
      '--color-accent':  '#e8430a',
      '--color-text':    '#1e1b16',
      '--color-muted':   '#9a8e80',
      '--color-red':     '#dc2626',
      '--color-green':   '#16a34a',
      '--color-blue':    '#2563eb',
      '--color-purple':  '#7c3aed',
    },
  },
  sage: {
    name: 'Sage',
    dark: false,
    vars: {
      '--color-bg':      '#f0f4ee',
      '--color-surface': '#f9fcf8',
      '--color-s2':      '#e3ebe0',
      '--color-border':  '#c8d8c4',
      '--color-dim':     '#b0c4aa',
      '--color-accent':  '#3a7a46',
      '--color-text':    '#182819',
      '--color-muted':   '#5e7a62',
      '--color-red':     '#c0392b',
      '--color-green':   '#27ae60',
      '--color-blue':    '#2980b9',
      '--color-purple':  '#8e44ad',
    },
  },
  frost: {
    name: 'Frost',
    dark: false,
    vars: {
      '--color-bg':      '#f2f5fa',
      '--color-surface': '#ffffff',
      '--color-s2':      '#e6ecf6',
      '--color-border':  '#ccd4e8',
      '--color-dim':     '#b0bcd8',
      '--color-accent':  '#3b6fe8',
      '--color-text':    '#18203c',
      '--color-muted':   '#607098',
      '--color-red':     '#dc2626',
      '--color-green':   '#16a34a',
      '--color-blue':    '#3b6fe8',
      '--color-purple':  '#7c3aed',
    },
  },
  ocean: {
    name: 'Ocean',
    dark: true,
    vars: {
      '--color-bg':      '#04080e',
      '--color-surface': '#08101a',
      '--color-s2':      '#0e1a28',
      '--color-border':  '#162538',
      '--color-dim':     '#1c3048',
      '--color-accent':  '#3ab4e8',
      '--color-text':    '#e0f0ff',
      '--color-muted':   '#467890',
      '--color-red':     '#f06060',
      '--color-green':   '#34d399',
      '--color-blue':    '#60c8f8',
      '--color-purple':  '#a78bfa',
    },
  },
  midnight: {
    name: 'Midnight',
    dark: true,
    vars: {
      '--color-bg':      '#07050f',
      '--color-surface': '#0e0b1c',
      '--color-s2':      '#16122c',
      '--color-border':  '#261d40',
      '--color-dim':     '#322650',
      '--color-accent':  '#9b72ef',
      '--color-text':    '#ede8ff',
      '--color-muted':   '#6652a0',
      '--color-red':     '#f06060',
      '--color-green':   '#4ade80',
      '--color-blue':    '#60a8f8',
      '--color-purple':  '#c4b5fd',
    },
  },
  dusk: {
    name: 'Dusk',
    dark: true,
    vars: {
      '--color-bg':      '#130a10',
      '--color-surface': '#1e1018',
      '--color-s2':      '#291522',
      '--color-border':  '#3d2035',
      '--color-dim':     '#4c2842',
      '--color-accent':  '#f472b6',
      '--color-text':    '#fce8f4',
      '--color-muted':   '#8c5878',
      '--color-red':     '#fb7185',
      '--color-green':   '#4ade80',
      '--color-blue':    '#60a8f8',
      '--color-purple':  '#e879f9',
    },
  },
  sand: {
    name: 'Sand',
    dark: false,
    vars: {
      '--color-bg':      '#f5f0e6',
      '--color-surface': '#faf8f2',
      '--color-s2':      '#ece5d4',
      '--color-border':  '#ddd3be',
      '--color-dim':     '#ccc0a6',
      '--color-accent':  '#b86a18',
      '--color-text':    '#2c1f0e',
      '--color-muted':   '#907858',
      '--color-red':     '#c0392b',
      '--color-green':   '#4a8f52',
      '--color-blue':    '#3478a0',
      '--color-purple':  '#7c3aed',
    },
  },
};

// ── Color math helpers ──────────────────────────────────────────────────────

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0;
  const l = (max+min)/2;
  if (max !== min) {
    const d = max-min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d+2)/6; break;
      case b: h = ((r-g)/d+4)/6; break;
    }
  }
  return [h*360, s*100, l*100];
}

function hslToHex(h, s, l) {
  h/=360; s/=100; l/=100;
  const q = l<0.5 ? l*(1+s) : l+s-l*s;
  const p = 2*l-q;
  const hue2rgb = (t) => {
    if (t<0) t+=1; if (t>1) t-=1;
    if (t<1/6) return p+(q-p)*6*t;
    if (t<1/2) return q;
    if (t<2/3) return p+(q-p)*(2/3-t)*6;
    return p;
  };
  const r = s===0 ? l : hue2rgb(h+1/3);
  const g = s===0 ? l : hue2rgb(h);
  const b = s===0 ? l : hue2rgb(h-1/3);
  return '#'+[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

// Derives surface/s2/border/dim from a custom bg color
function deriveShades(bgHex) {
  const [h, s, l] = hexToHsl(bgHex);
  const dark = l < 40;
  const step = dark ? 1 : -1;
  return {
    surface: hslToHex(h, s,            l + step * 2.5),
    s2:      hslToHex(h, s,            l + step * 5.5),
    border:  hslToHex(h, s * 0.85,     l + step * 11),
    dim:     hslToHex(h, s * 0.75,     l + step * 17),
    outer:   hslToHex(h, s * 1.1,      l - step * 1.5),
  };
}

// ── Apply ───────────────────────────────────────────────────────────────────

export function applyTheme(themeKey, customColors = {}) {
  const theme = THEMES[themeKey] ?? THEMES.ember;
  const vars = { ...theme.vars };

  if (customColors.bg) {
    const sh = deriveShades(customColors.bg);
    vars['--color-bg']      = customColors.bg;
    vars['--color-surface'] = sh.surface;
    vars['--color-s2']      = sh.s2;
    vars['--color-border']  = sh.border;
    vars['--color-dim']     = sh.dim;
  }
  if (customColors.accent) vars['--color-accent'] = customColors.accent;
  if (customColors.text)   vars['--color-text']   = customColors.text;
  if (customColors.muted)  vars['--color-muted']  = customColors.muted;
  if (customColors.green)  vars['--color-green']  = customColors.green;
  if (customColors.blue)   vars['--color-blue']   = customColors.blue;
  if (customColors.purple) vars['--color-purple'] = customColors.purple;
  if (customColors.red)    vars['--color-red']    = customColors.red;

  const root = document.documentElement;
  Object.entries(vars).forEach(([k,v]) => root.style.setProperty(k, v));

  root.style.setProperty('--color-background',             vars['--color-bg']);
  root.style.setProperty('--color-foreground',             vars['--color-text']);
  root.style.setProperty('--color-card',                   vars['--color-surface']);
  root.style.setProperty('--color-card-foreground',        vars['--color-text']);
  root.style.setProperty('--color-popover',                vars['--color-surface']);
  root.style.setProperty('--color-popover-foreground',     vars['--color-text']);
  root.style.setProperty('--color-primary',                vars['--color-accent']);
  root.style.setProperty('--color-primary-foreground',     vars['--color-bg']);
  root.style.setProperty('--color-secondary',              vars['--color-s2']);
  root.style.setProperty('--color-secondary-foreground',   vars['--color-text']);
  root.style.setProperty('--color-muted-bg',               vars['--color-s2']);
  root.style.setProperty('--color-muted-foreground',       vars['--color-muted']);
  root.style.setProperty('--color-destructive',            vars['--color-red']);
  root.style.setProperty('--color-destructive-foreground', vars['--color-text']);
  root.style.setProperty('--color-input',                  vars['--color-border']);
  root.style.setProperty('--color-ring',                   vars['--color-accent']);

  // outer background (visible in margins)
  const [h, s, l] = hexToHsl(vars['--color-bg']);
  const dark = l < 40;
  document.body.style.background = hslToHex(h, s, dark ? Math.max(0, l-2) : Math.min(100, l+4));
}
