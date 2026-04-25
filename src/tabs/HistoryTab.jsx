import { gradeColor } from '../utils/gradeUtils';
import { fmtDuration } from '../utils/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Empty from '../components/ui/Empty';

export default function HistoryTab({ sessions, gyms, grades, activeId, setActiveId, setTab, setEditingSession }) {
  if (!sessions.length) return <div className="flex-1 overflow-y-auto p-6"><Empty>No sessions yet</Empty></div>;

  return (
    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
      {sessions.map(s => {
        const gym     = gyms.find(g => g.id === s.gymId);
        const sends   = s.boulders.filter(b => b.sends > 0);
        const maxGi   = sends.length ? Math.max(...sends.map(b => b.gi)) : null;
        const topCol  = maxGi != null ? gradeColor(maxGi, null) : null;
        const topTierCol = maxGi != null ? gradeColor(maxGi, gym) : null;
        const topLbl  = maxGi != null ? (grades[maxGi] ?? maxGi) : null;
        const isLive  = s.id === activeId;

        return (
          <Card key={s.id} className="bg-surface"
            style={{ borderColor: isLive ? 'var(--color-accent)' : 'var(--color-border)' }}>
            <CardContent className="p-5">

              {/* Top row: gym + badges */}
              <div className="flex justify-between items-start gap-3 mb-4">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => { if (!s.ended) { setActiveId(s.id); setTab('log'); } }}
                >
                  <div className="font-sans text-[16px] font-bold text-text">{gym?.name ?? s.gymId}</div>
                  <div className="font-mono text-[11px] text-muted mt-1">
                    {s.date}
                    {s.durationMin ? ` · ${fmtDuration(s.durationMin)}` : ''}
                    {s.goal ? ` · ${s.goal}` : ''}
                  </div>
                </div>
                <div className="flex gap-2 items-center flex-shrink-0">
                  {topLbl != null && (
                    <div className="flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-full"
                      style={{ color: topCol, background: `${topCol}18`, border: `1px solid ${topCol}40` }}>
                      {gym?.ranges?.length && topTierCol && (
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: topTierCol }} />
                      )}
                      TOP {topLbl}
                    </div>
                  )}
                  {isLive && (
                    <div className="font-mono text-[11px] text-accent">● LIVE</div>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="flex gap-6 mb-4">
                <div>
                  <div className="font-mono text-[22px] text-accent font-medium leading-none">{sends.length}</div>
                  <div className="font-mono text-[10px] text-muted mt-1">SENDS</div>
                </div>
                <div>
                  <div className="font-mono text-[22px] text-text font-light leading-none">
                    {s.boulders.reduce((a, b) => a + b.attempts, 0)}
                  </div>
                  <div className="font-mono text-[10px] text-muted mt-1">ATTEMPTS</div>
                </div>
                {s.training.length > 0 && (
                  <div>
                    <div className="font-mono text-[22px] text-blue font-light leading-none">{s.training.length}</div>
                    <div className="font-mono text-[10px] text-muted mt-1">TRAINING</div>
                  </div>
                )}
              </div>

              {/* Edit button */}
              <Button variant="outline" size="sm"
                className="w-full border-border text-muted font-mono text-[11px] h-9"
                onClick={() => setEditingSession(s)}>
                Edit session
              </Button>

            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
