'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { refreshSession } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { OrbMode } from '@/components/Waveform';
import type { Report } from './types';
import type { Stage } from './stages';

export type Phase = 'lobby' | 'connecting' | 'live' | 'ending' | 'report' | 'error';
export type InputMode = 'browser' | 'server' | 'text';
export interface Msg { role: 'assistant' | 'candidate'; text: string }

const WS = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4004';
const SILENCE_MS = 1700;
const SENTENCE = /^([\s\S]*?[.!?])\s+([\s\S]*)$/;

const speechCtor = () =>
  typeof window === 'undefined' ? null : (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;

export function useInterviewRoom(bookingId: string) {

  const [phase, setPhase] = useState<Phase>('lobby');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [aiDraft, setAiDraft] = useState('');
  const [interim, setInterim] = useState('');
  const [orb, setOrb] = useState<OrbMode>('idle');
  const [muted, setMuted] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState<InputMode>('text');
  const [recording, setRecording] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [persona, setPersona] = useState<{ name: string; title: string } | null>(null);
  const [demo, setDemo] = useState(false);
  const [srSupported, setSrSupported] = useState(true);
  const [connected, setConnected] = useState(false);
  const [stage, setStage] = useState<Stage>('intro');

  // mutable state that event handlers read without re-subscribing
  const socketRef = useRef<Socket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const recogRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const silenceRef = useRef<ReturnType<typeof setTimeout>>();
  const sentenceBuf = useRef('');
  const speaking = useRef(0);
  const streaming = useRef(false);
  const busy = useRef(false);
  const phaseRef = useRef<Phase>('lobby');
  const modeRef = useRef<InputMode>('text');
  const mutedRef = useRef(false);
  const voiceRef = useRef(true);
  const endsAt = useRef(0);
  const startedRef = useRef(false);

  const setPhaseBoth = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  useEffect(() => { setSrSupported(Boolean(speechCtor())); }, []);
  useEffect(() => { voiceRef.current = voiceOn; if (!voiceOn && typeof window !== 'undefined') window.speechSynthesis?.cancel(); }, [voiceOn]);

  // ---------------- microphone ----------------
  const prepareMic = useCallback(async () => {
    if (streamRef.current) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const ctx = new AudioContext();
      const node = ctx.createAnalyser();
      node.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(node);
      streamRef.current = stream; ctxRef.current = ctx; setAnalyser(node);
      return true;
    } catch {
      setNotice('Microphone access was blocked. You can still type your answers.');
      return false;
    }
  }, []);

  const stopListen = useCallback(() => {
    clearTimeout(silenceRef.current);
    const r = recogRef.current;
    recogRef.current = null;
    try { r?.abort(); } catch { /* already stopped */ }
    setInterim('');
  }, []);

  const releaseMedia = useCallback(() => {
    stopListen();
    try { recorderRef.current?.stop(); } catch { /* idle */ }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    setAnalyser(null);
    setRecording(false);
  }, [stopListen]);

  // ---------------- turn taking ----------------
  const submit = useCallback((text: string) => {
    const t = text.trim();
    if (!t || busy.current || phaseRef.current !== 'live') return;
    busy.current = true;
    stopListen();
    setMessages((m) => [...m, { role: 'candidate', text: t }]);
    setOrb('thinking');
    socketRef.current?.emit('answer:submit', { text: t });
  }, [stopListen]);

  const listen = useCallback(() => {
    if (phaseRef.current !== 'live' || mutedRef.current || busy.current || speaking.current > 0) return;
    if (modeRef.current !== 'browser' || recogRef.current) return;
    const SR = speechCtor();
    if (!SR) return;
    const r = new SR();
    r.lang = 'en-US'; r.continuous = true; r.interimResults = true;
    let finalText = '';
    r.onresult = (e: any) => {
      let partial = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript + ' ';
        else partial += res[0].transcript;
      }
      const latest = (finalText + partial).trim();
      setInterim(latest);
      clearTimeout(silenceRef.current);
      silenceRef.current = setTimeout(() => { if (latest) submit(latest); }, SILENCE_MS);
    };
    r.onend = () => {
      if (recogRef.current === r) {
        recogRef.current = null;
        setTimeout(listen, 250); // Chrome stops after long silence, so hands-free mode restarts it
      }
    };
    r.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        recogRef.current = null; modeRef.current = 'text'; setMode('text');
        setNotice('Speech recognition is blocked in this browser. Type your answers instead.');
      }
    };
    try { r.start(); recogRef.current = r; setOrb('listening'); } catch { /* already started */ }
  }, [submit]);

  const afterAi = useCallback(() => {
    busy.current = false;
    setOrb('idle');
    listen();
  }, [listen]);

  const speak = useCallback((text: string) => {
    if (!voiceRef.current || typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.03;
    const voices = window.speechSynthesis.getVoices();
    u.voice = voices.find((v) => /Google US English|Samantha|Microsoft (Aria|Jenny)/i.test(v.name)) ?? voices.find((v) => v.lang.startsWith('en')) ?? null;
    speaking.current += 1;
    u.onstart = () => setOrb('speaking');
    const done = () => {
      speaking.current = Math.max(0, speaking.current - 1);
      if (speaking.current === 0 && !streaming.current) afterAi();
    };
    u.onend = done; u.onerror = done;
    window.speechSynthesis.speak(u);
  }, [afterAi]);

  const flushSentences = useCallback((final: boolean) => {
    let m = SENTENCE.exec(sentenceBuf.current);
    while (m) { speak(m[1]); sentenceBuf.current = m[2]; m = SENTENCE.exec(sentenceBuf.current); }
    if (final && sentenceBuf.current.trim()) { speak(sentenceBuf.current); sentenceBuf.current = ''; }
  }, [speak]);

  // ---------------- session ----------------
  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setError(''); setNotice('');
    setPhaseBoth('connecting');
    const micOk = await prepareMic();
    const socket = io(`${WS}/interview`, { auth: (cb) => cb({ token: useAuth.getState().token }), transports: ['websocket'], reconnectionDelayMax: 4000 });
    socketRef.current = socket;

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('session:start', { bookingId }, (res: any) => {
        if (res && res.ok === false) {
          setError(res.error ?? 'Could not join the interview.');
          setPhaseBoth('error');
        }
      });
    });
    socket.on('auth:error', async () => {
      if (await refreshSession()) { socket.connect(); return; } // the token function reads the fresh one
      setError('Your session expired. Please log in again.'); setPhaseBoth('error');
    });
    socket.on('connect_error', () => setNotice('Reconnecting to the interview server...'));

    socket.on('session:ready', (d: any) => {
      setNotice('');
      setSessionId(d.sessionId); setDemo(Boolean(d.demo)); setPersona(d.persona); if (d.stage) setStage(d.stage);
      setMessages(d.messages ?? []);
      endsAt.current = d.endsAt;
      const next: InputMode = speechCtor() ? 'browser' : d.serverStt && micOk ? 'server' : 'text';
      modeRef.current = next; setMode(next);
      setPhaseBoth('live');
      const last = d.messages?.[d.messages.length - 1];
      if (d.resumed && last?.role === 'assistant') afterAi();
    });
    socket.on('ai:thinking', () => { busy.current = true; setOrb('thinking'); });
    socket.on('ai:delta', ({ text }: { text: string }) => {
      if (!streaming.current) { streaming.current = true; stopListen(); if (voiceRef.current) setOrb('speaking'); }
      setAiDraft((d) => d + text);
      sentenceBuf.current += text;
      flushSentences(false);
    });
    socket.on('ai:done', ({ text, stage: st }: { text: string; stage?: Stage }) => {
      if (st) setStage(st);
      streaming.current = false;
      setMessages((m) => [...m, { role: 'assistant', text }]);
      setAiDraft('');
      flushSentences(true);
      if (speaking.current === 0) afterAi();
    });
    socket.on('ai:error', ({ message }: { message: string }) => {
      streaming.current = false; setAiDraft(''); sentenceBuf.current = '';
      setNotice(message); afterAi();
    });
    socket.on('transcript:final', ({ text }: { text: string }) => setMessages((m) => [...m, { role: 'candidate', text }]));
    socket.on('stt:error', ({ message }: { message: string }) => { setNotice(message); afterAi(); });
    socket.on('session:ended', (d: { sessionId: string; report: Report }) => {
      if (phaseRef.current === 'report') return;
      releaseMedia(); window.speechSynthesis?.cancel();
      setReport(d.report); setSessionId(d.sessionId); setPhaseBoth('report');
    });
  }, [afterAi, bookingId, flushSentences, prepareMic, releaseMedia, stopListen]);

  const endSession = useCallback(() => {
    if (phaseRef.current !== 'live') return;
    setPhaseBoth('ending');
    releaseMedia();
    window.speechSynthesis?.cancel();
    socketRef.current?.timeout(120_000).emit('session:end', {}, (err: unknown, res: any) => {
      if (err || !res?.ok) {
        setError(res?.error ?? 'The report took too long. It will appear under Reports shortly.');
        setPhaseBoth('error');
      } else if (res.empty) {
        setError('No answers were recorded, so there is nothing to score. You can rejoin from the Interviews page.');
        setPhaseBoth('error');
      } else {
        setReport(res.report); setSessionId(res.sessionId); setPhaseBoth('report');
      }
    });
  }, [releaseMedia]);

  // countdown + auto finish
  useEffect(() => {
    if (phase !== 'live') return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0 && !busy.current) endSession();
    }, 1000);
    return () => clearInterval(id);
  }, [phase, endSession]);

  // leave-page protection and cleanup
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (phaseRef.current === 'live') { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      releaseMedia();
      window.speechSynthesis?.cancel();
      socketRef.current?.disconnect();
    };
  }, [releaseMedia]);

  // ---------------- controls ----------------
  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next; setMuted(next);
    if (next) { stopListen(); if (!busy.current) setOrb('idle'); } else listen();
  }, [listen, stopListen]);

  /** Push to talk for browsers without the Web Speech API (needs the server speech to text key). */
  const toggleRecord = useCallback(() => {
    if (modeRef.current !== 'server' || !streamRef.current) return;
    if (recorderRef.current) { recorderRef.current.stop(); return; }
    if (busy.current) return;
    const mime = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/mp4'].find((m) => MediaRecorder.isTypeSupported(m)) ?? 'audio/webm';
    const rec = new MediaRecorder(streamRef.current, { mimeType: mime });
    chainRef.current = Promise.resolve();
    rec.ondataavailable = (e) => {
      if (!e.data.size) return;
      chainRef.current = chainRef.current.then(async () => { socketRef.current?.emit('audio:chunk', await e.data.arrayBuffer()); });
    };
    rec.onstop = () => {
      recorderRef.current = null; setRecording(false);
      busy.current = true; setOrb('thinking');
      chainRef.current.then(() => socketRef.current?.emit('utterance:end', { mime }));
    };
    rec.start(1000);
    recorderRef.current = rec; setRecording(true); setOrb('listening');
  }, []);

  const repeatQuestion = useCallback(() => submit('Could you repeat that question, please?'), [submit]);

  const retry = useCallback(() => {
    socketRef.current?.disconnect();
    startedRef.current = false;
    setError(''); setNotice('');
    setPhaseBoth('lobby');
  }, []);

  return {
    phase, messages, aiDraft, interim, orb, muted, voiceOn, secondsLeft, report, sessionId, error, notice,
    mode, recording, analyser, persona, demo, srSupported, connected, stage,
    prepareMic, start, endSession, submit, toggleMute, toggleRecord, repeatQuestion, retry,
    setVoiceOn,
  };
}
