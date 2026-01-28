

## Fix 'Generate with AI' Scraping - Bug Fix Plan

### Problem Identified
The `scrapePageContent` function in `src/hooks/useChromeMessaging.ts` is failing to extract page text properly, resulting in empty content being sent to the Supabase Edge Function, causing 400 errors.

### Root Cause
The current implementation uses message passing via `chrome.tabs.sendMessage` to communicate with the content script. The user has identified that using `chrome.scripting.executeScript` is more reliable for this use case.

---

### Fix 1: Update `src/hooks/useChromeMessaging.ts`

**Change:** Replace the message-passing approach with direct script injection using `chrome.scripting.executeScript`.

**Technical Details:**
- Add `chrome.scripting` to the TypeScript declarations
- Modify `scrapePageContent` to use `executeScript` instead of `sendMessage`
- Properly access the `.result` property from the first frame result: `results?.[0]?.result`
- Return empty string on failure instead of `null` for safer handling

```typescript
// Add to chrome type declaration:
scripting?: {
  executeScript: (options: {
    target: { tabId: number };
    func: () => string;
  }) => Promise<Array<{ result: string }>>;
};

// Updated scrapePageContent function:
const scrapePageContent = useCallback(async (): Promise<string | null> => {
  if (!isExtension) {
    return "Development mode - mock page content...";
  }

  try {
    const [tab] = await chrome.tabs!.query({ active: true, currentWindow: true });
    if (!tab?.id) return "";

    const results = await chrome.scripting!.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText,
    });

    // Return the .result property from the first frame
    return results?.[0]?.result || "";
  } catch (error) {
    console.error("Scraping failed:", error);
    return "";
  }
}, [isExtension]);
```

---

### Fix 2: Update `src/components/heartbeat/FeatureDetailSheet.tsx`

**Change:** Add a fallback in `handleGeneratePrompt` to ensure non-empty content is sent to the AI.

**Technical Details:**
- Use nullish coalescing with a fallback message when scraping returns empty/null

```typescript
// In handleGeneratePrompt function, line 109:
const pageContent = (await scrapePageContent()) || "No page content available.";
```

---

### Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useChromeMessaging.ts` | Refactor `scrapePageContent` to use `chrome.scripting.executeScript` with proper result extraction |
| `src/components/heartbeat/FeatureDetailSheet.tsx` | Add fallback for empty page content |

---

### Why This Fix Works

1. **Direct Script Execution**: `chrome.scripting.executeScript` directly runs JavaScript in the target tab's context, bypassing potential content script messaging issues
2. **Proper Result Access**: The `executeScript` API returns an array of injection results; each result has a `.result` property containing the return value from the injected function
3. **Fallback Protection**: Even if scraping fails completely, the AI will receive a placeholder message instead of `null` or empty string, preventing 400 errors

### Notes
- The `scripting` permission is already present in `manifest.json` (line 16)
- The content script handler `SCRAPE_PAGE_CONTENT` in `public/content.js` can remain as a fallback but won't be used by this new approach
- Return type changes from `string | null` to always returning a string (empty string on failure)

