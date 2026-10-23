import { Body, Controller, ForbiddenException, Get, HttpException, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { rpc } from '../rpc';
import { ChangePasswordDto, LoginDto, RegisterDto } from './auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

const COOKIE = 'tsa_rt';
const WEEK = 7 * 86_400_000;
type AuthResult = { accessToken: string; refreshToken: string; expiresIn: number; user: unknown };

@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private readonly client: ClientProxy) {}

  private ctx(req: Request) { return { ip: req.ip, userAgent: req.headers['user-agent'] }; }
  private cookieOptions(maxAge: number) {
    return { httpOnly: true, sameSite: 'strict' as const, path: '/', maxAge, secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true' };
  }
  private readCookie(req: Request): string | undefined {
    for (const part of (req.headers.cookie ?? '').split(';')) {
      const [k, ...v] = part.trim().split('=');
      if (k === COOKIE) return decodeURIComponent(v.join('='));
    }
    return undefined;
  }
  /** Refresh and logout use a cookie, so they also demand a custom header that cross-site forms cannot send. */
  private requireClientHeader(req: Request) {
    if (req.headers['x-tsa-client'] !== 'web') throw new ForbiddenException('Missing client header');
  }
  private respond(res: Response, r: AuthResult) {
    res.cookie(COOKIE, r.refreshToken, this.cookieOptions(WEEK));
    res.setHeader('Cache-Control', 'no-store');
    return { accessToken: r.accessToken, expiresIn: r.expiresIn, user: r.user };
  }

  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await rpc<AuthResult>(this.client, 'auth.register', { ...dto, ...this.ctx(req) }));
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await rpc<AuthResult>(this.client, 'auth.login', { ...dto, ...this.ctx(req) }));
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.requireClientHeader(req);
    try {
      return this.respond(res, await rpc<AuthResult>(this.client, 'auth.refresh', { refreshToken: this.readCookie(req), ...this.ctx(req) }));
    } catch (e) {
      if (e instanceof HttpException && e.getStatus() === 401) res.clearCookie(COOKIE, this.cookieOptions(0));
      throw e;
    }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.requireClientHeader(req);
    await rpc(this.client, 'auth.logout', { refreshToken: this.readCookie(req) });
    res.clearCookie(COOKIE, this.cookieOptions(0));
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(@Req() req: Request & { user: { sub: string } }, @Res({ passthrough: true }) res: Response) {
    await rpc(this.client, 'auth.logoutAll', { userId: req.user.sub });
    res.clearCookie(COOKIE, this.cookieOptions(0));
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request & { user: { sub: string } }) {
    return rpc(this.client, 'auth.profile', { userId: req.user.sub });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Req() req: Request & { user: { sub: string } }, @Body() dto: ChangePasswordDto, @Res({ passthrough: true }) res: Response) {
    await rpc(this.client, 'auth.changePassword', { userId: req.user.sub, current: dto.current, next: dto.next, ip: req.ip });
    res.clearCookie(COOKIE, this.cookieOptions(0));
    return { ok: true };
  }
}
