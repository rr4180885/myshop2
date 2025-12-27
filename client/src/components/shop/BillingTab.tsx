import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Minus, Printer, ShoppingCart, FileText, Search, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CartItem {
  id: number;
  name: string;
  code: string;
  hsnCode: string;
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
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [currentInvoiceData, setCurrentInvoiceData] = useState<any>(null);

  const { data: products = [] } = useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path);
      return res.json();
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: [api.invoices.list.path],
    queryFn: async () => {
      const res = await fetch(api.invoices.list.path);
      return res.json();
    },
  });

  const invoiceCounterMutation = useMutation({
    mutationFn: async (items: CartItem[]) => {
      // Final stock validation before generating invoice
      for (const item of items) {
        const product = products.find((p: any) => p.id === item.id);
        if (!product || item.quantity > product.stock) {
          throw new Error(`Insufficient stock for ${item.name}. Only ${product?.stock || 0} units available.`);
        }
      }

      const counter = parseInt(localStorage.getItem("invoiceCounter") || "1");
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(counter).padStart(5, "0")}`;
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
        customerPhone: customerPhone || "N/A",
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

      return { ...invoiceData, items: cartItems };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
      setCurrentInvoiceData(data);
      setShowInvoicePreview(true);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      toast({ title: "Invoice generated successfully" });
    },
  });

  // Search products by name, brand, code, or HSN code
  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.hsnCode?.toLowerCase().includes(search.toLowerCase())
  );

  // Filter invoices by customer name, phone, invoice number, or date range
  const filteredInvoices = invoices.filter((inv: any) => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.customerPhone?.toLowerCase().includes(invoiceSearch.toLowerCase());
    
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const invDate = new Date(inv.createdAt);
      if (dateFrom) matchesDate = matchesDate && invDate >= new Date(dateFrom);
      if (dateTo) matchesDate = matchesDate && invDate <= new Date(dateTo + "T23:59:59");
    }
    
    return matchesSearch && matchesDate;
  });

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      // Check if we have enough stock before increasing quantity
      if (existing.quantity >= product.stock) {
        toast({ 
          title: "Insufficient stock", 
          description: `Only ${product.stock} units available`,
          variant: "destructive" 
        });
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      if (product.stock > 0) {
        setCart([...cart, {
          id: product.id,
          name: product.name,
          code: product.code,
          hsnCode: product.hsnCode || "8708",
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
      // Check stock before updating quantity
      const product = products.find((p: any) => p.id === id);
      if (product && quantity > product.stock) {
        toast({ 
          title: "Insufficient stock", 
          description: `Only ${product.stock} units available`,
          variant: "destructive" 
        });
        return;
      }
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

  const printInvoice = (invoiceData: any) => {
    setCurrentInvoiceData(invoiceData);
    setShowInvoicePreview(true);
  };

  const handlePrint = () => {
    window.print();
    setShowInvoicePreview(false);
    setCurrentInvoiceData(null);
  };

  return (
    <>
      <Tabs defaultValue="billing" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="billing">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Create Invoice
          </TabsTrigger>
          <TabsTrigger value="history">
            <FileText className="w-4 h-4 mr-2" />
            Invoice History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="billing">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Customer Info */}
              <Card className="border-slate-700/50 bg-slate-800/40">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    Customer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-300">Name (Optional)</label>
                      <Input
                        placeholder="Customer Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="mt-1.5 h-10 sm:h-11 bg-slate-900/50 border-slate-600"
                        data-testid="input-customer-name"
                      />
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-300">Phone (Optional)</label>
                      <Input
                        placeholder="Phone Number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="mt-1.5 h-10 sm:h-11 bg-slate-900/50 border-slate-600"
                        data-testid="input-customer-phone"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Search */}
              <Card className="border-slate-700/50 bg-slate-800/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Search Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by name, brand, code, or HSN code..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 h-10 sm:h-11 bg-slate-900/50 border-slate-600"
                      data-testid="input-product-search"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Products List */}
              <Card className="border-slate-700/50 bg-slate-800/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Available Products ({filteredProducts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {filteredProducts.map(product => (
                      <div 
                        key={product.id} 
                        className="p-3 sm:p-4 border border-slate-700/50 bg-slate-900/40 rounded-xl hover:border-blue-500/50 hover:bg-slate-900/60 transition-all duration-200 cursor-pointer group"
                        data-testid={`card-product-${product.id}`}
                      >
                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="font-semibold text-white text-sm sm:text-base truncate">{product.name}</div>
                            <div className="text-xs sm:text-sm text-slate-400">{product.code}</div>
                            <div className="text-xs text-slate-500">HSN: {product.hsnCode || "8708"}</div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shrink-0"
                            data-testid={`button-add-to-cart-${product.id}`}
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Price:</span>
                            <span className="font-semibold text-white">₹{product.sellingPrice}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">GST:</span>
                            <span className="text-slate-300">{product.gstRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`font-semibold ${product.stock < 10 ? "text-red-400" : "text-green-400"}`}>
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
              <Card className="sticky top-4 border-slate-700/50 bg-slate-800/40 shadow-2xl" data-testid="card-cart">
                <CardHeader className="bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-b border-slate-700/50 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    Cart ({cart.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="space-y-2 sm:space-y-3 max-h-[250px] sm:max-h-64 overflow-y-auto mb-4 sm:mb-6 pr-1">
                    {cart.length === 0 ? (
                      <p className="text-center text-slate-400 py-6 sm:py-8 text-sm">No items in cart</p>
                    ) : (
                      cart.map(item => (
                        <div key={item.id} className="p-2.5 sm:p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-2" data-testid={`cart-item-${item.id}`}>
                          <div className="font-medium text-white text-xs sm:text-sm">{item.name}</div>
                          <div className="flex gap-1.5 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="flex-1 h-8 border-slate-600 bg-slate-800"
                              data-testid={`button-decrease-${item.id}`}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                              className="w-10 sm:w-12 h-8 text-center p-0 bg-slate-900 border-slate-600"
                              data-testid={`input-quantity-${item.id}`}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex-1 h-8 border-slate-600 bg-slate-800"
                              data-testid={`button-increase-${item.id}`}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm font-semibold text-white">
                              ₹{(item.quantity * item.sellingPrice).toFixed(2)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-7 px-2"
                              data-testid={`button-remove-${item.id}`}
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-slate-700/50 pt-3 sm:pt-4 space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-400">Subtotal:</span>
                      <span className="font-semibold text-white" data-testid="text-subtotal">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-400">GST:</span>
                      <span className="font-semibold text-white" data-testid="text-gst">₹{gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base sm:text-lg font-bold border-t border-slate-700/50 pt-2 sm:pt-3 mt-2 sm:mt-3">
                      <span>Total:</span>
                      <span className="text-blue-400" data-testid="text-grand-total">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold h-10 sm:h-11"
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
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-slate-700/50 bg-slate-800/40">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Invoice History ({filteredInvoices.length})</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
                <div className="relative sm:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search customer or invoice..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="pl-10 h-10 bg-slate-900/50 border-slate-600"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="date"
                    placeholder="From Date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-10 h-10 bg-slate-900/50 border-slate-600"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="date"
                    placeholder="To Date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-10 h-10 bg-slate-900/50 border-slate-600"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-2 sm:p-3 text-slate-300 font-semibold">Invoice #</th>
                      <th className="text-left p-2 sm:p-3 text-slate-300 font-semibold">Customer</th>
                      <th className="text-left p-2 sm:p-3 text-slate-300 font-semibold">Phone</th>
                      <th className="text-left p-2 sm:p-3 text-slate-300 font-semibold">Date</th>
                      <th className="text-right p-2 sm:p-3 text-slate-300 font-semibold">Amount</th>
                      <th className="text-center p-2 sm:p-3 text-slate-300 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          No invoices found
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice: any) => (
                        <tr key={invoice.id} className="border-b border-slate-800 hover:bg-slate-900/40">
                          <td className="p-2 sm:p-3 text-white font-mono text-xs sm:text-sm">{invoice.invoiceNumber}</td>
                          <td className="p-2 sm:p-3 text-white">{invoice.customerName}</td>
                          <td className="p-2 sm:p-3 text-slate-300">{invoice.customerPhone}</td>
                          <td className="p-2 sm:p-3 text-slate-300">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                          <td className="p-2 sm:p-3 text-right text-white font-semibold">₹{invoice.grandTotal}</td>
                          <td className="p-2 sm:p-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => printInvoice({ ...invoice, items: JSON.parse(invoice.items) })}
                              className="h-8 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                            >
                              <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Professional Invoice Print Preview */}
      {showInvoicePreview && currentInvoiceData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white overflow-auto">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl print:shadow-none print:max-w-none">
            <div className="p-4 sm:p-6 print:p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-slate-800">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">AutoParts Pro</h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">Auto Parts Management System</p>
                  <p className="text-xs text-slate-500 mt-2">GSTIN: 29XXXXX1234X1Z5</p>
                  <p className="text-xs text-slate-500">Ph: +91 98765 43210</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-600">TAX INVOICE</h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2">
                    <span className="font-semibold">Invoice #:</span> {currentInvoiceData.invoiceNumber}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600">
                    <span className="font-semibold">Date:</span> {new Date().toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase mb-2">Bill To:</h3>
                <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
                  <p className="font-semibold text-slate-900 text-sm sm:text-base">{currentInvoiceData.customerName}</p>
                  <p className="text-xs sm:text-sm text-slate-600">{currentInvoiceData.customerPhone}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-6 sm:mb-8 text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left p-2 sm:p-3">#</th>
                    <th className="text-left p-2 sm:p-3">Item Description</th>
                    <th className="text-center p-2 sm:p-3">HSN</th>
                    <th className="text-center p-2 sm:p-3">Qty</th>
                    <th className="text-right p-2 sm:p-3">Rate</th>
                    <th className="text-center p-2 sm:p-3">GST%</th>
                    <th className="text-right p-2 sm:p-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoiceData.items.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="p-2 sm:p-3">{index + 1}</td>
                      <td className="p-2 sm:p-3">
                        <div className="font-medium text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-500">Code: {item.code}</div>
                      </td>
                      <td className="p-2 sm:p-3 text-center text-slate-600">{item.hsnCode}</td>
                      <td className="p-2 sm:p-3 text-center">{item.quantity}</td>
                      <td className="p-2 sm:p-3 text-right">₹{item.sellingPrice.toFixed(2)}</td>
                      <td className="p-2 sm:p-3 text-center">{item.gstRate}%</td>
                      <td className="p-2 sm:p-3 text-right font-semibold">₹{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-6 sm:mb-8">
                <div className="w-full sm:w-72">
                  <div className="flex justify-between py-2 text-xs sm:text-sm">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-semibold">₹{currentInvoiceData.subtotal}</span>
                  </div>
                  <div className="flex justify-between py-2 text-xs sm:text-sm">
                    <span className="text-slate-600">GST Amount:</span>
                    <span className="font-semibold">₹{currentInvoiceData.gstAmount}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-slate-800 text-sm sm:text-lg font-bold">
                    <span>Grand Total:</span>
                    <span className="text-blue-600">₹{currentInvoiceData.grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-300 pt-4 sm:pt-6 mt-6 sm:mt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Terms & Conditions:</h4>
                    <ul className="text-slate-600 space-y-1 text-[10px] sm:text-xs">
                      <li>• All goods once sold will not be taken back</li>
                      <li>• Warranty as per manufacturer terms</li>
                      <li>• Payment due within 30 days</li>
                    </ul>
                  </div>
                  <div className="text-right">
                    <div className="mt-8 sm:mt-12">
                      <div className="border-t border-slate-400 inline-block px-4 sm:px-8">
                        <p className="text-slate-700 font-semibold mt-2">Authorized Signature</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-4 sm:mt-6 text-[10px] sm:text-xs text-slate-500">
                  <p>Thank you for your business!</p>
                  <p className="mt-1">This is a computer-generated invoice</p>
                </div>
              </div>
            </div>

            {/* Print Actions */}
            <div className="flex gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-100 border-t print:hidden">
              <Button
                onClick={handlePrint}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Invoice
              </Button>
              <Button
                onClick={() => {
                  setShowInvoicePreview(false);
                  setCurrentInvoiceData(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
