import { db } from '../database/db.js';
import type { WorkerSkillProof } from '../entity/WorkerSkillProof.js';

interface SkillProofRow {
  id: number;
  worker_id: number;
  skill_id: number;
  experience_years: number | null;
  photo_paths: string;
  video_paths: string;
  created_date: string;
  updated_date: string;
}

function parsePaths(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapRow(row: SkillProofRow, skillName?: string): WorkerSkillProof {
  return {
    id: row.id,
    workerId: row.worker_id,
    skillId: row.skill_id,
    skillName,
    experienceYears: row.experience_years,
    photoPaths: parsePaths(row.photo_paths),
    videoPaths: parsePaths(row.video_paths),
    createdDate: row.created_date,
    updatedDate: row.updated_date,
  };
}

export class WorkerSkillProofRepository {
  findByWorkerId(workerId: number): WorkerSkillProof[] {
    const rows = db
      .prepare(
        `SELECT sp.*, s.name as skill_name
         FROM worker_skill_proofs sp
         JOIN skills s ON s.id = sp.skill_id
         WHERE sp.worker_id = ?
         ORDER BY sp.id`
      )
      .all(workerId) as (SkillProofRow & { skill_name: string })[];

    return rows.map((row) => mapRow(row, row.skill_name));
  }

  findById(id: number, workerId: number): WorkerSkillProof | null {
    const row = db
      .prepare(
        `SELECT sp.*, s.name as skill_name
         FROM worker_skill_proofs sp
         JOIN skills s ON s.id = sp.skill_id
         WHERE sp.id = ? AND sp.worker_id = ?`
      )
      .get(id, workerId) as (SkillProofRow & { skill_name: string }) | undefined;
    return row ? mapRow(row, row.skill_name) : null;
  }

  upsert(workerId: number, skillId: number, experienceYears?: number | null): WorkerSkillProof {
    const existing = db
      .prepare('SELECT id FROM worker_skill_proofs WHERE worker_id = ? AND skill_id = ?')
      .get(workerId, skillId) as { id: number } | undefined;

    if (existing) {
      if (experienceYears !== undefined) {
        db.prepare(
          `UPDATE worker_skill_proofs SET experience_years = ?, updated_date = datetime('now') WHERE id = ?`
        ).run(experienceYears, existing.id);
      }
      return this.findById(existing.id, workerId)!;
    }

    const result = db
      .prepare(
        `INSERT INTO worker_skill_proofs (worker_id, skill_id, experience_years)
         VALUES (?, ?, ?)`
      )
      .run(workerId, skillId, experienceYears ?? null);

    return this.findById(Number(result.lastInsertRowid), workerId)!;
  }

  appendMedia(
    id: number,
    workerId: number,
    type: 'photo' | 'video',
    relativePath: string
  ): WorkerSkillProof | null {
    const proof = this.findById(id, workerId);
    if (!proof) return null;

    const column = type === 'photo' ? 'photo_paths' : 'video_paths';
    const paths = type === 'photo' ? [...proof.photoPaths, relativePath] : [...proof.videoPaths, relativePath];

    db.prepare(
      `UPDATE worker_skill_proofs SET ${column} = ?, updated_date = datetime('now') WHERE id = ? AND worker_id = ?`
    ).run(JSON.stringify(paths), id, workerId);

    return this.findById(id, workerId);
  }

  removeMedia(
    id: number,
    workerId: number,
    type: 'photo' | 'video',
    relativePath: string
  ): WorkerSkillProof | null {
    const proof = this.findById(id, workerId);
    if (!proof) return null;

    const paths =
      type === 'photo'
        ? proof.photoPaths.filter((p) => p !== relativePath)
        : proof.videoPaths.filter((p) => p !== relativePath);
    const column = type === 'photo' ? 'photo_paths' : 'video_paths';

    db.prepare(
      `UPDATE worker_skill_proofs SET ${column} = ?, updated_date = datetime('now') WHERE id = ? AND worker_id = ?`
    ).run(JSON.stringify(paths), id, workerId);

    return this.findById(id, workerId);
  }

  delete(id: number, workerId: number): boolean {
    const result = db
      .prepare('DELETE FROM worker_skill_proofs WHERE id = ? AND worker_id = ?')
      .run(id, workerId);
    return result.changes > 0;
  }

  hasValidSkillProof(workerId: number): boolean {
    const proofs = this.findByWorkerId(workerId);
    return proofs.some((p) => p.photoPaths.length > 0 || p.videoPaths.length > 0);
  }

  countWithMedia(workerId: number): number {
    return this.findByWorkerId(workerId).filter(
      (p) => p.photoPaths.length > 0 || p.videoPaths.length > 0
    ).length;
  }
}
