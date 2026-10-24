import { SKILL_MEDIA_LINK_SECONDS } from '@/lib/workerSkillMedia';
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Download } from "lucide-react";

const BUCKETS = ["worker-documents", "worker-videos"] as const;
const SIGNED_URL_SECONDS = 600;

type MediaItem = { bucket: string; path: string; url: string; kind: "image" | "video" | "file" };

function kindOf(path: string): MediaItem["kind"] {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "webp", "gif", "heic"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "m4v"].includes(ext)) return "video";
  return "file";
}

function labelOf(path: string) {
  const parts = path.split("/");
  const file = parts[parts.length - 1].replace(/-\d{10,}(\.\w+)$/, "$1").replace(/^\d{10,}-/, "");
  const folder = parts.length > 2 ? parts[1] : "";
  return folder ? `${folder} · ${file}` : file;
}

async function listRecursive(bucket: string, prefix: string, depth = 0): Promise<string[]> {
  if (depth > 5) return [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 200 });
  if (error || !data) return [];
  const out: string[] = [];
  for (const entry of data) {
    const full = `${prefix}/${entry.name}`;
    if (entry.id === null) out.push(...(await listRecursive(bucket, full, depth + 1)));
    else if (entry.name !== ".emptyFolderPlaceholder") out.push(full);
  }
  return out;
}

export default function AdminUserMediaSection({ userId }: { userId: string }) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    (async () => {
      try {
        const all: MediaItem[] = [];
        for (const bucket of BUCKETS) {
          const paths = await listRecursive(bucket, userId);
          if (!paths.length) continue;
          const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, bucket === 'worker-videos' ? SKILL_MEDIA_LINK_SECONDS : SIGNED_URL_SECONDS);
          (data || []).forEach((s, i) => {
            if (s.signedUrl) all.push({ bucket, path: paths[i], url: s.signedUrl, kind: kindOf(paths[i]) });
          });
        }
        if (!cancelled) setItems(all);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Could not load media");
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="border-t pt-4">
      <h4 className="font-semibold mb-3 text-sm">Documents & Media</h4>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!items && !error && (
        <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
      )}
      {items && items.length === 0 && <p className="text-sm text-muted-foreground">No uploaded files.</p>}
      {items && items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {items.map((m) => (
            <div key={m.bucket + m.path} className="border rounded-md p-2 space-y-1">
              {m.kind === "image" && (
                <a href={m.url} target="_blank" rel="noreferrer">
                  <img src={m.url} alt={labelOf(m.path)} className="w-full h-28 object-cover rounded" loading="lazy" />
                </a>
              )}
              {m.kind === "video" && <video src={m.url} controls preload="metadata" className="w-full h-28 rounded bg-muted" />}
              {m.kind === "file" && (
                <div className="h-28 flex items-center justify-center bg-muted rounded"><FileText className="h-8 w-8 text-muted-foreground" /></div>
              )}
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs truncate" title={m.path}>{labelOf(m.path)}</p>
                <a href={m.url} target="_blank" rel="noreferrer" className="text-primary shrink-0" title="Open / download">
                  <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
