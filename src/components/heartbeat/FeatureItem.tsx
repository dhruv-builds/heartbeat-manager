import { Draggable } from '@hello-pangea/dnd';
import { GripVertical, Copy, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Feature } from '@/types/heartbeat';
import { StatusBadge, getNextStatus } from './StatusBadge';
import { cn } from '@/lib/utils';

interface FeatureItemProps {
  feature: Feature;
  index: number;
  isSelected: boolean;
  isCompleted?: boolean;
  onSelect: () => void;
  onStatusChange: (status: Feature['status']) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onInject: () => void;
}

export function FeatureItem({
  feature,
  index,
  isSelected,
  isCompleted = false,
  onSelect,
  onStatusChange,
  onDuplicate,
  onDelete,
  onInject,
}: FeatureItemProps) {
  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStatusChange(getNextStatus(feature.status));
  };

  return (
    <Draggable draggableId={feature.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            'group p-3 rounded-lg border transition-all',
            'hover:border-lavalog/50',
            isSelected
              ? 'border-lavalog bg-lavalog/10'
              : 'border-border bg-card',
            snapshot.isDragging && 'shadow-lg',
            isCompleted && 'opacity-60'
          )}
          onClick={onSelect}
        >
          {/* Row 1: Drag handle + Full Title */}
          <div className="flex items-start gap-2">
            <div
              {...provided.dragHandleProps}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-0.5"
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <h3 className={cn(
              "flex-1 font-semibold text-foreground break-words text-left",
              isCompleted && "line-through"
            )}>
              {feature.title}
            </h3>
          </div>

          {/* Row 2: Prompt preview + Badge + Actions */}
          <div className="flex items-center justify-between mt-2 ml-6">
            {/* Left: Prompt preview */}
            <p className={cn(
              "flex-1 text-sm text-muted-foreground truncate mr-3 text-left",
              isCompleted && "line-through"
            )}>
              {feature.prompt?.slice(0, 60) || 'No prompt yet'}
              {feature.prompt && feature.prompt.length > 60 ? '...' : ''}
            </p>

            {/* Right: Badge + Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={feature.status} onClick={handleStatusClick} />
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-lavalog hover:text-lavalog hover:bg-lavalog/20"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onInject();
                  }}
                  title="Inject Prompt"
                  disabled={!feature.prompt}
                >
                  <Zap className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                  title="Duplicate"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
