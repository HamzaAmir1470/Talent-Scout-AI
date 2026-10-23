import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/** Read-through cache. Uses Redis when REDIS_URL is reachable, otherwise a small in-memory map. */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis?: Redis;
  private readonly mem = new Map<string, { v: string; exp: number }>();

  constructor(cfg: ConfigService) {
    const url = cfg.get<string>('REDIS_URL');
    if (url) {
      this.redis = new Redis(url, { maxRetriesPerRequest: 1, enableOfflineQueue: false, retryStrategy: (n) => Math.min(n * 500, 5000) });
      this.redis.on('error', () => undefined);
    }
  }

  async wrap<T>(key: string, ttlSec: number, load: () => Promise<T>): Promise<T> {
    const hit = await this.get(key);
    if (hit !== null) return JSON.parse(hit) as T;
    const value = await load();
    await this.set(key, JSON.stringify(value), ttlSec);
    return value;
  }

  private async get(key: string): Promise<string | null> {
    try {
      if (this.redis?.status === 'ready') return await this.redis.get(key);
    } catch { /* fall through */ }
    const m = this.mem.get(key);
    return m && m.exp > Date.now() ? m.v : null;
  }

  private async set(key: string, value: string, ttlSec: number) {
    try {
      if (this.redis?.status === 'ready') { await this.redis.set(key, value, 'EX', ttlSec); return; }
    } catch { /* fall through */ }
    if (this.mem.size > 500) this.mem.clear();
    this.mem.set(key, { v: value, exp: Date.now() + ttlSec * 1000 });
  }

  /** Drops every cached entry whose key starts with the prefix (used after admin content edits). */
  async invalidate(prefix: string) {
    for (const k of [...this.mem.keys()]) if (k.startsWith(prefix)) this.mem.delete(k);
    try {
      if (this.redis?.status !== 'ready') return;
      let cursor = '0';
      do {
        const [next, keys] = await this.redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200);
        cursor = next;
        if (keys.length) await this.redis.del(...keys);
      } while (cursor !== '0');
    } catch { /* cache is best effort */ }
  }

  async onModuleDestroy() { await this.redis?.quit().catch(() => undefined); }
}
