export type Difficulty = 'beginner' | 'intermediate' | 'senior';

export interface Subject {
  id: string; slug: string; name: string; icon: string; accent: string;
  group: string; description: string; topicCount: number; questionCount: number;
}
export interface TopicSummary {
  id: string; slug: string; title: string; summary: string; minutes: number; order: number;
  subjectSlug: string; subjectName: string; subjectAccent: string; questionCount: number; section?: string;
}
export interface Question {
  id: string; key: string; difficulty: Difficulty; question: string; answer: string;
  codeSnippet?: string; codeLanguage?: string; devopsCommand?: string; keyTakeaway: string;
  topicId: string; topicSlug: string; topicTitle: string;
  subjectSlug: string; subjectName: string; subjectAccent: string;
}
export interface TopicPageData {
  subject: Omit<Subject, 'topicCount' | 'questionCount'>;
  topic: Pick<TopicSummary, 'id' | 'slug' | 'title' | 'summary' | 'minutes'>;
  documentation: { markdown: string; readingMinutes: number } | null;
  questions: Question[];
  siblings: { slug: string; title: string; minutes: number; section?: string }[];
}

export type BookingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'missed';

export interface Booking {
  id: string; subject: string; subjectName: string; candidateRole: string; level: string;
  scheduledAt: string; durationMin: number; status: BookingStatus; sessionId: string | null;
  rescheduleCount: number; joinOpensAt: string; joinClosesAt: string; joinable: boolean;
}
export interface Paged<T> { items: T[]; total: number; page: number; limit: number }

export interface Persona { subject: string; interviewer: string; title: string; defaultRole: string; focus: string[] }

export interface QuestionFeedback { question: string; answerSummary: string; score: number; feedback: string }
export interface Report {
  overall: number; technicalAccuracy: number; depth: number; communication: number;
  verdict: 'Strong hire' | 'Hire' | 'Borderline' | 'Needs more practice';
  summary: string; strengths: string[]; improvements: string[]; studyPlan: string[];
  questions: QuestionFeedback[]; demo?: boolean;
}
export interface SessionSummary {
  id: string; subject: string; subjectName: string; candidateRole: string; level: string;
  startedAt: string; endedAt: string; durationSec: number; mode: string;
  overall: number; technicalAccuracy: number; depth: number; communication: number; verdict?: string;
}
export interface SessionDetail {
  id: string; bookingId: string; subject: string; subjectName: string; candidateRole: string; level: string;
  status: string; mode: string; startedAt: string; endedAt?: string; durationSec?: number;
  messages: { role: 'assistant' | 'candidate'; text: string; at: string }[]; report: Report | null;
}
export interface Stats {
  sessions: number; avgOverall: number; avgTechnicalAccuracy: number; avgDepth: number; avgCommunication: number;
  bestSubject: { slug: string; name: string; avg: number } | null;
  trend: { id: string; at: string; overall: number; subjectName: string }[];
}
