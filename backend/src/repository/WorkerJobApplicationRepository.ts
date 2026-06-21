import { db } from '../database/db.js';

interface ApplicationRow {
  id: number;
  worker_id: number;
  job_id: string;
  employer_id: string;
  cover_letter: string | null;
  resume_url: string | null;
  status: string;
  applied_at: string;
}

export interface WorkerJobApplication {
  id: number;
  workerId: number;
  jobId: string;
  employerId: string;
  coverLetter: string | null;
  resumeUrl: string | null;
  status: string;
  appliedAt: string;
}

function mapRow(row: ApplicationRow): WorkerJobApplication {
  return {
    id: row.id,
    workerId: row.worker_id,
    jobId: row.job_id,
    employerId: row.employer_id,
    coverLetter: row.cover_letter,
    resumeUrl: row.resume_url,
    status: row.status,
    appliedAt: row.applied_at,
  };
}

export class WorkerJobApplicationRepository {
  findByWorkerAndJob(workerId: number, jobId: string): WorkerJobApplication | null {
    const row = db
      .prepare(
        `SELECT id, worker_id, job_id, employer_id, cover_letter, resume_url, status, applied_at
         FROM worker_job_applications
         WHERE worker_id = ? AND job_id = ?`
      )
      .get(workerId, jobId) as ApplicationRow | undefined;
    return row ? mapRow(row) : null;
  }

  create(input: {
    workerId: number;
    jobId: string;
    employerId: string;
    coverLetter?: string | null;
    resumeUrl?: string | null;
  }): WorkerJobApplication {
    const result = db
      .prepare(
        `INSERT INTO worker_job_applications (worker_id, job_id, employer_id, cover_letter, resume_url)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        input.workerId,
        input.jobId,
        input.employerId,
        input.coverLetter ?? null,
        input.resumeUrl ?? null
      );

    const row = db
      .prepare(
        `SELECT id, worker_id, job_id, employer_id, cover_letter, resume_url, status, applied_at
         FROM worker_job_applications WHERE id = ?`
      )
      .get(result.lastInsertRowid) as ApplicationRow;

    return mapRow(row);
  }
}
