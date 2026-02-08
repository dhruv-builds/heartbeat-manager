import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useChromeMessaging } from "@/hooks/useChromeMessaging";
import { ContactFooter } from "@/components/ContactFooter";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Smart root route component - extension shows auth directly, web shows landing for guests
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

function AppLayout() {
  const { isExtension } = useChromeMessaging();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <ContactFooter isExtension={isExtension} />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <MemoryRouter>
          <AppLayout />
        </MemoryRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
