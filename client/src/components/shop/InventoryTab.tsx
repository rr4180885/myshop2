import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useState } from "react";
import PageHeader from "@/components/shop/PageHeader";
import PageShell from "@/components/shop/PageShell";
import LoadingSpinner from "@/components/shop/LoadingSpinner";
import EmptyState from "@/components/shop/EmptyState";
import StatCard from "@/components/shop/StatCard";
import SectionCard from "@/components/shop/SectionCard";
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

  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner label="Loading inventory..." />;
  }

  return (
    <PageShell>
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

      {products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Products" value={products.length} icon={Package} variant="default" />
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

      <SectionCard title={`Products (${filteredProducts.length})`} icon={Package} noPadding>
        {products.length === 0 ? (
          <EmptyState icon={Package} title="No products yet" description="Add your first product" />
        ) : (
          <div className="overflow-x-auto">
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
                  <th className="text-center w-24">Actions</th>
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
                  filteredProducts.map((product: any) => (
                    <tr key={product.id} data-testid={`row-product-${product.id}`}>
                      <td className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {product.code}
                      </td>
                      <td className="font-medium whitespace-nowrap">{product.name}</td>
                      <td className="text-muted-foreground whitespace-nowrap">{product.brand}</td>
                      <td className={`text-right font-medium whitespace-nowrap ${product.stock < 10 ? "text-warning" : "text-success"}`}>
                        {editingId === product.id ? (
                          <Input
                            type="number"
                            value={editValues.stock}
                            onChange={(e) => setEditValues({ ...editValues, stock: parseInt(e.target.value) })}
                            className="w-20 ml-auto h-8 input-modern"
                          />
                        ) : (
                          product.stock
                        )}
                      </td>
                      <td className="text-right text-muted-foreground whitespace-nowrap">
                        {editingId === product.id ? (
                          <Input
                            type="number"
                            value={editValues.purchasePrice}
                            onChange={(e) => setEditValues({ ...editValues, purchasePrice: e.target.value })}
                            className="w-24 ml-auto h-8 input-modern"
                          />
                        ) : (
                          `₹${product.purchasePrice}`
                        )}
                      </td>
                      <td className="text-right font-medium whitespace-nowrap">
                        {editingId === product.id ? (
                          <Input
                            type="number"
                            value={editValues.sellingPrice}
                            onChange={(e) => setEditValues({ ...editValues, sellingPrice: e.target.value })}
                            className="w-24 ml-auto h-8 input-modern"
                          />
                        ) : (
                          `₹${product.sellingPrice}`
                        )}
                      </td>
                      <td className="text-right text-muted-foreground whitespace-nowrap">
                        {editingId === product.id ? (
                          <Input
                            type="number"
                            value={editValues.gstRate}
                            onChange={(e) => setEditValues({ ...editValues, gstRate: parseInt(e.target.value) })}
                            className="w-16 ml-auto h-8 input-modern"
                          />
                        ) : (
                          `${product.gstRate}%`
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1 justify-center">
                          {editingId === product.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => saveEdit(product.id)}
                                disabled={updateMutation.isPending}
                                className="btn-icon"
                                data-testid={`button-save-${product.id}`}
                              >
                                {updateMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="btn-icon">
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(product)}
                                className="btn-icon"
                                data-testid={`button-edit-${product.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteMutation.mutate(product.id)}
                                disabled={deleteMutation.isPending}
                                className="btn-icon text-destructive hover:text-destructive"
                                data-testid={`button-delete-${product.id}`}
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}
