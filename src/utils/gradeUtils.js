export const V_GRADES = ["VB","V0","V1","V2","V3","V4","V5","V6","V7","V8","V9","V10","V11","V12","V13","V14","V15","V16","V17"];
export const FONT_GRADES = ["3","3+","4","4+","5","5+","6A","6A+","6B","6B+","6C","6C+","7A","7A+","7B","7B+","7C","7C+","8A","8A+","8B","8B+","8C","8C+","9A"];

export const DEFAULT_GRADE_COLORS = [
  "#6be87a","#6be87a","#9fef68","#d4f542","#f5d420","#f5a020","#f06828",
  "#e83838","#e038a0","#b038e8","#8b5cf6","#6366f1","#3b82f6","#0ea5e9",
  "#06b6d4","#10b981","#34d399","#6ee7b7","#fbbf24","#fb923c","#f87171",
  "#ec4899","#d946ef","#a855f7","#7c3aed",
];

export const gradesFor = system => (system === "Font" ? FONT_GRADES : V_GRADES);

// Maps V-Scale grade index (0=VB … 18=V17) → Font grade index
export const V_TO_FONT = [0, 2, 4, 5, 6, 8, 10, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
// Maps Font grade index (0=3 … 24=9A) → V-Scale grade index
export const FONT_TO_V = [0, 0, 1, 1, 2, 3, 4, 4, 5, 5, 6, 6, 7, 8, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export const convertGradeIdx = (gi, fromSystem, toSystem) => {
  if (fromSystem === toSystem) return gi;
  if (fromSystem === 'V-Scale' && toSystem === 'Font') return V_TO_FONT[gi] ?? null;
  if (fromSystem === 'Font'    && toSystem === 'V-Scale') return FONT_TO_V[gi] ?? null;
  return null;
};

export const gradeColor = (gi, gym) => {
  if (gym?.ranges?.length) {
    const r = gym.ranges.find(r => gi >= r.minGi && gi <= r.maxGi);
    if (r) return r.color;
  }
  return DEFAULT_GRADE_COLORS[gi] ?? "#888";
};

export const gradeTierName = (gi, gym) => {
  if (!gym?.ranges?.length) return null;
  return gym.ranges.find(r => gi >= r.minGi && gi <= r.maxGi)?.name || null;
};
