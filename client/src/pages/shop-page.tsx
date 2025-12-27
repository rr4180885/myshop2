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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-slate-950 to-slate-900 border-r border-slate-700/50 transition-all duration-300 flex flex-col shadow-2xl`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-display font-bold text-white text-lg">AutoParts</h1>
                <p className="text-xs text-slate-400">Pro</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500/30 to-blue-600/20 text-blue-300 border border-blue-500/50 shadow-lg shadow-blue-500/10"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
                data-testid={`tab-${tab.id}`}
                title={!sidebarOpen ? tab.label : ""}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-all ${isActive ? "text-blue-400" : "group-hover:text-blue-300"}`} />
                {sidebarOpen && (
                  <>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-slate-400 group-hover:text-slate-300">{tab.description}</div>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-blue-400" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700/50 space-y-3">
          {sidebarOpen && (
            <div className="flex items-center gap-3 px-2 py-2">
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
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="flex-1 border-slate-600 bg-slate-800/50 hover:bg-slate-700 text-slate-200 hover:text-white"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              {sidebarOpen && "Logout"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/50 px-8 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold text-white">{activeTabObj?.label}</h2>
              <p className="text-sm text-slate-400 mt-1">{activeTabObj?.description}</p>
            </div>
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="animate-fadeIn">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
