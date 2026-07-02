import React, { useState, useEffect } from 'react';
import api from '../api/client';
import AriaAvatar from '../components/AriaAvatar';

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <AriaAvatar size={100} speaking={false} />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--white)' }}>
        No interviews yet
      </h2>
      <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        Start your first interview with Aria and your<br/>results will appear here.
      </p>
      <a href="/practice" style={{
        display: 'inline-block', padding: '12px 24px', borderRadius: 12,
        background: 'linear-gradient(135deg, #17D7FF, #4F7BFF)',
        color: '#060B18', fontWeight: 700, fontSize: 14, textDecoration: 'none'
      }}>
        🎤 Start Interview with Aria
      </a>
    </div>
  );
}

function ScoreBadge({ score }) {
  const color = score >= 70 ? '#3fb950' : score >= 50 ? '#d29922' : '#f85149';
  return (
    <div style={{
      width: 52, height: 52, borderRadius: 12, flexShrink: 0,
      background: `${color}18`, border: `1px solid ${color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 800, color
    }}>
      {score}%
    </div>
  );
}

function SessionCard({ session, onClick }) {
  const date = new Date(session.started_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  const time = new Date(session.started_at).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <button
      onClick={onClick}
      className="glass glass-hover"
      style={{
        width: '100%', textAlign: 'left', padding: 20,
        cursor: 'pointer', border: '1px solid var(--border)',
        borderRadius: 16, background: 'rgba(15,26,46,0.8)',
        display: 'flex', alignItems: 'center', gap: 16
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: 'rgba(23, 215, 255, 0.08)',
        border: '1px solid rgba(23, 215, 255, 0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20
      }}>
        🎤
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 600, color: 'var(--white)',
          marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {session.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--gray)' }}>{date} · {time}</span>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 6,
            background: session.ended_at ? 'rgba(63,185,80,0.1)' : 'rgba(210,153,34,0.1)',
            border: `1px solid ${session.ended_at ? 'rgba(63,185,80,0.3)' : 'rgba(210,153,34,0.3)'}`,
            color: session.ended_at ? '#3fb950' : '#d29922'
          }}>
            {session.ended_at ? '✓ Completed' : '● In progress'}
          </span>
        </div>
      </div>

      <span style={{ color: 'var(--gray)', fontSize: 18, flexShrink: 0 }}>›</span>
    </button>
  );
}

function SessionDetail({ session, onBack }) {
  const getScoreColor = score => {
    if (score >= 4) return '#3fb950';
    if (score >= 3) return '#d29922';
    return '#f85149';
  };

  const responses = session.responses || [];
  const avgStr = responses.length
    ? Math.round(responses.reduce((s, r) => s + (r.star_structure_score || 0), 0) / responses.length * 20) : 0;
  const avgSpec = responses.length
    ? Math.round(responses.reduce((s, r) => s + (r.specificity_score || 0), 0) / responses.length * 20) : 0;
  const overall = Math.round((avgStr + avgSpec) / 2);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 80px' }}
      className="animate-fade-up">

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--gray)', fontSize: 14, background: 'none',
          border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0
        }}
      >
        ← Back to history
      </button>

      {/* Session header */}
      <div className="glass" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(23, 215, 255, 0.08)',
            border: '1px solid rgba(23, 215, 255, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
          }}>
            🎤
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>
              {session.session.title}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--gray)' }}>
              {new Date(session.session.started_at).toLocaleString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Score summary */}
        {responses.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Overall', value: overall },
              { label: 'Structure', value: avgStr },
              { label: 'Specificity', value: avgSpec }
            ].map(({ label, value }) => {
              const color = value >= 70 ? '#17D7FF' : value >= 50 ? '#d29922' : '#f85149';
              return (
                <div key={label} style={{
                  textAlign: 'center', padding: 16, borderRadius: 12,
                  background: 'var(--bg-primary)', border: '1px solid var(--border)'
                }}>
                  <p style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 4 }}>{value}%</p>
                  <p style={{ fontSize: 11, color: 'var(--gray)' }}>{label}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* No responses state */}
      {responses.length === 0 && (
        <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--gray)', fontSize: 14 }}>No answers were recorded in this session.</p>
        </div>
      )}

      {/* Per-question responses */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {responses.map((response, index) => {
          const sc = response.star_structure_score != null
            ? Math.round((response.star_structure_score + response.specificity_score) / 2 * 20)
            : null;

          return (
            <div key={response.id} className="glass" style={{ padding: 20 }}>
              {/* Question header */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                {sc !== null && <ScoreBadge score={sc} />}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                      background: 'rgba(79,123,255,0.1)', color: 'var(--blue)',
                      textTransform: 'uppercase', letterSpacing: '0.08em'
                    }}>
                      {response.category?.replace('_', ' ') || 'behavioral'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--gray-dim)' }}>Q{index + 1}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)', lineHeight: 1.5, margin: 0 }}>
                    {response.question_text}
                  </p>
                </div>
              </div>

              {/* Transcript */}
              {response.transcript_text && (
                <div style={{
                  padding: 14, borderRadius: 10, marginBottom: 12,
                  background: 'var(--bg-primary)', border: '1px solid var(--border)'
                }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--gray)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6
                  }}>Your Answer</p>
                  <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                    "{response.transcript_text}"
                  </p>
                </div>
              )}

              {/* Scores */}
              {response.star_structure_score != null && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Structure', value: response.star_structure_score, isScore: true },
                    { label: 'Specificity', value: response.specificity_score, isScore: true },
                    { label: 'Fillers', value: response.filler_word_count, isScore: false }
                  ].map(({ label, value, isScore }) => (
                    <div key={label} style={{
                      textAlign: 'center', padding: 10, borderRadius: 8,
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)'
                    }}>
                      <p style={{
                        fontSize: 18, fontWeight: 800, marginBottom: 2,
                        color: isScore ? getScoreColor(value) : 'var(--white)'
                      }}>
                        {isScore ? `${value}/5` : value ?? '-'}
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--gray)' }}>{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggested rewrite */}
              {response.suggested_rewrite && (
                <div style={{
                  padding: 14, borderRadius: 10,
                  background: 'rgba(23,215,255,0.04)',
                  border: '1px solid rgba(23,215,255,0.15)'
                }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--cyan)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6
                  }}>Suggested Rewrite</p>
                  <p style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.7, margin: 0 }}>
                    {response.suggested_rewrite}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      const { data } = await api.get('/sessions');
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function viewSession(id) {
    try {
      const { data } = await api.get(`/sessions/${id}`);
      setSelectedSession(data);
    } catch (err) {
      console.error(err);
    }
  }

  if (selectedSession) {
    return <SessionDetail session={selectedSession} onBack={() => setSelectedSession(null)} />;
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>
          Practice History
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: 14 }}>
          Review your past interviews and track your progress
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <span className="animate-spin-slow" style={{ fontSize: 24, color: 'var(--cyan)' }}>◌</span>
        </div>
      )}

      {!loading && sessions.length === 0 && <EmptyState />}

      {!loading && sessions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onClick={() => viewSession(session.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}