import { supabase } from '@/integrations/supabase/client';

export const JOB_MEDIA_BUCKET = 'job-media';
export const MAX_JOB_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_JOB_VIDEO_BYTES = 50 * 1024 * 1024;

export type JobMediaKind = 'accommodation' | 'videos';

export type PendingJobMedia = {
  id: string;
  file: File;
  previewUrl: string;
};

const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);

function fileType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'webm') return 'video/webm';
  return '';
}

function extension(type: string): string {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'video/webm') return 'webm';
  return 'mp4';
}

export function assertJobMediaFile(kind: JobMediaKind, file: File): string {
  const type = fileType(file);
  if (kind === 'accommodation') {
    if (!PHOTO_TYPES.has(type)) throw new Error('Use a JPEG, PNG, or WebP photo');
    if (file.size > MAX_JOB_PHOTO_BYTES) throw new Error('Each photo must be under 5 MB');
  } else {
    if (!VIDEO_TYPES.has(type)) throw new Error('Use an MP4 or WebM video');
    if (file.size > MAX_JOB_VIDEO_BYTES) throw new Error('Each video must be under 50 MB');
  }
  return type;
}

export function mediaUrlsFromText(value: string | null | undefined): string[] {
  return (value || '').split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

export async function uploadJobMediaFile(jobId: string, kind: JobMediaKind, file: File): Promise<string> {
  const type = assertJobMediaFile(kind, file);
  const path = `${jobId}/${kind}/${crypto.randomUUID()}.${extension(type)}`;
  const { error } = await supabase.storage.from(JOB_MEDIA_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: type,
  });
  if (error) throw new Error(error.message || 'Upload failed');
  const { data } = supabase.storage.from(JOB_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function jobMediaPathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${JOB_MEDIA_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index < 0) return null;
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
}

export async function deleteJobMediaUrl(url: string): Promise<void> {
  const path = jobMediaPathFromPublicUrl(url);
  if (!path) return;
  await supabase.storage.from(JOB_MEDIA_BUCKET).remove([path]);
}

export async function uploadPendingJobMedia(
  jobId: string,
  kind: JobMediaKind,
  pending: readonly PendingJobMedia[],
): Promise<string[]> {
  const urls: string[] = [];
  for (const item of pending) {
    urls.push(await uploadJobMediaFile(jobId, kind, item.file));
  }
  return urls;
}

export function releasePendingJobMedia(pending: readonly PendingJobMedia[]) {
  for (const item of pending) URL.revokeObjectURL(item.previewUrl);
}
