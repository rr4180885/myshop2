import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import PageHeader from "@/components/shop/PageHeader";
import PageShell from "@/components/shop/PageShell";
import SectionCard from "@/components/shop/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Minus, Printer, ShoppingCart, FileText, Search, Calendar, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/dateUtils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CartItem {
  id: number;
  name: string;
  code: string;
  hsnCode: string;
  quantity: number;
  sellingPrice: number;
  gstRate: number;
  isMisc?: boolean;
}

export default function BillingTab() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [currentInvoiceData, setCurrentInvoiceData] = useState<any>(null);
  const [hideGST, setHideGST] = useState(false); // Toggle to hide GST details
  const [miscName, setMiscName] = useState("");
  const [miscAmount, setMiscAmount] = useState("");

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
      // Final stock validation before generating invoice (skip misc items)
      for (const item of items) {
        if (item.isMisc) continue;
        const product = products.find((p: any) => p.id === item.id);
        if (!product || item.quantity > product.stock) {
          throw new Error(`Insufficient stock for ${item.name}. Only ${product?.stock || 0} units available.`);
        }
      }

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
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || "N/A",
        customerEmail: customerEmail || "",
        vehicleNo: vehicleNo.trim() || null,
        items: JSON.stringify(cartItems),
        subtotal: subtotal.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        hideGST,
      };

      const res = await apiRequest("POST", api.invoices.create.path, invoiceData);
      const invoice = await res.json();

      // Send email in a separate request so invoice creation stays fast on Vercel
      if (customerEmail?.trim() && invoice.id) {
        fetch(`/api/invoices/${invoice.id}/send-email`, {
          method: "POST",
          credentials: "include",
        }).catch(() => {
          toast({ title: "Invoice created", description: "Email could not be sent.", variant: "destructive" });
        });
      }

      return { ...invoice, items: cartItems, hideGST };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
      setCurrentInvoiceData(data);
      setShowInvoicePreview(true);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setVehicleNo("");
      toast({ title: "Invoice generated successfully. Email sent if provided!" });
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
      inv.customerPhone?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.vehicleNo?.toLowerCase().includes(invoiceSearch.toLowerCase());
    
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

  const addMiscToCart = () => {
    const amount = parseFloat(miscAmount);
    if (!miscName.trim()) {
      toast({ title: "Please enter an item name", variant: "destructive" });
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    // Use a negative timestamp-based id to avoid conflict with product ids
    const miscId = -(Date.now());
    setCart(prev => [...prev, {
      id: miscId,
      name: miscName.trim(),
      code: "-",
      hsnCode: "-",
      quantity: 1,
      sellingPrice: amount,
      gstRate: 0,
      isMisc: true,
    }]);
    setMiscName("");
    setMiscAmount("");
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      const cartItem = cart.find(item => item.id === id);
      if (!cartItem?.isMisc) {
        // Check stock before updating quantity for regular products
        const product = products.find((p: any) => p.id === id);
        if (product && quantity > product.stock) {
          toast({ 
            title: "Insufficient stock", 
            description: `Only ${product.stock} units available`,
            variant: "destructive" 
          });
          return;
        }
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
              padding: 12px;
              font-size: 10px;
            }
            
            @media print {
              body { 
                padding: 0;
                margin: 0;
              }
              
              @page { 
                size: A4 portrait; 
                margin: 8mm;
              }
              
              button { display: none !important; }
              .print-button { display: none !important; }
              .close-button { display: none !important; }
              
              /* Compact spacing for A4 */
              .invoice-container {
                padding: 0;
                max-width: 100%;
              }
              
              .invoice-header {
                margin-bottom: 8px;
                padding-bottom: 6px;
              }
              
              .mb-3 {
                margin-bottom: 8px !important;
              }
              
              .customer-section {
                margin-bottom: 8px;
              }
              
              table {
                margin-bottom: 8px;
                font-size: 8px;
              }
              
              th, td {
                padding: 3px 4px;
              }
              
              .totals-section {
                margin-bottom: 8px;
              }
              
              .totals-section > div {
                padding: 6px;
              }
              
              .footer {
                padding-top: 8px;
                margin-top: 8px;
              }
              
              .terms {
                margin-bottom: 8px;
              }
              
              .signature-section {
                margin-bottom: 8px;
                margin-top: 8px;
              }
              
              .thank-you {
                margin-top: 6px;
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
              word-break: break-word;
              overflow-wrap: break-word;
            }
            
            .item-code {
              font-size: 8px;
              color: #64748b;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: 9px;
              table-layout: fixed;
            }
            
            th, td {
              padding: 4px 6px;
              border: 1px solid #e2e8f0;
              text-align: left;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            
            /* Column widths optimized for A4 */
            th:nth-child(1), td:nth-child(1) { width: 5%; text-align: center; }
            th:nth-child(2), td:nth-child(2) { width: 32%; }
            th:nth-child(3), td:nth-child(3) { width: 10%; text-align: center; }
            th:nth-child(4), td:nth-child(4) { width: 8%; text-align: center; }
            th:nth-child(5), td:nth-child(5) { width: 13%; text-align: right; }
            th:nth-child(6), td:nth-child(6) { width: 10%; text-align: center; }
            th:nth-child(7), td:nth-child(7) { width: 15%; text-align: right; }
            
            thead {
              background: #1e293b;
              color: white;
            }
            
            th {
              font-weight: 600;
              font-size: 9px;
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
    <PageShell>
      <PageHeader title="Billing" description="Create invoices and view history" icon={ShoppingCart} />

      <Tabs defaultValue="billing" className="w-full">
        <TabsList className="page-tabs">
          <TabsTrigger value="billing" className="text-sm">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Create
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm">
            <FileText className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="space-y-4 mt-0">
          <SectionCard title="Customer Details" icon={ShoppingCart}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label className="form-label">Customer Name</label>
                <Input
                  placeholder="Walk-in customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1.5 input-modern"
                  data-testid="input-customer-name"
                />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <Input
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1.5 input-modern"
                  data-testid="input-customer-phone"
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <Input
                  type="email"
                  placeholder="For invoice copy"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1.5 input-modern"
                  data-testid="input-customer-email"
                />
              </div>
              <div>
                <label className="form-label">Vehicle No <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Input
                  placeholder="e.g. KA01AB1234"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  className="mt-1.5 input-modern"
                  data-testid="input-vehicle-no"
                />
              </div>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 items-start">
            {/* Left: products */}
            <div className="space-y-4 min-w-0">
              {/* Search + misc toolbar */}
              <div className="surface-card p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name, code, brand..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 input-modern"
                    data-testid="input-product-search"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-border/60">
                  <Input
                    placeholder="Misc item name"
                    value={miscName}
                    onChange={(e) => setMiscName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addMiscToCart()}
                    className="input-modern flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Amount ₹"
                    value={miscAmount}
                    onChange={(e) => setMiscAmount(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addMiscToCart()}
                    className="input-modern w-full sm:w-28"
                    min="0"
                    step="0.01"
                  />
                  <Button onClick={addMiscToCart} variant="secondary" className="shrink-0">
                    <Plus className="w-4 h-4 mr-1" />
                    Misc
                  </Button>
                </div>
              </div>

              {/* Product table */}
              <SectionCard title={`Products (${filteredProducts.length})`} icon={Package} noPadding>
                <div className="overflow-x-auto max-h-[calc(100vh-22rem)] overflow-y-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Code</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Stock</th>
                        <th className="text-center w-16">Add</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                            No products match your search
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product: any) => (
                          <tr key={product.id} data-testid={`card-product-${product.id}`}>
                            <td className="font-medium">{product.name}</td>
                            <td className="text-muted-foreground font-mono text-xs">{product.code}</td>
                            <td className="text-right tabular-nums">₹{product.sellingPrice}</td>
                            <td className={`text-right font-medium ${product.stock < 10 ? "text-warning" : "text-success"}`}>
                              {product.stock}
                            </td>
                            <td className="text-center">
                              <Button
                                size="sm"
                                onClick={() => addToCart(product)}
                                disabled={product.stock === 0}
                                className="btn-icon"
                                data-testid={`button-add-to-cart-${product.id}`}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>

            {/* Right: cart */}
            <div className="xl:sticky xl:top-20">
              <div className="surface-card overflow-hidden" data-testid="card-cart">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold">Cart</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">{cart.length} items</span>
                </div>

                <div className="p-4">
                  <div className="space-y-2 min-h-[120px] max-h-[calc(100vh-28rem)] overflow-y-auto mb-4">
                    {cart.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">Cart is empty</p>
                    ) : (
                      cart.map(item => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border ${item.isMisc ? "border-warning/30 bg-warning/5" : "border-border/60 bg-muted/20"}`}
                          data-testid={`cart-item-${item.id}`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="font-medium text-foreground text-xs sm:text-sm leading-tight">{item.name}</div>
                            {item.isMisc && (
                              <span className="shrink-0 text-[10px] font-medium badge-warning">MISC</span>
                            )}
                          </div>
                          {item.isMisc ? (
                            <div className="flex justify-between items-center">
                              <span className="text-xs sm:text-sm font-semibold text-foreground">
                                ₹{item.sellingPrice.toFixed(2)}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFromCart(item.id)}
                                className="btn-icon text-destructive hover:text-destructive"
                                data-testid={`button-remove-${item.id}`}
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
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
                                  variant="outline"
                                  onClick={() => removeFromCart(item.id)}
                                  className="btn-icon text-destructive hover:text-destructive"
                                  data-testid={`button-remove-${item.id}`}
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3 py-2 border-t border-border/60">
                    <Switch
                      id="hide-gst"
                      checked={hideGST}
                      onCheckedChange={setHideGST}
                      data-testid="switch-hide-gst"
                    />
                    <Label htmlFor="hide-gst" className="text-xs cursor-pointer">
                      Hide GST on bill
                    </Label>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    {!hideGST && (
                      <>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span className="font-semibold text-foreground" data-testid="text-subtotal">₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">GST:</span>
                          <span className="font-semibold text-foreground" data-testid="text-gst">₹{gstAmount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-base font-semibold border-t pt-2 mt-2">
                      <span>Total</span>
                      <span className="text-primary tabular-nums" data-testid="text-grand-total">₹{hideGST ? subtotal.toFixed(2) : grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4 h-10"
                    onClick={() => invoiceCounterMutation.mutate(cart)}
                    disabled={cart.length === 0 || invoiceCounterMutation.isPending}
                    data-testid="button-generate-invoice"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    {invoiceCounterMutation.isPending ? "Generating..." : "Generate Invoice"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <SectionCard title={`Invoices (${filteredInvoices.length})`} icon={FileText} noPadding>
              <div className="px-5 pt-4 pb-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative sm:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="pl-9 input-modern"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-9 input-modern"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-9 input-modern"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th className="hidden md:table-cell">Vehicle</th>
                      <th>Date</th>
                      <th className="text-right">Amount</th>
                      <th className="text-center">Print</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          No invoices found
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice: any) => (
                        <tr key={invoice.id}>
                          <td className="font-mono text-xs">{invoice.invoiceNumber}</td>
                          <td>{invoice.customerName}</td>
                          <td className="text-muted-foreground">{invoice.customerPhone}</td>
                          <td className="text-muted-foreground hidden md:table-cell">{invoice.vehicleNo || "—"}</td>
                          <td className="text-muted-foreground">{formatDate(invoice.createdAt)}</td>
                          <td className="text-right font-medium tabular-nums">₹{invoice.grandTotal}</td>
                          <td className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => printInvoice({ ...invoice, items: JSON.parse(invoice.items) })}
                              className="h-8 w-8 p-0"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
          </SectionCard>
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
                  {currentInvoiceData.customerPhone && currentInvoiceData.customerPhone !== "N/A" && (
                    <p className="text-[10px] text-slate-600">Phone: {currentInvoiceData.customerPhone}</p>
                  )}
                  {currentInvoiceData.vehicleNo?.trim() && (
                    <p className="text-[10px] text-slate-600">Vehicle No: {currentInvoiceData.vehicleNo.trim()}</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-3 overflow-x-auto">
                <table className="w-full text-[9px] border border-slate-300" style={{tableLayout: 'fixed'}}>
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="text-center p-1 border border-slate-600" style={{width: currentInvoiceData.hideGST ? '6%' : '5%'}}>#</th>
                      <th className="text-left p-1 border border-slate-600" style={{width: currentInvoiceData.hideGST ? '40%' : '32%'}}>Item</th>
                      <th className="text-center p-1 border border-slate-600" style={{width: currentInvoiceData.hideGST ? '12%' : '10%'}}>HSN</th>
                      <th className="text-center p-1 border border-slate-600" style={{width: currentInvoiceData.hideGST ? '10%' : '8%'}}>Qty</th>
                      <th className="text-right p-1 border border-slate-600" style={{width: currentInvoiceData.hideGST ? '15%' : '13%'}}>Rate</th>
                      {!currentInvoiceData.hideGST && (
                        <th className="text-center p-1 border border-slate-600" style={{width: '10%'}}>GST%</th>
                      )}
                      <th className="text-right p-1 border border-slate-600" style={{width: currentInvoiceData.hideGST ? '17%' : '15%'}}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInvoiceData.items.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-slate-200">
                        <td className="p-1 border border-slate-200 text-center">{index + 1}</td>
                        <td className="p-1 border border-slate-200">
                          <div className="font-medium text-slate-900 item-name text-[9px] break-words">{item.name}</div>
                          <div className="text-[8px] text-slate-500 item-code">Code: {item.code}</div>
                        </td>
                        <td className="p-1 text-center text-slate-600 border border-slate-200">{item.hsnCode}</td>
                        <td className="p-1 text-center border border-slate-200">{Number(item.quantity) || 0}</td>
                        <td className="p-1 text-right border border-slate-200">
                          ₹{currentInvoiceData.hideGST 
                            ? (Number(item.sellingPrice) * Number(item.quantity) / Number(item.quantity)).toFixed(2)
                            : Number(item.sellingPrice).toFixed(2)}
                        </td>
                        {!currentInvoiceData.hideGST && (
                          <td className="p-1 text-center border border-slate-200">{Number(item.gstRate) || 0}%</td>
                        )}
                        <td className="p-1 text-right font-semibold border border-slate-200">
                          ₹{currentInvoiceData.hideGST
                            ? ((Number(item.sellingPrice) * Number(item.quantity) * (100 / (100 + Number(item.gstRate))))).toFixed(2)
                            : Number(item.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-3 totals-section">
                <div className="w-full sm:w-64 border border-slate-200 p-2 bg-slate-50 rounded">
                  {!currentInvoiceData.hideGST && (
                    <>
                      <div className="flex justify-between py-1.5 text-xs">
                        <span className="text-slate-600">Subtotal:</span>
                        <span className="font-semibold text-slate-900">₹{currentInvoiceData.subtotal}</span>
                      </div>
                      <div className="flex justify-between py-1.5 text-xs">
                        <span className="text-slate-600">GST Amount:</span>
                        <span className="font-semibold text-slate-900">₹{currentInvoiceData.gstAmount}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between py-2 border-t-2 border-slate-800 mt-1 text-sm font-bold">
                    <span className="text-slate-900">{currentInvoiceData.hideGST ? 'Total:' : 'Grand Total:'}</span>
                    <span className="text-blue-600 text-base">
                      ₹{currentInvoiceData.hideGST ? currentInvoiceData.subtotal : currentInvoiceData.grandTotal}
                    </span>
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

            <div className="flex gap-3 p-4 border-t bg-muted/30 sticky bottom-0">
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Print
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
    </PageShell>
  );
}
