import { z } from "zod";
import { CURRENCIES } from "@/lib/constants";
import { SERVICE_CHARGE_MAX_INR, SERVICE_CHARGE_MIN_INR } from "@/lib/jobServiceCharge";
import { requiredFutureDateString, parseDateInput } from "@/lib/validations/common";

const jobCurrencyCodes = CURRENCIES.map((currency) => currency.code) as [string, ...string[]];

function salaryOrderOk(min?: number, max?: number): boolean {
  if (min && max && Number.isFinite(min) && Number.isFinite(max)) return max >= min;
  return true;
}

const salaryRangeRefine = {
  refine: (data: { salary_min?: number; salary_max?: number }) =>
    salaryOrderOk(data.salary_min, data.salary_max),
  message: "Maximum salary must be greater than or equal to minimum salary" as const,
  path: ["salary_max"] as (string | number)[],
};

const localSalaryRangeRefine = {
  refine: (data: { local_salary_min?: number; local_salary_max?: number }) =>
    salaryOrderOk(data.local_salary_min, data.local_salary_max),
  message: "Local maximum must be greater than or equal to the local minimum" as const,
  path: ["local_salary_max"] as (string | number)[],
};

const jobPostingBaseSchema = z.object({
  title: z.string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),

  description: z.string()
    .trim()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description must be less than 5000 characters"),

  requirements: z.string()
    .trim()
    .min(20, "Requirements must be at least 20 characters")
    .max(3000, "Requirements must be less than 3000 characters")
    .optional()
    .or(z.literal("")),

  benefits: z.string()
    .trim()
    .max(2000, "Benefits must be less than 2000 characters")
    .optional()
    .or(z.literal("")),

  responsibilities: z.string()
    .trim()
    .max(3000, "Responsibilities must be less than 3000 characters")
    .optional()
    .or(z.literal("")),

  location: z.string()
    .trim()
    .min(2, "Location is required")
    .max(200, "Location must be less than 200 characters"),

  country: z.string()
    .trim()
    .min(2, "Country is required")
    .max(100, "Country must be less than 100 characters"),

  job_type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY", "INTERNSHIP"], {
    required_error: "Job type is required",
  }),

  experience_level: z.enum(["ENTRY", "INTERMEDIATE", "SENIOR", "EXPERT"], {
    required_error: "Experience level is required",
  }),

  salary_min: z.number()
    .positive("Minimum salary must be positive")
    .optional()
    .or(z.nan()),

  salary_max: z.number()
    .positive("Maximum salary must be positive")
    .optional()
    .or(z.nan()),

  currency: z.enum(jobCurrencyCodes, {
    errorMap: () => ({ message: "Select a currency" }),
  }),

  openings: z.number()
    .int("Openings must be a whole number")
    .positive("Openings must be at least 1")
    .max(1000, "Openings cannot exceed 1000"),

  visa_sponsorship: z.boolean().default(false),

  remote_allowed: z.boolean().default(false),

  expires_at: requiredFutureDateString,

  skills: z.array(z.string().trim().min(1)).optional().default([]),

  status: z.enum(["DRAFT", "PENDING", "ACTIVE"], {
    required_error: "Status is required",
  }).default("DRAFT"),
});

export const jobPostingSchema = jobPostingBaseSchema.refine(
  salaryRangeRefine.refine,
  {
    message: salaryRangeRefine.message,
    path: salaryRangeRefine.path,
  }
);

export type JobPostingFormData = z.infer<typeof jobPostingSchema>;

