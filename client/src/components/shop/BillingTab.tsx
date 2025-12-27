import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Minus, Printer, ShoppingCart } from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  code: string;
  quantity: number;
  sellingPrice: number;
  gstRate: number;
}

export default function BillingTab() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path);
      return res.json();
    },
  });

  const invoiceCounterMutation = useMutation({
    mutationFn: async (items: CartItem[]) => {
      const counter = parseInt(localStorage.getItem("invoiceCounter") || "1");
      const invoiceNumber = `INV-2024-${String(counter).padStart(4, "0")}`;
      localStorage.setItem("invoiceCounter", String(counter + 1));

      const cartItems = items.map(item => ({
        ...item,
        amount: (item.quantity * item.sellingPrice).toFixed(2)
      }));

      const subtotal = items.reduce((sum, item) => {
        const gstAmount = (item.quantity * item.sellingPrice * item.gstRate) / (100 + item.gstRate);
        return sum + (item.quantity * item.sellingPrice - gstAmount);
      }, 0);

      const gstAmount = items.reduce((sum, item) => {
        const gst = (item.quantity * item.sellingPrice * item.gstRate) / (100 + item.gstRate);
        return sum + gst;
      }, 0);

      const grandTotal = items.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0);

      const invoiceData = {
        invoiceNumber,
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || "",
        items: JSON.stringify(cartItems),
        subtotal: subtotal.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
      };

      await apiRequest("POST", api.invoices.create.path, invoiceData);

      for (const item of items) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          await apiRequest("PUT", api.products.update.path.replace(":id", String(item.id)), {
            stock: product.stock - item.quantity
          });
        }
      }

      return invoiceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      toast({ title: "Invoice generated successfully" });
      window.print();
    },
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      if (product.stock > 0) {
        setCart([...cart, {
          id: product.id,
          name: product.name,
          code: product.code,
          quantity: 1,
          sellingPrice: Number(product.sellingPrice),
          gstRate: product.gstRate,
        }]);
      } else {
        toast({ title: "Out of stock", variant: "destructive" });
      }
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item => item.id === id ? { ...item, quantity } : item));
    }
  };

  const subtotal = cart.reduce((sum, item) => {
    const gstAmount = (item.quantity * item.sellingPrice * item.gstRate) / (100 + item.gstRate);
    return sum + (item.quantity * item.sellingPrice - gstAmount);
  }, 0);

  const gstAmount = cart.reduce((sum, item) => {
    return sum + (item.quantity * item.sellingPrice * item.gstRate) / (100 + item.gstRate);
  }, 0);

  const grandTotal = cart.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Customer Info */}
        <Card className="border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name (Optional)</label>
                <Input
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-2"
                  data-testid="input-customer-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone (Optional)</label>
                <Input
                  placeholder="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-2"
                  data-testid="input-customer-phone"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Search */}
        <Card className="border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle>Search Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name, brand, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
              data-testid="input-product-search"
            />
          </CardContent>
        </Card>

        {/* Products List */}
        <Card className="border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle>Available Products ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="p-4 border border-slate-200/50 dark:border-slate-700/50 rounded-lg hover:border-blue-400/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all duration-200 cursor-pointer group"
                  data-testid={`card-product-${product.id}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white">{product.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{product.code}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                      data-testid={`button-add-to-cart-${product.id}`}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Price:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">₹{product.sellingPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`font-semibold ${product.stock < 10 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart Sidebar */}
      <div>
        <Card className="sticky top-8 border-slate-200/50 dark:border-slate-700/50 shadow-lg" data-testid="card-cart">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-b border-slate-200/50 dark:border-slate-700/50">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
              {cart.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">No items in cart</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50 space-y-2" data-testid={`cart-item-${item.id}`}>
                    <div className="font-medium text-slate-900 dark:text-white text-sm">{item.name}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex-1"
                        data-testid={`button-decrease-${item.id}`}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                        className="w-12 text-center"
                        data-testid={`input-quantity-${item.id}`}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex-1"
                        data-testid={`button-increase-${item.id}`}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        ₹{(item.quantity * item.sellingPrice).toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                <span className="font-semibold text-slate-900 dark:text-white" data-testid="text-subtotal">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">GST:</span>
                <span className="font-semibold text-slate-900 dark:text-white" data-testid="text-gst">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-slate-200/50 dark:border-slate-700/50 pt-3 mt-3">
                <span>Total:</span>
                <span className="text-blue-600 dark:text-blue-400" data-testid="text-grand-total">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold h-10"
              onClick={() => invoiceCounterMutation.mutate(cart)}
              disabled={cart.length === 0 || invoiceCounterMutation.isPending}
              data-testid="button-generate-invoice"
            >
              <Printer className="w-4 h-4 mr-2" />
              {invoiceCounterMutation.isPending ? "Generating..." : "Generate Invoice"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
