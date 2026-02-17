

## Three Updates: Load Button, Context Button, Credits Background Checking

---

### 1. Load Button -- Smart Hiding + Web Dashboard Support

**Current behavior**: The Load button only appears in the extension. It is disabled on restricted tabs (chrome://, edge://) and hidden when the selected project matches the detected tab.

**New behavior**:

- **Extension**: Hide Load when active tab URL matches the project URL (existing). For mismatches, always show Load (never disabled). On click: navigate current tab for standard pages, open new tab for system pages (chrome://, edge://, about:, new tab).
- **Web Dashboard**: Show Load button when the project has a `lovable_project_id`. On click: always open in a **new tab** via `window.open()`.

**Files to modify**:

| File | Change |
|------|--------|
| `src/hooks/useChromeMessaging.ts` | Add `chrome.tabs.create` to type declaration. Update `navigateActiveTab` to use `chrome.tabs.create` for restricted URLs instead of returning false. |
| `src/pages/Dashboard.tsx` | Update `inlineAction` memo: remove `if (!isExtension) return null` guard. For web mode, return a Load action that uses `window.open`. Remove `disabled: isRestrictedTab` from extension Load action. |

**Detail for `navigateActiveTab`** (useChromeMessaging.ts lines 226-243):
```typescript
const navigateActiveTab = useCallback(async (url: string): Promise<boolean> => {
  if (!isExtension) return false;
  try {
    const tabs = await chrome.tabs!.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab?.id) return false;
    
    if (isRestrictedUrl(tab.url || null)) {
      // System page -- open in new tab instead
      await chrome.tabs!.create({ url });
    } else {
      await chrome.tabs!.update(tab.id, { url });
    }
    return true;
  } catch {
    return false;
  }
}, [isExtension]);
```

**Detail for `inlineAction` memo** (Dashboard.tsx lines 128-156):
```typescript
const inlineAction = useMemo(() => {
  // MATCHED: hide button (both extension and web)
  if (selectedLovableId && selectedLovableId === detectedLovableId) {
    return null;
  }

  // Extension: show Load for linked projects (never disabled)
  if (isExtension && selectedLovableId && selectedLovableId !== detectedLovableId) {
    return { type: 'load', onAction: handleLoadProject, disabled: false };
  }

  // Web dashboard: show Load for linked projects (opens new tab)
  if (!isExtension && selectedLovableId) {
    return {
      type: 'load',
      onAction: () => window.open(`https://lovable.dev/projects/${selectedLovableId}`, '_blank'),
      disabled: false,
    };
  }

  // UNLINKED + on Lovable: show Link (extension only)
  if (isExtension && !selectedLovableId && detectedLovableId) {
    return { type: 'link', onAction: handleLinkProject, disabled: false };
  }

  return null;
}, [...]);
```

Also remove the confirmation dialog from `handleLoadProject` for non-Lovable pages since system tabs are handled gracefully now, and standard page navigation is the expected behavior.

---

### 2. Context Button -- "Add Context" Label When Empty

**Current behavior**: A small icon-only button with FileText icon. Purple when context exists, muted when empty.

**New behavior**: When context is empty, render a text button with Plus icon and "Add Context" label in the brand purple color. When context exists, keep existing icon button unchanged.

**File to modify**: `src/pages/Dashboard.tsx` (lines 283-293)

```tsx
{activeProject && (
  hasContext ? (
    <Button variant="ghost" size="icon" className="h-6 w-6 relative"
      onClick={() => setIsContextSheetOpen(true)}>
      <FileText className="w-3.5 h-3.5 text-brand-purple" />
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-purple rounded-full" />
    </Button>
  ) : (
    <Button variant="ghost" size="sm"
      className="h-6 px-2 text-brand-purple hover:text-brand-purple gap-1"
      onClick={() => setIsContextSheetOpen(true)}>
      <Plus className="w-3 h-3" />
      <span className="text-xs font-medium">Add Context</span>
    </Button>
  )
)}
```

Import `Plus` from lucide-react (already available in the project).

---

### 3. Credits -- Background Polling and Smarter Invalidation

This requires changes across three files: the background service worker, the content script, and the React hook.

#### 3a. Background Service Worker (`public/background.js`)

Add two mechanisms:

1. **5-minute polling alarm**: Use `chrome.alarms` API to fire every 5 minutes. On alarm, check if the active tab is on lovable.dev/lovable.app. If yes, send a `CHECK_CREDITS` message to the content script. Broadcast the result as `CREDITS_UPDATE` to the side panel.

2. **Tab load completion trigger**: Enhance the existing `chrome.tabs.onUpdated` listener. When `changeInfo.status === 'complete'` and the URL is Lovable, immediately trigger a credits check on that tab.

```javascript
// Alarm-based polling (every 5 minutes)
chrome.alarms.create('credits-check', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'credits-check') return;
  await checkCreditsOnActiveTab();
});

