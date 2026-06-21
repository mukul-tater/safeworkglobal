import { db } from '../database/db.js';
import type { Worker, State, District, Skill } from '../entity/Worker.js';
import type { ExperienceLevel, RegistrationSource, WorkerStatus } from '../entity/Worker.js';

interface WorkerRow {
  id: number;
  worker_code: string;
  full_name: string;
  email: string;
  mobile_number: string;
  password_hash: string;
  aadhaar_number: string;
  state_id: number;
  district_id: number;
  primary_skill_id: number;
  experience_level: ExperienceLevel;
  profile_completion_percentage: number;
  registration_source: RegistrationSource;
  status: WorkerStatus;
  created_date: string;
  updated_date: string;
}

function mapWorkerRow(row: WorkerRow): Worker {
  return {
    id: row.id,
    workerCode: row.worker_code,
    fullName: row.full_name,
    email: row.email,
    mobileNumber: row.mobile_number,
    passwordHash: row.password_hash,
    aadhaarNumber: row.aadhaar_number,
    stateId: row.state_id,
    districtId: row.district_id,
    primarySkillId: row.primary_skill_id,
    experienceLevel: row.experience_level,
    profileCompletionPercentage: row.profile_completion_percentage,
    registrationSource: row.registration_source,
    status: row.status,
    createdDate: row.created_date,
    updatedDate: row.updated_date,
  };
}

export interface CreateWorkerInput {
  workerCode: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  passwordHash: string;
  aadhaarNumber: string;
  stateId: number;
  districtId: number;
  primarySkillId: number;
  experienceLevel: ExperienceLevel;
  mobileVerified?: boolean;
  profileCompletionPercentage?: number;
  status?: WorkerStatus;
}

export class WorkerRepository {
  findByMobile(mobileNumber: string): Worker | null {
    const row = db
      .prepare('SELECT * FROM workers WHERE mobile_number = ?')
      .get(mobileNumber) as WorkerRow | undefined;
    return row ? mapWorkerRow(row) : null;
  }

  findByEmail(email: string): Worker | null {
    const row = db
      .prepare('SELECT * FROM workers WHERE LOWER(email) = LOWER(?)')
      .get(email.trim()) as WorkerRow | undefined;
    return row ? mapWorkerRow(row) : null;
  }

  findById(id: number): Worker | null {
    const row = db.prepare('SELECT * FROM workers WHERE id = ?').get(id) as WorkerRow | undefined;
    return row ? mapWorkerRow(row) : null;
  }

  getNextWorkerCode(): string {
    const result = db.prepare('SELECT COUNT(*) as count FROM workers').get() as { count: number };
    const next = result.count + 1;
    return `WRK-${String(next).padStart(6, '0')}`;
  }

  create(input: CreateWorkerInput): Worker {
    const stmt = db.prepare(`
      INSERT INTO workers (
        worker_code, full_name, email, mobile_number, password_hash, aadhaar_number,
        state_id, district_id, primary_skill_id, experience_level,
        profile_completion_percentage, registration_source, status, mobile_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'WEB', ?, ?)
    `);

    const result = stmt.run(
      input.workerCode,
      input.fullName,
      input.email.trim().toLowerCase(),
      input.mobileNumber,
      input.passwordHash,
      input.aadhaarNumber,
      input.stateId,
      input.districtId,
      input.primarySkillId,
      input.experienceLevel,
      input.profileCompletionPercentage ?? 20,
      input.status ?? 'REGISTERED',
      input.mobileVerified ? 1 : 0
    );

    const worker = this.findById(Number(result.lastInsertRowid));
    if (!worker) throw new Error('Failed to create worker');
    return worker;
  }

  updateProgress(id: number, profileCompletionPercentage: number, status: WorkerStatus): void {
    db.prepare(`
      UPDATE workers
      SET profile_completion_percentage = ?, status = ?, updated_date = datetime('now')
      WHERE id = ?
    `).run(profileCompletionPercentage, status, id);
  }

  updateProfileFields(
    id: number,
    fields: {
      stateId?: number;
      districtId?: number;
      primarySkillId?: number;
      experienceLevel?: ExperienceLevel;
    }
  ): void {
    const worker = this.findById(id);
    if (!worker) return;

    db.prepare(`
      UPDATE workers SET
        state_id = ?,
        district_id = ?,
        primary_skill_id = ?,
        experience_level = ?,
        updated_date = datetime('now')
      WHERE id = ?
    `).run(
      fields.stateId ?? worker.stateId,
      fields.districtId ?? worker.districtId,
      fields.primarySkillId ?? worker.primarySkillId,
      fields.experienceLevel ?? worker.experienceLevel,
      id
    );
  }
}

export class LocationRepository {
  findAllStates(): State[] {
    return db.prepare('SELECT id, name FROM states ORDER BY name').all() as State[];
  }

  findDistrictsByStateId(stateId: number): District[] {
    return db
      .prepare('SELECT id, state_id as stateId, name FROM districts WHERE state_id = ? ORDER BY name')
      .all(stateId) as District[];
  }

  findStateById(id: number): State | null {
    return (db.prepare('SELECT id, name FROM states WHERE id = ?').get(id) as State | undefined) ?? null;
  }

  findDistrictById(id: number): District | null {
    const row = db
      .prepare('SELECT id, state_id as stateId, name FROM districts WHERE id = ?')
      .get(id) as District | undefined;
    return row ?? null;
  }

  districtBelongsToState(districtId: number, stateId: number): boolean {
    const row = db
      .prepare('SELECT 1 FROM districts WHERE id = ? AND state_id = ?')
      .get(districtId, stateId);
    return !!row;
  }
}

export class SkillRepository {
  findAll(): Skill[] {
    return db.prepare('SELECT id, name FROM skills ORDER BY name').all() as Skill[];
  }

  findById(id: number): Skill | null {
    return (db.prepare('SELECT id, name FROM skills WHERE id = ?').get(id) as Skill | undefined) ?? null;
  }
}
