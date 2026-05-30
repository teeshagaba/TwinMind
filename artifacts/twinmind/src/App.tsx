import "@/lib/auth"; // Initialize auth token getter
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute, Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import DigitalTwin from "@/pages/digital-twin";
import Simulation from "@/pages/simulation";
import Predictions from "@/pages/predictions";
import Copilot from "@/pages/copilot";
import Reports from "@/pages/reports";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  } else {
    return <Redirect to="/login" />;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/dashboard">
        <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
      </Route>
      
      <Route path="/digital-twin">
        <ProtectedRoute><Layout><DigitalTwin /></Layout></ProtectedRoute>
      </Route>
      
      <Route path="/simulation">
        <ProtectedRoute><Layout><Simulation /></Layout></ProtectedRoute>
      </Route>
      
      <Route path="/predictions">
        <ProtectedRoute><Layout><Predictions /></Layout></ProtectedRoute>
      </Route>
      
      <Route path="/copilot">
        <ProtectedRoute><Layout><Copilot /></Layout></ProtectedRoute>
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute><Layout><Admin /></Layout></ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

