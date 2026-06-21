import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SkillMediaGalleryItem {
  id: string;
  media_type: 'photo' | 'video';
  url: string;
}

interface SkillMediaGalleryProps {
  items: SkillMediaGalleryItem[];
  label?: string;
  onDelete?: (item: SkillMediaGalleryItem) => void;
  deleteDisabled?: boolean;
  emptyMessage?: string;
  thumbnailPhotoClassName?: string;
  thumbnailVideoClassName?: string;
}

export default function SkillMediaGallery({
  items,
  label,
  onDelete,
  deleteDisabled = false,
  emptyMessage,
  thumbnailPhotoClassName = 'h-20 w-20',
  thumbnailVideoClassName = 'h-20 w-28',
}: SkillMediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isOpen = lightboxIndex !== null;
  const current = isOpen && lightboxIndex !== null ? items[lightboxIndex] : null;

  const goPrev = useCallback(() => {
    setLightboxIndex((idx) => {
      if (idx === null || items.length === 0) return idx;
      return (idx - 1 + items.length) % items.length;
    });
  }, [items.length]);

  const goNext = useCallback(() => {
    setLightboxIndex((idx) => {
      if (idx === null || items.length === 0) return idx;
      return (idx + 1) % items.length;
    });
  }, [items.length]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxIndex(null);
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'ArrowRight') goNext();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, goPrev, goNext]);

  if (items.length === 0) {
    return emptyMessage ? (
      <p className="text-xs text-muted-foreground italic">{emptyMessage}</p>
    ) : null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <div key={item.id} className="relative group">
            <button
              type="button"
              onClick={() => setLightboxIndex(index)}
              className={cn(
                'relative overflow-hidden rounded-lg border border-border/60 bg-black/5',
                'ring-offset-background transition hover:ring-2 hover:ring-primary/40 focus:outline-none focus:ring-2 focus:ring-primary',
                item.media_type === 'photo' ? thumbnailPhotoClassName : thumbnailVideoClassName,
              )}
              aria-label={`View full screen ${item.media_type} ${index + 1}${label ? ` for ${label}` : ''}`}
            >
              {item.media_type === 'photo' ? (
                <img
                  src={item.url}
                  alt={label ?? 'Skill photo'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <video
                    src={item.url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="h-6 w-6 text-white drop-shadow" />
                  </span>
                </>
              )}
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(item);
                }}
                disabled={deleteDisabled}
                className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive text-destructive-foreground p-0.5 shadow-sm disabled:opacity-50"
                aria-label={`Remove ${item.media_type}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {isOpen && current && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={label ? `${label} media viewer` : 'Media viewer'}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white shrink-0">
            <div className="min-w-0">
              {label && <p className="text-sm font-medium truncate">{label}</p>}
              <p className="text-xs text-white/70 capitalize">
                {current.media_type} · {lightboxIndex! + 1} of {items.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="rounded-full p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label="Close full screen viewer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4 pb-6 min-h-0">
            {items.length > 1 && (
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 sm:left-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <div className="flex h-full w-full max-h-[calc(100vh-5rem)] max-w-[100vw] items-center justify-center">
              {current.media_type === 'photo' ? (
                <img
                  src={current.url}
                  alt={label ?? 'Skill photo'}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <video
                  key={current.id}
                  src={current.url}
                  className="max-h-full max-w-full object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              )}
            </div>

            {items.length > 1 && (
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 sm:right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
