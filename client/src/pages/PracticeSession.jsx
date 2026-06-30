import React, { useState, useRef } from 'react';
import api from '../api/client';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const ROLES = [
  { value: 'general', label: 'General' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'fullstack', label: 'Full-stack' },
  { value: 'data', label: 'Data' }
];

export default function PracticeSession() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState(null);
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
      setGenerateMessage(`Added ${data.inserted} new ${role} questions.`);
    } catch (err) {
      setGenerateMessage('Failed to generate questions. Please try again.');
      console.error(err);
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
      setError('No speech was captured. Try again, speaking clearly.');
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
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isSupported) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-10 bg-yellow-50 border border-yellow-300 rounded-lg">
        <p className="text-yellow-800">
          Your browser doesn't support live speech recognition. Please use Chrome or Edge for
          practice sessions.
        </p>
      </div>
    );
  }

  if (!selectedRole) {
    return (
      <div className="max-w-md mx-auto p-6 mt-20 bg-white shadow rounded-lg text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">What role are you practicing for?</h2>
        <p className="text-sm text-gray-500 mb-5">This picks questions matched to your target role.</p>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((role) => (
            <button
              key={role.value}
              onClick={() => handleSelectRole(role.value)}
              className="px-4 py-3 border rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:border-indigo-300"
            >
              {role.label}
            </button>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t">
          <p className="text-xs text-gray-500 mb-2">Want fresher questions for a role?</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {ROLES.map((role) => (
              <button
                key={`gen-${role.value}`}
                onClick={() => handleGenerateQuestions(role.value)}
                disabled={generating}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                + {role.label}
              </button>
            ))}
          </div>
          {generating && <p className="text-xs text-indigo-600 mt-2">Generating new questions...</p>}
          {generateMessage && <p className="text-xs text-gray-600 mt-2">{generateMessage}</p>}
        </div>
      </div>
    );
  }

  if (!question) {
    return <div className="max-w-2xl mx-auto p-6 mt-10 text-gray-500">Loading question...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Practicing: <span className="font-medium text-gray-700">{ROLES.find((r) => r.value === selectedRole)?.label}</span>
        </span>
        <button
          onClick={() => setSelectedRole(null)}
          className="text-xs text-indigo-600 hover:underline"
        >
          Change role
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <span className="inline-block text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded mb-3">
          {question.category.replace('_', ' ')}
        </span>
        <h2 className="text-xl font-semibold text-gray-900">{question.text}</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            {isListening ? 'Listening...' : 'Ready when you are'}
          </span>
          {!isListening ? (
            <button
              onClick={handleStartAnswer}
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Start Answer
            </button>
          ) : (
            <button
              onClick={handleStopAnswer}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Stop & Get Feedback
            </button>
          )}
        </div>

        <div className="min-h-[80px] p-3 bg-gray-50 rounded text-gray-700 text-sm">
          {transcript || <span className="text-gray-400">Your live transcript will appear here...</span>}
        </div>

        {submitting && <p className="text-sm text-indigo-600 mt-3">Generating feedback...</p>}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      {feedback && <FeedbackCard feedback={feedback} onNext={loadNextQuestion} />}
    </div>
  );
}

function FeedbackCard({ feedback, onNext }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Feedback</h3>

      <div className="grid grid-cols-2 gap-4">
        <ScoreBox label="Structure" score={feedback.star_structure_score} />
        <ScoreBox label="Specificity" score={feedback.specificity_score} />
      </div>

      <p className="text-sm text-gray-600">
        <span className="font-medium">Filler words:</span> {feedback.filler_word_count}
      </p>

      <div>
        <p className="text-sm font-medium text-gray-700">Pacing</p>
        <p className="text-sm text-gray-600">{feedback.pacing_notes}</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700">What's missing</p>
        <p className="text-sm text-gray-600">{feedback.content_gap_notes}</p>
      </div>

      <div className="bg-indigo-50 p-4 rounded">
        <p className="text-sm font-medium text-indigo-700 mb-1">Suggested rewrite</p>
        <p className="text-sm text-indigo-900">{feedback.suggested_rewrite}</p>
      </div>

      <button
        onClick={onNext}
        className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
      >
        Next Question
      </button>
    </div>
  );
}

function ScoreBox({ label, score }) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded">
      <p className="text-2xl font-bold text-gray-900">{score}/5</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}