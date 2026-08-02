import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const buckets = [
    "avatars",
    "worker-documents",
    "worker-videos",
    "partner-documents",
    "partner-worker-media",
    "assessment-evidence",
  ];
  const result: Record<string, number> = {};

  async function walk(bucket: string, prefix = ""): Promise<string[]> {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error || !data) return [];
    const files: string[] = [];
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) files.push(...(await walk(bucket, path)));
      else files.push(path);
    }
    return files;
  }

  for (const bucket of buckets) {
    const files = await walk(bucket);
    if (files.length) await admin.storage.from(bucket).remove(files);
    result[bucket] = files.length;
  }

  return new Response(JSON.stringify({ deleted: result }), {
    headers: { "Content-Type": "application/json" },
  });
});
