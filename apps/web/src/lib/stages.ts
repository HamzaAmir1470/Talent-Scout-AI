export type Stage = 'intro' | 'followup' | 'experience' | 'technical' | 'behavioral' | 'questions' | 'closing' | 'done';

/** Steps shown in the room. Two internal stages share the first and last step. */
export const STEPS = ['Introduction', 'Experience', 'Technical', 'Behavioral', 'Your questions', 'Wrap-up'] as const;

export const stepOf = (s: Stage): number => ({ intro: 0, followup: 0, experience: 1, technical: 2, behavioral: 3, questions: 4, closing: 5, done: 5 })[s] ?? 0;

export const TIPS: Record<Stage, string> = {
  intro: 'Use present, past, future: who you are now, what you have done, and what you want next. Aim for about 90 seconds.',
  followup: 'Be specific. Pick one project, one result and one skill that fits this role.',
  experience: 'Describe your own part, not only the team. Mention the hardest problem and how you solved it.',
  technical: 'Think out loud. State the basics first, then trade-offs. It is fine to say you are unsure and explain how you would find out.',
  behavioral: 'Use STAR: Situation, Task, Action, Result. Say what you personally did and end with a measurable result.',
  questions: 'Ask about expectations, the team or how to grow. A good question shows real interest.',
  closing: 'Thank the interviewer. Then end the session to see your report.',
  done: 'The interview is complete. End the session to see your report.',
};
