export interface Msg { role: 'assistant' | 'candidate'; text: string; at: Date; stage?: string }

export interface QuestionFeedback { question: string; answerSummary: string; score: number; feedback: string }

export interface Report {
  overall: number;
  technicalAccuracy: number;
  depth: number;
  communication: number;
  interviewSkills?: number;
  introduction?: { score: number; feedback: string };
  behavioral?: { score: number; feedback: string; missing: string[] };
  professionalism?: { score: number; feedback: string };
  verdict: 'Strong hire' | 'Hire' | 'Borderline' | 'Needs more practice';
  summary: string;
  strengths: string[];
  improvements: string[];
  studyPlan: string[];
  questions: QuestionFeedback[];
  demo?: boolean;
}

export class ApiError extends Error {
  constructor(message: string, public readonly code = 'error', public readonly extra: Record<string, unknown> = {}) {
    super(message);
  }
}
