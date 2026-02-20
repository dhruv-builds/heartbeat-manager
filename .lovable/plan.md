
## UX & Behavior Tweaks — Combined Change Request

Five targeted improvements across the Project Context sheet, Feature Detail sheet, feature creation logic, and logo/icon treatments.

---

### Summary of Files Changed

| File | What Changes |
|------|-------------|
| `src/components/heartbeat/ProjectContextSheet.tsx` | Restructure layout: paste textarea + Save button, stronger button styles, updated copy |
| `src/components/heartbeat/FeatureDetailSheet.tsx` | Remove nudge block, update placeholder, fix "saved automatically" positioning |
| `src/hooks/useProjects.ts` | `createFeature`: set `status = "next"` for first feature, `"backlog"` for rest |
| `src/components/ui/GradientLogo.tsx` | Add `bare` prop: removes gradient container, renders logo directly at larger size |
| `src/pages/Auth.tsx` | Use bare logo at ~150% size |
| `src/pages/Dashboard.tsx` | Use bare logo in empty state at ~150% size |

---

### 1. Project Context Sheet (`ProjectContextSheet.tsx`)

**Current layout (State A — no context yet):**
- Section 1: "Generate Context File" prompt + Inject/Copy button
- Section 2: "Upload Context" + Choose File button

**New layout (State A):**

**Header copy update:**
- Title: `Project Context` (unchanged)
- Subtitle changes to: `Paste or upload context so we can generate better prompts for this project.`

**New Section 1 — "Paste context":**
- Label: `Paste context`
- A `Textarea` (shadcn/ui, `h-32`, `resize-none`) for the user to type or paste raw text/Markdown
- Local state: `pastedContext` string
- A **"Save Context" button** below it (solid brand gradient style: `className="w-full gradient-button gap-2"`) that:
  - Calls `onSaveContext(pastedContext, 'pasted-context.txt')`
  - Shows toast "Context saved" on success
  - Disabled when `pastedContext.trim()` is empty or `isSaving`

**New Section 2 — "Or upload a context file":**
- Label: `Or upload a context file`
- Helper copy: `Supports .txt and .docx files.`
- Hidden file input (unchanged wiring)
- **"Choose File" button** styled as `variant="outline"`, `size="sm"`, `w-full`

**For the extension-only "Generate Context File" section:**
- Keep the prompt textarea and Inject/Copy button
- **"Inject to Lovable"** button: styled with `className="w-full gradient-button gap-2"` (solid primary)
- **"Copy Prompt"** (web fallback): styled as `variant="outline"`, `size="sm"`, `w-full`

**State B (context already loaded):** No changes.

---

### 2. Feature Detail Sheet (`FeatureDetailSheet.tsx`)

**Change 2.1 — Remove nudge block, update placeholder:**

Remove this block entirely (lines 327–331):
```tsx
{totalFeatureCount < 5 && (
  <div className="p-2.5 rounded-md border border-border bg-muted/50 text-xs text-muted-foreground leading-relaxed">
    Write/paste your own detailed prompt...
  </div>
)}
```

Replace the `<textarea>` placeholder text with:
```
Write/paste your own detailed prompt, or click Generate with AI to let us write it for you! You can also paste a screenshot for context.
```

**Change 2.2 — Fix "saved automatically" overlap:**

The current "Changes are saved automatically" div at line 380 is inside the `gap-4` flex column. It's positioned in normal flow already, but sits between the image preview and the inject button area. No absolute positioning is involved — the issue is likely that the textarea's `flex-1` expands to push the text into the inject button area.

Fix: Move the "Changes are saved automatically" text to be directly below the `<textarea>` (after the closing textarea tag), with `mt-2` spacing, instead of at the bottom of the `gap-4` container. This keeps it clearly anchored below the prompt field.

```tsx
{/* Auto-save indicator — directly below textarea */}
<div className="text-xs text-muted-foreground mt-2">
  Changes are saved automatically
</div>
```

Also remove it from its current bottom position in the flex container.

---

### 3. Feature Creation Default Status (`useProjects.ts`)

**In `createFeature` (line 186):**

Current: always inserts `status: 'backlog'`.

New logic: check how many features the project currently has in memory.

```typescript
const isFirstFeature = project.features.length === 0;
const status: FeatureStatus = isFirstFeature ? 'next' : 'backlog';
```

Then use `status` in the insert:
```typescript
.insert({
  project_id: projectId,
  title,
  status,   // ← dynamic
  prompt: '',
  order: project.features.length,
})
```

This uses the already-loaded in-memory `project.features` array — no extra DB query needed. Safe for both extension and web contexts.

---

### 4. Logo/Icon Treatment — GradientLogo Component

**`src/components/ui/GradientLogo.tsx`:**

Add a `bare` boolean prop (defaults to `false`). When `bare={true}`:
- Skip the `gradient-brand rounded-xl ... shadow-lg` container div entirely
- Render the `<img>` directly, at a larger size (container size × ~150%)

Size mapping for bare mode (150% of current container-implied icon size):
```typescript
const bareSizes = {
  sm: 30,    // was 20
  md: 42,    // was 28
  lg: 60,    // was 40
  xl: 84,    // was 56
};
```

```tsx
{bare ? (
  <img 
    src="/app-logo.png" 
    alt="LovaLog" 
    className="object-contain" 
    style={{ width: bareSizes[size], height: bareSizes[size] }} 
  />
) : (
  <div className={cn('gradient-brand rounded-xl flex items-center justify-center shadow-lg', config.container)}>
    <img src="/app-logo.png" alt="LovaLog" className="object-contain" style={{ width: config.icon, height: config.icon }} />
  </div>
)}
```

---

### 5. Auth Page — Login Logo (`Auth.tsx`)

**Current (line 163–165):**
```tsx
<div className="flex flex-col items-center justify-center mb-8">
  <GradientLogo size="lg" />
</div>
```

**New:**
```tsx
<div className="flex flex-col items-center justify-center mb-8">
  <GradientLogo size="lg" bare />
</div>
```

This renders the logo at 60px directly on the dark background, without the purple rounded container. The text "LovaLog" + "Lovable Backlog Manager" remain beside it.

---

### 6. Dashboard Empty State — Logo (`Dashboard.tsx`)

**Current (line 348):**
```tsx
<GradientLogo size="sm" showText={false} className="justify-center" />
```

**New:**
```tsx
<GradientLogo size="md" showText={false} bare className="justify-center" />
```

Using `md` bare gives a 42px logo (~150% of current `sm` 20px icon, roughly `w-10 h-10` equivalent). No purple background, rendered directly on the dark card background.

---

### Technical Notes

- The `bare` prop is additive — all existing usages of `GradientLogo` (Landing page, Header, etc.) that don't pass `bare` continue to work exactly as before with the gradient container.
- The `totalFeatureCount` prop in `FeatureDetailSheet` is no longer used for the nudge block, but it can stay in the interface for potential future use — no need to remove it from the call sites.
- The paste-context save in `ProjectContextSheet` reuses the existing `onSaveContext(content, fileName)` prop — no new DB wiring needed.
