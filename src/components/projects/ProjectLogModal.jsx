import { useState } from 'react';
import { gradeColor } from '../../utils/gradeUtils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const RESULT_COLORS = { flashed:'var(--color-accent)', sent:'var(--color-green)', working:'var(--color-muted)' };
const RESULT_LABELS = { flashed:'⚡ Flash', sent:'✓ Send', working:'Working' };

export default function ProjectLogModal({ project, grades, sessionLog, onLog, onClose }) {
  const [attempts, setAttempts] = useState(sessionLog?.attempts ?? 1);

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
            style={{ border:`1px solid ${gradeCol}`, color:gradeCol, background:`${gradeCol}18` }}>
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
          <button onClick={() => handleLog('flashed')}
            className="w-full py-4 rounded-[12px] font-sans font-extrabold text-[15px] cursor-pointer border-none"
            style={{ background:'var(--color-accent)', color:'var(--color-bg)' }}>
            ⚡ FLASH
          </button>
          <button onClick={() => handleLog('sent')}
            className="w-full py-3.5 rounded-[12px] font-sans font-bold text-[14px] cursor-pointer border-none"
            style={{ background:'color-mix(in srgb,var(--color-green) 12%,transparent)', color:'var(--color-green)', border:'1px solid var(--color-green)' }}>
            ✓ Send
          </button>
          <button onClick={() => handleLog('working')}
            className="w-full py-3.5 rounded-[12px] font-mono text-[13px] cursor-pointer"
            style={{ background:'transparent', color:'var(--color-muted)', border:'1px solid var(--color-border)' }}>
            Still Working
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
