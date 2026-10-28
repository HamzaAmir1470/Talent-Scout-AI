import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled', 'missed'] as const;

@Schema({ timestamps: true })
export class InterviewBooking {
  @Prop({ required: true, index: true }) userId: string;
  @Prop({ required: true }) subject: string;
  @Prop() subjectName: string;
  @Prop({ required: true }) candidateRole: string;
  @Prop({ default: 'Mid-level' }) level: string;
  @Prop({ required: true }) scheduledAt: Date;
  @Prop({ default: 20 }) durationMin: number;
  @Prop({ required: true, enum: STATUSES, default: 'scheduled' }) status: string;
  @Prop() sessionId?: string;
  @Prop({ default: 0 }) rescheduleCount: number;
  @Prop() candidateName?: string;
  @Prop() candidateEmail?: string;
  @Prop() reminderSentAt?: Date;
}
export type BookingDocument = HydratedDocument<InterviewBooking>;
export const BookingSchema = SchemaFactory.createForClass(InterviewBooking);
BookingSchema.index({ userId: 1, scheduledAt: 1 });
BookingSchema.index({ status: 1, scheduledAt: 1 });
