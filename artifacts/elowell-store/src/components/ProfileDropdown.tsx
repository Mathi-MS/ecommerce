import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useSessionStore } from "@/store/session";
import { User, Edit, Package, Lock, LogOut, Eye, EyeOff } from "lucide-react";

export function ProfileDropdown() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, setUser, logout } = useSessionStore();
  const [dialog, setDialog] = useState<"none" | "profile" | "password">("none");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || ""
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const token = localStorage.getItem("token");
  const authHeaders = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(profileForm)
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast({ title: "Success", description: "Profile updated successfully" });
        setDialog("none");
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: "Success", description: "Password changed successfully" });
        setDialog("none");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to change password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast({ title: "Success", description: "Logged out successfully" });
  };

  if (!user) {
    return (
      <Button variant="ghost" onClick={() => navigate("/auth")} className="flex items-center gap-2">
        <User className="h-4 w-4" />
        Sign In
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-medium">{user.name}</div>
          <div className="px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { setProfileForm({ name: user.name, phone: user.phone || "" }); setDialog("profile"); }}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/orders")}>
            <Package className="mr-2 h-4 w-4" />
            Order History
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); setDialog("password"); }}>
            <Lock className="mr-2 h-4 w-4" />
            Change Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Profile Dialog */}
      <Dialog open={dialog === "profile"} onOpenChange={o => !o && setDialog("none")}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input
                value={profileForm.name}
                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Full Name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input value={user.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <Input
                value={profileForm.phone}
                onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="Phone Number"
                type="tel"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialog("none")} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={dialog === "password"} onOpenChange={o => !o && setDialog("none")}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Current Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">New Password</label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Enter new password"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Confirm New Password</label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialog("none")} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}