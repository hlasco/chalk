export const DEFAULT_GYMS = [
  { id:"gym_bloc", name:"Minimum",
    ranges:[
      { name:"Yellow", color:"#f5e030", minGi:0,  maxGi:3  },
      { name:"Green",  color:"#4ade80", minGi:4,  maxGi:6  },
      { name:"Orange", color:"#ff6a00", minGi:7,  maxGi:9  },
      { name:"Blue",   color:"#3b82f6", minGi:10, maxGi:12 },
      { name:"Red",    color:"#f87171", minGi:13, maxGi:15 },
      { name:"White",  color:"#fcfcfc", minGi:16, maxGi:18 },
      { name:"Black",  color:"#374151", minGi:19, maxGi:24 },
    ],
  },
];

export const BUILTIN_EXERCISES = [
  // Strength
  { id:"ex_hang",    name:"Hangboard Repeaters", builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:"",default:4},{key:"reps",label:"Reps/Set",unit:"",default:6},{key:"hangSec",label:"Hang",unit:"s",default:7},{key:"restSec",label:"Rep Rest",unit:"s",default:3},{key:"edgeMm",label:"Edge",unit:"mm"},{key:"weightKg",label:"Weight",unit:"kg"}] },
  { id:"ex_maxhang", name:"Max Hang",            builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:"",default:5},{key:"hangSec",label:"Hang",unit:"s",default:10},{key:"edgeMm",label:"Edge",unit:"mm"},{key:"weightKg",label:"Weight",unit:"kg"}] },
  { id:"ex_pullup",  name:"Weighted Pull-up",    builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:"",default:4},{key:"reps",label:"Reps",unit:"",default:5},{key:"weightKg",label:"Weight",unit:"kg"}] },
  { id:"ex_pushup",  name:"Push-ups",            builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:"",default:3},{key:"reps",label:"Reps",unit:"",default:20}] },
  { id:"ex_lock",    name:"Lock-off",            builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:"",default:3},{key:"holdSec",label:"Hold",unit:"s",default:5},{key:"weightKg",label:"Weight",unit:"kg"}] },
  { id:"ex_core",    name:"Core",                builtin:true, category:"Strength",
    fields:[{key:"sets",label:"Sets",unit:"",default:3},{key:"holdSec",label:"Hold",unit:"s",default:30}] },

  // Power
  { id:"ex_campus",  name:"Campus Ladders",      builtin:true, category:"Power",
    fields:[{key:"sets",label:"Sets",unit:"",default:5},{key:"reps",label:"Reps",unit:"",default:5}] },
  { id:"ex_limit",   name:"Limit Bouldering",    builtin:true, category:"Power",
    detailMode:"attempts",
    fields:[{key:"problems",label:"Problems",unit:"",default:5},{key:"targetGi",label:"Target Grade",unit:"idx"}] },

  // On-the-wall
  { id:"ex_4x4",     name:"4×4",                 builtin:true, category:"On-the-wall",
    fields:[{key:"sets",label:"Sets",unit:"",default:4},{key:"climbs",label:"Climbs/Set",unit:"",default:4},{key:"targetGi",label:"Target Grade",unit:"idx"}] },
  { id:"ex_arc",     name:"ARC / Traverse",      builtin:true, category:"On-the-wall",
    fields:[{key:"durationMin",label:"Duration",unit:"min",default:20},{key:"intensity",label:"Intensity",unit:"/10",default:4}] },
  { id:"ex_linkups", name:"Link-ups",             builtin:true, category:"On-the-wall",
    fields:[{key:"sets",label:"Sets",unit:"",default:4},{key:"problems",label:"Problems/Set",unit:"",default:4}] },

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
