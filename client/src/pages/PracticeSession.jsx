import React, { useState, useRef } from 'react';
import api from '../api/client';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const ROLES = [
  { value: 'general', label: 'General', icon: '🎯' },
  { value: 'frontend', label: 'Frontend', icon: '🖥️' },
  { value: 'backend', label: 'Backend', icon: '⚙️' },
  { value: 'fullstack', label: 'Full-stack', icon: '🔗' },
  { value: 'data', label: 'Data', icon: '📊' }
];

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
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState(null);
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

  async function handleGenerateQuestions(role) {
    setGenerating(true);
    setGenerateMessage(null);
    try {
      const { data } = await api.post('/questions/generate', { role_tag: role, count: 5 });
      setGenerateMessage(`✓ Added ${data.inserted} new ${role} questions.`);
    } catch (err) {
      setGenerateMessage('Failed to generate questions. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSelectRole(role) {
    setSelectedRole(role);
    const { data: session } = await api.post('/sessions', {
      title: `Practice session — ${role}`,
      mode: 'online'
    });
    setSessionId(session.id);
    await loadNextQuestion(session.id, role);
  }

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
        title: `Practice session — ${jdLabel.trim()}`,
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

  async function loadNextQuestion(sessionIdOverride, roleOverride) {
    setFeedback(null);
    resetTranscript();
    const role = roleOverride || selectedRole;
    const { data } = await api.get('/questions/random', {
      params: role === 'general' ? {} : { role_tag: role }
    });
    setQuestion(data);
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
        <p style={{ color: '#fbbf24' }}>Your browser doesn't support speech recognition. Please use Chrome or Edge.</p>
      </div>
    );
  }

  if (!selectedRole) {
    return (
      <div className="max-w-lg mx-auto px-4 mt-10 pb-20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: textPrimary }}>Start Practicing</h1>
          <p className="text-sm" style={{ color: textMuted }}>Pick a role or paste a job description to begin</p>
        </div>

        <div style={card} className="p-5 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textMuted }}>Practice by role</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((role) => (
              <button
                key={role.value}
                onClick={() => handleSelectRole(role.value)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left"
                style={{
                  backgroundColor: '#0d1117',
                  border: '1px solid #30363d',
                  color: textPrimary
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = cyan;
                  e.currentTarget.style.color = cyan;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#30363d';
                  e.currentTarget.style.color = textPrimary;
                }}
              >
                <span>{role.icon}</span>
                <span>{role.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #30363d' }}>
            <p className="text-xs mb-2" style={{ color: textMuted }}>Generate more questions for a role:</p>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <button
                  key={`gen-${role.value}`}
                  onClick={() => handleGenerateQuestions(role.value)}
                  disabled={generating}
                  className="text-xs px-3 py-1 rounded-full transition-colors"
                  style={{ border: `1px solid #30363d`, color: textMuted }}
                >
                  + {role.label}
                </button>
              ))}
            </div>
            {generating && <p className="text-xs mt-2" style={{ color: cyan }}>Generating...</p>}
            {generateMessage && <p className="text-xs mt-2" style={{ color: '#3fb950' }}>{generateMessage}</p>}
          </div>
        </div>

        <div style={card} className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: textMuted }}>Practice from a job posting</p>
          <p className="text-xs mb-4" style={{ color: textMuted }}>Paste any job description — we'll tailor questions to it</p>
          <input
            type="text"
            placeholder='Label, e.g. "google_swe_intern"'
            value={jdLabel}
            onChange={(e) => setJdLabel(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none"
            style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', color: textPrimary }}
          />
          <textarea
            placeholder="Paste the job description here..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={5}
            className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none resize-none"
            style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', color: textPrimary }}
          />
          {jdError && <p className="text-xs mb-2" style={{ color: '#f85149' }}>{jdError}</p>}
          <button
            onClick={handleGenerateFromJD}
            disabled={jdSubmitting}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity"
            style={{ backgroundColor: cyan, color: '#0d1117', opacity: jdSubmitting ? 0.6 : 1 }}
          >
            {jdSubmitting ? 'Generating questions...' : 'Generate & Start Practicing'}
          </button>
        </div>
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
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: '#0d1117', border: `1px solid ${cyan}`, color: cyan }}>
            {ROLES.find((r) => r.value === selectedRole)?.icon} {ROLES.find((r) => r.value === selectedRole)?.label || selectedRole}
          </span>
        </div>
        <button
          onClick={() => setSelectedRole(null)}
          className="text-xs transition-colors"
          style={{ color: textMuted }}
        >
          ← Change role
        </button>
      </div>

      <div style={card} className="p-6">
        <span className="inline-block text-xs font-medium px-2 py-1 rounded mb-3" style={{ backgroundColor: '#0d1117', color: cyan }}>
          {question.category.replace('_', ' ')}
        </span>
        <h2 className="text-lg font-semibold leading-relaxed" style={{ color: textPrimary }}>{question.text}</h2>
      </div>

      <div style={card} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isListening && (
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#f85149' }}></span>
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
          style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', color: transcript ? textPrimary : textMuted }}
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

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#0d1117', border: `1px solid #06b6d4` }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#06b6d4' }}>Suggested rewrite</p>
          <p className="text-sm leading-relaxed" style={{ color: '#e6edf3' }}>{feedback.suggested_rewrite}</p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity"
        style={{ backgroundColor: '#06b6d4', color: '#0d1117' }}
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