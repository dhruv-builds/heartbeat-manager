

## Implement AI "Generate Prompt" Feature

### Overview
Add an AI-powered "Generate with AI" button to the Feature Detail Sheet that:
1. Scrapes the current Lovable page content via Chrome extension messaging
2. Fetches completed features from the current project for context
3. Calls a Supabase Edge Function that uses Perplexity API to generate a technical prompt
4. Streams the AI response directly into the Prompt textarea

---

### Phase 1: Create Supabase Edge Function

**New File: `supabase/functions/generate-feature-prompt/index.ts`**

Create the edge function that:
- Accepts `pageContent`, `featureTitle`, and `existingFeatures` from the request body
- Calls Perplexity API with the `llama-3.1-sonar-large-128k-online` model
- Uses the detailed system prompt for technical product management
- Returns a streaming SSE response for real-time token display
- Handles errors (402 Payment Required, 429 Rate Limit)

**Update: `supabase/config.toml`**

Add function configuration:
```toml
[functions.generate-feature-prompt]
verify_jwt = false
```

---

### Phase 2: Add Page Scraping to Chrome Extension

**Update: `public/content.js`**

Add a new message handler `SCRAPE_PAGE_CONTENT` that extracts `document.body.innerText` from the active tab and returns it to the extension.

**Update: `src/hooks/useChromeMessaging.ts`**

Add a new `scrapePageContent` function that:
- Sends `SCRAPE_PAGE_CONTENT` message to the active tab
- Returns the page text content
- Provides mock content in dev mode (when not running as extension)
- Update the `chrome.tabs.sendMessage` TypeScript declaration to include the new response type

---

### Phase 3: Create useGeneratePrompt Hook

**New File: `src/hooks/useGeneratePrompt.ts`**

Create a custom hook that:
- Manages `isGenerating` loading state
- Handles the streaming fetch to the edge function
- Parses SSE responses line-by-line for real-time token display
- Calls `onDelta(chunk)` for each received token
- Calls `onDone()` when generation completes
- Handles 402/429 errors with appropriate error messages

---

### Phase 4: Update FeatureDetailSheet UI

**Update: `src/components/heartbeat/FeatureDetailSheet.tsx`**

Interface changes:
- Add `existingFeatures` prop to receive all project features
- Import `Sparkles` and `Loader2` icons from lucide-react
- Import the new hooks (`useGeneratePrompt`, `useChromeMessaging`)

UI changes:
- Add a "Generate with AI" button next to the "Prompt" label
- Button shows sparkle icon normally, spinner when generating
- Button is disabled when generating or when title is empty

Logic:
- On click: scrape page content, filter done features, clear prompt textarea
- Stream AI response directly into textarea using `setLocalPrompt`
- Show toast on success/error

---

### Phase 5: Wire Up Dashboard

**Update: `src/pages/Dashboard.tsx`**

- Pass `activeProject?.features` as `existingFeatures` prop to `FeatureDetailSheet`

---

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/generate-feature-prompt/index.ts` | Edge function calling Perplexity API |
| `src/hooks/useGeneratePrompt.ts` | Hook for AI generation with streaming |

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add function config with `verify_jwt = false` |
| `public/content.js` | Add `SCRAPE_PAGE_CONTENT` handler |
| `src/hooks/useChromeMessaging.ts` | Add `scrapePageContent` function |
| `src/components/heartbeat/FeatureDetailSheet.tsx` | Add AI button + generation logic |
| `src/pages/Dashboard.tsx` | Pass features to sheet |

---

### Technical Details

**Streaming Implementation:**
- Edge function streams Perplexity response directly to client
- Frontend parses SSE `data: {...}` lines
- Handles `[DONE]` marker and partial JSON chunks
- Updates textarea character-by-character for smooth UX

**Error Handling:**
- 402 (Payment Required) - Toast about API credits
- 429 (Rate Limit) - Toast to retry later
- Network errors - Generic error toast
- Missing API key - Server-side error response

**System Prompt for Perplexity:**
```
You are an expert Technical Product Manager. Your goal is to write a precise, actionable development prompt for an AI coding assistant (like Lovable or Cursor) to build a specific feature.

Input Context:
- Project Context: A raw dump of the current webpage text. Use this to understand the app's current theme, tech stack, and content.
- Completed Features: A list of features already built. Use this to ensure consistency and avoid duplication.
- Target Feature: The title of the feature the user wants to build.

Output Requirements:
- Write a clear, step-by-step prompt that I can paste into an AI builder.
- Focus on technical implementation details (e.g., 'Update the database schema to add X', 'Create a new React component for Y').
- Keep it concise but comprehensive. Do not include introductory fluff like 'Here is your prompt'. Just output the prompt itself.
```

