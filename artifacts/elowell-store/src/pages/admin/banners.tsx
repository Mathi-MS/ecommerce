import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Image, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface BannerForm {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  button1Text: string;
  button1Link: string;
  button2Text: string;
  button2Link: string;
  order: string;
  isActive: boolean;
}

export default function AdminBanners() {
  const { data: banners, isLoading, refetch } = useListBanners();
  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const deleteMutation = useDeleteBanner();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [formData, setFormData] = useState<BannerForm>({
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    button1Text: "",
    button1Link: "",
    button2Text: "",
    button2Link: "",
    order: "0",
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      imageUrl: "",
      button1Text: "",
      button1Link: "",
      button2Text: "",
      button2Link: "",
      order: "0",
      isActive: true,
    });
    setEditingBanner(null);
  };

  const openCreateDialog = () => {
    resetForm();
    const nextOrder = String((banners?.length ?? 0) + 1);
    setFormData(prev => ({ ...prev, order: nextOrder }));
    setIsDialogOpen(true);
  };

  const openEditDialog = (banner: any) => {
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      description: banner.description,
      imageUrl: banner.imageUrl,
      button1Text: banner.button1Text || "",
      button1Link: banner.button1Link || "",
      button2Text: banner.button2Text || "",
      button2Link: banner.button2Link || "",
      order: String(banner.order),
      isActive: banner.isActive,
    });
    setEditingBanner(banner);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.imageUrl) {
      toast({
        title: "Error",
        description: "Title, description, and image are required",
        variant: "destructive",
      });
      return;
    }

    const data = {
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim() || undefined,
      description: formData.description.trim(),
      imageUrl: formData.imageUrl,
      button1Text: formData.button1Text.trim() || undefined,
      button1Link: formData.button1Link.trim() || undefined,
      button2Text: formData.button2Text.trim() || undefined,
      button2Link: formData.button2Link.trim() || undefined,
      order: Number(formData.order) || 0,
      isActive: formData.isActive,
    };

    try {
      if (editingBanner) {
        await updateMutation.mutate(
          { id: editingBanner.id, data },
          {
            onSuccess: () => {
              toast({
                title: "Success",
                description: "Banner updated successfully",
              });
              setIsDialogOpen(false);
              resetForm();
              refetch();
            },
            onError: (error: any) => {
              toast({
                title: "Error",
                description: error.message || "Failed to update banner",
                variant: "destructive",
              });
            },
          }
        );
      } else {
        await createMutation.mutate(
          { data },
          {
            onSuccess: () => {
              toast({
                title: "Success",
                description: "Banner created successfully",
              });
              setIsDialogOpen(false);
              resetForm();
              refetch();
            },
            onError: (error: any) => {
              toast({
                title: "Error",
                description: error.message || "Failed to create banner",
                variant: "destructive",
              });
            },
          }
        );
      }
    } catch (error) {
      // Error already handled in mutation callbacks
    }
  };

  const handleDelete = async (banner: any) => {
    if (!confirm(`Are you sure you want to delete "${banner.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteMutation.mutate(
        { id: banner.id },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Banner deleted successfully",
            });
            refetch();
          },
          onError: (error: any) => {
            toast({
              title: "Error",
              description: error.message || "Failed to delete banner",
              variant: "destructive",
            });
          },
        }
      );
    } catch (error) {
      // Error already handled in mutation callback
    }
  };

  if (isLoading) return <AdminLayout>Loading banners...</AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Banners</h1>
          <p className="text-muted-foreground mt-2">Manage homepage carousel banners</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? "Edit Banner" : "Create Banner"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter banner title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Enter banner subtitle"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter banner description"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  label="Banner Image *"
                  endpoint="/api/products/upload"
                  aspectRatio="aspect-[16/9]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="button1Text">Button 1 Text</Label>
                  <Input
                    id="button1Text"
                    value={formData.button1Text}
                    onChange={(e) => setFormData({ ...formData, button1Text: e.target.value })}
                    placeholder="e.g., Shop Now"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button1Link">Button 1 Link</Label>
                  <Input
                    id="button1Link"
                    value={formData.button1Link}
                    onChange={(e) => setFormData({ ...formData, button1Link: e.target.value })}
                    placeholder="e.g., /products"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="button2Text">Button 2 Text</Label>
                  <Input
                    id="button2Text"
                    value={formData.button2Text}
                    onChange={(e) => setFormData({ ...formData, button2Text: e.target.value })}
                    placeholder="e.g., Learn More"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button2Link">Button 2 Link</Label>
                  <Input
                    id="button2Link"
                    value={formData.button2Link}
                    onChange={(e) => setFormData({ ...formData, button2Link: e.target.value })}
                    placeholder="e.g., /about"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingBanner
                    ? "Update"
                    : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {banners.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/50 p-12 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted text-muted-foreground mb-6">
            <Image className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">No banners yet</h2>
          <p className="text-muted-foreground mb-8">
            Create your first banner to showcase on the homepage.
          </p>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Add First Banner
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
              <div className="flex">
                <div className="w-48 h-32 bg-muted flex-shrink-0">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold">{banner.title}</h3>
                        {banner.subtitle && (
                          <span className="text-sm text-muted-foreground">• {banner.subtitle}</span>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                          {banner.isActive ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <Eye className="h-4 w-4" />
                              <span className="text-xs">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <EyeOff className="h-4 w-4" />
                              <span className="text-xs">Inactive</span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">Order: {banner.order}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {banner.description}
                      </p>
                      <div className="flex gap-2">
                        {banner.button1Text && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                            {banner.button1Text}
                          </span>
                        )}
                        {banner.button2Text && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary/10 text-secondary text-xs">
                            {banner.button2Text}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(banner)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(banner)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}