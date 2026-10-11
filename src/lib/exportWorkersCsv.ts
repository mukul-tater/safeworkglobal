import { supabase } from "@/integrations/supabase/client";
import { DOCUMENT_EXPORT_TYPES, WORKER_EXPORT_FIELDS } from "@/lib/workerExportFields";

const SIGNED_URL_SECONDS = 60 * 60 * 24 * 7;
const CHUNK = 80;

export interface WorkerExportSource {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  joined: string;
  applicationCount: number;
  createdBy: string;
  profile: Record<string, unknown> | null;
}

interface VerificationRow {
  user_id: string;
  city: string | null;
  state: string | null;
  district: string | null;
  education_level: string | null;
  gender: string | null;
  kyc_verified_at: string | null;
  kyc_rejection_reason: string | null;
  stage: string;
  quiz_score: number | null;
  interview_status: string;
  interview_score: number | null;
  trade_test_status: string | null;
  medical_status: string | null;
  pdot_status: string;
  payment_status: string | null;
  payment_amount: number | null;
  bond_status: string | null;
  deploy_offer_status: string;
  deploy_visa_status: string;
  deploy_ticket_status: string;
  deploy_contract_status: string;
  deploy_insurance_status: string;
  deploy_emigration_status: string;
  deployed_at: string | null;
}

interface DocumentRow {
  worker_id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  verification_status: string | null;
  uploaded_at: string | null;
}

interface SkillRow {
  worker_id: string;
  skill_name: string;
  proficiency_level: string | null;
  years_of_experience: number | null;
}

interface ExperienceRow {
  worker_id: string;
  job_title: string;
  company_name: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean | null;
}

interface CertificationRow {
  worker_id: string;
  certification_name: string;
  issuing_organization: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
  verified: boolean | null;
}

interface MediaRow {
  worker_id: string;
  media_type: string;
  file_path: string;
  created_at: string | null;
}

function cell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (Array.isArray(value)) return value.map((item) => cell(item)).filter(Boolean).join(", ");
  return String(value);
}

function dateCell(value: unknown): string {
  const raw = cell(value);
  if (!raw) return "";
  const day = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : raw;
}

function profileCell(profile: Record<string, unknown> | null, key: string): string {
  return cell(profile?.[key]);
}

function profileDate(profile: Record<string, unknown> | null, key: string): string {
  return dateCell(profile?.[key]);
}

function sourceLabel(value: unknown): string {
  const raw = cell(value);
  if (!raw || raw === "organic") return "Self";
  if (raw === "emitra") return "E-Mitra";
  if (raw === "partner") return "Partner";
  return raw;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function documentStoragePath(urlOrPath: string): string {
  const marker = "/worker-documents/";
  const idx = urlOrPath.indexOf(marker);
  if (idx === -1) return urlOrPath.split("?")[0];
  let path = urlOrPath.substring(idx + marker.length);
  const query = path.indexOf("?");
  if (query !== -1) path = path.substring(0, query);
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

async function rowsIn<T>(
  run: (ids: string[]) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  ids: string[],
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { data, error } = await run(ids.slice(i, i + CHUNK));
    if (error) throw new Error(error.message);
    out.push(...(data || []));
  }
  return out;
}

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const id = key(row);
    const list = map.get(id);
    if (list) list.push(row);
    else map.set(id, [row]);
  }
  return map;
}

async function signPaths(bucket: string, paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  const unique = Array.from(new Set(paths.filter(Boolean)));
  for (let i = 0; i < unique.length; i += 40) {
    const slice = unique.slice(i, i + 40);
    const { data, error } = await supabase.storage.from(bucket).createSignedUrls(slice, SIGNED_URL_SECONDS);
    if (error || !data) continue;
    for (const row of data) {
      if (row.path && row.signedUrl) urls.set(row.path, row.signedUrl);
    }
  }
  return urls;
}

