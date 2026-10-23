import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

/** Socket.IO adapter with CORS and an optional Redis backplane so several AI instances can share rooms. */
export class RedisIoAdapter extends IoAdapter {
  private readonly log = new Logger('RedisIoAdapter');
  private factory?: ReturnType<typeof createAdapter>;

  constructor(app: INestApplicationContext, private readonly origins: string[], private readonly redisUrl?: string) {
    super(app);
  }

  async connectToRedis() {
    if (!this.redisUrl) return;
    try {
      const pub = createClient({ url: this.redisUrl, socket: { reconnectStrategy: false } });
      const sub = pub.duplicate();
      pub.on('error', () => undefined);
      sub.on('error', () => undefined);
      await Promise.race([
        Promise.all([pub.connect(), sub.connect()]),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2500)),
      ]);
      this.factory = createAdapter(pub, sub);
      this.log.log('Socket.IO Redis adapter enabled');
    } catch {
      this.log.warn('Redis unavailable, running a single-node Socket.IO server');
    }
  }

  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: this.origins, credentials: true },
      maxHttpBufferSize: 2e6,
    });
    if (this.factory) server.adapter(this.factory);
    return server;
  }
}
