import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Plus, Edit } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = ["offers"];

export default function AdminOffers() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");
  const authHeaders = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const { data: offers = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/offers`, { headers: authHeaders });
      return res.json();
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("inactive");
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const validate = () => {
    if (wordCount < 2) return "Minimum 2 words required.";
    if (wordCount > 10) return "Maximum 10 words allowed.";
    if (text.length > 200) return "Maximum 200 characters allowed.";
    return "";
  };

  const openCreate = () => { setEditing(null); setText(""); setStatus("inactive"); setError(""); setIsDialogOpen(true); };
  const openEdit = (o: any) => { setEditing(o); setText(o.text); setStatus(o.status); setError(""); setIsDialogOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    
    setSaving(true);
    try {
      const response = editing
        ? await fetch(`${baseUrl}/api/offers/${editing.id}`, { method: "PUT", headers: authHeaders, body: JSON.stringify({ text, status }) })
        : await fetch(`${baseUrl}/api/offers`, { method: "POST", headers: authHeaders, body: JSON.stringify({ text, status }) });
      
      if (response.ok) {
        await queryClient.refetchQueries({ queryKey: QUERY_KEY });
        setIsDialogOpen(false);
      } else {
        setError('Failed to save offer');
      }
    } catch (err) {
      setError('Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (offer: any) => {
    if (togglingId) return;
    const newStatus = offer.status === "active" ? "inactive" : "active";
    const id = String(offer.id);
    setTogglingId(id);
    try {
      const res = await fetch(`${baseUrl}/api/offers/${id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await queryClient.refetchQueries({ queryKey: QUERY_KEY });
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    try {
      const response = await fetch(`${baseUrl}/api/offers/${id}`, { method: "DELETE", headers: authHeaders });
      if (response.ok) {
        await queryClient.refetchQueries({ queryKey: QUERY_KEY });
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Manage Offers</h2>
        <Button className="rounded-xl gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Add Offer</Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Offer" : "Add Offer"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Input
                placeholder="Offer text (2–10 words, max 200 chars)"
                value={text}
                onChange={e => { setText(e.target.value); setError(""); }}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">{wordCount} word{wordCount !== 1 ? "s" : ""} · {text.length}/200 chars</p>
              {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Status:</span>
              {["active", "inactive"].map(s => (
                <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} />
                  <span className="text-sm capitalize">{s}</span>
                </label>
              ))}
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={saving}>
              {saving ? "Saving..." : editing ? "Update Offer" : "Save Offer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-2xl shadow-sm border-none overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
            <tr>
              <th className="p-4 font-medium">Offer Text</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={3} className="p-8 text-center">Loading...</td></tr>
            ) : offers.length === 0 ? (
              <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No offers yet</td></tr>
            ) : offers.map((offer: any) => (
              <tr key={offer.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium">{offer.text}</td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggle(offer)}
                    disabled={!!togglingId}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                      offer.status === "active" ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      offer.status === "active" ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </td>
                <td className="p-4 text-right flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(offer)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(offer.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
