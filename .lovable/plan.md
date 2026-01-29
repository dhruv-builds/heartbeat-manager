

## Revert to Standard Supabase Authentication

### Overview
Remove the Lovable Cloud managed OAuth wrapper and restore direct Supabase authentication for Google sign-in. Your Supabase client is already correctly configured to use your environment variables.

---

### Current State

| File | Status |
|------|--------|
| `src/integrations/supabase/client.ts` | Already using `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `src/integrations/lovable/index.ts` | Contains Lovable Cloud auth wrapper (needs removal) |
| `src/pages/Auth.tsx` | Web flow uses `lovable.auth.signInWithOAuth` (needs to use `supabase.auth.signInWithOAuth`) |

---

### Phase 1: Update Auth.tsx - Remove Lovable Cloud Import

**File: `src/pages/Auth.tsx`**

**Change 1:** Remove the lovable import (line 5)
```typescript
// REMOVE THIS LINE:
import { lovable } from '@/integrations/lovable';
```

**Change 2:** Update the web browser flow (lines 102-108) to use standard Supabase OAuth:

```typescript
// BEFORE (Lovable Cloud):
} else {
  // Web browser flow - use Lovable Cloud managed OAuth
  const { error } = await lovable.auth.signInWithOAuth('google', {
    redirect_uri: window.location.origin,
  });
  if (error) throw error;
}

// AFTER (Direct Supabase):
} else {
  // Web browser flow - use direct Supabase OAuth
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  // Browser handles redirect automatically
}
```

---

### Phase 2: Remove Lovable Cloud Auth File

**File: `src/integrations/lovable/index.ts`**

**Action:** Delete this file entirely, or replace contents with an empty export to prevent import errors during cleanup.

Option A - Delete the file completely
Option B - Replace with empty placeholder:
```typescript
// Lovable Cloud auth disabled - using direct Supabase authentication
export const lovable = {};
```

---

### Phase 3: Verify Supabase Client Configuration

**File: `src/integrations/supabase/client.ts`**

This file is already correctly configured:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

No changes needed here.

---

### Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Auth.tsx` | Modify | Remove lovable import, use `supabase.auth.signInWithOAuth` directly |
| `src/integrations/lovable/index.ts` | Delete | Remove Lovable Cloud auth wrapper |
| `src/integrations/supabase/client.ts` | No change | Already using your env vars correctly |

---

### Important Note: Google OAuth Configuration

For Google OAuth to work with your own Supabase project, ensure you have:

1. **In Google Cloud Console:**
   - Created OAuth 2.0 credentials
   - Added authorized redirect URI: `https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback`

2. **In Supabase Dashboard:**
   - Go to Authentication > Providers > Google
   - Enable Google provider
   - Add your Google Client ID and Client Secret

---

### Final Auth.tsx handleGoogleLogin Function

After changes, the function will look like:

```typescript
const handleGoogleLogin = async () => {
  setGoogleLoading(true);
  try {
    if (isExtension) {
      // Chrome extension flow - use direct Supabase OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: chrome.identity.getRedirectURL(),
          skipBrowserRedirect: true,
        },
      });
      // ... existing chrome.identity.launchWebAuthFlow logic
    } else {
      // Web browser flow - use direct Supabase OAuth
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      // Browser handles redirect automatically
    }
  } catch (error: any) {
    // ... error handling
  }
};
```

