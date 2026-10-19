const ANY_CATEGORY = 'All Categories';
const ANY_COUNTRY = 'All Countries';

/** Europe pay is stored as the vacancy text, including hourly rates. */
export function usesStoredPayText(country?: string | null): boolean {
  return (country ?? '').trim().toLowerCase() === 'europe';
}

/** Inclusive age band saved on the job, for cards and the job page. */
export function formatAgeRange(min?: number | null, max?: number | null): string | null {
  if (min != null && max != null) return `Age ${min}–${max}`;
  if (min != null) return `Age ${min}+`;
  if (max != null) return `Up to age ${max}`;
  return null;
}

/** New order on each call. Used so the homepage mix is not always the newest six. */
export function shuffleItems<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/** "Rivne Region, Ukraine". Skip a repeated country when the city was not given. */
export function formatJobPlace(location?: string | null, country?: string | null): string {
  const loc = (location ?? '').trim();
  const cty = (country ?? '').trim();
  if (!loc) return cty;
  if (!cty || loc.toLowerCase() === cty.toLowerCase()) return loc;
  return `${loc}, ${cty}`;
}

export function browseFromSearchParams(searchParams: URLSearchParams): {
  keyword: string;
  country: string;
  jobCategory: string;
} {
  const keyword = searchParams.get('keyword') || '';
  const jobCategory = searchParams.get('category') || ANY_CATEGORY;
  const countryParam = searchParams.get('country') || searchParams.get('location') || '';
  const country =
    countryParam && countryParam !== ANY_COUNTRY
      ? countryParam
      : keyword || jobCategory !== ANY_CATEGORY
        ? 'UAE'
        : ANY_COUNTRY;

  return { keyword, country, jobCategory };
}

/** Shareable Find-jobs URL for the country → category → list wizard. */
export function jobsBrowsePath(opts: {
  country?: string | null;
  category?: string | null;
  keyword?: string | null;
}): string {
  const params = new URLSearchParams();
  const keyword = opts.keyword?.trim();
  if (keyword) params.set('keyword', keyword);
  if (opts.country && opts.country !== ANY_COUNTRY) params.set('country', opts.country);
  if (opts.category && opts.category !== ANY_CATEGORY) params.set('category', opts.category);
  const qs = params.toString();
  return qs ? `/jobs?${qs}` : '/jobs';
}
