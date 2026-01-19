import { Download, Upload, Plus, RefreshCw, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRef } from 'react';
import { useCredits } from '@/hooks/useCredits';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onExport: () => void;
  onImport: (json: string) => void;
  onNewProject: () => void;
  onSync?: () => Promise<void>;
  isSyncing?: boolean;
}

export function Header({ onExport, onImport, onNewProject, onSync, isSyncing }: HeaderProps) {
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

  const handleRefresh = async () => {
    fetchCredits();
    if (onSync) {
      await onSync();
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        <img src="/app-logo.png" alt="Heartbeat" className="w-8 h-8" />
        <h1 className="text-lg font-bold text-foreground">Heartbeat</h1>
      </div>

      {/* Simplified Credits Badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              error || credits.freeCreditsAvailable === null
                ? 'bg-muted-foreground'
                : credits.freeCreditsAvailable
                ? 'bg-green-500'
                : 'bg-red-500'
            )}
          />
          <span className="text-xs font-medium text-foreground">Free Credits</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleRefresh}
          disabled={isLoading || isSyncing}
          title="Sync project & credits"
        >
          <RefreshCcw className={cn('w-3.5 h-3.5', (isLoading || isSyncing) && 'animate-spin')} />
        </Button>
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
