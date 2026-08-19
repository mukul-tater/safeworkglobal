import type { CountryInsight } from "../types";
import { DisclaimerBox, SectionShell } from "./SectionShell";
import { PhotoTile } from "./PhotoTile";

export function AccommodationGallery({ country }: { country: CountryInsight }) {
  const data = country.accommodation;
  return (
    <SectionShell id="accommodation" heading={data.heading} subheading={data.subheading}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {data.photos.map((photo) => (
          <PhotoTile key={photo.id} photo={photo} />
        ))}
      </div>
      <DisclaimerBox text={data.disclaimer} />
    </SectionShell>
  );
}

export function LivingConditions({ country }: { country: CountryInsight }) {
  const data = country.livingConditions;
  return (
    <SectionShell id="living-conditions" heading={data.heading}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {data.photos.map((photo) => (
          <PhotoTile key={photo.id} photo={photo} />
        ))}
      </div>
      <DisclaimerBox text={data.info} />
    </SectionShell>
  );
}

export function RealPhotosGallery({ country }: { country: CountryInsight }) {
  const data = country.photoGallery;
  return (
    <SectionShell id="real-photos" heading={data.heading}>
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {data.categories.map((cat) => (
          <span
            key={cat.en}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium"
          >
            {cat.en}
          </span>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {data.photos.map((photo) => (
          <PhotoTile key={photo.id} photo={photo} />
        ))}
      </div>
      <DisclaimerBox text={data.disclaimer} />
    </SectionShell>
  );
}
