import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useApiOptions } from "@/store/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Plus, Edit, Eye, Star, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = ["/api/products"];

const EMPTY = { name: "", shortDescription: "", description: "", price: "", discountPrice: "", stock: "", order: "", mainImage: "", images: [] as string[] };

async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await fetch("/api/products/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, filename: file.name }),
      });
      const data = await res.json();
      if (data.url) resolve(data.url);
      else reject(new Error("Upload failed"));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminProducts() {
  const apiOpts = useApiOptions();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");
  const authHeaders = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const { data: productsData, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/products", { headers: authHeaders });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
  });

  const [dialog, setDialog] = useState<"none" | "form" | "view">("none");
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refetch = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const openCreate = () => {
    setEditing(null);
    const nextOrder = String((productsData?.products?.length ?? 0) + 1);
    setForm({ ...EMPTY, order: nextOrder });
    setError("");
    setDialog("form");
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name, shortDescription: p.shortDescription, description: p.description,
      price: String(p.price), discountPrice: String(p.discountPrice ?? ""),
      stock: String(p.stock), order: String(p.order ?? ""),
      mainImage: p.mainImage || "", images: p.images || [],
    });
    setError("");
    setDialog("form");
  };

  const openView = (p: any) => { setViewing(p); setDialog("view"); };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { setForm(f => ({ ...f, mainImage: "" })); const url = await uploadImage(file); setForm(f => ({ ...f, mainImage: url })); }
    catch { setError("Main image upload failed."); }
    finally { setUploading(false); }
  };

  const handleProductImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - form.images.length;
    if (remaining <= 0) { setError("Maximum 5 product images allowed."); return; }
    setUploading(true);
    try {
      const urls = await Promise.all(files.slice(0, remaining).map(uploadImage));
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
    } catch { setError("Product image upload failed."); }
    finally { setUploading(false); }
  };

  const removeProductImage = (idx: number) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!form.price) { setError("Base price is required."); return; }
    setSaving(true);
    try {
      const body = {
        name: form.name, shortDescription: form.shortDescription, description: form.description,
        price: Number(form.price), discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        stock: Number(form.stock), order: Number(form.order) || 0,
        mainImage: form.mainImage, images: form.images, featured: false,
      };
      const response = editing 
        ? await fetch(`/api/products/${editing.id}`, { method: "PUT", headers: authHeaders, body: JSON.stringify(body) })
        : await fetch("/api/products", { method: "POST", headers: authHeaders, body: JSON.stringify(body) });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDialog("none");
    } catch { setError("Failed to save product."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE", headers: authHeaders });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (error) {
      setError("Failed to delete product.");
    }
  };

  const products = productsData?.products ?? [];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Manage Products</h2>
        <Button className="rounded-xl gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Add Product</Button>
      </div>

      {/* Form Dialog */}
      <Dialog open={dialog === "form"} onOpenChange={o => !o && setDialog("none")}>
        <DialogContent className="sm:max-w-[640px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <Input placeholder="Product Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Short Description" value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} />
            <textarea
              placeholder="Full Description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Base Price *" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              <Input type="number" placeholder="Selling Price" step="0.01" value={form.discountPrice} onChange={e => setForm(f => ({ ...f, discountPrice: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Stock" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
              <Input type="number" placeholder="Order" value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} />
            </div>

            {/* Main Image */}
            <div>
              <p className="text-sm font-medium mb-2">Main Image (single)</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                  {form.mainImage ? <img src={form.mainImage} className="w-full h-full object-cover" /> : <Plus className="h-6 w-6 text-muted-foreground" />}
                </div>
                <span className="text-sm text-muted-foreground">Click to upload main image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleMainImageUpload} />
              </label>
            </div>

            {/* Product Images */}
            <div>
              <p className="text-sm font-medium mb-2">Product Images (max 5)</p>
              <div className="flex flex-wrap gap-3">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                    <img src={img} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeProductImage(idx)} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"><X className="h-3 w-3 text-white" /></button>
                  </div>
                ))}
                {form.images.length < 5 && (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer bg-muted/30">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleProductImagesUpload} />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{form.images.length}/5 images</p>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full rounded-xl" disabled={saving || uploading}>
              {saving ? "Saving..." : uploading ? "Uploading..." : editing ? "Update Product" : "Save Product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={dialog === "view"} onOpenChange={o => !o && setDialog("none")}>
        <DialogContent className="sm:max-w-[700px] rounded-2xl max-h-[90vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {/* Main image + gallery */}
                <div className="space-y-3">
                  <div className="aspect-video rounded-2xl overflow-hidden bg-muted/30">
                    <img src={viewing.mainImage || viewing.images?.[0] || ""} alt={viewing.name} className="w-full h-full object-cover" />
                  </div>
                  {viewing.images?.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {viewing.images.map((img: string, i: number) => (
                        <img key={i} src={img} className="w-16 h-16 rounded-xl object-cover border border-border" />
                      ))}
                    </div>
                  )}
                </div>
                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Base Price</span><p className="font-bold text-lg">₹{viewing.price?.toFixed(2)}</p></div>
                  <div><span className="text-muted-foreground">Selling Price</span><p className="font-bold text-lg text-primary">{viewing.discountPrice ? `₹${viewing.discountPrice.toFixed(2)}` : "—"}</p></div>
                  <div><span className="text-muted-foreground">Stock</span><p className="font-semibold">{viewing.stock}</p></div>
                  <div><span className="text-muted-foreground">Order</span><p className="font-semibold">{viewing.order}</p></div>
                  {viewing.averageRating && (
                    <div className="flex items-center gap-1 col-span-2">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= viewing.averageRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />)}
                      <span className="text-sm text-muted-foreground ml-1">({viewing.reviewCount} reviews)</span>
                    </div>
                  )}
                </div>
                <div><p className="text-sm text-muted-foreground font-medium mb-1">Short Description</p><p className="text-sm">{viewing.shortDescription}</p></div>
                <div><p className="text-sm text-muted-foreground font-medium mb-1">Full Description</p><p className="text-sm whitespace-pre-line">{viewing.description}</p></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-sm border-none overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
            <tr>
              <th className="p-4 font-medium w-8">#</th>
              <th className="p-4 font-medium w-14">Image</th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Base Price</th>
              <th className="p-4 font-medium">Selling Price</th>
              <th className="p-4 font-medium">Stock</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={7} className="p-8 text-center">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No products yet</td></tr>
            ) : products.map((p: any) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-muted-foreground text-sm">{p.order}</td>
                <td className="p-4">
                  <img src={p.mainImage || p.images?.[0] || ""} alt="" className="w-10 h-10 rounded-lg object-cover bg-muted" />
                </td>
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4">₹{p.price?.toFixed(2)}</td>
                <td className="p-4">{p.discountPrice ? `₹${p.discountPrice.toFixed(2)}` : "—"}</td>
                <td className="p-4">{p.stock}</td>
                <td className="p-4 text-right flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openView(p)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
