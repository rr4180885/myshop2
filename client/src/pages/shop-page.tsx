import { useState } from "react";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, ShoppingCart, Boxes, Plus, Settings, Menu, X, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DashboardTab from "@/components/shop/DashboardTab";
import BillingTab from "@/components/shop/BillingTab";
import InventoryTab from "@/components/shop/InventoryTab";
import AddProductTab from "@/components/shop/AddProductTab";
import SettingsTab from "@/components/shop/SettingsTab";

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, component: DashboardTab, description: "Overview & analytics" },
    { id: "billing", label: "Billing", icon: ShoppingCart, component: BillingTab, description: "Create invoices" },
    { id: "inventory", label: "Inventory", icon: Boxes, component: InventoryTab, description: "Manage products" },
    { id: "addproduct", label: "Add Product", icon: Plus, component: AddProductTab, description: "New product" },
    { id: "settings", label: "Settings", icon: Settings, component: SettingsTab, description: "Configuration" },
  ];

  const activeTabObj = tabs.find(t => t.id === activeTab);
  const ActiveComponent = activeTabObj?.component;

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Close sidebar on mobile after selecting tab
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 bg-gradient-to-b from-slate-950 to-slate-900 border-r border-slate-700/50 transition-transform duration-300 flex flex-col shadow-2xl`}
      >
        {/* Logo */}
        <div className="p-4 sm:p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-white text-lg">AutoParts</h1>
                <p className="text-xs text-slate-400">Management Pro</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 sm:py-6 space-y-1 sm:space-y-2 overflow-y-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500/30 to-blue-600/20 text-blue-300 border border-blue-500/50 shadow-lg shadow-blue-500/20"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white active:scale-95"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-all ${isActive ? "text-blue-400" : "group-hover:text-blue-300"}`} />
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm sm:text-base">{tab.label}</div>
                  <div className="text-xs text-slate-400 group-hover:text-slate-300">{tab.description}</div>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-blue-400" />}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-3 sm:p-4 border-t border-slate-700/50 space-y-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/40">
            <Avatar className="h-10 w-10 border-2 border-blue-500/50">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold">
                {user?.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">{user?.username}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="w-full border-slate-600 bg-slate-800/50 hover:bg-red-500/20 hover:border-red-500/50 text-slate-200 hover:text-red-300 transition-all active:scale-95"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/50 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-300 hover:text-white hover:bg-slate-700 p-2"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white truncate">
                {activeTabObj?.label}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 truncate">
                {activeTabObj?.description}
              </p>
            </div>

            {/* User avatar on mobile (small screens) */}
            <div className="lg:hidden">
              <Avatar className="h-8 w-8 border-2 border-blue-500/50">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xs">
                  {user?.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-900/50 to-slate-800/50">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="animate-fadeIn max-w-7xl mx-auto">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
