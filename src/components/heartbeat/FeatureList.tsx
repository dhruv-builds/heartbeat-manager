import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Plus, X, AlertTriangle, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Feature } from '@/types/heartbeat';
import { FeatureItem } from './FeatureItem';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  getActiveFeatures,
  getCompletedFeatures,
  sortActiveFeatures,
  sortCompletedFeatures,
} from '@/lib/featureSorting';
import { cn } from '@/lib/utils';

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
  projectId?: string;
  onCreateMergedFeature?: (data: {
    title: string;
    prompt: string;
    status: string;
    image_url?: string | null;
  }) => Promise<Feature | null>;
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
  projectId,
  onCreateMergedFeature,
}: FeatureListProps) {
  const [newFeatureTitle, setNewFeatureTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [contextNudgeDismissed, setContextNudgeDismissed] = useState(false);

  // Merge mode state
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  // Memoized sorted arrays using shared utilities
  const activeTasks = useMemo(
    () => sortActiveFeatures(getActiveFeatures(features)),
    [features]
  );

  const completedTasks = useMemo(
    () => sortCompletedFeatures(getCompletedFeatures(features)),
    [features]
  );

  // backlogCount removed – merge button is now always visible

  // Combined list for drag-drop (active first, then completed)
  const allSortedFeatures = useMemo(
    () => [...activeTasks, ...completedTasks],
    [activeTasks, completedTasks]
  );

  const exitMergeMode = () => {
    setMergeMode(false);
    setSelectedForMerge([]);
  };

  const toggleMergeSelection = (featureId: string) => {
    setSelectedForMerge(prev => {
      if (prev.includes(featureId)) return prev.filter(id => id !== featureId);
      if (prev.length >= 3) return prev;
      return [...prev, featureId];
    });
  };

  const handleMerge = async () => {
    if (selectedForMerge.length < 2 || !projectId || !onCreateMergedFeature) return;
    setIsMerging(true);

    const selectedFeatures = features.filter(f => selectedForMerge.includes(f.id));
    // Store for undo
    const oldFeatures = [...selectedFeatures];

    try {
      const { data, error } = await supabase.functions.invoke('merge-features', {
        body: {
          features: selectedFeatures.map(f => ({
            id: f.id,
            title: f.title,
            prompt: f.prompt,
            status: f.status,
          })),
        },
      });

      if (error) throw error;

      const { title, prompt, status } = data;
      const firstImage = selectedFeatures[0]?.image_url || null;

      const newFeature = await onCreateMergedFeature({
        title,
        prompt,
        status,
        image_url: firstImage,
      });

      if (newFeature) {
        for (const id of selectedForMerge) {
          onDeleteFeature(id);
        }

        exitMergeMode();

        toast({
          title: 'Tasks merged!',
          description: `${selectedForMerge.length} tasks → "${title}"`,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  // Delete the merged feature
                  onDeleteFeature(newFeature.id);
                  // Re-insert old features as new rows
                  for (const old of oldFeatures) {
                    await (supabase as any)
                      .from('features')
                      .insert({
                        project_id: projectId,
                        title: old.title,
                        status: old.status,
                        prompt: old.prompt,
                        image_url: old.image_url || null,
                        order: old.order,
                      });
                  }
                  // Trigger a refetch by creating and immediately removing a dummy — 
                  // or just reload. For MVP, window location doesn't change so we can
                  // just call location.reload() but that's heavy. Instead we'll just toast.
                  toast({ title: 'Merge undone', description: 'Original tasks restored. Refresh to see them.' });
                } catch {
                  toast({ title: 'Undo failed', variant: 'destructive' });
                }
              }}
            >
              Undo
            </Button>
          ),
        });
      }
    } catch (err) {
      console.error('Merge failed:', err);
      toast({
        title: 'Merge failed',
        description: 'Could not merge tasks. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMerging(false);
    }
  };

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

  const readyToMerge = selectedForMerge.length >= 2;

  return (
    <div className="flex flex-col h-full">
      {/* Transparent overlay for click-outside cancellation */}
      {mergeMode && (
        <div
          className="fixed inset-0 z-30 bg-transparent"
          onClick={exitMergeMode}
        />
      )}

      <div className="flex items-center justify-between px-4 py-2 border-b border-border relative z-40">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Features
        </h2>
        <div className="flex items-center gap-1">
          {/* Merge button */}
          {(
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    {mergeMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={exitMergeMode}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={readyToMerge ? 'default' : 'ghost'}
                      className={cn(
                        'h-7',
                        !mergeMode && 'text-muted-foreground hover:text-foreground',
                        readyToMerge && 'bg-brand-purple hover:bg-brand-purple/90 text-white animate-pulse ring-2 ring-brand-purple/50 ring-offset-1 ring-offset-background',
                      )}
                      onClick={() => {
                        if (!mergeMode) {
                          setMergeMode(true);
                        } else if (readyToMerge) {
                          handleMerge();
                        }
                      }}
                      disabled={isMerging}
                    >
                      <Layers className="w-4 h-4" />
                      {(readyToMerge || isMerging) && (
                        <span className="ml-1 text-xs">
                          {isMerging ? 'Merging...' : 'Merge'}
                        </span>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!mergeMode && (
                  <TooltipContent>Merge Tasks</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
          {/* Add button */}
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
                      mergeMode={mergeMode}
                      mergeSelected={selectedForMerge.includes(feature.id)}
                      mergeDisabled={!selectedForMerge.includes(feature.id) && selectedForMerge.length >= 3}
                      onMergeToggle={() => toggleMergeSelection(feature.id)}
                      isMerged={feature.is_merged}
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

                  {/* Completed Tasks (Done) — no merge checkboxes */}
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
                      mergeMode={false}
                      isMerged={feature.is_merged}
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
