import { ConfigService } from '@nestjs/config';

/** Refuses to start with a missing or weak signing secret in production. */
export function requireSecret(cfg: ConfigService): string {
  const s = cfg.get<string>('JWT_SECRET') ?? '';
  const weak = s.length < 32 || /change-?me|secret|password/i.test(s);
  if (!s || (cfg.get('NODE_ENV') === 'production' && weak)) {
    throw new Error('JWT_SECRET must be a random string of at least 32 characters');
  }
  if (weak) console.warn('[security] JWT_SECRET looks weak. Use a random value of 32 or more characters before deploying.');
  return s;
}
