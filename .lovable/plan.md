

## Extension-First Authentication Flow

### Overview

Modify the extension entry point to enforce authentication before rendering any content. When running as a Chrome extension, unauthenticated users will see the login page immediately (matching the attached screenshot design). The web app will continue showing the landing page for guests.

---

### Current vs. Proposed Behavior

| Context | Unauthenticated (Current) | Unauthenticated (Proposed) |
|---------|---------------------------|----------------------------|
| **Extension** | Shows LandingPage | Shows Auth page directly |
| **Web App** | Shows LandingPage | Shows LandingPage (unchanged) |

---

### Solution Approach

Modify `RootRoute` in `src/App.tsx` to detect the extension context and render the `Auth` component directly instead of `LandingPage`.

---

### Implementation Details

**1. Update `src/App.tsx`**

Modify the `RootRoute` component to check if running in extension context:

```typescript
import { useChromeMessaging } from '@/hooks/useChromeMessaging';

function RootRoute() {
  const { user, loading } = useAuth();
  const { isExtension } = useChromeMessaging();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
      </div>
    );
  }
  
  // Authenticated users go to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Extension: show auth page directly (no landing page)
  if (isExtension) {
    return <Auth />;
  }
  
  // Web: show landing page for guests
  return <LandingPage />;
}
```

**Key Points:**
- Extension users see `Auth` component inline (no navigation to `/auth`)
- Web users continue to see `LandingPage`
- Once authenticated, both contexts redirect to `/dashboard`

---

### Auth Persistence (Already Implemented)

The current Supabase client configuration already handles persistence:

```typescript
// src/integrations/supabase/client.ts
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,        // Persists to localStorage
    persistSession: true,         // Session survives reloads
    autoRefreshToken: true,       // Tokens refresh automatically
  }
});
```

This ensures:
- Auth state persists across extension reloads
- Tokens are automatically refreshed
- Extension popup remembers the user session

---

### Visual Result

**Extension (unauthenticated):**
```text
+------------------------------------------+
|               [LovaLog Logo]              |
|         Lovable Backlog Manager           |
|                                           |
|        Sign in to your account            |
|                                           |
|   [G] Continue with Google                |
|                                           |
|   -------- OR CONTINUE WITH EMAIL ------  |
|                                           |
|   Email                                   |
|   [you@example.com                    ]   |
|                                           |
|   Password                                |
|   [••••••••                           ]   |
|                                           |
|   [=========== Sign In ===========]       |
|                                           |
|   Don't have an account? Sign up          |
+------------------------------------------+
```

This matches the attached screenshot design exactly.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Import `useChromeMessaging`, modify `RootRoute` to render `Auth` directly for extension context |

---

### Why This Works

1. **No routing change needed**: `RootRoute` renders the `Auth` component inline when in extension context
2. **Auth persistence**: Supabase's `localStorage` + `persistSession: true` ensures sessions survive extension popup closes/reopens
3. **Clean separation**: Web app behavior is completely unchanged
4. **Design match**: Uses the existing `Auth` component which already matches the screenshot design

---

### Summary

1. Modify `RootRoute` in `App.tsx` to detect extension context via `useChromeMessaging`
2. Render `Auth` component directly for unauthenticated extension users
3. Keep web app showing `LandingPage` for guests
4. No changes needed for auth persistence (already configured correctly)

