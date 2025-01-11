import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Profile from "@/pages/profile";
import AdminDashboard from "@/pages/admin-dashboard";
import ForgotPassword from "@/pages/forgot-password";
import { useUser } from "@/hooks/use-user";

function Router() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      {user ? (
        <>
          <Route path="/" component={user.isAdmin ? AdminDashboard : Profile} />
          <Route path="/admin" component={AdminDashboard} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="*" component={AuthPage} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;