import { Home, Activity, Clock, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmtDuration } from '../../utils/formatters';

const TABS = [
  { id: 'home',    label: 'Home',    Icon: Home     },
  { id: 'log',     label: 'Log',     Icon: Activity },
  { id: 'history', label: 'History', Icon: Clock    },
  { id: 'library', label: 'Library', Icon: BookOpen },
];

export default function BottomNav({ tab, setTab, hasActive, elapsedMin }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-bg/95 backdrop-blur border-t border-border z-10">
      <div className="flex">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          const isLog  = id === 'log';
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 cursor-pointer"
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={cn(
                    'transition-colors',
                    active ? 'text-accent' : 'text-muted'
                  )}
                />
                {isLog && hasActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent ring-2 ring-bg" />
                )}
              </div>
              <span className={cn(
                'font-mono text-[10px] tracking-[0.5px] transition-colors',
                active ? 'text-accent' : 'text-muted'
              )}>
                {isLog && hasActive ? fmtDuration(elapsedMin) : label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
