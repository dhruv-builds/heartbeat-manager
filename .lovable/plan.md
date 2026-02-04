

## Inline "Load" / "Link" Button for Project Mismatch Detection (Revised)

### Overview

Add an **inline button** to the right of the Project dropdown that appears **only when needed**, showing either a "Load" or "Link" action based on the relationship between the selected project and the currently active browser tab. This is an **extension-only feature** that preserves vertical space by never adding new rows.

---

### Adjustments from Feedback

| Item | Change |
|------|--------|
| **1. Existing behavior** | No changes to dropdown display (shows `projects.name`), no UUIDs in UI, auto-detect on tab switch preserved, manual selection unchanged, button never auto-navigates |
| **2. Canonical URL** | Always store `lovable_project_url = https://lovable.dev/projects/${detectedLovableId}` (not raw URL with params) |
| **3. Regex fix** | Use `[/?#]` not `[\/?#]` in character class |
| **4. Restricted tabs** | Block all non-HTTP(S) URLs (file://, about:, edge://, etc.) |
| **5. Tab tracking** | Subscribe to tab events, debounce 200ms, cleanup on unmount |
| **6. Permissions** | Keep scoped to `https://lovable.dev/*`, no `<all_urls>` |
| **7. Auto-detect mapping** | Existing auto-select behavior on tab switch continues; if no match, keep current selection |

---

### Visual Design

```text
MATCHED STATE (nothing extra shown):
+--------------------------------------------+
|  Project                    [Free Credits] |
+--------------------------------------------+
| [Heartbeat Manager           v]            |
+--------------------------------------------+

MISMATCH STATE (Load button appears):
+--------------------------------------------+
|  Project                    [Free Credits] |
+--------------------------------------------+
| [Heartbeat Manager   v]  [Load]            |
+--------------------------------------------+

UNLINKED + ON LOVABLE (Link button appears):
+--------------------------------------------+
|  Project                    [Free Credits] |
+--------------------------------------------+
| [My New Project      v]  [Link]            |
+--------------------------------------------+
```

---

### State Logic

| State | Condition | UI | Button Action |
|-------|-----------|----|----|
| **MATCHED** | `selectedLovableId !== null && selectedLovableId === detectedLovableId` | No button | - |
| **MISMATCH** | `selectedLovableId !== null && selectedLovableId !== detectedLovableId` | "Load" button | Navigate tab to canonical URL |
| **UNLINKED + On Lovable** | `selectedLovableId === null && detectedLovableId !== null` | "Link" button | Save canonical `lovable_project_id` and `lovable_project_url` |
| **UNLINKED + Not on Lovable** | `selectedLovableId === null && detectedLovableId === null` | No button | - |

---

### Database Schema Changes

Add two nullable columns to `public.projects`:

```sql
ALTER TABLE public.projects
ADD COLUMN lovable_project_id TEXT NULL,
ADD COLUMN lovable_project_url TEXT NULL;
```

- `lovable_project_id`: Stores the UUID extracted from `lovable.dev/projects/<uuid>`
- `lovable_project_url`: Stores the **canonical** URL: `https://lovable.dev/projects/<uuid>`

Backwards compatible: existing projects have NULL values and continue to work.

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database migration | Create | Add `lovable_project_id` and `lovable_project_url` columns |
| `src/types/heartbeat.ts` | Modify | Add optional fields to `Project` and `DbProject` interfaces |
| `src/hooks/useProjects.ts` | Modify | Read new columns; add `linkProject()` method |
| `src/hooks/useChromeMessaging.ts` | Modify | Add tab URL tracking, navigation, URL parsing utilities |
| `src/components/heartbeat/ProjectSelector.tsx` | Modify | Accept and render optional inline action button |
| `src/pages/Dashboard.tsx` | Modify | Wire up state detection and button handlers |

---

### Implementation Details

**1. Types Update (`src/types/heartbeat.ts`)**

```typescript
export interface Project {
  id: string;
  user_id?: string;
  name: string;
  lovable_project_id?: string | null;    // NEW
  lovable_project_url?: string | null;   // NEW
  features: Feature[];
  created_at: string;
  updated_at: string;
}

export interface DbProject {
  id: string;
  user_id: string;
  name: string;
  lovable_project_id?: string | null;    // NEW
  lovable_project_url?: string | null;   // NEW
  created_at: string;
  updated_at: string;
}
```

**2. Chrome Messaging Hook (`src/hooks/useChromeMessaging.ts`)**

Add new state and utilities:

```typescript
// State for active tab tracking
const [activeTabUrl, setActiveTabUrl] = useState<string | null>(null);

// Parse Lovable project UUID from URL (corrected regex)
function parseLovableProjectId(url: string): string | null {
  const match = url.match(/^https:\/\/lovable\.dev\/projects\/([0-9a-fA-F-]{36})(?:[/?#].*)?$/);
  return match ? match[1] : null;
}

// Check if URL is restricted (non-HTTP/HTTPS)
function isRestrictedUrl(url: string | null): boolean {
  if (!url) return true;
  return !url.startsWith('http://') && !url.startsWith('https://');
}

// Get active tab URL directly
const getActiveTabUrl = useCallback(async (): Promise<string | null> => {
  if (!isExtension) return null;
  try {
    const tabs = await chrome.tabs!.query({ active: true, currentWindow: true });
    return tabs[0]?.url || null;
  } catch {
    return null;
  }
}, [isExtension]);

// Navigate active tab to a URL
const navigateActiveTab = useCallback(async (url: string): Promise<boolean> => {
  if (!isExtension) return false;
  try {
    const tabs = await chrome.tabs!.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab?.id) return false;
    
    // Check for restricted URLs
    if (isRestrictedUrl(tab.url || null)) {
      return false;
    }
    
    await chrome.tabs!.update(tab.id, { url });
    return true;
  } catch {
    return false;
  }
}, [isExtension]);

// Tab URL tracking with debounce and cleanup
useEffect(() => {
  if (!isExtension) return;

  let debounceTimer: ReturnType<typeof setTimeout>;

  const updateActiveTabUrl = async () => {
    const url = await getActiveTabUrl();
    setActiveTabUrl(url);
  };

  const debouncedUpdate = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateActiveTabUrl, 200);
  };

  // Initial fetch
  updateActiveTabUrl();

  // Listen for tab activation changes
  const handleTabActivated = () => debouncedUpdate();
  
  // Listen for URL updates within tabs
  const handleTabUpdated = (
    tabId: number, 
    changeInfo: { url?: string }, 
    tab: { active?: boolean }
  ) => {
    if (changeInfo.url && tab.active) {
      debouncedUpdate();
    }
  };

  chrome.tabs?.onActivated?.addListener(handleTabActivated);
  chrome.tabs?.onUpdated?.addListener(handleTabUpdated);

  return () => {
    clearTimeout(debounceTimer);
    chrome.tabs?.onActivated?.removeListener(handleTabActivated);
    chrome.tabs?.onUpdated?.removeListener(handleTabUpdated);
  };
}, [isExtension, getActiveTabUrl]);

// Derived state
const detectedLovableId = activeTabUrl ? parseLovableProjectId(activeTabUrl) : null;
const isOnLovableHost = activeTabUrl?.startsWith('https://lovable.dev/') || false;
const isRestrictedTab = isRestrictedUrl(activeTabUrl);
```

Export new values:
- `activeTabUrl`
- `detectedLovableId`
- `isOnLovableHost`
- `isRestrictedTab`
- `navigateActiveTab`

**3. Projects Hook (`src/hooks/useProjects.ts`)**

Add `linkProject` method with **canonical URL**:

```typescript
const linkProject = useCallback(async (
  projectId: string, 
  lovableProjectId: string
): Promise<boolean> => {
  // Always store canonical URL
  const canonicalUrl = `https://lovable.dev/projects/${lovableProjectId}`;
  
  try {
    const { error } = await (supabase as any)
      .from('projects')
      .update({ 
        lovable_project_id: lovableProjectId,
        lovable_project_url: canonicalUrl
      })
      .eq('id', projectId);

    if (error) throw error;

    // Optimistic update
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, lovable_project_id: lovableProjectId, lovable_project_url: canonicalUrl }
          : p
      )
    );
    return true;
  } catch (error) {
    console.error('Error linking project:', error);
    return false;
  }
}, []);
```

Update `fetchProjects` to include new columns in mapping:

```typescript
const projectsWithFeatures: Project[] = dbProjects.map((p) => ({
  id: p.id,
  user_id: p.user_id,
  name: p.name,
  lovable_project_id: p.lovable_project_id || null,    // NEW
  lovable_project_url: p.lovable_project_url || null,  // NEW
  features: /* ... */,
  created_at: p.created_at,
  updated_at: p.updated_at,
}));
```

Add `findProjectByLovableId` helper:

```typescript
const findProjectByLovableId = useCallback((lovableId: string): Project | null => {
  return projects.find(p => p.lovable_project_id === lovableId) || null;
}, [projects]);
```

**4. Auto-Detect Behavior Preservation**

In `Dashboard.tsx`, enhance the existing auto-detect logic:

```typescript
// Existing behavior: auto-select project when tab changes
useEffect(() => {
  if (loading) return;
  
  // Check for lovable_project_id match first (new linked projects)
  if (detectedLovableId) {
    const matchByLovableId = findProjectByLovableId(detectedLovableId);
    if (matchByLovableId) {
      setActiveProject(matchByLovableId.id);
      return;
    }
  }
  
  // Fallback to existing name-based matching (pageInfo.projectName)
  if (pageInfo?.isLovable && pageInfo.projectName) {
    const existingProject = findProjectByName(pageInfo.projectName);
    if (existingProject) {
      setActiveProject(existingProject.id);
    } else {
      setSuggestedProjectName(pageInfo.projectName);
      setShowNewProjectDialog(true);
    }
  }
}, [detectedLovableId, pageInfo, findProjectByLovableId, findProjectByName, setActiveProject, loading]);
```

**5. ProjectSelector Component Updates**

Add new props:

```typescript
interface ProjectSelectorProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onDeleteProject: (projectId: string) => void;
  // NEW: Extension-only inline action button
  inlineAction?: {
    type: 'load' | 'link';
    onAction: () => void;
    disabled?: boolean;
  } | null;
}
```

Layout change:

```tsx
<div className="px-4 py-3 border-b border-border">
  <div className="flex items-center gap-2">
    {/* Dropdown - flex-1 to fill available space */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex-1 min-w-0 justify-between bg-background hover:bg-muted"
        >
          <span className="truncate">
            {activeProject?.name || 'Select Project'}
          </span>
          <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent /* ... */ >
        {/* ... existing content ... */}
      </DropdownMenuContent>
    </DropdownMenu>
    
    {/* Inline action button - only when inlineAction provided */}
    {inlineAction && (
      <Button
        size="sm"
        variant={inlineAction.type === 'load' ? 'default' : 'secondary'}
        className="shrink-0 h-9 px-3 font-medium"
        onClick={inlineAction.onAction}
        disabled={inlineAction.disabled}
        title={inlineAction.type === 'load' 
          ? 'Load selected project in this tab' 
          : 'Link selected project to this Lovable tab'}
      >
        {inlineAction.type === 'load' ? 'Load' : 'Link'}
      </Button>
    )}
  </div>
</div>
```

**6. Dashboard Integration**

Add state computation and handlers:

```tsx
// Get tab state from useChromeMessaging
const { 
  isExtension, 
  detectedLovableId, 
  isOnLovableHost,
  navigateActiveTab,
  isRestrictedTab 
} = useChromeMessaging();

// Get linkProject from useProjects
const { /* existing */, linkProject, findProjectByLovableId } = useProjects();

// Compute inline action state
const selectedLovableId = activeProject?.lovable_project_id || null;

const inlineAction = useMemo(() => {
  if (!isExtension) return null;  // Web app: no inline action
  
  // MATCHED: no button
  if (selectedLovableId && selectedLovableId === detectedLovableId) {
    return null;
  }
  
  // MISMATCH: show Load
  if (selectedLovableId && selectedLovableId !== detectedLovableId) {
    return {
      type: 'load' as const,
      onAction: handleLoadProject,
      disabled: isRestrictedTab,
    };
  }
  
  // UNLINKED + on Lovable: show Link
  if (!selectedLovableId && detectedLovableId) {
    return {
      type: 'link' as const,
      onAction: handleLinkProject,
      disabled: false,
    };
  }
  
  // UNLINKED + not on Lovable: no button
  return null;
}, [isExtension, selectedLovableId, detectedLovableId, isRestrictedTab]);

// Handler: Load project (navigate to canonical URL)
const handleLoadProject = useCallback(async () => {
  if (!selectedLovableId) return;
  
  // Always use canonical URL
  const url = `https://lovable.dev/projects/${selectedLovableId}`;
  
  // Confirm if not already on Lovable
  if (!isOnLovableHost) {
    const confirmed = window.confirm('This will replace the current page. Continue?');
    if (!confirmed) return;
  }
  
  const success = await navigateActiveTab(url);
  if (!success) {
    toast({
      title: 'Cannot navigate',
      description: 'This tab cannot be navigated.',
      variant: 'destructive',
    });
  }
}, [selectedLovableId, isOnLovableHost, navigateActiveTab, toast]);

// Handler: Link project (save canonical URL)
const handleLinkProject = useCallback(async () => {
  if (!activeProject || !detectedLovableId) return;
  
  // linkProject() internally stores canonical URL
  const success = await linkProject(activeProject.id, detectedLovableId);
  
  if (success) {
    toast({
      title: 'Project linked!',
      description: `"${activeProject.name}" is now linked to this Lovable project.`,
    });
  } else {
    toast({
      title: 'Link failed',
      description: 'Could not save the link. Please try again.',
      variant: 'destructive',
    });
  }
}, [activeProject, detectedLovableId, linkProject, toast]);
```

---

### Permissions Verification

Current `manifest.json` permissions:

```json
{
  "permissions": ["sidePanel", "scripting", "activeTab", "storage", "tabs", "identity", "clipboardWrite"],
  "host_permissions": ["https://*.lovable.dev/*", "https://*.lovable.app/*"]
}
```

- `tabs` permission: Allows reading tab URLs and updating tabs - **sufficient**
- `host_permissions`: Scoped to lovable.dev and lovable.app - **no changes needed**
- No `<all_urls>` required

---

### Safety Guarantees

| Concern | Solution |
|---------|----------|
| No UUIDs in UI | Dropdown shows `projects.name` only; button labels are "Load"/"Link" |
| Auto-detect preserved | Tab switch triggers existing logic + new `findProjectByLovableId` check |
| Manual selection unchanged | Dropdown works exactly as before; button only navigates on click |
| Canonical URL | Always store `https://lovable.dev/projects/<uuid>` regardless of current tab's query/hash |
| Restricted tabs | Block all non-HTTP(S) URLs; show disabled button with toast |
| Listener cleanup | useEffect returns cleanup function to remove listeners on unmount |
| Web app safety | All chrome.* calls guarded by `isExtension` check |

---

### Summary

1. Add database migration for `lovable_project_id` and `lovable_project_url` columns
2. Update `Project` and `DbProject` types with new optional fields
3. Enhance `useChromeMessaging` with:
   - `parseLovableProjectId()` using corrected regex `[/?#]`
   - `isRestrictedUrl()` checking for non-HTTP(S) protocols
   - Tab URL tracking with 200ms debounce and cleanup on unmount
   - `navigateActiveTab()` with restricted tab checking
4. Add `linkProject()` to `useProjects` storing canonical URL
5. Add `findProjectByLovableId()` helper for auto-detect matching
6. Modify `ProjectSelector` to accept and render optional inline action button
7. Wire up state detection and handlers in Dashboard
8. Preserve existing auto-detect behavior with enhanced lovable_project_id matching

