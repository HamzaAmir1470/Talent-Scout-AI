const COMMON = new Set(['password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwertyuiop', 'qwerty123',
  'iloveyou', 'admin123', 'welcome123', 'letmein123', 'abc12345', '11111111', 'passw0rd', 'p@ssw0rd', 'changeme123', 'talentscout']);

/** Returns a human readable problem, or null when the password is acceptable. */
export function passwordProblem(pw: string, email?: string): string | null {
  if (typeof pw !== 'string' || pw.length < 10) return 'Password must be at least 10 characters';
  if (pw.length > 72) return 'Password must be at most 72 characters';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password needs both letters and numbers';
  if (COMMON.has(pw.toLowerCase())) return 'That password is too common';
  const local = email?.split('@')[0]?.toLowerCase();
  if (local && local.length >= 4 && pw.toLowerCase().includes(local)) return 'Password must not contain your email name';
  return null;
}
