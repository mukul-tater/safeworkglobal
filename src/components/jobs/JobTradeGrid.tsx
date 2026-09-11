import { HardHat } from 'lucide-react';
import electricalImg from '@/assets/trade-electrical.jpg';
import welderImg from '@/assets/trade-welder.jpg';
import constructionImg from '@/assets/trade-construction.jpg';
import { UAE_LISTED_JOBS, type UaeListedJob } from '@/lib/uaeListedJobs';

const TRADE_CARDS: Record<UaeListedJob, { image: string; city: string }> = {
  Electrician: { image: electricalImg, city: 'Dubai' },
  Welder: { image: welderImg, city: 'Sharjah' },
  Plumber: { image: '/country-insights/uae/worksite-business-bay-2.png', city: 'Abu Dhabi' },
  'Shuttering Carpenter': { image: '/country-insights/uae/worksite-rebar.png', city: 'Dubai' },
  'Mason (tiles/marble)': { image: constructionImg, city: 'Abu Dhabi' },
  'Construction Labour/Helper': { image: '/country-insights/uae/worksite-skyline.png', city: 'Dubai' },
  'Pipe Fitter': { image: '/country-insights/uae/worksite-business-bay-1.png', city: 'Dubai' },
  Carpenter: { image: '/country-insights/uae/worksite-business-bay-1.png', city: 'Abu Dhabi' },
  'Furniture Carpenter - Finishing, All Rounder': {
    image: '/country-insights/uae/worksite-business-bay-1.png',
    city: 'Dubai',
  },
  'Steel Fixer': { image: '/country-insights/uae/worksite-rebar.png', city: 'Sharjah' },
  'AC Technician': { image: electricalImg, city: 'Sharjah' },
  'General Labour - Warehouse/Supermarket': { image: '/country-insights/uae/worksite-crane.png', city: 'Dubai' },
  Scaffolder: { image: '/country-insights/uae/worksite-crane.png', city: 'Sharjah' },
  Painter: { image: constructionImg, city: 'Dubai' },
  'Aluminium Fixer/Fabricator': { image: welderImg, city: 'Sharjah' },
};

interface Props {
  onSelect: (job: UaeListedJob) => void;
}

export default function JobTradeGrid({ onSelect }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Choose a job</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse verified openings by trade. More jobs will be added soon.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {UAE_LISTED_JOBS.map((job) => {
          const card = TRADE_CARDS[job];
          return (
            <button
              key={job}
              type="button"
              onClick={() => onSelect(job)}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card text-left shadow-sm transition-colors hover:border-primary/40"
            >
              <div className="relative h-40 w-full overflow-hidden sm:h-48">
                <img
                  src={card.image}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/80">
                    <HardHat className="h-3.5 w-3.5" />
                    Job
                  </p>
                  <p className="mt-1 font-heading text-xl font-semibold leading-snug">{job}</p>
                  <p className="text-sm text-white/85">{card.city}, UAE</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
