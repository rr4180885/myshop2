import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useState } from "react";
import { Trash2, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InventoryTab() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const { data: products = [] } = useQuery({
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

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200/50 dark:border-slate-700/50">
          <CardTitle>Product Inventory ({products.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">Code</th>
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">Product</th>
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">Brand</th>
                  <th className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">Stock</th>
                  <th className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">Buy Price</th>
                  <th className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">Sell Price</th>
                  <th className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">GST %</th>
                  <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors" data-testid={`row-product-${product.id}`}>
                    <td className="p-4 text-sm font-mono text-slate-600 dark:text-slate-400">{product.code}</td>
                    <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{product.name}</td>
                    <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{product.brand}</td>
                    <td className={`p-4 text-right text-sm font-semibold ${product.stock < 10 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editValues.stock}
                          onChange={(e) => setEditValues({ ...editValues, stock: parseInt(e.target.value) })}
                          className="w-20 ml-auto"
                        />
                      ) : (
                        product.stock
                      )}
                    </td>
                    <td className="p-4 text-right text-sm">
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editValues.purchasePrice}
                          onChange={(e) => setEditValues({ ...editValues, purchasePrice: e.target.value })}
                          className="w-24 ml-auto"
                        />
                      ) : (
                        `₹${product.purchasePrice}`
                      )}
                    </td>
                    <td className="p-4 text-right text-sm">
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editValues.sellingPrice}
                          onChange={(e) => setEditValues({ ...editValues, sellingPrice: e.target.value })}
                          className="w-24 ml-auto"
                        />
                      ) : (
                        `₹${product.sellingPrice}`
                      )}
                    </td>
                    <td className="p-4 text-right text-sm">
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editValues.gstRate}
                          onChange={(e) => setEditValues({ ...editValues, gstRate: parseInt(e.target.value) })}
                          className="w-16 ml-auto"
                        />
                      ) : (
                        `${product.gstRate}%`
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {editingId === product.id ? (
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => saveEdit(product.id)}
                            className="border-green-400/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                            data-testid={`button-save-${product.id}`}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            className="border-slate-400/50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(product)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            data-testid={`button-edit-${product.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            data-testid={`button-delete-${product.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {products.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No products yet. Add your first product!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
