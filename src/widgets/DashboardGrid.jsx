import { useState } from 'react';
import { Settings2, ChevronUp, ChevronDown, X, Plus, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WIDGET_REGISTRY } from './registry';
import AddWidgetSheet from './AddWidgetSheet';

// Props that every widget receives from the grid
function resolveWidgetProps({ widgetId, config }, ctx) {
  return { ...ctx, config, widgetId };
}

export default function DashboardGrid({ widgets, onAdd, onRemove, onMoveUp, onMoveDown, onReset, ctx }) {
  const [editMode, setEditMode] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-3">
        <div className="font-mono text-[9px] text-muted tracking-[3px]">
          {editMode ? 'DRAG TO REORDER · SWIPE TO REMOVE' : 'DASHBOARD'}
        </div>
        <div className="flex gap-1.5 items-center">
          {editMode && (
            <Button variant="outline" size="sm" className="h-7 border-border text-muted font-mono text-[10px] gap-1"
              onClick={onReset}>
              <RotateCcw size={11} /> Reset
            </Button>
          )}
          <Button variant={editMode ? 'default' : 'outline'} size="sm"
            className={cn('h-7 font-mono text-[10px] gap-1.5', editMode ? 'bg-accent text-bg hover:bg-accent/90' : 'border-border text-muted')}
            onClick={() => setEditMode(p => !p)}>
            <Settings2 size={11} />
            {editMode ? 'Done' : 'Edit'}
          </Button>
        </div>
      </div>

      {/* Widget list */}
      <div className="flex flex-col gap-4">
        {widgets.map((w, idx) => {
          const def = WIDGET_REGISTRY[w.widgetId];
          if (!def) return null;
          const Widget = def.component;

          return (
            <Card key={w.uid} className={cn(
              'bg-surface border-border transition-colors',
              editMode && 'border-border/50'
            )}>
              <CardHeader className="pb-3 px-5 pt-5 flex-row items-center justify-between space-y-0">
                <span className="font-mono text-[10px] text-muted tracking-[2px] uppercase">
                  {def.label}
                </span>
                {editMode && (
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 border-border bg-s2 text-muted"
                      onClick={() => onMoveUp(w.uid)} disabled={idx === 0}>
                      <ChevronUp size={13} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7 border-border bg-s2 text-muted"
                      onClick={() => onMoveDown(w.uid)} disabled={idx === widgets.length - 1}>
                      <ChevronDown size={13} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7 text-red border-red/30 bg-red/8"
                      onClick={() => onRemove(w.uid)}>
                      <X size={13} />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <Widget {...resolveWidgetProps(w, ctx)} />
              </CardContent>
            </Card>
          );
        })}

        {/* Add widget button — always visible in edit mode, subtle otherwise */}
        {editMode && (
          <Button variant="outline" className="w-full h-14 border-dashed border-border text-muted font-mono text-[11px] gap-2 hover:border-accent hover:text-accent"
            onClick={() => setAddOpen(true)}>
            <Plus size={15} /> Add widget
          </Button>
        )}
      </div>

      <AddWidgetSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        activeWidgetIds={widgets.map(w => w.widgetId)}
        onAdd={(widgetId) => { onAdd(widgetId); setAddOpen(false); }}
      />
    </>
  );
}
