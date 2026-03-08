

## Three Changes: New Icon, Always-Visible Merge Button, Footer Copy

---

### 1. New Extension Icon

Copy the uploaded SVG to the public directory as the new extension icon, then update references in `Header.tsx` and `GradientLogo.tsx`.

**File: `public/lovalog-icon.svg`** (new)
- Copy from `user-uploads://Copy_of_Lovalog_Logo_for_Chrome_extension.svg`

**File: `src/components/heartbeat/Header.tsx` (line 54)**
- Change `src="./icon-128.png"` to `src="./lovalog-icon.svg"`
- Keep `w-6 h-6 object-contain` sizing

**File: `src/components/ui/GradientLogo.tsx` (lines 31, 42)**
- Change both `src="/app-logo.png"` to `src="/lovalog-icon.svg"`
- Keep existing sizing (bare mode sizes and container icon sizes remain unchanged)

---

### 2. Always-Visible Merge Button

**File: `src/components/heartbeat/FeatureList.tsx` (line 228)**
- Remove the `{backlogCount >= 2 && (` condition wrapper (and its closing `)}`)
- The merge button will always render in the header
- Selection mode and actual merge execution still require 2+ selected tasks (already handled by `readyToMerge` and `handleMerge` guards)

---

### 3. Footer Copy Update

**File: `src/components/ContactFooter.tsx` (lines 17-26)**

Change the text from:
```
For any feedback please reach out to Dhruv Sondhi
```
To:
```
Please <a href="...">reach out</a> for any feedback
```

The hyperlink stays on "reach out" only, pointing to the same LinkedIn URL. Remove the name "Dhruv Sondhi".

