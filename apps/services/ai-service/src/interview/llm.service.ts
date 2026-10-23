import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { Msg, Report } from './types';
import { Persona, REPORT_SCHEMA, SCORING_SYSTEM } from './personas';

interface TurnArgs {
  system: string;
  history: Msg[];
  persona: Persona;
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
      .map((m) => `${m.role === 'assistant' ? 'INTERVIEWER' : 'CANDIDATE'}: ${m.text}`)
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

  private normalise(i: any): Report {
    const technicalAccuracy = clamp(i.technicalAccuracy);
    const depth = clamp(i.depth);
    const communication = clamp(i.communication);
    return {
      overall: Math.round(technicalAccuracy * 0.45 + depth * 0.3 + communication * 0.25),
      technicalAccuracy, depth, communication,
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
  private async demoTurn(a: TurnArgs): Promise<TurnResult> {
    const answers = a.history.filter((m) => m.role === 'candidate').length;
    const focus = a.persona.focus;
    const acks = ['Thanks, that makes sense.', 'Got it, thank you.', 'Okay, good.', 'Understood.', 'Alright.'];
    let text: string;
    if (answers === 0) {
      text = `Hi, I'm ${a.persona.interviewer}, your ${a.persona.title} for today. Let's start with a warm up. Can you walk me through ${focus[0].toLowerCase()}?`;
    } else if (answers < Math.min(focus.length, 5)) {
      text = `${acks[answers % acks.length]} Next, tell me about ${focus[answers].toLowerCase()}. How would you explain it and where have you used it?`;
    } else {
      text = `Thank you, that is everything I wanted to cover. This is a demo interviewer, so add a Gemini API key for fully adaptive questions. You can end the session now to see your report.`;
    }
    for (const w of text.split(' ')) { a.onDelta(w + ' '); await sleep(22); }
    return { text, inputTokens: 0, outputTokens: 0 };
  }

  private demoScore(messages: Msg[]): Report {
    const answers = messages.filter((m) => m.role === 'candidate').map((m) => m.text);
    const words = answers.map((t) => t.split(/\s+/).filter(Boolean).length);
    const avg = words.length ? words.reduce((a, b) => a + b, 0) / words.length : 0;
    const technicalAccuracy = clamp(35 + Math.min(avg, 60) * 0.8);
    const depth = clamp(25 + Math.min(avg, 80) * 0.7);
    const communication = clamp(45 + Math.min(avg, 40) * 0.9);
    const asked = messages.filter((m) => m.role === 'assistant');
    const questions = answers.slice(0, 8).map((ans, i) => ({
      question: (asked[i]?.text ?? 'Interview question').split('. ').pop() ?? '',
      answerSummary: ans.length > 160 ? ans.slice(0, 157) + '...' : ans,
      score: clamp(30 + Math.min(words[i], 70)),
      feedback: words[i] < 25 ? 'Your answer was short. Add a definition, an example and one trade-off.' : 'Good length. Next time add a concrete example from a real project.',
    }));
    const overall = Math.round(technicalAccuracy * 0.45 + depth * 0.3 + communication * 0.25);
    return {
      overall, technicalAccuracy, depth, communication, demo: true,
      verdict: overall >= 75 ? 'Hire' : overall >= 55 ? 'Borderline' : 'Needs more practice',
      summary: 'Demo scoring estimates quality from answer length only. Add a Gemini API key to get real, content-aware feedback.',
      strengths: ['You completed the interview', 'You kept a steady speaking pace'],
      improvements: ['Give concrete examples', 'Mention trade-offs and edge cases'],
      studyPlan: ['Review the Learn guides for this subject', 'Practice questions in the Question Bank', 'Retake this interview in a few days'],
      questions,
    };
  }
}
