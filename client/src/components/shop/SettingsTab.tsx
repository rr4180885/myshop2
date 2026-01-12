import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Upload, Image as ImageIcon, Loader2, Lock, Unlock, Users, UserPlus, Key, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api, buildUrl } from "@shared/routes";
import { useUser } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
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
  const { data: dbSettings, isLoading } = useQuery({
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

  const handleUnlockAttempt = () => {
    const correctPassword = "admin12345";
    if (passwordInput === correctPassword) {
      setIsUnlocked(true);
      setShowPasswordDialog(false);
      setPasswordInput("");
      toast({
        title: "Unlocked!",
        description: "Settings are now unlocked for editing",
      });
    } else {
      toast({
        title: "Incorrect Password",
        description: "Please enter the correct password to edit settings",
        variant: "destructive",
      });
      setPasswordInput("");
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    toast({
      title: "Locked",
      description: "Settings have been locked",
    });
  };

  const handleSave = () => {
    if (!isUnlocked) {
      toast({
        title: "Settings Locked",
        description: "Please unlock settings before saving",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(settings);
  };

  const handleReset = () => {
    if (!isUnlocked) {
      toast({
        title: "Settings Locked",
        description: "Please unlock settings before resetting",
        variant: "destructive",
      });
      return;
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

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

  // User Management State
  const { data: currentUser } = useUser();
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changePasswordUserId, setChangePasswordUserId] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => apiRequest("GET", api.users.list.path),
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      return apiRequest("POST", api.users.create.path, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      setNewUsername("");
      setNewPassword("");
      toast({
        title: "User Created!",
        description: "New user has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { userId: string; currentPassword: string; newPassword: string }) => {
      const url = buildUrl(api.users.changePassword.path, { id: data.userId });
      return apiRequest("PUT", url, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      setChangePasswordUserId("");
      setCurrentPassword("");
      setNewUserPassword("");
      toast({
        title: "Password Changed!",
        description: "Password has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const url = buildUrl(api.users.delete.path, { id: userId });
      return apiRequest("DELETE", url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({
        title: "User Deleted!",
        description: "User has been removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="max-w-3xl space-y-6">
      {/* Password Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Password</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter the administrator password to unlock settings for editing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUnlockAttempt();
                }
              }}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPasswordInput("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlockAttempt}>Unlock</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="border-slate-200/50 dark:border-slate-700/50">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Shop Configuration
            </CardTitle>
            <div className="flex items-center gap-2">
              {isUnlocked ? (
                <>
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Unlock className="w-4 h-4" />
                    Unlocked
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLock}
                    className="border-slate-300 dark:border-slate-600"
                  >
                    <Lock className="w-4 h-4 mr-1" />
                    Lock
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <Lock className="w-4 h-4" />
                    Locked
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordDialog(true)}
                    className="border-slate-300 dark:border-slate-600"
                  >
                    <Unlock className="w-4 h-4 mr-1" />
                    Unlock
                  </Button>
                </>
              )}
            </div>
          </div>
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
                  disabled={!isUnlocked}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                <Input
                  value={settings.shopAddress}
                  onChange={(e) => setSettings({ ...settings, shopAddress: e.target.value })}
                  className="mt-2"
                  data-testid="input-address"
                  disabled={!isUnlocked}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                <Input
                  value={settings.shopPhone}
                  onChange={(e) => setSettings({ ...settings, shopPhone: e.target.value })}
                  className="mt-2"
                  data-testid="input-phone"
                  disabled={!isUnlocked}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">GST Number</label>
                <Input
                  value={settings.shopGSTIN}
                  onChange={(e) => setSettings({ ...settings, shopGSTIN: e.target.value })}
                  className="mt-2"
                  data-testid="input-gst-number"
                  disabled={!isUnlocked}
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
                  disabled={!isUnlocked}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Custom Text 2</label>
                <Input
                  value={settings.customText2}
                  onChange={(e) => setSettings({ ...settings, customText2: e.target.value })}
                  className="mt-2"
                  placeholder="e.g., Warranty as per manufacturer terms"
                  disabled={!isUnlocked}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Custom Text 3</label>
                <Input
                  value={settings.customText3}
                  onChange={(e) => setSettings({ ...settings, customText3: e.target.value })}
                  className="mt-2"
                  placeholder="e.g., Payment due within 30 days"
                  disabled={!isUnlocked}
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
                    disabled={!isUnlocked}
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
                    disabled={!isUnlocked}
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
                disabled={saveMutation.isPending || !isUnlocked}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                data-testid="button-save-settings"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
              <Button 
                onClick={handleReset}
                disabled={saveMutation.isPending || !isUnlocked}
                variant="outline"
                className="border-slate-300 dark:border-slate-600"
              >
                Reset to Defaults
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management Section */}
      <Card className="border-purple-200/50 dark:border-purple-900/50">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-b border-purple-200/50 dark:border-purple-700/50">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          {/* Create New User */}
          <div className="mb-8 pb-8 border-b border-slate-200/50 dark:border-slate-700/50">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-4">
              <UserPlus className="w-4 h-4 inline mr-2" />
              Create New User
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username (min 3 characters)"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  className="mt-2"
                />
              </div>
            </div>
            <Button
              onClick={() => {
                if (newUsername.length < 3) {
                  toast({ title: "Username must be at least 3 characters", variant: "destructive" });
                  return;
                }
                if (newPassword.length < 6) {
                  toast({ title: "Password must be at least 6 characters", variant: "destructive" });
                  return;
                }
                createUserMutation.mutate({ username: newUsername, password: newPassword });
              }}
              disabled={createUserMutation.isPending || !newUsername || !newPassword}
              className="mt-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>

          {/* Existing Users List */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-4">
              <Users className="w-4 h-4 inline mr-2" />
              Existing Users ({users.length})
            </h3>
            <div className="space-y-3">
              {users.map((user: any) => (
                <div
                  key={user.id}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{user.username}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {user.id === currentUser?.id && "(Current User)"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {changePasswordUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="password"
                            placeholder="Current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-40"
                          />
                          <Input
                            type="password"
                            placeholder="New password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            className="w-40"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              if (newUserPassword.length < 6) {
                                toast({ title: "Password must be at least 6 characters", variant: "destructive" });
                                return;
                              }
                              changePasswordMutation.mutate({
                                userId: user.id,
                                currentPassword,
                                newPassword: newUserPassword,
                              });
                            }}
                            disabled={changePasswordMutation.isPending}
                          >
                            {changePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setChangePasswordUserId("");
                              setCurrentPassword("");
                              setNewUserPassword("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setChangePasswordUserId(user.id)}
                            className="border-blue-300 dark:border-blue-600"
                          >
                            <Key className="w-4 h-4 mr-1" />
                            Change Password
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}
                              disabled={deleteUserMutation.isPending}
                              className="border-red-300 dark:border-red-600 text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
