import { Home, Activity, Clock, BookOpen } from 'lucide-react';
import { fmtDuration } from '../../utils/formatters';

const TABS = [
  { id: 'home',    label: 'Home',    Icon: Home     },
  { id: 'log',     label: 'Log',     Icon: Activity },
  { id: 'history', label: 'History', Icon: Clock    },
  { id: 'library', label: 'Library', Icon: BookOpen },
];

export default function BottomNav({ tab, setTab, hasActive, elapsedMin }) {
  return (
    <div className="fixed bottom-0 left-6 right-6 sm:left-auto sm:right-auto max-w-[430px] sm:mx-auto z-10" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          const isLog  = id === 'log';
          const color  = active ? 'var(--color-accent)' : 'var(--color-muted)';
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 cursor-pointer"
            >
              <div className="relative">
                <Icon size={22} style={{ color, transition: 'color 0.15s' }} />
                {isLog && hasActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: 'var(--color-accent)', boxShadow: '0 0 0 2px var(--color-surface)' }} />
                )}
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.5px',
                color, transition: 'color 0.15s', whiteSpace: 'nowrap',
              }}>
                {isLog && hasActive ? fmtDuration(elapsedMin) : label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
