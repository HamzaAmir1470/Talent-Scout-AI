import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

/**
 * Optional server-side speech to text using Gemini audio understanding, so one GEMINI_API_KEY covers everything.
 * Only browsers without the Web Speech API (mainly Firefox) use it. Firefox records Ogg/Opus, which Gemini accepts.
 */
@Injectable()
export class SttService {
  private readonly log = new Logger(SttService.name);
  private readonly client?: GoogleGenAI;
  private readonly model: string;
  readonly enabled: boolean;

  constructor(cfg: ConfigService) {
    const key = cfg.get<string>('GEMINI_API_KEY');
    this.enabled = Boolean(key);
    this.model = cfg.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');
    if (key) this.client = new GoogleGenAI({ apiKey: key });
  }

  async transcribe(audio: Buffer, mime: string): Promise<string | null> {
    if (!this.client || audio.length < 1500) return null;
    try {
      const res = await this.client.models.generateContent({
        model: this.model,
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: mime.split(';')[0] || 'audio/ogg', data: audio.toString('base64') } },
            { text: 'Transcribe the speech in this audio exactly as spoken. Reply with the transcript only. If there is no speech, reply with nothing.' },
          ],
        }],
        config: { temperature: 0, maxOutputTokens: 1200, ...(/flash/i.test(this.model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
      });
      return (res.text ?? '').trim() || null;
    } catch (err) {
      this.log.warn(`Transcription failed: ${(err as Error).message}`);
      return null;
    }
  }
}
