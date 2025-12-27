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
import { Loader2, Lock, ShieldCheck, Zap, TrendingUp } from "lucide-react";

export default function AuthPage() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { mutate: login, isPending } = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(api.auth.login.input),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 relative z-10">
        <Card className="w-full max-w-md border border-border/50 shadow-2xl shadow-primary/5 bg-card/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 px-4 sm:px-6 pt-6 pb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <Lock className="w-7 h-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Welcome back
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground mt-2">
              Sign in to access your shop management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your username" 
                          {...field} 
                          className="h-11 sm:h-12 rounded-xl bg-background/60 border-border/60 focus:border-primary focus:bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10"
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
                      <FormLabel className="text-sm font-semibold">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your password" 
                          {...field}
                          className="h-11 sm:h-12 rounded-xl bg-background/60 border-border/60 focus:border-primary focus:bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10"
                          autoComplete="current-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-11 sm:h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 mt-6"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Sign in securely
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Features */}
            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                    <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-foreground/80">Secure</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-foreground/80">Fast</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-foreground/80">Reliable</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Visual (Hidden on mobile) */}
      <div className="hidden lg:flex relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 items-center justify-center p-12 overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute -bottom-1/4 -left-1/4 w-[700px] h-[700px] bg-gradient-to-tr from-blue-500/15 to-cyan-500/15 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        </div>
        
        <div className="relative z-10 max-w-lg text-white">
          <div className="mb-8">
            <div className="inline-block px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6">
              <span className="text-sm font-semibold text-primary-foreground">Shop Management System</span>
            </div>
            <h2 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              Manage Your Shop with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-cyan-400 mt-2">
                Confidence & Control
              </span>
            </h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Streamline your inventory, billing, and customer management with our powerful and intuitive dashboard.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
                  <ShieldCheck className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1 text-lg">Enterprise Security</h3>
                  <p className="text-sm text-zinc-400">Protected with industry-leading encryption and authentication standards.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1 text-lg">Lightning Performance</h3>
                  <p className="text-sm text-zinc-400">Optimized for speed with real-time updates and instant responses.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1 text-lg">Analytics & Insights</h3>
                  <p className="text-sm text-zinc-400">Make data-driven decisions with comprehensive reporting tools.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
