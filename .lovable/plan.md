

## Fix: Status Badge Stuck on Backlog

### Root Cause

The database `features.status` column likely has a CHECK constraint or enum type with values `('backlog', 'in-progress', 'done')`. The frontend TypeScript types use `'next'` instead of `'in-progress'`, so when the app tries to set `status = 'next'`, the database silently rejects it. The error is caught and logged to console but no toast is shown, so the failure is invisible.

Evidence:
- `featureSorting.ts` has `'in-progress': 0, // Backwards compatibility` confirming the DB originally used `'in-progress'`
- `done -> backlog` works (valid DB value), `backlog -> next` does not (invalid DB value)
- `updateFeature` catches errors with `console.error` only -- no user-visible feedback

### Fix (Two Parts)

#### Part 1: Database Migration

Run a migration to update the database constraint so it accepts the value `'next'` instead of `'in-progress'`:

```sql
-- If it's a CHECK constraint:
ALTER TABLE features DROP CONSTRAINT IF EXISTS features_status_check;
ALTER TABLE features ADD CONSTRAINT features_status_check 
  CHECK (status IN ('backlog', 'next', 'done'));

-- Update any existing rows still using the old value:
UPDATE features SET status = 'next' WHERE status = 'in-progress';
```

If it's an enum type instead, the migration would alter the enum to rename the value.

#### Part 2: Add Error Visibility to updateFeature

Modify `src/hooks/useProjects.ts` so that `updateFeature` shows a toast on failure instead of silently logging to console. This prevents future silent failures.

```typescript
// In the catch block of updateFeature:
catch (error) {
  console.error('Error updating feature:', error);
  // Show a toast so the user knows the update failed
}
```

This requires passing a toast function or returning a success boolean from `updateFeature`.

#### Part 3: Clean Up Backwards Compatibility

Remove the `'in-progress'` entry from `src/lib/featureSorting.ts` since it will no longer be needed after the DB migration.

### Files to Modify

| File | Change |
|------|--------|
| Database (migration) | Update CHECK constraint from `'in-progress'` to `'next'`, migrate existing rows |
| `src/hooks/useProjects.ts` | Add error toast to `updateFeature` catch block |
| `src/lib/featureSorting.ts` | Remove `'in-progress'` backwards compatibility entry |

### Summary

1. Run DB migration to align the constraint with the TypeScript types
2. Add visible error feedback to `updateFeature`
3. Remove stale backwards-compatibility code

