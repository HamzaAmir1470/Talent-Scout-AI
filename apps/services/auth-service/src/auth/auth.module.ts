import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { requireSecret } from './secret';
import { AuditLog, AuditSchema } from './schemas/audit.schema';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: AuditLog.name, schema: AuditSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: requireSecret(cfg),
        signOptions: { expiresIn: cfg.get<string>('ACCESS_TOKEN_TTL', '15m') as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminService],
})
export class AuthModule {}
