import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Plus,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@shared/routes";
import { DEFAULT_SHOP_NAME } from "@shared/shop-config";
import DashboardTab from "@/components/shop/DashboardTab";
import BillingTab from "@/components/shop/BillingTab";
import InventoryTab from "@/components/shop/InventoryTab";
import AddProductTab from "@/components/shop/AddProductTab";
import SettingsTab from "@/components/shop/SettingsTab";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, component: DashboardTab, group: "Overview" },
  { id: "billing", label: "Billing", icon: ShoppingCart, component: BillingTab, group: "Operations" },
  { id: "inventory", label: "Inventory", icon: Boxes, component: InventoryTab, group: "Operations" },
  { id: "addproduct", label: "Add Product", icon: Plus, component: AddProductTab, group: "Operations" },
  { id: "settings", label: "Settings", icon: Settings, component: SettingsTab, group: "System" },
];

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const { theme, toggleTheme } = useTheme();

  const { data: settings } = useQuery({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path);
      return res.json();
    },
  });

  const shopName = settings?.shopName || DEFAULT_SHOP_NAME;
  const activeTabObj = tabs.find((t) => t.id === activeTab);
  const ActiveComponent = activeTabObj?.component;

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const groupedTabs = tabs.reduce((acc, tab) => {
    if (!acc[tab.group]) acc[tab.group] = [];
    acc[tab.group].push(tab);
    return acc;
  }, {} as Record<string, typeof tabs>);

  return (
    <div className="h-screen app-shell-bg flex overflow-hidden text-foreground">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative overflow-hidden flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sidebar-primary/25 via-transparent to-accent/10" />
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <div className="relative min-w-0 flex-1">
            <p className="truncate text-sm font-display font-bold tracking-tight">{shopName}</p>
            <p className="text-xs text-sidebar-foreground/55">E-Rickshaw Parts</p>
          </div>
          <Button variant="ghost" size="icon" className="relative lg:hidden text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {Object.entries(groupedTabs).map(([group, groupTabs]) => (
            <div key={group}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/45">
                {group}
              </p>
              <div className="space-y-0.5">
                {groupTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn("nav-item", isActive && "nav-item-active")}
                      data-testid={`tab-${tab.id}`}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-80" />
                      <span className="flex-1 text-left">{tab.label}</span>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
            <Avatar className="h-8 w-8 border border-sidebar-border">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                {user?.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.username}</p>
              <p className="text-xs text-sidebar-foreground/55">Administrator</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className="w-full justify-start text-sidebar-foreground/75 hover:bg-destructive/15 hover:text-destructive"
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex min-h-0 flex-1 flex-col min-w-0 lg:pl-[260px]">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 backdrop-blur-md px-4 sm:px-6">
          <Button
            variant="outline"
            size="icon"
            className="flex h-10 w-10 shrink-0 border-border bg-card text-foreground shadow-sm lg:hidden"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-open-sidebar"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-display font-bold tracking-tight truncate text-foreground">{activeTabObj?.label}</h1>
            <p className="text-xs text-muted-foreground truncate">{shopName}</p>
          </div>

          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 bg-card text-foreground" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto overflow-x-hidden pattern-dots">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 animate-fadeIn">
            {ActiveComponent && <ActiveComponent />}
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
