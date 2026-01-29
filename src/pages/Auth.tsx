/// <reference types="chrome" />
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { GradientLogo } from '@/components/ui/GradientLogo';

export default function Auth() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Detect if running in Chrome extension context
  const isExtension = typeof chrome !== 'undefined' && 
                      typeof chrome.identity !== 'undefined' && 
                      typeof chrome.identity.getRedirectURL === 'function';

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
      } else {
        // Web browser flow - use Lovable Cloud managed OAuth
        const { error } = await lovable.auth.signInWithOAuth('google', {
          redirect_uri: window.location.origin,
        });
        if (error) throw error;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: 'Welcome back!', description: 'Successfully logged in.' });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: 'Account created!',
          description: 'Check your email for confirmation or log in if auto-confirm is enabled.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center mb-8">
          <GradientLogo size="lg" />
        </div>
        
        <p className="text-center text-muted-foreground">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </p>

        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full border-border hover:border-brand-purple bg-transparent"
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
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || googleLoading}
              className="bg-secondary/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading || googleLoading}
              className="bg-secondary/50 border-border"
            />
          </div>

          <button 
            type="submit" 
            className="w-full gradient-button py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={loading || googleLoading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-brand-purple hover:underline"
            disabled={loading || googleLoading}
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
