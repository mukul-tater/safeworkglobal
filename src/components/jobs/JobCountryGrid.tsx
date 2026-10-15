import { useState } from 'react';
import { MapPin } from 'lucide-react';
import HindiText from '@/components/indian-workforce/HindiText';

const UAE_EMIRATES: { name: string; hindi?: boolean }[] = [
  { name: 'Abu Dhabi' },
  { name: 'दुबई', hindi: true },
  { name: 'Sharjah' },
  { name: 'Ajman' },
  { name: 'Umm Al Quwain' },
  { name: 'Ras Al Khaimah' },
  { name: 'Fujairah' },
];

const UKRAINE_PLACES = [
  { name: 'Rivne' },
  { name: 'Cherkasy' },
  { name: 'Kyiv Region' },
  { name: 'Makariv' },
  { name: 'Khmelnytskyi' },
];

const CZECH_PLACES = [
  { name: 'Choceň' },
  { name: 'Rajhrad' },
  { name: 'Žiželice' },
  { name: 'Slaný' },
  { name: 'Beroun' },
];

type DestinationCard = {
  key: string;
  image: string;
  position: string;
  title: { hi: string; en: string };
  places: { name: string; hindi?: boolean }[];
  /** Country written to /jobs?country= when this card is a final choice. */
  country?: string;
  /** Opens the Europe destinations instead of a job list. */
  opensEurope?: boolean;
};

const ROOT_CARDS: DestinationCard[] = [
  {
    key: 'UAE',
    image: '/country-insights/uae/dubai-skyline.jpg',
    position: 'center 42%',
    title: { hi: 'दुबई', en: 'UAE' },
    places: UAE_EMIRATES,
    country: 'UAE',
  },
  {
    key: 'Europe',
    image: '/country-insights/europe/prague.jpg',
    position: 'center 42%',
    title: { hi: 'यूरोप', en: 'Europe' },
    places: [{ name: 'Ukraine' }, { name: 'Czech Republic' }],
    opensEurope: true,
  },
];

const EUROPE_CARDS: DestinationCard[] = [
  {
    key: 'Ukraine',
    image: '/country-insights/ukraine/kyiv.jpg',
    position: 'center 45%',
    title: { hi: 'यूक्रेन', en: 'Ukraine' },
    places: UKRAINE_PLACES,
    country: 'Ukraine',
  },
  {
    key: 'Czech Republic',
    image: '/country-insights/europe/prague.jpg',
    position: 'center 42%',
    title: { hi: 'चेक गणराज्य', en: 'Czech Republic' },
    places: CZECH_PLACES,
    country: 'Europe',
  },
];

interface Props {
  onSelect: (country: string) => void;
}

export default function JobCountryGrid({ onSelect }: Props) {
  const [europeOpen, setEuropeOpen] = useState(false);
  const cards = europeOpen ? EUROPE_CARDS : ROOT_CARDS;

  return (
    <div className="space-y-4">
      {europeOpen ? (
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setEuropeOpen(false)}
        >
          ← All countries
        </button>
      ) : null}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          {europeOpen ? 'Europe' : 'Choose a country'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {europeOpen
            ? 'Ukraine and Czech Republic.'
            : 'Browse verified jobs by destination. More countries will be added soon.'}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => {
              if (card.opensEurope) {
                setEuropeOpen(true);
                return;
              }
              if (card.country) onSelect(card.country);
            }}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card text-left shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="relative h-40 w-full overflow-hidden sm:h-48">
              <img
                src={card.image}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                style={{ objectPosition: card.position }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/80">
                  <MapPin className="h-3.5 w-3.5" />
                  Destination
                </p>
                <p className="mt-1 font-heading text-xl font-semibold">
                  <HindiText className="inline">{card.title.hi}</HindiText>
                  {' - '}
                  {card.title.en}
                </p>
                <p className="mt-0.5 text-sm leading-snug text-white/85">
                  {card.places.map((place, index) => (
                    <span key={place.name}>
                      {index > 0 ? ' · ' : null}
                      {place.hindi ? (
                        <HindiText className="inline">{place.name}</HindiText>
                      ) : (
                        place.name
                      )}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
