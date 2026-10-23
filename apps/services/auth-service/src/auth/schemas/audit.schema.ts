import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class AuditLog {
  @Prop({ default: () => new Date() }) at: Date;
  @Prop() actorId?: string;
  @Prop() actorEmail?: string;
  @Prop({ required: true, index: true }) action: string;
  @Prop() target?: string;
  @Prop({ type: Object }) meta?: Record<string, unknown>;
  @Prop() ip?: string;
}
export type AuditDocument = HydratedDocument<AuditLog>;
export const AuditSchema = SchemaFactory.createForClass(AuditLog);
AuditSchema.index({ at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 }); // keep 180 days
