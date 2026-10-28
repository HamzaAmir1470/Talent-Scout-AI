import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AdminService } from './admin.service';
import { AuthService } from './auth.service';
import { ProgressService } from './progress.service';

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly admin: AdminService, private readonly progress: ProgressService) {}

  @MessagePattern('health.ping') ping() { return 'pong'; }
  @MessagePattern('auth.register') register(@Payload() d: any) { return this.auth.register(d); }
  @MessagePattern('auth.login') login(@Payload() d: any) { return this.auth.login(d); }
  @MessagePattern('auth.refresh') refresh(@Payload() d: any) { return this.auth.refresh(d); }
  @MessagePattern('auth.logout') logout(@Payload() d: any) { return this.auth.logout(d); }
  @MessagePattern('auth.logoutAll') logoutAll(@Payload() d: { userId: string }) { return this.auth.revokeAll(d.userId); }
  @MessagePattern('auth.profile') profile(@Payload() d: { userId: string }) { return this.auth.profile(d.userId); }
  @MessagePattern('auth.changePassword') changePassword(@Payload() d: any) { return this.auth.changePassword(d); }
  @MessagePattern('auth.forgotPassword') forgot(@Payload() d: any) { return this.auth.forgotPassword(d); }
  @MessagePattern('auth.resetPassword') reset(@Payload() d: any) { return this.auth.resetPassword(d); }
  @MessagePattern('auth.progress.get') progressGet(@Payload() d: { userId: string }) { return this.progress.get(d.userId); }
  @MessagePattern('auth.progress.put') progressPut(@Payload() d: any) { return this.progress.put(d); }
  @MessagePattern('auth.audit') audit(@Payload() d: any) { return this.auth.audit(d); }

  @MessagePattern('auth.admin.listUsers') listUsers(@Payload() d: any) { return this.admin.listUsers(d); }
  @MessagePattern('auth.admin.usersByIds') usersByIds(@Payload() d: { ids: string[] }) { return this.admin.usersByIds(d.ids); }
  @MessagePattern('auth.admin.updateUser') updateUser(@Payload() d: any) { return this.admin.updateUser(d); }
  @MessagePattern('auth.admin.revokeSessions') revoke(@Payload() d: any) { return this.admin.revokeSessions(d); }
  @MessagePattern('auth.admin.deleteUser') deleteUser(@Payload() d: any) { return this.admin.deleteUser(d); }
  @MessagePattern('auth.admin.stats') stats() { return this.admin.stats(); }
  @MessagePattern('auth.admin.listAudit') listAudit(@Payload() d: any) { return this.admin.listAudit(d); }
}