const adminJobFieldsSchema = jobPostingBaseSchema
  .omit({ status: true, expires_at: true, requirements: true })
  .extend({
    requirements: z
      .union([z.string().trim().max(3000), z.literal("")])
      .optional(),
    expires_at: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || parseDateInput(v) !== null, "Enter a valid date"),
    status: z.enum([
      "DRAFT",
      "PENDING",
      "ACTIVE",
      "PAUSED",
      "CLOSED",
      "EXPIRED",
      "REJECTED",
    ]),
    service_charge: z.number({
      required_error: "Service charge is required",
      invalid_type_error: "Enter the service charge in rupees",
    })
      .int("Service charge must be a whole rupee amount")
      .min(SERVICE_CHARGE_MIN_INR, `Service charge must be at least ₹${SERVICE_CHARGE_MIN_INR}`)
      .max(SERVICE_CHARGE_MAX_INR, `Service charge cannot exceed ₹${SERVICE_CHARGE_MAX_INR.toLocaleString("en-IN")}`),
    local_salary_min: z.number()
      .positive("Minimum local salary must be positive")
      .optional()
      .or(z.nan()),
    local_salary_max: z.number()
      .positive("Maximum local salary must be positive")
      .optional()
      .or(z.nan()),
    local_salary_currency: z.enum(jobCurrencyCodes, {
      errorMap: () => ({ message: "Select a local currency" }),
    }).default("INR"),
    title_hi: z.string().trim().max(200, "Hindi name must be less than 200 characters").optional().or(z.literal("")),
    processing_time: z.string().trim().max(160, "Processing time must be less than 160 characters").optional().or(z.literal("")),
    processing_time_hi: z.string().trim().max(160, "Hindi processing time must be less than 160 characters").optional().or(z.literal("")),
    category: z.string().trim().max(80).optional().or(z.literal("")),
    city: z.string().trim().max(120).optional().or(z.literal("")),
    work_phrase: z.string().trim().max(80, "Skill-proof phrase must be less than 80 characters").optional().or(z.literal("")),
    benefits_hi: z.string().trim().max(2000).optional().or(z.literal("")),
    quiz_skill_code: z.string().trim().max(160).optional().or(z.literal("")),
    quiz_pass_score: z.string().trim().optional().or(z.literal(""))
      .refine((value) => {
        if (!value) return true;
        const score = Number(value);
        return Number.isInteger(score) && score >= 1 && score <= 100;
      }, "Pass score must be a whole number from 1 to 100"),
    age_min: z.string().trim().optional().or(z.literal(""))
      .refine((value) => !value || (/^\d+$/.test(value) && Number(value) >= 16 && Number(value) <= 70), "Minimum age must be from 16 to 70"),
    age_max: z.string().trim().optional().or(z.literal(""))
      .refine((value) => !value || (/^\d+$/.test(value) && Number(value) >= 16 && Number(value) <= 70), "Maximum age must be from 16 to 70"),
    accommodation_image_urls: z.string().trim().max(4000).optional().or(z.literal(""))
      .refine((value) => !value || value.split(/\n+/).every((line) => {
        const item = line.trim();
        return !item || /^https?:\/\//i.test(item) || item.startsWith("/");
      }), "Each photo needs an https link or a path starting with /"),
    card_image_url: z.string().trim().max(500).optional().or(z.literal(""))
      .refine((value) => !value || /^https?:\/\//i.test(value), "Enter a full image URL starting with https://"),
    salary_display: z.string().trim().max(300).optional().or(z.literal("")),
    slug: z.string().trim().max(120).optional().or(z.literal(""))
      .refine((value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), "Use lowercase letters, numbers and hyphens"),
    seo_title: z.string().trim().max(160).optional().or(z.literal("")),
    seo_description: z.string().trim().max(300).optional().or(z.literal("")),
    indexable: z.boolean().default(true),
    hidden_from_public: z.boolean().default(false),
    use_saved_copy: z.boolean().default(false),
  });

function ageRangeIsValid(data: { age_min?: string; age_max?: string }): boolean {
  if (!data.age_min || !data.age_max) return true;
  return Number(data.age_max) >= Number(data.age_min);
}

/** Admin edit form — all job statuses, optional expiry, relaxed requirements */
export const adminJobEditSchema = adminJobFieldsSchema
  .refine(salaryRangeRefine.refine, {
    message: salaryRangeRefine.message,
    path: salaryRangeRefine.path,
  })
  .refine(localSalaryRangeRefine.refine, {
    message: localSalaryRangeRefine.message,
    path: localSalaryRangeRefine.path,
  })
  .refine(ageRangeIsValid, {
    message: "Maximum age must be at least the minimum age",
    path: ["age_max"],
  });

export type AdminJobEditFormData = z.infer<typeof adminJobEditSchema>;

/** Admin create form — same fields as edit, plus the employer the job belongs to */
export const adminJobPostSchema = adminJobFieldsSchema
  .extend({
    employer_id: z.string().min(1, "Select an employer"),
  })
  .refine(salaryRangeRefine.refine, {
    message: salaryRangeRefine.message,
    path: salaryRangeRefine.path,
  })
  .refine(localSalaryRangeRefine.refine, {
    message: localSalaryRangeRefine.message,
    path: localSalaryRangeRefine.path,
  })
  .refine(ageRangeIsValid, {
    message: "Maximum age must be at least the minimum age",
    path: ["age_max"],
  });

export type AdminJobPostFormData = z.infer<typeof adminJobPostSchema>;
