// Aria's voice — wraps the browser's free SpeechSynthesis API
// so she can speak questions, feedback, and introductions naturally.

import { useCallback, useRef } from 'react';

export function useAria() {
  const synthRef = useRef(window.speechSynthesis);
  const currentUtteranceRef = useRef(null);

  // Pick the best available voice for Aria — prefer a female English voice
  function getAriaVoice() {
    const voices = synthRef.current.getVoices();

    // Priority order: natural-sounding English female voices
    const preferred = voices.find(v =>
      v.name.includes('Samantha') || // macOS
      v.name.includes('Zira') ||     // Windows
      v.name.includes('Google UK English Female') ||
      v.name.includes('Microsoft Aria') ||
      v.name.includes('Karen')
    );

    // Fallback: any English female voice
    const fallback = voices.find(v =>
      v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
    );

    // Last resort: first English voice available
    const lastResort = voices.find(v => v.lang.startsWith('en'));

    return preferred || fallback || lastResort || voices[0];
  }

  const speak = useCallback((text, onEnd) => {
    // Cancel anything currently playing
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = getAriaVoice();
    utterance.rate = 0.92;   // slightly slower than default — more natural for an interviewer
    utterance.pitch = 1.05;
    utterance.volume = 1;

    if (onEnd) {
      utterance.onend = onEnd;
    }

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    synthRef.current.cancel();
  }, []);

  const isSpeaking = useCallback(() => {
    return synthRef.current.speaking;
  }, []);

  return { speak, stop, isSpeaking };
}