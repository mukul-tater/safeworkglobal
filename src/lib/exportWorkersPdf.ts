import { SKILL_MEDIA_LINK_SECONDS } from "@/lib/workerSkillMedia";
import { supabase } from "@/integrations/supabase/client";
import { DOCUMENT_EXPORT_TYPES, WORKER_EXPORT_FIELDS, WORKER_EXPORT_GROUPS, fieldsInGroup } from "@/lib/workerExportFields";
import { buildWorkerExportPdf, type PdfField, type PdfLinkItem, type PdfWorkerRecord } from "@/lib/workerPdfDocument";

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
  journey_job_id?: string | null;
}

interface JobRow {
  id: string;
  title: string | null;
  country: string | null;
  location: string | null;
  service_charge: number | null;
}

interface ApplicationRow {
  worker_id: string;
  status: string;
  applied_at: string | null;
  job_id: string;
  jobs: JobRow | JobRow[] | null;
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
    const { data, error } = await supabase.storage.from(bucket).createSignedUrls(slice, bucket === 'worker-videos' ? SKILL_MEDIA_LINK_SECONDS : SIGNED_URL_SECONDS);
    if (error || !data) continue;
    for (const row of data) {
      if (row.path && row.signedUrl) urls.set(row.path, row.signedUrl);
    }
  }
  return urls;
}

function documentLinks(docs: DocumentRow[], types: string[], urls: Map<string, string>): PdfLinkItem[] {
  return docs
    .filter((doc) => types.includes(doc.document_type))
    .map((doc) => {
      const uploaded = dateCell(doc.uploaded_at);
      return {
        caption: [doc.document_name, doc.verification_status || "pending", uploaded ? `uploaded ${uploaded}` : ""]
          .filter(Boolean)
          .join(" · "),
        url: urls.get(documentStoragePath(doc.file_url)) || "",
      };
    });
}

function mediaLinks(items: MediaRow[], kind: "photo" | "video", urls: Map<string, string>): PdfLinkItem[] {
  const matched = items.filter((item) => item.media_type === kind);
  const noun = kind === "photo" ? "Photo" : "Video";
  return matched.map((item, index) => {
    const uploaded = dateCell(item.created_at);
    const label = matched.length > 1 ? `${noun} ${index + 1}` : noun;
    return {
      caption: uploaded ? `${label} · ${uploaded}` : label,
      url: urls.get(item.file_path) || "",
    };
  });
}

function skillsText(rows: SkillRow[]): string {
  return rows
    .map((row) => {
      const details = [
        row.proficiency_level,
        row.years_of_experience != null ? `${row.years_of_experience} yrs` : "",
      ].filter(Boolean);
      return details.length ? `${row.skill_name} (${details.join(", ")})` : row.skill_name;
    })
    .join("\n");
}

function experienceText(rows: ExperienceRow[]): string {
  return rows
    .map((row) => {
      const place = [row.company_name, row.location].filter(Boolean).join(", ");
      const end = row.is_current ? "present" : dateCell(row.end_date) || "-";
      return `${row.job_title} at ${place}, ${dateCell(row.start_date)} to ${end}`;
    })
    .join("\n");
}

function certificationText(rows: CertificationRow[]): string {
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
    .join("\n");
}

function extractJob(jobs: JobRow | JobRow[] | null | undefined): JobRow | null {
  if (!jobs) return null;
  return Array.isArray(jobs) ? jobs[0] || null : jobs;
}

function applicationSummary(app: ApplicationRow): string {
  const job = extractJob(app.jobs);
  const title = job?.title || "Untitled job";
  const country = job?.country ? ` · ${job.country}` : "";
  const fee = job?.service_charge != null && Number.isFinite(job.service_charge)
    ? ` · ₹${Number(job.service_charge).toLocaleString("en-IN")}`
    : "";
  const status = app.status ? ` (${app.status.toLowerCase().replace(/_/g, " ")})` : "";
  const applied = dateCell(app.applied_at);
  const dateStr = applied ? ` · ${applied}` : "";
  return `${title}${country}${fee}${status}${dateStr}`;
}

function needs(fieldIds: string[], ids: string[]): boolean {
  return ids.some((id) => fieldIds.includes(id));
}

function textField(label: string, value: string): PdfField {
  return { label, text: value };
}

function linkField(label: string, links: PdfLinkItem[]): PdfField {
  return { label, links };
}

