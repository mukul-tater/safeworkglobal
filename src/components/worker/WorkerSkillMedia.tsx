import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, Loader2, Plus, Trash2, Video, Wrench } from 'lucide-react';
import ProfileSection from '@/components/profile/ProfileSection';
import SkillMediaGallery from '@/components/worker/SkillMediaGallery';

const STORAGE_BUCKET = 'worker-videos';

interface SkillMedia {
  id: string;
  media_type: 'photo' | 'video';
  file_path: string;
  url: string;
}

interface WorkerSkill {
  id: string;
  skill_name: string;
  years_of_experience: number | null;
  media: SkillMedia[];
}

interface WorkerSkillMediaProps {
  workerId: string;
}

async function resolveMediaUrl(filePath: string): Promise<string> {
  const { data } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(filePath, 3600);
  return data?.signedUrl ?? '';
}

export default function WorkerSkillMedia({ workerId }: WorkerSkillMediaProps) {
  const [skills, setSkills] = useState<WorkerSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillYears, setNewSkillYears] = useState('');
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const loadSkills = useCallback(async () => {
    if (!workerId) return;
    setLoading(true);
    try {
      const { data: skillRows, error: skillsError } = await supabase
        .from('worker_skills')
        .select('id, skill_name, years_of_experience')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: true });

      if (skillsError) throw skillsError;

      const skillIds = (skillRows ?? []).map((s) => s.id);
      let mediaRows: { id: string; skill_id: string; media_type: 'photo' | 'video'; file_path: string }[] = [];

      if (skillIds.length > 0) {
        const { data, error: mediaError } = await supabase
          .from('worker_skill_media')
          .select('id, skill_id, media_type, file_path')
          .in('skill_id', skillIds)
          .order('created_at', { ascending: true });

        if (mediaError) throw mediaError;
        mediaRows = (data ?? []) as typeof mediaRows;
      }

      const mediaWithUrls = await Promise.all(
        mediaRows.map(async (m) => ({
          ...m,
          url: await resolveMediaUrl(m.file_path),
        })),
      );

      const mediaBySkill = mediaWithUrls.reduce<Record<string, SkillMedia[]>>((acc, m) => {
        const entry: SkillMedia = {
          id: m.id,
          media_type: m.media_type,
          file_path: m.file_path,
          url: m.url,
        };
        acc[m.skill_id] = [...(acc[m.skill_id] ?? []), entry];
        return acc;
      }, {});

      setSkills(
        (skillRows ?? []).map((s) => ({
          id: s.id,
          skill_name: s.skill_name,
          years_of_experience: s.years_of_experience,
          media: mediaBySkill[s.id] ?? [],
        })),
      );
    } catch (err) {
      console.error('Failed to load skills:', err);
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    void loadSkills();
  }, [loadSkills]);

  const handleAddSkill = async () => {
    const name = newSkillName.trim();
    if (!name) {
      toast.error('Enter a skill name');
      return;
    }

    setSaving(true);
    try {
      const years = newSkillYears ? Number(newSkillYears) : null;
      const { error } = await supabase.from('worker_skills').insert({
        worker_id: workerId,
        skill_name: name,
        years_of_experience: Number.isFinite(years) ? years : null,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('You already added this skill');
        } else {
          throw error;
        }
        return;
      }

      setNewSkillName('');
      setNewSkillYears('');
      await loadSkills();
      toast.success('Skill added — upload a photo or video');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add skill';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('Remove this skill and all its photos/videos?')) return;

    setSaving(true);
    try {
      const skill = skills.find((s) => s.id === skillId);
      const paths = skill?.media.map((m) => m.file_path) ?? [];
      if (paths.length > 0) {
        await supabase.storage.from(STORAGE_BUCKET).remove(paths);
      }

      const { error } = await supabase.from('worker_skills').delete().eq('id', skillId);
      if (error) throw error;

      await loadSkills();
      toast.success('Skill removed');
    } catch {
      toast.error('Failed to remove skill');
    } finally {
      setSaving(false);
    }
  };

  const handleMediaUpload = async (file: File, type: 'photo' | 'video') => {
    if (!activeSkillId) return;

    if (type === 'photo' && !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (type === 'video' && !file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    if (type === 'video' && file.size > 50 * 1024 * 1024) {
      toast.error('Video must be less than 50MB');
      return;
    }
    if (type === 'photo' && file.size > 10 * 1024 * 1024) {
      toast.error('Photo must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || (type === 'photo' ? 'jpg' : 'mp4');
      const folder = type === 'photo' ? 'photos' : 'videos';
      const filePath = `${workerId}/skills/${activeSkillId}/${folder}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('worker_skill_media').insert({
        skill_id: activeSkillId,
        worker_id: workerId,
        media_type: type,
        file_path: filePath,
      });

      if (insertError) throw insertError;

      await loadSkills();
      toast.success(type === 'photo' ? 'Photo uploaded' : 'Video uploaded');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
      setActiveSkillId(null);
    }
  };

  const handleDeleteMedia = async (media: SkillMedia) => {
    setSaving(true);
    try {
      await supabase.storage.from(STORAGE_BUCKET).remove([media.file_path]);
      const { error } = await supabase.from('worker_skill_media').delete().eq('id', media.id);
      if (error) throw error;
      await loadSkills();
      toast.success(media.media_type === 'photo' ? 'Photo removed' : 'Video removed');
    } catch {
      toast.error('Failed to remove media');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileSection
      title="Skills & Work Proof"
      description="Add each skill separately, then upload photos or short videos as proof."
      icon={Wrench}
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end rounded-lg border border-dashed border-border/70 bg-muted/20 p-4">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="skill-name">Skill name</Label>
            <Input
              id="skill-name"
              placeholder="e.g. Welding, Electrical, Plumbing"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              disabled={saving || uploading}
              className="h-10 bg-background"
            />
          </div>
          <div className="w-full sm:w-24 space-y-1.5">
            <Label htmlFor="skill-years">Years</Label>
            <Input
              id="skill-years"
              type="number"
              min={0}
              max={50}
              placeholder="Yrs"
              value={newSkillYears}
              onChange={(e) => setNewSkillYears(e.target.value)}
              disabled={saving || uploading}
              className="h-10 bg-background"
            />
          </div>
          <Button
            type="button"
            onClick={handleAddSkill}
            disabled={saving || uploading || !newSkillName.trim()}
            className="h-10 shrink-0"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add
          </Button>
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleMediaUpload(file, 'photo');
            e.target.value = '';
          }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleMediaUpload(file, 'video');
            e.target.value = '';
          }}
        />

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && skills.length === 0 && (
          <div className="text-center py-10 rounded-lg border border-border/50 bg-muted/10">
            <Wrench className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">No skills yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Add a skill above, then upload a work photo or short video for each one.
            </p>
          </div>
        )}

        {!loading && skills.length > 0 && (
          <div className="space-y-3">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="rounded-lg border border-border/60 bg-muted/10 p-4 transition-colors hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-sm">{skill.skill_name}</p>
                    {skill.years_of_experience != null && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {skill.years_of_experience} years experience
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleDeleteSkill(skill.id)}
                    disabled={saving || uploading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="mb-3">
                  <SkillMediaGallery
                    items={skill.media}
                    label={skill.skill_name}
                    onDelete={handleDeleteMedia}
                    deleteDisabled={saving || uploading}
                    thumbnailPhotoClassName="h-20 w-20"
                    thumbnailVideoClassName="h-20 w-28"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={uploading}
                    onClick={() => {
                      setActiveSkillId(skill.id);
                      photoInputRef.current?.click();
                    }}
                  >
                    <Camera className="h-3.5 w-3.5 mr-1.5" />
                    Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={uploading}
                    onClick={() => {
                      setActiveSkillId(skill.id);
                      videoInputRef.current?.click();
                    }}
                  >
                    <Video className="h-3.5 w-3.5 mr-1.5" />
                    Video
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading...
          </p>
        )}
      </div>
    </ProfileSection>
  );
}
