// myteslalife design tokens — SINGLE SOURCE OF TRUTH.
// Zero hardcoded colors anywhere else (Definition of Done, Master Build Prompt).
export const color = {
  deep: '#14142E',      // app background
  deep2: '#1C1C40',     // outer cards
  card: '#232350',      // cards
  line: '#2E2E5C',      // hairlines / borders
  text: '#EEF0FB',      // primary text
  muted: '#8F94BE',     // secondary text
  brand: '#6C4DFF',     // ultraviolet
  spark: '#4DE1FF',     // spark cyan — gradient partner ONLY
  good: '#3DDC97',
  warn: '#FFB324',
  // charging network pins
  pinSupercharger: '#E82127',
  pinChargePoint: '#2F5EFF',
  pinEVgo: '#00A388',
  pinElectrifyAmerica: '#F59E0B',
  pinDestination: '#6C4DFF',
};
export const gradient = {
  brand: { from: color.brand, to: color.spark, angleDeg: 135 }, // always brand→spark at 90–135°
};
export const radius = { card: 16, button: 12, pill: 999 };
export const font = {
  family: 'Space Grotesk',
  weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
};
export const DISCLAIMER =
  'myteslalife is an independent owner community and is not affiliated with, endorsed by, or sponsored by Tesla, Inc. TESLA is a trademark of Tesla, Inc.';
