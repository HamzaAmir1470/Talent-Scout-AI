import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { Msg, Report } from './types';
import { Persona, REPORT_SCHEMA, SCORING_SYSTEM } from './personas';
import { Stage, StageContext, STAGE_LABEL } from './stages';

interface TurnArgs {
  system: string;
  history: Msg[];
  persona: Persona;
  stage: Stage;
  ctx: StageContext;
  onDelta: (text: string) => void;
}
interface TurnResult { text: string; inputTokens: number; outputTokens: number }

const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RETRYABLE = [429, 500, 503, 504];
const statusOf = (e: any): number => Number(e?.status ?? e?.code ?? e?.error?.code ?? 0);

/** Google Gemini when GEMINI_API_KEY is set, otherwise a scripted demo interviewer so the product works out of the box. */
@Injectable()
export class LlmService {
  private readonly log = new Logger(LlmService.name);
  private readonly client?: GoogleGenAI;
  private readonly model: string;
  readonly demo: boolean;

  constructor(cfg: ConfigService) {
    const key = cfg.get<string>('GEMINI_API_KEY');
    this.demo = !key;
    this.model = cfg.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');
    if (key) this.client = new GoogleGenAI({ apiKey: key });
    else this.log.warn('GEMINI_API_KEY is not set. The interviewer runs in demo mode.');
  }

