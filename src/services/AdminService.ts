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
  jobData: Record<string, unknown>,
  skills?: string[]
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("admin_update_job", {
    p_job_id: jobId,
    p_patch: jobData as never,
    p_skills: skills ?? null,
  });
  if (!error) return { error: null };

  const { error: jobError } = await supabase.from("jobs").update(jobData as never).eq("id", jobId);
  if (jobError) return { error: formatError(jobError, "Failed to update job") };

  if (skills) {
    const { error: deleteError } = await supabase.from("job_skills").delete().eq("job_id", jobId);
    if (deleteError) return { error: formatError(deleteError, "Failed to update job skills") };
    if (skills.length > 0) {
      const { error: skillsError } = await supabase.from("job_skills").insert(
        skills.map((skill_name) => ({ job_id: jobId, skill_name }))
      );
      if (skillsError) return { error: formatError(skillsError, "Failed to update job skills") };
    }
  }

  return { error: null };
}

export async function adminCreateJob(
  employerId: string,
  jobData: Record<string, unknown>,
  skills?: string[]
): Promise<{ data: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc("admin_create_job", {
    p_employer_id: employerId,
    p_patch: jobData as never,
    p_skills: skills ?? null,
  });
  if (!error) return { data: data as string, error: null };

  const { data: userData } = await supabase.auth.getUser();
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      ...jobData,
      employer_id: employerId,
      posted_by_role: "admin",
      created_by: userData.user?.id ?? null,
    } as never)
    .select("id")
    .single();
  if (jobError) return { data: null, error: formatError(jobError, "Failed to create job") };

  if (skills && skills.length > 0) {
    const { error: skillsError } = await supabase.from("job_skills").insert(
      skills.map((skill_name) => ({ job_id: job.id, skill_name }))
    );
    if (skillsError) return { data: job.id, error: formatError(skillsError, "Job created but skills failed to save") };
  }

  return { data: job.id, error: null };
}
