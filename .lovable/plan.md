

## Batch Merge Feature Implementation

Implementing the full merge UX with progressive disclosure, selection mode, edge function call, undo toast, and transparent overlay cancellation.

---

### Files Changed (5 files)

#### 1. `src/types/heartbeat.ts`
- Add optional `is_merged?: boolean` field to the `Feature` interface (client-side flag for badge display).

#### 2. `src/components/heartbeat/FeatureItem.tsx`
- Add new optional props: `mergeMode`, `mergeSelected`, `mergeDisabled`, `onMergeToggle`, `isMerged`.
- Render a slide-in `Checkbox` (animated width 0 to 5, `transition-all duration-200`) to the left of the drag handle when `mergeMode && !isCompleted`.
- When `mergeSelected`, add a purple ring highlight to the card.
- When `isMerged`, show a small `Merge` Lucide icon next to the title.
- In merge mode, clicking the card toggles selection instead of opening the detail sheet.
- Completed items never show checkboxes.
- Cards get `relative z-40` to sit above the overlay.

#### 3. `src/components/heartbeat/FeatureList.tsx`
Major changes:

**New state:** `mergeMode`, `selectedForMerge` (string array, max 3), `isMerging`.

**New props:** `projectId`, `onCreateMergedFeature`.

**Header merge button:**
- Only shown when `backlogCount >= 2`.
- When not in merge mode: ghost `Layers` icon button with tooltip "Merge Tasks".
- When in merge mode with fewer than 2 selected: same style, plus an `X` cancel button.
- When 2+ selected: solid brand purple with `animate-pulse` ring effect + label "Merge". Clicking triggers `handleMerge`.
- Sits to the left of the Add button for space efficiency.

**Transparent overlay:**
- When `mergeMode` is active, render `<div className="fixed inset-0 z-30 bg-transparent" onClick={exitMergeMode} />`.
- Header and feature cards are `z-40` to remain clickable above the overlay.

**Selection logic:**
- `toggleMergeSelection`: add/remove from array, capped at 3.
- Passes `mergeDisabled` to items when 3 are already selected.

**Merge execution (`handleMerge`):**
1. Show "Merging..." loading state.
2. Call `supabase.functions.invoke('merge-features')` on the external Supabase with selected features' id, title, prompt, status.
3. Insert new merged task via `onCreateMergedFeature` (uses first selected task's image).
4. Delete old selected tasks via `onDeleteFeature`.
5. Exit merge mode.
6. Show "Undo" toast with an action button that deletes the merged feature and re-inserts old ones as new rows (with `now()` timestamps, per user's MVP preference).

#### 4. `src/hooks/useProjects.ts`
- Add `createMergedFeature` callback that inserts a feature with provided title, prompt, status, and image_url. Sets `is_merged: true` on the local Feature object. Returns the new Feature.
- Export it from the hook's return object.

#### 5. `src/pages/Dashboard.tsx`
- Destructure `createMergedFeature` from `useProjects()`.
- Pass two new props to `FeatureList`:
  - `projectId={activeProject.id}`
  - `onCreateMergedFeature={(data) => createMergedFeature(activeProject.id, data)}`

---

### Key Design Decisions

- **Overlay approach** (per user request): A `fixed inset-0 z-30 bg-transparent` div handles click-outside cancellation cleanly. Cards and header sit at `z-40`.
- **Undo creates new rows** (per user's MVP preference): Old features are re-inserted with fresh timestamps rather than trying to restore `created_at`.
- **Edge function** is called on the external Supabase via the existing `supabase` client from `src/integrations/supabase/client.ts`.
- **Max 3 selections**, checkboxes disabled beyond that. Completed tasks excluded.
- **`is_merged`** is a client-side-only flag (not persisted in DB) -- it marks the merged task with a badge icon until the next page load/refetch.

