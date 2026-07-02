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

  const stockValue = products.reduce(
    (sum: number, p: any) => sum + Number(p.purchasePrice) * p.stock,
    0
  );
  const lowStock = products.filter((p: any) => p.stock < 10).length;

  if (isLoading) {
    return <LoadingSpinner label="Loading inventory..." />;
  }

  return (
    <PageShell className="page-shell-fill h-[calc(100dvh-3.5rem-2rem)] sm:h-[calc(100dvh-3.5rem-3rem)] lg:h-[calc(100dvh-3.5rem-4rem)]">
      <PageHeader
        title="Inventory"
        description={`${products.length} products · ${lowStock} low stock · ₹${stockValue.toLocaleString()} value`}
        icon={Package}
        actions={
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 input-modern h-9"
            />
          </div>
        }
      />

      <SectionCard
        title={`Products (${filteredProducts.length})`}
        icon={Package}
        noPadding
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {products.length === 0 ? (
          <EmptyState icon={Package} title="No products yet" description="Add your first product" />
        ) : (
          <div className="inventory-table-wrap">
          <table className="data-table data-table-compact data-table-sticky">
            <thead>
              <tr>
                <th className="col-code">Code</th>
                <th className="w-[15%]">Product</th>
                <th className="hidden md:table-cell w-[16%]">Brand</th>
                <th className="text-right col-stock">Stock</th>
                <th className="text-right hidden lg:table-cell col-price">Buy</th>
                <th className="text-right col-price">Sell</th>
                <th className="text-right hidden lg:table-cell col-gst">GST</th>
                <th className="text-center col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product: any) => (
                  <tr key={product.id} data-testid={`row-product-${product.id}`}>
                    <td className="font-mono text-muted-foreground truncate col-code" title={product.code}>
                      {product.code}
                    </td>
                    <td className="font-medium truncate max-w-0" title={product.name}>
                      {product.name}
                    </td>
                    <td className="text-muted-foreground truncate hidden md:table-cell max-w-0" title={product.brand}>
                      {product.brand}
                    </td>
                    <td className={`text-right font-medium tabular-nums col-stock ${product.stock < 10 ? "text-warning" : "text-success"}`}>
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editValues.stock}
                          onChange={(e) => setEditValues({ ...editValues, stock: parseInt(e.target.value) })}
                          className="w-14 ml-auto h-7 input-modern text-xs px-1"
                        />
                      ) : (
                        product.stock
                      )}
                    </td>
                    <td className="text-right text-muted-foreground tabular-nums hidden lg:table-cell col-price">
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editValues.purchasePrice}
                          onChange={(e) => setEditValues({ ...editValues, purchasePrice: e.target.value })}
                          className="w-16 ml-auto h-7 input-modern text-xs px-1"
                        />
                      ) : (
                        `₹${product.purchasePrice}`
                      )}
                    </td>
                    <td className="text-right font-medium tabular-nums col-price">
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editValues.sellingPrice}
                          onChange={(e) => setEditValues({ ...editValues, sellingPrice: e.target.value })}
                          className="w-16 ml-auto h-7 input-modern text-xs px-1"
                        />
                      ) : (
                        `₹${product.sellingPrice}`
                      )}
                    </td>
                    <td className="text-right text-muted-foreground tabular-nums hidden lg:table-cell col-gst">
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editValues.gstRate}
                          onChange={(e) => setEditValues({ ...editValues, gstRate: parseInt(e.target.value) })}
                          className="w-12 ml-auto h-7 input-modern text-xs px-1"
                        />
                      ) : (
                        `${product.gstRate}%`
                      )}
                    </td>
                    <td className="col-actions">
                      <div className="flex gap-0.5 justify-center shrink-0">
                        {editingId === product.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => saveEdit(product.id)}
                              disabled={updateMutation.isPending}
                              className="h-6 w-6 p-0 shrink-0"
                              data-testid={`button-save-${product.id}`}
                            >
                              {updateMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-6 w-6 p-0 shrink-0">
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(product)}
                              className="h-6 w-6 p-0 shrink-0"
                              data-testid={`button-edit-${product.id}`}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteMutation.mutate(product.id)}
                              disabled={deleteMutation.isPending}
                              className="h-6 w-6 p-0 shrink-0 text-destructive hover:text-destructive"
                              data-testid={`button-delete-${product.id}`}
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
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
