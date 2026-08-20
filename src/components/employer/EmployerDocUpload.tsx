import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const BUCKET = "employer-documents";

interface Props {
  label: string;
  field: string;
  accept?: string;
  value?: string | null;
  required?: boolean;
  disabled?: boolean;
  onChange: (path: string | null) => void;
  error?: string;
}

export default function EmployerDocUpload({
  label,
  field,
  accept = "application/pdf,image/jpeg,image/png",
  value,
  required,
  disabled,
  onChange,
  error,
}: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!user) {
      toast.error("Please create your account before uploading documents.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${user.id}/${field}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
      setPreviewUrl(signed?.signedUrl || null);
      onChange(path);
      toast.success(`${label} uploaded`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setPreviewUrl(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const hasFile = !!value;

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required ? " *" : ""}
      </Label>
      <div
        className={`rounded-lg border-2 border-dashed p-4 transition-colors ${
          hasFile ? "border-success/40 bg-success/5" : error ? "border-destructive/50" : "border-border"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        {hasFile ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              <span className="truncate">Uploaded</span>
              {previewUrl && (
                <a href={previewUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                  Preview
                </a>
              )}
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={clear} disabled={disabled}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? "Uploading…" : "Choose file"}
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
