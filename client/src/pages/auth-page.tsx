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
import { Loader2, Lock } from "lucide-react";

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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background overflow-hidden">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-8 lg:p-12 relative z-10">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
          <CardHeader className="space-y-1 px-0">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-3xl font-display font-bold">Welcome back</CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              Enter your credentials to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="admin" 
                          {...field} 
                          className="h-12 rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:bg-background transition-all duration-200"
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
                          placeholder="••••••••" 
                          {...field}
                          className="h-12 rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:bg-background transition-all duration-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold rounded-lg bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Demo Credentials
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border text-center">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Username</p>
                    <p className="font-mono text-sm font-medium">admin</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border text-center">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Password</p>
                    <p className="font-mono text-sm font-medium">admin1234</p>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex relative bg-zinc-900 items-center justify-center p-12 overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-[1000px] h-[1000px] bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute -bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 max-w-lg text-white">
          <h2 className="text-4xl font-display font-bold mb-6 leading-tight">
            Secure, Scalable, & <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Production Ready</span>
          </h2>
          <p className="text-lg text-zinc-400 leading-relaxed mb-8">
            Access your dashboard to manage users, monitor analytics, and control your application settings with ease.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="font-semibold text-white mb-1">Always Secure</h3>
              <p className="text-sm text-zinc-400">Enterprise-grade security standards.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="font-semibold text-white mb-1">Lightning Fast</h3>
              <p className="text-sm text-zinc-400">Optimized for maximum performance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
