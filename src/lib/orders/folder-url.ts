/**
 * Normalize a staff-pasted folder link (e.g. Google Drive) for storage.
 * Empty input becomes null. Non-empty invalid URLs are rejected by the API.
 */
export function normalizeDesignFolderUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}
