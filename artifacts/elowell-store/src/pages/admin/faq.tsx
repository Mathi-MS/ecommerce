import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useListFaq, useCreateFaqItem } from "@workspace/api-client-react";
import { useApiOptions } from "@/store/session";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function AdminFaq() {
  const { toast } = useToast();
  const apiOpts = useApiOptions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);

  const [formData, setFormData] = useState({ question: '', answer: '', order: 1 });

  const { data: faqs, refetch } = useListFaq(apiOpts);
  const createMutation = useCreateFaqItem(apiOpts);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFaq) {
        toast({ title: "Info", description: "Update not supported via API" });
      } else {
        await createMutation.mutateAsync({ data: formData });
        toast({ title: "Success", description: "FAQ created successfully" });
      }
      setDialogOpen(false);
      setEditingFaq(null);
      setFormData({ question: '', answer: '', order: 1 });
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to save FAQ", variant: "destructive" });
    }
  };

  const handleEdit = (faq: any) => {
    setEditingFaq(faq);
    setFormData({ question: faq.question, answer: faq.answer, order: faq.order || 1 });
    setDialogOpen(true);
  };

  const handleDelete = async (_id: string) => {
    toast({ title: "Info", description: "Delete not supported via API" });
  };

  const sortedFaqs = faqs?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">FAQ Management</h1>
            <p className="text-muted-foreground">Manage frequently asked questions</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingFaq(null); setFormData({ question: '', answer: '', order: (faqs?.length || 0) + 1 }); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Question</label>
                  <Input value={formData.question} onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))} placeholder="Enter the question" required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Answer</label>
                  <Textarea value={formData.answer} onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))} placeholder="Enter the answer" rows={4} required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Display Order</label>
                  <Input type="number" value={formData.order} onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))} min={1} required />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Saving...' : (editingFaq ? 'Update' : 'Create')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {sortedFaqs?.map((faq: any, index: number) => (
            <Card key={faq.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{faq.answer}</p>
                    <p className="text-xs text-muted-foreground">Order: {faq.order} &bull; Created: {new Date(faq.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(faq)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(faq.id)} disabled={false}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {!faqs?.length && (
            <Card><CardContent className="p-12 text-center"><p className="text-muted-foreground">No FAQs found. Create your first FAQ to get started.</p></CardContent></Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
