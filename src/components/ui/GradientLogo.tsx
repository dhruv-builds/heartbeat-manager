import { cn } from '@/lib/utils';

interface GradientLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  bare?: boolean;
}

export function GradientLogo({ className, size = 'md', showText = true, bare = false }: GradientLogoProps) {
  const sizes = {
    sm: { icon: 20, container: 'w-8 h-8', text: 'text-lg', tagline: 'text-sm leading-tight font-medium' },
    md: { icon: 28, container: 'w-12 h-12', text: 'text-2xl', tagline: 'text-sm leading-tight font-medium' },
    lg: { icon: 40, container: 'w-16 h-16', text: 'text-3xl', tagline: 'text-base leading-tight font-medium' },
    xl: { icon: 56, container: 'w-24 h-24', text: 'text-4xl', tagline: 'text-lg leading-tight font-medium' },
  };

  const bareSizes = {
    sm: 30,
    md: 42,
    lg: 60,
    xl: 84,
  };

  const config = sizes[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {bare ? (
        <img
          src="/app-logo.png"
          alt="LovaLog"
          className="object-contain"
          style={{ width: bareSizes[size], height: bareSizes[size] }}
        />
      ) : (
        <div className={cn(
          'gradient-brand rounded-xl flex items-center justify-center shadow-lg',
          config.container
        )}>
          <img
            src="/app-logo.png"
            alt="LovaLog"
            className="object-contain"
            style={{ width: config.icon, height: config.icon }}
          />
        </div>
      )}
      
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
