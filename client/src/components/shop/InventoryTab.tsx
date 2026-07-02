import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useState } from "react";
import PageHeader from "@/components/shop/PageHeader";
import PageShell from "@/components/shop/PageShell";
import LoadingSpinner from "@/components/shop/LoadingSpinner";
import EmptyState from "@/components/shop/EmptyState";
import SectionCard from "@/components/shop/SectionCard";
import { Package, Search, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ProductForm = {
  name: string;
  brand: string;
  code: string;
  hsnCode: string;
  stock: number;
  purchasePrice: string;
  sellingPrice: string;
  gstRate: number;
};

function toFormValues(product: any): ProductForm {
  return {
    name: product.name ?? "",
    brand: product.brand ?? "",
    code: product.code ?? "",
    hsnCode: product.hsnCode ?? "8708",
    stock: Number(product.stock) || 0,
    purchasePrice: String(product.purchasePrice ?? ""),
    sellingPrice: String(product.sellingPrice ?? ""),
    gstRate: Number(product.gstRate) || 0,
  };
}

export default function InventoryTab() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<ProductForm | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", api.products.delete.path.replace(":id", String(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      setSelectedProduct(null);
      setFormValues(null);
      setDeleteConfirmOpen(false);
      toast({ title: "Product deleted" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: ProductForm & { id: number }) => {
      return apiRequest("PUT", api.products.update.path.replace(":id", String(id)), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      setSelectedProduct(null);
      setFormValues(null);
      toast({ title: "Product updated" });
    },
    onError: () => {
      toast({ title: "Update failed", variant: "destructive" });
    },
  });

  const openProduct = (product: any) => {
    setSelectedProduct(product);
    setFormValues(toFormValues(product));
  };

  const closeModal = () => {
    if (updateMutation.isPending) return;
    setSelectedProduct(null);
    setFormValues(null);
  };

  const saveProduct = () => {
    if (!selectedProduct || !formValues) return;
    updateMutation.mutate({ id: selectedProduct.id, ...formValues });
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
            <table className="inventory-table inventory-table-sticky">
              <thead>
                <tr>
                  <th className="w-[11%]">Code</th>
                  <th className="w-[24%]">Product</th>
                  <th className="hidden md:table-cell w-[18%]">Brand</th>
                  <th className="num w-[9%]">Stock</th>
                  <th className="num hidden lg:table-cell w-[11%]">Buy</th>
                  <th className="num w-[11%]">Sell</th>
                  <th className="num hidden lg:table-cell w-[9%]">GST</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product: any) => (
                    <tr
                      key={product.id}
                      data-testid={`row-product-${product.id}`}
                      onClick={() => openProduct(product)}
                      className="cursor-pointer"
                    >
                      <td className="font-mono text-muted-foreground cell-clip" title={product.code}>
                        {product.code}
                      </td>
                      <td className="font-medium cell-clip" title={product.name}>
                        {product.name}
                      </td>
                      <td className="text-muted-foreground cell-clip hidden md:table-cell" title={product.brand}>
                        {product.brand}
                      </td>
                      <td className={`num font-medium ${product.stock < 10 ? "text-warning" : "text-success"}`}>
                        {product.stock}
                      </td>
                      <td className="num text-muted-foreground hidden lg:table-cell">
                        ₹{product.purchasePrice}
                      </td>
                      <td className="num font-medium">₹{product.sellingPrice}</td>
                      <td className="num text-muted-foreground hidden lg:table-cell">{product.gstRate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Dialog open={!!selectedProduct && !!formValues} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details. Changes apply to inventory and billing.
            </DialogDescription>
          </DialogHeader>

          {formValues && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  className="input-modern"
                  data-testid="input-edit-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="edit-brand">Brand</Label>
                  <Input
                    id="edit-brand"
                    value={formValues.brand}
                    onChange={(e) => setFormValues({ ...formValues, brand: e.target.value })}
                    className="input-modern"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-code">Code</Label>
                  <Input
                    id="edit-code"
                    value={formValues.code}
                    onChange={(e) => setFormValues({ ...formValues, code: e.target.value })}
                    className="input-modern font-mono"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-hsn">HSN Code</Label>
                <Input
                  id="edit-hsn"
                  value={formValues.hsnCode}
                  onChange={(e) => setFormValues({ ...formValues, hsnCode: e.target.value })}
                  className="input-modern"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock">Stock</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    min={0}
                    value={formValues.stock}
                    onChange={(e) => setFormValues({ ...formValues, stock: parseInt(e.target.value) || 0 })}
                    className="input-modern"
                    data-testid="input-edit-stock"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-gst">GST %</Label>
                  <Input
                    id="edit-gst"
                    type="number"
                    min={0}
                    max={100}
                    value={formValues.gstRate}
                    onChange={(e) => setFormValues({ ...formValues, gstRate: parseInt(e.target.value) || 0 })}
                    className="input-modern"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="edit-buy">Buy Price (₹)</Label>
                  <Input
                    id="edit-buy"
                    type="number"
                    min={0}
                    step="0.01"
                    value={formValues.purchasePrice}
                    onChange={(e) => setFormValues({ ...formValues, purchasePrice: e.target.value })}
                    className="input-modern"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-sell">Sell Price (₹)</Label>
                  <Input
                    id="edit-sell"
                    type="number"
                    min={0}
                    step="0.01"
                    value={formValues.sellingPrice}
                    onChange={(e) => setFormValues({ ...formValues, sellingPrice: e.target.value })}
                    className="input-modern"
                    data-testid="input-edit-sell"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive sm:mr-auto"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={deleteMutation.isPending || updateMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={closeModal} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveProduct}
              disabled={updateMutation.isPending}
              data-testid="button-save-product"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{selectedProduct?.name}&quot; from inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedProduct && deleteMutation.mutate(selectedProduct.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
