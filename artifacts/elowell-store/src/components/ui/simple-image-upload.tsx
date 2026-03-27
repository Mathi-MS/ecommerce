import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface SimpleImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function SimpleImageUpload({ value, onChange, label = "Image" }: SimpleImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/about/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: reader.result,
            filename: file.name,
          }),
        });
        const data = await response.json();
        onChange(`${import.meta.env.VITE_API_BASE_URL}${data.url}`);
        toast.success('Image uploaded');
      } catch (error) {
        toast.error('Upload failed');
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value && (
        <div className="relative w-48 h-32">
          <img src={value} alt="Preview" className="w-full h-full object-cover rounded border" />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0"
            onClick={() => onChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste URL"
          className="flex-1"
        />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />
    </div>
  );
}