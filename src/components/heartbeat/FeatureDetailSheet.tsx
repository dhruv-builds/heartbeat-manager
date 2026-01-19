import { useState, useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Feature } from '@/types/heartbeat';
import { StatusBadge, getNextStatus } from './StatusBadge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface FeatureDetailSheetProps {
  feature: Feature | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updates: Partial<Feature>) => void;
  onInject: () => Promise<boolean>;
}

export function FeatureDetailSheet({
  feature,
  open,
  onOpenChange,
  onUpdate,
  onInject,
}: FeatureDetailSheetProps) {
  const [localTitle, setLocalTitle] = useState('');
  const [localPrompt, setLocalPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local state when feature changes
  useEffect(() => {
    if (feature) {
      setLocalTitle(feature.title);
      setLocalPrompt(feature.prompt);
    }
  }, [feature?.id, feature?.title, feature?.prompt]);

  // Auto-save with debounce
  useEffect(() => {
    if (!feature) return;
    
    const timer = setTimeout(() => {
      if (localTitle !== feature.title || localPrompt !== feature.prompt) {
        onUpdate({ title: localTitle, prompt: localPrompt });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localTitle, localPrompt, feature, onUpdate]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset to min height to get accurate scrollHeight
    textarea.style.height = 'auto';
    
    const lineHeight = 24; // approximate line height in px
    const minRows = 10;
    const maxRows = 20;
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;
    
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [localPrompt]);

  const handleStatusClick = () => {
    if (feature) {
      onUpdate({ status: getNextStatus(feature.status) });
    }
  };

  const handleInject = async () => {
    const success = await onInject();
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        {feature ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-left">Edit Feature</SheetTitle>
            </SheetHeader>

            <div className="flex-1 flex flex-col gap-4 overflow-hidden py-4">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Title
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    className="flex-1"
                    placeholder="Feature title"
                  />
                  <StatusBadge status={feature.status} onClick={handleStatusClick} />
                </div>
              </div>

              {/* Prompt Input */}
              <div className="flex-1 flex flex-col min-h-0 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Prompt
                </label>
                <textarea
                  ref={textareaRef}
                  value={localPrompt}
                  onChange={(e) => setLocalPrompt(e.target.value)}
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
- Loading states"
                  className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none font-mono overflow-y-auto"
                  style={{ minHeight: '240px', maxHeight: '480px' }}
                />
              </div>

              {/* Auto-save indicator */}
              <div className="text-xs text-muted-foreground">
                Changes are saved automatically
              </div>
            </div>

            {/* Inject Button */}
            <div className="pt-4 border-t border-border">
              <Button
                className="w-full bg-heartbeat hover:bg-heartbeat/90 text-white h-12 text-base"
                onClick={handleInject}
                disabled={!localPrompt.trim()}
              >
                <Zap className="w-5 h-5 mr-2" />
                Inject Prompt
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a feature</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
