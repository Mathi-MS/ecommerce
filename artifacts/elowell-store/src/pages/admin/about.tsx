import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SimpleImageUpload } from "@/components/ui/simple-image-upload";
import { useGetAboutSection, useUpdateAboutSection } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

export default function AboutAdmin() {
  const { data: aboutData, isLoading, refetch } = useGetAboutSection();
  const { mutate: updateAbout, isPending } = useUpdateAboutSection();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    features: [""],
    buttonText: "",
    buttonLink: "",
    isActive: true,
  });

  useEffect(() => {
    if (aboutData) {
      setFormData({
        title: aboutData.title || "",
        description: aboutData.description || "",
        imageUrl: aboutData.imageUrl || "",
        features: aboutData.features?.length ? aboutData.features : [""],
        buttonText: aboutData.buttonText || "",
        buttonLink: aboutData.buttonLink || "",
        isActive: aboutData.isActive ?? true,
      });
    }
  }, [aboutData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredFeatures = formData.features.filter(feature => feature.trim() !== "");
    
    updateAbout(
      {
        id: aboutData?.id || 'default',
        data: {
          ...formData,
          features: filteredFeatures,
        },
      },
      {
        onSuccess: () => {
          toast.success("About section updated successfully!");
          refetch();
        },
        onError: (error) => {
          toast.error("Failed to update about section");
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
        <div>
          <h1 className="text-3xl font-bold">About Section</h1>
          <p className="text-muted-foreground">Manage the about section content on your homepage</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>About Section Content</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Rooted in tradition, crafted for today."
                  required
                />
              </div>

              <SimpleImageUpload
                value={formData.imageUrl}
                onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                label="About Image"
              />

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Elowell began with a simple mission..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Features</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFeature}
                  >
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    value={formData.buttonText}
                    onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                    placeholder="Discover Our Process"
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

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update About Section
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {formData.imageUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-secondary/20 rounded-[2rem] transform translate-x-4 translate-y-4"></div>
                  <img 
                    src={formData.imageUrl} 
                    alt="About Preview" 
                    className="relative z-10 w-full h-auto rounded-[2rem] shadow-xl object-cover aspect-[4/3]"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-display mb-4 leading-tight">{formData.title}</h2>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {formData.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {formData.features.filter(f => f.trim()).map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm font-medium">
                        <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                          <div className="h-2 w-2 bg-white rounded-full" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button size="sm" className="rounded-xl">
                    {formData.buttonText}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}