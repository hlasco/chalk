import { SESSION_GOALS } from '../../constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import Lbl from '../ui/Lbl';

export default function NewSessionModal({
  gyms, newGymId, setNewGymId,
  newGoal, setNewGoal,
  addingGym, setAddingGym,
  gymName, setGymName,
  onQuickAddGym, onStart, onCancel,
}) {
  return (
    <Sheet open onOpenChange={open => !open && onCancel()}>
      <SheetContent side="bottom" className="max-w-[430px] mx-auto rounded-t-[20px] px-6 pb-8 max-h-[85vh] overflow-y-auto bg-surface border-border [&>button]:hidden">
        <SheetHeader className="mb-6 mt-2 text-left p-0">
          <SheetTitle className="font-sans text-[20px] font-extrabold text-text">New Session</SheetTitle>
        </SheetHeader>

        <Lbl>SESSION GOAL</Lbl>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {SESSION_GOALS.map(g => (
            <button key={g} onClick={() => setNewGoal(g)}
              className={cn(
                'px-3 py-3 rounded-[10px] text-left font-mono text-[12px] border cursor-pointer transition-colors',
                newGoal === g
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-s2 text-muted hover:border-border/80'
              )}>
              {g}
            </button>
          ))}
        </div>

        <Lbl>WHERE ARE YOU?</Lbl>
        <div className="flex flex-col gap-2.5 mb-4">
          {gyms.map(g => (
            <button key={g.id} onClick={() => setNewGymId(g.id)}
              className={cn(
                'flex items-center justify-between px-4 py-3.5 rounded-[12px] cursor-pointer transition-colors border',
                newGymId === g.id
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-s2 hover:border-border/80'
              )}>
              <div className="text-left">
                <div className={cn('font-sans text-[14px] font-semibold', newGymId === g.id ? 'text-accent' : 'text-text')}>{g.name}</div>
                {g.ranges?.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {g.ranges.map((r, i) => (<div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />))}
                  </div>
                )}
              </div>
              {newGymId === g.id && <span className="font-mono text-[16px] text-accent">✓</span>}
            </button>
          ))}
        </div>

        {addingGym ? (
          <div className="flex gap-2 mb-5">
            <Input
              autoFocus value={gymName} onChange={e => setGymName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onQuickAddGym(); if (e.key === 'Escape') setAddingGym(false); }}
              placeholder="New gym name…"
              className="flex-1 bg-s2 border-border text-text placeholder:text-muted focus-visible:ring-accent"
            />
            <Button onClick={onQuickAddGym} size="sm" className="bg-accent text-bg hover:bg-accent/90">Add</Button>
            <Button onClick={() => setAddingGym(false)} variant="outline" size="sm" className="border-border text-muted">✕</Button>
          </div>
        ) : (
          <button onClick={() => setAddingGym(true)}
            className="w-full py-3 rounded-[10px] border border-dashed border-border bg-transparent text-muted font-mono text-[11px] cursor-pointer mb-5 hover:border-muted transition-colors">
            + New gym
          </button>
        )}

        <div className="flex gap-3 mt-2">
          <Button onClick={onCancel} variant="outline" className="flex-1 border-border text-muted font-mono">
            Cancel
          </Button>
          <Button onClick={onStart} className="flex-[2] bg-accent text-bg hover:bg-accent/90 font-sans font-extrabold text-[14px]">
            Start at {gyms.find(g => g.id === newGymId)?.name}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
