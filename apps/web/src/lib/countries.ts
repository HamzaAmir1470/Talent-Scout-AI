export const COUNTRIES: [code: string, dial: string, name: string][] = [
  ['PK', '+92', 'Pakistan'], ['US', '+1', 'United States'], ['GB', '+44', 'United Kingdom'], ['IN', '+91', 'India'],
  ['AE', '+971', 'United Arab Emirates'], ['SA', '+966', 'Saudi Arabia'], ['CA', '+1', 'Canada'], ['AU', '+61', 'Australia'],
  ['DE', '+49', 'Germany'], ['FR', '+33', 'France'], ['NL', '+31', 'Netherlands'], ['ES', '+34', 'Spain'], ['IT', '+39', 'Italy'],
  ['TR', '+90', 'Türkiye'], ['EG', '+20', 'Egypt'], ['NG', '+234', 'Nigeria'], ['KE', '+254', 'Kenya'], ['ZA', '+27', 'South Africa'],
  ['BD', '+880', 'Bangladesh'], ['LK', '+94', 'Sri Lanka'], ['ID', '+62', 'Indonesia'], ['MY', '+60', 'Malaysia'], ['SG', '+65', 'Singapore'],
  ['PH', '+63', 'Philippines'], ['BR', '+55', 'Brazil'], ['MX', '+52', 'Mexico'],
];

/** Picks a starting country from the browser language, for example en-PK. */
export function guessCountry(): string {
  const region = typeof navigator !== 'undefined' ? navigator.language.split('-')[1]?.toUpperCase() : undefined;
  return COUNTRIES.some(([c]) => c === region) ? region! : 'US';
}

/** Builds an E.164 number such as +923001234567, or null when the digits are not plausible. */
export function toE164(country: string, national: string): string | null {
  const dial = COUNTRIES.find(([c]) => c === country)?.[1] ?? '+1';
  const digits = national.replace(/\D/g, '').replace(/^0+/, '');
  const full = dial + digits;
  return /^\+[1-9]\d{7,14}$/.test(full) ? full : null;
}
