import { useState, useEffect, useRef } from 'react';
import { Zap, Sparkles, Loader2, Paperclip, X, ChevronDown, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Feature } from '@/types/heartbeat';
import { StatusBadge, getNextStatus } from './StatusBadge';
import { useGeneratePrompt } from '@/hooks/useGeneratePrompt';
import { useChromeMessaging } from '@/hooks/useChromeMessaging';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FeatureDetailSheetProps {
  feature: Feature | null;
  existingFeatures?: Feature[];
  projectContext?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updates: Partial<Feature>) => void;
  onInject: () => Promise<boolean>;
  isExtension?: boolean;
}

export function FeatureDetailSheet({
  feature,
  existingFeatures = [],
  projectContext,
  open,
  onOpenChange,
  onUpdate,
  onInject,
  isExtension = false,
}: FeatureDetailSheetProps) {
  const [localTitle, setLocalTitle] = useState('');
  const [localPrompt, setLocalPrompt] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { generatePrompt, isGenerating } = useGeneratePrompt();
  const { scrapePageContent, copyImageToClipboard } = useChromeMessaging();
  const { uploadImage, deleteImage, uploading } = useImageUpload();
  const { toast } = useToast();

  // Sync local state when feature changes - load image_url from DB
  useEffect(() => {
    if (feature) {
      setLocalTitle(feature.title);
      setLocalPrompt(feature.prompt);
      setAttachedImage(feature.image_url || null);
    }
  }, [feature?.id, feature?.title, feature?.prompt, feature?.image_url]);

  // Auto-save with debounce (only for title and prompt, not image)
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

  const handleInjectWithImage = async () => {
    if (!attachedImage) return;
    
    // Step 1: Inject the text prompt
    const textSuccess = await onInject();
    
    if (textSuccess) {
      // Step 2: Copy image to clipboard
      const imageSuccess = await copyImageToClipboard(attachedImage);
      
      if (imageSuccess) {
        toast({
          title: 'Text injected! Image copied to clipboard',
          description: 'Press Ctrl+V (or Cmd+V) to attach the image.',
        });
        onOpenChange(false);
      } else {
        toast({
          title: 'Partial success',
          description: 'Text injected but failed to copy image to clipboard.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !feature) return;
    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      // Show preview immediately
      setAttachedImage(base64);
      
      // Upload to storage and save URL to DB
      const url = await uploadImage(base64, feature.id);
      if (url) {
        setAttachedImage(url);
        onUpdate({ image_url: url });
        toast({ title: 'Image saved' });
      } else {
        toast({ title: 'Upload failed', variant: 'destructive' });
        setAttachedImage(null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file && feature) {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = reader.result as string;
            // Show preview immediately
            setAttachedImage(base64);
            
            // Upload to storage and save URL to DB
            const url = await uploadImage(base64, feature.id);
            if (url) {
              setAttachedImage(url);
              onUpdate({ image_url: url });
              toast({ title: 'Image saved from clipboard' });
            } else {
              toast({ title: 'Upload failed', variant: 'destructive' });
              setAttachedImage(null);
            }
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!attachedImage || !feature) return;
    
    // Delete from storage if it's a URL (not base64)
    if (attachedImage.startsWith('http')) {
      await deleteImage(attachedImage);
    }
    
    // Clear local state and nullify DB column
    setAttachedImage(null);
    onUpdate({ image_url: null });
  };

  const handleGeneratePrompt = async () => {
    if (!localTitle.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a feature title before generating a prompt.',
        variant: 'destructive',
      });
      return;
    }

    // Scrape page content with fallback
    const pageContent = (await scrapePageContent()) || "No page content available.";
    
    // Get completed features for context
    const doneFeatures = existingFeatures
      .filter(f => f.status === 'done' && f.id !== feature?.id)
      .map(f => f.title);

    // Clear prompt and start streaming
    setLocalPrompt('');

    await generatePrompt({
      pageContent,
      featureTitle: localTitle,
      existingFeatures: doneFeatures,
      projectContext,
      attachedImage,
      onDelta: (chunk) => {
        setLocalPrompt(prev => prev + chunk);
      },
      onDone: () => {
        toast({
          title: 'Prompt generated!',
          description: 'Your AI-generated prompt is ready. Review and edit as needed.',
        });
      },
      onError: (error) => {
        toast({
          title: 'Generation failed',
          description: error,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg" onPaste={handlePaste}>
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
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">
                    Prompt
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-muted-foreground hover:text-foreground h-7 px-2"
                      title="Attach image"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Paperclip className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGeneratePrompt}
                      disabled={isGenerating || !localTitle.trim()}
                      className="text-brand-purple hover:text-brand-purple/80 hover:bg-brand-purple/10 h-7 px-2"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span className="ml-1.5 text-xs">Generate with AI</span>
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
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

              {/* Image Preview */}
              {attachedImage && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <img 
                    src={attachedImage} 
                    alt="Attached" 
                    className="w-[100px] h-[100px] object-cover rounded"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveImage}
                    className="h-6 w-6"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {uploading && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              )}

              {/* Auto-save indicator */}
              <div className="text-xs text-muted-foreground">
                Changes are saved automatically
              </div>
            </div>

            {/* Inject Button - Extension only */}
            {isExtension ? (
              <div className="pt-4 border-t border-border">
                {attachedImage ? (
                  // Split button when image is attached
                  <div className="flex gap-1">
                    {/* Primary action: Inject text only */}
                    <Button
                      className="flex-1 gradient-button h-12 text-base rounded-r-none"
                      onClick={handleInject}
                      disabled={!localPrompt.trim()}
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Inject Prompt Only
                    </Button>
                    
                    {/* Dropdown for additional options */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="gradient-button h-12 px-3 rounded-l-none border-l border-white/20"
                          disabled={!localPrompt.trim()}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="top" className="w-56">
                        <DropdownMenuItem onClick={handleInjectWithImage}>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Inject Prompt & Image
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  // Simple button when no image attached
                  <Button
                    className="w-full gradient-button h-12 text-base"
                    onClick={handleInject}
                    disabled={!localPrompt.trim()}
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Inject Prompt
                  </Button>
                )}
              </div>
            ) : (
              // Website: Show subtle CTA
              <div className="pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Install the extension to inject prompts directly into Lovable
                </p>
              </div>
            )}
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
