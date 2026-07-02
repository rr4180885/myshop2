import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@shared/routes";
import StatCard from "@/components/shop/StatCard";
import PageHeader from "@/components/shop/PageHeader";
import { TrendingUp, Package, AlertCircle, DollarSign, Search, Sparkles, Tag, Loader2, ShoppingCart, TrendingDown, Calendar, ChevronDown, ChevronUp, LayoutDashboard } from "lucide-react";
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
    { label: "Total Products", value: totalProducts, icon: Package, variant: "accent" as const },
    { label: "Stock Value", value: `₹${totalStockValue.toLocaleString()}`, icon: DollarSign, variant: "success" as const },
    { label: "Total Units", value: totalStockUnits, icon: TrendingUp, variant: "default" as const },
    { label: "Low Stock", value: lowStockCount, icon: AlertCircle, variant: "warning" as const, hint: lowStockCount > 0 ? "Needs attention" : "All good" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of sales, inventory health, and quick product lookup."
        icon={LayoutDashboard}
        actions={
          <Select value={salesPeriod} onValueChange={setSalesPeriod}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Sales Summary */}
      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold">Sales Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Sales</p>
              <p className="mt-2 text-2xl font-semibold text-success tabular-nums">
                ₹{salesAnalytics.totalSales.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {salesAnalytics.invoiceCount} invoice{salesAnalytics.invoiceCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Profit</p>
              <p className="mt-2 text-2xl font-semibold text-accent tabular-nums">
                ₹{salesAnalytics.totalProfit.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {salesAnalytics.totalProfit > 0 ? `${((salesAnalytics.totalProfit / salesAnalytics.totalSales) * 100).toFixed(1)}% margin` : "No sales"}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Period</p>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {salesPeriod === "day" ? "Today" : "This Month"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Top Selling Products */}
          {salesAnalytics.topProducts.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Top Selling Products
              </h3>
              <div className="space-y-2">
                {salesAnalytics.topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Sold: {product.quantity} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success text-lg">
                        ₹{product.revenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-accent font-semibold">
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
      <Card className="premium-card border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <CardTitle className="font-display">Instant Product Price Search</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
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
            <div className="mt-4 space-y-3">
              <p className="text-sm font-bold text-foreground">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}:
              </p>
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-accent/50 hover:shadow-lg transition-all"
                  data-testid={`search-result-${product.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Tag className="w-4 h-4 text-primary" />
                      </div>
                      <p className="font-bold text-foreground">{product.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ml-10">
                      {product.brand} • Code: {product.code} • HSN: {product.hsnCode || '8708'}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-display font-black text-primary">
                      ₹{product.sellingPrice}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Stock: <span className={product.stock < 10 ? "text-warning font-bold" : "text-success font-bold"}>{product.stock}</span> units
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery && searchResults.length === 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-xl text-center border border-border">
              <p className="text-muted-foreground">
                No products found matching "{searchQuery}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alert Section - Collapsible */}
      {lowStockItems.length > 0 && (
        <Card className="premium-card border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10" data-testid="card-low-stock-alert">
          <CardHeader className="pb-4 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="font-display">Low Stock Alert</CardTitle>
                  <span className="text-sm text-warning font-semibold">({lowStockItems.length} items)</span>
                </div>
              </div>
              {lowStockItems.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLowStockExpanded(!lowStockExpanded)}
                  className="text-warning hover:bg-warning/10"
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
                  className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-warning/30 hover:shadow-md transition-all"
                  data-testid={`text-low-stock-${item.id}`}
                >
                  <div>
                    <p className="font-bold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-warning text-lg">{item.stock} units</p>
                    <p className="text-xs text-muted-foreground">⚠️ Below 2</p>
                  </div>
                </div>
              ))}
            </div>
            {!lowStockExpanded && lowStockItems.length > 2 && (
              <p className="text-center text-sm text-warning font-semibold mt-3">
                +{lowStockItems.length - 2} more items
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="font-display">Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 p-4 bg-muted/30 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-wide">Average Stock Level</p>
              <p className="text-3xl font-display font-black text-accent">{(totalStockUnits / totalProducts).toFixed(1)}</p>
            </div>
            <div className="space-y-2 p-4 bg-muted/30 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-wide">Products with Stock</p>
              <p className="text-3xl font-display font-black text-success">{products.filter(p => p.stock > 0).length}</p>
            </div>
            <div className="space-y-2 p-4 bg-muted/30 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-wide">Out of Stock</p>
              <p className="text-3xl font-display font-black text-destructive">{products.filter(p => p.stock === 0).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
