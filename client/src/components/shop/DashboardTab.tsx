import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@shared/routes";
import { TrendingUp, Package, AlertCircle, DollarSign, Search, Sparkles, Tag, Loader2, ShoppingCart, TrendingDown, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DashboardTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [salesPeriod, setSalesPeriod] = useState("month"); // "day" or "month"
  const [lowStockExpanded, setLowStockExpanded] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path);
      return res.json();
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: [api.invoices.list.path],
    queryFn: async () => {
      const res = await fetch(api.invoices.list.path);
      return res.json();
    },
  });

  // AI-powered smart search function
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTerms = query.toLowerCase().trim();
    
    // Smart search across multiple attributes
    const results = products.filter((product: any) => {
      const matchName = product.name?.toLowerCase().includes(searchTerms);
      const matchBrand = product.brand?.toLowerCase().includes(searchTerms);
      const matchCode = product.code?.toLowerCase().includes(searchTerms);
      const matchHSN = product.hsnCode?.toLowerCase().includes(searchTerms);
      
      // Natural language understanding for price queries
      const priceMatch = searchTerms.match(/(?:under|below|less than|<)\s*(\d+)/i);
      if (priceMatch) {
        const maxPrice = parseFloat(priceMatch[1]);
        return parseFloat(product.sellingPrice) < maxPrice;
      }
      
      const priceAboveMatch = searchTerms.match(/(?:above|over|more than|greater than|>)\s*(\d+)/i);
      if (priceAboveMatch) {
        const minPrice = parseFloat(priceAboveMatch[1]);
        return parseFloat(product.sellingPrice) > minPrice;
      }
      
      // Check for low stock queries
      if (searchTerms.includes('low stock') || searchTerms.includes('running low')) {
        return product.stock < 10;
      }
      
      if (searchTerms.includes('out of stock') || searchTerms.includes('no stock')) {
        return product.stock === 0;
      }
      
      if (searchTerms.includes('available') || searchTerms.includes('in stock')) {
        return product.stock > 0;
      }
      
      return matchName || matchBrand || matchCode || matchHSN;
    });
    
    setSearchResults(results.slice(0, 5)); // Limit to top 5 results
  };

  // Calculate sales analytics
  const calculateSalesAnalytics = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let periodInvoices = invoices;
    
    if (salesPeriod === "day") {
      periodInvoices = invoices.filter((inv: any) => {
        const invDate = new Date(inv.createdAt);
        return invDate >= startOfToday;
      });
    } else {
      periodInvoices = invoices.filter((inv: any) => {
        const invDate = new Date(inv.createdAt);
        return invDate >= startOfMonth;
      });
    }

    // Calculate total sales and profit
    let totalSales = 0;
    let totalProfit = 0;
    const productsSoldMap = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>();

    periodInvoices.forEach((invoice: any) => {
      const items = JSON.parse(invoice.items);
      const invoiceTotal = Number(invoice.grandTotal);
      totalSales += invoiceTotal;

      items.forEach((item: any) => {
        const product = products.find((p: any) => p.id === item.id);
        if (product) {
          const quantity = Number(item.quantity) || 0;
          const sellingPrice = Number(item.sellingPrice) || 0;
          const purchasePrice = Number(product.purchasePrice) || 0;
          const revenue = quantity * sellingPrice;
          const profit = quantity * (sellingPrice - purchasePrice);

          totalProfit += profit;

          const existing = productsSoldMap.get(item.name);
          if (existing) {
            existing.quantity += quantity;
            existing.revenue += revenue;
            existing.profit += profit;
          } else {
            productsSoldMap.set(item.name, {
              name: item.name,
              quantity,
              revenue,
              profit,
            });
          }
        }
      });
    });

    const topProducts = Array.from(productsSoldMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalSales,
      totalProfit,
      invoiceCount: periodInvoices.length,
      topProducts,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalProducts = products.length;
  const totalStockValue = products.reduce(
    (sum, p) => sum + (Number(p.purchasePrice) * p.stock),
    0
  );
  const lowStockCount = products.filter((p) => p.stock < 2).length;
  const lowStockItems = products.filter((p) => p.stock < 2);
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);

  const salesAnalytics = calculateSalesAnalytics();

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
    <div className="space-y-6">
      {/* Sales Summary Card */}
      <Card className="border-green-200/50 dark:border-green-900/50 bg-gradient-to-br from-green-50/50 to-green-50/30 dark:from-green-950/30 dark:to-green-950/10 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
              <CardTitle className="text-green-900 dark:text-green-400">Sales Summary</CardTitle>
            </div>
            <Select value={salesPeriod} onValueChange={setSalesPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Sales</p>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{salesAnalytics.totalSales.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {salesAnalytics.invoiceCount} invoice{salesAnalytics.invoiceCount !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Profit</p>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ₹{salesAnalytics.totalProfit.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {salesAnalytics.totalProfit > 0 ? `${((salesAnalytics.totalProfit / salesAnalytics.totalSales) * 100).toFixed(1)}% margin` : 'No sales'}
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Period</p>
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {salesPeriod === "day" ? "Today" : "This Month"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Top Selling Products */}
          {salesAnalytics.topProducts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Top Selling Products
              </h3>
              <div className="space-y-2">
                {salesAnalytics.topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Sold: {product.quantity} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        ₹{product.revenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Profit: ₹{product.profit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {salesAnalytics.invoiceCount === 0 && (
            <div className="text-center py-6 text-slate-600 dark:text-slate-400">
              <TrendingDown className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No sales recorded for {salesPeriod === "day" ? "today" : "this month"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI-Powered Product Price Search */}
      <Card className="border-blue-200/50 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/50 to-blue-50/30 dark:from-blue-950/30 dark:to-blue-950/10 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-blue-900 dark:text-blue-400">Instant Product Price Search</CardTitle>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Search by name, SKU, brand, category, or use natural language queries like "products under 500" or "low stock items"
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Try: 'brake pad', 'products under 500', 'low stock', 'maruti', etc."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12 text-base bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
              data-testid="input-ai-search"
            />
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}:
              </p>
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                  data-testid={`search-result-${product.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <p className="font-semibold text-slate-900 dark:text-white">{product.name}</p>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {product.brand} • Code: {product.code} • HSN: {product.hsnCode || '8708'}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{product.sellingPrice}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Stock: <span className={product.stock < 10 ? "text-orange-600 font-semibold" : "text-green-600 font-semibold"}>{product.stock}</span> units
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery && searchResults.length === 0 && (
            <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
              <p className="text-slate-600 dark:text-slate-400">
                No products found matching "{searchQuery}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Low Stock Alert Section - Collapsible */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200/50 dark:border-orange-900/50 bg-gradient-to-br from-orange-50/50 to-orange-50/30 dark:from-orange-950/30 dark:to-orange-950/10 overflow-hidden" data-testid="card-low-stock-alert">
          <CardHeader className="pb-4 border-b border-orange-200/30 dark:border-orange-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <CardTitle className="text-orange-900 dark:text-orange-400">Low Stock Alert</CardTitle>
                <span className="text-sm text-orange-600 dark:text-orange-400">({lowStockItems.length} items)</span>
              </div>
              {lowStockItems.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLowStockExpanded(!lowStockExpanded)}
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                >
                  {lowStockExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show All
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {(lowStockExpanded ? lowStockItems : lowStockItems.slice(0, 2)).map((item: any) => (
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">⚠️ Below 2</p>
                  </div>
                </div>
              ))}
            </div>
            {!lowStockExpanded && lowStockItems.length > 2 && (
              <p className="text-center text-sm text-orange-600 dark:text-orange-400 mt-3">
                +{lowStockItems.length - 2} more items
              </p>
            )}
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
