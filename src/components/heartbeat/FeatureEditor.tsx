import { useState, useEffect } from 'react';
import { Zap, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Feature } from '@/types/heartbeat';
import { StatusBadge, getNextStatus } from './StatusBadge';

interface FeatureEditorProps {
  feature: Feature | null;
  onUpdate: (updates: Partial<Feature>) => void;
  onInject: () => void;
}

export function FeatureEditor({ feature, onUpdate, onInject }: FeatureEditorProps) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (feature) {
      setTitle(feature.title);
      setPrompt(feature.prompt);
      setHasChanges(false);
    }
  }, [feature?.id]);

  if (!feature) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Select a feature to edit its Prompt</p>
          <p className="text-sm mt-2">
            The Prompt is the spec you'll inject into Lovable
          </p>
        </div>
      </div>
    );
  }

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setHasChanges(true);
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate({ title, prompt });
    setHasChanges(false);
  };

  const handleStatusClick = () => {
    onUpdate({ status: getNextStatus(feature.status) });
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-lg font-semibold flex-1"
          placeholder="Feature title"
        />
        <StatusBadge status={feature.status} onClick={handleStatusClick} />
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <label className="text-sm font-medium text-muted-foreground mb-2">
          Prompt
        </label>
        <Textarea
          value={prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          placeholder="Write your detailed prompt here...

Example:
## Feature: User Authentication

### Requirements:
- Email/password login
- Social auth (Google, GitHub)
- Password reset flow

### UI:
- Modern login form with validation
- Remember me checkbox
- Loading states

### Technical:
- Use Supabase Auth
- Store user profile in profiles table"
          className="flex-1 resize-none font-mono text-sm min-h-[300px]"
        />
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          {hasChanges ? (
            <span className="text-amber-500">Unsaved changes</span>
          ) : (
            <span>Last updated: {new Date(feature.updated_at).toLocaleString()}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}
          <Button
            size="sm"
            className="bg-lavalog hover:bg-lavalog/90 text-white"
            onClick={() => {
              if (hasChanges) handleSave();
              onInject();
            }}
            disabled={!prompt.trim()}
          >
            <Zap className="w-4 h-4 mr-2" />
            Inject Prompt
          </Button>
        </div>
      </div>
    </div>
  );
}
