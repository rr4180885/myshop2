import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type LoginInput, type User } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// Fetch current user
export function useUser() {
  return useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to fetch user");
      }
      return api.auth.me.responses[200].parse(await res.json());
    },
    retry: false,
    staleTime: Infinity, // User session doesn't change often
  });
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Invalid username or password");
        }
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Login failed");
      }

      return api.auth.login.responses[201].parse(await res.json());
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.username}`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    },
  });
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      toast({
        title: "Logged out",
        description: "See you next time!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "Failed to log out properly.",
      });
    },
  });
}
