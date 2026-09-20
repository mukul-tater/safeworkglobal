import { supabase } from '@/integrations/supabase/client';

const STORAGE_BUCKET = 'worker-videos';

export interface SkillMediaItem {
  id: string;
  media_type: 'photo' | 'video';
  url: string;
}

export interface WorkerSkillWithMedia {
  id: string;
  skill_name: string;
  proficiency_level: string | null;
  years_of_experience: number | null;
  media: SkillMediaItem[];
}

export async function loadWorkersSkillsWithMedia(
  workerIds: string[],
): Promise<Map<string, WorkerSkillWithMedia[]>> {
  const byWorker = new Map<string, WorkerSkillWithMedia[]>();
  for (const id of workerIds) byWorker.set(id, []);
  if (!workerIds.length) return byWorker;

  const [{ data: skillsData, error: skillsError }, { data: mediaData, error: mediaError }] =
    await Promise.all([
      supabase
        .from('worker_skills')
        .select('id, worker_id, skill_name, proficiency_level, years_of_experience')
        .in('worker_id', workerIds),
      supabase
        .from('worker_skill_media')
        .select('id, worker_id, skill_id, media_type, file_path')
        .in('worker_id', workerIds)
        .order('created_at', { ascending: true }),
    ]);

  if (skillsError) throw skillsError;
  if (mediaError) throw mediaError;

  const mediaBySkill: Record<string, SkillMediaItem[]> = {};
  if (mediaData?.length) {
    const resolved = await Promise.all(
      mediaData.map(async (m) => {
        const { data: signed } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(m.file_path, 3600);

        return {
          skill_id: m.skill_id,
          item: {
            id: m.id,
            media_type: m.media_type as 'photo' | 'video',
            url: signed?.signedUrl ?? '',
          },
        };
      }),
    );

    for (const { skill_id, item } of resolved) {
      if (!item.url) continue;
      mediaBySkill[skill_id] = [...(mediaBySkill[skill_id] ?? []), item];
    }
  }

  for (const skill of skillsData || []) {
    const list = byWorker.get(skill.worker_id) ?? [];
    list.push({
      id: skill.id,
      skill_name: skill.skill_name,
      proficiency_level: skill.proficiency_level,
      years_of_experience: skill.years_of_experience,
      media: mediaBySkill[skill.id] ?? [],
    });
    byWorker.set(skill.worker_id, list);
  }

  return byWorker;
}

export async function loadWorkerSkillsWithMedia(workerId: string): Promise<WorkerSkillWithMedia[]> {
  const map = await loadWorkersSkillsWithMedia([workerId]);
  return map.get(workerId) ?? [];
}
