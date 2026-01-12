import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useEffect } from "react";
import { api } from "@shared/routes";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ShopPage from "@/pages/shop-page";

// Dynamic Favicon Component
function DynamicFavicon() {
  const { data: settings } = useQuery({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path);
      return res.json();
    },
  });

  useEffect(() => {
    if (settings?.logoPath && settings.logoPath.trim() !== '') {
      // Update favicon with logo from settings
      const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = settings.logoPath;
      }
      
      // Update page title with shop name
      if (settings.shopName) {
        document.title = `${settings.shopName} - Billing System`;
      }
    }
  }, [settings]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={ShopPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <DynamicFavicon />
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
