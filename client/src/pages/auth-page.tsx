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
import { Loader2, Warehouse, Moon, Sun, BarChart3, Package, Receipt } from "lucide-react";
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

      <div className="flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Warehouse className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage inventory, billing, and workshop operations.
            </p>
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
                        <Input placeholder="Enter username" className="input-modern" autoComplete="username" {...field} />
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
                        <Input type="password" placeholder="Enter password" className="input-modern" autoComplete="current-password" {...field} />
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
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }} />
        <div className="relative max-w-lg space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/50 mb-3">Workshop OS</p>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight">
              Stock management built for modern workshops
            </h2>
            <p className="mt-4 text-sidebar-foreground/70 leading-relaxed">
              Track parts, generate GST invoices, monitor low stock, and run your agency from one clean dashboard.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              { icon: Package, title: "Real-time inventory", desc: "Live stock levels with smart low-stock alerts." },
              { icon: Receipt, title: "Fast billing", desc: "Create invoices with misc items and print in seconds." },
              { icon: BarChart3, title: "Sales insights", desc: "Daily and monthly revenue at a glance." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/20 text-sidebar-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-xs text-sidebar-foreground/60 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