function exportDateLabel(date = new Date()): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export async function buildWorkersPdf(workers: WorkerExportSource[], fieldIds: string[]): Promise<Uint8Array> {
  const fields = WORKER_EXPORT_FIELDS.filter((field) => fieldIds.includes(field.id));
  if (!workers.length) throw new Error("No workers to export");
  if (!fields.length) throw new Error("Select at least one field");

  const ids = workers.map((worker) => worker.id);
  const selected = new Set(fieldIds);
  const labels = new Map(WORKER_EXPORT_FIELDS.map((field) => [field.id, field.label]));

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
  const wantApplications = needs(fieldIds, [
    "applied_job",
    "applied_country",
    "applied_service_charge",
    "applied_applications",
  ]);
  const documentFieldIds = Object.keys(DOCUMENT_EXPORT_TYPES).filter((id) => selected.has(id));
  const wantSkills = selected.has("skills_detail");
  const wantExperience = selected.has("work_history");
  const wantCertifications = selected.has("certifications");
  const wantMedia = selected.has("work_photos") || selected.has("work_videos");

  const [verifications, documents, skills, experience, certifications, media, applications] = await Promise.all([
    (wantVerification || wantApplications)
      ? rowsIn<VerificationRow>(
          (slice) =>
            supabase
              .from("worker_verification")
              .select(
                "user_id, city, state, district, education_level, gender, kyc_verified_at, kyc_rejection_reason, stage, quiz_score, interview_status, interview_score, trade_test_status, medical_status, pdot_status, payment_status, payment_amount, bond_status, deploy_offer_status, deploy_visa_status, deploy_ticket_status, deploy_contract_status, deploy_insurance_status, deploy_emigration_status, deployed_at, journey_job_id",
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
              .select(
                "worker_id, certification_name, issuing_organization, issue_date, expiry_date, credential_id, verified",
              )
              .in("worker_id", slice),
          ids,
        )
      : Promise.resolve([] as CertificationRow[]),
    wantMedia
      ? rowsIn<MediaRow>(
          (slice) =>
            supabase.from("worker_skill_media").select("worker_id, media_type, file_path, created_at").in("worker_id", slice),
          ids,
        )
      : Promise.resolve([] as MediaRow[]),
    wantApplications
      ? rowsIn<ApplicationRow>(
          (slice) =>
            supabase
              .from("job_applications")
              .select("worker_id, status, applied_at, job_id, jobs(id, title, country, location, service_charge)")
              .in("worker_id", slice)
              .order("applied_at", { ascending: false }),
          ids,
        )
      : Promise.resolve([] as ApplicationRow[]),
  ]);

  const documentUrls = await signPaths(
    "worker-documents",
    documents.map((doc) => documentStoragePath(doc.file_url)),
  );
  const mediaUrls = await signPaths(
    "worker-videos",
    media.map((item) => item.file_path),
  );

  const knownJobIds = new Set(
    applications
      .map((a) => a.job_id)
      .concat(applications.map((a) => extractJob(a.jobs)?.id || "").filter(Boolean)),
  );
  const missingJobIds = wantApplications
    ? Array.from(
        new Set(
          verifications
            .map((v) => v.journey_job_id)
            .filter((id): id is string => Boolean(id && !knownJobIds.has(id))),
        ),
      )
    : [];

  const extraJobs = missingJobIds.length
    ? await rowsIn<JobRow>(
        (slice) =>
          supabase.from("jobs").select("id, title, country, location, service_charge").in("id", slice),
        missingJobIds,
      )
    : [];
  const extraJobsById = new Map(extraJobs.map((j) => [j.id, j]));

  const verificationByUser = new Map(verifications.map((row) => [row.user_id, row]));
  const applicationsByWorker = groupBy(applications, (row) => row.worker_id);
  const documentsByWorker = groupBy(documents, (row) => row.worker_id);
  const skillsByWorker = groupBy(skills, (row) => row.worker_id);
  const experienceByWorker = groupBy(experience, (row) => row.worker_id);
  const certificationsByWorker = groupBy(certifications, (row) => row.worker_id);
  const mediaByWorker = groupBy(media, (row) => row.worker_id);

  const records: PdfWorkerRecord[] = workers.map((worker) => {
    const profile = worker.profile;
    const verification = verificationByUser.get(worker.id);
    const docs = documentsByWorker.get(worker.id) || [];
    const workerMedia = mediaByWorker.get(worker.id) || [];
    const values = new Map<string, PdfField>();
    const use = (id: string, field: PdfField) => {
      if (selected.has(id)) values.set(id, field);
    };
    const label = (id: string) => labels.get(id) || id;

    use("full_name", textField(label("full_name"), worker.fullName || ""));
    use("phone", textField(label("phone"), worker.phone || ""));
    use("email", textField(label("email"), worker.email || ""));
    use("gender", textField(label("gender"), profileCell(profile, "gender") || cell(verification?.gender)));
    use("nationality", textField(label("nationality"), profileCell(profile, "nationality")));
    use("country", textField(label("country"), profileCell(profile, "country")));
    use("current_city", textField(label("current_city"), profileCell(profile, "current_city")));
    use("current_location", textField(label("current_location"), profileCell(profile, "current_location")));
    use("state", textField(label("state"), cell(verification?.state)));
    use("district", textField(label("district"), cell(verification?.district)));
    use("verification_city", textField(label("verification_city"), cell(verification?.city)));
    use("aadhaar_number", textField(label("aadhaar_number"), profileCell(profile, "aadhaar_number")));
    use("aadhaar_last4", textField(label("aadhaar_last4"), profileCell(profile, "aadhaar_last4")));
    use("pan_number", textField(label("pan_number"), profileCell(profile, "pan_number")));
    use("passport_number", textField(label("passport_number"), profileCell(profile, "passport_number")));
    use("passport_expiry", textField(label("passport_expiry"), profileDate(profile, "passport_expiry")));
    use("has_passport", textField(label("has_passport"), profileCell(profile, "has_passport")));
    use("has_visa", textField(label("has_visa"), profileCell(profile, "has_visa")));
    use("visa_countries", textField(label("visa_countries"), profileCell(profile, "visa_countries")));
    use("kyc_status", textField(label("kyc_status"), profileCell(profile, "kyc_status")));
    use("kyc_submitted_at", textField(label("kyc_submitted_at"), profileDate(profile, "kyc_submitted_at")));
    use("kyc_verified_at", textField(label("kyc_verified_at"), dateCell(verification?.kyc_verified_at)));
    use("kyc_rejection_reason", textField(label("kyc_rejection_reason"), cell(verification?.kyc_rejection_reason)));
    use("face_selfie", linkField(label("face_selfie"), documentLinks(docs, DOCUMENT_EXPORT_TYPES.face_selfie, documentUrls)));
    use("work_photos", linkField(label("work_photos"), mediaLinks(workerMedia, "photo", mediaUrls)));
    use("work_videos", linkField(label("work_videos"), mediaLinks(workerMedia, "video", mediaUrls)));
    use("bio", textField(label("bio"), profileCell(profile, "bio")));
    use("primary_skill", textField(label("primary_skill"), profileCell(profile, "primary_skill")));
    use("secondary_skills", textField(label("secondary_skills"), profileCell(profile, "secondary_skills")));
    use("skill_level", textField(label("skill_level"), profileCell(profile, "skill_level")));
    use("years_of_experience", textField(label("years_of_experience"), profileCell(profile, "years_of_experience")));
    use("experience_range", textField(label("experience_range"), profileCell(profile, "experience_range")));
    use("languages", textField(label("languages"), profileCell(profile, "languages")));
    use("skills_detail", textField(label("skills_detail"), skillsText(skillsByWorker.get(worker.id) || [])));
    use("work_history", textField(label("work_history"), experienceText(experienceByWorker.get(worker.id) || [])));
    use("certifications", textField(label("certifications"), certificationText(certificationsByWorker.get(worker.id) || [])));
    use("project_types_worked", textField(label("project_types_worked"), profileCell(profile, "project_types_worked")));
    use("tenth_pass_confirmed", textField(label("tenth_pass_confirmed"), profileCell(profile, "tenth_pass_confirmed")));
    use("education_level", textField(label("education_level"), cell(verification?.education_level)));
    use("availability", textField(label("availability"), profileCell(profile, "availability")));
    use("open_to_relocation", textField(label("open_to_relocation"), profileCell(profile, "open_to_relocation")));
    use("preferred_work_city", textField(label("preferred_work_city"), profileCell(profile, "preferred_work_city")));
    use("preferred_shift", textField(label("preferred_shift"), profileCell(profile, "preferred_shift")));
    use("primary_work_type", textField(label("primary_work_type"), profileCell(profile, "primary_work_type")));
    use("work_preference", textField(label("work_preference"), profileCell(profile, "work_preference")));
    use("currency", textField(label("currency"), profileCell(profile, "currency")));
    use("review_status", textField(label("review_status"), profileCell(profile, "review_status")));
    use("onboarding_completed", textField(label("onboarding_completed"), profileCell(profile, "onboarding_completed")));
    use("ecr_status", textField(label("ecr_status"), profileCell(profile, "ecr_status")));
    use("ecr_category", textField(label("ecr_category"), profileCell(profile, "ecr_category")));
    use("source_type", textField(label("source_type"), sourceLabel(profile?.source_type)));
    use("created_by", textField(label("created_by"), worker.createdBy));
    use("joined", textField(label("joined"), worker.joined));
    use("application_count", textField(label("application_count"), String(worker.applicationCount)));

    const workerApps = applicationsByWorker.get(worker.id) || [];
    const jJob = verification?.journey_job_id ? extraJobsById.get(verification.journey_job_id) : null;

    const countries = Array.from(
      new Set(
        workerApps
          .map((a) => extractJob(a.jobs)?.country?.trim())
          .filter((c): c is string => Boolean(c)),
      ),
    );
    if (countries.length === 0 && jJob?.country?.trim()) {
      countries.push(jJob.country.trim());
    }

    const jobTitles = Array.from(
      new Set(
        workerApps
          .map((a) => extractJob(a.jobs)?.title?.trim())
          .filter((t): t is string => Boolean(t)),
      ),
    );
    if (jobTitles.length === 0 && jJob?.title?.trim()) {
      jobTitles.push(jJob.title.trim());
    }

    const serviceCharges = Array.from(
      new Set(
        workerApps
          .map((a) => extractJob(a.jobs)?.service_charge)
          .filter((fee): fee is number => fee != null && Number.isFinite(fee))
          .map((fee) => `₹${Number(fee).toLocaleString("en-IN")}`),
      ),
    );
    if (serviceCharges.length === 0 && jJob?.service_charge != null && Number.isFinite(jJob.service_charge)) {
      serviceCharges.push(`₹${Number(jJob.service_charge).toLocaleString("en-IN")}`);
    }

    const appsListText = workerApps.length
      ? workerApps.map(applicationSummary).join("\n")
      : jJob
        ? `${jJob.title || "Untitled job"}${jJob.country ? ` · ${jJob.country}` : ""}${jJob.service_charge != null && Number.isFinite(jJob.service_charge) ? ` · ₹${Number(jJob.service_charge).toLocaleString("en-IN")}` : ""} (journey job)`
        : "";

    use("applied_job", textField(label("applied_job"), jobTitles.join(", ")));
    use("applied_country", textField(label("applied_country"), countries.join(", ")));
    use("applied_service_charge", textField(label("applied_service_charge"), serviceCharges.join(", ")));
    use("applied_applications", textField(label("applied_applications"), appsListText));

    use("stage", textField(label("stage"), cell(verification?.stage)));
    use("quiz_score", textField(label("quiz_score"), cell(verification?.quiz_score)));
    use("interview_status", textField(label("interview_status"), cell(verification?.interview_status)));
    use("interview_score", textField(label("interview_score"), cell(verification?.interview_score)));
    use("trade_test_status", textField(label("trade_test_status"), cell(verification?.trade_test_status)));
    use("medical_status", textField(label("medical_status"), cell(verification?.medical_status)));
    use("pdot_status", textField(label("pdot_status"), cell(verification?.pdot_status)));
    use("payment_status", textField(label("payment_status"), cell(verification?.payment_status)));
    use("payment_amount", textField(label("payment_amount"), cell(verification?.payment_amount)));
    use("bond_status", textField(label("bond_status"), cell(verification?.bond_status)));
    use("deploy_offer_status", textField(label("deploy_offer_status"), cell(verification?.deploy_offer_status)));
    use("deploy_visa_status", textField(label("deploy_visa_status"), cell(verification?.deploy_visa_status)));
    use("deploy_ticket_status", textField(label("deploy_ticket_status"), cell(verification?.deploy_ticket_status)));
    use("deploy_contract_status", textField(label("deploy_contract_status"), cell(verification?.deploy_contract_status)));
    use("deploy_insurance_status", textField(label("deploy_insurance_status"), cell(verification?.deploy_insurance_status)));
    use("deploy_emigration_status", textField(label("deploy_emigration_status"), cell(verification?.deploy_emigration_status)));
    use("deployed_at", textField(label("deployed_at"), dateCell(verification?.deployed_at)));

    for (const fieldId of documentFieldIds) {
      if (fieldId === "face_selfie") continue;
      use(fieldId, linkField(label(fieldId), documentLinks(docs, DOCUMENT_EXPORT_TYPES[fieldId], documentUrls)));
    }

    const sections = WORKER_EXPORT_GROUPS.map((group) => ({
      title: group.label,
      fields: fieldsInGroup(group.id)
        .map((field) => values.get(field.id))
        .filter((field): field is PdfField => !!field),
    })).filter((section) => section.fields.length > 0);

    return {
      heading: worker.fullName || worker.phone || worker.email || "Worker",
      sections,
    };
  });

  return buildWorkerExportPdf(records, exportDateLabel());
}

export function downloadWorkersPdf(bytes: Uint8Array, workers: WorkerExportSource[]): void {
  const day = new Date().toISOString().slice(0, 10);
  let name = `workers-export-${day}.pdf`;
  if (workers.length === 1) {
    const slug = (workers[0].fullName || workers[0].phone || "worker")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    name = `worker-${slug || "export"}-${day}.pdf`;
  }
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
