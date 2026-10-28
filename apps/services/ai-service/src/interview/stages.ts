import { Persona } from './personas';

/** The order of a structured interview. The server decides the stage, so the flow never depends on the model remembering it. */
export type Stage = 'intro' | 'followup' | 'experience' | 'technical' | 'behavioral' | 'questions' | 'closing' | 'done';

export const STAGE_LABEL: Record<Stage, string> = {
  intro: 'Introduction', followup: 'Introduction', experience: 'Experience', technical: 'Technical',
  behavioral: 'Behavioral', questions: 'Your questions', closing: 'Wrap-up', done: 'Wrap-up',
};

/**
 * Called after the candidate answers a question asked in stage `cur`. Returns the stage of the next interviewer turn.
 * `answersInStage` includes the answer just given and `f` is the share of the interview time already used (0 to 1).
 */
export function nextStage(cur: Stage, answersInStage: number, f: number): Stage {
  if (cur === 'done') return 'done';
  if (cur === 'closing') return 'done';
  if (f >= 1) return 'closing'; // time is up, so wrap up from wherever we are
  switch (cur) {
    case 'intro': return 'followup';
    case 'followup': return 'experience';
    case 'experience': return 'technical';
    case 'technical': return (f >= 0.55 && answersInStage >= 2) || f >= 0.68 ? 'behavioral' : 'technical';
    case 'behavioral': return answersInStage >= 2 || f >= 0.86 ? 'questions' : 'behavioral';
    case 'questions': return answersInStage >= 2 || f >= 0.95 ? 'closing' : 'questions';
  }
}

export interface OpeningInput { name?: string; persona: Persona; candidateRole: string; subjectName: string; durationMin: number }

/** A fixed, professional welcome that always ends with the classic first question. */
export function openingMessage(o: OpeningInput): string {
  const first = o.name?.trim().split(/\s+/)[0];
  return `${first ? `Hello ${first}, welcome` : 'Hello, welcome'} and thank you for joining. I'm ${o.persona.interviewer}, ${o.persona.title}. `
    + `We have about ${o.durationMin} minutes for your ${o.candidateRole} interview. We'll begin with your background, then cover some ${o.subjectName} questions and a behavioral question, `
    + `and I'll leave time at the end for any questions you have. Take your time, and ask me to repeat anything. Let's begin. Tell me about yourself.`;
}

export const DONE_MESSAGE = 'Thank you again for your time. You can end the session now to see your detailed report.';

export interface StageContext { minutesLeft: number; techIndex: number; subjectName: string; candidateRole: string; level: string; persona: Persona }

/** Instructions for the current turn, appended to the base system prompt. */
export function stageGuide(stage: Stage, c: StageContext): string {
  const time = `About ${c.minutesLeft} minute${c.minutesLeft === 1 ? '' : 's'} remain.`;
  const guide: Record<Stage, string> = {
    intro: '',
    followup: `The candidate has just introduced themselves. Acknowledge them in a few words, then ask exactly ONE follow-up that probes something specific they said, such as a recent role, a project or a skill relevant to ${c.candidateRole}. Do not ask technical questions yet.`,
    experience: `Ask the candidate to walk you through one recent project or piece of work most relevant to ${c.subjectName}. Ask about what they built, their own role and the hardest challenge. Keep it conversational.`,
    technical: `Technical stage, question ${c.techIndex}. Ask ONE technical question about ${c.subjectName}. ${c.techIndex <= 2 ? 'Start with fundamentals.' : 'Move to a scenario, trade-off or design question if they have done well, or stay at fundamentals if they struggled.'} If their last answer was shallow or unclear, ask a follow-up on it instead of changing topic. Choose areas from the focus list that were not covered yet and never repeat a question.`,
    behavioral: `Behavioral stage. Ask ONE behavioral question that uses the STAR approach, for example a time they handled disagreement in a team, learned from a mistake, or delivered under a tight deadline. If the previous answer was behavioral but missed the Situation, Task, Action or Result, ask one short probing question for the missing part instead of a new question.`,
    questions: `We are nearly out of time. If you have not yet invited questions, thank the candidate and ask if they have any questions for you. If they asked something, answer briefly, honestly and in general professional terms. This is a practice session, so never invent facts about a real company, salary or team. Then ask if there is anything else.`,
    closing: `Closing. Thank the candidate for their time, give one sincere and honest remark about the conversation without judging individual answers, say that a detailed report comes next, and say goodbye. Do not ask a question.`,
    done: '',
  };
  return guide[stage] ? `\n\nCurrent stage guide: ${guide[stage]} ${time}` : '';
}
