

## UX Improvements: Status Rename, Project Sync Fix, and Feature Layout Redesign

### Overview
Three improvements to finalize the app UX:
1. Rename "In Progress" status to "Next"
2. Fix race condition causing duplicate project creation prompts
3. Redesign feature row to a 2-row layout for better readability

---

### Change 1: Rename "In Progress" to "Next"

**File: `src/components/heartbeat/StatusBadge.tsx`**

Update the label in the `statusConfig` object:

```typescript
'in-progress': {
  label: 'Next',  // Changed from 'In Progress'
  className: 'bg-lavalog/20 text-lavalog hover:bg-lavalog/30',
},
```

- Keep the same `'in-progress'` key (no database changes)
- Keep the pink color styling
- Only the display label changes

---

### Change 2: Fix Duplicate Project Creation

**Problem**: The Dashboard's `useEffect` that auto-detects projects runs before `projects` are loaded from Supabase. When `pageInfo` arrives but `projects` is still empty, `findProjectByName` returns `null`, triggering the "Create new project" dialog even when the project exists.

**File: `src/pages/Dashboard.tsx`**

**Solution**: Add a dependency on the `loading` state and only run auto-detection after projects have been fetched.

1. Import `loading` from `useProjects()`:
```typescript
const {
  projects,
  activeProject,
  loading,  // <-- Add this
  setActiveProject,
  // ...
} = useProjects();
```

2. Update the auto-detect useEffect to wait for loading:
```typescript
useEffect(() => {
  // Only run after projects are loaded
  if (loading) return;
  
  if (pageInfo?.isLovable && pageInfo.projectName) {
    const existingProject = findProjectByName(pageInfo.projectName);
    if (existingProject) {
      setActiveProject(existingProject.id);
    } else {
      setSuggestedProjectName(pageInfo.projectName);
      setShowNewProjectDialog(true);
    }
  }
}, [pageInfo, findProjectByName, setActiveProject, loading]);
```

3. Similarly update `handleSync` to show a loading state if projects aren't ready yet.

---

### Change 3: Redesign Feature Row Layout

**File: `src/components/heartbeat/FeatureItem.tsx`**

Transform from single-row to 2-row layout:

**Current Layout (Single Row):**
```
[Grip] [Title... (truncated)] [Badge] [Actions]
```

**New Layout (Two Rows):**
```
Row 1: [Grip] [Full Title - bold, wraps if long]
Row 2:        [Prompt preview (gray, truncated)] [Status Badge] [Actions]
```

#### Implementation Details:

```tsx
<Draggable draggableId={feature.id} index={index}>
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={cn(
        'group p-3 rounded-lg border transition-all',
        'hover:border-lavalog/50',
        isSelected ? 'border-lavalog bg-lavalog/10' : 'border-border bg-card',
        snapshot.isDragging && 'shadow-lg',
        isCompleted && 'opacity-60'
      )}
      onClick={onSelect}
    >
      {/* Row 1: Drag handle + Full Title */}
      <div className="flex items-start gap-2">
        <div
          {...provided.dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-0.5"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <h3 className={cn(
          "flex-1 font-semibold text-foreground break-words",
          isCompleted && "line-through"
        )}>
          {feature.title}
        </h3>
      </div>

      {/* Row 2: Prompt preview + Badge + Actions */}
      <div className="flex items-center justify-between mt-2 ml-6">
        {/* Left: Prompt preview */}
        <p className={cn(
          "flex-1 text-sm text-muted-foreground truncate mr-3",
          isCompleted && "line-through"
        )}>
          {feature.prompt?.slice(0, 60) || 'No prompt yet'}
          {feature.prompt && feature.prompt.length > 60 ? '...' : ''}
        </p>

        {/* Right: Badge + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={feature.status} onClick={handleStatusClick} />
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" onClick={onInject} title="Inject">
              <Zap className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onDuplicate} title="Duplicate">
              <Copy className="w-3 h-3" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete} title="Delete">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )}
</Draggable>
```

#### Key Layout Changes:
| Aspect | Before | After |
|--------|--------|-------|
| Title display | Truncated, single line | Full width, bold, wraps |
| Prompt preview | Below title (same row area) | Row 2, left side |
| Badge position | End of Row 1 | Row 2, right side |
| Actions | End of Row 1 | Row 2, far right |
| Row structure | Flex row | Two stacked flex rows |

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/heartbeat/StatusBadge.tsx` | Rename label from "In Progress" to "Next" |
| `src/pages/Dashboard.tsx` | Add `loading` dependency to prevent race condition |
| `src/components/heartbeat/FeatureItem.tsx` | Redesign to 2-row layout |

---

### Summary

1. **Status Rename**: Simple label change, no backend impact
2. **Sync Fix**: Wait for projects to load before auto-detection runs
3. **Layout Redesign**: Two-row structure ensures full title visibility while keeping all controls accessible

