import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { parseYoutubeLink } from '@/lib/youtubeUrl';

interface JobYoutubeLinksFieldProps {
  urls: string[];
  onChange: (urls: string[]) => void;
}

export default function JobYoutubeLinksField({ urls, onChange }: JobYoutubeLinksFieldProps) {
  const [draft, setDraft] = useState('');

  const addLink = () => {
    const parsed = parseYoutubeLink(draft);
    if (!parsed) {
      toast.error('Paste a YouTube link, like https://www.youtube.com/watch?v=…');
      return;
    }

    const alreadyAdded = urls.some((url) => parseYoutubeLink(url)?.youtubeId === parsed.youtubeId);
    if (alreadyAdded) {
      toast.error('That video is already on this job');
      return;
    }

    onChange([...urls, parsed.url]);
    setDraft('');
  };

  const removeLink = (youtubeId: string) => {
    onChange(urls.filter((url) => parseYoutubeLink(url)?.youtubeId !== youtubeId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>See the work videos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Paste a YouTube link and add it. There is no limit. These play in See the work on the job page, along with the clips already shown for this trade.
        </p>
        <div className="flex gap-2">
          <Input
            value={draft}
            placeholder="https://www.youtube.com/watch?v=…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addLink();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addLink}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
        {urls.length > 0 && (
          <ul className="space-y-2">
            {urls.map((url) => {
              const parsed = parseYoutubeLink(url);
              if (!parsed) return null;
              return (
                <li
                  key={parsed.youtubeId}
                  className="flex items-center gap-3 rounded-lg border border-border p-2"
                >
                  <img
                    src={`https://i.ytimg.com/vi/${parsed.youtubeId}/mqdefault.jpg`}
                    alt=""
                    className="h-12 w-20 shrink-0 rounded-md object-cover bg-muted"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{parsed.url}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove video"
                    onClick={() => removeLink(parsed.youtubeId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
