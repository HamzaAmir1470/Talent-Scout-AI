import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Subject {
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ required: true }) name: string;
  @Prop() icon: string;
  @Prop() accent: string;
  @Prop() group: string;
  @Prop() description: string;
  @Prop({ default: 0 }) order: number;
  @Prop({ default: false }) adminEdited: boolean;
}
export type SubjectDocument = HydratedDocument<Subject>;
export const SubjectSchema = SchemaFactory.createForClass(Subject);

@Schema({ timestamps: true })
export class Topic {
  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true, index: true }) subjectId: Types.ObjectId;
  @Prop({ required: true }) slug: string;
  @Prop({ required: true }) title: string;
  @Prop() summary: string;
  @Prop({ default: 5 }) minutes: number;
  @Prop({ default: 'General' }) section: string;
  @Prop({ default: 0 }) order: number;
  @Prop({ default: false }) adminEdited: boolean;
}
export type TopicDocument = HydratedDocument<Topic>;
export const TopicSchema = SchemaFactory.createForClass(Topic);
TopicSchema.index({ subjectId: 1, slug: 1 }, { unique: true });

@Schema({ timestamps: true })
export class Documentation {
  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true, unique: true }) topicId: Types.ObjectId;
  @Prop({ required: true }) markdown: string;
  @Prop({ default: 5 }) readingMinutes: number;
}
export type DocumentationDocument = HydratedDocument<Documentation>;
export const DocumentationSchema = SchemaFactory.createForClass(Documentation);

@Schema({ timestamps: true })
export class InterviewQuestion {
  @Prop({ required: true, unique: true }) key: string;
  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true, index: true }) topicId: Types.ObjectId;
  @Prop({ required: true, enum: ['beginner', 'intermediate', 'senior'] }) difficulty: string;
  @Prop({ required: true }) question: string;
  @Prop({ required: true }) answer: string;
  @Prop() codeSnippet?: string;
  @Prop() codeLanguage?: string;
  @Prop() devopsCommand?: string;
  @Prop({ required: true }) keyTakeaway: string;
  @Prop({ default: false }) adminEdited: boolean;
}
export type InterviewQuestionDocument = HydratedDocument<InterviewQuestion>;
export const InterviewQuestionSchema = SchemaFactory.createForClass(InterviewQuestion);
