export function makeBeep(freq, dur = 0.09, vol = 0.42) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur + 0.05);
  } catch(e) {}
}

export function buildTimerConfig(exId, values, ex) {
  const sets       = Math.max(1, +values.sets   || 1);
  const setRestSec = +values.restBetweenSetsSec >= 0 ? +values.restBetweenSetsSec : 120;

  const timed = (workLabel, workSec, repsPerSet=1, shortRestSec=0, extra={}) =>
    ({ sets, repsPerSet, workLabel, workSec:Math.max(1,workSec), shortRestSec:Math.max(0,shortRestSec), setRestSec, ...extra });
  const tap = (workLabel, repsPerSet=1, shortRestSec=0, extra={}) =>
    ({ sets, repsPerSet, workLabel, workSec:null, shortRestSec:Math.max(0,shortRestSec), setRestSec, ...extra });

  // Custom config overrides built-in logic
  if (ex?.timerCfg) {
    if (ex.timerCfg.type === "off") return null;
    if (ex.timerCfg.type === "tap") return tap(ex.timerCfg.label || "GO");
    if (ex.timerCfg.type === "timed") {
      const dur = ex.timerCfg.durationKey ? (+values[ex.timerCfg.durationKey] || 30) : 30;
      return timed(ex.timerCfg.label || "GO", dur);
    }
  }

  if (exId==="ex_hang")    return timed("HANG",  +values.hangSec||7,  Math.max(1,+values.reps||1), +values.restSec||3,  {edgeMm:+values.edgeMm||null, weightKg:+values.weightKg||0});
  if (exId==="ex_maxhang") return timed("HANG",  +values.hangSec||10, 1, 0, {edgeMm:+values.edgeMm||null, weightKg:+values.weightKg||0});
  if (exId==="ex_lock")    return timed("HOLD",  +values.holdSec||10, 1, 0, {weightKg:+values.weightKg||0});
  if (exId==="ex_core")    return timed("HOLD",  +values.holdSec||30);
  if (exId==="ex_arc")     return {...timed("TRAVERSE", (+values.durationMin||20)*60), sets:1, setRestSec:0};
  if (exId==="ex_pullup")  return tap(`${+values.reps||"?"}× PULL-UPS`, 1, 0, {weightKg:+values.weightKg||0});
  if (exId==="ex_pushup")  return tap(`${+values.reps||"?"}× PUSH-UPS`);
  if (exId==="ex_campus")  return tap("CAMPUS",  Math.max(1,+values.reps||1), 10);
  if (exId==="ex_4x4")     return tap("SET",     1, 0, {logPerSet:true, climbsPerSet:Math.max(1,+values.climbs||4), targetGi:+values.targetGi||4});
  if (exId==="ex_linkups") return tap("SET",     1, 0, {logPerSet:true, climbsPerSet:Math.max(1,+values.problems||1), targetGi:4});
  if (exId==="ex_limit")   return {...tap("PROBLEM", 1, 30, {logPerSet:true, climbsPerSet:1, targetGi:4}), sets:Math.max(1,+values.problems||3)};
  if (exId==="ex_silent")  return {...tap("PROBLEM", Math.max(1,+values.problems||1), 10), sets:1, setRestSec:0};
  const durField = ex?.fields?.find(f => f.unit==="s" && values[f.key]);
  if (durField) return timed("GO", +values[durField.key]);
  return null;
}
