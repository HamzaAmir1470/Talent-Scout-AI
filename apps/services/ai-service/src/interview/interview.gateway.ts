import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InterviewService } from './interview.service';
import { SttService } from './stt.service';
import { getPersona } from './personas';
import { ApiError } from './types';

const MAX_ANSWER_CHARS = 4000;
const MAX_MESSAGES = 70;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const MIN_GAP_MS = 600;
const GRACE_MS = 90_000;

interface ConnData {
  userId: string; sessionId?: string; bookingId?: string; busy?: boolean; lastAt?: number;
  chunks: Buffer[]; bytes: number; timer?: NodeJS.Timeout;
}
const data = (s: Socket) => s.data as ConnData;
const errOf = (e: unknown) => (e instanceof ApiError
  ? { ok: false, error: e.message, code: e.code, ...e.extra }
  : { ok: false, error: 'Something went wrong. Please try again.', code: 'error' });

@WebSocketGateway({ namespace: '/interview' })
export class InterviewGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly log = new Logger(InterviewGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly svc: InterviewService,
    private readonly stt: SttService,
  ) {}

  handleConnection(socket: Socket) {
    try {
      const payload = this.jwt.verify(String(socket.handshake.auth?.token ?? ''));
      socket.data = { userId: payload.sub, chunks: [], bytes: 0 } as ConnData;
      socket.join(`u:${payload.sub}`);
    } catch {
      socket.emit('auth:error', { message: 'Please log in again' });
      socket.disconnect(true);
    }
  }

  @SubscribeMessage('session:start')
  async start(@ConnectedSocket() socket: Socket, @MessageBody() body: { bookingId: string }) {
    const d = data(socket);
    try {
      const { session, booking, resumed } = await this.svc.start(d.userId, String(body?.bookingId ?? ''));
      d.sessionId = String(session._id);
      d.bookingId = session.bookingId;
      const persona = getPersona(session.subject);
      const endsAt = new Date(session.endsAt).getTime();
      const msgs = session.messages.map((m) => ({ role: m.role, text: m.text, at: m.at }));

      socket.emit('session:ready', {
        sessionId: d.sessionId, resumed, messages: msgs, endsAt, durationMin: booking.durationMin,
        serverStt: this.stt.enabled, demo: this.svc.demo, stage: (session as any).stage ?? 'intro',
        persona: { name: persona.interviewer, title: persona.title },
      });

      clearTimeout(d.timer);
      d.timer = setTimeout(() => this.forceEnd(d.userId, d.sessionId!), Math.max(0, endsAt - Date.now()) + GRACE_MS);

      const last = msgs[msgs.length - 1];
      if (!resumed || last?.role === 'candidate') await this.turn(socket);
      return { ok: true };
    } catch (e) {
      return errOf(e);
    }
  }

  @SubscribeMessage('answer:submit')
  async answer(@ConnectedSocket() socket: Socket, @MessageBody() body: { text: string }) {
    return this.handleAnswer(socket, String(body?.text ?? ''));
  }

  @SubscribeMessage('audio:chunk')
  audio(@ConnectedSocket() socket: Socket, @MessageBody() chunk: Buffer) {
    const d = data(socket);
    if (!this.stt.enabled || !d.sessionId || !Buffer.isBuffer(chunk)) return;
    if (d.bytes + chunk.length > MAX_AUDIO_BYTES) return;
    d.chunks.push(chunk);
    d.bytes += chunk.length;
  }

  @SubscribeMessage('utterance:end')
  async utterance(@ConnectedSocket() socket: Socket, @MessageBody() body: { mime?: string }) {
    const d = data(socket);
    const audio = Buffer.concat(d.chunks);
    d.chunks = []; d.bytes = 0;
    const text = await this.stt.transcribe(audio, body?.mime ?? 'audio/webm');
    if (!text) { socket.emit('stt:error', { message: 'We could not hear that clearly. Please try again.' }); return { ok: false }; }
    socket.emit('transcript:final', { text });
    return this.handleAnswer(socket, text);
  }

  @SubscribeMessage('session:end')
  async end(@ConnectedSocket() socket: Socket) {
    const d = data(socket);
    if (!d.sessionId) return { ok: false, error: 'No active interview' };
    try {
      const res = await this.svc.finish(d.sessionId, d.userId);
      clearTimeout(d.timer);
      if (!('empty' in res)) this.server.to(`u:${d.userId}`).emit('session:ended', res);
      d.sessionId = undefined;
      return { ok: true, ...res };
    } catch (e) {
      return errOf(e);
    }
  }

  // ---------------- internals ----------------
  private async handleAnswer(socket: Socket, raw: string) {
    const d = data(socket);
    const text = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_ANSWER_CHARS);
    if (!d.sessionId || !text) return { ok: false };
    if (d.busy) return { ok: false, error: 'Please wait for the interviewer to finish' };
    const now = Date.now();
    if (d.lastAt && now - d.lastAt < MIN_GAP_MS) return { ok: false };
    d.lastAt = now;
    try {
      const s: any = await this.svc.getSessionDoc(d.sessionId);
      if (!s || s.status !== 'active') return { ok: false, error: 'This session has ended' };
      if (s.messages.length >= MAX_MESSAGES) {
        socket.emit('ai:error', { message: 'This interview reached its length limit. Please end the session.' });
        return { ok: false };
      }
      await this.svc.addMessage(d.sessionId, 'candidate', text, undefined, s.stage);
      await this.turn(socket);
      return { ok: true };
    } catch (e) {
      return errOf(e);
    }
  }

  private async turn(socket: Socket) {
    const d = data(socket);
    d.busy = true;
    socket.emit('ai:thinking');
    try {
      const { text, stage } = await this.svc.interviewerTurn(d.sessionId!, (t) => socket.emit('ai:delta', { text: t }));
      socket.emit('ai:done', { text, stage });
    } catch (e) {
      this.log.warn(`Interviewer turn failed: ${(e as Error).message}`);
      socket.emit('ai:error', { message: 'The interviewer lost the connection for a moment. Please repeat your answer.' });
    } finally {
      d.busy = false;
    }
  }

  private async forceEnd(userId: string, sessionId: string) {
    try {
      const res = await this.svc.finish(sessionId, userId);
      if (!('empty' in res)) this.server.to(`u:${userId}`).emit('session:ended', res);
    } catch { /* already finished */ }
  }
}
