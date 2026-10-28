import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class UserProgress {
  @Prop({ required: true, unique: true }) userId: string;
  @Prop({ type: [String], default: [] }) bookmarks: string[];
  @Prop({ type: Object, default: {} }) progress: Record<string, 'known' | 'review'>;
  @Prop({ default: true }) selfTest: boolean;
  @Prop({ default: 0 }) clientUpdatedAt: number;
}
export type ProgressDocument = HydratedDocument<UserProgress>;
export const ProgressSchema = SchemaFactory.createForClass(UserProgress);
