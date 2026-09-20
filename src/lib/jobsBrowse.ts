const ANY_CATEGORY = 'All Categories';
const ANY_COUNTRY = 'All Countries';

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
