/**
 * Generative "exploration" motif: a terrain disc with topographic contours,
 * an orbiting marker and a slow scan sweep. Pure SVG/CSS — no assets needed.
 */
export default function OrbitGraphic({ className = '' }) {
  // Topographic contour lines across the disc
  const contours = Array.from({ length: 9 }, (_, i) => {
    const y = 120 + i * 22
    const amp = 10 + (i % 3) * 5
    const d = `M -20 ${y} C 60 ${y - amp}, 120 ${y + amp}, 200 ${y - amp * 0.6} S 340 ${y + amp}, 420 ${y - amp * 0.4}`
    return { d, key: i, op: 0.5 - i * 0.035 }
  })

  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <div className="relative aspect-square w-full">
        {/* Rotating dashed orbit ring */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full animate-orbit">
          <circle
            cx="200"
            cy="200"
            r="192"
            fill="none"
            stroke="var(--color-flag)"
            strokeOpacity="0.28"
            strokeWidth="1"
            strokeDasharray="2 10"
          />
          <circle cx="200" cy="8" r="5" fill="var(--color-vermilion)" />
          <circle cx="392" cy="200" r="3" fill="var(--color-flag)" fillOpacity="0.7" />
        </svg>

        {/* Counter-rotating inner ring */}
        <svg
          viewBox="0 0 400 400"
          className="absolute inset-0 h-full w-full animate-orbit"
          style={{ animationDirection: 'reverse', animationDuration: '52s' }}
        >
          <circle
            cx="200"
            cy="200"
            r="170"
            fill="none"
            stroke="var(--color-flag)"
            strokeOpacity="0.16"
            strokeWidth="1"
          />
          <circle cx="30" cy="200" r="3.5" fill="var(--color-flag)" fillOpacity="0.55" />
        </svg>

        {/* Terrain disc */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
          <defs>
            <clipPath id="dob-disc">
              <circle cx="200" cy="200" r="148" />
            </clipPath>
            <radialGradient id="dob-terrain" cx="35%" cy="28%" r="85%">
              <stop offset="0%" stopColor="#0A4B34" />
              <stop offset="60%" stopColor="#04241A" />
              <stop offset="100%" stopColor="#06170F" />
            </radialGradient>
            <linearGradient id="dob-sweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-glow)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--color-glow)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-glow)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <circle cx="200" cy="200" r="148" fill="url(#dob-terrain)" />

          <g clipPath="url(#dob-disc)">
            {contours.map((c) => (
              <path
                key={c.key}
                d={c.d}
                fill="none"
                stroke="var(--color-mint)"
                strokeOpacity={c.op}
                strokeWidth="1"
              />
            ))}

            {/* Meridians */}
            {[-60, -30, 0, 30, 60].map((off) => (
              <ellipse
                key={off}
                cx="200"
                cy="200"
                rx={Math.abs(off) === 60 ? 40 : Math.abs(off) === 30 ? 90 : 128}
                ry="148"
                fill="none"
                stroke="var(--color-mint)"
                strokeOpacity="0.12"
                strokeWidth="1"
              />
            ))}

            {/* Landing markers */}
            <g>
              <circle cx="152" cy="164" r="3" fill="var(--color-vermilion)" />
              <circle cx="152" cy="164" r="11" fill="none" stroke="var(--color-vermilion)" strokeOpacity="0.45" strokeWidth="1" />
              <circle cx="258" cy="246" r="2.5" fill="var(--color-glow)" fillOpacity="0.8" />
              <circle cx="258" cy="246" r="9" fill="none" stroke="var(--color-glow)" strokeOpacity="0.3" strokeWidth="1" />
            </g>

            {/* Crosshair */}
            <path
              d="M200 52v296M52 200h296"
              stroke="var(--color-mint)"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          </g>

          <circle
            cx="200"
            cy="200"
            r="148"
            fill="none"
            stroke="var(--color-flag)"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
        </svg>

        {/* Scan sweep */}
        <div className="absolute inset-0 overflow-hidden rounded-full [clip-path:circle(37%_at_50%_50%)]">
          <div className="animate-sweep absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-glow/25 to-transparent" />
        </div>
      </div>
    </div>
  )
}
