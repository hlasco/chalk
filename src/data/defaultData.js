export const DEFAULT_GYMS = [
  { id:"gym_arch", name:"The Arch", ranges:[] },
  { id:"gym_home", name:"Home Board", ranges:[] },
  { id:"gym_bloc", name:"Bloc Shop",
    ranges:[
      { name:"Yellow", color:"#f5e030", minGi:0,  maxGi:2  },
      { name:"Green",  color:"#4ade80", minGi:3,  maxGi:4  },
      { name:"Blue",   color:"#60a5fa", minGi:5,  maxGi:6  },
      { name:"Red",    color:"#f87171", minGi:7,  maxGi:8  },
      { name:"Purple", color:"#c084fc", minGi:9,  maxGi:10 },
      { name:"Black",  color:"#e5e5e5", minGi:11, maxGi:14 },
    ],
  },
];

export const BUILTIN_EXERCISES = [
  // Strength
  { id:"ex_hang",    name:"Hangboard Repeaters", builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"reps",label:"Reps/Set",unit:""},{key:"hangSec",label:"Hang",unit:"s"},{key:"restSec",label:"Rep Rest",unit:"s"},{key:"edgeMm",label:"Edge",unit:"mm"},{key:"weightKg",label:"Weight",unit:"kg"}] },
  { id:"ex_maxhang", name:"Max Hang",            builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"hangSec",label:"Hang",unit:"s"},{key:"edgeMm",label:"Edge",unit:"mm"},{key:"weightKg",label:"Weight",unit:"kg"}] },
  { id:"ex_pullup",  name:"Weighted Pull-up",    builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"reps",label:"Reps",unit:""},{key:"weightKg",label:"Weight",unit:"kg"}] },
  { id:"ex_pushup",  name:"Push-ups",            builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"reps",label:"Reps",unit:""}] },
  { id:"ex_lock",    name:"Lock-off",            builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"holdSec",label:"Hold",unit:"s"},{key:"weightKg",label:"Weight",unit:"kg"}] },
  { id:"ex_core",    name:"Core",                builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"holdSec",label:"Hold",unit:"s"}] },

  // Power
  { id:"ex_campus",  name:"Campus Ladders",      builtin:true, category:"Power",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"reps",label:"Reps",unit:""}] },
  { id:"ex_limit",   name:"Limit Bouldering",    builtin:true, category:"Power",
    fields:[{key:"problems",label:"Problems",unit:""},{key:"attempts",label:"Attempts",unit:""}] },

  // On-the-wall
  { id:"ex_4x4",     name:"4×4",                 builtin:true, category:"On-the-wall",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"climbs",label:"Climbs/Set",unit:""},{key:"targetGi",label:"Target Grade",unit:"idx"}] },
  { id:"ex_arc",     name:"ARC / Traverse",      builtin:true, category:"On-the-wall",
    fields:[{key:"durationMin",label:"Duration",unit:"min"},{key:"intensity",label:"Intensity",unit:"/10"}] },
  { id:"ex_linkups", name:"Link-ups",             builtin:true, category:"On-the-wall",
    fields:[{key:"sets",label:"Sets",unit:""},{key:"problems",label:"Problems/Set",unit:""}] },

  // Endurance
  { id:"ex_laps",    name:"Route Laps",           builtin:true, category:"Endurance",
    fields:[{key:"laps",label:"Laps",unit:""},{key:"gradeGi",label:"Grade",unit:"idx"}] },

  // Mobility
  { id:"ex_stretch", name:"Stretching",           builtin:true, category:"Mobility",
    fields:[{key:"durationMin",label:"Duration",unit:"min"}] },

  // Technique
  { id:"ex_silent",  name:"Silent Feet",          builtin:true, category:"Technique",
    fields:[{key:"durationMin",label:"Duration",unit:"min"},{key:"problems",label:"Problems",unit:""}] },
];
