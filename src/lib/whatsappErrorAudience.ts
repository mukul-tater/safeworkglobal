const STAFF_ROLES = new Set(["admin", "partner", "employer", "interviewer"]);

/** Portals where the signed-in person is staff, not a worker. */
const STAFF_PREFIXES = ["/admin", "/partner", "/employer", "/emitra", "/interviewer"];

let audienceRole: string | null = null;

export function setWhatsAppErrorAudienceRole(role: string | null) {
  audienceRole = role;
}

export function isStaffPortalPath(pathname: string) {
  const path = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  return STAFF_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * WhatsApp "forward this error" is for workers and guests on public pages.
 * Staff roles and staff portals never see it, including before login.
 */
export function shouldOfferWhatsAppErrorHelp(
  pathname = typeof window !== "undefined" ? window.location.pathname : "/",
  role: string | null = audienceRole,
) {
  if (role && STAFF_ROLES.has(role)) return false;
  return !isStaffPortalPath(pathname);
}
