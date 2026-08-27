import { MapPin } from 'lucide-react';

const COUNTRIES: { code: string; name: string; image: string }[] = [
  {
    code: 'UAE',
    name: 'United Arab Emirates',
    image: '/country-insights/uae/worksite-skyline.png',
  },
];

interface Props {
  onSelect: (country: string) => void;
}

export default function JobCountryGrid({ onSelect }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Choose a country</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse verified jobs by destination. More countries will be added soon.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {COUNTRIES.map((country) => (
          <button
            key={country.code}
            type="button"
            onClick={() => onSelect(country.code)}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card text-left shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="relative h-40 w-full overflow-hidden sm:h-48">
              <img
                src={country.image}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/80">
                  <MapPin className="h-3.5 w-3.5" />
                  Destination
                </p>
                <p className="mt-1 font-heading text-xl font-semibold">{country.name}</p>
                <p className="text-sm text-white/85">{country.code}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
