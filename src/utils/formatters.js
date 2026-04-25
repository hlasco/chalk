export const fmtDuration = min => {
  if (!min && min !== 0) return "—";
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
};
