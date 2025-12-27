import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, User, LayoutDashboard, Settings, Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const { data: user } = useUser();
  const { mutate: logout, isPending: isLogoutPending } = useLogout();

  return (
    <div className="min-h-screen bg-secondary/20 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r border-border hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">Dashboard</span>
          </div>

          <nav className="space-y-1">
            <Button variant="ghost" className="w-full justify-start font-medium bg-primary/10 text-primary">
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Overview
            </Button>
            <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-foreground">
              <Bell className="mr-3 h-5 w-5" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-foreground">
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {user?.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">Administrator</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            onClick={() => logout()}
            disabled={isLogoutPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLogoutPending ? "Logging out..." : "Log out"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between">
          <div className="md:hidden flex items-center gap-2">
             <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
          </div>

          <div className="flex-1 max-w-md mx-auto hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search anything..." 
                className="pl-10 bg-secondary/50 border-transparent focus:bg-background focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" className="rounded-full">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="md:hidden">
              <Button size="sm" variant="outline" onClick={() => logout()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Overview</h1>
            <p className="text-muted-foreground mt-1">Welcome back, here's what's happening today.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm border-border/60 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription>Total Users</CardDescription>
                <CardTitle className="text-3xl font-bold font-display">1,234</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-green-600 flex items-center font-medium bg-green-500/10 w-fit px-2 py-1 rounded-full">
                  +12% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/60 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription>Active Sessions</CardDescription>
                <CardTitle className="text-3xl font-bold font-display">843</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-green-600 flex items-center font-medium bg-green-500/10 w-fit px-2 py-1 rounded-full">
                  +5% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/60 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription>System Status</CardDescription>
                <CardTitle className="text-3xl font-bold font-display text-green-600">Healthy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Last check: 2 minutes ago
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-border/60">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and updates.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4 pb-6 border-b border-border/50 last:border-0 last:pb-0">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">User Logged In</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Administrator accessed the system successfully.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Just now</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
