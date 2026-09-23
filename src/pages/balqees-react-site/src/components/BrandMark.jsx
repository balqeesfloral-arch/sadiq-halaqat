export default function BrandMark({ compact = false }) {
  return (
    <div className={`brand-mark ${compact ? 'compact' : ''}`} aria-label="Balqees Floral">
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
        <path d="M32 7c7 8 12 15 12 23 0 8-5 14-12 14S20 38 20 30c0-8 5-15 12-23Z" fill="none" stroke="currentColor" strokeWidth="2.6"/>
        <path d="M32 17c-5 8-7 16-5 24M32 17c5 8 7 16 5 24M20 30c5-2 8-2 12 0 4-2 7-2 12 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M15 48c8-2 13 0 17 5 4-5 9-7 17-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
      {!compact && <span><b>بلقيس</b><small>BALQEES FLORAL</small></span>}
    </div>
  );
}
