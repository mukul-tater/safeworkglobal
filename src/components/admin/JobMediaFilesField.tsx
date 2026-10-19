import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  assertJobMediaFile,
  deleteJobMediaUrl,
  uploadJobMediaFile,
  type JobMediaKind,
  type PendingJobMedia,
} from '@/lib/jobMediaUpload';

interface JobMediaFilesFieldProps {
  title: string;
  description: string;
  kind: JobMediaKind;
  accept: string;
  addLabel: string;
  jobId?: string | null;
  urls: string[];
  onChange: (urls: string[]) => void;
  pending: PendingJobMedia[];
  onPendingChange: (pending: PendingJobMedia[]) => void;
}

export default function JobMediaFilesField({
  title,
  description,
  kind,
  accept,
  addLabel,
  jobId,
  urls,
  onChange,
  pending,
  onPendingChange,
}: JobMediaFilesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const addFiles = async (list: FileList | null) => {
    const files = [...(list ?? [])];
    if (!files.length) return;
    if (inputRef.current) inputRef.current.value = '';

    const accepted: File[] = [];
    for (const file of files) {
      try {
        assertJobMediaFile(kind, file);
        accepted.push(file);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'That file cannot be added');
      }
    }
    if (!accepted.length) return;

    if (!jobId) {
      onPendingChange([
        ...pending,
        ...accepted.map((file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ]);
      return;
    }

    setUploading(true);
    const added: string[] = [];
    try {
      for (const file of accepted) {
        added.push(await uploadJobMediaFile(jobId, kind, file));
      }
      onChange([...urls, ...added]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
      if (added.length) onChange([...urls, ...added]);
    } finally {
      setUploading(false);
    }
  };

  const removeUrl = async (url: string) => {
    onChange(urls.filter((item) => item !== url));
    try {
      await deleteJobMediaUrl(url);
    } catch {
      /* The saved list no longer includes this file. */
    }
  };

  const removePending = (id: string) => {
    const item = pending.find((entry) => entry.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    onPendingChange(pending.filter((entry) => entry.id !== id));
  };

  const photos = kind === 'accommodation';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            className="sr-only"
            onChange={(event) => void addFiles(event.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {addLabel}
          </Button>
        </div>
        {(urls.length > 0 || pending.length > 0) && (
          <ul className={photos ? 'grid grid-cols-2 gap-3 sm:grid-cols-3' : 'space-y-2'}>
            {urls.map((url) => (
              <li key={url} className="relative overflow-hidden rounded-lg border border-border">
                {photos ? (
                  <img src={url} alt="" className="h-28 w-full object-cover bg-muted" />
                ) : (
                  <video src={url} className="h-28 w-full bg-muted" controls playsInline preload="metadata" />
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  aria-label="Remove file"
                  onClick={() => void removeUrl(url)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
            {pending.map((item) => (
              <li key={item.id} className="relative overflow-hidden rounded-lg border border-dashed border-border">
                {photos ? (
                  <img src={item.previewUrl} alt="" className="h-28 w-full object-cover bg-muted" />
                ) : (
                  <video src={item.previewUrl} className="h-28 w-full bg-muted" controls playsInline preload="metadata" />
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  aria-label="Remove file"
                  onClick={() => removePending(item.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
