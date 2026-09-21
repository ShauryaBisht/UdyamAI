'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  MessageCircle,
  Send,
  X,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { sendChatMessage, type ChatTurn, type ChatSource } from '@/lib/api';
import { useLanguageStore } from '@/stores/languageStore';
import Logo from '@/components/ui/Logo';

// Language to BCP-47 locale mapping for speech recognition/synthesis
const SPEECH_LOCALES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  or: 'or-IN',
  as: 'as-IN',
};

export default function ChatWidget() {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const language = useLanguageStore((s) => s.language);
  const welcome: ChatTurn = {
    role: 'assistant',
    content: t('chat.welcome'),
    confidence: 'high',
  };

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatTurn[]>([welcome]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const welcomeRef = useRef(welcome.content);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{ role: 'assistant', content: t('chat.welcome'), confidence: 'high' }]);
      welcomeRef.current = t('chat.welcome');
    }
  }, [language, t]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, loading]);

  // Clean up speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  if (!user) return null;

  // Voice Input (Speech-to-Text)
  const toggleSpeechRecognition = () => {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setError('Voice recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.lang = SPEECH_LOCALES[language] || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition failed to start:', err);
      setIsListening(false);
    }
  };

  // Voice Output (Text-to-Speech)
  const toggleSpeechSynthesis = (text: string, idx: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LOCALES[language] || 'en-IN';

    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  async function handleSend(event?: React.FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const nextHistory = [...messages, { role: 'user' as const, content: text }];
    setMessages(nextHistory);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const history = nextHistory
        .filter((m) => m.content !== welcomeRef.current)
        .slice(0, -1)
        .slice(-8);

      const langCode = (language === 'hi' || language === 'mr' ? language : 'en') as 'en' | 'hi' | 'mr';
      const res = await sendChatMessage(text, history, langCode);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          confidence: res.confidence || 'high',
          rag_status: res.rag_status,
          sources: res.sources,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('chat.reachError');
      setError(message);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('chat.offline'), confidence: 'unverified' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Render 3-tier Trust Badge
  const renderTrustBadge = (msg: ChatTurn) => {
    if (msg.role !== 'assistant') return null;

    const confidence = msg.confidence || 'unverified';
    const sources = msg.sources || [];

    if (confidence === 'high') {
      return (
        <div className="mt-2.5 pt-2 border-t border-border flex flex-wrap items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">{t('chat.verified')}</span>
          {sources.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {sources.map((s, sIdx) => {
                const title = s.title || s.source_title || `Source ${sIdx + 1}`;
                const url = s.url || s.source_url;
                return url ? (
                  <a
                    key={sIdx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 underline font-medium hover:text-emerald-900 dark:hover:text-emerald-300 transition"
                  >
                    <span>{title}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ) : (
                  <span key={sIdx} className="font-medium bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-300">
                    {title}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (confidence === 'medium') {
      return (
        <div className="mt-2.5 pt-2 border-t border-border flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-semibold">{t('chat.partiallyVerified')}</span>
        </div>
      );
    }

    return (
      <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between gap-1 text-[11px] text-foreground-muted">
        <div className="flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
          <span>{t('chat.generalGuidance')}</span>
        </div>
        <Link href="/schemes" className="text-primary font-semibold hover:underline">
          {t('nav.schemes')} →
        </Link>
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1100] flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[min(560px,80vh)] w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[28px] border border-border bg-white dark:bg-[#161B22] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary to-[#0F7D57] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 p-1 backdrop-blur-sm border border-white/30 shadow-sm">
                <Logo variant="icon" size={24} inverted />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight">{t('chat.title')}</p>
                <p className="text-[11px] text-white/80">{t('chat.subtitle')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setSpeakingIdx(null);
                setOpen(false);
              }}
              className="rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition"
              aria-label={t('chat.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat message list */}
          <div ref={listRef} className="flex-1 space-y-3.5 overflow-y-auto bg-[#F9FAFB] dark:bg-[#0D1117] p-4">
            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-2xl rounded-br-sm bg-primary text-white font-medium shadow-pill-active'
                      : 'rounded-2xl rounded-bl-sm border border-border bg-white dark:bg-[#1C2128] text-foreground shadow-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">{msg.content}</div>
                    {msg.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => toggleSpeechSynthesis(msg.content, idx)}
                        className={`p-1 rounded-md transition shrink-0 ${
                          speakingIdx === idx
                            ? 'text-primary bg-primary/10 animate-pulse'
                            : 'text-foreground-muted hover:text-foreground hover:bg-slate-100 dark:hover:bg-neutral-800'
                        }`}
                        title={speakingIdx === idx ? t('chat.stopAudio') : t('chat.playAudio')}
                        aria-label="Text to speech"
                      >
                        {speakingIdx === idx ? (
                          <VolumeX className="h-3.5 w-3.5" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* 3-tier Trust Badge */}
                  {renderTrustBadge(msg)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t('chat.thinking')}
              </div>
            )}
          </div>

          {/* Chat input footer */}
          <form onSubmit={handleSend} className="border-t border-border bg-white dark:bg-[#161B22] p-3.5">
            {error && <p className="mb-2 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">{error}</p>}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                rows={1}
                placeholder={isListening ? t('chat.listening') : t('chat.placeholder')}
                className="max-h-24 min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-[#F9FAFB] dark:bg-[#1C2128] px-3.5 py-3 text-xs sm:text-sm outline-none transition focus:border-primary focus:bg-white dark:focus:bg-[#161B22] focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-foreground-muted"
              />

              {/* Speech Recognition Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                    : 'bg-[#F9FAFB] dark:bg-[#1C2128] text-foreground-muted border-border hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-foreground'
                }`}
                title={isListening ? t('chat.stopMic') : t('chat.startMic')}
                aria-label="Voice input"
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-pill-active transition hover:bg-primary-600 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={t('chat.send')}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-pill-active border border-white/20 transition-all duration-300 hover:bg-primary-600 hover:scale-105 active:scale-95"
        aria-label={open ? t('chat.close') : t('chat.open')}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
