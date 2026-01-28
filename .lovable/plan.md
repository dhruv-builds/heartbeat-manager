

## Fix: Simplify useGeneratePrompt for Non-Streaming Response

### Problem
The user reports that their deployed Edge Function returns a standard JSON response (with `stream: false`), but the frontend hook is trying to parse it as an SSE stream. This mismatch causes the textarea to remain empty despite the "Prompt generated!" toast appearing.

### Solution
Simplify `src/hooks/useGeneratePrompt.ts` to handle a non-streaming JSON response instead of SSE parsing.

---

### File to Modify

**`src/hooks/useGeneratePrompt.ts`**

#### Current Logic (Complex Streaming)
- Uses `response.body.getReader()` to read chunks
- Parses SSE `data: {...}` lines
- Extracts `choices[0].delta.content` from each chunk
- Calls `onDelta()` for each token incrementally

#### New Logic (Simple JSON)
- Uses `response.json()` to get the full response
- Extracts `choices[0].message.content` from the JSON
- Calls `onDelta()` once with the complete text
- Calls `onDone()` after success

---

### Technical Implementation

Replace lines 59-123 with simplified logic:

```typescript
const data = await response.json();

// Perplexity non-streaming format: choices[0].message.content
const generatedText = data.choices?.[0]?.message?.content;

if (!generatedText) {
  onError("No content received from AI");
  return;
}

// Call onDelta once with the full generated text
onDelta(generatedText);
onDone();
```

### Key Changes Summary

| Aspect | Before (Streaming) | After (Non-Streaming) |
|--------|-------------------|----------------------|
| Response parsing | `getReader()` + chunk loop | `response.json()` |
| Content path | `choices[0].delta.content` | `choices[0].message.content` |
| onDelta calls | Many (per token) | Once (full text) |
| Code complexity | ~70 lines | ~15 lines |

### Notes
- The `onDelta` callback pattern is preserved so the UI code in `FeatureDetailSheet.tsx` doesn't need changes
- The `onDone` callback still fires after completion to trigger the success toast
- Error handling for 402/429 remains unchanged

