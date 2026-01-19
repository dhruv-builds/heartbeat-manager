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
  onSelect: () => void;
  onStatusChange: (status: Feature['status']) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onInject: () => void;
  isCompact?: boolean;
}

export function FeatureItem({
  feature,
  index,
  isSelected,
  onSelect,
  onStatusChange,
  onDuplicate,
  onDelete,
  onInject,
  isCompact = false,
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
            'group flex items-center gap-2 p-3 rounded-lg border transition-all',
            'hover:border-heartbeat/50',
            isSelected
              ? 'border-heartbeat bg-heartbeat/10'
              : 'border-border bg-card',
            snapshot.isDragging && 'shadow-lg'
          )}
          onClick={onSelect}
        >
          <div
            {...provided.dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate text-foreground">
                {feature.title}
              </span>
              <StatusBadge status={feature.status} onClick={handleStatusClick} />
            </div>
            {!isCompact && feature.prompt && (
              <p className="text-sm text-muted-foreground truncate mt-1">
                {feature.prompt.slice(0, 60)}
                {feature.prompt.length > 60 ? '...' : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-heartbeat hover:text-heartbeat hover:bg-heartbeat/20"
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
      )}
    </Draggable>
  );
}
