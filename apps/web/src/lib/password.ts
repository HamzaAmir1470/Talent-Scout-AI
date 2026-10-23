const COMMON = ['password', 'password1', 'password123', '12345678', '123456789', 'qwerty123', 'iloveyou', 'admin123', 'welcome123', 'letmein123'];

export interface PasswordCheck { score: number; ok: boolean; rules: { label: string; ok: boolean }[] }

/** Mirrors the server rules so people see problems before they submit. The server still enforces them. */
export function checkPassword(pw: string, email = ''): PasswordCheck {
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  const rules = [
    { label: 'At least 10 characters', ok: pw.length >= 10 },
    { label: 'Letters and numbers', ok: /[A-Za-z]/.test(pw) && /\d/.test(pw) },
    { label: 'Not a common password or your email name', ok: pw.length > 0 && !COMMON.includes(pw.toLowerCase()) && !(local.length >= 4 && pw.toLowerCase().includes(local)) },
  ];
  const bonus = [/[^A-Za-z0-9]/.test(pw), pw.length >= 14].filter(Boolean).length;
  const base = rules.filter((r) => r.ok).length;
  return { rules, ok: rules.every((r) => r.ok) && pw.length <= 72, score: base === 3 ? 2 + bonus : Math.min(base, 1) };
}
