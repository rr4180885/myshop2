import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { insertProductSchema, type InsertProduct } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, AlertCircle } from "lucide-react";
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

  // Fetch existing products to check for duplicates
  const { data: products = [] } = useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path);
      return res.json();
    },
  });

  // Watch for code changes to check for duplicates
  const codeValue = form.watch("code");
  
  useEffect(() => {
    if (codeValue && codeValue.trim()) {
      const existingProduct = products.find(
        (p: any) => p.code.toLowerCase() === codeValue.toLowerCase()
      );
      if (existingProduct) {
        setDuplicateCode(codeValue);
      } else {
        setDuplicateCode(null);
      }
    } else {
      setDuplicateCode(null);
    }
  }, [codeValue, products]);

  const mutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      // Check for duplicate code before submitting
      const existingProduct = products.find(
        (p: any) => p.code.toLowerCase() === data.code.toLowerCase()
      );
      if (existingProduct) {
        throw new Error(`Product code "${data.code}" already exists. Please use a different code.`);
      }
      return apiRequest("POST", api.products.create.path, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      form.reset();
      setDuplicateCode(null);
      toast({ 
        title: "Success!",
        description: "Product added to inventory"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="max-w-2xl">
      <Card className="premium-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-display">Add New Product</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Product Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Brake Pad Set" 
                          {...field} 
                          className="mt-2 border-primary/20 focus-visible:ring-primary"
                          data-testid="input-product-name" 
                        />
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
                      <FormLabel className="font-semibold">Brand/Model *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Maruti Swift" 
                          {...field} 
                          className="mt-2 border-primary/20 focus-visible:ring-primary"
                          data-testid="input-brand" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Product Code/SKU *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="e.g., BP-MS-001" 
                            {...field} 
                            className={`mt-2 ${duplicateCode ? 'border-destructive focus-visible:ring-destructive bg-destructive/10' : 'border-primary/20 focus-visible:ring-primary'}`}
                            data-testid="input-code" 
                          />
                          {duplicateCode && (
                            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
                          )}
                        </div>
                      </FormControl>
                      {duplicateCode && (
                        <p className="text-sm text-destructive font-bold flex items-center gap-1 mt-2">
                          <AlertCircle className="w-4 h-4" />
                          Product code "{duplicateCode}" already exists!
                        </p>
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
                      <FormLabel className="font-semibold">HSN Code</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} className="mt-2 border-primary/20 focus-visible:ring-primary" data-testid="input-hsn-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Stock Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                          className="mt-2 border-primary/20 focus-visible:ring-primary"
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
                      <FormLabel className="font-semibold">Purchase Price *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="₹" 
                          {...field} 
                          className="mt-2 border-primary/20 focus-visible:ring-primary"
                          data-testid="input-purchase-price" 
                        />
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
                      <FormLabel className="font-semibold">Selling Price *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="₹" 
                          {...field} 
                          className="mt-2 border-primary/20 focus-visible:ring-primary"
                          data-testid="input-selling-price" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="maxDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Maximum Discount % (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g., 10" 
                          {...field} 
                          value={field.value || ""}
                          className="mt-2 border-primary/20 focus-visible:ring-primary"
                          data-testid="input-max-discount" 
                        />
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
                      <FormLabel className="font-semibold">GST Rate %</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                          className="mt-2 border-primary/20 focus-visible:ring-primary"
                          data-testid="input-gst-rate" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={mutation.isPending || !!duplicateCode} 
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
                  data-testid="button-add-product"
                >
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
                {duplicateCode && (
                  <p className="text-sm text-destructive font-semibold flex items-center">
                    Cannot add product with duplicate code
                  </p>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
