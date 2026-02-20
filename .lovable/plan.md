

## Persistent `is_merged` Flag + Icon Update

Two changes: make the `is_merged` field persistent across sessions by reading/writing it from the database, and swap the extension header icon from `app-logo.png` to `icon-128.png`.

---

### Files Changed

| File | Change |
|------|--------|
| `src/types/heartbeat.ts` | Make `is_merged` required (with default `false`), add to `DbFeature` |
| `src/hooks/useProjects.ts` | Read `is_merged` from DB in fetch, write it in `createFeature`, `createMergedFeature`, `duplicateFeature` |
| `src/components/heartbeat/Header.tsx` | Swap `app-logo.png` to `icon-128.png` |

---

### 1. Type Definitions (`src/types/heartbeat.ts`)

**`Feature` interface (line 11):**
- Change `is_merged?: boolean` to `is_merged: boolean` (required).

**`DbFeature` interface (line 54):**
- Add `is_merged: boolean` field.

---

### 2. Feature Fetching (`src/hooks/useProjects.ts`, lines 64-74)

In the `.map()` that builds `Feature` objects from DB rows, add:
```typescript
is_merged: f.is_merged ?? false,
```

This ensures all fetched features populate the field. The `?? false` handles any null/undefined values from older rows.

---

### 3. Feature Creation (`src/hooks/useProjects.ts`)

**`createFeature` (line 196):** Add `is_merged: false` to the insert object.
**`createFeature` optimistic object (line 209):** Add `is_merged: false` (or read from `data.is_merged`).

**`createMergedFeature` (line 475):** Add `is_merged: true` to the insert object. The optimistic object at line 497 already has `is_merged: true` -- no change needed there.

**`duplicateFeature` (line 332):** Carry forward the source feature's `is_merged` value in the insert. Map it in the optimistic object too.

---

### 4. Extension Header Icon (`src/components/heartbeat/Header.tsx`, line 53-56)

Change:
```tsx
<img src="./app-logo.png" alt="LovaLog" className="w-6 h-6 object-contain" />
```
To:
```tsx
<img src="./icon-128.png" alt="LovaLog" className="w-6 h-6 object-contain" />
```

The `w-6 h-6` sizing stays the same to keep it consistent with surrounding elements (the text and buttons are all `h-8` / `text-base`).

---

### 5. No UI Changes Needed for FeatureItem

`FeatureItem.tsx` already receives `isMerged` as a prop and renders the `<Merge />` icon badge. The `FeatureList.tsx` already passes `isMerged={feature.is_merged}`. Since we're now reading this from the DB, the badge will persist across refreshes -- no component changes required.

