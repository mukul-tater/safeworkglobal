export interface WorkerSkillProof {
  id: number;
  workerId: number;
  skillId: number;
  skillName?: string;
  experienceYears: number | null;
  photoPaths: string[];
  videoPaths: string[];
  createdDate: string;
  updatedDate: string;
}
