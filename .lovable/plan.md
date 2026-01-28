

## Upgrade Inject Button with Image Injection Support

### Overview
Transform the simple "Inject Prompt" button into a smart split button that offers two injection modes when an image is attached: text-only or text + image (copied to clipboard). This requires updating the UI component, adding clipboard write functionality, and updating the manifest permissions.

---

### Phase 1: Update Manifest Permissions

**File: `public/manifest.json`**

Add `clipboardWrite` permission to allow writing images to the system clipboard:

```json
"permissions": ["sidePanel", "scripting", "activeTab", "storage", "tabs", "identity", "clipboardWrite"],
```

---

### Phase 2: Add Image Clipboard Function to useChromeMessaging

**File: `src/hooks/useChromeMessaging.ts`**

Add a new function to copy Base64 images to the clipboard:

```typescript
const copyImageToClipboard = useCallback(async (base64Image: string): Promise<boolean> => {
  try {
    // Extract the mime type and base64 data
    const matches = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      console.error('Invalid base64 image format');
      return false;
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    
    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    // Write to clipboard using ClipboardItem
    await navigator.clipboard.write([
      new ClipboardItem({
        [mimeType]: blob
      })
    ]);
    
    return true;
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error);
    return false;
  }
}, []);
```

Update the return statement to include the new function:

```typescript
return {
  isExtension,
  pageInfo,
  checkCurrentPage,
  injectPrompt,
  scrapePageContent,
  copyImageToClipboard,  // Add this
};
```

---

### Phase 3: Update FeatureDetailSheet with Split Button

**File: `src/components/heartbeat/FeatureDetailSheet.tsx`**

#### New Imports
```typescript
import { Zap, Sparkles, Loader2, Paperclip, X, ChevronDown, Image } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
```

#### Updated Inject Button UI

Replace the simple button with conditional split button (note: `side="top"` for upward dropdown):

```tsx
{/* Inject Button Section */}
<div className="pt-4 border-t border-border">
  {attachedImage ? (
    // Split button when image is attached
    <div className="flex gap-1">
      {/* Primary action: Inject text only */}
      <Button
        className="flex-1 bg-heartbeat hover:bg-heartbeat/90 text-white h-12 text-base rounded-r-none"
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
            className="bg-heartbeat hover:bg-heartbeat/90 text-white h-12 px-3 rounded-l-none border-l border-white/20"
            disabled={!localPrompt.trim()}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56">
          <DropdownMenuItem onClick={handleInjectWithImage}>
            <Image className="w-4 h-4 mr-2" />
            Inject Prompt & Image
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : (
    // Simple button when no image attached
    <Button
      className="w-full bg-heartbeat hover:bg-heartbeat/90 text-white h-12 text-base"
      onClick={handleInject}
      disabled={!localPrompt.trim()}
    >
      <Zap className="w-5 h-5 mr-2" />
      Inject Prompt
    </Button>
  )}
</div>
```

#### New Handler for Inject with Image

```typescript
const { scrapePageContent, copyImageToClipboard } = useChromeMessaging();

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
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `public/manifest.json` | Add `clipboardWrite` permission |
| `src/hooks/useChromeMessaging.ts` | Add `copyImageToClipboard` function |
| `src/components/heartbeat/FeatureDetailSheet.tsx` | Add split button UI with upward dropdown and injection handler |

---

### UI States

**Without Image Attached:**
```
┌─────────────────────────────────────┐
│    [⚡] Inject Prompt               │
└─────────────────────────────────────┘
```

**With Image Attached (Drop-Up Menu):**
```
                    ┌─────────────────────┐
                    │ [🖼] Inject Prompt  │
                    │      & Image        │
                    └─────────────────────┘
                                  │
┌──────────────────────────────┬──────┐
│  [⚡] Inject Prompt Only     │  [▼] │
└──────────────────────────────┴──────┘
```

---

### Summary

1. **Manifest**: Add `clipboardWrite` for image clipboard access
2. **Hook**: New `copyImageToClipboard()` converts Base64 to Blob and uses `navigator.clipboard.write()`
3. **UI**: Split button with **upward dropdown** (`side="top"`) appears only when image is attached
4. **Feedback**: Clear toast message guides user to paste the image manually

