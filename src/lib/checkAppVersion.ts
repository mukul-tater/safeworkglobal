const RELOADED_FOR_KEY = 'swg:reloaded-for-build'

function currentBuildId(): string {
  return typeof __SWG_BUILD_ID__ === 'string' ? __SWG_BUILD_ID__ : ''
}

async function remoteBuildId(): Promise<string | null> {
  const res = await fetch(`/version.json?t=${Date.now()}`, {
    cache: 'no-store',
    credentials: 'omit',
  })
  if (!res.ok) return null
  const data = (await res.json()) as { buildId?: unknown }
  return typeof data.buildId === 'string' && data.buildId ? data.buildId : null
}

async function applyNewBuildIfAvailable() {
  const local = currentBuildId()
  if (!local) return

  let remote: string | null
  try {
    remote = await remoteBuildId()
  } catch {
    return
  }
  if (!remote || remote === local) return

  try {
    if (sessionStorage.getItem(RELOADED_FOR_KEY) === remote) return
    sessionStorage.setItem(RELOADED_FOR_KEY, remote)
  } catch {
    // Private mode may block sessionStorage; still reload once this visit.
  }

  window.location.reload()
}

/** Reload once when a newer production build is live (open tabs / home-screen). */
export function startBuildVersionWatcher() {
  if (!import.meta.env.PROD) return

  void applyNewBuildIfAvailable()

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void applyNewBuildIfAvailable()
  })

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) void applyNewBuildIfAvailable()
  })
}
