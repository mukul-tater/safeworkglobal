import { Camera } from "lucide-react";
import type { PhotoRecord } from "../types";
import { BiInline } from "./Bi";

export function PhotoTile({ photo }: { photo: PhotoRecord }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-muted/40">
      {photo.src ? (
        <img
          src={photo.src}
          alt={photo.alt.en}
          loading="lazy"
          className="h-44 w-full object-cover sm:h-56"
        />
      ) : (
        <div className="flex h-40 sm:h-48 flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/40 px-3 text-center">
          <Camera className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground leading-snug">
            <BiInline text={{ en: "Photo to be added after verification.", hi: "सत्यापन के बाद फोटो जोड़ी जाएगी।" }} />
          </p>
        </div>
      )}
      <figcaption className="p-3 space-y-0.5 text-xs text-muted-foreground">
        {photo.category && <p className="font-semibold text-foreground text-sm">{photo.category}</p>}
        <p>
          <BiInline text={photo.alt} />
        </p>
        <p>Location: {photo.location ?? "To be updated after verification."}</p>
        <p>Date: {photo.date ?? "To be updated after verification."}</p>
        <p>Source: {photo.source ?? "To be updated after verification."}</p>
        {photo.caption && (
          <p>
            <BiInline text={photo.caption} />
          </p>
        )}
      </figcaption>
    </figure>
  );
}
