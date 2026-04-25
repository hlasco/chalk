import { Drawer } from 'vaul';
import { Plus, Check } from 'lucide-react';
import { WIDGET_REGISTRY, WIDGET_CATEGORIES } from './registry';
import { cn } from '../lib/utils';

export default function AddWidgetSheet({ open, onClose, activeWidgetIds, onAdd }) {
  return (
    <Drawer.Root open={open} onOpenChange={v => !v && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/70 z-[200]" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-[201] flex flex-col"
          style={{ maxHeight: '82vh' }}
        >
          <div className="bg-surface rounded-t-[20px] border-t border-border flex flex-col overflow-hidden" style={{ maxHeight: '82vh' }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="px-5 pb-4 shrink-0">
              <div className="font-sans text-[17px] font-extrabold text-text">Add Widget</div>
              <div className="font-mono text-[10px] text-muted mt-0.5">Pick a chart or card to add to your dashboard</div>
            </div>

            {/* Widget list — scrollable */}
            <div className="overflow-y-auto px-5 pb-8">
              {WIDGET_CATEGORIES.map(cat => {
                const items = Object.values(WIDGET_REGISTRY).filter(w => w.category === cat);
                if (!items.length) return null;
                return (
                  <div key={cat} className="mb-5">
                    <div className="font-mono text-[9px] text-accent tracking-[3px] mb-2.5">{cat.toUpperCase()}</div>
                    <div className="flex flex-col gap-2">
                      {items.map(w => {
                        const isActive = activeWidgetIds.includes(w.id);
                        const isSingletonAdded = w.singleton && isActive;
                        return (
                          <button
                            key={w.id}
                            onClick={() => !isSingletonAdded && onAdd(w.id)}
                            disabled={isSingletonAdded}
                            className={cn(
                              'flex items-center gap-3.5 w-full text-left px-3.5 py-3 rounded-[10px] border cursor-pointer transition-colors',
                              isSingletonAdded
                                ? 'border-border bg-s2 opacity-50 cursor-not-allowed'
                                : 'border-border bg-s2 hover:border-accent'
                            )}
                          >
                            <span className="text-[20px] w-7 text-center shrink-0">{w.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-sans text-[13px] font-semibold text-text">{w.label}</div>
                              <div className="font-mono text-[10px] text-muted mt-0.5">{w.description}</div>
                            </div>
                            {isSingletonAdded ? (
                              <Check size={14} className="text-green shrink-0" />
                            ) : (
                              <Plus size={14} className="text-muted shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
