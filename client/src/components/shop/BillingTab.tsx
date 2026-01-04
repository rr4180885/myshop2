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
import { formatDate } from "@/lib/dateUtils";

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

  const { data: settings } = useQuery({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path);
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
    // Ensure all numeric fields are properly converted and handle missing fields
    const processedInvoiceData = {
      ...invoiceData,
      items: invoiceData.items.map((item: any) => {
        // For old invoices, calculate values from whatever data is available
        const qty = Number(item.quantity) || 1;
        const price = Number(item.sellingPrice) || Number(item.price) || 0;
        const gst = Number(item.gstRate) || Number(item.gst) || 18;
        const amt = item.amount ? Number(item.amount).toFixed(2) : (qty * price).toFixed(2);
        
        return {
          ...item,
          quantity: qty,
          sellingPrice: price,
          gstRate: gst,
          amount: amt
        };
      })
    };
    
    setCurrentInvoiceData(processedInvoiceData);
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
              <Card className="bg-card border shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    Customer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-foreground">Name (Optional)</label>
                      <Input
                        placeholder="Customer Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="mt-1.5 h-10 sm:h-11"
                        data-testid="input-customer-name"
                      />
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-foreground">Phone (Optional)</label>
                      <Input
                        placeholder="Phone Number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="mt-1.5 h-10 sm:h-11"
                        data-testid="input-customer-phone"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Search */}
              <Card className="bg-card border shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Search Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, brand, code, or HSN code..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 h-10 sm:h-11"
                      data-testid="input-product-search"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Products List */}
              <Card className="bg-card border shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Available Products ({filteredProducts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {filteredProducts.map(product => (
                      <div 
                        key={product.id} 
                        className="p-3 sm:p-4 border bg-card rounded-xl hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer group"
                        data-testid={`card-product-${product.id}`}
                      >
                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="font-semibold text-foreground text-sm sm:text-base truncate">{product.name}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground">{product.code}</div>
                            <div className="text-xs text-muted-foreground">HSN: {product.hsnCode || "8708"}</div>
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
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-semibold text-foreground">₹{product.sellingPrice}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">GST:</span>
                            <span className="text-foreground">{product.gstRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`font-semibold ${product.stock < 10 ? "text-red-500" : "text-green-500"}`}>
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
              <Card className="sticky top-4 bg-card border shadow-xl" data-testid="card-cart">
                <CardHeader className="bg-primary/10 border-b pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Cart ({cart.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="space-y-2 sm:space-y-3 max-h-[250px] sm:max-h-64 overflow-y-auto mb-4 sm:mb-6 pr-1">
                    {cart.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">No items in cart</p>
                    ) : (
                      cart.map(item => (
                        <div key={item.id} className="p-2.5 sm:p-3 bg-accent/30 rounded-lg border space-y-2" data-testid={`cart-item-${item.id}`}>
                          <div className="font-medium text-foreground text-xs sm:text-sm">{item.name}</div>
                          <div className="flex gap-1.5 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="flex-1 h-8"
                              data-testid={`button-decrease-${item.id}`}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                              className="w-10 sm:w-12 h-8 text-center p-0"
                              data-testid={`input-quantity-${item.id}`}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex-1 h-8"
                              data-testid={`button-increase-${item.id}`}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm font-semibold text-foreground">
                              ₹{(item.quantity * item.sellingPrice).toFixed(2)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
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
                  <div className="border-t pt-3 sm:pt-4 space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-semibold text-foreground" data-testid="text-subtotal">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">GST:</span>
                      <span className="font-semibold text-foreground" data-testid="text-gst">₹{gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base sm:text-lg font-bold border-t pt-2 sm:pt-3 mt-2 sm:mt-3">
                      <span>Total:</span>
                      <span className="text-primary" data-testid="text-grand-total">₹{grandTotal.toFixed(2)}</span>
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
          <Card className="bg-card border shadow-md">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Invoice History ({filteredInvoices.length})</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
                <div className="relative sm:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customer or invoice..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="From Date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="To Date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 sm:p-3 text-muted-foreground font-semibold">Invoice #</th>
                      <th className="text-left p-2 sm:p-3 text-muted-foreground font-semibold">Customer</th>
                      <th className="text-left p-2 sm:p-3 text-muted-foreground font-semibold">Phone</th>
                      <th className="text-left p-2 sm:p-3 text-muted-foreground font-semibold">Date</th>
                      <th className="text-right p-2 sm:p-3 text-muted-foreground font-semibold">Amount</th>
                      <th className="text-center p-2 sm:p-3 text-muted-foreground font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          No invoices found
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice: any) => (
                        <tr key={invoice.id} className="border-b hover:bg-accent/30">
                          <td className="p-2 sm:p-3 text-foreground font-mono text-xs sm:text-sm">{invoice.invoiceNumber}</td>
                          <td className="p-2 sm:p-3 text-foreground">{invoice.customerName}</td>
                          <td className="p-2 sm:p-3 text-muted-foreground">{invoice.customerPhone}</td>
                          <td className="p-2 sm:p-3 text-muted-foreground">{formatDate(invoice.createdAt)}</td>
                          <td className="p-2 sm:p-3 text-right text-foreground font-semibold">₹{invoice.grandTotal}</td>
                          <td className="p-2 sm:p-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => printInvoice({ ...invoice, items: JSON.parse(invoice.items) })}
                              className="h-8"
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
        <div id="invoice-print-modal" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 print:p-0 print:bg-white overflow-y-auto">
          <div id="invoice-print-content" className="bg-white text-slate-900 w-full max-w-4xl my-4 rounded-lg shadow-2xl print:shadow-none print:max-w-none print:my-0 print:max-h-none">
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                @page {
                  size: A4;
                  margin: 8mm;
                }
                
                /* Force light mode colors for printing */
                body, html {
                  background: white !important;
                  color: black !important;
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                }
                
                /* CRITICAL: Hide everything except the invoice */
                body > * {
                  display: none !important;
                }
                
                /* Show ONLY the invoice print modal */
                #invoice-print-modal,
                #invoice-print-modal * {
                  display: block !important;
                  visibility: visible !important;
                }
                
                /* Fix table display */
                .invoice-container table,
                .invoice-container thead,
                .invoice-container tbody,
                .invoice-container tr {
                  display: table !important;
                }
                
                .invoice-container thead {
                  display: table-header-group !important;
                }
                
                .invoice-container tbody {
                  display: table-row-group !important;
                }
                
                .invoice-container tr {
                  display: table-row !important;
                }
                
                .invoice-container th,
                .invoice-container td {
                  display: table-cell !important;
                }
                
                /* Position the invoice properly */
                #invoice-print-modal {
                  position: static !important;
                  background: white !important;
                  inset: auto !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  height: auto !important;
                  overflow: visible !important;
                  display: block !important;
                }
                
                #invoice-print-content {
                  max-width: 100% !important;
                  margin: 0 !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                }
                
                /* Invoice container adjustments */
                .invoice-container {
                  background: white !important;
                  color: black !important;
                  max-height: none !important;
                  max-width: 100% !important;
                  overflow: visible !important;
                  box-shadow: none !important;
                  border-radius: 0 !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                
                /* Reset colors for invoice content */
                #invoice-print-modal,
                #invoice-print-modal * {
                  color: black !important;
                  background: white !important;
                }
                
                /* Specific overrides for invoice elements that need color */
                #invoice-print-modal .bg-slate-50 {
                  background: #f8fafc !important;
                }
                
                #invoice-print-modal .bg-slate-800,
                #invoice-print-modal thead {
                  background: #1e293b !important;
                }
                
                #invoice-print-modal .bg-slate-800 *,
                #invoice-print-modal thead *,
                #invoice-print-modal .text-white {
                  color: white !important;
                }
                
                #invoice-print-modal .text-blue-600 {
                  color: #2563eb !important;
                }
                
                #invoice-print-modal .text-slate-900,
                #invoice-print-modal .text-slate-700,
                #invoice-print-modal .text-slate-600 {
                  color: #334155 !important;
                }
                
                #invoice-print-modal .text-slate-500 {
                  color: #64748b !important;
                }
                
                #invoice-print-modal .border-slate-800 {
                  border-color: #1e293b !important;
                }
                
                #invoice-print-modal .border-slate-400,
                #invoice-print-modal .border-slate-300,
                #invoice-print-modal .border-slate-200 {
                  border-color: #cbd5e1 !important;
                }
                
                /* Hide print button */
                .print\\:hidden,
                button {
                  visibility: hidden !important;
                  display: none !important;
                }
                
                /* Ensure proper sizing */
                img {
                  max-width: 100% !important;
                  height: auto !important;
                }
                
                /* Make sure flex containers work */
                #invoice-print-modal .flex {
                  display: flex !important;
                }
                
                #invoice-print-modal .grid {
                  display: grid !important;
                }
              }
            `}} />
            <div className="p-6 print:p-5 invoice-container">
              {/* Header - Logo beside shop name at top */}
              <div className="mb-3 pb-2 border-b-2 border-slate-800 invoice-header print:mb-2 print:pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {settings?.logoPath && settings.logoPath.trim() !== '' && (
                      <img 
                        src={settings.logoPath} 
                        alt="Company Logo" 
                        className="w-12 h-12 print:w-12 print:h-12 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <div>
                      <h1 className="text-xl print:text-xl font-bold text-slate-900 leading-tight">
                        {settings?.shopName || "Brother Enterprises"}
                      </h1>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg print:text-lg font-bold text-blue-600">TAX INVOICE</h2>
                  </div>
                </div>
                
                <div className="flex justify-between items-start text-[10px] print:text-[10px]">
                  <div className="space-y-0.5">
                    {settings?.shopAddress && settings.shopAddress.trim() !== '' && <p className="text-slate-700">{settings.shopAddress}</p>}
                    {settings?.shopGSTIN && settings.shopGSTIN.trim() !== '' && <p className="text-slate-600">GSTIN: {settings.shopGSTIN}</p>}
                    {settings?.shopPhone && settings.shopPhone.trim() !== '' && <p className="text-slate-600">Phone: {settings.shopPhone}</p>}
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-slate-700"><span className="font-semibold">Invoice #:</span> {currentInvoiceData.invoiceNumber}</p>
                    <p className="text-slate-700"><span className="font-semibold">Date:</span> {formatDate(new Date())}</p>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="mb-3 print:mb-2">
                <h3 className="text-[10px] print:text-[10px] font-bold text-slate-700 uppercase mb-1">Bill To:</h3>
                <div className="bg-slate-50 print:bg-slate-50 p-2 print:p-2 rounded">
                  <p className="font-semibold text-slate-900 text-xs print:text-xs">{currentInvoiceData.customerName}</p>
                  <p className="text-[10px] print:text-[10px] text-slate-600">{currentInvoiceData.customerPhone}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-3 print:mb-2 text-[10px] print:text-[10px] invoice-items">
                <thead>
                  <tr className="bg-slate-800 print:bg-slate-800 text-white">
                    <th className="text-left p-1.5 print:p-1.5">#</th>
                    <th className="text-left p-1.5 print:p-1.5">Item Description</th>
                    <th className="text-center p-1.5 print:p-1.5">HSN</th>
                    <th className="text-center p-1.5 print:p-1.5">Qty</th>
                    <th className="text-right p-1.5 print:p-1.5">Rate</th>
                    <th className="text-center p-1.5 print:p-1.5">GST%</th>
                    <th className="text-right p-1.5 print:p-1.5">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoiceData.items.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="p-1.5 print:p-1.5">{index + 1}</td>
                      <td className="p-1.5 print:p-1.5">
                        <div className="font-medium text-slate-900">{item.name}</div>
                        <div className="text-[9px] print:text-[9px] text-slate-500">Code: {item.code}</div>
                      </td>
                      <td className="p-1.5 print:p-1.5 text-center text-slate-600">{item.hsnCode}</td>
                      <td className="p-1.5 print:p-1.5 text-center">{Number(item.quantity) || 0}</td>
                      <td className="p-1.5 print:p-1.5 text-right">₹{Number(item.sellingPrice).toFixed(2)}</td>
                      <td className="p-1.5 print:p-1.5 text-center">{Number(item.gstRate) || 0}%</td>
                      <td className="p-1.5 print:p-1.5 text-right font-semibold">₹{Number(item.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-3 print:mb-2 invoice-totals">
                <div className="w-full sm:w-64">
                  <div className="flex justify-between py-1 text-[10px] print:text-[10px]">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-semibold">₹{currentInvoiceData.subtotal}</span>
                  </div>
                  <div className="flex justify-between py-1 text-[10px] print:text-[10px]">
                    <span className="text-slate-600">GST Amount:</span>
                    <span className="font-semibold">₹{currentInvoiceData.gstAmount}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-t-2 border-slate-800 text-xs print:text-xs font-bold">
                    <span>Grand Total:</span>
                    <span className="text-blue-600">₹{currentInvoiceData.grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Footer with Terms and Signature */}
              <div className="border-t border-slate-300 pt-2 print:pt-2 mt-3 print:mt-2 invoice-footer">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 print:gap-2 text-[10px] print:text-[10px]">
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-1">Terms & Conditions:</h4>
                    <ul className="text-slate-600 space-y-0.5 text-[9px] print:text-[9px]">
                      {settings?.customText1 && settings.customText1.trim() !== '' && <li>• {settings.customText1}</li>}
                      {settings?.customText2 && settings.customText2.trim() !== '' && <li>• {settings.customText2}</li>}
                      {settings?.customText3 && settings.customText3.trim() !== '' && <li>• {settings.customText3}</li>}
                    </ul>
                  </div>
                  <div className="text-right">
                    <div className="mt-2 print:mt-2">
                      {settings?.signaturePath && settings.signaturePath.trim() !== '' && (
                        <img 
                          src={settings.signaturePath} 
                          alt="Signature" 
                          className="ml-auto mb-1 w-20 h-10 print:w-20 print:h-10 object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div className="border-t border-slate-400 inline-block px-4">
                        <p className="text-slate-700 font-semibold mt-1 text-[9px] print:text-[9px]">Authorized Signature</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Greeting on last page */}
                <div className="text-center mt-2 print:mt-2 text-[9px] print:text-[9px] text-slate-500 invoice-greeting">
                  <p>Thank you for your business!</p>
                  <p className="mt-0.5">This is a computer-generated invoice</p>
                </div>
              </div>
            </div>

            {/* Print Actions */}
            <div className="flex gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-100 border-t print:hidden sticky bottom-0">
              <Button
                onClick={handlePrint}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
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
                className="flex-1 border-2 border-slate-400 bg-white hover:bg-slate-100 text-slate-900 font-semibold"
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
