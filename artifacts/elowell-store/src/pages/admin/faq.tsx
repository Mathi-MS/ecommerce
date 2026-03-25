import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListFaq, useCreateFaqItem } from "@workspace/api-client-react";
import { useApiOptions } from "@/store/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Plus, Edit } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = ["/api/faq"];

export default function AdminFaq() {
  const apiOpts = useApiOptions();
  const { data: faqs = [], isLoading } = useListFaq(apiOpts);
  const createMutation = useCreateFaqItem(apiOpts);
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; question: string; answer: string; order: number } | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState("0");
  const [error, setError] = useState("");

  const reset = () => { setEditing(null); setQuestion(""); setAnswer(""); setOrder("0"); setError(""); };
  const openCreate = () => { reset(); setOrder(String(faqs.length + 1)); setIsDialogOpen(true); };
  const openEdit = (f: any) => { setEditing(f); setQuestion(f.question); setAnswer(f.answer); setOrder(String(f.order)); setError(""); setIsDialogOpen(true); };

  const refetch = () => queryClient.refetchQueries({ queryKey: QUERY_KEY });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) { setError("Question is required."); return; }
    if (!answer.trim()) { setError("Answer is required."); return; }
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    if (editing) {
      await fetch(`/api/faq/${editing.id}`, { method: "PUT", headers, body: JSON.stringify({ question, answer, order: Number(order) }) });
    } else {
      await fetch("/api/faq", { method: "POST", headers, body: JSON.stringify({ question, answer, order: Number(order) }) });
    }
    await refetch();
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    const token = localStorage.getItem("token");
    await fetch(`/api/faq/${id}`, { method: "DELETE", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    await refetch();
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Manage FAQ</h2>
        <Button className="rounded-xl gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Add FAQ</Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <Input placeholder="Question" value={question} onChange={e => { setQuestion(e.target.value); setError(""); }} />
            <textarea
              placeholder="Answer"
              value={answer}
              onChange={e => { setAnswer(e.target.value); setError(""); }}
              rows={4}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Input placeholder="Order (number)" type="number" value={order} onChange={e => setOrder(e.target.value)} />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full rounded-xl">{editing ? "Update FAQ" : "Save FAQ"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-2xl shadow-sm border-none overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
            <tr>
              <th className="p-4 font-medium w-8">#</th>
              <th className="p-4 font-medium">Question</th>
              <th className="p-4 font-medium">Answer</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center">Loading...</td></tr>
            ) : faqs.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No FAQ items yet</td></tr>
            ) : faqs.map((faq: any) => (
              <tr key={faq.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-muted-foreground text-sm">{faq.order}</td>
                <td className="p-4 font-medium max-w-[200px]">{faq.question}</td>
                <td className="p-4 text-muted-foreground text-sm max-w-[300px] truncate">{faq.answer}</td>
                <td className="p-4 text-right flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(faq)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(faq.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
