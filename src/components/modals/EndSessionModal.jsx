import { fmtDuration } from '../../utils/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EndSessionModal({ active, elapsedMin, onConfirm, onCancel }) {
  const sends    = active?.boulders.filter(b => b.sends > 0).length ?? 0;
  const attempts = active?.boulders.reduce((a, b) => a + b.attempts, 0) ?? 0;
  const training = active?.training.length ?? 0;

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center px-6">
      <Card className="w-full max-w-[320px] bg-surface border-border text-center">
        <CardHeader className="pb-3">
          <CardTitle className="text-[18px] font-sans font-extrabold text-text">End session?</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { label: 'SENDS',    value: sends    },
              { label: 'ATTEMPTS', value: attempts },
              { label: 'TRAINING', value: training },
              { label: 'TIME',     value: fmtDuration(elapsedMin) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-s2 rounded-[8px] py-2.5 px-1">
                <div className="font-mono text-[13px] font-medium text-text">{value}</div>
                <div className="font-mono text-[8px] text-muted tracking-[1px] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2.5">
            <Button onClick={onCancel} variant="outline" className="flex-1 border-border text-muted font-mono">
              Keep going
            </Button>
            <Button onClick={onConfirm} className="flex-1 bg-red hover:bg-red/90 text-white font-sans font-bold">
              End
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
