

## Comprehensive Onboarding Flow for LovaLog

This plan implements 5 areas of onboarding improvements with one modification from the original: the "Empty Context" nudge banner will appear even when the feature list is empty (before any features are added).

---

### 1. Empty State Logic (No Active Project)

**File:** `src/pages/Dashboard.tsx`

Replace the current generic empty state (the block that shows "Create your first project" / "Select a project") with two environment-aware scenarios:

**Scenario A -- Not on Lovable (or Web Dashboard):**
- `GradientLogo` component (small)
- `Globe` Lucide icon as browser illustration
- Headline: "Welcome to LovaLog"
- Body: "Navigate to a project on Lovable to create your first LovaLog."
- Primary button: "Go to Lovable" -- extension calls `navigateActiveTab('https://lovable.dev/')`, web opens new tab

**Scenario B -- On Lovable (Extension detects Lovable host):**
- `GradientLogo` component (small)
- Headline: "Ready to build?"
- Body: "Select a project from Lovable to start tracking features."

Detection uses the existing `isOnLovableHost` boolean from `useChromeMessaging`. Web dashboard defaults to Scenario A.

---

### 2. "Link Project" Modal Redesign

**File:** `src/components/heartbeat/NewProjectDialog.tsx`

When `suggestedName` is present (Lovable project detected):

| Element | Current | New |
|---------|---------|-----|
| Headline | "Start Heartbeat" or similar | "Let's start the LovaLog!" |
| Icon | White Heart with fill | Heart icon with brand gradient class (pink/orange) |
| Body | Keep as-is | Keep as-is |
| Primary button label | "Create Project" | "Start Logging" |
| Primary button style | Current | Solid brand purple background, white text |
| Cancel button | `variant="outline"` | `variant="ghost"` with muted text |

When `suggestedName` is NOT present (manual creation), keep existing "New Project" title and "Create Project" label.

---

### 3. Main Project View Updates

#### 3a. Link Button Styling

**File:** `src/components/heartbeat/ProjectSelector.tsx`

When `inlineAction.type === 'link'`, apply:
- Solid brand purple background: `bg-[hsl(var(--brand-purple))] text-white`
- Pulse animation: `animate-pulse`

#### 3b. "Empty Context" Nudge Banner (UPDATED)

**File:** `src/components/heartbeat/FeatureList.tsx`

Add new props: `hasContext: boolean` and `onOpenContext: () => void`.

Render a small dismissible amber banner **whenever `hasContext` is false** -- regardless of whether features exist or not. This ensures users are nudged to add context before their first feature, so their first AI prompt is already context-aware.

- Copy: "0% Context. Add your Tech Stack/Vision to get smarter AI prompts."
- Click action opens the Project Context sheet
- Dismissible via a small X button (component-level `useState`, resets per session)
- Positioned at the top of the feature list area, above both the empty state and the drag-drop list

**File:** `src/pages/Dashboard.tsx` -- pass the new props:
- `hasContext={hasContext}`
- `onOpenContext={() => setIsContextSheetOpen(true)}`

#### 3c. Feature List Empty State

**File:** `src/components/heartbeat/FeatureList.tsx`

Replace the current minimal empty state with:
- Headline: "Let's build something new."
- Sub-headline: "Add your first feature to start the flow."
- Prominent centered "+ Add Feature" button in brand purple that triggers `setIsAdding(true)`

---

### 4. "Add Feature" Input Placeholder

**File:** `src/components/heartbeat/FeatureList.tsx`

Change `placeholder="Feature name..."` to `placeholder="What do you want to build?"`

---

### 5. "Edit Feature" and Prompt Generation UI

**File:** `src/components/heartbeat/FeatureDetailSheet.tsx`

#### 5a. Instructional Copy (Conditional)

Add new prop: `totalFeatureCount: number`.

When `totalFeatureCount < 5`, render a subtle bordered text block above the prompt textarea:
- Copy: "Write/paste your own detailed prompt, or click Generate with AI to let us write it for you! You can also paste a screenshot for context."
- Style: `text-xs text-muted-foreground` in a light bordered box

#### 5b. Footer Copy (Conditional)

When `feature.prompt` is not empty AND in extension mode, render helper text above the Inject button:
- Copy: "Ready? Inject this prompt directly into Lovable to start building."
- Style: `text-xs text-muted-foreground text-center`

**File:** `src/pages/Dashboard.tsx` -- pass `totalFeatureCount={activeProject.features.length}` to `FeatureDetailSheet`.

---

### Technical Summary

| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Environment-aware empty states with GradientLogo and Globe icon; pass `hasContext`, `onOpenContext`, `totalFeatureCount` props to child components |
| `src/components/heartbeat/NewProjectDialog.tsx` | Gradient heart icon, "Let's start the LovaLog!" headline, "Start Logging" purple button, ghost cancel button (conditional on suggestedName) |
| `src/components/heartbeat/ProjectSelector.tsx` | Solid brand purple background and pulse animation on Link button |
| `src/components/heartbeat/FeatureList.tsx` | Context nudge banner (shown even with zero features), new empty state copy and button, "What do you want to build?" placeholder, two new props |
| `src/components/heartbeat/FeatureDetailSheet.tsx` | Conditional instructional copy above textarea when fewer than 5 features, conditional footer copy above inject button, new `totalFeatureCount` prop |

