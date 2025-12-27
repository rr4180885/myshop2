import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Upload, Image as ImageIcon } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";

interface SettingsForm {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopGSTIN: string;
  customText1: string;
  customText2: string;
  customText3: string;
  logoPath: string;
  signaturePath: string;
}

export default function SettingsTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsForm>({
    shopName: "Brothers Enterprises",
    shopAddress: "",
    shopPhone: "+91 98765 43210",
    shopGSTIN: "29XXXXX1234X1Z5",
    customText1: "All goods once sold will not be taken back",
    customText2: "Warranty as per manufacturer terms",
    customText3: "Payment due within 30 days",
    logoPath: "",
    signaturePath: "",
  });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Fetch settings from database
  const { data: dbSettings } = useQuery({
    queryKey: [api.settings.get.path],
    queryFn: async () => apiRequest("GET", api.settings.get.path),
  });

  useEffect(() => {
    if (dbSettings) {
      const data = dbSettings as any;
      setSettings({
        shopName: data.shopName || "Brothers Enterprises",
        shopAddress: data.shopAddress || "",
        shopPhone: data.shopPhone || "+91 98765 43210",
        shopGSTIN: data.shopGSTIN || "29XXXXX1234X1Z5",
        customText1: data.customText1 || "All goods once sold will not be taken back",
        customText2: data.customText2 || "Warranty as per manufacturer terms",
        customText3: data.customText3 || "Payment due within 30 days",
        logoPath: data.logoPath || "",
        signaturePath: data.signaturePath || "",
      });
    }
  }, [dbSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      return apiRequest("PUT", api.settings.update.path, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settings.get.path] });
      toast({
        title: "Saved!",
        description: "Shop settings updated successfully",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const handleReset = () => {
    const defaultSettings: SettingsForm = {
      shopName: "Brothers Enterprises",
      shopAddress: "",
      shopPhone: "+91 98765 43210",
      shopGSTIN: "29XXXXX1234X1Z5",
      customText1: "All goods once sold will not be taken back",
      customText2: "Warranty as per manufacturer terms",
      customText3: "Payment due within 30 days",
      logoPath: "",
      signaturePath: "",
    };
    setSettings(defaultSettings);
    saveMutation.mutate(defaultSettings);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoPath: reader.result as string });
        toast({
          title: "Logo Uploaded",
          description: "Logo image has been uploaded successfully",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, signaturePath: reader.result as string });
        toast({
          title: "Signature Uploaded",
          description: "Signature image has been uploaded successfully",
        });
      };
      reader.readAsDataURL(file);
    }
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
                  value={settings.shopAddress}
                  onChange={(e) => setSettings({ ...settings, shopAddress: e.target.value })}
                  className="mt-2"
                  data-testid="input-address"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                <Input
                  value={settings.shopPhone}
                  onChange={(e) => setSettings({ ...settings, shopPhone: e.target.value })}
                  className="mt-2"
                  data-testid="input-phone"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">GST Number</label>
                <Input
                  value={settings.shopGSTIN}
                  onChange={(e) => setSettings({ ...settings, shopGSTIN: e.target.value })}
                  className="mt-2"
                  data-testid="input-gst-number"
                />
              </div>
            </div>

            <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-6" />

            {/* Terms Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Terms & Conditions</h3>
              
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Custom Text 1</label>
                <Input
                  value={settings.customText1}
                  onChange={(e) => setSettings({ ...settings, customText1: e.target.value })}
                  className="mt-2"
                  placeholder="e.g., All goods once sold will not be taken back"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Custom Text 2</label>
                <Input
                  value={settings.customText2}
                  onChange={(e) => setSettings({ ...settings, customText2: e.target.value })}
                  className="mt-2"
                  placeholder="e.g., Warranty as per manufacturer terms"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Custom Text 3</label>
                <Input
                  value={settings.customText3}
                  onChange={(e) => setSettings({ ...settings, customText3: e.target.value })}
                  className="mt-2"
                  placeholder="e.g., Payment due within 30 days"
                />
              </div>
            </div>

            <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-6" />

            {/* Branding Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Brothers Enterprises Branding</h3>
              
              {/* Logo Upload */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company Logo</label>
                <div className="mt-2 flex items-center gap-4">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </Button>
                  {settings.logoPath && (
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Logo uploaded</span>
                    </div>
                  )}
                </div>
                {settings.logoPath && (
                  <div className="mt-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <img 
                      src={settings.logoPath} 
                      alt="Company Logo" 
                      className="max-h-24 object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Signature Upload */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Authorized Signature</label>
                <div className="mt-2 flex items-center gap-4">
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => signatureInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Signature
                  </Button>
                  {settings.signaturePath && (
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Signature uploaded</span>
                    </div>
                  )}
                </div>
                {settings.signaturePath && (
                  <div className="mt-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <img 
                      src={settings.signaturePath} 
                      alt="Authorized Signature" 
                      className="max-h-24 object-contain"
                    />
                  </div>
                )}
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
