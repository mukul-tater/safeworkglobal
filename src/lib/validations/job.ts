import { z } from "zod";

const salaryRangeRefine = {
  refine: (data: { salary_min?: number; salary_max?: number }) => {
    if (data.salary_min && data.salary_max) {
      return data.salary_max >= data.salary_min;
    }
    return true;
  },
  message: "Maximum salary must be greater than or equal to minimum salary" as const,
  path: ["salary_max"] as (string | number)[],
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

  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED", "SAR", "QAR"], {
    required_error: "Currency is required",
  }),

  openings: z.number()
    .int("Openings must be a whole number")
    .positive("Openings must be at least 1")
    .max(1000, "Openings cannot exceed 1000"),

  visa_sponsorship: z.boolean().default(false),

  remote_allowed: z.boolean().default(false),

  expires_at: z.string()
    .min(1, "Expiry date is required"),

  skills: z.array(z.string().trim().min(1)).optional().default([]),

  status: z.enum(["DRAFT", "ACTIVE"], {
    required_error: "Status is required",
  }).default("DRAFT"),
});

export const jobPostingSchema = jobPostingBaseSchema.refine(
  salaryRangeRefine.refine,
  {
    message: salaryRangeRefine.message,
    path: [salaryRangeRefine.path],
  }
);

export type JobPostingFormData = z.infer<typeof jobPostingSchema>;

/** Admin edit form — all job statuses, optional expiry, relaxed requirements */
export const adminJobEditSchema = jobPostingBaseSchema
  .omit({ status: true, expires_at: true, requirements: true })
  .extend({
    requirements: z
      .union([z.string().trim().max(3000), z.literal("")])
      .optional(),
    expires_at: z.string().optional().or(z.literal("")),
    status: z.enum([
      "DRAFT",
      "PENDING",
      "ACTIVE",
      "PAUSED",
      "CLOSED",
      "EXPIRED",
      "REJECTED",
    ]),
  })
  .refine(salaryRangeRefine.refine, {
    message: salaryRangeRefine.message,
    path: [salaryRangeRefine.path],
  });

export type AdminJobEditFormData = z.infer<typeof adminJobEditSchema>;
