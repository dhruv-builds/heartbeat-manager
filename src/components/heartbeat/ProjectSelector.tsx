import { useState } from 'react';
import { ChevronDown, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Project } from '@/types/heartbeat';
import { cn } from '@/lib/utils';

interface InlineAction {
  type: 'load' | 'link';
  onAction: () => void;
  disabled?: boolean;
}

interface ProjectSelectorProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onDeleteProject: (projectId: string) => void;
  inlineAction?: InlineAction | null;
}

export function ProjectSelector({
  projects,
  activeProject,
  onSelectProject,
  onRenameProject,
  onDeleteProject,
  inlineAction,
}: ProjectSelectorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(project.id);
    setEditValue(project.name);
  };

  const saveEdit = (projectId: string) => {
    if (editValue.trim()) {
      onRenameProject(projectId, editValue.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex-1 min-w-0 justify-between bg-background hover:bg-muted"
            >
              <span className="truncate">
                {activeProject?.name || 'Select Project'}
              </span>
              <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[calc(100vw-2rem)] max-w-[300px]" align="start">
          {projects.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No projects yet. Create one!
            </div>
          ) : (
            projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                className={cn(
                  'flex items-center justify-between group',
                  project.id === activeProject?.id && 'bg-muted'
                )}
                onSelect={() => {
                  if (editingId !== project.id) {
                    onSelectProject(project.id);
                  }
                }}
              >
                {editingId === project.id ? (
                  <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(project.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => saveEdit(project.id)}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={cancelEdit}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="truncate">{project.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => startEditing(project, e)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteProject(project.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuItem>
            ))
          )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {inlineAction && (
          <Button
            size="sm"
            variant={inlineAction.type === 'load' ? 'default' : 'secondary'}
            className="shrink-0 h-9 px-3 font-medium"
            onClick={inlineAction.onAction}
            disabled={inlineAction.disabled}
            title={inlineAction.type === 'load' 
              ? 'Load selected project in this tab' 
              : 'Link selected project to this Lovable tab'}
          >
            {inlineAction.type === 'load' ? 'Load' : 'Link'}
          </Button>
        )}
      </div>
    </div>
  );
}
