// The Autopilot Wheel mark — center tab. Pure Views (rim + hub + 5 spokes), tokens only.
import { View } from 'react-native';
import { color } from '../theme.js';

export default function Wheel({ size = 44, active = true }) {
  const rim = active ? color.spark : color.muted;
  const spokes = [0, 72, 144, 216, 288];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2,
      backgroundColor: active ? color.brand : color.card,
      borderWidth: 2, borderColor: rim, alignItems: 'center', justifyContent: 'center' }}>
      {spokes.map(deg => (
        <View key={deg} style={{ position: 'absolute', width: 2, height: size / 2 - 5,
          top: 3, left: size / 2 - 1, backgroundColor: rim, opacity: 0.9,
          transform: [{ translateY: (size / 2 - 5) / 2 - (size / 2 - 3) / 2 + (size / 2 - 5) / 2 }, { rotate: `${deg}deg` }],
          transformOrigin: 'bottom center' }} />
      ))}
      <View style={{ width: size / 3.2, height: size / 3.2, borderRadius: size / 6,
        backgroundColor: active ? color.text : color.muted }} />
    </View>
  );
}
