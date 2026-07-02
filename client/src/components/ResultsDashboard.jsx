import AriaAvatar from './AriaAvatar';

function ScoreRing({ score, size = 120, label }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#17D7FF' : score >= 50 ? '#d29922' : '#f85149';

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          {/* Background ring */}
          <circle cx="50" cy="50" r={radius} fill="none"
            stroke="var(--border)" strokeWidth="8"/>
          {/* Score ring */}
          <circle cx="50" cy="50" r={radius} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 1.5s ease' }}
          />
          {/* Score text */}
          <text x="50" y="46" textAnchor="middle"
            style={{ fontSize: 20, fontWeight: 800, fill: 'white', fontFamily: 'sans-serif' }}>
            {score}%
          </text>
          <text x="50" y="60" textAnchor="middle"
            style={{ fontSize: 9, fill: '#8BA3C7', fontFamily: 'sans-serif' }}>
            {label}
          </text>
        </svg>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color = '#17D7FF' }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--gray)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${value}%`, borderRadius: 3,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          transition: 'width 1.2s ease'
        }}/>
      </div>
    </div>
  );
}

export default function ResultsDashboard({ responses, closingSummary, onRestart }) {
  if (!responses || responses.length === 0) return null;

  const avgStr = Math.round(responses.reduce((s, r) => s + r.star_structure_score, 0) / responses.length * 20);
  const avgSpec = Math.round(responses.reduce((s, r) => s + r.specificity_score, 0) / responses.length * 20);
  const overall = Math.round((avgStr + avgSpec) / 2);

  const strengths = [];
  const improvements = [];

  if (avgStr >= 70) strengths.push('Well-structured answers with clear STAR format');
  else improvements.push('Work on structuring answers using the STAR method');

  if (avgSpec >= 70) strengths.push('Strong use of specific details and examples');
  else improvements.push('Add more concrete numbers, outcomes, and specific details');

  const avgFiller = responses.reduce((s, r) => s + (r.filler_word_count || 0), 0) / responses.length;
  if (avgFiller <= 3) strengths.push('Clean, confident delivery with minimal filler words');
  else improvements.push(`Reduce filler words (averaging ${Math.round(avgFiller)} per answer)`);

  if (overall >= 70) strengths.push('Overall strong interview performance');
  else improvements.push('Keep practicing — consistency improves with repetition');

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}
      className="animate-fade-up">

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <AriaAvatar size={90} speaking={false} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>
          Interview Complete
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: 14 }}>
          Here's your detailed performance breakdown
        </p>
      </div>

      {/* Score rings */}
      <div className="glass" style={{ padding: 28, marginBottom: 16 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: 'var(--gray)',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24, textAlign: 'center'
        }}>Performance Overview</p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16, marginBottom: 28
        }}>
          <ScoreRing score={overall} label="Overall" size={130} />
          <ScoreRing score={avgStr} label="Structure" size={130} />
          <ScoreRing score={avgSpec} label="Specificity" size={130} />
        </div>

        {/* Breakdown bars */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <ProgressBar label="Answer Structure" value={avgStr}
            color={avgStr >= 70 ? '#17D7FF' : avgStr >= 50 ? '#d29922' : '#f85149'} />
          <ProgressBar label="Specificity & Detail" value={avgSpec}
            color={avgSpec >= 70 ? '#4F7BFF' : avgSpec >= 50 ? '#d29922' : '#f85149'} />
          <ProgressBar label="Overall Score" value={overall}
            color={overall >= 70 ? '#785DFF' : overall >= 50 ? '#d29922' : '#f85149'} />
        </div>
      </div>

      {/* Strengths + Improvements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Strengths */}
        <div className="glass" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>💪</span>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#3fb950', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Strengths
            </p>
          </div>
          {strengths.length > 0 ? strengths.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ color: '#3fb950', fontSize: 14, marginTop: 1 }}>✓</span>
              <p style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.5, margin: 0 }}>{s}</p>
            </div>
          )) : (
            <p style={{ fontSize: 13, color: 'var(--gray)' }}>Keep practicing to build your strengths.</p>
          )}
        </div>

        {/* Areas to improve */}
        <div className="glass" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>🎯</span>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#d29922', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Improve
            </p>
          </div>
          {improvements.length > 0 ? improvements.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ color: '#d29922', fontSize: 14, marginTop: 1 }}>→</span>
              <p style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.5, margin: 0 }}>{s}</p>
            </div>
          )) : (
            <p style={{ fontSize: 13, color: 'var(--gray)' }}>Great job! Keep it up.</p>
          )}
        </div>
      </div>

      {/* Aria's closing summary */}
      <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <AriaAvatar size={44} speaking={false} />
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', marginBottom: 6 }}>
              Aria's Feedback
            </p>
            <p style={{ fontSize: 14, color: 'var(--white)', lineHeight: 1.7, margin: 0 }}>
              {closingSummary || 'Generating summary...'}
            </p>
          </div>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div className="glass" style={{ padding: 20, marginBottom: 24 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: 'var(--gray)',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16
        }}>Question Breakdown</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {responses.map((r, i) => {
            const sc = Math.round((r.star_structure_score + r.specificity_score) / 2 * 20);
            const color = sc >= 70 ? '#3fb950' : sc >= 50 ? '#d29922' : '#f85149';
            return (
              <div key={i} style={{
                display: 'flex', gap: 16, alignItems: 'center',
                padding: 14, borderRadius: 12,
                background: 'var(--bg-primary)', border: '1px solid var(--border)'
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: `${color}18`, border: `1px solid ${color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color
                }}>
                  {sc}%
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: 'var(--white)', marginBottom: 2, lineHeight: 1.4 }}>
                    {r.question_text.length > 80 ? r.question_text.slice(0, 80) + '...' : r.question_text}
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                      Structure: <span style={{ color: 'var(--white)' }}>{r.star_structure_score}/5</span>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                      Specificity: <span style={{ color: 'var(--white)' }}>{r.specificity_score}/5</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onRestart}
        className="btn-primary"
        style={{ width: '100%', fontSize: 15, padding: '14px' }}
      >
        🎤 Start Another Interview
      </button>
    </div>
  );
}