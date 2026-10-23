import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** Only a SHA-256 hash of each refresh token is stored, so a database leak cannot be replayed. */
@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ required: true, index: true }) userId: string;
  @Prop({ required: true, unique: true }) tokenHash: string;
  @Prop({ required: true, index: true }) family: string;
  @Prop({ required: true }) expiresAt: Date;
  @Prop() revokedAt?: Date;
  @Prop() replacedByHash?: string;
  @Prop() userAgent?: string;
  @Prop() ip?: string;
}
export type RefreshTokenDocument = HydratedDocument<RefreshToken>;
export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // expired tokens delete themselves
