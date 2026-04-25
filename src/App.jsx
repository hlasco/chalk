import { useState, useEffect, useRef, useMemo } from "react";
import { uid } from './utils/uid';
import { makeBoulder } from './utils/boulderFactory';
import { gradesFor } from './utils/gradeUtils';
import { EXERCISE_CATEGORIES } from './constants';
import { DEFAULT_GYMS, BUILTIN_EXERCISES } from './data/defaultData';
import { useElapsedMinutes } from './hooks/useElapsedMinutes';
import BottomNav from './components/ui/BottomNav';
import ExerciseEditor from './components/forms/ExerciseEditor';
import GymEditor from './components/forms/GymEditor';
import SessionEditor from './components/forms/SessionEditor';
import SettingsPanel from './components/modals/SettingsPanel';
import EndSessionModal from './components/modals/EndSessionModal';
import NewSessionModal from './components/modals/NewSessionModal';
import HomeTab from './tabs/HomeTab';
import LogTab from './tabs/LogTab';
import HistoryTab from './tabs/HistoryTab';
import LibraryTab from './tabs/LibraryTab';

export default function App() {
  const [sessions,  setSessions]  = useState([]);
  const [gyms,      setGyms]      = useState(DEFAULT_GYMS);
  const [exercises, setExercises] = useState(BUILTIN_EXERCISES);
  const [gradeSystem, setGradeSystem] = useState("Font");

  const [activeId, setActiveId] = useState(null);
  const [tab,      setTab]      = useState("home");
  const [logTab,   setLogTab]   = useState("boulder");

  const [newGoal, setNewGoal] = useState("Free session");

  const [showNew,     setShowNew]   = useState(false);
  const [newGymId,    setNewGymId]  = useState(gyms[0]?.id ?? null);
  const [addingGym,   setAddingGym]= useState(false);
  const [gymName,     setGymName]  = useState("");
  const [showEnd,     setShowEnd]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingGym,   setEditingGym] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editingEx,    setEditingEx] = useState(null);

  const [selGi, setSelGi] = useState(4);
  const [selStyles, setSelStyles] = useState([]);
  const [selPerc, setSelPerc] = useState(1);
  const [selResult, setSelResult] = useState("send");
  const [selAttempts, setSelAttempts] = useState(1);
  const [useColors, setUseColors] = useState(false);

  const grades = gradesFor(gradeSystem);
  const active = sessions.find(s=>s.id===activeId);
  const activeGym = active ? gyms.find(g=>g.id===active.gymId) : null;
  const elapsedMin = useElapsedMinutes(active?.startedAt);

  const startSession = () => {
    if (!newGymId) return;
    const now = Date.now();
    const s = {id:uid(),gymId:newGymId,goal:newGoal,date:new Date().toISOString().slice(0,10),ended:false,startedAt:now,durationMin:null,boulders:[],training:[]};
    setSessions(p=>[s,...p]);
    setActiveId(s.id);
    setShowNew(false);
    setAddingGym(false);
    setTab("log");
  };

  const quickAddGym = () => {
    if (!gymName.trim()) return;
    const g = {id:`gym_${uid()}`,name:gymName.trim(),ranges:[]};
    setGyms(p=>[...p,g]);
    setNewGymId(g.id);
    setGymName("");
    setAddingGym(false);
  };

  const endSession = () => {
    setSessions(p=>p.map(s=>{
      if (s.id!==activeId) return s;
      const dur = s.startedAt ? Math.max(1, Math.round((Date.now()-s.startedAt)/60000)) : (s.durationMin||null);
      return {...s,ended:true,durationMin:dur};
    }));
    setActiveId(null);
    setShowEnd(false);
    setTab("history");
  };

  const logBoulder = () => {
    if (!activeId) return;
    const b = makeBoulder({
      gi: selGi,
      styles: selStyles,
      sent: selResult === "send",
      attempts: selAttempts,
      perceived: selPerc,
    });
    setSessions(p=>p.map(s=>s.id===activeId?{...s,boulders:[...s.boulders, b]}:s));
    setSelStyles([]);
    setSelAttempts(1);
    setSelResult("send");
  };

  const logBoulderBatch = (boulders) => {
    if (!activeId || !boulders?.length) return;
    setSessions(p=>p.map(s=>s.id===activeId?{...s,boulders:[...s.boulders,...boulders]}:s));
  };

  const deleteLiveBoulder = id => {
    setSessions(p=>p.map(s=>s.id===activeId?{...s,boulders:s.boulders.filter(b=>b.id!==id)}:s));
  };

  const deleteLiveTraining = id => {
    setSessions(p=>p.map(s=>s.id===activeId?{...s,training:s.training.filter(t=>t.id!==id)}:s));
  };

  const logTraining = entry => {
    if (!activeId) return;
    setSessions(p=>p.map(s=>s.id===activeId?{...s,training:[...s.training,entry]}:s));
  };

  const saveEdited = updated => {
    setSessions(p=>p.map(s=>s.id===updated.id?updated:s));
    setEditingSession(null);
  };
  const deleteSession = id => {
    setSessions(p=>p.filter(s=>s.id!==id));
    if (activeId === id) setActiveId(null);
    setEditingSession(null);
  };

  const saveGym = updated => {
    setGyms(p=>p.some(g=>g.id===updated.id)?p.map(g=>g.id===updated.id?updated:g):[...p,updated]);
    setEditingGym(null);
  };
  const deleteGym = id => {
    setGyms(p=>p.filter(g=>g.id!==id));
    setEditingGym(null);
  };

  const saveExercise = updated => {
    setExercises(p=>p.some(e=>e.id===updated.id)?p.map(e=>e.id===updated.id?updated:e):[...p,updated]);
    setEditingEx(null);
  };

  useEffect(() => {
    if (activeGym?.ranges?.length) setUseColors(true);
  }, [activeGym?.id]); // eslint-disable-line

  const gymHasRanges = !!activeGym?.ranges?.length;

  const exercisesByCategory = useMemo(()=>{
    const grouped = {};
    EXERCISE_CATEGORIES.forEach(c=>grouped[c]=[]);
    exercises.forEach(e=>{
      const c = e.category||"Custom";
      if (!grouped[c]) grouped[c] = [];
      grouped[c].push(e);
    });
    return grouped;
  },[exercises]);

  return (
    <>
      {showSettings && (
        <SettingsPanel
          gradeSystem={gradeSystem} setGradeSystem={setGradeSystem}
          gyms={gyms}
          onEditGym={setEditingGym}
          onNewGym={()=>setEditingGym({id:"",name:"",ranges:[]})}
          onClose={()=>setShowSettings(false)}
        />
      )}

      {editingGym && (
        <GymEditor
          gym={editingGym.id?editingGym:{...editingGym,id:`gym_${uid()}`}}
          gradeSystem={gradeSystem}
          onSave={saveGym}
          onDelete={editingGym.id?deleteGym:null}
          onCancel={()=>setEditingGym(null)}
        />
      )}

      {editingSession && (
        <SessionEditor
          session={editingSession}
          gyms={gyms} exercises={exercises}
          gradeSystem={gradeSystem}
          onSave={saveEdited} onDelete={deleteSession}
          onClose={()=>setEditingSession(null)}
        />
      )}

      {editingEx && (
        <ExerciseEditor
          exercise={editingEx}
          onSave={saveExercise}
          onCancel={()=>setEditingEx(null)}
        />
      )}

      {showEnd && (
        <EndSessionModal
          active={active}
          elapsedMin={elapsedMin}
          onConfirm={endSession}
          onCancel={()=>setShowEnd(false)}
        />
      )}

      {showNew && (
        <NewSessionModal
          gyms={gyms}
          newGymId={newGymId} setNewGymId={setNewGymId}
          newGoal={newGoal} setNewGoal={setNewGoal}
          addingGym={addingGym} setAddingGym={setAddingGym}
          gymName={gymName} setGymName={setGymName}
          onQuickAddGym={quickAddGym}
          onStart={startSession}
          onCancel={()=>{setShowNew(false);setAddingGym(false);}}
        />
      )}

      <div className="bg-bg min-h-screen max-w-[430px] mx-auto flex flex-col pb-[72px]">

        {/* Header */}
        <div className="px-5 pt-6 pb-4 flex justify-between items-center border-b border-border">
          <div>
            <div className="font-sans text-[28px] font-extrabold text-text tracking-[-1px] leading-none">CHALK</div>
            <div className="font-mono text-[10px] text-muted tracking-[3px] mt-1">CLIMBING LOG</div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={()=>setGradeSystem(gradeSystem==="V-Scale"?"Font":"V-Scale")}
              className="bg-surface border border-border rounded-[10px] text-text font-mono font-medium px-3 py-2 cursor-pointer tracking-[1px] flex flex-col items-center leading-tight">
              <span className="text-[9px] text-muted">SYSTEM</span>
              <span className="text-accent text-[11px] mt-[2px]">{gradeSystem}</span>
            </button>
            <button onClick={()=>setShowSettings(true)}
              className="bg-surface border border-border rounded-[10px] text-muted w-[42px] h-[42px] cursor-pointer text-[18px]">
              ⚙
            </button>
            <button onClick={()=>setShowNew(true)}
              className="bg-accent text-bg border-none rounded-[10px] font-sans text-[18px] font-bold w-[42px] h-[42px] cursor-pointer">
              +
            </button>
          </div>
        </div>

        {tab==="home" && (
          <HomeTab
            sessions={sessions} exercises={exercises} gyms={gyms}
            gradeSystem={gradeSystem} grades={grades}
          />
        )}

        {tab==="log" && (
          <LogTab
            activeId={activeId} sessions={sessions} active={active}
            activeGym={activeGym} gradeSystem={gradeSystem} grades={grades}
            elapsedMin={elapsedMin} exercises={exercises} setExercises={setExercises}
            onLogBoulders={logBoulderBatch}
            logTab={logTab} setLogTab={setLogTab}
            selGi={selGi} setSelGi={setSelGi}
            selStyles={selStyles} setSelStyles={setSelStyles}
            selPerc={selPerc} setSelPerc={setSelPerc}
            selResult={selResult} setSelResult={setSelResult}
            selAttempts={selAttempts} setSelAttempts={setSelAttempts}
            useColors={useColors} setUseColors={setUseColors}
            gymHasRanges={gymHasRanges}
            logBoulder={logBoulder} logTraining={logTraining}
            deleteLiveBoulder={deleteLiveBoulder} deleteLiveTraining={deleteLiveTraining}
            setShowNew={setShowNew} setTab={setTab} setShowEnd={setShowEnd}
          />
        )}

        {tab==="history" && (
          <HistoryTab
            sessions={sessions} gyms={gyms} grades={grades}
            activeId={activeId} setActiveId={setActiveId}
            setTab={setTab} setEditingSession={setEditingSession}
          />
        )}

        {tab==="library" && (
          <LibraryTab
            exercises={exercises} setExercises={setExercises}
            exercisesByCategory={exercisesByCategory}
            setEditingEx={setEditingEx}
          />
        )}

        <BottomNav tab={tab} setTab={setTab} hasActive={!!activeId} elapsedMin={elapsedMin} />

      </div>
    </>
  );
}
