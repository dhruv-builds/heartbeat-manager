import { Download, Upload, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRef } from 'react';
import { useCredits, formatRelativeTime } from '@/hooks/useCredits';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onExport: () => void;
  onImport: (json: string) => void;
  onNewProject: () => void;
}

export function Header({ onExport, onImport, onNewProject }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { credits, isLoading, error, fetchCredits } = useCredits();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onImport(content);
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        <img src="/app-logo.png" alt="Heartbeat" className="w-8 h-8" />
        <h1 className="text-lg font-bold text-foreground">Heartbeat</h1>
      </div>

      {/* Credits Widget */}
      <div className="flex items-center gap-2">
        {error ? (
          <span className="text-xs text-muted-foreground">Credits: --</span>
        ) : (
          <>
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded',
                credits.dailyCreditsAvailable
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              Daily: {credits.dailyCreditsAvailable ? '✓' : '–'}
            </span>
            <span className="text-sm text-foreground">
              Total: {credits.totalCreditsRemaining?.toFixed(1) ?? '--'}
            </span>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={fetchCredits}
          disabled={isLoading}
          title="Refresh credits"
        >
          <RefreshCw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
        </Button>
        {credits.lastUpdated && (
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(credits.lastUpdated)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewProject}
          title="New Project"
        >
          <Plus className="w-4 h-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Import/Export">
              <Download className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </header>
  );
}
