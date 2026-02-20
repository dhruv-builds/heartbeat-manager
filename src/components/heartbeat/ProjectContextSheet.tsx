import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Copy, Zap, RefreshCw, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Project } from '@/types/heartbeat';
import { format } from 'date-fns';

const CONTEXT_GENERATION_PROMPT = `Generate a **Project Context & Version Log** for the current state of this app.

Requirements:

- Plain text or Markdown

- Structured for re-import into a future AI session

- Focus on decisions and intent, not raw code

Include the following sections:

1. Version identifier (e.g. v0.3 – date-based is fine)

2. Product vision & emotional thesis

   - What this product is trying to *feel* like

   - What kind of user it is designed for (power user vs beginner, calm vs fast, etc.)

3. Current feature set

   - What exists today

   - What is explicitly planned next

   - What is intentionally deferred

4. Architectural decisions

   For each major area (frontend, backend, storage, auth, Chrome extension):

   - What was chosen

   - Why this choice was made

   - What alternatives were considered or rejected

   - Any constraints or invariants that future changes must respect

   Keep this conceptual (no raw code).

5. Integration boundaries

   - What parts of the system must coordinate (e.g. extension ↔ Lovable chat ↔ backend)

   - Known limitations imposed by browsers, security models, or platforms

6. Design direction

   - UI tone and emotional intent

   - Key layout or interaction principles that should not drift

   - Hero/marketing direction if applicable

7. Known constraints, risks, or sharp edges

   - Things that have caused confusion or bugs before

   - Areas where changes are risky or expensive

8. What changed since the previous version

   - New decisions

   - Invalidated assumptions

   - Scope shifts

9. Open questions or upcoming decisions

   - Things that are intentionally unresolved

Do NOT include raw code unless it is essential for understanding.

Optimize for continuity, clarity, and rehydrating context in a future session.

Final Instruction: Please output the entire log inside a single markdown code block so I can easily copy it or save it as a text file.`;

interface ProjectContextSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSaveContext: (content: string, fileName: string) => Promise<boolean>;
  isExtension: boolean;
  onInjectPrompt: (text: string) => Promise<boolean>;
}

export function ProjectContextSheet({
  open,
  onOpenChange,
  project,
  onSaveContext,
  isExtension,
  onInjectPrompt,
}: ProjectContextSheetProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUploadMode, setShowUploadMode] = useState(false);
  const [pastedContext, setPastedContext] = useState('');

  const hasContext = !!project?.context_content;
  const showStateA = !hasContext || showUploadMode;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(CONTEXT_GENERATION_PROMPT);
      toast({ title: 'Copied!', description: 'Prompt copied to clipboard.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
    }
  };

  const handleInject = async () => {
    const success = await onInjectPrompt(CONTEXT_GENERATION_PROMPT);
    if (success) {
      toast({ title: 'Prompt injected!', description: 'Your prompt is ready in the chat.' });
    } else {
      toast({ title: 'Injection failed', description: 'Could not find the Lovable chat input.', variant: 'destructive' });
    }
  };

  const handleSavePasted = async () => {
    if (!pastedContext.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const success = await onSaveContext(pastedContext.trim(), 'pasted-context.txt');
      if (success) {
        setPastedContext('');
        setShowUploadMode(false);
        toast({ title: 'Context saved!' });
      } else {
        toast({ title: 'Save failed', description: 'Could not save context. Please try again.', variant: 'destructive' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let content = '';
      if (file.name.endsWith('.txt')) {
        content = await file.text();
      } else if (file.name.endsWith('.docx')) {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else {
        toast({ title: 'Unsupported file', description: 'Please upload a .txt or .docx file.', variant: 'destructive' });
        return;
      }

      if (!content.trim()) {
        toast({ title: 'Empty file', description: 'The file appears to be empty.', variant: 'destructive' });
        return;
      }

      const success = await onSaveContext(content, file.name);
      if (success) {
        setShowUploadMode(false);
        toast({ title: 'Context saved!', description: `"${file.name}" has been loaded.` });
      } else {
        toast({ title: 'Save failed', description: 'Could not save context. Please try again.', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error parsing file:', err);
      toast({ title: 'Parse error', description: 'Could not read the file contents.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setShowUploadMode(false);
      setPastedContext('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {showStateA ? 'Project Context' : 'Context Active'}
          </SheetTitle>
          <SheetDescription>
            {showStateA
              ? 'Paste or upload context so we can generate better prompts for this project.'
              : `${project?.context_file_name || 'Unknown file'} · Last updated: ${
                  project?.context_updated_at
                    ? format(new Date(project.context_updated_at), 'MMM d, yyyy')
                    : 'Unknown'
                }`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {showStateA ? (
            <>
              {/* Section 1: Paste context */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Paste context</h3>
                <Textarea
                  value={pastedContext}
                  onChange={(e) => setPastedContext(e.target.value)}
                  placeholder="Paste plain text or Markdown here…"
                  className="h-32 resize-none text-sm"
                />
                <Button
                  className="w-full gradient-button gap-2"
                  onClick={handleSavePasted}
                  disabled={!pastedContext.trim() || isSaving}
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'Saving…' : 'Save Context'}
                </Button>
              </div>

              {/* Section 2: Upload context file */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Or upload a context file</h3>
                <p className="text-xs text-muted-foreground">Supports .txt and .docx files.</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isUploading ? 'Processing...' : 'Choose File'}
                </Button>
              </div>

              {/* Section 3: Generate Context File (extension: inject, web: copy) */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Generate Context File</h3>
                <p className="text-xs text-muted-foreground">
                  Use this prompt in Lovable to generate a context file, then paste or upload the result above.
                </p>
                <Textarea
                  readOnly
                  value={CONTEXT_GENERATION_PROMPT}
                  className="text-xs font-mono bg-muted/50 resize-none h-32 cursor-default"
                />
                {isExtension ? (
                  <Button className="w-full gradient-button gap-2" onClick={handleInject}>
                    <Zap className="w-3.5 h-3.5" />
                    Inject to Lovable
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleCopyPrompt}>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Prompt
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* State B: Context Loaded */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Preview</h3>
                <Textarea
                  readOnly
                  value={project?.context_content?.slice(0, 500) + (project?.context_content && project.context_content.length > 500 ? '...' : '') || ''}
                  className="text-xs bg-muted/50 resize-none h-40 cursor-default"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => setShowUploadMode(true)}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Update Context
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
