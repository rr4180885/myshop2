import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { insertProductSchema, type InsertProduct } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/shop/PageHeader";
import PageShell from "@/components/shop/PageShell";
import SectionCard from "@/components/shop/SectionCard";
import { Plus, Loader2, AlertCircle, Tag, IndianRupee } from "lucide-react";
import { useState, useEffect } from "react";

export default function AddProductTab() {
  const { toast } = useToast();
  const [duplicateCode, setDuplicateCode] = useState<string | null>(null);

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      brand: "",
      code: "",
      hsnCode: "8708",
      stock: 0,
      purchasePrice: "0",
      sellingPrice: "0",
      maxDiscount: "0",
      gstRate: 28,
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path);
      return res.json();
    },
  });

  const codeValue = form.watch("code");

  useEffect(() => {
    if (codeValue?.trim()) {
      const existing = products.find((p: any) => p.code.toLowerCase() === codeValue.toLowerCase());
      setDuplicateCode(existing ? codeValue : null);
    } else {
      setDuplicateCode(null);
    }
  }, [codeValue, products]);

  const mutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const existing = products.find((p: any) => p.code.toLowerCase() === data.code.toLowerCase());
      if (existing) {
        throw new Error(`Product code "${data.code}" already exists.`);
      }
      return apiRequest("POST", api.products.create.path, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      form.reset();
      setDuplicateCode(null);
      toast({ title: "Product added", description: "Added to inventory successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add product", variant: "destructive" });
    },
  });

  return (
    <PageShell narrow>
      <PageHeader title="Add Product" description="Add a new item to inventory" icon={Plus} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          <SectionCard title="Product Details" icon={Tag}>
            <div className="form-grid">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Brake Pad Set" className="mt-1.5 input-modern" {...field} data-testid="input-product-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Brand / Model</FormLabel>
                    <FormControl>
                      <Input placeholder="Maruti Swift" className="mt-1.5 input-modern" {...field} data-testid="input-brand" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Product Code</FormLabel>
                    <FormControl>
                      <div className="relative mt-1.5">
                        <Input
                          placeholder="BP-MS-001"
                          className={`input-modern ${duplicateCode ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                          {...field}
                          data-testid="input-code"
                        />
                        {duplicateCode && (
                          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                        )}
                      </div>
                    </FormControl>
                    {duplicateCode && (
                      <p className="text-xs text-destructive mt-1">Code already exists</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hsnCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">HSN Code</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} className="mt-1.5 input-modern" data-testid="input-hsn-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SectionCard>

          <SectionCard title="Pricing & Stock" icon={IndianRupee}>
            <div className="form-grid-3">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Stock Qty</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="mt-1.5 input-modern"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-stock"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Buy Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" className="mt-1.5 input-modern" {...field} data-testid="input-purchase-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Sell Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" className="mt-1.5 input-modern" {...field} data-testid="input-selling-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="form-grid mt-4">
              <FormField
                control={form.control}
                name="maxDiscount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Max Discount %</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" className="mt-1.5 input-modern" {...field} value={field.value || ""} data-testid="input-max-discount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gstRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">GST Rate %</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="mt-1.5 input-modern"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-gst-rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SectionCard>

          <Button type="submit" disabled={mutation.isPending || !!duplicateCode} data-testid="button-add-product">
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </>
            )}
          </Button>
        </form>
      </Form>
    </PageShell>
  );
}
