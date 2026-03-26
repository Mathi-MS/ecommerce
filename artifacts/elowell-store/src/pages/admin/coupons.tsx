import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListProducts } from "@/lib/api";
import { useApiOptions } from "@/store/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Tag, Edit } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = ["/api/referrals"];

function generateCode(name: string, percent: string) {
  const prefix = name.replace(/\s+/g, "").substring(0, 3).toUpperCase();
  const pct = Math.round(Number(percent) || 0);
  return prefix && pct ? `${prefix}${pct}` : "";
}

export default function AdminCoupons() {
  const apiOpts = useApiOptions();
  const { data: productsData } = useListProducts();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");
  const authHeaders = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const { data: coupons = [], isLoading } = useQuery<any[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL }/api/referrals`, { headers: authHeaders });
      return res.json();
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ couponName: "", discountPercent: "", productIds: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const products = productsData?.products ?? [];
  const previewCode = useMemo(() => generateCode(form.couponName, form.discountPercent), [form.couponName, form.discountPercent]);

  // product IDs already claimed by OTHER coupons (not the one being edited)
  const takenProductIds = useMemo(() => {
    const map: Record<string, string> = {};
    coupons.forEach((c: any) => {
      if (editing && String(c.id) === String(editing.id)) return;
      (c.productIds || []).forEach((pid: string) => { map[pid] = c.code; });
    });
    return map;
  }, [coupons, editing]);

  const openCreate = () => { setEditing(null); setForm({ couponName: "", discountPercent: "", productIds: [] }); setError(""); setOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ couponName: c.couponName, discountPercent: String(c.discountPercent), productIds: c.productIds || [] }); setError(""); setOpen(true); };

  const toggleProduct = (id: string) => {
    setForm(f => ({
      ...f,
      productIds: f.productIds.includes(id) ? f.productIds.filter(p => p !== id) : [...f.productIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.couponName.trim()) { setError("Coupon name is required."); return; }
    if (!form.discountPercent) { setError("Discount percentage is required."); return; }
    setSaving(true);
    setError("");
    try {
      const url = editing ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/referrals/${editing.id}` : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/referrals`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify({ couponName: form.couponName, discountPercent: Number(form.discountPercent), productIds: form.productIds }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save coupon."); return; }
      await queryClient.refetchQueries({ queryKey: QUERY_KEY });
      setOpen(false);
    } catch {
      setError("Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/referrals/${id}`, { method: "DELETE", headers: authHeaders });
    await queryClient.refetchQueries({ queryKey: QUERY_KEY });
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Coupon Codes</h2>
        <Button className="rounded-xl gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Coupon
        </Button>
      </div>

      <Dialog open={open} onOpenChange={o => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Coupon Code" : "Add Coupon Code"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <Input
              placeholder="Coupon Name *"
              value={form.couponName}
              onChange={e => setForm(f => ({ ...f, couponName: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Discount Percentage * (e.g. 10)"
              min={1} max={100}
              value={form.discountPercent}
              onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
            />
            {previewCode && (
              <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-3">
                <Tag className="h-4 w-4 text-secondary" />
                <span className="text-sm">Coupon ID: <strong>{editing ? editing.code : previewCode}</strong></span>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Applicable Products (select to restrict)</p>
              <div className="border border-border rounded-xl max-h-48 overflow-y-auto divide-y divide-border">
                {products.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3">No products found</p>
                ) : products.map((p: any) => {
                  const taken = takenProductIds[String(p.id)];
                  return (
                    <label key={p.id} className={`flex items-center gap-3 px-3 py-2 transition-colors ${taken ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted/40"}`}>
                      <input
                        type="checkbox"
                        checked={form.productIds.includes(String(p.id))}
                        onChange={() => !taken && toggleProduct(String(p.id))}
                        disabled={!!taken}
                        className="rounded"
                      />
                      <img src={p.mainImage || p.images?.[0] || ""} alt="" className="w-8 h-8 rounded-lg object-cover bg-muted" />
                      <span className="text-sm flex-1">{p.name}</span>
                      {taken && <span className="text-xs text-muted-foreground">{taken}</span>}
                    </label>
                  );
                })}
              </div>
              {form.productIds.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No products selected — coupon applies to all products</p>
              )}
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full rounded-xl" disabled={saving}>
              {saving ? "Saving..." : editing ? "Update Coupon" : "Save Coupon"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-2xl shadow-sm border-none overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
            <tr>
              <th className="p-4 font-medium">Coupon Name</th>
              <th className="p-4 font-medium">Code</th>
              <th className="p-4 font-medium">Discount</th>
              <th className="p-4 font-medium">Applicable Products</th>
              <th className="p-4 font-medium">Used</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center">Loading...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No coupons yet</td></tr>
            ) : coupons.map((c: any) => {
              const applicableProducts = c.productIds?.length
                ? products.filter((p: any) => c.productIds.includes(String(p.id))).map((p: any) => p.name)
                : null;
              return (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{c.couponName}</td>
                  <td className="p-4">
                    <span className="bg-secondary/10 text-secondary font-bold px-2 py-1 rounded-lg text-sm">{c.code}</span>
                  </td>
                  <td className="p-4">{c.discountPercent}%</td>
                  <td className="p-4 text-sm text-muted-foreground max-w-[200px]">
                    {applicableProducts ? applicableProducts.join(", ") || "—" : <span className="text-primary text-xs">All products</span>}
                  </td>
                  <td className="p-4">{c.usageCount}</td>
                  <td className="p-4 text-right flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
