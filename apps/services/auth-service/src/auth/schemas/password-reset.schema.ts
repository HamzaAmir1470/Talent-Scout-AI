import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class PasswordReset {
  @Prop({ required: true, index: true }) userId: string;
  @Prop({ required: true, unique: true }) tokenHash: string;
  @Prop({ required: true }) expiresAt: Date;
  @Prop() usedAt?: Date;
}
export type PasswordResetDocument = HydratedDocument<PasswordReset>;
export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
