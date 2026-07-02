import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@shared/routes";
import StatCard from "@/components/shop/StatCard";
import PageHeader from "@/components/shop/PageHeader";
import SectionCard from "@/components/shop/SectionCard";
import EmptyState from "@/components/shop/EmptyState";
import { TrendingUp, Package, AlertCircle, DollarSign, Search, Loader2, ShoppingCart, TrendingDown, ChevronDown, ChevronUp, LayoutDashboard } from "lucide-react";
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

      <SectionCard title="Sales Summary" icon={ShoppingCart}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="section-stat">
              <p className="section-stat-label">Total Sales</p>
              <p className="section-stat-value text-success">
                ₹{salesAnalytics.totalSales.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {salesAnalytics.invoiceCount} invoice{salesAnalytics.invoiceCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="section-stat">
              <p className="section-stat-label">Total Profit</p>
              <p className="section-stat-value text-accent">
                ₹{salesAnalytics.totalProfit.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {salesAnalytics.totalProfit > 0 ? `${((salesAnalytics.totalProfit / salesAnalytics.totalSales) * 100).toFixed(1)}% margin` : "—"}
              </p>
            </div>
            <div className="section-stat">
              <p className="section-stat-label">Period</p>
              <p className="section-stat-value text-base">
                {salesPeriod === "day" ? "Today" : "This Month"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {salesAnalytics.topProducts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Top Products
              </h3>
              <div className="space-y-2">
                {salesAnalytics.topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.quantity} sold</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-semibold text-success tabular-nums">₹{product.revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">Profit ₹{product.profit.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {salesAnalytics.invoiceCount === 0 && (
            <EmptyState
              icon={TrendingDown}
              title={`No sales ${salesPeriod === "day" ? "today" : "this month"}`}
            />
          )}
      </SectionCard>

      <SectionCard title="Product Search" icon={Search}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, brand, or HSN..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 input-modern"
              data-testid="input-ai-search"
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
                  data-testid={`search-result-${product.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {product.brand} · {product.code}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-semibold text-primary tabular-nums">₹{product.sellingPrice}</p>
                    <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery && searchResults.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground text-center py-4">
              No products found
            </p>
          )}
      </SectionCard>

      {lowStockItems.length > 0 && (
        <SectionCard
          title={`Low Stock (${lowStockItems.length})`}
          icon={AlertCircle}
          headerClassName="border-warning/20"
          actions={
              lowStockItems.length > 2 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLowStockExpanded(!lowStockExpanded)}
                  className="text-warning h-8"
                >
                  {lowStockExpanded ? (
                    <><ChevronUp className="w-4 h-4 mr-1" />Less</>
                  ) : (
                    <><ChevronDown className="w-4 h-4 mr-1" />All</>
                  )}
                </Button>
              ) : undefined
          }
          data-testid="card-low-stock-alert"
        >
            <div className="space-y-2">
              {(lowStockExpanded ? lowStockItems : lowStockItems.slice(0, 2)).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/60"
                  data-testid={`text-low-stock-${item.id}`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.code}</p>
                  </div>
                  <p className="font-semibold text-warning shrink-0 ml-4">{item.stock} left</p>
                </div>
              ))}
            </div>
            {!lowStockExpanded && lowStockItems.length > 2 && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                +{lowStockItems.length - 2} more
              </p>
            )}
        </SectionCard>
      )}

      <SectionCard title="Inventory Summary" icon={Package}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="section-stat">
              <p className="section-stat-label">Avg Stock</p>
              <p className="section-stat-value">{totalProducts ? (totalStockUnits / totalProducts).toFixed(1) : "0"}</p>
            </div>
            <div className="section-stat">
              <p className="section-stat-label">In Stock</p>
              <p className="section-stat-value text-success">{products.filter(p => p.stock > 0).length}</p>
            </div>
            <div className="section-stat">
              <p className="section-stat-label">Out of Stock</p>
              <p className="section-stat-value text-destructive">{products.filter(p => p.stock === 0).length}</p>
            </div>
          </div>
      </SectionCard>
    </div>
  );
}
