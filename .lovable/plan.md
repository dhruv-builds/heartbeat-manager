

## Project Context Feature

### Overview

Add a "Project Context" feature that lets users upload a TXT or DOCX file containing their project's vision/architecture. The extracted text is stored in the `projects` table (columns already added by user). A new Context button in the header opens a sheet with two states: empty (with a generate prompt + upload) and loaded (with preview + update).

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/heartbeat/ProjectContextSheet.tsx` | New sheet component with State A / State B UI |

### Files to Modify

| File | Change |
|------|---------|
| `src/types/heartbeat.ts` | Add `context_content`, `context_file_name`, `context_updated_at` to `Project` and `DbProject` |
| `src/hooks/useProjects.ts` | Map new context fields from DB, add `updateProjectContext()` method |
| `src/pages/Dashboard.tsx` | Add Context button in header area, wire up sheet state |

### New Dependency

- Install `mammoth` for client-side DOCX parsing

---

### 1. Type Updates (`src/types/heartbeat.ts`)

Add three optional fields to both `Project` and `DbProject`:

```typescript
export interface Project {
  // ... existing fields
  context_content?: string | null;
  context_file_name?: string | null;
  context_updated_at?: string | null;
}
```

Same for `DbProject`.

---

### 2. Hook Updates (`src/hooks/useProjects.ts`)

**fetchProjects**: Map the three new fields from DB response into the Project object.

**New method `updateProjectContext`**:

```typescript
const updateProjectContext = useCallback(async (
  projectId: string,
  content: string,
  fileName: string
): Promise<boolean> => {
  const now = new Date().toISOString();
  const updates = {
    context_content: content,
    context_file_name: fileName,
    context_updated_at: now,
  };
  // Update in Supabase, then optimistic local update
}, []);
```

Return `updateProjectContext` from the hook.

---

### 3. Dashboard Updates (`src/pages/Dashboard.tsx`)

- Import `FileText` from lucide-react
- Add state: `const [isContextSheetOpen, setIsContextSheetOpen] = useState(false);`
- Add a Context icon button in the header row (next to the Project label), with:
  - Default/gray when `activeProject?.context_content` is null
  - Active/purple when context exists (with a small dot indicator)
- Render `<ProjectContextSheet>` with relevant props

**Button placement**: In the "Credits + Project Selector Row" div, between the "Project" label and the CreditsBadge:

```tsx
<div className="flex items-center justify-between px-4 py-2 border-b border-border">
  <div className="flex items-center gap-2">
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      Project
    </span>
    {activeProject && (
      <Button variant="ghost" size="icon" className="h-6 w-6 relative" onClick={...}>
        <FileText className={cn("w-3.5 h-3.5", hasContext ? "text-brand-purple" : "text-muted-foreground")} />
        {hasContext && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-purple rounded-full" />}
      </Button>
    )}
  </div>
  {isExtension && <CreditsBadge />}
</div>
```

---

### 4. ProjectContextSheet Component

A new Sheet component with two states:

**Props**:
```typescript
interface ProjectContextSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSaveContext: (content: string, fileName: string) => Promise<boolean>;
  isExtension: boolean;
  onInjectPrompt: (text: string) => Promise<boolean>;
}
```

**State A (No Context)**:
- Header: "No context loaded"
- Instructions text
- Section 1 "Generate Context File":
  - Read-only textarea with the static prompt (provided in the user's request)
  - Extension: "Inject to Lovable" button (calls `onInjectPrompt` with the static prompt text)
  - Website: "Copy Prompt" button (copies to clipboard)
- Section 2 "Upload Context":
  - File input accepting `.docx, .txt`
  - On file select:
    - `.txt`: Use `FileReader.readAsText()`
    - `.docx`: Use `mammoth.extractRawText()` to get plain text
  - Call `onSaveContext(extractedText, fileName)`
  - Show toast on success/failure

**State B (Context Loaded)**:
- Header: "Context Active: {context_file_name}"
- Subheader: "Last updated: {formatted date}"
- Preview: First 500 chars of context_content in a muted read-only text area
- "Update Context" button that toggles back to State A (upload mode)

**File parsing logic** (inside the component):

```typescript
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  let content = '';
  if (file.name.endsWith('.txt')) {
    content = await file.text();
  } else if (file.name.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    content = result.value;
  }

  await onSaveContext(content, file.name);
};
```

---

### 5. Static Prompt Content

The exact text from the user's request will be stored as a constant string in `ProjectContextSheet.tsx`:

```typescript
const CONTEXT_GENERATION_PROMPT = `Generate a **Project Context & Version Log** ...`;
```

This is rendered in a read-only textarea in State A, Section 1.

---

### Visual Flow

```text
Header: [Logo] LovaLog    [Sync] [+] [...]
Row:    Project [Context icon]         [Credits badge]
        [Project Selector dropdown]
        [Feature list...]
```

Clicking the Context icon opens:

```text
+-- Project Context Sheet ----------------+
|                                          |
|  [State A or State B based on data]      |
|                                          |
|  State A:                                |
|    "No context loaded"                   |
|    Instructions...                       |
|                                          |
|    --- Generate Context File ---         |
|    [Read-only prompt textarea]           |
|    [Inject to Lovable] or [Copy Prompt]  |
|                                          |
|    --- Upload Context ---                |
|    [Choose File (.docx, .txt)]           |
|                                          |
|  State B:                                |
|    "Context Active: filename.txt"        |
|    "Last updated: Feb 8, 2026"           |
|    [Preview: first 500 chars...]         |
|    [Update Context]                      |
+-----------------------------------------+
```

---

### Summary

1. Install `mammoth` dependency
2. Add context fields to types
3. Add `updateProjectContext` to `useProjects` hook + map fields in fetch
4. Create `ProjectContextSheet` component with State A/B, file parsing, inject/copy logic
5. Add Context icon button to Dashboard header row
6. Wire everything together in Dashboard

No changes to existing CRUD, sorting, injection, or extension-only visibility logic.

