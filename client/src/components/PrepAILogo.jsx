export default function PrepAILogo({ size = 32, showText = false }) {
  return (
    <div className="flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#17D7FF"/>
            <stop offset="50%" stopColor="#4F7BFF"/>
            <stop offset="100%" stopColor="#785DFF"/>
          </linearGradient>
          <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F7BFF"/>
            <stop offset="100%" stopColor="#785DFF"/>
          </linearGradient>
        </defs>

        {/* Pixel dissolve dots */}
        <rect x="8" y="12" width="4" height="4" rx="1" fill="#17D7FF" opacity="0.9"/>
        <rect x="14" y="8" width="4" height="4" rx="1" fill="#17D7FF" opacity="0.7"/>
        <rect x="8" y="20" width="4" height="4" rx="1" fill="#4F7BFF" opacity="0.6"/>
        <rect x="14" y="16" width="4" height="4" rx="1" fill="#4F7BFF" opacity="0.8"/>
        <rect x="20" y="10" width="4" height="4" rx="1" fill="#17D7FF" opacity="0.5"/>
        <rect x="8" y="28" width="4" height="4" rx="1" fill="#785DFF" opacity="0.4"/>
        <rect x="14" y="24" width="4" height="4" rx="1" fill="#785DFF" opacity="0.5"/>
        <rect x="20" y="18" width="4" height="4" rx="1" fill="#4F7BFF" opacity="0.6"/>
        <rect x="26" y="12" width="4" height="4" rx="1" fill="#17D7FF" opacity="0.3"/>

        {/* Bold P letterform */}
        <rect x="28" y="14" width="10" height="60" rx="3" fill="url(#pGrad)"/>
        <rect x="28" y="14" width="36" height="10" rx="3" fill="url(#pGrad)"/>
        <rect x="28" y="38" width="32" height="10" rx="3" fill="url(#pGrad)"/>
        <rect x="54" y="24" width="10" height="14" rx="3" fill="url(#pGrad)"/>

        {/* Lightning bolt */}
        <polygon
          points="52,48 38,72 50,72 46,88 62,62 50,62"
          fill="url(#boltGrad)"
          opacity="0.95"
        />
      </svg>

      {showText && (
        <span style={{
          fontSize: size * 0.55,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          fontFamily: 'sans-serif'
        }}>
          <span style={{ color: '#FFFFFF' }}>Prep</span>
          <span style={{
            background: 'linear-gradient(135deg, #17D7FF, #4F7BFF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>AI</span>
        </span>
      )}
    </div>
  );
}