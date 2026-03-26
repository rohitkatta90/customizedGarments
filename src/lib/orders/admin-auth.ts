export function verifyAdminSession(cookieValue: string | undefined): boolean {
  const expected = process.env.ADMIN_SESSION_TOKEN;
  if (!expected || !cookieValue) return false;
  return cookieValue === expected;
}

export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_TOKEN,
  );
}
