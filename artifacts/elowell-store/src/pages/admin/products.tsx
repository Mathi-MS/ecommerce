import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListProducts, useCreateProduct, useDeleteProduct } from "@workspace/api-client-react";
import { useApiOptions } from "@/store/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Plus, Edit } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminProducts() {
  const apiOpts = useApiOptions();
  const { data: productsData, isLoading } = useListProducts(undefined, apiOpts);
  const createMutation = useCreateProduct(apiOpts);
  const deleteMutation = useDeleteProduct(apiOpts);
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '', description: '', shortDescription: '', price: 0, stock: 0, featured: false, images: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        ...formData,
        images: [formData.images || 'https://images.unsplash.com/photo-1611078449911-3771bd9a691b?w=800&q=80'],
      }
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      }
    });
  };

  const handleDelete = (id: number) => {
    if(confirm("Are you sure?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/products"] })
      });
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Manage Products</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2"><Plus className="h-4 w-4"/> Add Product</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <Input placeholder="Product Name" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
              <Input placeholder="Short Description" required value={formData.shortDescription} onChange={e=>setFormData({...formData, shortDescription: e.target.value})} />
              <textarea placeholder="Full Description" required className="w-full flex min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 text-sm" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Input type="number" placeholder="Price" required step="0.01" onChange={e=>setFormData({...formData, price: parseFloat(e.target.value)})} />
                <Input type="number" placeholder="Stock" required onChange={e=>setFormData({...formData, stock: parseInt(e.target.value)})} />
              </div>
              <Input placeholder="Image URL" value={formData.images} onChange={e=>setFormData({...formData, images: e.target.value})} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.featured} onChange={e=>setFormData({...formData, featured: e.target.checked})} className="rounded text-primary" /> Featured
              </label>
              <Button type="submit" className="w-full rounded-xl" disabled={createMutation.isPending}>Save Product</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border-none overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
            <tr>
              <th className="p-4 font-medium w-16">Img</th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Price</th>
              <th className="p-4 font-medium">Stock</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr> : 
             productsData?.products?.map(product => (
              <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4"><img src={product.images[0]} alt="" className="w-10 h-10 rounded object-cover" /></td>
                <td className="p-4 font-medium">{product.name}</td>
                <td className="p-4">${product.price.toFixed(2)}</td>
                <td className="p-4">{product.stock}</td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4"/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
