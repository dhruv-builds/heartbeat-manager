import { Download, Upload, Plus, MoreVertical, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';

interface HeaderProps {
  onExport: () => void;
  onImport: (json: string) => void;
  onNewProject: () => void;
  onSync?: () => Promise<void>;
  isSyncing?: boolean;
}

export function Header({ onExport, onImport, onNewProject, onSync, isSyncing }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { signOut, user } = useAuth();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onImport(content);
      };
      reader.readAsText(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleRefresh = async () => {
    if (onSync) {
      await onSync();
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        <img 
          src="./app-logo.png" 
          alt="LovaLog" 
          className="w-6 h-6 object-contain"
        />
        <div>
          <h1 className="text-base font-bold text-foreground">LovaLog</h1>
          <p className="text-[10px] text-muted-foreground -mt-0.5">Lovable Backlog Manager</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Sync Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isSyncing}
          className="h-8 w-8"
          title="Sync with Lovable"
        >
          <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
        </Button>

        {/* New Project Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onNewProject}
          className="h-8 w-8"
          title="New Project"
        >
          <Plus className="w-4 h-4" />
        </Button>

        {/* Import/Export/Logout Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
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
            {user && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </>
            )}
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
