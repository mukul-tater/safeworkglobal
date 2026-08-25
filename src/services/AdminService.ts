import { supabase } from "@/integrations/supabase/client";

type AppRole = "worker" | "employer" | "partner" | "agent" | "admin";

function formatError(error: { message?: string } | null, fallback: string): string {
  return error?.message || fallback;
}

export async function adminDeleteJob(jobId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("admin_delete_job", { p_job_id: jobId });
  if (!error) return { error: null };

  // Fallback if migration not yet applied
  const { error: appsError } = await supabase.from("job_applications").delete().eq("job_id", jobId);
  if (appsError) return { error: formatError(appsError, "Failed to delete job applications") };

  const { error: skillsError } = await supabase.from("job_skills").delete().eq("job_id", jobId);
  if (skillsError) return { error: formatError(skillsError, "Failed to delete job skills") };

  await supabase.from("saved_jobs").delete().eq("job_id", jobId);

  const { error: jobError } = await supabase.from("jobs").delete().eq("id", jobId);
  return { error: jobError ? formatError(jobError, "Failed to delete job") : null };
}

const USER_FILE_BUCKETS = [
  "avatars",
  "worker-documents",
  "worker-videos",
  "partner-documents",
  "partner-worker-media",
  "assessment-evidence",
  "employer-documents",
  "onboarding-documents",
] as const;

async function listStoragePrefix(bucket: string, prefix: string): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    offset: 0,
  });
  if (error || !data?.length) return [];

  const files: string[] = [];
  for (const entry of data) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (!entry.id) {
      files.push(...(await listStoragePrefix(bucket, path)));
    } else {
      files.push(path);
    }
  }
  return files;
}

async function removeUserStorageFiles(userId: string): Promise<void> {
  const prefixes = [userId, `contracts/${userId}`];
  for (const bucket of USER_FILE_BUCKETS) {
    for (const prefix of prefixes) {
      const files = await listStoragePrefix(bucket, prefix);
      for (let i = 0; i < files.length; i += 100) {
        const { error } = await supabase.storage.from(bucket).remove(files.slice(i, i + 100));
        if (error) {
          console.warn(`Failed to remove storage files from ${bucket}:`, error.message);
        }
      }
    }
  }
}

export async function adminDeleteUser(userId: string): Promise<{ error: string | null }> {
  await removeUserStorageFiles(userId);
  const { error } = await supabase.rpc("admin_delete_user", { p_user_id: userId });
  return { error: error ? formatError(error, "Failed to delete user") : null };
}

export async function adminSetUserRole(
  userId: string,
  role: AppRole
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("admin_set_user_role", {
    p_user_id: userId,
    p_role: role,
  });
  return { error: error ? formatError(error, "Failed to update role") : null };
}

export async function adminUpdateJob(
  jobId: string,
  jobData: Record<string, unknown>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("jobs").update(jobData as never).eq("id", jobId);
  return { error: error ? formatError(error, "Failed to update job") : null };
}
