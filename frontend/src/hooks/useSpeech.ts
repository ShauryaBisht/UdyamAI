'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { transcribeAudio, synthesizeSpeech } from '@/lib/api';

export const SPEECH_LOCALES: Record<string, string> = {
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

export interface UseSpeechReturn {
  // Speech-to-Text (STT)
  isListening: boolean;
  isTranscribing: boolean;
  transcript: string;
  interimTranscript: string;
  sttError: string | null;
  isSTTSupported: boolean;
  startListening: (onResult?: (text: string) => void) => void;
  stopListening: () => void;
  toggleListening: (onResult?: (text: string) => void) => void;

  // Text-to-Speech (TTS)
  isSpeaking: boolean;
  speakingId: string | null;
  isTTSSupported: boolean;
  speak: (text: string, id?: string, speaker?: string) => void;
  stopSpeaking: () => void;
  toggleSpeak: (text: string, id: string, speaker?: string) => void;
}

export function useSpeech(): UseSpeechReturn {
  const language = useLanguageStore((s) => s.language);
  const locale = SPEECH_LOCALES[language] || 'hi-IN';

  // STT State
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [sttError, setSttError] = useState<string | null>(null);
  const [isSTTSupported, setIsSTTSupported] = useState(false);

  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isTTSSupported, setIsTTSSupported] = useState(false);

  // Audio References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const soundCheckIntervalRef = useRef<number | null>(null);
  const hasDetectedSoundRef = useRef<boolean>(false);
  const recordingStartTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const onResultCallbackRef = useRef<((text: string) => void) | null>(null);
  const isExplicitStopRef = useRef<boolean>(false);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const ttsPendingIdRef = useRef<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const cleanupAudioAnalyser = useCallback(() => {
    if (soundCheckIntervalRef.current !== null) {
      clearInterval(soundCheckIntervalRef.current);
      soundCheckIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (e) {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasMediaDevices = !!(navigator?.mediaDevices?.getUserMedia);
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSTTSupported(hasMediaDevices || !!SpeechRec);
      setIsTTSSupported(true); // Supports Sarvam audio playback + fallback

      if ('speechSynthesis' in window) {
        const updateVoices = () => {
          const loaded = window.speechSynthesis.getVoices();
          if (loaded && loaded.length > 0) {
            setVoices(loaded);
          }
        };
        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }, []);

  // Stop everything on unmount
  useEffect(() => {
    return () => {
      isExplicitStopRef.current = true;
      cleanupAudioAnalyser();
      // Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Stop Browser SpeechRecognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      // Stop HTML5 Audio & Browser SpeechSynthesis
      if (currentAudioElementRef.current) {
        currentAudioElementRef.current.pause();
        currentAudioElementRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      currentUtteranceRef.current = null;
    };
  }, [cleanupAudioAnalyser]);

  // -------------------------------------------------------------
  // Speech-to-Text Handlers (Sarvam AI Saaras + Web Speech Fallback)
  // -------------------------------------------------------------
  const fallbackBrowserListening = useCallback(
    (onResult?: (text: string) => void) => {
      if (typeof window === 'undefined') return;
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRec) {
        setSttError('Voice recognition is not supported in this browser.');
        setIsListening(false);
        return;
      }

      try {
        const recognition = new SpeechRec();
        recognitionRef.current = recognition;
        recognition.lang = locale;
        recognition.continuous = true;
        recognition.interimResults = true;

        if (onResult) {
          onResultCallbackRef.current = onResult;
        }

        recognition.onstart = () => {
          setIsListening(true);
          setSttError(null);
          setTranscript('');
          setInterimTranscript('');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const text = result[0]?.transcript || '';
            if (result.isFinal) {
              setTranscript((prev) => (prev ? `${prev} ${text}` : text));
              if (onResultCallbackRef.current) {
                onResultCallbackRef.current(text.trim());
              }
            } else {
              interim += text;
            }
          }
          setInterimTranscript(interim);
        };

        recognition.onerror = (event: any) => {
          console.warn('[useSpeech] Browser fallback recognition error:', event.error);
          if (event.error === 'no-speech') return;
          if (event.error === 'not-allowed') {
            setSttError('Microphone permission denied.');
          } else if (event.error !== 'aborted') {
            setSttError(`Microphone error: ${event.error}`);
          }
          setIsListening(false);
          setInterimTranscript('');
        };

        recognition.onend = () => {
          if (!isExplicitStopRef.current) {
            setIsListening(false);
            setInterimTranscript('');
          }
        };

        recognition.start();
      } catch (err) {
        console.warn('[useSpeech] Browser recognition start failed:', err);
        setSttError('Unable to access microphone.');
        setIsListening(false);
      }
    },
    [locale]
  );

  const stopListening = useCallback(() => {
    isExplicitStopRef.current = true;

    // Stop MediaRecorder (which will trigger onstop -> Sarvam STT transcription)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Stop fallback recognition if active
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(
    async (onResult?: (text: string) => void) => {
      if (typeof window === 'undefined') return;

      if (onResult) {
        onResultCallbackRef.current = onResult;
      }
      isExplicitStopRef.current = false;
      hasDetectedSoundRef.current = false;
      recordingStartTimeRef.current = Date.now();
      setSttError(null);
      setTranscript('');
      setInterimTranscript('');

      // Clean up any lingering audio context before starting fresh
      cleanupAudioAnalyser();

      // Attempt Sarvam STT via MediaRecorder audio capture
      if (navigator?.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          audioChunksRef.current = [];

          // Real-time sound level / speech energy analysis to avoid sending silent audio to STT
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const audioCtx = new AudioCtx();
              audioContextRef.current = audioCtx;
              const source = audioCtx.createMediaStreamSource(stream);
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 512;
              analyser.smoothingTimeConstant = 0.2;
              source.connect(analyser);
              analyserRef.current = analyser;

              const bufferLength = analyser.frequencyBinCount;
              const freqData = new Uint8Array(bufferLength);
              const timeData = new Uint8Array(analyser.fftSize);

              const checkAudioLevel = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(freqData);
                analyserRef.current.getByteTimeDomainData(timeData);

                let peakFreq = 0;
                let sumFreq = 0;
                for (let i = 0; i < bufferLength; i++) {
                  const val = freqData[i];
                  sumFreq += val;
                  if (val > peakFreq) peakFreq = val;
                }
                const avgFreq = sumFreq / bufferLength;

                // Time-domain RMS calculation (silence is 128)
                let sumDevSq = 0;
                for (let i = 0; i < timeData.length; i++) {
                  const dev = (timeData[i] - 128) / 128;
                  sumDevSq += dev * dev;
                }
                const rms = Math.sqrt(sumDevSq / timeData.length);

                // Sound detected if frequency peak/average or RMS exceeds ambient silence threshold
                if (peakFreq > 15 || avgFreq > 4 || rms > 0.015) {
                  hasDetectedSoundRef.current = true;
                }
              };

              soundCheckIntervalRef.current = window.setInterval(checkAudioLevel, 80);
            }
          } catch (audioCtxErr) {
            console.warn('[useSpeech] AudioContext initialization failed, default allowing speech:', audioCtxErr);
            hasDetectedSoundRef.current = true;
          }

          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : MediaRecorder.isTypeSupported('audio/ogg')
            ? 'audio/ogg'
            : '';

          const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          recorder.onstart = () => {
            setIsListening(true);
            setSttError(null);
          };

          recorder.onstop = async () => {
            setIsListening(false);
            cleanupAudioAnalyser();

            const duration = Date.now() - recordingStartTimeRef.current;
            const chunks = audioChunksRef.current;
            audioChunksRef.current = [];

            if (chunks.length === 0) return;

            const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });

            // Do not send STT request if recording is too short (<400ms), blob is empty (<1KB), or no sound/speech was detected
            if (duration < 400 || blob.size < 1000 || !hasDetectedSoundRef.current) {
              console.log(
                `[useSpeech] Skipped Sarvam STT request: No sound/speech detected (duration: ${duration}ms, size: ${blob.size}B, soundDetected: ${hasDetectedSoundRef.current})`
              );
              return;
            }

            // Transcribe audio using Sarvam AI Saaras model via backend proxy
            setIsTranscribing(true);
            try {
              const res = await transcribeAudio(blob, locale);
              if (res.transcript && res.transcript.trim()) {
                setTranscript(res.transcript);
                if (onResultCallbackRef.current) {
                  onResultCallbackRef.current(res.transcript.trim());
                }
              }
            } catch (err: any) {
              console.warn('[useSpeech] Sarvam STT failed, trying fallback:', err);
              // If Sarvam API fails or unconfigured, notify user
              setSttError(err.message || 'Speech recognition failed.');
            } finally {
              setIsTranscribing(false);
            }
          };

          recorder.onerror = (e) => {
            console.warn('[useSpeech] MediaRecorder error:', e);
            cleanupAudioAnalyser();
            setIsListening(false);
          };

          recorder.start(250); // collect 250ms chunks
          return;
        } catch (mediaErr: any) {
          console.warn('[useSpeech] getUserMedia failed, falling back to Web Speech API:', mediaErr);
          cleanupAudioAnalyser();
          if (mediaErr.name === 'NotAllowedError' || mediaErr.name === 'PermissionDeniedError') {
            setSttError('Microphone permission denied. Please allow microphone access.');
            return;
          }
        }
      }

      // Fallback to Web Speech API
      fallbackBrowserListening(onResult);
    },
    [locale, fallbackBrowserListening, cleanupAudioAnalyser]
  );

  const toggleListening = useCallback(
    (onResult?: (text: string) => void) => {
      if (isListening) {
        stopListening();
      } else {
        startListening(onResult);
      }
    },
    [isListening, startListening, stopListening]
  );

  // -------------------------------------------------------------
  // Text-to-Speech Handlers (Sarvam AI Bulbul + Web Speech Fallback)
  // -------------------------------------------------------------
  const stopSpeaking = useCallback(() => {
    // Abort any in-flight TTS fetch
    if (ttsAbortRef.current) {
      ttsAbortRef.current.abort();
      ttsAbortRef.current = null;
    }
    ttsPendingIdRef.current = null;
    // Stop HTML5 Audio
    if (currentAudioElementRef.current) {
      currentAudioElementRef.current.pause();
      currentAudioElementRef.current.currentTime = 0;
      currentAudioElementRef.current = null;
    }
    // Stop Browser SpeechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    currentUtteranceRef.current = null;
    setIsSpeaking(false);
    setSpeakingId(null);
  }, []);

  const fallbackBrowserSpeak = useCallback(
    (text: string, id?: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (!text || !text.trim()) return;

      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const cleaned = text
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[*#_~`>[\]()]/g, '')
        .replace(/•|\-/g, '')
        .replace(/\n+/g, '. ')
        .trim();

      if (!cleaned) return;

      const availVoices =
        voices.length > 0
          ? voices
          : typeof window !== 'undefined' && 'speechSynthesis' in window
          ? window.speechSynthesis.getVoices()
          : [];

      const exactVoice = availVoices.find(
        (v) =>
          v.lang.replace('_', '-').toLowerCase() === locale.toLowerCase() ||
          v.lang.replace('_', '-').toLowerCase().startsWith(locale.toLowerCase())
      );
      const langVoice = availVoices.find((v) =>
        v.lang.toLowerCase().startsWith(language.toLowerCase())
      );
      const defaultVoice = availVoices.find((v) => v.default) || availVoices.find((v) => v.lang.startsWith('en')) || availVoices[0];

      const selectedVoice = exactVoice || langVoice || defaultVoice || null;

      const utterance = new SpeechSynthesisUtterance(cleaned);
      currentUtteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = locale || 'en-US';
      }

      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingId(id || 'global');
      };

      utterance.onend = () => {
        currentUtteranceRef.current = null;
        setIsSpeaking(false);
        setSpeakingId(null);
      };

      utterance.onerror = (e: any) => {
        console.warn('[useSpeech] Browser TTS error:', e);
        currentUtteranceRef.current = null;
        setIsSpeaking(false);
        setSpeakingId(null);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[useSpeech] Browser speak failed:', err);
        setIsSpeaking(false);
        setSpeakingId(null);
      }
    },
    [locale, language, voices]
  );

  const speak = useCallback(
    async (text: string, id?: string, speaker?: string) => {
      if (typeof window === 'undefined') return;
      if (!text || !text.trim()) return;

      stopSpeaking();

      // Track pending id synchronously so toggleSpeak can detect in-flight requests
      ttsPendingIdRef.current = id || 'global';

      // Create a new AbortController for this request
      const abortController = new AbortController();
      ttsAbortRef.current = abortController;

      // Attempt high quality Sarvam AI Bulbul TTS via backend
      try {
        const res = await synthesizeSpeech(text, locale, speaker, abortController.signal);

        // If aborted while waiting, don't play
        if (abortController.signal.aborted) return;

        if (res.audio_base64) {
          const audioUrl = `data:${res.format || 'audio/wav'};base64,${res.audio_base64}`;
          const audio = new Audio(audioUrl);
          currentAudioElementRef.current = audio;

          audio.onplay = () => {
            setIsSpeaking(true);
            setSpeakingId(id || 'global');
          };

          audio.onended = () => {
            currentAudioElementRef.current = null;
            setIsSpeaking(false);
            setSpeakingId(null);
          };

          audio.onerror = (e) => {
            console.warn('[useSpeech] Sarvam Audio playback error, falling back:', e);
            currentAudioElementRef.current = null;
            fallbackBrowserSpeak(text, id);
          };

          // Final staleness check before playing
          if (abortController.signal.aborted) return;
          await audio.play();
          return;
        }
      } catch (err: any) {
        // Silently ignore aborted requests
        if (err?.name === 'AbortError' || abortController.signal.aborted) return;
        console.warn('[useSpeech] Sarvam TTS request failed, falling back to browser synthesis:', err);
      }

      // Fallback to browser SpeechSynthesis (only if not aborted)
      if (!abortController.signal.aborted) {
        fallbackBrowserSpeak(text, id);
      }
    },
    [locale, stopSpeaking, fallbackBrowserSpeak]
  );

  const toggleSpeak = useCallback(
    (text: string, id: string, speaker?: string) => {
      // Detect active playback OR in-flight fetch for this message
      const isActiveForId =
        (isSpeaking && speakingId === id) || ttsPendingIdRef.current === id;
      if (isActiveForId) {
        stopSpeaking();
      } else {
        speak(text, id, speaker);
      }
    },
    [isSpeaking, speakingId, speak, stopSpeaking]
  );

  return {
    isListening,
    isTranscribing,
    transcript,
    interimTranscript,
    sttError,
    isSTTSupported,
    startListening,
    stopListening,
    toggleListening,
    isSpeaking,
    speakingId,
    isTTSSupported,
    speak,
    stopSpeaking,
    toggleSpeak,
  };
}
