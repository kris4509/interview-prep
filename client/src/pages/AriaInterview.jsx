import React, { useState, useRef, useEffect } from 'react';
import api from '../api/client';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAria } from '../hooks/useAria';
import AriaAvatar from '../components/AriaAvatar';

const STAGE = {
  SETUP: 'setup',
  INTRO: 'intro',
  QUESTION: 'question',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  FEEDBACK: 'feedback',
  FINISHED: 'finished'
};

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
  const startTimeRef = useRef(null);
  const { speak, stop } = useAria();
  const { transcript, isListening, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (stage === STAGE.QUESTION && questions[currentIndex]) {
      const text = `Question ${currentIndex + 1}. ${questions[currentIndex].text}`;
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
      const { data: questionData } = await api.get('/questions', { params: { role_tag: genData.role_tag } });
      setQuestions(questionData.slice(0, 5));
      const { data: session } = await api.post('/sessions', { title: `Aria Interview — ${jdLabel.trim()}`, mode: 'online' });
      setSessionId(session.id);
      setStage(STAGE.INTRO);
      const { data: introData } = await api.post('/aria/introduction', { job_label: jdLabel.trim() });
      setAriaText(introData.introduction);
      speak(introData.introduction, () => { setCurrentIndex(0); setStage(STAGE.QUESTION); });
    } catch (err) {
      setJdError('Failed to start interview. Please try again.');
    } finally {
      setJdSubmitting(false);
    }
  }

  function handleStartAnswer() {
    stop();
    startTimeRef.current = Date.now();
    resetTranscript();
    startListening();
    setStage(STAGE.LISTENING);
  }

  async function handleStopAnswer() {
    stopListening();
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (!transcript.trim()) { setStage(STAGE.QUESTION); return; }
    setStage(STAGE.PROCESSING);
    const question = questions[currentIndex];
    try {
      const { data: responseData } = await api.post('/responses', {
        session_id: sessionId, question_id: question.id,
        transcript_text: transcript.trim(), duration_seconds: durationSeconds
      });
      setCurrentFeedback(responseData.feedback);
      const { data: spokenData } = await api.post('/aria/spoken-feedback', {
        question_text: question.text, transcript: transcript.trim(), full_feedback: responseData.feedback
      });
      setResponses(prev => [...prev, {
        question_text: question.text, transcript: transcript.trim(),
        star_structure_score: responseData.feedback.star_structure_score,
        specificity_score: responseData.feedback.specificity_score
      }]);
      setAriaText(spokenData.spoken);
      setStage(STAGE.FEEDBACK);
      speak(spokenData.spoken, () => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < questions.length) {
          setCurrentIndex(nextIndex); setCurrentFeedback(null); setStage(STAGE.QUESTION);
        } else { handleFinishInterview(); }
      });
    } catch (err) {
      console.error(err); setStage(STAGE.QUESTION);
    }
  }

  async function handleFinishInterview() {
    setStage(STAGE.FINISHED);
    try {
      const { data } = await api.post('/aria/closing-summary', { responses });
      setClosingSummary(data.summary);
      setAriaText(data.summary);
      speak(data.summary);
    } catch (err) {
      setClosingSummary('Thank you for completing the interview. Review your session in the History tab.');
    }
  }

  const isSpeaking = stage === STAGE.INTRO || stage === STAGE.QUESTION || stage === STAGE.FEEDBACK;
  const isThinking = stage === STAGE.PROCESSING;
  const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  // ─── SETUP ───────────────────────────────────────────────────────
  if (stage === STAGE.SETUP) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px 24px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 40 }} className="animate-fade-up">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <AriaAvatar size={140} speaking={false} />
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Meet <span className="gradient-text">Aria</span>
            </h1>
            <p style={{ color: 'var(--gray)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
              Your AI interviewer — paste a job description and<br/>Aria will conduct a real interview tailored to your role.
            </p>

            {/* Feature chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
              {['✓ Real Interview', '✓ Voice Conversation', '✓ Instant Feedback', '✓ Any Profession'].map(f => (
                <span key={f} style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: 'rgba(23, 215, 255, 0.08)', border: '1px solid rgba(23, 215, 255, 0.2)',
                  color: 'var(--cyan)'
                }}>{f}</span>
              ))}
            </div>
          </div>

          {/* Input card */}
          <div className="glass" style={{ padding: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Job Description
            </p>
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

            {/* Supported sources */}
            <div style={{
              display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16
            }}>
              {['LinkedIn', 'Indeed', 'Plain Text', 'PDF'].map(s => (
                <span key={s} style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 6,
                  background: 'rgba(79, 123, 255, 0.08)', border: '1px solid rgba(79, 123, 255, 0.2)',
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
                  <span style={{ animation: 'spin-slow 1s linear infinite', display: 'inline-block' }}>◌</span>
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
    const avgStructure = responses.length > 0
      ? Math.round(responses.reduce((s, r) => s + r.star_structure_score, 0) / responses.length * 20)
      : 0;
    const avgSpecificity = responses.length > 0
      ? Math.round(responses.reduce((s, r) => s + r.specificity_score, 0) / responses.length * 20)
      : 0;
    const overall = Math.round((avgStructure + avgSpecificity) / 2);

    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px' }} className="animate-fade-up">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <AriaAvatar size={80} speaking={false} />
          <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 16, marginBottom: 4 }}>Interview Complete</h1>
          <p style={{ color: 'var(--gray)', fontSize: 14 }}>Here's how you did</p>
        </div>

        {/* Overall score */}
        <div className="glass" style={{ padding: 24, textAlign: 'center', marginBottom: 16 }}>
          <p style={{ color: 'var(--gray)', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Overall Score</p>
          <p style={{ fontSize: 64, fontWeight: 800, lineHeight: 1 }} className="gradient-text">{overall}%</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
            {[
              { label: 'Structure', value: avgStructure },
              { label: 'Specificity', value: avgSpecificity }
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--gray)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cyan)' }}>{value}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                  <div style={{
                    height: '100%', borderRadius: 3, width: `${value}%`,
                    background: 'linear-gradient(90deg, #17D7FF, #4F7BFF)',
                    transition: 'width 1s ease'
                  }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aria's closing summary */}
        <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AriaAvatar size={36} speaking={false} />
            <div>
              <p style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 600, marginBottom: 4 }}>Aria</p>
              <p style={{ fontSize: 14, color: 'var(--white)', lineHeight: 1.7 }}>
                {closingSummary || 'Generating summary...'}
              </p>
            </div>
          </div>
        </div>

        {/* Per-question scores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {responses.map((r, i) => {
            const score = Math.round((r.star_structure_score + r.specificity_score) / 2 * 20);
            const color = score >= 70 ? '#3fb950' : score >= 50 ? '#d29922' : '#f85149';
            return (
              <div key={i} className="glass" style={{ padding: 16 }}>
                <p style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 8 }}>Q{i + 1}</p>
                <p style={{ fontSize: 12, color: 'var(--white)', marginBottom: 10, lineHeight: 1.4 }}
                  title={r.question_text}>
                  {r.question_text.length > 60 ? r.question_text.slice(0, 60) + '...' : r.question_text}
                </p>
                <p style={{ fontSize: 22, fontWeight: 800, color }}>{score}%</p>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            stop();
            setStage(STAGE.SETUP);
            setQuestions([]); setResponses([]); setCurrentIndex(0);
            setCurrentFeedback(null); setJdText(''); setJdLabel('');
          }}
          className="btn-primary"
          style={{ width: '100%', fontSize: 15, padding: '14px' }}
        >
          Start Another Interview
        </button>
      </div>
    );
  }

  // ─── INTERVIEW ────────────────────────────────────────────────────
  const question = questions[currentIndex];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 24px 80px' }}>

      {/* Top bar — progress + end button */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--gray)' }}>
            {stage === STAGE.INTRO ? 'Introduction' : `Question ${currentIndex + 1} of ${questions.length}`}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 600 }}>{Math.round(progress)}%</span>
            <button
              onClick={handleFinishInterview}
              style={{
                fontSize: 12, padding: '6px 12px', borderRadius: 8,
                color: '#f85149', border: '1px solid var(--border)', background: 'transparent',
                cursor: 'pointer'
              }}
            >
              End Interview
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
          <div style={{
            height: '100%', borderRadius: 2, width: `${progress}%`,
            background: 'linear-gradient(90deg, #17D7FF, #4F7BFF)',
            transition: 'width 0.5s ease'
          }}/>
        </div>
      </div>

      {/* Aria card */}
      <div className="glass" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0 }}>
            <AriaAvatar size={56} speaking={isSpeaking} thinking={isThinking} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)' }}>Aria</span>
              {isSpeaking && (
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  {[0, 150, 300].map(delay => (
                    <div key={delay} style={{
                      width: 4, height: 4, borderRadius: '50%', background: 'var(--cyan)',
                      animation: `pulse-ring 1s ease-in-out infinite`,
                      animationDelay: `${delay}ms`
                    }}/>
                  ))}
                </div>
              )}
              {isThinking && (
                <span style={{ fontSize: 12, color: 'var(--gray)' }}>analyzing your response...</span>
              )}
            </div>
            <p style={{ fontSize: 15, color: 'var(--white)', lineHeight: 1.7 }}>
              {isThinking ? 'Aria is reviewing your answer...' : (ariaText || '...')}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed feedback card */}
      {stage === STAGE.FEEDBACK && currentFeedback && (
        <div className="glass" style={{ padding: 20, marginBottom: 16 }} >
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Detailed Feedback
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Structure', score: currentFeedback.star_structure_score, max: 5 },
              { label: 'Specificity', score: currentFeedback.specificity_score, max: 5 },
              { label: 'Fillers', score: currentFeedback.filler_word_count, isCount: true }
            ].map(({ label, score, isCount }) => {
              const color = isCount ? 'var(--white)' : score >= 4 ? '#3fb950' : score >= 3 ? '#d29922' : '#f85149';
              return (
                <div key={label} style={{
                  textAlign: 'center', padding: 16, borderRadius: 12,
                  background: 'var(--bg-primary)', border: '1px solid var(--border)'
                }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 4 }}>
                    {isCount ? score : `${score}/5`}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--gray)' }}>{label}</p>
                </div>
              );
            })}
          </div>
          <div style={{
            padding: 16, borderRadius: 12, background: 'var(--bg-primary)',
            border: '1px solid rgba(23, 215, 255, 0.2)'
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Suggested rewrite
            </p>
            <p style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.7 }}>
              {currentFeedback.suggested_rewrite}
            </p>
          </div>
        </div>
      )}

      {/* User answer area */}
      {(stage === STAGE.QUESTION || stage === STAGE.LISTENING) && (
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isListening && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#f85149',
                  animation: 'pulse-ring 1s ease-in-out infinite'
                }}/>
              )}
              <span style={{ fontSize: 13, color: isListening ? '#f85149' : 'var(--gray)' }}>
                {isListening ? 'Recording...' : 'Your turn to answer'}
              </span>
            </div>
            {stage === STAGE.QUESTION ? (
              <button onClick={handleStartAnswer} className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
                Start Answer
              </button>
            ) : (
              <button
                onClick={handleStopAnswer}
                style={{
                  padding: '10px 20px', fontSize: 14, borderRadius: 12, fontWeight: 600,
                  background: 'transparent', border: '1px solid #f85149', color: '#f85149',
                  cursor: 'pointer'
                }}
              >
                Done Answering
              </button>
            )}
          </div>

          {/* Voice waveform when listening */}
          {isListening && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: 40, marginBottom: 12 }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} style={{
                  width: 3, borderRadius: 2, background: 'var(--cyan)',
                  height: Math.random() * 32 + 4,
                  animation: `wave ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.05}s`
                }}/>
              ))}
            </div>
          )}

          <div style={{
            minHeight: 80, padding: 16, borderRadius: 12, fontSize: 14, lineHeight: 1.7,
            background: 'var(--bg-primary)', border: '1px solid var(--border)',
            color: transcript ? 'var(--white)' : 'var(--gray-dim)'
          }}>
            {transcript || 'Your answer will appear here as you speak...'}
          </div>
        </div>
      )}

      {/* Thinking state */}
      {stage === STAGE.PROCESSING && (
        <div className="glass" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ animation: 'spin-slow 1s linear infinite', fontSize: 20 }}>◌</div>
            <span style={{ color: 'var(--cyan)', fontSize: 14 }}>Aria is analyzing your response...</span>
          </div>
        </div>
      )}
    </div>
  );
}