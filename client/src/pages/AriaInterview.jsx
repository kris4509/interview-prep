import React, { useState, useRef, useEffect } from 'react';
import api from '../api/client';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAria } from '../hooks/useAria';
import AriaAvatar from '../components/AriaAvatar';
import ResultsDashboard from '../components/ResultsDashboard';

const STAGE = {
  SETUP: 'setup',
  INTRO: 'intro',
  QUESTION: 'question',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  FEEDBACK: 'feedback',
  FINISHED: 'finished'
};

function VoiceWave({ active, color = '#17D7FF', bars = 24 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 48 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} style={{
          width: 3,
          borderRadius: 2,
          background: color,
          height: active ? `${Math.random() * 36 + 6}px` : '4px',
          opacity: active ? (0.4 + Math.random() * 0.6) : 0.2,
          transition: 'height 0.1s ease',
          animation: active ? `wave ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate` : 'none',
          animationDelay: `${i * 0.04}s`
        }}/>
      ))}
    </div>
  );
}

function scoreColor(score) {
  if (score >= 4) return '#3fb950';
  if (score >= 3) return '#d29922';
  return '#f85149';
}

export default function AriaInterview() {
  const [stage, setStage] = useState(STAGE.SETUP);
  const [jdText, setJdText] = useState('');
  const [jdLabel, setJdLabel] = useState('');
  const [jdError, setJdError] = useState(null);
  const [jdSubmitting, setJdSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [ariaText, setAriaText] = useState('');
  const [closingSummary, setClosingSummary] = useState(null);
  const [transcript, setTranscriptState] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const currentIndexRef = useRef(0);
  const questionsRef = useRef([]);

  const { speak, stop } = useAria();
  const {
    transcript: liveTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  // Keep refs in sync with state
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  // Timer
  useEffect(() => {
    if (stage === STAGE.LISTENING) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [stage]);

  // Speak question when stage changes to QUESTION
  useEffect(() => {
    if (stage === STAGE.QUESTION && questionsRef.current[currentIndexRef.current]) {
      const text = `Question ${currentIndexRef.current + 1}. ${questionsRef.current[currentIndexRef.current].text}`;
      setAriaText(text);
      speak(text);
    }
  }, [stage, currentIndex]);

  async function handleStartInterview() {
    if (jdText.trim().length < 30) { setJdError('Please paste a fuller job description.'); return; }
    if (!jdLabel.trim()) { setJdError('Give this job a short label first.'); return; }
    setJdSubmitting(true);
    setJdError(null);
    try {
      const { data: genData } = await api.post('/questions/generate-from-jd', {
        job_description: jdText.trim(), label: jdLabel.trim(), count: 5
      });
      const { data: questionData } = await api.get('/questions', {
        params: { role_tag: genData.role_tag }
      });
      const sliced = questionData.slice(0, 5);
      setQuestions(sliced);
      questionsRef.current = sliced;

      const { data: session } = await api.post('/sessions', {
        title: `Aria Interview — ${jdLabel.trim()}`, mode: 'online'
      });
      setSessionId(session.id);
      setStage(STAGE.INTRO);

      const { data: introData } = await api.post('/aria/introduction', {
        job_label: jdLabel.trim()
      });
      setAriaText(introData.introduction);
      speak(introData.introduction, () => {
        setCurrentIndex(0);
        currentIndexRef.current = 0;
        setStage(STAGE.QUESTION);
      });
    } catch (err) {
      setJdError('Failed to start interview. Please try again.');
      console.error(err);
    } finally {
      setJdSubmitting(false);
    }
  }

  function handleStartAnswer() {
    stop();
    startTimeRef.current = Date.now();
    resetTranscript();
    setTranscriptState('');
    startListening();
    setStage(STAGE.LISTENING);
  }

  async function handleStopAnswer() {
    stopListening();
    const finalTranscript = liveTranscript.trim();
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (!finalTranscript) { setStage(STAGE.QUESTION); return; }
    setTranscriptState(finalTranscript);
    setStage(STAGE.PROCESSING);
    const question = questionsRef.current[currentIndexRef.current];
    try {
      const { data: responseData } = await api.post('/responses', {
        session_id: sessionId,
        question_id: question.id,
        transcript_text: finalTranscript,
        duration_seconds: durationSeconds
      });
      setCurrentFeedback(responseData.feedback);

      const { data: spokenData } = await api.post('/aria/spoken-feedback', {
        question_text: question.text,
        transcript: finalTranscript,
        full_feedback: responseData.feedback
      });

      setResponses(prev => [...prev, {
        question_text: question.text,
        transcript: finalTranscript,
        star_structure_score: responseData.feedback.star_structure_score,
        specificity_score: responseData.feedback.specificity_score,
        filler_word_count: responseData.feedback.filler_word_count
      }]);

      setAriaText(spokenData.spoken);
      setStage(STAGE.FEEDBACK);

      const wordCount = spokenData.spoken.split(' ').length;
      const estimatedDuration = Math.max(3000, wordCount * 400);

      let moved = false;
      function moveToNext() {
        if (moved) return;
        moved = true;
        const nextIndex = currentIndexRef.current + 1;
        if (nextIndex < questionsRef.current.length) {
          setCurrentIndex(nextIndex);
          currentIndexRef.current = nextIndex;
          setCurrentFeedback(null);
          setStage(STAGE.QUESTION);
        } else {
          handleFinishInterview();
        }
      }

      speak(spokenData.spoken, moveToNext);
      setTimeout(moveToNext, estimatedDuration + 1000);

    } catch (err) {
      console.error(err);
      setStage(STAGE.QUESTION);
    }
  }

  async function handleFinishInterview() {
    setStage(STAGE.FINISHED);
    try {
      const { data } = await api.post('/aria/closing-summary', { responses });
      setClosingSummary(data.summary);
      setAriaText(data.summary);
      speak(data.summary);
    } catch {
      setClosingSummary('Thank you for completing the interview. Review your session in the History tab.');
    }
  }

  const isSpeaking = [STAGE.INTRO, STAGE.QUESTION, STAGE.FEEDBACK].includes(stage);
  const isThinking = stage === STAGE.PROCESSING;
  const progress = questionsRef.current.length > 0
    ? (currentIndexRef.current / questionsRef.current.length) * 100 : 0;
  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ─── SETUP ───────────────────────────────────────────────────────
  if (stage === STAGE.SETUP) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 56px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px 40px'
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }} className="animate-fade-up">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <AriaAvatar size={150} speaking={false} />
            </div>
            <h1 style={{ fontSize: 38, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.03em' }}>
              Meet <span className="gradient-text">Aria</span>
            </h1>
            <p style={{ color: 'var(--gray)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
              Your AI interviewer — paste a job description and<br/>
              Aria will conduct a real interview tailored to your role.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {['✓ Real Interview', '✓ Voice Conversation', '✓ Instant Feedback', '✓ Any Profession'].map(f => (
                <span key={f} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: 'rgba(23, 215, 255, 0.08)',
                  border: '1px solid rgba(23, 215, 255, 0.2)',
                  color: 'var(--cyan)'
                }}>{f}</span>
              ))}
            </div>
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: 'var(--gray)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16
            }}>Job Description</p>

            <input
              type="text"
              placeholder='Short label, e.g. "google_swe" or "knh_nurse"'
              value={jdLabel}
              onChange={e => setJdLabel(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14,
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                color: 'var(--white)', outline: 'none', marginBottom: 10
              }}
            />
            <textarea
              placeholder="Paste the full job description here..."
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              rows={6}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14,
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                color: 'var(--white)', outline: 'none', resize: 'none', marginBottom: 12,
                lineHeight: 1.6
              }}
            />

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {['LinkedIn', 'Indeed', 'Plain Text', 'PDF'].map(s => (
                <span key={s} style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 6,
                  background: 'rgba(79, 123, 255, 0.08)',
                  border: '1px solid rgba(79, 123, 255, 0.2)',
                  color: 'var(--blue)'
                }}>✓ {s}</span>
              ))}
            </div>

            {jdError && <p style={{ color: '#f85149', fontSize: 13, marginBottom: 12 }}>{jdError}</p>}

            <button
              onClick={handleStartInterview}
              disabled={jdSubmitting}
              className="btn-primary"
              style={{ width: '100%', fontSize: 15, padding: '14px' }}
            >
              {jdSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="animate-spin-slow">◌</span>
                  Aria is preparing your interview...
                </span>
              ) : '🚀 Start Mock Interview'}
            </button>
          </div>

          {!isSupported && (
            <p style={{ color: '#f85149', fontSize: 13, textAlign: 'center', marginTop: 12 }}>
              ⚠️ Please use Chrome or Edge for voice features
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── FINISHED ────────────────────────────────────────────────────
  if (stage === STAGE.FINISHED) {
    return (
      <ResultsDashboard
        responses={responses}
        closingSummary={closingSummary}
        onRestart={() => {
          stop();
          setStage(STAGE.SETUP);
          setQuestions([]);
          setResponses([]);
          setCurrentIndex(0);
          currentIndexRef.current = 0;
          questionsRef.current = [];
          setCurrentFeedback(null);
          setJdText('');
          setJdLabel('');
          setAriaText('');
          setTranscriptState('');
          setClosingSummary(null);
        }}
      />
    );
  }

  // ─── INTERVIEW ROOM ──────────────────────────────────────────────
  const question = questionsRef.current[currentIndexRef.current];

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(6,11,24,0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', gap: 16
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--gray)' }}>
              {stage === STAGE.INTRO ? 'Introduction' : `Question ${currentIndexRef.current + 1} of ${questionsRef.current.length}`}
            </span>
            <span style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 600 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`, borderRadius: 2,
              background: 'linear-gradient(90deg, #17D7FF, #4F7BFF, #785DFF)',
              transition: 'width 0.6s ease'
            }}/>
          </div>
        </div>

        {stage === STAGE.LISTENING && (
          <div style={{
            padding: '4px 12px', borderRadius: 8,
            background: 'rgba(248, 81, 73, 0.1)',
            border: '1px solid rgba(248, 81, 73, 0.3)',
            color: '#f85149', fontSize: 13, fontWeight: 700,
            fontFamily: 'monospace'
          }}>
            {formatTime(elapsedSeconds)}
          </div>
        )}

        <button
          onClick={handleFinishInterview}
          style={{
            fontSize: 12, padding: '6px 14px', borderRadius: 8,
            color: 'var(--gray)', border: '1px solid var(--border)',
            background: 'transparent', cursor: 'pointer'
          }}
        >
          End Interview
        </button>
      </div>

      {/* Split layout */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
        gap: 0, overflow: 'hidden'
      }}>

        {/* LEFT — Aria panel */}
        <div style={{
          padding: '32px 24px',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: 'rgba(13, 21, 38, 0.4)'
        }}>
          <div style={{ marginBottom: 20 }}>
            <AriaAvatar size={160} speaking={isSpeaking} thinking={isThinking} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 700 }} className="gradient-text">Aria</span>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 10,
                background: isSpeaking
                  ? 'rgba(23, 215, 255, 0.15)'
                  : isThinking
                  ? 'rgba(79,123,255,0.15)'
                  : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isSpeaking ? 'rgba(23,215,255,0.3)' : isThinking ? 'rgba(79,123,255,0.3)' : 'var(--border)'}`,
                color: isSpeaking ? 'var(--cyan)' : isThinking ? 'var(--blue)' : 'var(--gray)'
              }}>
                {isSpeaking ? '● Speaking' : isThinking ? '◌ Thinking' : stage === STAGE.LISTENING ? '◎ Listening' : '● Ready'}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--gray)' }}>AI Interviewer</p>
          </div>

          {isSpeaking && (
            <div style={{ marginBottom: 20, width: '100%', maxWidth: 280 }}>
              <VoiceWave active={true} color="var(--cyan)" bars={20} />
            </div>
          )}

          <div style={{
            width: '100%', maxWidth: 340, padding: 20, borderRadius: 16,
            background: 'rgba(23, 215, 255, 0.04)',
            border: '1px solid rgba(23, 215, 255, 0.12)'
          }}>
            {isThinking ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="animate-spin-slow" style={{ fontSize: 18, color: 'var(--blue)' }}>◌</span>
                <span style={{ fontSize: 14, color: 'var(--gray)' }}>Analyzing your response...</span>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--white)', lineHeight: 1.7, margin: 0 }}>
                {ariaText || '...'}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT — User panel */}
        <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

          {question && (
            <div className="glass" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  background: 'rgba(79,123,255,0.1)', color: 'var(--blue)',
                  textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>
                  {question.category?.replace('_', ' ')}
                </span>
                <span style={{ fontSize: 11, color: 'var(--gray-dim)' }}>
                  Q{currentIndexRef.current + 1} / {questionsRef.current.length}
                </span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--white)', lineHeight: 1.6, margin: 0 }}>
                {question.text}
              </p>
            </div>
          )}

          {(stage === STAGE.QUESTION || stage === STAGE.LISTENING || stage === STAGE.PROCESSING) && (
            <div className="glass" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{
                  fontSize: 12,
                  color: isListening ? '#f85149' : 'var(--gray)',
                  fontWeight: isListening ? 600 : 400
                }}>
                  {stage === STAGE.PROCESSING ? 'Processing...' : isListening ? '● Recording' : 'Your answer'}
                </span>
                {stage === STAGE.QUESTION && (
                  <button onClick={handleStartAnswer} className="btn-primary"
                    style={{ padding: '8px 18px', fontSize: 13 }}>
                    Start Answer
                  </button>
                )}
                {stage === STAGE.LISTENING && (
                  <button
                    onClick={handleStopAnswer}
                    style={{
                      padding: '8px 18px', fontSize: 13, borderRadius: 10, fontWeight: 600,
                      background: 'transparent', border: '1px solid #f85149',
                      color: '#f85149', cursor: 'pointer'
                    }}
                  >
                    Done
                  </button>
                )}
              </div>

              {isListening && (
                <div style={{ marginBottom: 12 }}>
                  <VoiceWave active={true} color="#f85149" bars={28} />
                </div>
              )}

              <div style={{
                minHeight: 80, padding: 14, borderRadius: 10, fontSize: 14, lineHeight: 1.7,
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                color: liveTranscript ? 'var(--white)' : 'var(--gray-dim)'
              }}>
                {liveTranscript || 'Your answer will appear here as you speak...'}
              </div>
            </div>
          )}

          {stage === STAGE.FEEDBACK && currentFeedback && (
            <div className="glass" style={{ padding: 20 }}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: 'var(--gray)',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16
              }}>Detailed Feedback</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Structure', value: currentFeedback.star_structure_score, isScore: true },
                  { label: 'Specificity', value: currentFeedback.specificity_score, isScore: true },
                  { label: 'Fillers', value: currentFeedback.filler_word_count, isScore: false }
                ].map(({ label, value, isScore }) => (
                  <div key={label} style={{
                    textAlign: 'center', padding: 14, borderRadius: 10,
                    background: 'var(--bg-primary)', border: '1px solid var(--border)'
                  }}>
                    <p style={{
                      fontSize: 22, fontWeight: 800, marginBottom: 4,
                      color: isScore ? scoreColor(value) : 'var(--white)'
                    }}>
                      {isScore ? `${value}/5` : value}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--gray)' }}>{label}</p>
                  </div>
                ))}
              </div>

              <div style={{
                padding: 14, borderRadius: 10,
                background: 'rgba(23, 215, 255, 0.04)',
                border: '1px solid rgba(23, 215, 255, 0.15)',
                marginBottom: 12
              }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--cyan)',
                  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>
                  Suggested rewrite
                </p>
                <p style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.7, margin: 0 }}>
                  {currentFeedback.suggested_rewrite}
                </p>
              </div>

              <div style={{
                padding: 14, borderRadius: 10,
                background: 'var(--bg-primary)', border: '1px solid var(--border)'
              }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--gray)',
                  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>
                  Your answer
                </p>
                <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                  "{transcript}"
                </p>
              </div>
            </div>
          )}

          {stage === STAGE.PROCESSING && (
            <div className="glass" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span className="animate-spin-slow" style={{ fontSize: 20, color: 'var(--cyan)' }}>◌</span>
                <span style={{ color: 'var(--cyan)', fontSize: 14 }}>Aria is analyzing your response...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}