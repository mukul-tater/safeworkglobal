import { getPublicJobVideo } from '@/lib/uaeListedJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface JobRoleVideoProps {
  title: string;
  description?: string;
}

export default function JobRoleVideo({ title, description = '' }: JobRoleVideoProps) {
  const video = getPublicJobVideo(title, description);
  if (!video) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>See the work</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
          <iframe
            title={video.caption}
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
          />
        </div>
        <p className="text-sm text-muted-foreground">{video.caption}</p>
      </CardContent>
    </Card>
  );
}
