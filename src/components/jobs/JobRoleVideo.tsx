import { getPublicJobVideos } from '@/lib/uaeListedJobs';
import { mergeJobVideos } from '@/lib/youtubeUrl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface JobRoleVideoProps {
  title: string;
  description?: string;
  country?: string | null;
  youtubeUrls?: readonly string[] | null;
  /** Video files uploaded for this job. */
  videoUrls?: readonly string[] | null;
  /** Saved job copy does not pull in the trade-template clips. */
  useSavedCopy?: boolean;
}

function embedSrc(youtubeId: string, startSeconds?: number) {
  const params = new URLSearchParams();
  if (startSeconds && startSeconds > 0) params.set('start', String(startSeconds));
  const query = params.toString();
  return `https://www.youtube-nocookie.com/embed/${youtubeId}${query ? `?${query}` : ''}`;
}

export default function JobRoleVideo({
  title,
  description = '',
  country,
  youtubeUrls,
  videoUrls,
  useSavedCopy = false,
}: JobRoleVideoProps) {
  const saved = (youtubeUrls ?? []).filter((url) => url.trim());
  const files = (videoUrls ?? []).map((url) => url.trim()).filter(Boolean);
  const videos = useSavedCopy || saved.length
    ? mergeJobVideos(saved, [])
    : mergeJobVideos(null, getPublicJobVideos(title, description, country));
  if (videos.length === 0 && files.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>See the work</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {videos.map((video, index) => (
            <div
              key={`${video.youtubeId}-${index}`}
              className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted"
            >
              <iframe
                title={`${title} video ${index + 1}`}
                src={embedSrc(video.youtubeId, video.startSeconds)}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ))}
          {files.map((src) => (
            <div
              key={src}
              className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted"
            >
              <video
                title={`${title} video`}
                src={src}
                className="h-full w-full"
                controls
                playsInline
                preload="metadata"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
