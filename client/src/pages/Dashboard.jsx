import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import AriaAvatar from '../components/AriaAvatar';

function StatCard({ icon, label, value, color = 'var(--cyan)', sub }) {
  return (
    <div className="glass" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        {sub && <span style={{ fontSize: 11, color: 'var(--gray)' }}>{sub}</span>}
      </div>
      <p style={{ fontSize: 32, fontWeight: 800, color, marginBottom: 4, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 13, color: 'var(--gray)' }}>{label}</p>
    </div>
  );
}

function AchievementBadge({ icon, label, description, unlocked }) {
  return (
    <div style={{
      padding: 16, borderRadius: 12, textAlign: 'center',
      background: unlocked ? 'rgba(23,215,255,0.06)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${unlocked ? 'rgba(23,215,255,0.2)' : 'var(--border)'}`,
      opacity: unlocked ? 1 : 0.4,
      transition: 'all 0.2s'
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <p style={{ fontSize: 12, fontWeight: 700, color: unlocked ? 'var(--white)' : 'var(--gray)', marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.4 }}>{description}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data } = await api.get('/sessions');
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Compute stats
  const totalInterviews = sessions.length;
  const recentSessions = sessions.slice(0, 3);

  // Achievements
  const achievements = [
    {
      icon: '🎤',
      label: 'First Interview',
      description: 'Completed your first interview with Aria',
      unlocked: totalInterviews >= 1
    },
    {
      icon: '🔥',
      label: 'On a Roll',
      description: 'Completed 3 interviews',
      unlocked: totalInterviews >= 3
    },
    {
      icon: '⚡',
      label: 'Practice Makes Perfect',
      description: 'Completed 5 interviews',
      unlocked: totalInterviews >= 5
    },
    {
      icon: '🏆',
      label: 'Interview Master',
      description: 'Completed 10 interviews',
      unlocked: totalInterviews >= 10
    },
    {
      icon: '🎯',
      label: 'Sharp Shooter',
      description: 'Completed 20 interviews',
      unlocked: totalInterviews >= 20
    },
    {
      icon: '💎',
      label: 'Elite',
      description: 'Completed 50 interviews',
      unlocked: totalInterviews >= 50
    }
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Welcome header */}
      <div style={{ marginBottom: 36 }} className="animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, #17D7FF, #4F7BFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#060B18'
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 2, letterSpacing: '-0.02em' }}>
              Welcome back, <span className="gradient-text">{user?.name}</span>
            </h1>
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>
              {totalInterviews === 0
                ? 'Ready to start your first interview with Aria?'
                : `You've completed ${totalInterviews} interview${totalInterviews !== 1 ? 's' : ''} so far. Keep going!`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard
          icon="🎤"
          label="Total Interviews"
          value={totalInterviews}
          color="var(--cyan)"
        />
        <StatCard
          icon="🏆"
          label="Achievements"
          value={`${unlockedCount}/${achievements.length}`}
          color="var(--blue)"
          sub="Unlocked"
        />
        <StatCard
          icon="🔥"
          label="Keep Practicing"
          value={totalInterviews >= 5 ? '🔥' : `${5 - totalInterviews} to go`}
          color="var(--purple)"
          sub="Next milestone: 5"
        />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <Link to="/practice" style={{ textDecoration: 'none' }}>
          <div className="glass glass-hover" style={{
            padding: 24, borderRadius: 16, cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(23,215,255,0.08), rgba(79,123,255,0.08))',
            border: '1px solid rgba(23,215,255,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <AriaAvatar size={44} speaking={false} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)', marginBottom: 2 }}>
                  Practice with Aria
                </p>
                <p style={{ fontSize: 12, color: 'var(--cyan)' }}>Start a new interview →</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
              Paste a job description and Aria will conduct a realistic interview tailored to your role.
            </p>
          </div>
        </Link>

        <Link to="/history" style={{ textDecoration: 'none' }}>
          <div className="glass glass-hover" style={{
            padding: 24, borderRadius: 16, cursor: 'pointer'
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📜</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>
              Review History
            </p>
            <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
              {totalInterviews > 0
                ? `Review your ${totalInterviews} past interview${totalInterviews !== 1 ? 's' : ''} and track improvements.`
                : 'Your interview history will appear here after your first session.'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--blue)', marginTop: 8 }}>View all →</p>
          </div>
        </Link>
      </div>

      {/* Recent interviews */}
      {!loading && recentSessions.length > 0 && (
        <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>Recent Interviews</p>
            <Link to="/history" style={{ fontSize: 12, color: 'var(--cyan)', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentSessions.map((session, i) => (
              <Link
                key={session.id}
                to="/history"
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10,
                  background: 'var(--bg-primary)', border: '1px solid var(--border)',
                  transition: 'border-color 0.2s'
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(23,215,255,0.08)',
                    border: '1px solid rgba(23,215,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16
                  }}>🎤</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--white)',
                      marginBottom: 2, whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {session.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--gray)' }}>
                      {new Date(session.started_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 6,
                    background: session.ended_at ? 'rgba(63,185,80,0.1)' : 'rgba(210,153,34,0.1)',
                    border: `1px solid ${session.ended_at ? 'rgba(63,185,80,0.3)' : 'rgba(210,153,34,0.3)'}`,
                    color: session.ended_at ? '#3fb950' : '#d29922',
                    flexShrink: 0
                  }}>
                    {session.ended_at ? '✓' : '●'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for new users */}
      {!loading && totalInterviews === 0 && (
        <div className="glass" style={{ padding: 48, textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <AriaAvatar size={80} speaking={false} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Ready for your first interview?
          </h3>
          <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            Aria will analyze your job description and ask you<br/>
            tailored questions — just like a real interview.
          </p>
          <Link to="/practice">
            <button className="btn-primary" style={{ padding: '12px 28px', fontSize: 14 }}>
              🚀 Start Interview with Aria
            </button>
          </Link>
        </div>
      )}

      {/* Achievements */}
      <div className="glass" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--white)', marginBottom: 2 }}>
              Achievements
            </p>
            <p style={{ fontSize: 12, color: 'var(--gray)' }}>
              {unlockedCount} of {achievements.length} unlocked
            </p>
          </div>
          <div style={{
            padding: '4px 12px', borderRadius: 20,
            background: 'rgba(23,215,255,0.08)',
            border: '1px solid rgba(23,215,255,0.2)'
          }}>
            <span style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 600 }}>
              {Math.round((unlockedCount / achievements.length) * 100)}% complete
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {achievements.map((a, i) => (
            <AchievementBadge key={i} {...a} />
          ))}
        </div>
      </div>
    </div>
  );
}