

## Task Sequencing + Website Extension-Only Controls

### Overview

Implement two updates:
1. **Task Sequencing**: Consistent, dynamic sorting of features on both website and extension
2. **Website Controls**: Hide extension-only UI (Free Credits, Inject buttons) on the website

---

### A) Task Sequencing

#### Status Value Migration

Change the status type from `'in-progress'` to `'next'`:

```typescript
// src/types/heartbeat.ts
export type FeatureStatus = 'backlog' | 'next' | 'done';  // was 'in-progress'
```

**Note**: The UI already shows "Next" for 'in-progress' - this just aligns the data model.

#### Shared Sorting Utilities

Create a new file `src/lib/featureSorting.ts` with pure functions:

```typescript
import { Feature } from '@/types/heartbeat';

// Status priority for active section
const STATUS_PRIORITY: Record<string, number> = {
  'next': 0,
  'in-progress': 0,  // Backwards compatibility
  'backlog': 1,
};

// Filter functions
export function getActiveFeatures(features: Feature[]): Feature[] {
  return features.filter(f => f.status !== 'done');
}

export function getCompletedFeatures(features: Feature[]): Feature[] {
  return features.filter(f => f.status === 'done');
}

// Sorting functions
export function sortActiveFeatures(features: Feature[]): Feature[] {
  return [...features].sort((a, b) => {
    // 1. Status priority: 'next' first, 'backlog' second
    const statusDiff = (STATUS_PRIORITY[a.status] ?? 1) - (STATUS_PRIORITY[b.status] ?? 1);
    if (statusDiff !== 0) return statusDiff;
    
    // 2. Manual order ascending
    const orderDiff = a.order - b.order;
    if (orderDiff !== 0) return orderDiff;
    
    // 3. Updated at DESC (most recent first)
    const updatedDiff = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    if (updatedDiff !== 0) return updatedDiff;
    
    // 4. Created at ASC (oldest first)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function sortCompletedFeatures(features: Feature[]): Feature[] {
  return [...features].sort((a, b) => {
    // 1. Updated at DESC (most recently completed first)
    const updatedDiff = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    if (updatedDiff !== 0) return updatedDiff;
    
    // 2. Created at DESC (tie-breaker)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
```

#### Update FeatureList.tsx

Replace current sorting with memoized calls to shared utilities:

```typescript
import { useMemo } from 'react';
import { 
  getActiveFeatures, 
  getCompletedFeatures, 
  sortActiveFeatures, 
  sortCompletedFeatures 
} from '@/lib/featureSorting';

// Inside component:
const activeTasks = useMemo(
  () => sortActiveFeatures(getActiveFeatures(features)),
  [features]
);

const completedTasks = useMemo(
  () => sortCompletedFeatures(getCompletedFeatures(features)),
  [features]
);

// Remove old sorting: const sortedFeatures = [...features].sort((a, b) => a.order - b.order);
```

#### Update StatusBadge.tsx

Change 'in-progress' to 'next' in config and cycle logic:

```typescript
const statusConfig: Record<FeatureStatus, { label: string; className: string }> = {
  'backlog': {
    label: 'Backlog',
    className: 'bg-muted text-muted-foreground hover:bg-muted/80',
  },
  'next': {  // Changed from 'in-progress'
    label: 'Next',
    className: 'bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30',
  },
  'done': {
    label: 'Done',
    className: 'bg-green-500/20 text-green-400 hover:bg-green-500/30',
  },
};

export function getNextStatus(current: FeatureStatus): FeatureStatus {
  const order: FeatureStatus[] = ['backlog', 'next', 'done'];  // Changed from 'in-progress'
  const currentIndex = order.indexOf(current);
  return order[(currentIndex + 1) % order.length];
}
```

---

### B) Website - Hide Extension-Only Controls

#### Hide CreditsBadge on Website

In `Dashboard.tsx`, conditionally render CreditsBadge:

```tsx
{/* Credits + Project Selector Row */}
<div className="flex items-center justify-between px-4 py-2 border-b border-border">
  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
    Project
  </span>
  {isExtension && <CreditsBadge />}
</div>
```

#### Hide Inject Buttons

**Approach**: Pass `isExtension` to FeatureList, which passes it to FeatureItem and FeatureDetailSheet.

**FeatureList.tsx** - Add prop:

```typescript
interface FeatureListProps {
  // ... existing props
  isExtension?: boolean;  // NEW
}

// Pass to FeatureItem:
<FeatureItem
  // ... existing props
  showInjectButton={isExtension}
/>
```

**FeatureItem.tsx** - Conditionally render inject button:

```typescript
interface FeatureItemProps {
  // ... existing props
  showInjectButton?: boolean;  // NEW
}

// In render, wrap inject button:
{showInjectButton && (
  <Button
    size="icon"
    variant="ghost"
    className="h-7 w-7 text-brand-purple hover:text-brand-purple hover:bg-brand-purple/20"
    onClick={(e: React.MouseEvent) => {
      e.stopPropagation();
      onInject();
    }}
    title="Inject Prompt"
    disabled={!feature.prompt}
  >
    <Zap className="w-4 h-4" />
  </Button>
)}
```

**FeatureDetailSheet.tsx** - Conditionally render inject section:

```typescript
interface FeatureDetailSheetProps {
  // ... existing props
  isExtension?: boolean;  // NEW
}

// In render, wrap entire inject button section:
{isExtension && (
  <div className="pt-4 border-t border-border">
    {/* existing inject button(s) */}
  </div>
)}

// Optional: Show subtle CTA on website
{!isExtension && (
  <div className="pt-4 border-t border-border text-center">
    <p className="text-xs text-muted-foreground">
      Install the extension to inject prompts
    </p>
  </div>
)}
```

**Dashboard.tsx** - Pass isExtension to components:

```tsx
<FeatureList
  // ... existing props
  isExtension={isExtension}
/>

<FeatureDetailSheet
  // ... existing props
  isExtension={isExtension}
/>
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/heartbeat.ts` | Change `'in-progress'` to `'next'` in FeatureStatus |
| `src/lib/featureSorting.ts` | **NEW** - Shared sorting utilities |
| `src/components/heartbeat/FeatureList.tsx` | Use memoized sorting, pass `isExtension` |
| `src/components/heartbeat/FeatureItem.tsx` | Add `showInjectButton` prop |
| `src/components/heartbeat/FeatureDetailSheet.tsx` | Add `isExtension` prop, hide inject UI |
| `src/components/heartbeat/StatusBadge.tsx` | Update status config and cycle |
| `src/pages/Dashboard.tsx` | Conditionally render CreditsBadge, pass isExtension |

---

### Behavioral Summary

| Behavior | Extension | Website |
|----------|-----------|---------|
| **Active section sorting** | 'next' first, then 'backlog', by order | Same |
| **Completed section sorting** | updated_at DESC | Same |
| **Status change moves task** | Yes, immediate re-render | Same |
| **Free Credits badge** | Visible | Hidden |
| **Quick inject button (card)** | Visible | Hidden |
| **Main inject button (sheet)** | Visible | Hidden (shows CTA) |
| **All other CRUD** | Works | Works |

---

### Backwards Compatibility

The sorting function includes `'in-progress': 0` in the priority map to handle any existing database records that haven't been migrated yet. These will sort alongside 'next' correctly.

