import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { insertProductSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Plus } from "lucide-react";

const formSchema = insertProductSchema;

export default function AddProductTab() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      brand: "",
      code: "",
      hsnCode: "8708",
      stock: 0,
      purchasePrice: "0",
      sellingPrice: "0",
      gstRate: 28,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      return apiRequest("POST", api.products.create.path, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      form.reset();
      toast({ 
        title: "Success!",
        description: "Product added to inventory"
      });
    },
  });

  return (
    <div className="max-w-2xl">
      <Card className="border-slate-200/50 dark:border-slate-700/50">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200/50 dark:border-slate-700/50">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Product
          </CardTitle>
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
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Brake Pad Set" 
                          {...field} 
                          className="mt-2"
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
                      <FormLabel>Brand/Model *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Maruti Swift" 
                          {...field} 
                          className="mt-2"
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
                      <FormLabel>Product Code/SKU *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., BP-MS-001" 
                          {...field} 
                          className="mt-2"
                          data-testid="input-code" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hsnCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HSN Code</FormLabel>
                      <FormControl>
                        <Input {...field} className="mt-2" data-testid="input-hsn-code" />
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
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                          className="mt-2"
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
                      <FormLabel>Purchase Price *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="₹" 
                          {...field} 
                          className="mt-2"
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
                      <FormLabel>Selling Price *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="₹" 
                          {...field} 
                          className="mt-2"
                          data-testid="input-selling-price" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gstRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Rate %</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        className="mt-2"
                        data-testid="input-gst-rate" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={mutation.isPending} 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  data-testid="button-add-product"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {mutation.isPending ? "Adding..." : "Add Product"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
