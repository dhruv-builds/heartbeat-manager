import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Plus, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Feature } from '@/types/heartbeat';
import { FeatureItem } from './FeatureItem';
import {
  getActiveFeatures,
  getCompletedFeatures,
  sortActiveFeatures,
  sortCompletedFeatures,
} from '@/lib/featureSorting';

interface FeatureListProps {
  features: Feature[];
  selectedFeatureId: string | null;
  onSelectFeature: (featureId: string) => void;
  onCreateFeature: (title: string) => void;
  onUpdateFeature: (featureId: string, updates: Partial<Feature>) => void;
  onDeleteFeature: (featureId: string) => void;
  onDuplicateFeature: (featureId: string) => void;
  onReorderFeatures: (features: Feature[]) => void;
  onInjectPrompt: (featureId: string) => void;
  isCompact?: boolean;
  isExtension?: boolean;
  hasContext?: boolean;
  onOpenContext?: () => void;
}

export function FeatureList({
  features,
  selectedFeatureId,
  onSelectFeature,
  onCreateFeature,
  onUpdateFeature,
  onDeleteFeature,
  onDuplicateFeature,
  onReorderFeatures,
  onInjectPrompt,
  isCompact = false,
  isExtension = false,
  hasContext = true,
  onOpenContext,
}: FeatureListProps) {
  const [newFeatureTitle, setNewFeatureTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [contextNudgeDismissed, setContextNudgeDismissed] = useState(false);

  // Memoized sorted arrays using shared utilities
  const activeTasks = useMemo(
    () => sortActiveFeatures(getActiveFeatures(features)),
    [features]
  );

  const completedTasks = useMemo(
    () => sortCompletedFeatures(getCompletedFeatures(features)),
    [features]
  );

  // Combined list for drag-drop (active first, then completed)
  const allSortedFeatures = useMemo(
    () => [...activeTasks, ...completedTasks],
    [activeTasks, completedTasks]
  );

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(allSortedFeatures);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorderFeatures(items);
  };

  const handleAddFeature = () => {
    if (newFeatureTitle.trim()) {
      onCreateFeature(newFeatureTitle.trim());
      setNewFeatureTitle('');
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Features
        </h2>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-brand-purple hover:text-brand-purple hover:bg-brand-purple/20"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Context Nudge Banner */}
        {!hasContext && !contextNudgeDismissed && (
          <button
            onClick={onOpenContext}
            className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-left group hover:bg-amber-500/15 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs text-amber-200/80 flex-1">
              0% Context. Add your Tech Stack/Vision to get smarter AI prompts.
            </span>
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); setContextNudgeDismissed(true); }}
              className="shrink-0 p-0.5 rounded hover:bg-amber-500/20"
            >
              <X className="w-3 h-3 text-amber-500/60" />
            </span>
          </button>
        )}

        {isAdding && (
          <div className="flex items-center gap-2 p-2 rounded-lg border border-brand-purple bg-brand-purple/10">
            <Input
              value={newFeatureTitle}
              onChange={(e) => setNewFeatureTitle(e.target.value)}
              placeholder="What do you want to build?"
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddFeature();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewFeatureTitle('');
                }
              }}
            />
            <Button size="sm" onClick={handleAddFeature} className="h-8">
              Add
            </Button>
          </div>
        )}

        {features.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <h3 className="text-base font-semibold text-foreground">Let's build something new.</h3>
            <p className="text-sm text-muted-foreground">Add your first feature to start the flow.</p>
            <Button
              className="bg-brand-purple hover:bg-brand-purple/90 text-white"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Feature
            </Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="features">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {/* Active Tasks (Next, Backlog) */}
                  {activeTasks.map((feature, index) => (
                    <FeatureItem
                      key={feature.id}
                      feature={feature}
                      index={index}
                      isSelected={feature.id === selectedFeatureId}
                      onSelect={() => onSelectFeature(feature.id)}
                      onStatusChange={(status) =>
                        onUpdateFeature(feature.id, { status })
                      }
                      onDuplicate={() => onDuplicateFeature(feature.id)}
                      onDelete={() => onDeleteFeature(feature.id)}
                      onInject={() => onInjectPrompt(feature.id)}
                      showInjectButton={isExtension}
                    />
                  ))}

                  {/* Completed Section Divider */}
                  {completedTasks.length > 0 && (
                    <>
                      <div className="border-t border-dashed border-muted-foreground/30 my-4" />
                      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 pb-2">
                        Completed
                      </h3>
                    </>
                  )}

                  {/* Completed Tasks (Done) */}
                  {completedTasks.map((feature, index) => (
                    <FeatureItem
                      key={feature.id}
                      feature={feature}
                      index={activeTasks.length + index}
                      isSelected={feature.id === selectedFeatureId}
                      isCompleted
                      onSelect={() => onSelectFeature(feature.id)}
                      onStatusChange={(status) =>
                        onUpdateFeature(feature.id, { status })
                      }
                      onDuplicate={() => onDuplicateFeature(feature.id)}
                      onDelete={() => onDeleteFeature(feature.id)}
                      onInject={() => onInjectPrompt(feature.id)}
                      showInjectButton={isExtension}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
