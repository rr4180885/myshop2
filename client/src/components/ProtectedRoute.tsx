import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, type RouteProps } from "wouter";

export function ProtectedRoute({ component: Component, ...rest }: RouteProps) {
  const { data: user, isLoading } = useUser();

  return (
    <Route
      {...rest}
      component={(props) => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-background">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        // Only render component if it exists
        return Component ? <Component {...props} /> : null;
      }}
    />
  );
}
