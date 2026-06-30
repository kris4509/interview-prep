import React, { useState, useEffect } from 'react';
import api from '../api/client';

const card = { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px' };
const textPrimary = '#e6edf3';
const textMuted = '#8b949e';
const cyan = '#06b6d4';

export default function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    const { data } = await api.get('/sessions');
    setSessions(data);
    setLoading(false);
  }

  async function viewSession(id) {
    const { data } = await api.get(`/sessions/${id}`);
    setSelectedSession(data);
  }

  if (selectedSession) {
    return (
      <SessionDetail
        session={selectedSession}
        onBack={() => setSelectedSession(null)}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 mt-8 pb-20">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: textPrimary }}>Practice History</h1>
        <p className="text-sm mt-1" style={{ color: textMuted }}>Review your past sessions and feedback</p>
      </div>

      {loading && (
        <p className="text-sm" style={{ color: textMuted }}>Loading sessions...</p>
      )}

      {!loading && sessions.length === 0 && (
        <div style={card} className="p-8 text-center">
          <p className="text-2xl mb-2">🎯</p>
          <p className="font-medium mb-1" style={{ color: textPrimary }}>No sessions yet</p>
          <p className="text-sm" style={{ color: textMuted }}>Start practicing to see your history here</p>
        </div>
      )}

      <div className="space-y-3">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => viewSession(session.id)}
            className="w-full text-left p-4 rounded-xl transition-colors"
            style={{ ...card }}
            onMouseEnter={e => e.currentTarget.style.borderColor = cyan}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#30363d'}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm" style={{ color: textPrimary }}>{session.title}</span>
              <span className="text-xs" style={{ color: textMuted }}>
                {new Date(session.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#0d1117', color: textMuted, border: '1px solid #30363d' }}>
                {session.mode}
              </span>
              <span className="text-xs" style={{ color: session.ended_at ? '#3fb950' : '#d29922' }}>
                {session.ended_at ? '✓ Completed' : '● In progress'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SessionDetail({ session, onBack }) {
  const getScoreColor = (score) => {
    if (score >= 4) return '#3fb950';
    if (score >= 3) return '#d29922';
    return '#f85149';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 mt-8 pb-20">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm mb-6 transition-colors"
        style={{ color: textMuted }}
      >
        ← Back to history
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: textPrimary }}>{session.session.title}</h1>
        <p className="text-xs mt-1" style={{ color: textMuted }}>
          {new Date(session.session.started_at).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}
        </p>
      </div>

      {session.responses.length === 0 && (
        <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px' }} className="p-8 text-center">
          <p className="text-sm" style={{ color: textMuted }}>No answers recorded in this session.</p>
        </div>
      )}

      <div className="space-y-4">
        {session.responses.map((response, index) => (
          <div key={response.id} style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px' }} className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: '#0d1117', color: cyan }}>
                Q{index + 1} · {response.category?.replace('_', ' ')}
              </span>
            </div>
            <p className="font-medium text-sm mb-3" style={{ color: textPrimary }}>{response.question_text}</p>
            <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
              <p className="text-xs mb-1" style={{ color: textMuted }}>Your answer</p>
              <p className="text-sm italic" style={{ color: '#8b949e' }}>"{response.transcript_text}"</p>
            </div>

            {response.star_structure_score != null && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
                  <p className="text-lg font-bold" style={{ color: getScoreColor(response.star_structure_score) }}>
                    {response.star_structure_score}/5
                  </p>
                  <p className="text-xs" style={{ color: textMuted }}>Structure</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
                  <p className="text-lg font-bold" style={{ color: getScoreColor(response.specificity_score) }}>
                    {response.specificity_score}/5
                  </p>
                  <p className="text-xs" style={{ color: textMuted }}>Specificity</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
                  <p className="text-lg font-bold" style={{ color: textPrimary }}>{response.filler_word_count}</p>
                  <p className="text-xs" style={{ color: textMuted }}>Fillers</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}