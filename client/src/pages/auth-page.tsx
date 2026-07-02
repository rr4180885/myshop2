import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin, useUser } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { api, type LoginInput } from "@shared/routes";
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
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Warehouse className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Brothers Enterprises</h1>
              <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
            </div>
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
                <div className="flex justify-end">
                  <ForgotPasswordDialog />
                </div>
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
            <p className="text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/50 mb-2">
              Brothers Enterprises
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              Stock & Billing
            </h2>
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