// Tab finished loading on Lovable
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url &&
      (tab.url.includes('lovable.dev') || tab.url.includes('lovable.app'))) {
    await checkCreditsOnTab(tabId);
  }
  // existing URL change logic...
});

async function checkCreditsOnActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && tab.url &&
        (tab.url.includes('lovable.dev') || tab.url.includes('lovable.app'))) {
      await checkCreditsOnTab(tab.id);
    }
  } catch (e) { /* ignore */ }
}

async function checkCreditsOnTab(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_CREDITS' });
    // Broadcast result to side panel
    chrome.runtime.sendMessage({
      type: 'CREDITS_UPDATE',
      data: response
    }).catch(() => {});
  } catch (e) { /* content script not loaded */ }
}
```

#### 3b. Content Script (`public/content.js`)

**Prompt submission fix**: Change `setupCreditsInvalidation` so that when a prompt is submitted, instead of setting status to `'none'`, it:
1. Sets status to `'unknown'` (neutral/gray "Check Status" state)
2. Sends `CREDITS_INVALIDATED` instead of `CREDITS_CONSUMED`
3. Triggers a delayed re-check after 3 seconds by sending a self-message

```javascript
// In the Enter key and Send button listeners:
localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify({
  status: 'unknown',
  date: today
}));
chrome.runtime.sendMessage({ type: 'CREDITS_INVALIDATED' });

// Schedule a re-check after 3 seconds
setTimeout(() => {
  handleGetCredits((result) => {
    chrome.runtime.sendMessage({
      type: 'CREDITS_UPDATE',
      data: result
    }).catch(() => {});
  });
}, 3000);
```

#### 3c. React Hook (`src/hooks/useCredits.ts`)

1. **Listen for `CREDITS_UPDATE` messages** from the background script (in addition to existing `CREDITS_CONSUMED` listener). When received, update state directly from the payload.

2. **Listen for `CREDITS_INVALIDATED`**: Set `freeCreditsAvailable` to `null` (which renders as "Check Status" / gray / neutral).

3. **Remove or reduce the 60-second interval** since background polling now handles periodic checks.

```typescript
// Updated message listener
const handleMessage = (message: { type: string; data?: CreditsResponse }) => {
  if (message.type === 'CREDITS_UPDATE' && message.data) {
    setCredits({
      freeCreditsAvailable: message.data.freeCreditsAvailable ?? null,
      lastUpdated: new Date(),
    });
    setError(null);
  }
  if (message.type === 'CREDITS_INVALIDATED') {
    // Go to neutral "Check Status" state, not red "None"
    setCredits({
      freeCreditsAvailable: null,
      lastUpdated: new Date(),
    });
  }
};
```

#### Manifest Update (`public/manifest.json`)

Add `"alarms"` to the permissions array so the background script can use `chrome.alarms`.

---

### Summary of All Files

| File | Changes |
|------|---------|
| `src/hooks/useChromeMessaging.ts` | Add `create` to chrome.tabs type; update `navigateActiveTab` for restricted tabs |
| `src/pages/Dashboard.tsx` | Load button for web + extension; remove disabled; context button "Add Context" label; import Plus |
| `public/background.js` | Add alarms polling, tab-complete credits check, helper functions |
| `public/content.js` | Change invalidation from "none" to "unknown", add delayed re-check |
| `src/hooks/useCredits.ts` | Listen for CREDITS_UPDATE and CREDITS_INVALIDATED, remove 60s interval |
| `public/manifest.json` | Add "alarms" permission |

