import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save } from "lucide-react";

const DEFAULT_SETTINGS = {
  shopName: "AutoParts Pro",
  address: "123 Main Road, Sector 15",
  city: "Narnaund, Haryana - 125039",
  phone: "+91 98765 43210",
  email: "info@autopartspro.com",
  gstNumber: "06XXXXX1234X1Z5",
  invoicePrefix: "INV-2024-",
  terms: "Goods once sold cannot be returned. 7 days warranty on all parts.",
};

export default function SettingsTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem("shopSettings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("shopSettings", JSON.stringify(settings));
    toast({
      title: "Saved!",
      description: "Shop settings updated successfully",
    });
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("shopSettings");
    toast({
      title: "Reset",
      description: "Settings reset to defaults",
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="border-slate-200/50 dark:border-slate-700/50">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200/50 dark:border-slate-700/50">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Shop Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="space-y-6">
            {/* Shop Info Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Business Information</h3>
              
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Shop Name</label>
                <Input
                  value={settings.shopName}
                  onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                  className="mt-2"
                  data-testid="input-shop-name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                <Input
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="mt-2"
                  data-testid="input-address"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">City/State/Pincode</label>
                <Input
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="mt-2"
                  data-testid="input-city"
                />
              </div>
            </div>

            <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-6" />

            {/* Contact Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Contact Details</h3>
              
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                <Input
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="mt-2"
                  data-testid="input-phone"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <Input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="mt-2"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-6" />

            {/* Tax & Invoice Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Tax & Invoice</h3>
              
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">GST Number</label>
                <Input
                  value={settings.gstNumber}
                  onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                  className="mt-2"
                  data-testid="input-gst-number"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Invoice Prefix</label>
                <Input
                  value={settings.invoicePrefix}
                  onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                  className="mt-2"
                  data-testid="input-invoice-prefix"
                />
              </div>
            </div>

            <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-6" />

            {/* Terms Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Terms & Conditions</h3>
              
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Terms & Conditions</label>
                <Textarea
                  value={settings.terms}
                  onChange={(e) => setSettings({ ...settings, terms: e.target.value })}
                  rows={4}
                  className="mt-2"
                  data-testid="textarea-terms"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
              <Button 
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                data-testid="button-save-settings"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
              <Button 
                onClick={handleReset}
                variant="outline"
                className="border-slate-300 dark:border-slate-600"
              >
                Reset to Defaults
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
