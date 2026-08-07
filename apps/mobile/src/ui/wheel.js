// The Autopilot Wheel mark — Deon's chosen logo (docs/../assets/brand/myteslalife_logo_wheel.svg).
// Exact geometry from the source SVG: emanation waves, gradient rim, spokes forming the T.
// On the dark app background the T-spokes render light (source uses dark navy on white).
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { color } from '../theme.js';

// Source mark bounds (from the SVG, group at translate(85,92)):
// waves reach y=-34-? top ~ -72; rim circle cx=0 cy=8 r=44 (+stroke); spokes to y=48.
// Use a 160x160 viewBox centered on the mark.
export default function Wheel({ size = 44, active = true, onLight = false }) {
  const spoke = onLight ? '#16163A' : (active ? color.text : color.muted);
  const dim = active ? 1 : 0.45;
  return (
    <Svg width={size} height={size} viewBox="-80 -72 160 152" opacity={dim}>
      <Defs>
        <LinearGradient id="halo" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={color.brand} />
          <Stop offset="100%" stopColor={color.spark} />
        </LinearGradient>
      </Defs>
      {/* emanation waves */}
      <Path d="M -63 -34 A 72 72 0 0 1 63 -34" fill="none" stroke="url(#halo)" strokeWidth="5" strokeLinecap="round" opacity="0.28" />
      <Path d="M -52 -26 A 59 59 0 0 1 52 -26" fill="none" stroke="url(#halo)" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      {/* wheel rim */}
      <Circle cx="0" cy="8" r="44" fill="none" stroke="url(#halo)" strokeWidth="7.5" />
      {/* spokes forming the T */}
      <Line x1="-40" y1="4" x2="40" y2="4" stroke={spoke} strokeWidth="7.5" strokeLinecap="round" />
      <Line x1="0" y1="4" x2="0" y2="48" stroke={spoke} strokeWidth="7.5" strokeLinecap="round" />
    </Svg>
  );
}
