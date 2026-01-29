import { ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GradientLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function GradientLogo({ className, size = 'md', showText = true }: GradientLogoProps) {
  const sizes = {
    sm: { icon: 20, container: 'w-8 h-8', text: 'text-lg', tagline: 'text-[10px]' },
    md: { icon: 28, container: 'w-12 h-12', text: 'text-2xl', tagline: 'text-xs' },
    lg: { icon: 40, container: 'w-16 h-16', text: 'text-3xl', tagline: 'text-xs' },
    xl: { icon: 56, container: 'w-24 h-24', text: 'text-4xl', tagline: 'text-sm' },
  };

  const config = sizes[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Icon container with gradient background */}
      <div className={cn(
        'gradient-brand rounded-xl flex items-center justify-center shadow-lg',
        config.container
      )}>
        <ClipboardCheck 
          size={config.icon} 
          className="text-white" 
          strokeWidth={2.5}
        />
      </div>
      
      {showText && (
        <div>
          <h1 className={cn('font-bold text-foreground', config.text)}>
            LovaLog
          </h1>
          <p className={cn('text-muted-foreground', config.tagline)}>
            Lovable Backlog Manager
          </p>
        </div>
      )}
    </div>
  );
}
