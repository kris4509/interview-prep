import React, { useState, useRef } from 'react';
import api from '../api/client';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const card = { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px' };
const cyan = '#06b6d4';
const textPrimary = '#e6edf3';
const textMuted = '#8b949e';

export default function PracticeSession() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [jdText, setJdText] = useState('');
  const [jdLabel, setJdLabel] = useState('');
  const [jdSubmitting, setJdSubmitting] = useState(false);
  const [jdError, setJdError] = useState(null);
  const startTimeRef = useRef(null);

  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  async function handleGenerateFromJD() {
    if (jdText.trim().length < 30) {
      setJdError('Please paste a fuller job description.');
      return;
    }
    if (!jdLabel.trim()) {
      setJdError('Give this job a short label first.');
      return;
    }
    setJdSubmitting(true);
    setJdError(null);
    try {
      const { data } = await api.post('/questions/generate-from-jd', {
        job_description: jdText.trim(),
        label: jdLabel.trim(),
        count: 6
      });
      setSelectedRole(data.role_tag);
      const { data: session } = await api.post('/sessions', {
        title: `Practice — ${jdLabel.trim()}`,
        mode: 'online'
      });
      setSessionId(session.id);
      await loadNextQuestion(session.id, data.role_tag);
    } catch (err) {
      setJdError(err.response?.data?.error || 'Failed to generate questions.');
    } finally {
      setJdSubmitting(false);
    }
  }

  async function handleGeneralPractice() {
    setSelectedRole('general');
    const { data: session } = await api.post('/sessions', {
      title: 'General practice session',
      mode: 'online'
    });
    setSessionId(session.id);
    await loadNextQuestion(session.id, 'general');
  }

  async function loadNextQuestion(sessionIdOverride, roleOverride) {
    setFeedback(null);
    resetTranscript();
    const role = roleOverride || selectedRole;
    try {
      const { data } = await api.get('/questions/random', {
        params: role === 'general' ? {} : { role_tag: role }
      });
      setQuestion(data);
    } catch (err) {
      // No questions found for this role — generate some on the fly
      setError('No questions found for this role. Try generating from a job description.');
    }
  }

  function handleStartAnswer() {
    startTimeRef.current = Date.now();
    resetTranscript();
    startListening();
  }

  async function handleStopAnswer() {
    stopListening();
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (!transcript.trim()) {
      setError('No speech captured. Try again speaking clearly.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post('/responses', {
        session_id: sessionId,
        question_id: question.id,
        transcript_text: transcript.trim(),
        duration_seconds: durationSeconds
      });
      setFeedback(data.feedback);
    } catch (err) {
      setError('Failed to generate feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isSupported) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-10" style={{ ...card, borderColor: '#d97706' }}>
        <p style={{ color: '#fbbf24' }}>
          Your browser doesn't support speech recognition. Please use Chrome or Edge.
        </p>
      </div>
    );
  }

  // Role picker screen
  if (!selectedRole) {
    return (
      <div className="max-w-xl mx-auto px-4 mt-8 pb-20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: textPrimary }}>
            Start Practicing
          </h1>
          <p className="text-sm" style={{ color: textMuted }}>
            PrepAI works for any profession — paste your job description for tailored questions
          </p>
        </div>

        {/* PRIMARY: Job description */}
        <div style={card} className="p-5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ backgroundColor: cyan, color: '#0d1117' }}
            >
              Recommended
            </span>
            <p className="text-sm font-semibold" style={{ color: textPrimary }}>
              Practice from your job posting
            </p>
          </div>
          <p className="text-xs mb-4" style={{ color: textMuted }}>
            Works for any role — software engineer, lawyer, procurement officer, teacher, nurse,
            and more. Paste the actual job description and we generate questions specific to that posting.
          </p>
          <input
            type="text"
            placeholder='Short label, e.g. "safaricom_procurement" or "knh_nurse"'
            value={jdLabel}
            onChange={(e) => setJdLabel(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm mb-2 outline-none"
            style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', color: textPrimary }}
          />
          <textarea
            placeholder="Paste the full job description here..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={6}
            className="w-full rounded-lg px-3 py-2.5 text-sm mb-3 outline-none resize-none"
            style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', color: textPrimary }}
          />
          {jdError && (
            <p className="text-xs mb-2" style={{ color: '#f85149' }}>{jdError}</p>
          )}
          <button
            onClick={handleGenerateFromJD}
            disabled={jdSubmitting}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity"
            style={{ backgroundColor: cyan, color: '#0d1117', opacity: jdSubmitting ? 0.6 : 1 }}
          >
            {jdSubmitting ? 'Generating questions...' : '⚡ Generate & Start Practicing'}
          </button>
        </div>

        {/* DIVIDER */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ backgroundColor: '#30363d' }}></div>
          <span className="text-xs" style={{ color: textMuted }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#30363d' }}></div>
        </div>

        {/* SECONDARY: General fallback */}
        <button
          onClick={handleGeneralPractice}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all"
          style={{ ...card, color: textMuted }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = cyan;
            e.currentTarget.style.color = textPrimary;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#30363d';
            e.currentTarget.style.color = textMuted;
          }}
        >
          Practice with general interview questions →
        </button>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-10 text-center">
        <p style={{ color: textMuted }}>Loading question...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 mt-8 pb-20 space-y-4">
      <div className="flex items-center justify-between">
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{ backgroundColor: '#0d1117', border: `1px solid ${cyan}`, color: cyan }}
        >
          {selectedRole === 'general' ? '🎯 General' : `📋 ${selectedRole.replace('jd_', '').replace(/_/g, ' ')}`}
        </span>
        <button
          onClick={() => { setSelectedRole(null); setQuestion(null); setFeedback(null); }}
          className="text-xs transition-colors"
          style={{ color: textMuted }}
        >
          ← Change
        </button>
      </div>

      <div style={card} className="p-6">
        <span
          className="inline-block text-xs font-medium px-2 py-1 rounded mb-3"
          style={{ backgroundColor: '#0d1117', color: cyan }}
        >
          {question.category.replace('_', ' ')}
        </span>
        <h2 className="text-lg font-semibold leading-relaxed" style={{ color: textPrimary }}>
          {question.text}
        </h2>
      </div>

      <div style={card} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isListening && (
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: '#f85149' }}
              ></span>
            )}
            <span className="text-sm" style={{ color: isListening ? '#f85149' : textMuted }}>
              {isListening ? 'Recording...' : 'Ready when you are'}
            </span>
          </div>
          {!isListening ? (
            <button
              onClick={handleStartAnswer}
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-opacity"
              style={{ backgroundColor: cyan, color: '#0d1117', opacity: submitting ? 0.5 : 1 }}
            >
              Start Answer
            </button>
          ) : (
            <button
              onClick={handleStopAnswer}
              className="px-5 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#21262d', border: '1px solid #f85149', color: '#f85149' }}
            >
              Stop & Get Feedback
            </button>
          )}
        </div>

        <div
          className="min-h-20 p-4 rounded-lg text-sm leading-relaxed"
          style={{
            backgroundColor: '#0d1117',
            border: '1px solid #30363d',
            color: transcript ? textPrimary : textMuted
          }}
        >
          {transcript || 'Your live transcript will appear here...'}
        </div>

        {submitting && (
          <p className="text-sm mt-3 flex items-center gap-2" style={{ color: cyan }}>
            <span className="animate-spin">⚙</span> Generating feedback...
          </p>
        )}
        {error && <p className="text-sm mt-3" style={{ color: '#f85149' }}>{error}</p>}
      </div>

      {feedback && <FeedbackCard feedback={feedback} onNext={loadNextQuestion} />}
    </div>
  );
}

