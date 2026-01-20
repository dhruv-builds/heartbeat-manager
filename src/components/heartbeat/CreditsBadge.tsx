import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCredits } from '@/hooks/useCredits';

export function CreditsBadge() {
  const { credits, isLoading, error, fetchCredits } = useCredits();
  
  const status = error 
    ? 'unknown' 
    : credits.freeCreditsAvailable === true 
      ? 'available' 
      : credits.freeCreditsAvailable === false 
        ? 'none' 
        : 'unknown';

  const handleClick = () => {
    if (status === 'unknown' || !isLoading) {
      fetchCredits();
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
        status === 'available' && "bg-green-500/10 border-green-500/30 text-green-400",
        status === 'none' && "bg-red-500/10 border-red-500/30 text-red-400",
        status === 'unknown' && "bg-muted border-muted-foreground/30 text-muted-foreground cursor-pointer hover:bg-muted/80"
      )}
      onClick={status === 'unknown' ? handleClick : undefined}
      role={status === 'unknown' ? 'button' : undefined}
    >
      {/* Status dot */}
      <span 
        className={cn(
          "w-2 h-2 rounded-full flex-shrink-0",
          status === 'available' && "bg-green-500",
          status === 'none' && "bg-red-500",
          status === 'unknown' && "border border-muted-foreground bg-transparent"
        )} 
      />
      
      {/* Label */}
      <span className="whitespace-nowrap">
        {status === 'available' && "Free Credits"}
        {status === 'none' && "No Free Credits"}
        {status === 'unknown' && "Check Status"}
      </span>
      
      {/* Refresh button - only show when not unknown (unknown is already clickable) */}
      {status !== 'unknown' && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-4 w-4 p-0 hover:bg-transparent" 
          onClick={(e) => {
            e.stopPropagation();
            fetchCredits();
          }}
          disabled={isLoading}
        >
          <RefreshCw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
        </Button>
      )}
      
      {/* Loading spinner for unknown state */}
      {status === 'unknown' && isLoading && (
        <RefreshCw className="w-3 h-3 animate-spin" />
      )}
    </div>
  );
}