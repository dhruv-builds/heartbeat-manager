

## Add Google OAuth to Chrome Extension Login

### Overview
Add a "Continue with Google" button to the Auth page that uses Chrome's Identity API for the OAuth flow, which is required for extensions since standard browser redirects don't work in popup/side panel contexts.

---

### Phase 1: Update Manifest Permissions

**File: `public/manifest.json`**

Add the `identity` permission required for `chrome.identity.launchWebAuthFlow`:

```json
"permissions": ["sidePanel", "scripting", "activeTab", "storage", "tabs", "identity"],
```

---

### Phase 2: Update Auth.tsx

**File: `src/pages/Auth.tsx`**

#### New State
```typescript
const [googleLoading, setGoogleLoading] = useState(false);
```

#### Google Login Handler
```typescript
const handleGoogleLogin = async () => {
  setGoogleLoading(true);
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: chrome.identity.getRedirectURL(),
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    if (data?.url) {
      chrome.identity.launchWebAuthFlow(
        {
          url: data.url,
          interactive: true,
        },
        async (redirectUrl) => {
          if (chrome.runtime.lastError) {
            console.error('Auth flow error:', chrome.runtime.lastError);
            toast({
              title: 'Login cancelled',
              description: 'Google sign-in was cancelled or failed.',
              variant: 'destructive',
            });
            setGoogleLoading(false);
            return;
          }

          if (redirectUrl) {
            // Parse tokens from the redirect URL hash fragment
            const hashParams = new URLSearchParams(redirectUrl.split('#')[1]);
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (accessToken && refreshToken) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) {
                toast({
                  title: 'Session error',
                  description: sessionError.message,
                  variant: 'destructive',
                });
              } else {
                toast({
                  title: 'Welcome!',
                  description: 'Successfully signed in with Google.',
                });
              }
            }
          }
          setGoogleLoading(false);
        }
      );
    }
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    toast({
      title: 'Login failed',
      description: error.message || 'Failed to sign in with Google.',
      variant: 'destructive',
    });
    setGoogleLoading(false);
  }
};
```

#### UI Changes

Add Google button above the email/password form with a visual separator:

```tsx
{/* Google OAuth Button */}
<Button
  type="button"
  variant="outline"
  className="w-full"
  onClick={handleGoogleLogin}
  disabled={loading || googleLoading}
>
  {googleLoading ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )}
  Continue with Google
</Button>

{/* Divider */}
<div className="relative">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-background px-2 text-muted-foreground">
      Or continue with email
    </span>
  </div>
</div>
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `public/manifest.json` | Add `identity` permission |
| `src/pages/Auth.tsx` | Add Google button, handler, loading state, divider |

---

### Technical Notes

1. **Chrome Identity API**: `chrome.identity.launchWebAuthFlow` opens a separate auth window that properly handles OAuth redirects
2. **Redirect URL**: `chrome.identity.getRedirectURL()` returns `https://<extension-id>.chromiumapp.org/` which must be whitelisted in Supabase
3. **Token Parsing**: The redirect URL contains tokens in the hash fragment (`#access_token=...&refresh_token=...`)
4. **Error Handling**: Check `chrome.runtime.lastError` for user cancellation or flow errors
5. **Loading States**: Separate `googleLoading` state keeps email form usable during Google auth

---

### Layout Preview

```
┌─────────────────────────────────────┐
│         [Logo] LovaLog              │
│      Lovable Backlog Manager        │
│                                     │
│    Sign in to your account          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [G] Continue with Google    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ──────── Or continue with ──────   │
│                                     │
│  Email                              │
│  ┌─────────────────────────────┐    │
│  │ you@example.com             │    │
│  └─────────────────────────────┘    │
│                                     │
│  Password                           │
│  ┌─────────────────────────────┐    │
│  │ ••••••••                    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Sign In             │    │
│  └─────────────────────────────┘    │
│                                     │
│    Don't have an account? Sign up   │
└─────────────────────────────────────┘
```

