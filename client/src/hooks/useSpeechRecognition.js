import { useState, useRef, useCallback } from 'react';

// Wraps the browser's built-in SpeechRecognition (Web Speech API) — free,
// no API key, no server round-trip. Works in Chrome/Edge; Safari/Firefox
// support is inconsistent, so this hook reports `isSupported` so the UI
// can warn the user if needed.
export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const SpeechRecognitionAPI =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const isSupported = Boolean(SpeechRecognitionAPI);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    finalTranscriptRef.current = '';
    setTranscript('');

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += text + ' ';
        } else {
          interim += text;
        }
      }
      setTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      // Some browsers stop automatically after a pause — restart if we're
      // still supposed to be listening.
      if (recognitionRef.current === recognition) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      const recognition = recognitionRef.current;
      recognitionRef.current = null; // prevents onend from auto-restarting
      recognition.stop();
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
  }, []);

  return { transcript, isListening, isSupported, startListening, stopListening, resetTranscript };
}