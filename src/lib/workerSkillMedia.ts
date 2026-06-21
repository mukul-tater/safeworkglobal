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

export async function loadWorkerSkillsWithMedia(workerId: string): Promise<WorkerSkillWithMedia[]> {
  const { data: skillsData, error: skillsError } = await supabase
    .from('worker_skills')
    .select('id, skill_name, proficiency_level, years_of_experience')
    .eq('worker_id', workerId);

  if (skillsError) throw skillsError;
  if (!skillsData?.length) return [];

  const skillIds = skillsData.map((s) => s.id);
  const { data: mediaData, error: mediaError } = await supabase
    .from('worker_skill_media')
    .select('id, skill_id, media_type, file_path')
    .in('skill_id', skillIds)
    .order('created_at', { ascending: true });

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

  return skillsData.map((skill) => ({
    ...skill,
    media: mediaBySkill[skill.id] ?? [],
  }));
}
