import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart } from 'lucide-react';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (name: string) => void;
  suggestedName?: string | null;
}

export function NewProjectDialog({
  open,
  onOpenChange,
  onCreateProject,
  suggestedName,
}: NewProjectDialogProps) {
  const [name, setName] = useState(suggestedName || '');

  const handleCreate = () => {
    if (name.trim()) {
      onCreateProject(name.trim());
      setName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-heartbeat fill-heartbeat" />
            {suggestedName ? 'Start Heartbeat' : 'New Project'}
          </DialogTitle>
          <DialogDescription>
            {suggestedName
              ? `We detected you're working on "${suggestedName}". Start tracking features for this project?`
              : 'Create a new project to start managing your feature backlog.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-heartbeat hover:bg-heartbeat/90 text-white"
          >
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
