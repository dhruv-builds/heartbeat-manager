import { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Feature } from '@/types/heartbeat';
import { FeatureItem } from './FeatureItem';

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
}: FeatureListProps) {
  const [newFeatureTitle, setNewFeatureTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const sortedFeatures = [...features].sort((a, b) => a.order - b.order);
  
  // Split into active and completed tasks
  const activeTasks = sortedFeatures.filter(f => f.status !== 'done');
  const completedTasks = sortedFeatures.filter(f => f.status === 'done');

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sortedFeatures);
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
          className="h-7 text-lavalog hover:text-lavalog hover:bg-lavalog/20"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isAdding && (
          <div className="flex items-center gap-2 p-2 rounded-lg border border-lavalog bg-lavalog/10">
            <Input
              value={newFeatureTitle}
              onChange={(e) => setNewFeatureTitle(e.target.value)}
              placeholder="Feature name..."
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

        {sortedFeatures.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">No features yet</p>
            <Button
              variant="link"
              className="text-lavalog mt-2"
              onClick={() => setIsAdding(true)}
            >
              Add your first feature
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
                  {/* Active Tasks (Backlog, In Progress) */}
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