function documentCell(docs: DocumentRow[], types: string[], urls: Map<string, string>): string {
  return docs
    .filter((doc) => types.includes(doc.document_type))
    .map((doc) => {
      const url = urls.get(documentStoragePath(doc.file_url)) || "";
      return [doc.document_name, doc.verification_status || "pending", url].filter(Boolean).join(" — ");
    })
    .join(" | ");
}

function mediaCell(items: MediaRow[], kind: string, urls: Map<string, string>): string {
  return items
    .filter((item) => item.media_type === kind)
    .map((item) => {
      const url = urls.get(item.file_path) || "";
      if (!url) return "";
      const uploaded = dateCell(item.created_at);
      return uploaded ? `${url} (${uploaded})` : url;
    })
    .filter(Boolean)
    .join(" | ");
}

function skillsCell(rows: SkillRow[]): string {
  return rows
    .map((row) => {
      const details = [
        row.proficiency_level,
        row.years_of_experience != null ? `${row.years_of_experience} yrs` : "",
      ].filter(Boolean);
      return details.length ? `${row.skill_name} (${details.join(", ")})` : row.skill_name;
    })
    .join(" | ");
}

function experienceCell(rows: ExperienceRow[]): string {
  return rows
    .map((row) => {
      const place = [row.company_name, row.location].filter(Boolean).join(", ");
      const end = row.is_current ? "present" : dateCell(row.end_date) || "—";
      return `${row.job_title} at ${place}, ${dateCell(row.start_date)} to ${end}`;
    })
    .join(" | ");
}

function certificationCell(rows: CertificationRow[]): string {
  return rows
    .map((row) =>
      [
        row.certification_name,
        row.issuing_organization,
        row.issue_date ? `issued ${dateCell(row.issue_date)}` : "",
        row.expiry_date ? `expires ${dateCell(row.expiry_date)}` : "",
        row.credential_id ? `ID ${row.credential_id}` : "",
        row.verified ? "verified" : "not verified",
      ]
        .filter(Boolean)
        .join(", "),
    )
    .join(" | ");
}

function needs(fieldIds: string[], ids: string[]): boolean {
  return ids.some((id) => fieldIds.includes(id));
}

