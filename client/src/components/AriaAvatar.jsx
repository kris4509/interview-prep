export default function AriaAvatar({ size = 120, speaking = false, thinking = false }) {
  const spd = speaking ? 1 : 2;

  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="cg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#17D7FF" stopOpacity="0.95"/>
            <stop offset="50%" stopColor="#17D7FF" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#17D7FF" stopOpacity="0.1"/>
          </linearGradient>
          <linearGradient id="cg2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4F7BFF" stopOpacity="0.95"/>
            <stop offset="50%" stopColor="#4F7BFF" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#4F7BFF" stopOpacity="0.1"/>
          </linearGradient>
          <linearGradient id="cg3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#785DFF" stopOpacity="0.95"/>
            <stop offset="50%" stopColor="#785DFF" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#785DFF" stopOpacity="0.1"/>
          </linearGradient>
          <radialGradient id="core">
            <stop offset="0%" stopColor="#0D1526"/>
            <stop offset="100%" stopColor="#060B18"/>
          </radialGradient>
          <filter id="sg">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Speaking pulse rings */}
        {speaking && [1, 2].map(i => (
          <circle key={i} cx="100" cy="100" r={92 + i * 10}
            fill="none" stroke="#17D7FF" strokeWidth="0.8"
            opacity={0.15 - i * 0.04}
            style={{ animation: `pulse-ring ${1.5 + i * 0.5}s ease-in-out infinite ${i * 0.3}s` }}
          />
        ))}

        {/* Ring 1 — CYAN — tilted like a horizontal orbit */}
        <ellipse cx="100" cy="100" rx="85" ry="28"
          fill="none" stroke="url(#cg1)" strokeWidth="14"
          opacity="0.85"
          style={{
            transformOrigin: '100px 100px',
            animation: `spin-slow ${10 / spd}s linear infinite`,
          }}
        />

        {/* Ring 2 — BLUE — tilted diagonally */}
        <ellipse cx="100" cy="100" rx="85" ry="28"
          fill="none" stroke="url(#cg2)" strokeWidth="14"
          opacity="0.85"
          style={{
            transformOrigin: '100px 100px',
            transform: 'rotate(60deg)',
            animation: `spin-slow ${14 / spd}s linear infinite reverse`,
          }}
        />

        {/* Ring 3 — PURPLE — tilted other diagonal */}
        <ellipse cx="100" cy="100" rx="85" ry="28"
          fill="none" stroke="url(#cg3)" strokeWidth="14"
          opacity="0.8"
          style={{
            transformOrigin: '100px 100px',
            transform: 'rotate(120deg)',
            animation: `spin-slow ${18 / spd}s linear infinite`,
          }}
        />

        {/* Dark core */}
        <circle cx="100" cy="100" r="42" fill="url(#core)"/>
        <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>

        {/* 4-pointed star */}
        <g filter="url(#sg)" style={{
          transformOrigin: '100px 100px',
          animation: thinking ? 'breathe 0.7s ease-in-out infinite' : 'breathe 3s ease-in-out infinite'
        }}>
          <path d="M100 68 L109 91 L132 100 L109 109 L100 132 L91 109 L68 100 L91 91 Z"
            fill="white" opacity="0.95"/>
          <path d="M100 78 L107 95 L124 100 L107 105 L100 122 L93 105 L76 100 L93 95 Z"
            fill="white" opacity="0.3"/>
        </g>
      </svg>
    </div>
  );
}