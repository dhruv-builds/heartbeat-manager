import { Badge } from '@/components/ui/badge';
import { FeatureStatus } from '@/types/heartbeat';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: FeatureStatus;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

const statusConfig: Record<FeatureStatus, { label: string; className: string }> = {
  'backlog': {
    label: 'Backlog',
    className: 'bg-muted text-muted-foreground hover:bg-muted/80',
  },
  'in-progress': {
    label: 'Next',
    className: 'bg-lavalog/20 text-lavalog hover:bg-lavalog/30',
  },
  'done': {
    label: 'Done',
    className: 'bg-green-500/20 text-green-400 hover:bg-green-500/30',
  },
};

export function StatusBadge({ status, onClick, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="secondary"
      className={cn(
        'cursor-pointer transition-colors text-xs',
        config.className,
        className
      )}
      onClick={onClick}
    >
      {config.label}
    </Badge>
  );
}

export function getNextStatus(current: FeatureStatus): FeatureStatus {
  const order: FeatureStatus[] = ['backlog', 'in-progress', 'done'];
  const currentIndex = order.indexOf(current);
  return order[(currentIndex + 1) % order.length];
}