export async function buildWorkersCsv(workers: WorkerExportSource[], fieldIds: string[]): Promise<string> {
  const fields = WORKER_EXPORT_FIELDS.filter((field) => fieldIds.includes(field.id));
  if (!workers.length) throw new Error("No workers to export");
  if (!fields.length) throw new Error("Select at least one field");

  const ids = workers.map((worker) => worker.id);
  const selected = new Set(fieldIds);

  const wantVerification = needs(fieldIds, [
    "state",
    "district",
    "verification_city",
    "gender",
    "kyc_verified_at",
    "kyc_rejection_reason",
    "education_level",
    "stage",
    "quiz_score",
    "interview_status",
    "interview_score",
    "trade_test_status",
    "medical_status",
    "pdot_status",
    "payment_status",
    "payment_amount",
    "bond_status",
    "deploy_offer_status",
    "deploy_visa_status",
    "deploy_ticket_status",
    "deploy_contract_status",
    "deploy_insurance_status",
    "deploy_emigration_status",
    "deployed_at",
  ]);
  const documentFieldIds = Object.keys(DOCUMENT_EXPORT_TYPES).filter((id) => selected.has(id));
  const wantSkills = selected.has("skills_detail");
  const wantExperience = selected.has("work_history");
  const wantCertifications = selected.has("certifications");
  const wantMedia = selected.has("work_photos") || selected.has("work_videos");

  const [verifications, documents, skills, experience, certifications, media] = await Promise.all([
    wantVerification
      ? rowsIn<VerificationRow>(
          (slice) =>
            supabase
              .from("worker_verification")
              .select(
                "user_id, city, state, district, education_level, gender, kyc_verified_at, kyc_rejection_reason, stage, quiz_score, interview_status, interview_score, trade_test_status, medical_status, pdot_status, payment_status, payment_amount, bond_status, deploy_offer_status, deploy_visa_status, deploy_ticket_status, deploy_contract_status, deploy_insurance_status, deploy_emigration_status, deployed_at",
              )
              .in("user_id", slice),
          ids,
        )
      : Promise.resolve([] as VerificationRow[]),
    documentFieldIds.length
      ? rowsIn<DocumentRow>(
          (slice) =>
            supabase
              .from("worker_documents")
              .select("worker_id, document_type, document_name, file_url, verification_status, uploaded_at")
              .in("worker_id", slice)
              .in(
                "document_type",
                Array.from(new Set(documentFieldIds.flatMap((id) => DOCUMENT_EXPORT_TYPES[id]))),
              ),
          ids,
        )
      : Promise.resolve([] as DocumentRow[]),
    wantSkills
      ? rowsIn<SkillRow>(
          (slice) =>
            supabase
              .from("worker_skills")
              .select("worker_id, skill_name, proficiency_level, years_of_experience")
              .in("worker_id", slice),
          ids,
        )
      : Promise.resolve([] as SkillRow[]),
    wantExperience
      ? rowsIn<ExperienceRow>(
          (slice) =>
            supabase
              .from("work_experience")
              .select("worker_id, job_title, company_name, location, start_date, end_date, is_current")
              .in("worker_id", slice),
          ids,
        )
      : Promise.resolve([] as ExperienceRow[]),
    wantCertifications
      ? rowsIn<CertificationRow>(
          (slice) =>
            supabase
              .from("worker_certifications")
              .select("worker_id, certification_name, issuing_organization, issue_date, expiry_date, credential_id, verified")
              .in("worker_id", slice),
          ids,
        )
      : Promise.resolve([] as CertificationRow[]),
    wantMedia
      ? rowsIn<MediaRow>(
          (slice) =>
            supabase
              .from("worker_skill_media")
              .select("worker_id, media_type, file_path, created_at")
              .in("worker_id", slice),
          ids,
        )
      : Promise.resolve([] as MediaRow[]),
  ]);

  const documentUrls = await signPaths(
    "worker-documents",
    documents.map((doc) => documentStoragePath(doc.file_url)),
  );
  const mediaUrls = await signPaths(
    "worker-videos",
    media.map((item) => item.file_path),
  );

  const verificationByUser = new Map(verifications.map((row) => [row.user_id, row]));
  const documentsByWorker = groupBy(documents, (row) => row.worker_id);
  const skillsByWorker = groupBy(skills, (row) => row.worker_id);
  const experienceByWorker = groupBy(experience, (row) => row.worker_id);
  const certificationsByWorker = groupBy(certifications, (row) => row.worker_id);
  const mediaByWorker = groupBy(media, (row) => row.worker_id);

  const header = fields.map((field) => csvEscape(field.label)).join(",");
  const lines = workers.map((worker) => {
    const profile = worker.profile;
    const verification = verificationByUser.get(worker.id);
    const docs = documentsByWorker.get(worker.id) || [];
    const workerMedia = mediaByWorker.get(worker.id) || [];
    const values: Record<string, string> = {
      full_name: worker.fullName || "",
      phone: worker.phone || "",
      email: worker.email || "",
      gender: profileCell(profile, "gender") || cell(verification?.gender),
      nationality: profileCell(profile, "nationality"),
      country: profileCell(profile, "country"),
      current_city: profileCell(profile, "current_city"),
      current_location: profileCell(profile, "current_location"),
      state: cell(verification?.state),
      district: cell(verification?.district),
      verification_city: cell(verification?.city),
      aadhaar_number: profileCell(profile, "aadhaar_number"),
      aadhaar_last4: profileCell(profile, "aadhaar_last4"),
      pan_number: profileCell(profile, "pan_number"),
      passport_number: profileCell(profile, "passport_number"),
      passport_expiry: profileDate(profile, "passport_expiry"),
      has_passport: profileCell(profile, "has_passport"),
      has_visa: profileCell(profile, "has_visa"),
      visa_countries: profileCell(profile, "visa_countries"),
      kyc_status: profileCell(profile, "kyc_status"),
      kyc_submitted_at: profileDate(profile, "kyc_submitted_at"),
      kyc_verified_at: dateCell(verification?.kyc_verified_at),
      kyc_rejection_reason: cell(verification?.kyc_rejection_reason),
      face_selfie: documentCell(docs, DOCUMENT_EXPORT_TYPES.face_selfie, documentUrls),
      work_photos: mediaCell(workerMedia, "photo", mediaUrls),
      work_videos: mediaCell(workerMedia, "video", mediaUrls),
      bio: profileCell(profile, "bio"),
      primary_skill: profileCell(profile, "primary_skill"),
      secondary_skills: profileCell(profile, "secondary_skills"),
      skill_level: profileCell(profile, "skill_level"),
      years_of_experience: profileCell(profile, "years_of_experience"),
      experience_range: profileCell(profile, "experience_range"),
      languages: profileCell(profile, "languages"),
      skills_detail: skillsCell(skillsByWorker.get(worker.id) || []),
      work_history: experienceCell(experienceByWorker.get(worker.id) || []),
      certifications: certificationCell(certificationsByWorker.get(worker.id) || []),
      project_types_worked: profileCell(profile, "project_types_worked"),
      tenth_pass_confirmed: profileCell(profile, "tenth_pass_confirmed"),
      education_level: cell(verification?.education_level),
      availability: profileCell(profile, "availability"),
      open_to_relocation: profileCell(profile, "open_to_relocation"),
      preferred_work_city: profileCell(profile, "preferred_work_city"),
      preferred_shift: profileCell(profile, "preferred_shift"),
      primary_work_type: profileCell(profile, "primary_work_type"),
      work_preference: profileCell(profile, "work_preference"),
      expected_salary_min: profileCell(profile, "expected_salary_min"),
      expected_salary_max: profileCell(profile, "expected_salary_max"),
      currency: profileCell(profile, "currency"),
      expected_wage_amount: profileCell(profile, "expected_wage_amount"),
      expected_wage_type: profileCell(profile, "expected_wage_type"),
      review_status: profileCell(profile, "review_status"),
      onboarding_completed: profileCell(profile, "onboarding_completed"),
      ecr_status: profileCell(profile, "ecr_status"),
      ecr_category: profileCell(profile, "ecr_category"),
      source_type: sourceLabel(profile?.source_type),
      created_by: worker.createdBy,
      joined: worker.joined,
      application_count: String(worker.applicationCount),
      stage: cell(verification?.stage),
      quiz_score: cell(verification?.quiz_score),
      interview_status: cell(verification?.interview_status),
      interview_score: cell(verification?.interview_score),
      trade_test_status: cell(verification?.trade_test_status),
      medical_status: cell(verification?.medical_status),
      pdot_status: cell(verification?.pdot_status),
      payment_status: cell(verification?.payment_status),
      payment_amount: cell(verification?.payment_amount),
      bond_status: cell(verification?.bond_status),
      deploy_offer_status: cell(verification?.deploy_offer_status),
      deploy_visa_status: cell(verification?.deploy_visa_status),
      deploy_ticket_status: cell(verification?.deploy_ticket_status),
      deploy_contract_status: cell(verification?.deploy_contract_status),
      deploy_insurance_status: cell(verification?.deploy_insurance_status),
      deploy_emigration_status: cell(verification?.deploy_emigration_status),
      deployed_at: dateCell(verification?.deployed_at),
    };

    for (const fieldId of documentFieldIds) {
      if (fieldId === "face_selfie") continue;
      values[fieldId] = documentCell(docs, DOCUMENT_EXPORT_TYPES[fieldId], documentUrls);
    }

    return fields.map((field) => csvEscape(values[field.id] || "")).join(",");
  });

  return `\uFEFF${[header, ...lines].join("\n")}`;
}

export function downloadWorkersCsv(csv: string, workers: WorkerExportSource[]): void {
  const day = new Date().toISOString().slice(0, 10);
  let name = `workers-export-${day}.csv`;
  if (workers.length === 1) {
    const slug = (workers[0].fullName || workers[0].phone || "worker")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    name = `worker-${slug || "export"}-${day}.csv`;
  }
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
