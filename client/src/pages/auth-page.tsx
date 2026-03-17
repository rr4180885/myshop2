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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Car, Shield, Gauge, Wrench, Moon, Sun, Zap, Star } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { ForgotPasswordDialog } from "@/components/ForgotPasswordDialog";

export default function AuthPage() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { mutate: login, isPending } = useLogin();
  const { theme, toggleTheme } = useTheme();

  const form = useForm<LoginInput>({
    resolver: zodResolver(api.auth.login.input),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  function onSubmit(data: LoginInput) {
    login(data);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative overflow-hidden bg-background">
      {/* Theme Toggle */}
      <Button
        onClick={toggleTheme}
        variant="outline"
        size="icon"
        className="fixed top-6 right-6 z-50 rounded-xl w-12 h-12 shadow-xl hover:shadow-2xl transition-all duration-300 glass border-border/50 hover:border-primary/50 hover:scale-110"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5 text-primary" />
        ) : (
          <Moon className="h-5 w-5 text-primary" />
        )}
      </Button>
      
      {/* Left Side - Auth Form */}
      <div className="flex items-center justify-center p-6 sm:p-8 md:p-12 lg:p-16 relative z-10 pattern-dots">
        <Card className="w-full max-w-lg premium-card-dark">
          <CardHeader className="space-y-1 px-6 sm:px-8 pt-8 pb-6">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl gradient-automotive flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                  <Car className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                  <Star className="w-3 h-3 text-white fill-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-display font-black text-foreground tracking-tight">
                  Brothers Enterprises
                </h1>
                <p className="text-sm font-semibold text-gradient-automotive">
                  Automotive Workshop Management
                </p>
              </div>
            </div>

            <CardTitle className="text-3xl sm:text-4xl font-display font-black text-foreground">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Sign in to manage your automotive workshop
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-foreground">
                        Username
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your username" 
                          {...field} 
                          className="h-12 rounded-xl bg-muted/50 border-border/60 focus:border-primary focus:bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10 text-base font-medium focus-ring"
                          autoComplete="username"
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
                      <FormLabel className="text-sm font-bold text-foreground">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your password" 
                          {...field}
                          className="h-12 rounded-xl bg-muted/50 border-border/60 focus:border-primary focus:bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10 text-base font-medium focus-ring"
                          autoComplete="current-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <ForgotPasswordDialog />
                </div>
                
                <Button
                  type="submit" 
                  className="w-full h-13 text-base font-bold rounded-xl gradient-automotive hover:opacity-90 transition-all duration-300 shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50 hover:-translate-y-0.5 btn-premium"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Sign In Securely
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Features Grid */}
            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center group hover:scale-105 transition-transform duration-200">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs font-bold text-foreground">Secure</p>
                  <p className="text-xs text-muted-foreground">Protected</p>
                </div>
                <div className="text-center group hover:scale-105 transition-transform duration-200">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-2 group-hover:bg-accent/20 transition-colors">
                    <Zap className="w-6 h-6 text-accent" />
                  </div>
                  <p className="text-xs font-bold text-foreground">Fast</p>
                  <p className="text-xs text-muted-foreground">Lightning</p>
                </div>
                <div className="text-center group hover:scale-105 transition-transform duration-200">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-success/10 border border-success/20 flex items-center justify-center mb-2 group-hover:bg-success/20 transition-colors">
                    <Gauge className="w-6 h-6 text-success" />
                  </div>
                  <p className="text-xs font-bold text-foreground">Reliable</p>
                  <p className="text-xs text-muted-foreground">24/7 Uptime</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Premium Visual */}
      <div className="hidden lg:flex relative bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 items-center justify-center p-12 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl opacity-15 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 pattern-grid opacity-10" />
        
        <div className="relative z-10 max-w-xl text-white space-y-8">
          {/* Badge */}
          <div className="inline-block px-5 py-2 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-sm">
            <span className="text-sm font-bold text-primary-foreground flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Professional Workshop Management
            </span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-5xl xl:text-6xl font-display font-black mb-6 leading-tight">
              Manage Your
              <span className="block text-gradient-automotive mt-2">
                Automotive Business
              </span>
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed font-medium">
              Complete workshop management system designed for modern automotive businesses. Track inventory, manage billing, and grow your enterprise.
            </p>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 gap-4 pt-4">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-primary/30 hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl gradient-automotive flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white mb-2 text-lg">Inventory Management</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">Real-time tracking of spare parts, accessories, and workshop supplies with smart alerts.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-accent/30 hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent/30 group-hover:scale-110 transition-transform">
                  <Gauge className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white mb-2 text-lg">Performance Analytics</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">Detailed insights and reports to optimize your workshop operations and revenue.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-success/30 hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-success to-success/80 flex items-center justify-center flex-shrink-0 shadow-lg shadow-success/30 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white mb-2 text-lg">Enterprise Security</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">Bank-level encryption and security protocols to protect your business data.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
