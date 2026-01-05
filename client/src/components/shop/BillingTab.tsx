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
    const printContent = document.getElementById('invoice-print-content');
    if (!printContent) return;

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    // Write the invoice HTML with embedded styles
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${currentInvoiceData?.invoiceNumber || 'Invoice'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: white;
              color: #000;
              padding: 20px;
            }
            
            @media print {
              body { 
                padding: 0;
                margin: 0;
              }
              
              @page { 
                size: A4; 
                margin: 10mm;
              }
              
              button { display: none !important; }
              .print-button { display: none !important; }
              .close-button { display: none !important; }
              
              /* Remove browser-generated headers/footers */
              @page {
                margin-top: 10mm;
                margin-bottom: 10mm;
              }
            }
            
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            
            .invoice-header {
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 2px solid #1e293b;
            }
            
            .flex {
              display: flex;
            }
            
            .items-center {
              align-items: center;
            }
            
            .justify-between {
              justify-content: space-between;
            }
            
            .gap-2 {
              gap: 8px;
            }
            
            .mb-2 {
              margin-bottom: 8px;
            }
            
            .mb-3 {
              margin-bottom: 12px;
            }
            
            .text-right {
              text-align: right;
            }
            
            .text-center {
              text-align: center;
            }
            
            .logo {
              width: 48px;
              height: 48px;
              object-fit: contain;
            }
            
            .shop-name {
              font-size: 20px;
              font-weight: bold;
              color: #0f172a;
            }
            
            .invoice-title {
              font-size: 18px;
              font-weight: bold;
              color: #2563eb;
            }
            
            .header-details {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              margin-top: 8px;
            }
            
            .header-details p {
              margin: 2px 0;
            }
            
            .customer-section h3 {
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 4px;
              color: #334155;
            }
            
            .customer-box {
              background: #f8fafc;
              padding: 8px;
              border-radius: 4px;
            }
            
            .customer-box p {
              margin: 2px 0;
            }
            
            .item-name {
              font-weight: 500;
              color: #0f172a;
            }
            
            .item-code {
              font-size: 9px;
              color: #64748b;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: 10px;
            }
            
            th, td {
              padding: 6px 8px;
              border: 1px solid #e2e8f0;
              text-align: left;
            }
            
            thead {
              background: #1e293b;
              color: white;
            }
            
            th {
              font-weight: 600;
            }
            
            .totals-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 12px;
            }
            
            .footer {
              border-top: 1px solid #cbd5e1;
              padding-top: 12px;
              margin-top: 12px;
            }
            
            .terms {
              margin-bottom: 12px;
            }
            
            .terms h4 {
              font-weight: 600;
              margin-bottom: 6px;
              color: #334155;
              font-size: 10px;
            }
            
            .terms ul {
              list-style: none;
              padding: 0;
            }
            
            .terms li {
              margin: 2px 0;
              font-size: 9px;
              color: #475569;
            }
            
            .signature-section {
              display: flex;
              justify-content: flex-end;
              align-items: center;
              margin-bottom: 12px;
              margin-top: 16px;
            }
            
            .signature-section > div {
              text-align: center;
              min-width: 150px;
            }
            
            .signature-img {
              width: 96px;
              height: 48px;
              object-fit: contain;
              margin: 0 auto 4px;
              display: block;
            }
            
            .signature-line {
              border-top: 1px solid #94a3b8;
              padding-top: 4px;
              margin-top: 8px;
              display: block;
              width: 100%;
            }
            
            .signature-text {
              font-size: 9px;
              font-weight: 600;
              color: #334155;
              text-align: center;
              margin-top: 4px;
            }
            
            .thank-you {
              text-align: center;
              margin-top: 8px;
              font-size: 9px;
              color: #64748b;
            }
            
            .thank-you p {
              margin: 2px 0;
            }
            
            /* Hide all buttons and unnecessary elements */
            button, .sticky {
              display: none !important;
            }
            
            /* Totals box styling to match modal */
            .totals-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 12px;
            }
            
            .totals-section > div {
              width: 250px;
              border: 1px solid #e2e8f0;
              padding: 8px;
              background: #f8fafc;
              border-radius: 4px;
            }
            
            .totals-section .flex {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
            }
            
            .totals-section .text-xs {
              font-size: 12px;
            }
            
            .totals-section .text-sm {
              font-size: 13px;
            }
            
            .totals-section .text-base {
              font-size: 15px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for content to load, then print
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print error:', e);
        }
        
        // Remove iframe after print dialog closes
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    };
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
        <div id="invoice-print-modal" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div id="invoice-print-content" className="bg-white text-slate-900 w-full max-w-4xl my-4 rounded-lg shadow-2xl">
            <div className="p-6 invoice-container">
              {/* Header - Logo beside shop name at top */}
              <div className="mb-3 pb-2 border-b-2 border-slate-800 invoice-header">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {settings?.logoPath && settings.logoPath.trim() !== '' && (
                      <img 
                        src={settings.logoPath} 
                        alt="Company Logo" 
                        className="w-12 h-12 object-contain logo"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 leading-tight shop-name">
                        {settings?.shopName || "Brother Enterprises"}
                      </h1>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-bold text-blue-600 invoice-title">TAX INVOICE</h2>
                  </div>
                </div>
                
                <div className="flex justify-between items-start text-[10px] header-details">
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
              <div className="mb-3 customer-section">
                <h3 className="text-[10px] font-bold text-slate-700 uppercase mb-1">Bill To:</h3>
                <div className="bg-slate-50 p-2 rounded customer-box">
                  <p className="font-semibold text-slate-900 text-xs item-name">{currentInvoiceData.customerName}</p>
                  <p className="text-[10px] text-slate-600">{currentInvoiceData.customerPhone}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-3">
                <table className="w-full text-[10px] border border-slate-300">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="text-left p-1.5 border border-slate-600">#</th>
                      <th className="text-left p-1.5 border border-slate-600">Item</th>
                      <th className="text-center p-1.5 border border-slate-600">HSN</th>
                      <th className="text-center p-1.5 border border-slate-600">Qty</th>
                      <th className="text-right p-1.5 border border-slate-600">Rate</th>
                      <th className="text-center p-1.5 border border-slate-600">GST%</th>
                      <th className="text-right p-1.5 border border-slate-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInvoiceData.items.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-slate-200">
                        <td className="p-1.5 border border-slate-200">{index + 1}</td>
                        <td className="p-1.5 border border-slate-200">
                          <div className="font-medium text-slate-900 item-name">{item.name}</div>
                          <div className="text-[9px] text-slate-500 item-code">Code: {item.code}</div>
                        </td>
                        <td className="p-1.5 text-center text-slate-600 border border-slate-200">{item.hsnCode}</td>
                        <td className="p-1.5 text-center border border-slate-200">{Number(item.quantity) || 0}</td>
                        <td className="p-1.5 text-right border border-slate-200">₹{Number(item.sellingPrice).toFixed(2)}</td>
                        <td className="p-1.5 text-center border border-slate-200">{Number(item.gstRate) || 0}%</td>
                        <td className="p-1.5 text-right font-semibold border border-slate-200">₹{Number(item.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-3 totals-section">
                <div className="w-full sm:w-64 border border-slate-200 p-2 bg-slate-50 rounded">
                  <div className="flex justify-between py-1.5 text-xs">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-semibold text-slate-900">₹{currentInvoiceData.subtotal}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-xs">
                    <span className="text-slate-600">GST Amount:</span>
                    <span className="font-semibold text-slate-900">₹{currentInvoiceData.gstAmount}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-slate-800 mt-1 text-sm font-bold">
                    <span className="text-slate-900">Grand Total:</span>
                    <span className="text-blue-600 text-base">₹{currentInvoiceData.grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Footer with Terms and Signature */}
              <div className="border-t border-slate-300 pt-3 mt-3 footer">
                <div className="text-[9px] mb-3 terms">
                  <h4 className="font-semibold text-slate-700 mb-1.5 text-[10px]">Terms & Conditions:</h4>
                  <ul className="text-slate-600 space-y-0.5">
                    {settings?.customText1 && settings.customText1.trim() !== '' && <li>• {settings.customText1}</li>}
                    {settings?.customText2 && settings.customText2.trim() !== '' && <li>• {settings.customText2}</li>}
                    {settings?.customText3 && settings.customText3.trim() !== '' && <li>• {settings.customText3}</li>}
                  </ul>
                </div>
                
                <div className="flex justify-end items-center mb-3 signature-section">
                  <div className="text-center">
                    {settings?.signaturePath && settings.signaturePath.trim() !== '' && (
                      <img 
                        src={settings.signaturePath} 
                        alt="Signature" 
                        className="mx-auto mb-1 w-24 h-12 object-contain signature-img"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <div className="border-t border-slate-400 pt-1 signature-line">
                      <p className="text-slate-700 font-semibold text-[9px] signature-text">Authorized Signature</p>
                    </div>
                  </div>
                </div>
                
                {/* Greeting on last page */}
                <div className="text-center text-[9px] text-slate-500 thank-you">
                  <p>Thank you for your business!</p>
                  <p className="mt-0.5">This is a computer-generated invoice</p>
                </div>
              </div>
            </div>

            {/* Print Actions */}
            <div className="flex gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-100 border-t sticky bottom-0">
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