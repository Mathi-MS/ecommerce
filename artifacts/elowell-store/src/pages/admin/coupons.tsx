import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useListReferralCodes, useCreateReferralCode } from "@workspace/api-client-react";
import { useApiOptions } from "@/store/session";
import { Plus, Copy } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function AdminCoupons() {
  const { toast } = useToast();
  const apiOpts = useApiOptions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ code: '', discountPercent: 10, maxUsage: 100, isActive: true });

  const { data: coupons, refetch } = useListReferralCodes(apiOpts);
  const createMutation = useCreateReferralCode(apiOpts);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({ data: formData });
      toast({ title: "Success", description: "Coupon created successfully" });
      setDialogOpen(false);
      setFormData({ code: '', discountPercent: 10, maxUsage: 100, isActive: true });
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to save coupon", variant: "destructive" });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: `Coupon code "${code}" copied to clipboard` });
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData(prev => ({ ...prev, code: result }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Coupon Management</h1>
            <p className="text-muted-foreground">Manage discount coupons and referral codes</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData({ code: '', discountPercent: 10, maxUsage: 100, isActive: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Coupon</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Coupon Code</label>
                  <div className="flex gap-2">
                    <Input value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} placeholder="Enter coupon code" required className="flex-1" />
                    <Button type="button" variant="outline" onClick={generateRandomCode}>Generate</Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Discount Percentage</label>
                  <Input type="number" value={formData.discountPercent} onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: parseInt(e.target.value) || 0 }))} min={1} max={100} required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Maximum Usage</label>
                  <Input type="number" value={formData.maxUsage} onChange={(e) => setFormData(prev => ({ ...prev, maxUsage: parseInt(e.target.value) || 0 }))} min={1} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))} />
                  <label className="text-sm font-medium">Active</label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Saving...' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {coupons?.map((coupon: any) => (
            <Card key={coupon.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono font-semibold">{coupon.code}</code>
                      <Badge variant={coupon.isActive ? 'default' : 'secondary'}>{coupon.isActive ? 'Active' : 'Inactive'}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(coupon.code)} className="h-6 w-6 p-0"><Copy className="h-3 w-3" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>Discount: {coupon.discountPercent}%</div>
                      <div>Max Usage: {coupon.maxUsage || 'Unlimited'}</div>
                      <div>Used: {coupon.usageCount || 0} times</div>
                      <div>Created: {new Date(coupon.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {!coupons?.length && (
            <Card><CardContent className="p-12 text-center"><p className="text-muted-foreground">No coupons found. Create your first coupon to get started.</p></CardContent></Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
