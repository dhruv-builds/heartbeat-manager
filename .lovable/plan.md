

## Branding Updates and Smart Project Auto-Linking

Two main changes: replace all Lucide ClipboardCheck icons with the custom `app-logo.png` asset, and auto-link Lovable projects when creating a new project from the extension.

---

### 1. Replace GradientLogo Icon with Custom Logo

**File:** `src/components/ui/GradientLogo.tsx`

Replace the `ClipboardCheck` Lucide icon inside the gradient container with an `<img>` tag pointing to `/app-logo.png`. The image sizes will map to the existing size config, replacing the icon size with appropriate image dimensions. Remove the `ClipboardCheck` import.

This single change propagates everywhere `GradientLogo` is used:
- Auth screen (Login page)
- Landing page navbar, footer
- Dashboard empty states

### 2. Remove Globe Icon from Dashboard Empty State

**File:** `src/pages/Dashboard.tsx` (line 355)

Remove the `<Globe>` icon from the "Not on Lovable" empty state (Scenario A). The `GradientLogo` already serves as the visual. Remove the `Globe` import if no longer needed.

### 3. Smart Auto-Link on Project Create

**File:** `src/hooks/useProjects.ts` -- update `createProject`

Update the `createProject` callback to:

1. Before inserting, check if we're in the extension environment (`typeof chrome !== 'undefined' && chrome.tabs`).
2. If yes, query the active tab URL via `chrome.tabs.query({ active: true, currentWindow: true })`.
3. Parse the URL with a regex for `https://lovable.dev/projects/<UUID>`.
4. If a match is found, include `lovable_project_id` (the UUID) and `lovable_project_url` (the canonical URL) in the insert query.
5. If no match, insert with `null` for both fields (current behavior).
6. Update the optimistic local state to include these fields on the new project object.

No toast changes needed here -- the existing flow handles project creation feedback. The "Link" button is already hidden when `lovable_project_id` matches `detectedLovableId` (see `inlineAction` logic in Dashboard.tsx lines 123-149 -- when `selectedLovableId === detectedLovableId`, it returns `null`, hiding the button). This already covers the "hide Link button if already linked" requirement.

---

### Technical Details

**GradientLogo.tsx changes:**
- Remove `ClipboardCheck` import
- Replace the icon element with `<img src="/app-logo.png" alt="LovaLog" className="object-contain" style={{ width: config.icon, height: config.icon }} />`
- The gradient background container remains unchanged

**useProjects.ts `createProject` changes:**
```typescript
// Before insert, detect Lovable project from active tab
let lovableProjectId: string | null = null;
let lovableProjectUrl: string | null = null;

if (typeof chrome !== 'undefined' && chrome?.tabs?.query) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tabs[0]?.url || '';
    const match = url.match(/^https:\/\/lovable\.dev\/projects\/([0-9a-fA-F-]{36})/);
    if (match) {
      lovableProjectId = match[1];
      lovableProjectUrl = `https://lovable.dev/projects/${match[1]}`;
    }
  } catch {}
}

// Include in insert
const { data, error } = await (supabase as any)
  .from('projects')
  .insert({
    name,
    user_id: user.id,
    lovable_project_id: lovableProjectId,
    lovable_project_url: lovableProjectUrl,
  })
  .select()
  .single();
```

The optimistic `newProject` object will also include `lovable_project_id` and `lovable_project_url` from the returned data.

### Summary of Files Changed

| File | Change |
|------|--------|
| `src/components/ui/GradientLogo.tsx` | Replace ClipboardCheck with `<img src="/app-logo.png">` |
| `src/pages/Dashboard.tsx` | Remove Globe icon from empty state |
| `src/hooks/useProjects.ts` | Auto-detect and auto-link Lovable project on create |

