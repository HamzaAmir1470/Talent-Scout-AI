import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class InterviewSession {
  @Prop({ required: true, index: true }) userId: string;
  @Prop({ required: true, unique: true }) bookingId: string;
  @Prop({ required: true }) subject: string;
  @Prop() subjectName: string;
  @Prop({ required: true }) candidateRole: string;
  @Prop() level: string;
  @Prop({ required: true, enum: ['active', 'finishing', 'completed'], default: 'active' }) status: string;
  @Prop({ required: true }) startedAt: Date;
  @Prop({ required: true }) endsAt: Date;
  @Prop() endedAt?: Date;
  @Prop() durationSec?: number;
  @Prop({ default: 'gemini' }) mode: string;
  @Prop({ default: 'intro' }) stage: string;
  @Prop({ default: 0 }) stageAnswers: number;
  @Prop() candidateName?: string;
  @Prop({ type: [{ role: String, text: String, at: Date, stage: String }], default: [] })
  messages: { role: string; text: string; at: Date; stage?: string }[];
  @Prop({ type: Object }) report?: Record<string, any>;
  @Prop({ default: 0 }) inputTokens: number;
  @Prop({ default: 0 }) outputTokens: number;
}
export type SessionDocument = HydratedDocument<InterviewSession>;
export const SessionSchema = SchemaFactory.createForClass(InterviewSession);
SessionSchema.index({ userId: 1, startedAt: -1 });
