import { db } from '../database/db.js';
import type { WorkerOnboarding, OnboardingStage } from '../entity/WorkerOnboarding.js';

interface OnboardingRow {
  id: number;
  worker_id: number;
  date_of_birth: string | null;
  gender: string | null;
  email: string | null;
  address: string | null;
  pincode: string | null;
  education_level: string | null;
  secondary_skill_ids: string | null;
  previous_employer: string | null;
  has_passport: number;
  passport_number: string | null;
  ecr_status: string | null;
  preferred_countries: string | null;
  preferred_gcc_country: string | null;
  preferred_gcc_city: string | null;
  availability: string | null;
  open_to_relocation: number;
  expected_salary_min: number | null;
  expected_salary_currency: string;
  languages: string | null;
  onboarding_stage: string;
  current_step: number;
  onboarding_completed: number;
  created_date: string;
  updated_date: string;
}

function parseJsonArray<T>(value: string | null, fallback: T[]): T[] {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T[];
  } catch {
    return fallback;
  }
}

function mapRow(row: OnboardingRow): WorkerOnboarding {
  return {
    id: row.id,
    workerId: row.worker_id,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    email: row.email,
    address: row.address,
    pincode: row.pincode,
    educationLevel: row.education_level,
    secondarySkillIds: parseJsonArray<number>(row.secondary_skill_ids, []),
    previousEmployer: row.previous_employer,
    hasPassport: row.has_passport === 1,
    passportNumber: row.passport_number,
    ecrStatus: row.ecr_status,
    preferredCountries: parseJsonArray<string>(row.preferred_countries, []),
    preferredGccCountry: row.preferred_gcc_country,
    preferredGccCity: row.preferred_gcc_city,
    availability: row.availability,
    openToRelocation: row.open_to_relocation === 1,
    expectedSalaryMin: row.expected_salary_min,
    expectedSalaryCurrency: row.expected_salary_currency,
    languages: parseJsonArray<string>(row.languages, []),
    onboardingStage: (row.onboarding_stage as OnboardingStage) || 'REGISTERED',
    currentStep: row.current_step,
    onboardingCompleted: row.onboarding_completed === 1,
    createdDate: row.created_date,
    updatedDate: row.updated_date,
  };
}

export interface UpsertOnboardingInput {
  workerId: number;
  dateOfBirth?: string | null;
  gender?: string | null;
  email?: string | null;
  address?: string | null;
  pincode?: string | null;
  educationLevel?: string | null;
  secondarySkillIds?: number[];
  previousEmployer?: string | null;
  hasPassport?: boolean;
  passportNumber?: string | null;
  ecrStatus?: string | null;
  preferredCountries?: string[];
  preferredGccCountry?: string | null;
  preferredGccCity?: string | null;
  availability?: string | null;
  openToRelocation?: boolean;
  expectedSalaryMin?: number | null;
  expectedSalaryCurrency?: string;
  languages?: string[];
  onboardingStage?: OnboardingStage;
  currentStep?: number;
  onboardingCompleted?: boolean;
}

export class WorkerOnboardingRepository {
  findByWorkerId(workerId: number): WorkerOnboarding | null {
    const row = db
      .prepare('SELECT * FROM worker_onboarding WHERE worker_id = ?')
      .get(workerId) as OnboardingRow | undefined;
    return row ? mapRow(row) : null;
  }

  createEmpty(workerId: number): WorkerOnboarding {
    db.prepare('INSERT INTO worker_onboarding (worker_id) VALUES (?)').run(workerId);
    const record = this.findByWorkerId(workerId);
    if (!record) throw new Error('Failed to create onboarding record');
    return record;
  }

