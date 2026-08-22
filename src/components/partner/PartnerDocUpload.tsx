import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  label: string;
  field: string;
  accept?: string;
  value?: string | null;
  onChange: (path: string | null) => void;
  pendingFile?: File | null;
  onPendingFile?: (file: File | null) => void;
  required?: boolean;
}

const BUCKET = "partner-documents";

export async function uploadPartnerDocFile(userId: string, field: string, file: File): Promise<string> {
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("File must be under 8 MB");
  }
  const ext = file.name.split(".").pop() || "bin";
  const path = `${userId}/${field}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

/** Uploads a single partner document directly to private storage and returns the object path. */
export default function PartnerDocUpload({
  label,
  field,
  accept = "image/*,application/pdf",
  value,
  onChange,
  pendingFile,
  onPendingFile,
  required,
}: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!user) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error("File must be under 8 MB");
        return;
      }
      onPendingFile?.(file);
      toast.success(`${label} selected — it will upload when you continue`);
      return;
    }
    setUploading(true);
    try {
      const path = await uploadPartnerDocFile(user.id, field, file);
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
      setPreviewUrl(signed?.signedUrl || null);
      onPendingFile?.(null);
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
    onPendingFile?.(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const hasFile = !!value || !!pendingFile;

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className={`border-2 border-dashed rounded-lg p-4 transition-colors ${hasFile ? "border-success bg-success/5" : "border-muted"}`}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {hasFile ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="truncate max-w-[200px]">{value ? "Uploaded" : pendingFile?.name || "Selected"}</span>
              {previewUrl && <a href={previewUrl} target="_blank" rel="noreferrer" className="text-primary underline text-xs">Preview</a>}
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={clear}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="w-full" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {uploading ? "Uploading…" : `Upload ${label}`}
          </Button>
        )}
      </div>
    </div>
  );
}