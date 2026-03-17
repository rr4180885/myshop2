import { useState } from "react";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, ShoppingCart, Boxes, Plus, Settings, Menu, X, Car, Sun, Moon, Wrench } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DashboardTab from "@/components/shop/DashboardTab";
import BillingTab from "@/components/shop/BillingTab";
import InventoryTab from "@/components/shop/InventoryTab";
import AddProductTab from "@/components/shop/AddProductTab";
import SettingsTab from "@/components/shop/SettingsTab";

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const { theme, toggleTheme } = useTheme();

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, component: DashboardTab, description: "Overview & Analytics", color: "primary" },
    { id: "billing", label: "Billing", icon: ShoppingCart, component: BillingTab, description: "Create Invoices", color: "accent" },
    { id: "inventory", label: "Inventory", icon: Boxes, component: InventoryTab, description: "Manage Parts", color: "success" },
    { id: "addproduct", label: "Add Product", icon: Plus, component: AddProductTab, description: "New Part", color: "warning" },
    { id: "settings", label: "Settings", icon: Settings, component: SettingsTab, description: "Configuration", color: "muted" },
  ];

  const activeTabObj = tabs.find(t => t.id === activeTab);
  const ActiveComponent = activeTabObj?.component;

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } fixed inset-y-0 left-0 z-50 w-72 lg:w-72 bg-card border-r border-border transition-all duration-300 flex flex-col shadow-2xl lg:shadow-none`}
      >
        {/* Logo Header */}
        <div className="p-6 border-b border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl gradient-automotive flex items-center justify-center shadow-lg shadow-primary/30 rotate-3 hover:rotate-0 transition-transform">
                  <Car className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="font-display font-black text-foreground text-lg tracking-tight">
                  Brothers Enterprises
                </h1>
                <p className="text-xs font-semibold text-primary">Workshop Manager</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden hover:bg-destructive/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-2 border-primary/30 shadow-lg shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-2 border-transparent hover:border-border active:scale-95"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  isActive ? 'bg-primary text-white shadow-md' : 'bg-muted group-hover:bg-primary/10'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-sm">{tab.label}</div>
                  <div className="text-xs opacity-70">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-border/50 space-y-3 bg-gradient-to-br from-muted/30 to-transparent">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-card border border-border/50">
            <Avatar className="h-11 w-11 border-2 border-primary/50 shadow-lg">
              <AvatarFallback className="bg-gradient-automotive text-white font-bold text-sm">
                {user?.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground font-medium">Workshop Admin</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="w-full bg-destructive/5 hover:bg-destructive hover:text-white border-destructive/30 hover:border-destructive transition-all font-bold"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 lg:ml-72">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 sm:px-6 lg:px-8 py-4 shadow-lg sticky top-0 z-30">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile menu button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 h-10 w-10"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeTab === 'dashboard' ? 'bg-primary/10 border border-primary/30' :
                  activeTab === 'billing' ? 'bg-accent/10 border border-accent/30' :
                  activeTab === 'inventory' ? 'bg-success/10 border border-success/30' :
                  activeTab === 'addproduct' ? 'bg-warning/10 border border-warning/30' :
                  'bg-muted/50 border border-border'
                }`}>
                  {activeTabObj && <activeTabObj.icon className={`w-5 h-5 ${
                    activeTab === 'dashboard' ? 'text-primary' :
                    activeTab === 'billing' ? 'text-accent' :
                    activeTab === 'inventory' ? 'text-success' :
                    activeTab === 'addproduct' ? 'text-warning' :
                    'text-muted-foreground'
                  }`} />}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-black text-foreground truncate tracking-tight">
                    {activeTabObj?.label}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
                    {activeTabObj?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="hidden sm:flex h-10 w-10 p-0 rounded-xl hover:scale-105 transition-transform"
                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* User avatar on mobile */}
              <div className="lg:hidden">
                <Avatar className="h-9 w-9 border-2 border-primary/50 shadow-md">
                  <AvatarFallback className="bg-gradient-automotive text-white font-bold text-xs">
                    {user?.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20 pattern-dots">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="animate-fadeIn max-w-7xl mx-auto">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
