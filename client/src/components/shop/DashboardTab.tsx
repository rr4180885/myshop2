import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@shared/routes";
import { TrendingUp, Package, AlertCircle, DollarSign } from "lucide-react";

export default function DashboardTab() {
  const { data: products = [] } = useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path);
      return res.json();
    },
  });

  const totalProducts = products.length;
  const totalStockValue = products.reduce(
    (sum, p) => sum + (Number(p.purchasePrice) * p.stock),
    0
  );
  const lowStockCount = products.filter((p) => p.stock < 10).length;
  const lowStockItems = products.filter((p) => p.stock < 10);
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);

  const stats = [
    {
      title: "Total Products",
      value: totalProducts,
      icon: Package,
      color: "from-blue-500 to-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Stock Value",
      value: `₹${totalStockValue.toLocaleString()}`,
      icon: DollarSign,
      color: "from-green-500 to-green-600",
      bg: "bg-green-50 dark:bg-green-950",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Total Units",
      value: totalStockUnits,
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Low Stock Alert",
      value: lowStockCount,
      icon: AlertCircle,
      color: "from-red-500 to-red-600",
      bg: "bg-red-50 dark:bg-red-950",
      textColor: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={idx} 
              className="border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.title}</p>
                <p className="text-3xl font-display font-bold text-slate-900 dark:text-white mt-2">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Low Stock Alert Section */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200/50 dark:border-orange-900/50 bg-gradient-to-br from-orange-50/50 to-orange-50/30 dark:from-orange-950/30 dark:to-orange-950/10 overflow-hidden" data-testid="card-low-stock-alert">
          <CardHeader className="pb-4 border-b border-orange-200/30 dark:border-orange-900/30">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <CardTitle className="text-orange-900 dark:text-orange-400">Low Stock Alert</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
                  data-testid={`text-low-stock-${item.id}`}
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600 dark:text-orange-400">{item.stock} units</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">⚠️ Below 10</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card className="border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle>Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Average Stock Level</p>
              <p className="text-2xl font-bold">{(totalStockUnits / totalProducts).toFixed(1)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Products with Stock</p>
              <p className="text-2xl font-bold">{products.filter(p => p.stock > 0).length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{products.filter(p => p.stock === 0).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
