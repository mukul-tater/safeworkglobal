import { supabase } from '@/integrations/supabase/client';

const STORAGE_BUCKET = 'worker-videos';

export interface SkillMediaItem {
  id: string;
  media_type: 'photo' | 'video';
  url: string;
  file_path?: string;
}

export interface WorkerSkillMediaFile extends SkillMediaItem {
  file_path: string;
}

export async function resolveSkillMediaUrl(filePath: string, expiresIn = 3600): Promise<string> {
  const { data } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(filePath, expiresIn);
  return data?.signedUrl ?? '';
}

/** All skill-proof photos/videos for a worker, with signed URLs for display. */
export async function loadWorkerSkillMediaItems(
  workerId: string,
  journeyJobId?: string | null,
): Promise<WorkerSkillMediaFile[]> {
  if (!workerId) return [];

  let query = supabase
    .from('worker_skill_media')
    .select('id, media_type, file_path')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: true });
  if (journeyJobId) {
    query = query.or(`journey_job_id.eq.${journeyJobId},journey_job_id.is.null`);
  }
  const { data, error } = await query;
  if (error) throw error;

  return Promise.all(
    (data ?? []).map(async (m) => {
      let url = '';
      try {
        url = await resolveSkillMediaUrl(m.file_path);
      } catch {
        url = '';
      }
      return {
        id: m.id,
        media_type: m.media_type as 'photo' | 'video',
        file_path: m.file_path,
        url,
      };
    }),
  );
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
        const signedUrl = await resolveSkillMediaUrl(m.file_path);

        return {
          skill_id: m.skill_id,
          item: {
            id: m.id,
            media_type: m.media_type as 'photo' | 'video',
            url: signedUrl,
            file_path: m.file_path,
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
