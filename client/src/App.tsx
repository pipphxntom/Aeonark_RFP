import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { usePageLoader } from "@/hooks/usePageLoader";
import LoadingScreen from "@/components/LoadingScreen";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Home from "@/pages/Home";
import Onboarding from "@/pages/Onboarding";
import SmartMatch from "@/pages/SmartMatch";
import SmartMatchIntelligence from "@/pages/SmartMatchIntelligence";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { isLoading: pageLoading, isReady } = usePageLoader({ 
    minLoadTime: 2000, 
    dependencies: [isAuthenticated] 
  });

  const showLoadingScreen = authLoading || pageLoading;

  if (showLoadingScreen) {
    return <LoadingScreen isLoading={showLoadingScreen} />;
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
      <Route path="/smartmatch-intelligence">
        {isAuthenticated && (user as any)?.isOnboardingComplete ? <SmartMatchIntelligence /> : <Landing />}
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
