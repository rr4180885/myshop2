import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useLogin, useUser } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { api, type LoginInput } from "@shared/routes";
import { DEFAULT_SHOP_NAME, ENABLE_EMAIL } from "@shared/shop-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Warehouse, Moon, Sun, Package, Receipt, BarChart3 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { ForgotPasswordDialog } from "@/components/ForgotPasswordDialog";

export default function AuthPage() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { mutate: login, isPending } = useLogin();
  const { theme, toggleTheme } = useTheme();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path);
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const shopName = settings?.shopName || DEFAULT_SHOP_NAME;
  const logoPath = settings?.logoPath?.trim() || "";

  const form = useForm<LoginInput>({
    resolver: zodResolver(api.auth.login.input),
    defaultValues: { username: "", password: "" },
  });

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Redirect to="/" />;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <Button
        onClick={toggleTheme}
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 h-9 w-9"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <div className="flex items-center justify-center p-6 sm:p-10 lg:p-16 pattern-dots">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4 text-center lg:text-left">
            <div className="flex flex-col items-center lg:items-start gap-3">
              {settingsLoading ? (
                <div className="h-16 w-40 rounded-xl bg-muted animate-pulse" />
              ) : logoPath ? (
                <img
                  src={logoPath}
                  alt={shopName}
                  className="h-16 w-auto max-w-[220px] object-contain"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                  <Warehouse className="h-7 w-7" />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-1">
                  Welcome to
                </p>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                  {shopName}
                </h1>
                <p className="text-base text-muted-foreground mt-2 font-medium">
                  Stock & Billing Management
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>

          {/* Mobile feature highlights */}
          <div className="grid grid-cols-3 gap-2 lg:hidden">
            {[
              { icon: Package, label: "Inventory" },
              { icon: Receipt, label: "Invoices" },
              { icon: BarChart3, label: "Reports" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2 py-3 text-center"
              >
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          <div className="surface-card p-6 sm:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => login(data))} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Username" className="input-modern" autoComplete="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Password" className="input-modern" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {ENABLE_EMAIL && (
                  <div className="flex justify-end">
                    <ForgotPasswordDialog />
                  </div>
                )}
                <Button type="submit" className="w-full h-10" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-col justify-center bg-sidebar text-sidebar-foreground p-12 xl:p-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative max-w-md space-y-8">
          <div>
            {logoPath ? (
              <img
                src={logoPath}
                alt={shopName}
                className="h-24 xl:h-28 w-auto max-w-full object-contain rounded-xl bg-white/95 p-4 shadow-md"
              />
            ) : (
              <h2 className="text-4xl xl:text-5xl font-semibold leading-tight tracking-tight text-sidebar-foreground">
                {shopName}
              </h2>
            )}
            <p className="text-lg text-sidebar-foreground/70 mt-3 font-medium">
              Stock & Billing Management
            </p>
          </div>
          <div className="space-y-3">
            {[
              { icon: Package, label: "Inventory" },
              { icon: Receipt, label: "GST Invoices" },
              { icon: BarChart3, label: "Sales Reports" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-4 py-3">
                <Icon className="h-4 w-4 text-sidebar-primary shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
