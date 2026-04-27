import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { gradeColor, alphaColor } from '../../utils/gradeUtils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const RESULT_COLORS = { sent:'var(--color-green)', working:'var(--color-muted)' };
const RESULT_LABELS = { sent:'✓ Send', working:'Working' };

export default function ProjectLogModal({ project, grades, sessionLog, onLog, onClose, onAbandon, onDelete }) {
  const [attempts, setAttempts] = useState(sessionLog?.attempts ?? 1);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleLog = result => {
    onLog({ attempts, result });
    onClose();
  };

  const gradeCol = gradeColor(project.gi, null);
  const totalAtt = project.history.reduce((a, h) => a + (h.attempts || 0), 0);

  return (
    <Sheet open onOpenChange={open => !open && onClose()}>
      <SheetContent side="bottom"
        className="max-w-[430px] mx-auto rounded-t-[20px] px-6 pb-8 bg-surface border-border [&>button]:hidden">
        <SheetHeader className="mb-5 mt-3 text-left p-0">
          <SheetTitle className="font-sans text-[18px] font-extrabold text-text">Log Project</SheetTitle>
        </SheetHeader>

        {/* Project identity */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-[12px] bg-s2 border border-border">
          <div className="px-2.5 py-1.5 rounded-[8px] font-mono text-[13px] font-bold flex-shrink-0"
            style={{ border:`1px solid ${gradeCol}`, color:gradeCol, background:alphaColor(gradeCol,12) }}>
            {grades[project.gi] ?? `#${project.gi}`}
          </div>
          <div>
            <div className="font-sans text-[15px] font-semibold text-text">{project.name}</div>
            <div className="font-mono text-[10px] text-muted mt-0.5">
              {totalAtt} attempts · {project.history.length} sessions
            </div>
          </div>
        </div>

        {/* Previous log this session */}
        {sessionLog && (
          <div className="mb-5 px-3 py-2 rounded-[8px] border border-border bg-s2 font-mono text-[11px]">
            <span className="text-muted">Earlier this session: </span>
            <span className="text-text">{sessionLog.attempts} att</span>
            <span className="mx-1.5 text-dim">·</span>
            <span style={{ color: RESULT_COLORS[sessionLog.result] }}>{RESULT_LABELS[sessionLog.result]}</span>
          </div>
        )}

        {/* Attempt counter */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-mono text-[12px] text-muted uppercase tracking-wider">Attempts</span>
          <div className="flex items-center gap-4">
            <button onClick={() => setAttempts(a => Math.max(1, a - 1))}
              className="w-10 h-10 rounded-[10px] border border-border bg-s2 text-text font-mono text-[18px] cursor-pointer">
              −
            </button>
            <span className="font-mono text-[28px] font-semibold text-text w-8 text-center">{attempts}</span>
            <button onClick={() => setAttempts(a => a + 1)}
              className="w-10 h-10 rounded-[10px] border border-border bg-s2 text-text font-mono text-[18px] cursor-pointer">
              +
            </button>
          </div>
        </div>

        {/* Result buttons */}
        <div className="flex flex-col gap-2.5">
          <button onClick={() => handleLog('sent')}
            className="w-full py-4 rounded-[12px] font-sans font-extrabold text-[15px] cursor-pointer border-none"
            style={{ background:'var(--color-accent)', color:'var(--color-bg)' }}>
            ✓ SEND
          </button>
          <button onClick={() => handleLog('working')}
            className="w-full py-3.5 rounded-[12px] font-mono text-[13px] cursor-pointer"
            style={{ background:'transparent', color:'var(--color-muted)', border:'1px solid var(--color-border)' }}>
            Still Working
          </button>
        </div>

        {/* Abandon / Delete */}
        {(onAbandon || onDelete) && (
          <div className="flex gap-2 mt-5 pt-4 border-t border-border">
            {onAbandon && (
              <button onClick={() => { onAbandon(project.id); onClose(); }}
                className="flex-1 py-2.5 rounded-[10px] font-mono text-[11px] cursor-pointer"
                style={{ border:'1px solid var(--color-border)', color:'var(--color-muted)', background:'transparent' }}>
                ✗ Abandon
              </button>
            )}
            {onDelete && !confirmDelete && (
              <button onClick={() => setConfirmDelete(true)}
                className="py-2.5 px-3.5 rounded-[10px] font-mono text-[11px] cursor-pointer flex items-center gap-1.5"
                style={{ border:`1px solid color-mix(in srgb, var(--color-red) 40%, transparent)`, color:'var(--color-red)', background:alphaColor('var(--color-red)', 6) }}>
                <Trash2 size={12}/> Delete
              </button>
            )}
            {onDelete && confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted">Sure?</span>
                <button onClick={() => { onDelete(project.id); onClose(); }}
                  className="px-3 py-2 rounded-[8px] font-mono text-[11px] cursor-pointer"
                  style={{ background:'var(--color-red)', color:'#fff', border:'none' }}>Yes</button>
                <button onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2 rounded-[8px] font-mono text-[11px] cursor-pointer border border-border bg-transparent text-muted">No</button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
