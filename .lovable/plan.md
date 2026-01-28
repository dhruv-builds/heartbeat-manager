

## Add Image Attachment Support with Multimodal AI (stream: false)

### Overview
Implement image attachment functionality for the "Generate with AI" feature. Users can attach images via file picker or clipboard paste. The image is sent as Base64 to the Perplexity `sonar-pro` model which supports vision input. The Edge Function uses `stream: false` for simple JSON responses.

---

### Phase 1: FeatureDetailSheet Component

**File: `src/components/heartbeat/FeatureDetailSheet.tsx`**

#### New State & Refs
```typescript
const [attachedImage, setAttachedImage] = useState<string | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
```

#### New Imports
```typescript
import { Zap, Sparkles, Loader2, Paperclip, X } from 'lucide-react';
```

#### UI Changes

**1. Attach Button (next to Generate with AI)**
```tsx
<div className="flex items-center gap-1">
  <Button
    variant="ghost"
    size="sm"
    onClick={() => fileInputRef.current?.click()}
    className="text-muted-foreground hover:text-foreground h-7 px-2"
    title="Attach image"
  >
    <Paperclip className="w-4 h-4" />
  </Button>
  {/* Existing Generate with AI button */}
</div>
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={handleFileSelect}
/>
```

**2. Image Preview (below textarea, above auto-save text)**
```tsx
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
      onClick={() => setAttachedImage(null)}
      className="h-6 w-6"
    >
      <X className="w-4 h-4" />
    </Button>
  </div>
)}
```

**3. Paste Handler (on SheetContent)**
```tsx
<SheetContent onPaste={handlePaste}>
```

#### Event Handlers

**File Select Handler**
```typescript
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = () => {
    setAttachedImage(reader.result as string);
  };
  reader.readAsDataURL(file);
  e.target.value = ''; // Reset for re-selection
};
```

**Paste Handler**
```typescript
const handlePaste = (e: React.ClipboardEvent) => {
  const items = e.clipboardData.items;
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachedImage(reader.result as string);
          toast({ title: 'Image attached from clipboard' });
        };
        reader.readAsDataURL(file);
      }
      break;
    }
  }
};
```

**Update handleGeneratePrompt**
```typescript
await generatePrompt({
  pageContent,
  featureTitle: localTitle,
  existingFeatures: doneFeatures,
  attachedImage,  // <-- Pass attached image
  onDelta: ...,
  onDone: ...,
  onError: ...,
});
```

**Clear on Feature Change**
```typescript
useEffect(() => {
  if (feature) {
    setLocalTitle(feature.title);
    setLocalPrompt(feature.prompt);
    setAttachedImage(null); // Clear when switching features
  }
}, [feature?.id, feature?.title, feature?.prompt]);
```

---

### Phase 2: useGeneratePrompt Hook

**File: `src/hooks/useGeneratePrompt.ts`**

#### Update Interface
```typescript
interface GeneratePromptOptions {
  pageContent: string | null;
  featureTitle: string;
  existingFeatures: string[];
  attachedImage?: string | null;  // <-- Add this
  onDelta: (chunk: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}
```

#### Update Request Body
```typescript
body: JSON.stringify({
  pageContent,
  featureTitle,
  existingFeatures,
  attachedImage,  // <-- Include in payload
}),
```

---

### Phase 3: Edge Function (Multimodal + stream: false)

**File: `supabase/functions/generate-feature-prompt/index.ts`**

#### Key Changes

**1. Parse attachedImage**
```typescript
const { pageContent, featureTitle, existingFeatures, attachedImage } = await req.json();
```

**2. Update System Prompt**
```typescript
const SYSTEM_PROMPT = `You are an expert Technical Product Manager...

Input Context:
- Project Context: A raw dump of the current webpage text...
- Completed Features: A list of features already built...
- Target Feature: The title of the feature the user wants to build.
- Visual Reference (Optional): A screenshot or mockup image. Analyze the UI elements, layout, and design patterns shown.

Output Requirements:
- If an image is provided, reference specific visual elements you observe...
...`;
```

**3. Build Multimodal Messages**
```typescript
const userMessageContent = [
  {
    type: "text",
    text: userPrompt,
  },
  ...(attachedImage ? [{
    type: "image_url",
    image_url: {
      url: attachedImage  // Full data:image/png;base64,... string
    }
  }] : [])
];

const messages = [
  { role: "system", content: SYSTEM_PROMPT },
  { role: "user", content: userMessageContent },
];
```

**4. API Call with sonar-pro and stream: false**
```typescript
const response = await fetch("https://api.perplexity.ai/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "sonar-pro",        // Vision-capable model
    messages,
    stream: false,             // Non-streaming JSON response
  }),
});
```

**5. Return JSON Response**
```typescript
const data = await response.json();
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/heartbeat/FeatureDetailSheet.tsx` | Add state, refs, file input, paste handler, image preview UI |
| `src/hooks/useGeneratePrompt.ts` | Add `attachedImage` to interface and request body |
| `supabase/functions/generate-feature-prompt/index.ts` | Switch to sonar-pro, multimodal messages, stream: false |

---

### Summary of Key Settings
- **Model**: `sonar-pro` (supports image input)
- **Streaming**: `stream: false` (returns JSON directly)
- **Image Format**: Base64 `data:image/png;base64,...` in `image_url.url`
- **Response**: `data.choices[0].message.content` (non-streaming format)