  upsert(input: UpsertOnboardingInput): WorkerOnboarding {
    const existing = this.findByWorkerId(input.workerId);
    if (!existing) {
      this.createEmpty(input.workerId);
    }

    const current = this.findByWorkerId(input.workerId)!;

    const next: WorkerOnboarding = {
      ...current,
      dateOfBirth: input.dateOfBirth !== undefined ? input.dateOfBirth : current.dateOfBirth,
      gender: input.gender !== undefined ? input.gender : current.gender,
      email: input.email !== undefined ? input.email : current.email,
      address: input.address !== undefined ? input.address : current.address,
      pincode: input.pincode !== undefined ? input.pincode : current.pincode,
      educationLevel:
        input.educationLevel !== undefined ? input.educationLevel : current.educationLevel,
      secondarySkillIds:
        input.secondarySkillIds !== undefined ? input.secondarySkillIds : current.secondarySkillIds,
      previousEmployer:
        input.previousEmployer !== undefined ? input.previousEmployer : current.previousEmployer,
      hasPassport: input.hasPassport !== undefined ? input.hasPassport : current.hasPassport,
      passportNumber:
        input.passportNumber !== undefined ? input.passportNumber : current.passportNumber,
      ecrStatus: input.ecrStatus !== undefined ? input.ecrStatus : current.ecrStatus,
      preferredCountries:
        input.preferredCountries !== undefined ? input.preferredCountries : current.preferredCountries,
      preferredGccCountry:
        input.preferredGccCountry !== undefined
          ? input.preferredGccCountry
          : current.preferredGccCountry,
      preferredGccCity:
        input.preferredGccCity !== undefined ? input.preferredGccCity : current.preferredGccCity,
      availability: input.availability !== undefined ? input.availability : current.availability,
      openToRelocation:
        input.openToRelocation !== undefined ? input.openToRelocation : current.openToRelocation,
      expectedSalaryMin:
        input.expectedSalaryMin !== undefined ? input.expectedSalaryMin : current.expectedSalaryMin,
      expectedSalaryCurrency:
        input.expectedSalaryCurrency !== undefined
          ? input.expectedSalaryCurrency
          : current.expectedSalaryCurrency,
      languages: input.languages !== undefined ? input.languages : current.languages,
      onboardingStage:
        input.onboardingStage !== undefined ? input.onboardingStage : current.onboardingStage,
      currentStep: input.currentStep !== undefined ? input.currentStep : current.currentStep,
      onboardingCompleted:
        input.onboardingCompleted !== undefined
          ? input.onboardingCompleted
          : current.onboardingCompleted,
    };

    db.prepare(`
      UPDATE worker_onboarding SET
        date_of_birth = ?,
        gender = ?,
        email = ?,
        address = ?,
        pincode = ?,
        education_level = ?,
        secondary_skill_ids = ?,
        previous_employer = ?,
        has_passport = ?,
        passport_number = ?,
        ecr_status = ?,
        preferred_countries = ?,
        preferred_gcc_country = ?,
        preferred_gcc_city = ?,
        availability = ?,
        open_to_relocation = ?,
        expected_salary_min = ?,
        expected_salary_currency = ?,
        languages = ?,
        onboarding_stage = ?,
        current_step = ?,
        onboarding_completed = ?,
        updated_date = datetime('now')
      WHERE worker_id = ?
    `).run(
      next.dateOfBirth,
      next.gender,
      next.email || null,
      next.address,
      next.pincode,
      next.educationLevel || null,
      JSON.stringify(next.secondarySkillIds),
      next.previousEmployer || null,
      next.hasPassport ? 1 : 0,
      next.passportNumber || null,
      next.ecrStatus,
      JSON.stringify(next.preferredCountries),
      next.preferredGccCountry || null,
      next.preferredGccCity || null,
      next.availability,
      next.openToRelocation ? 1 : 0,
      next.expectedSalaryMin,
      next.expectedSalaryCurrency,
      JSON.stringify(next.languages),
      next.onboardingStage,
      next.currentStep,
      next.onboardingCompleted ? 1 : 0,
      input.workerId
    );

    return this.findByWorkerId(input.workerId)!;
  }
}