function FeedbackCard({ feedback, onNext }) {
  const getScoreColor = (score) => {
    if (score >= 4) return '#3fb950';
    if (score >= 3) return '#d29922';
    return '#f85149';
  };

  return (
    <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px' }} className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <span style={{ color: '#3fb950' }}>✓</span>
        <h3 className="font-semibold" style={{ color: '#e6edf3' }}>Feedback</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ScoreBox label="Structure" score={feedback.star_structure_score} color={getScoreColor(feedback.star_structure_score)} />
        <ScoreBox label="Specificity" score={feedback.specificity_score} color={getScoreColor(feedback.specificity_score)} />
        <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
          <p className="text-2xl font-bold" style={{ color: '#e6edf3' }}>{feedback.filler_word_count}</p>
          <p className="text-xs mt-1" style={{ color: '#8b949e' }}>Filler words</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#8b949e' }}>Pacing</p>
          <p className="text-sm" style={{ color: '#e6edf3' }}>{feedback.pacing_notes}</p>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#8b949e' }}>What's missing</p>
          <p className="text-sm" style={{ color: '#e6edf3' }}>{feedback.content_gap_notes}</p>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#0d1117', border: `1px solid ${cyan}` }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: cyan }}>Suggested rewrite</p>
          <p className="text-sm leading-relaxed" style={{ color: '#e6edf3' }}>{feedback.suggested_rewrite}</p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-2.5 rounded-lg text-sm font-medium"
        style={{ backgroundColor: cyan, color: '#0d1117' }}
      >
        Next Question →
      </button>
    </div>
  );
}

function ScoreBox({ label, score, color }) {
  return (
    <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
      <p className="text-2xl font-bold" style={{ color }}>{score}/5</p>
      <p className="text-xs mt-1" style={{ color: '#8b949e' }}>{label}</p>
    </div>
  );
}