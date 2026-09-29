import { useEffect, useRef } from 'react';
import { registerOrnamentScene } from './motion';

const NAMES = new Set(['01-noor','02-shams','03-falak','04-madar','05-wasl','06-naseej','07-rukn','08-daraj','09-nasaq','10-ittizan','11-itaar','12-mihrab']);
const PALETTES = new Set(['gold', 'emerald', 'ivory', 'mono']);
const ornamentUrl = (name = '01-noor', palette = 'gold') =>
  `${import.meta.env.BASE_URL}ornaments/sadiq/${PALETTES.has(palette) ? palette : 'gold'}/${NAMES.has(name) ? name : '01-noor'}.svg`;

export default function Ornament({ name = '01-noor', palette = 'gold', className = '', motion = false, reverse = false, duration = 150, style }) {
  const rotating = motion && /^(01|02|03|04)-/.test(name);
  return (
    <span className={`sq-ornament ${className}`} aria-hidden="true" style={style}>
      <span className={`sq-ornament-art${rotating ? ' sq-turn' : ''}`} style={rotating ? { '--sq-period': `${Math.max(40, Number(duration) || 150)}s`, animationDirection: reverse ? 'reverse' : 'normal' } : undefined}>
        <img src={ornamentUrl(name, palette)} alt="" decoding="async" draggable="false" />
      </span>
    </span>
  );
}

/** Decorative layers remain inside their host and never intercept clicks. */
export function OrnamentScene({ variant = 'hero', palette = 'gold', primary = '03-falak', secondary = '04-madar', pattern = false, interactive = true, className = '' }) {
  const ref = useRef(null);
  useEffect(() => registerOrnamentScene(ref.current), []);
  return (
    <div ref={ref} className={`sq-scene sq-scene--${variant} ${className}`} aria-hidden="true" data-sq-interactive={interactive}>
      {pattern && <span className="sq-texture" style={{ backgroundImage: `url("${ornamentUrl(pattern === true ? '05-wasl' : pattern, palette)}")` }} />}
      <div className="sq-scene-primary sq-drift">
        <Ornament name={primary} palette={palette} motion duration={variant === 'tv' ? 105 : 160} />
      </div>
      <div className="sq-scene-secondary sq-drift">
        <Ornament name={secondary} palette={palette} motion reverse duration={variant === 'tv' ? 145 : 210} />
      </div>
      {variant === 'tv' && <div className="sq-scene-ring"><Ornament name="04-madar" palette="gold" motion reverse duration={190} /></div>}
    </div>
  );
}
