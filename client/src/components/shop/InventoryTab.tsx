import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useState } from "react";
import PageHeader from "@/components/shop/PageHeader";
import EmptyState from "@/components/shop/EmptyState";
import StatCard from "@/components/shop/StatCard";
import { Package, Search, Loader2, Trash2, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InventoryTab() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path);
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", api.products.delete.path.replace(":id", String(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      toast({ title: "Product deleted" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest("PUT", api.products.update.path.replace(":id", String(id)), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      setEditingId(null);
      toast({ title: "Product updated" });
    },
  });

  const startEdit = (product: any) => {
    setEditingId(product.id);
    setEditValues(product);
  };

  const saveEdit = (id: number) => {
    updateMutation.mutate({ id, ...editValues });
  };

  // Filter products based on search query
  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description={`${products.length} products`}
        icon={Package}
        actions={
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search name, code, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 input-modern"
            />
          </div>
        }
      />

      <Card className="surface-card overflow-hidden">
        <CardContent className="p-0">
          {products.length === 0 ? (
            <EmptyState icon={Package} title="No products yet" description="Add your first product" />
          ) : (
            <div className="relative">
              {/* Scrollable table container with fixed header */}
              <div className="overflow-auto max-h-[600px]" style={{ scrollbarGutter: 'stable' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Product</th>
                      <th>Brand</th>
                      <th className="text-right">Stock</th>
                      <th className="text-right">Buy Price</th>
                      <th className="text-right">Sell Price</th>
                      <th className="text-right">GST %</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center">
                          <EmptyState icon={Search} title="No products found" />
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product: any, index: number) => (
                      <tr 
                        key={product.id} 
                        className={`border-b border-border hover:bg-primary/5 transition-all duration-150 ${
                          index % 2 === 0 ? 'bg-muted/30' : ''
                        }`}
                        data-testid={`row-product-${product.id}`}
                      >
                        <td className="p-3 text-sm font-mono text-foreground/80 whitespace-nowrap">
                          {product.code}
                        </td>
                        <td className="p-3 text-sm font-bold text-foreground whitespace-nowrap">
                          {product.name}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
                          {product.brand}
                        </td>
                        <td className={`p-3 text-right text-sm font-bold whitespace-nowrap ${
                          product.stock < 10 
                            ? "text-warning" 
                            : "text-success"
                        }`}>
                          {editingId === product.id ? (
                            <Input
                              type="number"
                              value={editValues.stock}
                              onChange={(e) => setEditValues({ ...editValues, stock: parseInt(e.target.value) })}
                              className="w-20 ml-auto h-8"
                            />
                          ) : (
                            product.stock
                          )}
                        </td>
                        <td className="p-3 text-right text-sm text-foreground/70 whitespace-nowrap">
                          {editingId === product.id ? (
                            <Input
                              type="number"
                              value={editValues.purchasePrice}
                              onChange={(e) => setEditValues({ ...editValues, purchasePrice: e.target.value })}
                              className="w-24 ml-auto h-8"
                            />
                          ) : (
                            `₹${product.purchasePrice}`
                          )}
                        </td>
                        <td className="p-3 text-right text-sm font-bold text-foreground whitespace-nowrap">
                          {editingId === product.id ? (
                            <Input
                              type="number"
                              value={editValues.sellingPrice}
                              onChange={(e) => setEditValues({ ...editValues, sellingPrice: e.target.value })}
                              className="w-24 ml-auto h-8"
                            />
                          ) : (
                            `₹${product.sellingPrice}`
                          )}
                        </td>
                        <td className="p-3 text-right text-sm text-muted-foreground whitespace-nowrap">
                          {editingId === product.id ? (
                            <Input
                              type="number"
                              value={editValues.gstRate}
                              onChange={(e) => setEditValues({ ...editValues, gstRate: parseInt(e.target.value) })}
                              className="w-16 ml-auto h-8"
                            />
                          ) : (
                            `${product.gstRate}%`
                          )}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {editingId === product.id ? (
                            <div className="flex gap-1.5 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => saveEdit(product.id)}
                                disabled={updateMutation.isPending}
                                className="h-8 w-8 p-0 border-success/50 text-success hover:bg-success/10 hover:border-success"
                                data-testid={`button-save-${product.id}`}
                              >
                                {updateMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(null)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(product)}
                                className="h-8 w-8 p-0 text-accent hover:text-accent/80 hover:bg-accent/10"
                                data-testid={`button-edit-${product.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMutation.mutate(product.id)}
                                disabled={deleteMutation.isPending}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                data-testid={`button-delete-${product.id}`}
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Scroll indicator */}
              {products.length > 10 && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Products" value={products.length} icon={Package} variant="accent" />
          <StatCard
            label="Low Stock"
            value={products.filter((p: any) => p.stock < 10).length}
            icon={Package}
            variant="warning"
          />
          <StatCard
            label="Stock Value"
            value={`₹${products.reduce((sum: number, p: any) => sum + (Number(p.purchasePrice) * p.stock), 0).toLocaleString()}`}
            icon={Package}
            variant="success"
          />
        </div>
      )}
    </div>
  );
}
