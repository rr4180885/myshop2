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
import { Loader2, Moon, Sun, Zap } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { ForgotPasswordDialog } from "@/components/ForgotPasswordDialog";

function ERickshawMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Cabin */}
      <path
        d="M118 158V98c0-18 12-32 30-36l78-16c22-4 42 10 46 32l8 48"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      />
      <path
        d="M152 98h78c10 0 16 6 18 14l6 28H148l4-42Z"
        fill="currentColor"
        opacity="0.14"
      />
      {/* Chassis */}
      <path
        d="M72 168h248c18 0 32 8 38 22"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M96 168l22-36h118l18 36"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      {/* Handle / canopy rail */}
      <path
        d="M272 122c28 4 52 18 66 40"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Rear wheel */}
      <g className="auth-wheel" style={{ transformOrigin: "120px 188px" }}>
        <circle cx="120" cy="188" r="38" stroke="currentColor" strokeWidth="5" opacity="0.9" />
        <circle cx="120" cy="188" r="12" fill="currentColor" opacity="0.35" />
        <path d="M120 155v18M120 203v18M87 188h18M135 188h18" stroke="currentColor" strokeWidth="3" opacity="0.55" />
      </g>
      {/* Front wheel */}
      <g className="auth-wheel" style={{ transformOrigin: "300px 188px", animationDuration: "14s" }}>
        <circle cx="300" cy="188" r="34" stroke="currentColor" strokeWidth="5" opacity="0.9" />
        <circle cx="300" cy="188" r="10" fill="currentColor" opacity="0.35" />
        <path d="M300 158v16M300 202v16M270 188h16M314 188h16" stroke="currentColor" strokeWidth="3" opacity="0.55" />
      </g>
      {/* Battery pack */}
      <rect x="188" y="128" width="46" height="28" rx="4" stroke="currentColor" strokeWidth="3.5" opacity="0.85" />
      <path d="M204 136v12M210 138v8M216 136v12" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" className="auth-bolt" />
      {/* Headlamp */}
      <circle cx="348" cy="156" r="8" fill="#f59e0b" className="auth-bolt" />
      <path d="M356 156h22" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" opacity="0.7" className="auth-bolt" />
    </svg>
  );
}

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
      <div className="auth-landing min-h-screen flex items-center justify-center bg-[var(--auth-sand)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--auth-volt)]" />
      </div>
    );
  }

  if (user) return <Redirect to="/" />;

  return (
    <div className="auth-landing min-h-screen lg:grid lg:grid-cols-[1.15fr_0.85fr] bg-[var(--auth-sand)]">
      <Button
        onClick={toggleTheme}
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 h-9 w-9 border-[var(--auth-ink)]/10 bg-white/80 backdrop-blur-sm"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Brand hero — full-bleed atmosphere */}
      <section className="auth-hero relative min-h-[42vh] lg:min-h-screen overflow-hidden text-white">
        <div className="auth-grid absolute inset-0" />
        <div className="absolute -right-16 top-1/4 h-72 w-72 rounded-full bg-[var(--auth-amber)]/20 blur-3xl" />
        <div className="absolute -left-10 bottom-10 h-64 w-64 rounded-full bg-[var(--auth-mint)]/15 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col justify-between px-6 py-10 sm:px-10 lg:px-14 lg:py-14 xl:px-16">
          <div className="auth-rise flex items-center gap-2 text-[var(--auth-mint)]">
            <Zap className="h-4 w-4 auth-bolt" />
            <span className="text-xs font-semibold uppercase tracking-[0.28em]">
              E-Rickshaw Parts & Electricals
            </span>
          </div>

          <div className="my-10 lg:my-0 space-y-6 max-w-xl">
            {settingsLoading ? (
              <div className="h-16 w-48 rounded-xl bg-white/10 animate-pulse" />
            ) : logoPath ? (
              <img
                src={logoPath}
                alt={shopName}
                className="auth-rise h-16 sm:h-20 w-auto max-w-[240px] object-contain rounded-lg bg-white/95 p-3"
              />
            ) : null}

            <h1 className="auth-brand auth-rise-delay text-[clamp(2.75rem,8vw,5.25rem)] text-white">
              {shopName}
            </h1>
            <p className="auth-rise-delay-2 text-base sm:text-lg text-white/75 max-w-md leading-relaxed">
              Controllers, batteries, chargers, motors, and wiring — stocked and billed in one place.
            </p>

            <ERickshawMark className="auth-rise-delay-2 mt-4 w-full max-w-md text-white/90" />
          </div>

          <p className="auth-rise-delay-2 text-xs text-white/45 tracking-wide">
            Workshop inventory · GST invoicing · Sales tracking
          </p>
        </div>
      </section>

      {/* Sign-in */}
      <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
        <div className="w-full max-w-md space-y-8 auth-rise">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--auth-volt)]">
              Staff access
            </p>
            <h2 className="auth-brand text-3xl sm:text-4xl text-[var(--auth-ink)] dark:text-foreground">
              Sign in
            </h2>
            <p className="text-sm text-[var(--auth-ink)]/55 dark:text-muted-foreground">
              Manage E-Rickshaw parts stock and daily billing.
            </p>
          </div>

          <div className="auth-form-shell rounded-2xl p-6 sm:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => login(data))} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Username"
                          className="input-modern h-11"
                          autoComplete="username"
                          {...field}
                        />
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
                        <Input
                          type="password"
                          placeholder="Password"
                          className="input-modern h-11"
                          autoComplete="current-password"
                          {...field}
                        />
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
                <Button
                  type="submit"
                  className="auth-submit w-full h-11 text-sm font-semibold tracking-wide"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Enter workshop"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </section>
    </div>
  );
}
