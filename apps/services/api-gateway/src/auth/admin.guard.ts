import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/** Use after JwtAuthGuard. Only tokens issued to an admin account pass. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user;
    if (user?.role !== 'admin') throw new ForbiddenException('Administrator access required');
    return true;
  }
}
