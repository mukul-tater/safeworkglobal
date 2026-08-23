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
const MAX_BYTES = 8 * 1024 * 1024;

function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return /failed to fetch|load failed|networkerror|network request failed|fetch failed/i.test(message);
}

export async function uploadPartnerDocFile(userId: string, field: string, file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("File must be under 8 MB");
  }
  const ext = (file.name.split(".").pop() || "bin").replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const path = `${userId}/${field}-${Date.now()}.${ext}`;
  const contentType = file.type || mimeFromExt(ext);
  // ArrayBuffer uses the standard upload path (avoids resumable/TUS, which can
  // surface as a browser "Failed to fetch" on some networks).
  const body = await file.arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    upsert: true,
    contentType,
  });
  if (error) {
    if (isNetworkError(error)) {
      throw new Error("Could not upload the file. Try a smaller JPG or PDF and check your connection.");
    }
    throw new Error(error.message || "Upload failed");
  }
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

  const keepPending = (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error("File must be under 8 MB");
      return false;
    }
    if (!onPendingFile) return false;
    onPendingFile(file);
    toast.success(`${label} selected — it will upload when you continue`);
    return true;
  };

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error("File must be under 8 MB");
      return;
    }
    if (!user) {
      if (!keepPending(file)) toast.error("Sign in to upload this document");
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
      if (isNetworkError(e) && keepPending(file)) return;
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
    <div className="min-w-0 space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className={`min-w-0 overflow-hidden rounded-lg border-2 border-dashed p-3 transition-colors sm:p-4 ${hasFile ? "border-success bg-success/5" : "border-muted"}`}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {hasFile ? (
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              <span className="min-w-0 truncate">{value ? "Uploaded" : pendingFile?.name || "Selected"}</span>
              {previewUrl && (
                <a href={previewUrl} target="_blank" rel="noreferrer" className="shrink-0 text-xs text-primary underline">
                  Preview
                </a>
              )}
            </div>
            <Button type="button" size="sm" variant="ghost" className="shrink-0" onClick={clear}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 w-full min-w-0 whitespace-normal px-3 py-2 text-sm font-medium leading-snug"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Upload className="h-4 w-4 shrink-0" />}
            <span className="min-w-0 text-left">{uploading ? "Uploading…" : "Choose file"}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
