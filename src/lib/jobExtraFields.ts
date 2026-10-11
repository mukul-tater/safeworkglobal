import { supabase } from "@/integrations/supabase/client";

export type JobExtraValueType = "photo" | "text";

export type JobExtraField = {
  id: string;
  job_id: string;
  label: string;
  value_type: JobExtraValueType;
  sort_order: number;
};

export type JobExtraFieldDraft = {
  key: string;
  id?: string;
  label: string;
  valueType: JobExtraValueType;
};

export type JobApplicationAnswer = {
  id: string;
  application_id: string;
  field_id: string;
  text_value: string | null;
  file_path: string | null;
};

const PHOTO_BUCKET = "worker-documents";
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export function newJobExtraFieldDraft(): JobExtraFieldDraft {
  return {
    key: crypto.randomUUID(),
    label: "",
    valueType: "photo",
  };
}

export function draftsFromFields(fields: JobExtraField[]): JobExtraFieldDraft[] {
  return fields.map((field) => ({
    key: field.id,
    id: field.id,
    label: field.label,
    valueType: field.value_type,
  }));
}

export function validateJobExtraFieldDrafts(fields: JobExtraFieldDraft[]): string | null {
  const labels = new Set<string>();
  for (const field of fields) {
    const label = field.label.trim();
    if (!label) return "Each extra requirement needs a label, or remove the empty row";
    if (label.length > 120) return "A label must be 120 characters or fewer";
    const key = label.toLowerCase();
    if (labels.has(key)) return "Two requirements on the same job cannot share a label";
    labels.add(key);
    if (field.valueType !== "photo" && field.valueType !== "text") return "Choose photo or text";
  }
  return null;
}

export async function listJobExtraFields(jobId: string): Promise<JobExtraField[]> {
  const { data, error } = await supabase
    .from("job_extra_fields")
    .select("id, job_id, label, value_type, sort_order")
    .eq("job_id", jobId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as JobExtraField[];
}

export async function saveJobExtraFields(jobId: string, drafts: JobExtraFieldDraft[]): Promise<void> {
  const problem = validateJobExtraFieldDrafts(drafts);
  if (problem) throw new Error(problem);

  const existing = await listJobExtraFields(jobId);
  const keptIds = new Set(drafts.map((draft) => draft.id).filter((id): id is string => Boolean(id)));
  const removedIds = existing.filter((row) => !keptIds.has(row.id)).map((row) => row.id);

  if (removedIds.length > 0) {
    const { error } = await supabase.from("job_extra_fields").delete().in("id", removedIds);
    if (error) throw new Error(error.message);
  }

  for (let index = 0; index < drafts.length; index += 1) {
    const draft = drafts[index];
    const payload = {
      label: draft.label.trim(),
      value_type: draft.valueType,
      sort_order: index,
    };
    if (draft.id && existing.some((row) => row.id === draft.id)) {
      const { error } = await supabase.from("job_extra_fields").update(payload).eq("id", draft.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("job_extra_fields").insert({ ...payload, job_id: jobId });
      if (error) throw new Error(error.message);
    }
  }
}

function photoExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadJobExtraPhoto(opts: {
  workerUserId: string;
  jobId: string;
  fieldId: string;
  file: File;
}): Promise<string> {
  if (!opts.file.type.startsWith("image/")) {
    throw new Error("Upload a photo");
  }
  if (opts.file.size > MAX_PHOTO_BYTES) {
    throw new Error("Photo must be under 8 MB");
  }
  const path = `${opts.workerUserId}/job-extra/${opts.jobId}/${opts.fieldId}-${Date.now()}.${photoExtension(opts.file)}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, opts.file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message || "Photo upload failed");
  return path;
}

export async function saveJobApplicationAnswers(
  applicationId: string,
  answers: Array<{ fieldId: string; textValue?: string; filePath?: string }>,
): Promise<void> {
  if (answers.length === 0) return;
  const rows = answers.map((answer) => ({
    application_id: applicationId,
    field_id: answer.fieldId,
    text_value: answer.textValue ?? null,
    file_path: answer.filePath ?? null,
  }));
  const { error } = await supabase
    .from("job_application_answers")
    .upsert(rows, { onConflict: "application_id,field_id" });
  if (error) throw new Error(error.message);
}

export async function listJobApplicationAnswers(applicationId: string): Promise<JobApplicationAnswer[]> {
  const { data, error } = await supabase
    .from("job_application_answers")
    .select("id, application_id, field_id, text_value, file_path")
    .eq("application_id", applicationId);
  if (error) throw new Error(error.message);
  return (data ?? []) as JobApplicationAnswer[];
}

export async function signedJobExtraPhotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
