import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleImageUpload } from "@/components/ui/simple-image-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useListHomeSections, useCreateHomeSection, useUpdateHomeSection, useDeleteHomeSection, useListCategories, useListProducts } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, X, Edit, Trash2, Eye, EyeOff, Package, Info, Grid, Star } from "lucide-react";

interface HomeSectionForm {
  type: 'about' | 'featured-products';
  title: string;
  subtitle: string;
  order: string;
  isActive: boolean;
  config: {
    // About fields
    description?: string;
    imageUrl?: string;
    features?: string[];
    buttonText?: string;
    buttonLink?: string;
    
    // Featured products fields
    productLimit?: string;
    showFeatured?: boolean;
    category?: string;
    selectedProductIds?: string[];
    viewAllText?: string;
    viewAllLink?: string;
  };
}

const sectionTypes = [
  { value: 'about', label: 'About Section', icon: Info },
  { value: 'featured-products', label: 'Featured Products', icon: Star },
];

export default function HomeSectionsAdmin() {
  const { data: sections, isLoading, refetch } = useListHomeSections();
  const { data: categories } = useListCategories();
  const { data: productsData } = useListProducts({ limit: 100 }); // Get all products for selection
  const { mutate: createSection, isPending: isCreating } = useCreateHomeSection();
  const { mutate: updateSection, isPending: isUpdating } = useUpdateHomeSection();
  const { mutate: deleteSection, isPending: isDeleting } = useDeleteHomeSection();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [formData, setFormData] = useState<HomeSectionForm>({
    type: 'featured-products',
    title: "",
    subtitle: "",
    order: "0",
    isActive: true,
    config: {
      features: [""],
      productLimit: "4",
      showFeatured: true,
      selectedProductIds: [],
      viewAllText: "View All",
      viewAllLink: "/products"
    }
  });

  const resetForm = () => {
    setFormData({
      type: 'featured-products',
      title: "",
      subtitle: "",
      order: "0",
      isActive: true,
      config: {
        features: [""],
        productLimit: "4",
        showFeatured: true,
        selectedProductIds: [],
        viewAllText: "View All",
        viewAllLink: "/products"
      }
    });
    setEditingSection(null);
  };

  const openCreateDialog = () => {
    resetForm();
    const nextOrder = String((sections?.length ?? 0) + 1);
    setFormData(prev => ({ ...prev, order: nextOrder }));
    setIsDialogOpen(true);
  };

  const openEditDialog = (section: any) => {
    console.log('Editing section:', section); // Debug log
    setFormData({
      type: section.type,
      title: section.title,
      subtitle: section.subtitle || "",
      order: String(section.order || 0),
      isActive: section.isActive,
      config: {
        ...section.config,
        features: section.config?.features?.length ? section.config.features : [""],
        productLimit: String(section.config?.productLimit || 4),
        selectedProductIds: section.config?.selectedProductIds || [],
      }
    });
    setEditingSection(section);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let config = { ...formData.config };
    
    if (formData.type === 'about') {
      config.features = formData.config.features?.filter(f => f.trim()) || [];
    } else if (formData.type === 'featured-products') {
      config.productLimit = Number(formData.config.productLimit) || 4;
    }

    const newOrder = Number(formData.order) || 0;
    
    // Auto-reorder logic: if setting order to an existing position, shift others
    const updatedSections = sections?.map(section => {
      const sectionId = section._id || section.id;
      const editingSectionId = editingSection?._id || editingSection?.id;
      
      // Skip the section we're currently editing
      if (editingSectionId && sectionId === editingSectionId) {
        return section;
      }
      
      // If another section has the same order, increment it
      if (section.order >= newOrder) {
        return { ...section, order: section.order + 1 };
      }
      
      return section;
    }) || [];

    const data = {
      type: formData.type,
      title: formData.title,
      subtitle: formData.type === 'featured-products' ? formData.subtitle || undefined : undefined,
      order: newOrder,
      isActive: formData.isActive,
      config
    };

    // Function to update other sections' orders
    const updateOtherSections = async () => {
      for (const section of updatedSections) {
        const sectionId = section._id || section.id;
        const editingSectionId = editingSection?._id || editingSection?.id;
        
        // Skip the section we're editing and sections that don't need reordering
        if ((editingSectionId && sectionId === editingSectionId) || section.order < newOrder) {
          continue;
        }
        
        try {
          await new Promise((resolve, reject) => {
            updateSection(
              { 
                id: sectionId, 
                data: { 
                  ...section, 
                  order: section.order >= newOrder ? section.order + 1 : section.order 
                } 
              },
              {
                onSuccess: resolve,
                onError: reject,
              }
            );
          });
        } catch (error) {
          console.error('Failed to reorder section:', error);
        }
      }
    };

    if (editingSection) {
      const sectionId = editingSection._id || editingSection.id;
      console.log('Updating section with ID:', sectionId);
      
      updateSection(
        { id: sectionId, data },
        {
          onSuccess: async () => {
            // Update other sections' orders after successful update
            await updateOtherSections();
            toast.success("Section updated successfully!");
            setIsDialogOpen(false);
            resetForm();
            refetch();
          },
          onError: (error) => {
            toast.error("Failed to update section");
            console.error('Update error:', error);
          },
        }
      );
    } else {
      createSection(
        { data },
        {
          onSuccess: async () => {
            // Update other sections' orders after successful creation
            await updateOtherSections();
            toast.success("Section created successfully!");
            setIsDialogOpen(false);
            resetForm();
            refetch();
          },
          onError: (error) => {
            toast.error("Failed to create section");
            console.error(error);
          },
        }
      );
    }
  };

  const handleDelete = (section: any) => {
    console.log('Deleting section:', section); // Debug log
    if (!confirm(`Are you sure you want to delete "${section.title}"?`)) {
      return;
    }

    const sectionId = section._id || section.id;
    console.log('Using section ID:', sectionId); // Debug log
    
    deleteSection(
      { id: sectionId },
      {
        onSuccess: () => {
          toast.success("Section deleted successfully!");
          refetch();
        },
        onError: (error) => {
          toast.error("Failed to delete section");
          console.error('Delete error:', error);
        },
      }
    );
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        features: [...(prev.config.features || []), ""]
      }
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        features: prev.config.features?.filter((_, i) => i !== index) || []
      }
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        features: prev.config.features?.map((feature, i) => i === index ? value : feature) || []
      }
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
            <h1 className="text-3xl font-bold">Home Sections</h1>
            <p className="text-muted-foreground">Manage dynamic sections on your homepage</p>
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
                  {editingSection ? "Edit Section" : "Create Section"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Section Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionTypes.map(type => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
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

                {formData.type === 'featured-products' && (
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="Section subtitle (optional)"
                    />
                  </div>
                )}

                {/* About Section Fields */}
                {formData.type === 'about' && (
                  <>
                    <SimpleImageUpload
                      value={formData.config.imageUrl || ""}
                      onChange={(url) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config, imageUrl: url }
                      }))}
                      label="Section Image"
                    />

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.config.description || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          config: { ...prev.config, description: e.target.value }
                        }))}
                        placeholder="Section description"
                        rows={4}
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
                        {formData.config.features?.map((feature, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={feature}
                              onChange={(e) => updateFeature(index, e.target.value)}
                              placeholder="e.g., Cruelty-free & Vegan"
                            />
                            {(formData.config.features?.length || 0) > 1 && (
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
                          value={formData.config.buttonText || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            config: { ...prev.config, buttonText: e.target.value }
                          }))}
                          placeholder="Learn More"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="buttonLink">Button Link</Label>
                        <Input
                          id="buttonLink"
                          value={formData.config.buttonLink || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            config: { ...prev.config, buttonLink: e.target.value }
                          }))}
                          placeholder="/products"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Featured Products Fields */}
                {formData.type === 'featured-products' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="productLimit">Product Limit</Label>
                        <Input
                          id="productLimit"
                          type="number"
                          value={formData.config.productLimit || "4"}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            config: { ...prev.config, productLimit: e.target.value }
                          }))}
                          placeholder="4"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category Filter</Label>
                        <Select
                          value={formData.config.category || "all"}
                          onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            config: { ...prev.config, category: value === 'all' ? undefined : value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {categories?.map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.slug}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="viewAllText">View All Text</Label>
                        <Input
                          id="viewAllText"
                          value={formData.config.viewAllText || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            config: { ...prev.config, viewAllText: e.target.value }
                          }))}
                          placeholder="View All"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="viewAllLink">View All Link</Label>
                        <Input
                          id="viewAllLink"
                          value={formData.config.viewAllLink || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            config: { ...prev.config, viewAllLink: e.target.value }
                          }))}
                          placeholder="/products"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showFeatured"
                        checked={formData.config.showFeatured !== false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          config: { ...prev.config, showFeatured: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      <Label htmlFor="showFeatured">Show only featured products</Label>
                    </div>

                    {/* Product Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Select Specific Products (Optional)</Label>
                        <span className="text-xs text-muted-foreground">
                          {formData.config.selectedProductIds?.length || 0}/4 selected
                        </span>
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                        {productsData?.products?.map((product: any) => {
                          const isSelected = formData.config.selectedProductIds?.includes(product.id) || false;
                          const selectedCount = formData.config.selectedProductIds?.length || 0;
                          const canSelect = isSelected || selectedCount < 4;
                          
                          return (
                            <div key={product.id} className={`flex items-center space-x-2 ${!canSelect ? 'opacity-50' : ''}`}>
                              <input
                                type="checkbox"
                                id={`product-${product.id}`}
                                checked={isSelected}
                                disabled={!canSelect}
                                onChange={(e) => {
                                  const currentIds = formData.config.selectedProductIds || [];
                                  const newIds = e.target.checked
                                    ? [...currentIds, product.id]
                                    : currentIds.filter(id => id !== product.id);
                                  setFormData(prev => ({
                                    ...prev,
                                    config: { ...prev.config, selectedProductIds: newIds }
                                  }));
                                }}
                                className="rounded"
                              />
                              <label htmlFor={`product-${product.id}`} className={`flex items-center gap-2 cursor-pointer flex-1 ${!canSelect ? 'cursor-not-allowed' : ''}`}>
                                <img 
                                  src={product.mainImage || product.images?.[0]} 
                                  alt={product.name}
                                  className="w-8 h-8 rounded object-cover bg-muted"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{product.name}</div>
                                  <div className="text-xs text-muted-foreground">₹{product.price}</div>
                                </div>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Maximum 4 products can be selected. If products are selected, only these will be shown.
                        Leave empty to use featured/category filters.
                      </p>
                    </div>
                  </>
                )}

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

        {sections && sections.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold mb-4">No sections yet</h2>
              <p className="text-muted-foreground mb-8">
                Create your first section to customize your homepage.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Section
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {sections?.map((section) => {
              const sectionType = sectionTypes.find(t => t.value === section.type);
              const Icon = sectionType?.icon || Package;
              
              return (
                <Card key={section._id || section.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="h-5 w-5 text-primary" />
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
                        <p className="text-sm text-muted-foreground mb-2">
                          {sectionType?.label}{section.type === 'featured-products' && section.subtitle ? ` • ${section.subtitle}` : ''}
                        </p>
                        <div className="flex gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                            {section.type}
                          </span>
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}