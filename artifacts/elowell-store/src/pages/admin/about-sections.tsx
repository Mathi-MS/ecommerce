import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SimpleImageUpload } from "@/components/ui/simple-image-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useListAboutSections, useCreateAboutSection, useUpdateAboutSection, useDeleteAboutSection } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, X, Edit, Trash2, Eye, EyeOff } from "lucide-react";

interface AboutForm {
  title: string;
  description: string;
  imageUrl: string;
  features: string[];
  buttonText: string;
  buttonLink: string;
  order: string;
  isActive: boolean;
}

export default function AboutSectionsAdmin() {
  const { data: aboutSections, isLoading, refetch } = useListAboutSections();
  const { mutate: createAbout, isPending: isCreating } = useCreateAboutSection();
  const { mutate: updateAbout, isPending: isUpdating } = useUpdateAboutSection();
  const { mutate: deleteAbout, isPending: isDeleting } = useDeleteAboutSection();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [formData, setFormData] = useState<AboutForm>({
    title: "",
    description: "",
    imageUrl: "",
    features: [""],
    buttonText: "",
    buttonLink: "",
    order: "0",
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      features: [""],
      buttonText: "",
      buttonLink: "",
      order: "0",
      isActive: true,
    });
    setEditingSection(null);
  };

  const openCreateDialog = () => {
    resetForm();
    const nextOrder = String((aboutSections?.length ?? 0) + 1);
    setFormData(prev => ({ ...prev, order: nextOrder }));
    setIsDialogOpen(true);
  };

  const openEditDialog = (section: any) => {
    setFormData({
      title: section.title,
      description: section.description,
      imageUrl: section.imageUrl,
      features: section.features?.length ? section.features : [""],
      buttonText: section.buttonText,
      buttonLink: section.buttonLink,
      order: String(section.order || 0),
      isActive: section.isActive,
    });
    setEditingSection(section);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredFeatures = formData.features.filter(feature => feature.trim() !== "");
    
    const data = {
      ...formData,
      features: filteredFeatures,
      order: Number(formData.order) || 0,
    };

    if (editingSection) {
      updateAbout(
        { id: editingSection.id, data },
        {
          onSuccess: () => {
            toast.success("About section updated successfully!");
            setIsDialogOpen(false);
            resetForm();
            refetch();
          },
          onError: (error) => {
            toast.error("Failed to update about section");
            console.error(error);
          },
        }
      );
    } else {
      createAbout(
        { data },
        {
          onSuccess: () => {
            toast.success("About section created successfully!");
            setIsDialogOpen(false);
            resetForm();
            refetch();
          },
          onError: (error) => {
            toast.error("Failed to create about section");
            console.error(error);
          },
        }
      );
    }
  };

  const handleDelete = (section: any) => {
    if (!confirm(`Are you sure you want to delete "${section.title}"?`)) {
      return;
    }

    deleteAbout(
      { id: section.id },
      {
        onSuccess: () => {
          toast.success("About section deleted successfully!");
          refetch();
        },
        onError: (error) => {
          toast.error("Failed to delete about section");
          console.error(error);
        },
      }
    );
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">About Sections</h1>
            <p className="text-muted-foreground">Manage multiple about sections on your homepage</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSection ? "Edit About Section" : "Create About Section"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Section title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <SimpleImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                  label="Section Image"
                />

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Section description"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Features</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="e.g., Cruelty-free & Vegan"
                        />
                        {formData.features.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFeature(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buttonText">Button Text</Label>
                    <Input
                      id="buttonText"
                      value={formData.buttonText}
                      onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                      placeholder="Learn More"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonLink">Button Link</Label>
                    <Input
                      id="buttonLink"
                      value={formData.buttonLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, buttonLink: e.target.value }))}
                      placeholder="/products"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Active</Label>
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
                    disabled={isCreating || isUpdating}
                    className="flex-1"
                  >
                    {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingSection ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {aboutSections && aboutSections.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold mb-4">No about sections yet</h2>
              <p className="text-muted-foreground mb-8">
                Create your first about section to showcase on the homepage.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Section
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {aboutSections?.map((section) => (
              <Card key={section.id}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="w-32 h-24 bg-muted flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={section.imageUrl}
                        alt={section.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold">{section.title}</h3>
                            <div className="flex items-center gap-2 ml-auto">
                              {section.isActive ? (
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
                              <span className="text-xs text-muted-foreground">Order: {section.order}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {section.description}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {section.features.slice(0, 3).map((feature, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                                {feature}
                              </span>
                            ))}
                            {section.features.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{section.features.length - 3} more</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(section)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(section)}
                            disabled={isDeleting}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}