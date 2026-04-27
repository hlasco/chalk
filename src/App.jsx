import { useState, useEffect, useRef, useMemo } from "react";
import { uid } from './utils/uid';
import { makeBoulder } from './utils/boulderFactory';
import { gradesFor } from './utils/gradeUtils';
import { EXERCISE_CATEGORIES } from './constants';
import { DEFAULT_GYMS, BUILTIN_EXERCISES } from './data/defaultData';
import { applyTheme } from './data/themes';
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

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

export default function App() {
  const [sessions,  setSessions]  = useState(() => load('chalk_sessions', []));
  const [gyms,      setGyms]      = useState(() => load('chalk_gyms', DEFAULT_GYMS));
  const [exercises, setExercises] = useState(() => load('chalk_exercises', BUILTIN_EXERCISES));
  const [gradeSystem, setGradeSystem] = useState(() => load('chalk_gradeSystem', 'Font'));

  const [activeId, setActiveId] = useState(() => load('chalk_activeId', null));
  const [projects, setProjects] = useState(() => load('chalk_projects', []));
  const [themeKey,     setThemeKey]     = useState(() => load('chalk_themeKey', 'sand'));
  const [customColors, setCustomColors] = useState(() => load('chalk_customColors', {}));

  useEffect(() => { localStorage.setItem('chalk_sessions',     JSON.stringify(sessions));     }, [sessions]);
  useEffect(() => { localStorage.setItem('chalk_gyms',         JSON.stringify(gyms));         }, [gyms]);
  useEffect(() => { localStorage.setItem('chalk_exercises',    JSON.stringify(exercises));    }, [exercises]);
  useEffect(() => { localStorage.setItem('chalk_gradeSystem',  JSON.stringify(gradeSystem));  }, [gradeSystem]);
  useEffect(() => { localStorage.setItem('chalk_activeId',     JSON.stringify(activeId));     }, [activeId]);
  useEffect(() => { localStorage.setItem('chalk_projects',     JSON.stringify(projects));     }, [projects]);
  useEffect(() => { localStorage.setItem('chalk_themeKey',     JSON.stringify(themeKey));     }, [themeKey]);
  useEffect(() => { localStorage.setItem('chalk_customColors', JSON.stringify(customColors)); }, [customColors]);
  useEffect(() => { applyTheme(themeKey, customColors); }, [themeKey, customColors]);
  const [tab,      setTab]      = useState("home");
  const [logTab,   setLogTab]   = useState("boulder");

  const [newGoal, setNewGoal] = useState("Free session");

  const [showNew,     setShowNew]   = useState(false);
  const [newGymId,    setNewGymId]  = useState(gyms[0]?.id ?? null);
  const [returnToNew, setReturnToNew] = useState(false);
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
    setTab("log");
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
    const isFlash = selResult === 'flash';
    const b = makeBoulder({
      gi: selGi,
      styles: selStyles,
      sent: selResult === 'send' || isFlash,
      attempts: isFlash ? 1 : selAttempts,
      perceived: selPerc,
    });
    setSessions(p=>p.map(s=>s.id===activeId?{...s,boulders:[...s.boulders, b]}:s));
    setSelStyles([]);
    setSelAttempts(1);
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
    const isNew = !gyms.some(g => g.id === updated.id);
    setGyms(p=>p.some(g=>g.id===updated.id)?p.map(g=>g.id===updated.id?updated:g):[...p,updated]);
    if (isNew && returnToNew) {
      setNewGymId(updated.id);
      setShowNew(true);
      setReturnToNew(false);
    }
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

  const addProject = p => setProjects(prev => [...prev, p]);
  const deleteProject = id => setProjects(prev => prev.filter(p => p.id !== id));
  const abandonProject = id => setProjects(prev => prev.map(p =>
    p.id !== id ? p : { ...p, history: [...p.history, { date: new Date().toISOString().slice(0,10), attempts: 0, result: 'abandoned' }] }
  ));
  const logProjectAttempt = ({ projectId, sessionId, date, attempts, result }) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const idx = p.history.findIndex(h => h.sessionId === sessionId);
      const entry = { sessionId, date, attempts, result };
      const history = idx >= 0 ? p.history.map((h,i) => i===idx ? entry : h) : [...p.history, entry];
      return { ...p, history };
    }));
    // Mirror to session boulders so project attempts count in stats
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const boulder = {
        ...makeBoulder({ gi: project.gi, sent: result === 'sent', attempts }),
        source: 'project', projectId,
      };
      const rest = s.boulders.filter(b => !(b.source === 'project' && b.projectId === projectId));
      return { ...s, boulders: [...rest, boulder] };
    }));
  };

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
          onNewGym={()=>setEditingGym({id:`gym_${uid()}`,name:"",ranges:[]})}
          onClose={()=>setShowSettings(false)}
          themeKey={themeKey} setThemeKey={setThemeKey}
          customColors={customColors} setCustomColors={setCustomColors}
        />
      )}

      {editingGym && (
        <GymEditor
          gym={editingGym.id?editingGym:{...editingGym,id:`gym_${uid()}`}}
          gradeSystem={gradeSystem}
          onSave={saveGym}
          onDelete={editingGym.id?deleteGym:null}
          onCancel={()=>{ if (returnToNew) { setShowNew(true); setReturnToNew(false); } setEditingGym(null); }}
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
          onNewGym={()=>{ setShowNew(false); setReturnToNew(true); setEditingGym({id:`gym_${uid()}`,name:"",ranges:[]}); }}
          onStart={startSession}
          onCancel={()=>setShowNew(false)}
        />
      )}

      <div className="bg-bg max-w-[430px] mx-6 sm:mx-auto flex flex-col border-x border-border" style={{ height: '100dvh', paddingBottom: '72px' }}>

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
            projects={projects}
            onAddProject={addProject} onLogProject={logProjectAttempt} onDeleteProject={deleteProject} onAbandonProject={abandonProject}
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
