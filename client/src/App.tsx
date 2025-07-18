import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Home from "@/pages/Home";
import Onboarding from "@/pages/Onboarding";
import SmartMatch from "@/pages/SmartMatch";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {!isAuthenticated ? (
          <Landing />
        ) : (user as any)?.isOnboardingComplete ? (
          <Home />
        ) : (
          <Onboarding />
        )}
      </Route>
      <Route path="/login">
        <Landing />
      </Route>
      <Route path="/auth">
        <Auth />
      </Route>
      <Route path="/onboarding">
        {isAuthenticated ? <Onboarding /> : <Landing />}
      </Route>
      <Route path="/home">
        {isAuthenticated && (user as any)?.isOnboardingComplete ? <Home /> : <Landing />}
      </Route>
      <Route path="/smartmatch">
        {isAuthenticated && (user as any)?.isOnboardingComplete ? <SmartMatch /> : <Landing />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