  /** Gemini uses the roles "user" and "model". Merge neighbours and open with a user turn. */
  private toContents(history: Msg[]) {
    const out: { role: 'user' | 'model'; parts: { text: string }[] }[] = [
      { role: 'user', parts: [{ text: '[The candidate has joined the call. Greet them and begin.]' }] },
    ];
    for (const m of history) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      const last = out[out.length - 1];
      if (last.role === role) last.parts[0].text += ' ' + m.text;
      else out.push({ role, parts: [{ text: m.text }] });
    }
    return out;
  }

  /** Flash models can skip thinking, which keeps spoken replies fast and stops thinking tokens eating the output budget. */
  private get fastThinking() {
    return /flash/i.test(this.model) ? { thinkingConfig: { thinkingBudget: 0 } } : {};
  }

  async interviewTurn(a: TurnArgs): Promise<TurnResult> {
    if (!this.client) return this.demoTurn(a);
    for (let attempt = 0; ; attempt++) {
      let emitted = false;
      try {
        const stream = await this.client.models.generateContentStream({
          model: this.model,
          contents: this.toContents(a.history),
          config: { systemInstruction: a.system, maxOutputTokens: 400, temperature: 0.7, ...this.fastThinking },
        });
        let text = '';
        let inputTokens = 0;
        let outputTokens = 0;
        for await (const chunk of stream) {
          const t = chunk.text;
          if (t) { text += t; emitted = true; a.onDelta(t); }
          if (chunk.usageMetadata) {
            inputTokens = chunk.usageMetadata.promptTokenCount ?? inputTokens;
            outputTokens = chunk.usageMetadata.candidatesTokenCount ?? outputTokens;
          }
        }
        text = text.trim();
        if (!text) throw new Error('Gemini returned an empty reply (it may have been blocked by a safety filter)');
        return { text, inputTokens, outputTokens };
      } catch (e) {
        if (emitted || attempt >= 2 || !RETRYABLE.includes(statusOf(e))) throw e;
        await sleep(700 * (attempt + 1)); // transient overload before any text reached the user, so retry quietly
      }
    }
  }

  async scoreSession(args: { subjectName: string; candidateRole: string; level: string; messages: Msg[] }): Promise<Report> {
    if (!this.client) return this.demoScore(args.messages);
    const answers = args.messages.filter((m) => m.role === 'candidate');
    const transcript = args.messages
      .map((m) => `[${STAGE_LABEL[(m.stage as Stage) ?? 'technical'] ?? 'Interview'}] ${m.role === 'assistant' ? 'INTERVIEWER' : 'CANDIDATE'}: ${m.text}`)
      .join('\n');
    const prompt = `Role: ${args.candidateRole} (${args.level}). Subject: ${args.subjectName}. Candidate answers: ${answers.length}.\n\n<transcript>\n${transcript}\n</transcript>`;

    for (let attempt = 0; ; attempt++) {
      try {
        const res = await this.client.models.generateContent({
          model: this.model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction: SCORING_SYSTEM, temperature: 0.3, maxOutputTokens: 8000,
            responseMimeType: 'application/json', responseSchema: REPORT_SCHEMA as any,
          },
        });
        const raw = (res.text ?? '').replace(/^```json\s*|```$/g, '').trim();
        return this.normalise(JSON.parse(raw));
      } catch (e) {
        const retry = e instanceof SyntaxError || RETRYABLE.includes(statusOf(e));
        if (attempt >= 2 || !retry) throw e;
        await sleep(900 * (attempt + 1));
      }
    }
  }

  private weigh(ta: number, depth: number, comm: number, skills?: number) {
    return skills === undefined
      ? Math.round(ta * 0.45 + depth * 0.3 + comm * 0.25)
      : Math.round(ta * 0.35 + depth * 0.25 + comm * 0.2 + skills * 0.2);
  }

  private normalise(i: any): Report {
    const technicalAccuracy = clamp(i.technicalAccuracy);
    const depth = clamp(i.depth);
    const communication = clamp(i.communication);
    const part = (o: any) => (o && typeof o === 'object' ? { score: clamp(o.score), feedback: String(o.feedback ?? '') } : undefined);
    const introduction = part(i.introduction);
    const professionalism = part(i.professionalism);
    const b = part(i.behavioral);
    const behavioral = b && { ...b, missing: (i.behavioral.missing ?? []).map(String).filter((m: string) => ['Situation', 'Task', 'Action', 'Result'].includes(m)) };
    const parts = [introduction, behavioral, professionalism].filter(Boolean) as { score: number }[];
    const interviewSkills = parts.length ? Math.round(parts.reduce((n, p) => n + p.score, 0) / parts.length) : undefined;
    return {
      overall: this.weigh(technicalAccuracy, depth, communication, interviewSkills),
      technicalAccuracy, depth, communication, interviewSkills, introduction, behavioral, professionalism,
      verdict: ['Strong hire', 'Hire', 'Borderline', 'Needs more practice'].includes(i.verdict) ? i.verdict : 'Borderline',
      summary: String(i.summary ?? ''),
      strengths: (i.strengths ?? []).map(String).slice(0, 5),
      improvements: (i.improvements ?? []).map(String).slice(0, 5),
      studyPlan: (i.studyPlan ?? []).map(String).slice(0, 5),
      questions: (i.questions ?? []).slice(0, 8).map((q: any) => ({
        question: String(q.question), answerSummary: String(q.answerSummary),
        score: clamp(q.score), feedback: String(q.feedback),
      })),
    };
  }

  // ---------------- demo mode ----------------
  /** A scripted interviewer that follows the same professional stages, so the product is fully usable without an API key. */
  private async demoTurn(a: TurnArgs): Promise<TurnResult> {
    const { persona, ctx, history } = a;
    const inStage = (st: Stage) => history.filter((m) => m.role === 'candidate' && m.stage === st).length;
    const acks = ['Thank you.', 'That makes sense.', 'Got it, thank you.', 'Understood.', 'Alright, thanks.'];
    const ack = acks[history.length % acks.length];
    const STAR = ['Tell me about a time you disagreed with a teammate. What was the situation, what did you do, and how did it end?', 'Tell me about a mistake you made at work. What happened, what did you do about it, and what did you learn?'];
    let text: string;
    switch (a.stage) {
      case 'followup': text = `${ack} Which part of your background do you think is most relevant to this ${ctx.candidateRole} role, and why?`; break;
      case 'experience': text = `${ack} Let's talk about your work. Can you walk me through a recent project involving ${ctx.subjectName}? What was your role, and what was the hardest challenge?`; break;
      case 'technical': text = `${ack} ${ctx.techIndex === 1 ? "Let's move to the technical part. " : ''}Can you walk me through ${persona.focus[(ctx.techIndex - 1) % persona.focus.length].toLowerCase()}? Explain it as you would to a teammate.`; break;
      case 'behavioral': text = inStage('behavioral') === 0 ? `${ack} Now a behavioral question. ${STAR[0]}` : 'Thank you. What was the specific result of your actions, and what would you do differently next time?'; break;
      case 'questions': text = inStage('questions') === 0 ? `${ack} We are nearly out of time. Do you have any questions for me about the role or how to keep preparing?` : 'Good question. In general, strong candidates keep practising out loud and review feedback after each session. Is there anything else you would like to ask?'; break;
      case 'closing': text = 'Thank you for your time today. That brings us to the end of the interview. Your detailed report is next and it will show where you were strong and what to practise. Best of luck.'; break;
      default: text = `${ack} Could you tell me more about that?`;
    }
    for (const w of text.split(' ')) { a.onDelta(w + ' '); await sleep(22); }
    return { text, inputTokens: 0, outputTokens: 0 };
  }

  private demoScore(messages: Msg[]): Report {
    const cand = messages.filter((m) => m.role === 'candidate');
    const words = cand.map((m) => m.text.split(/\s+/).filter(Boolean).length);
    const avg = words.length ? words.reduce((x, y) => x + y, 0) / words.length : 0;
    const technicalAccuracy = clamp(35 + Math.min(avg, 60) * 0.8);
    const depth = clamp(25 + Math.min(avg, 80) * 0.7);
    const communication = clamp(45 + Math.min(avg, 40) * 0.9);

    const introWords = words[0] ?? 0;
    const introScore = introWords < 25 ? 45 : introWords > 220 ? 55 : clamp(60 + Math.min(introWords, 120) * 0.25);
    const beh = cand.filter((m) => m.stage === 'behavioral').map((m) => m.text).join(' ');
    const has = { Situation: /situation|when|project|team|deadline|we were/i, Task: /task|goal|needed to|responsible|had to/i, Action: /\bI (decided|built|led|wrote|fixed|created|proposed|asked|organised|organized)/i, Result: /result|outcome|improved|reduced|increased|%|learned|saved/i };
    const missing = beh ? (Object.keys(has) as (keyof typeof has)[]).filter((k) => !has[k].test(beh)) : ['Situation', 'Task', 'Action', 'Result'];
    const behScore = beh ? clamp(40 + (4 - missing.length) * 14) : 40;
    const askedQuestions = cand.some((m) => m.stage === 'questions' && m.text.split(/\s+/).length > 3);
    const proScore = clamp(65 + (askedQuestions ? 10 : 0) + (avg > 20 ? 5 : 0));
    const interviewSkills = Math.round((introScore + behScore + proScore) / 3);

    const asked = messages.filter((m) => m.role === 'assistant');
    const questions = cand.filter((m) => m.stage === 'technical' || m.stage === 'behavioral').slice(0, 8).map((m) => {
      const idx = messages.indexOf(m);
      const w = m.text.split(/\s+/).length;
      return {
        question: (messages[idx - 1]?.text ?? asked[0]?.text ?? 'Interview question').split('. ').pop() ?? '',
        answerSummary: m.text.length > 160 ? m.text.slice(0, 157) + '...' : m.text,
        score: clamp(30 + Math.min(w, 70)),
        feedback: w < 25 ? 'Your answer was short. Add a definition, an example and one trade-off.' : 'Good length. Next time add a concrete example from a real project.',
      };
    });
    const overall = this.weigh(technicalAccuracy, depth, communication, interviewSkills);
    return {
      overall, technicalAccuracy, depth, communication, interviewSkills, demo: true,
      introduction: { score: introScore, feedback: introWords < 25 ? 'Your introduction was very short. Try present, past, future: who you are now, what you have done, what you want next.' : 'Good length. Keep it to about 90 seconds and end with why this role.' },
      behavioral: { score: behScore, missing, feedback: missing.length ? `Use the STAR structure. Your answer was missing: ${missing.join(', ')}.` : 'Your answer covered Situation, Task, Action and Result. Add a number to the result.' },
      professionalism: { score: proScore, feedback: askedQuestions ? 'You used the chance to ask a question, which shows interest.' : 'Prepare one or two questions for the end of the interview.' },
      verdict: overall >= 75 ? 'Hire' : overall >= 55 ? 'Borderline' : 'Needs more practice',
      summary: 'Demo scoring estimates quality from answer length and keywords only. Add a Gemini API key to get real, content-aware feedback.',
      strengths: ['You completed the full interview structure', 'You kept a steady speaking pace'],
      improvements: ['Give concrete examples', 'Mention trade-offs and edge cases'],
      studyPlan: ['Review the Learn guides for this subject', 'Practice questions in the Question Bank', 'Retake this interview in a few days'],
      questions,
    };
  }
}
