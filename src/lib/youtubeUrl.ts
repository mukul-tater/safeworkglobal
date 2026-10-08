export type YoutubeLink = {
  youtubeId: string;
  startSeconds?: number;
  /** Canonical watch URL stored on the job. */
  url: string;
};

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
]);

function parseStartSeconds(raw: string | null | undefined): number | undefined {
  if (!raw) return undefined;
  const value = raw.trim().toLowerCase();
  if (!value) return undefined;

  let total = 0;
  if (/^\d+s?$/.test(value)) {
    total = Number(value.replace(/s$/, ''));
  } else {
    const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    if (!match || match[0] === '') return undefined;
    total = Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
  }

  if (!Number.isFinite(total) || total <= 0 || total > 48 * 3600) return undefined;
  return total;
}

/** Accept a pasted YouTube watch, share, shorts, or embed link. */
export function parseYoutubeLink(input: string): YoutubeLink | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 500) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.hostname.replace(/^www\./i, '').toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  const parts = url.pathname.split('/').filter(Boolean);
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = parts[0] ?? null;
  } else if (parts[0] === 'watch') {
    id = url.searchParams.get('v');
  } else if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live' || parts[0] === 'v') {
    id = parts[1] ?? null;
  }

  if (!id || !VIDEO_ID.test(id)) return null;

  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const startSeconds = parseStartSeconds(
    url.searchParams.get('start') ||
      url.searchParams.get('t') ||
      url.searchParams.get('time_continue') ||
      hashParams.get('t'),
  );

  const canonical = startSeconds
    ? `https://www.youtube.com/watch?v=${id}&t=${startSeconds}s`
    : `https://www.youtube.com/watch?v=${id}`;

  return startSeconds ? { youtubeId: id, startSeconds, url: canonical } : { youtubeId: id, url: canonical };
}

export function mergeJobVideos<T extends { youtubeId: string }>(
  youtubeUrls: readonly string[] | null | undefined,
  catalog: readonly T[],
): Array<T | { youtubeId: string; startSeconds?: number }> {
  const admin = (youtubeUrls ?? [])
    .map((url) => parseYoutubeLink(url))
    .filter((video): video is YoutubeLink => video !== null);

  const seen = new Set(admin.map((video) => video.youtubeId));
  const extra = catalog.filter((video) => !seen.has(video.youtubeId));

  return [
    ...admin.map((video) => ({ youtubeId: video.youtubeId, startSeconds: video.startSeconds })),
    ...extra,
  ];
}
