import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import PageHeader from "@/components/shop/PageHeader";
import PageShell from "@/components/shop/PageShell";
import LoadingSpinner from "@/components/shop/LoadingSpinner";
import SectionCard from "@/components/shop/SectionCard";
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
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
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

  const handleUnlockAttempt = async () => {
    if (!passwordInput.trim()) {
      toast({
        title: "Password required",
        description: "Enter your login password",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingPassword(true);
    try {
      const res = await apiRequest("POST", api.auth.verifyPassword.path, { password: passwordInput });
      const data = (await res.json()) as { valid?: boolean };
      if (data.valid !== true) {
        throw new Error("Invalid password");
      }
      setIsUnlocked(true);
      setShowPasswordDialog(false);
      setPasswordInput("");
      toast({
        title: "Unlocked!",
        description: "Settings are now unlocked for editing",
      });
    } catch {
      toast({
        title: "Incorrect Password",
        description: "Enter your login password to unlock settings",
        variant: "destructive",
      });
      setPasswordInput("");
    } finally {
      setIsVerifyingPassword(false);
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
    return <LoadingSpinner label="Loading settings..." />;
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
  const [newEmail, setNewEmail] = useState("");
  const [changePasswordUserId, setChangePasswordUserId] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const response = await fetch(api.users.list.path);
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; email: string }) => {
      return apiRequest("POST", api.users.create.path, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      setNewUsername("");
      setNewPassword("");
      setNewEmail("");
      toast({
        title: "User Created!",
        description: "New user has been created successfully. Welcome email sent!",
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
    <PageShell narrow>
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your login password to unlock settings for editing.
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
              className="input-modern"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPasswordInput("")} disabled={isVerifyingPassword}>
              Cancel
            </AlertDialogCancel>
            <Button onClick={handleUnlockAttempt} disabled={isVerifyingPassword}>
              {isVerifyingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Unlock"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PageHeader
        title="Settings"
        icon={Settings}
        actions={
          isUnlocked ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-success flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5" />
                Unlocked
              </span>
              <Button variant="outline" size="sm" onClick={handleLock}>
                <Lock className="w-4 h-4 mr-1" />
                Lock
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-warning flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Locked
              </span>
              <Button variant="outline" size="sm" onClick={() => setShowPasswordDialog(true)}>
                <Unlock className="w-4 h-4 mr-1" />
                Unlock
              </Button>
            </div>
          )
        }
      />

      <SectionCard title="Business Information" icon={Settings}>
          <div className="space-y-4">
              <div>
                <label className="form-label">Shop Name</label>
                <Input
                  value={settings.shopName}
                  onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                  className="mt-1.5 input-modern"
                  data-testid="input-shop-name"
                  disabled={!isUnlocked}
                />
              </div>

              <div>
                <label className="form-label">Address</label>
                <Input
                  value={settings.shopAddress}
                  onChange={(e) => setSettings({ ...settings, shopAddress: e.target.value })}
                  className="mt-1.5 input-modern"
                  data-testid="input-address"
                  disabled={!isUnlocked}
                />
              </div>

              <div>
                <label className="form-label">Phone</label>
                <Input
                  value={settings.shopPhone}
                  onChange={(e) => setSettings({ ...settings, shopPhone: e.target.value })}
                  className="mt-1.5 input-modern"
                  data-testid="input-phone"
                  disabled={!isUnlocked}
                />
              </div>

              <div>
                <label className="form-label">GST Number</label>
                <Input
                  value={settings.shopGSTIN}
                  onChange={(e) => setSettings({ ...settings, shopGSTIN: e.target.value })}
                  className="mt-1.5 input-modern"
                  data-testid="input-gst-number"
                  disabled={!isUnlocked}
                />
              </div>
          </div>
      </SectionCard>
      <SectionCard title="Terms & Conditions">
          <div className="space-y-4">
              <div>
                <label className="form-label">Line 1</label>
                <Input
                  value={settings.customText1}
                  onChange={(e) => setSettings({ ...settings, customText1: e.target.value })}
                  className="mt-1.5 input-modern"
                  disabled={!isUnlocked}
                />
              </div>
              <div>
                <label className="form-label">Line 2</label>
                <Input
                  value={settings.customText2}
                  onChange={(e) => setSettings({ ...settings, customText2: e.target.value })}
                  className="mt-1.5 input-modern"
                  disabled={!isUnlocked}
                />
              </div>
              <div>
                <label className="form-label">Line 3</label>
                <Input
                  value={settings.customText3}
                  onChange={(e) => setSettings({ ...settings, customText3: e.target.value })}
                  className="mt-1.5 input-modern"
                  disabled={!isUnlocked}
                />
              </div>
          </div>
      </SectionCard>

      <SectionCard title="Branding" icon={ImageIcon}>
          <div className="space-y-4">
              <div>
                <label className="form-label">Company Logo</label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={!isUnlocked}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  {settings.logoPath && <span className="text-xs text-success">Uploaded</span>}
                </div>
                {settings.logoPath && (
                  <div className="mt-3 p-3 border border-border/60 rounded-lg bg-muted/20">
                    <img src={settings.logoPath} alt="Logo" className="max-h-20 object-contain" />
                  </div>
                )}
              </div>
              <div>
                <label className="form-label">Signature</label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input ref={signatureInputRef} type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                  <Button type="button" variant="outline" size="sm" onClick={() => signatureInputRef.current?.click()} disabled={!isUnlocked}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  {settings.signaturePath && <span className="text-xs text-success">Uploaded</span>}
                </div>
                {settings.signaturePath && (
                  <div className="mt-3 p-3 border border-border/60 rounded-lg bg-muted/20">
                    <img src={settings.signaturePath} alt="Signature" className="max-h-20 object-contain" />
                  </div>
                )}
              </div>
          </div>
      </SectionCard>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saveMutation.isPending || !isUnlocked} data-testid="button-save-settings">
          {saveMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" />Save</>
          )}
        </Button>
        <Button onClick={handleReset} disabled={saveMutation.isPending || !isUnlocked} variant="outline">
          Reset
        </Button>
      </div>

      <SectionCard title={`Users (${users.length})`} icon={Users}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Username</label>
                <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Min 3 characters" className="mt-1.5 input-modern" />
              </div>
              <div>
                <label className="form-label">Password</label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="mt-1.5 input-modern" />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Email</label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" className="mt-1.5 input-modern" />
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
                if (!newEmail || !newEmail.includes('@')) {
                  toast({ title: "Please enter a valid email address", variant: "destructive" });
                  return;
                }
                createUserMutation.mutate({ username: newUsername, password: newPassword, email: newEmail });
              }}
              disabled={createUserMutation.isPending || !newUsername || !newPassword || !newEmail}
            >
              {createUserMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" />Create User</>
              )}
            </Button>

            <div className="space-y-2 border-t border-border/60 pt-4">
              {users.map((user: any) => (
                <div key={user.id} className="p-3 border border-border/60 rounded-lg bg-muted/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{user.username}</p>
                      {user.id === currentUser?.id && <p className="text-xs text-muted-foreground">Current user</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {changePasswordUserId === user.id ? (
                        <>
                          <Input type="password" placeholder="Current" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-32 h-8 input-modern" />
                          <Input type="password" placeholder="New" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="w-32 h-8 input-modern" />
                          <Button size="sm" onClick={() => {
                            if (newUserPassword.length < 6) {
                              toast({ title: "Password must be at least 6 characters", variant: "destructive" });
                              return;
                            }
                            changePasswordMutation.mutate({ userId: user.id, currentPassword, newPassword: newUserPassword });
                          }} disabled={changePasswordMutation.isPending}>
                            {changePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setChangePasswordUserId(""); setCurrentPassword(""); setNewUserPassword(""); }}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setChangePasswordUserId(user.id)}>
                            <Key className="w-4 h-4 mr-1" />
                            Password
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm(`Delete user "${user.username}"?`)) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}
                              disabled={deleteUserMutation.isPending}
                              className="text-destructive hover:text-destructive"
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
      </SectionCard>
    </PageShell>
  );
}
