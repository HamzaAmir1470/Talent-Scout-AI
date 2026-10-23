import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true }) name: string;
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) email: string;
  @Prop({ required: true, unique: true, sparse: true }) phone: string; // E.164, for example +923001234567
  @Prop({ default: false }) phoneVerified: boolean;
  @Prop({ required: true }) passwordHash: string;
  @Prop({ required: true, enum: ['user', 'admin'], default: 'user' }) role: string;
  @Prop({ required: true, enum: ['active', 'suspended'], default: 'active' }) status: string;
  @Prop({ default: 0 }) failedLogins: number;
  @Prop() lockUntil?: Date;
  @Prop() lastLoginAt?: Date;
  @Prop() lastLoginIp?: string;
  @Prop() termsAcceptedAt?: Date;
  @Prop() passwordChangedAt?: Date;
}
export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ createdAt: -1 });
