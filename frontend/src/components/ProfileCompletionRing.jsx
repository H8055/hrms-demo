// Circular profile-completion indicator. Fills proportionally; turns green at
// 100%, blue when healthy, amber when low — mirrors the backend completion %.
export default function ProfileCompletionRing({ percent = 0, size = 132, stroke = 11, label = 'Complete' }) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safePercent / 100) * circumference;
  const center = size / 2;
  const color = safePercent >= 100 ? '#16a34a' : safePercent >= 60 ? '#3b82f6' : '#f59e0b';

  return (
    <svg width={size} height={size} className="completion-ring" role="img" aria-label={`${safePercent}% complete`} overflow="visible" style={{ display: 'block' }}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      {safePercent > 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      )}
      <text x="50%" y="46%" dominantBaseline="central" textAnchor="middle" className="completion-ring-value" fill={color}>
        {safePercent}%
      </text>
      <text x="50%" y="62%" dominantBaseline="central" textAnchor="middle" className="completion-ring-label">
        {label}
      </text>
    </svg>
  );
}
