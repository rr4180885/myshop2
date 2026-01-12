import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useState } from "react";
import { Trash2, Edit2, Check, X, Loader2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InventoryTab() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200/50 dark:border-slate-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Product Inventory</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Manage your products ({products.length} total)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium mb-2">No products yet</p>
              <p className="text-sm">Add your first product to get started!</p>
            </div>
          ) : (
            <div className="relative">
              {/* Scrollable table container with fixed header */}
              <div className="overflow-auto max-h-[600px]" style={{ scrollbarGutter: 'stable' }}>
                <table className="w-full relative">
                  <thead className="sticky top-0 z-10 bg-slate-900 dark:bg-slate-800">
                    <tr className="border-b-2 border-slate-700 dark:border-slate-600">
                      <th className="text-left p-3 font-semibold text-slate-200 text-xs uppercase tracking-wider whitespace-nowrap">
                        Code
                      </th>
                      <th className="text-left p-3 font-semibold text-slate-200 text-xs uppercase tracking-wider whitespace-nowrap">
                        Product
                      </th>
                      <th className="text-left p-3 font-semibold text-slate-200 text-xs uppercase tracking-wider whitespace-nowrap">
                        Brand
                      </th>
                      <th className="text-right p-3 font-semibold text-slate-200 text-xs uppercase tracking-wider whitespace-nowrap">
                        Stock
                      </th>
                      <th className="text-right p-3 font-semibold text-slate-200 text-xs uppercase tracking-wider whitespace-nowrap">
                        Buy Price
                      </th>
                      <th className="text-right p-3 font-semibold text-slate-200 text-xs uppercase tracking-wider whitespace-nowrap">
                        Sell Price
                      </th>
                      <th className="text-right p-3 font-semibold text-slate-200 text-xs uppercase tracking-wider whitespace-nowrap">
                        GST %
                      </th>
                      <th className="text-center p-3 font-semibold text-slate-200 text-xs uppercase tracking-wider whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-950">
                    {products.map((product, index) => (
                      <tr 
                        key={product.id} 
                        className={`border-b border-slate-200/50 dark:border-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-150 ${
                          index % 2 === 0 ? 'bg-slate-50/30 dark:bg-slate-900/30' : ''
                        }`}
                        data-testid={`row-product-${product.id}`}
                      >
                        <td className="p-3 text-sm font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {product.code}
                        </td>
                        <td className="p-3 text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">
                          {product.name}
                        </td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {product.brand}
                        </td>
                        <td className={`p-3 text-right text-sm font-semibold whitespace-nowrap ${
                          product.stock < 10 
                            ? "text-red-600 dark:text-red-400" 
                            : "text-green-600 dark:text-green-400"
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
                        <td className="p-3 text-right text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
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
                        <td className="p-3 text-right text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">
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
                        <td className="p-3 text-right text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
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
                                className="h-8 w-8 p-0 border-green-500/50 text-green-600 hover:bg-green-50 hover:border-green-500 dark:hover:bg-green-950/30"
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
                                className="h-8 w-8 p-0 border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                data-testid={`button-edit-${product.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMutation.mutate(product.id)}
                                disabled={deleteMutation.isPending}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
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
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Scroll indicator */}
              {products.length > 10 && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-slate-950 to-transparent pointer-events-none" />
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Summary footer */}
      {products.length > 0 && (
        <div className="flex justify-between items-center px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            Total Products: <span className="font-semibold text-slate-900 dark:text-white">{products.length}</span>
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            Low Stock Items: <span className="font-semibold text-red-600 dark:text-red-400">
              {products.filter((p: any) => p.stock < 10).length}
            </span>
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            Total Stock Value: <span className="font-semibold text-green-600 dark:text-green-400">
              ₹{products.reduce((sum: number, p: any) => sum + (Number(p.purchasePrice) * p.stock), 0).toLocaleString()}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
