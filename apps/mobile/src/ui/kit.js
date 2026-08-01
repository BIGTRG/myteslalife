// myteslalife UI kit — pure RN, zero external UI deps, all values from tokens.
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color, radius } from '../theme.js';

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.deep },
  pad: { paddingHorizontal: 18 },
  h1: { color: color.text, fontSize: 24, fontWeight: '700' },
  sub: { color: color.muted, fontSize: 13, marginTop: 3 },
  cardOuter: { backgroundColor: color.deep2, borderRadius: radius.card, borderWidth: 1, borderColor: color.line, padding: 14, marginTop: 14 },
  card: { backgroundColor: color.card, borderRadius: radius.card, borderWidth: 1, borderColor: color.line, padding: 14, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { color: color.muted, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase' },
  text: { color: color.text, fontSize: 14 },
  muted: { color: color.muted, fontSize: 12 },
});

export const Header = ({ title, sub, badge }) => (
  <View style={[s.pad, s.row, { paddingTop: 14, justifyContent: 'space-between' }]}>
    <View>
      <Text style={s.h1}>{title}</Text>
      {sub ? <Text style={s.sub}>{sub}</Text> : null}
    </View>
    {badge ? (
      <View style={{ width: 34, height: 34, borderRadius: radius.pill, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: color.text, fontWeight: '700', fontSize: 13 }}>{badge}</Text>
      </View>
    ) : null}
  </View>
);

export const Pill = ({ children, tone = 'line' }) => (
  <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill,
    backgroundColor: tone === 'brand' ? color.brand : tone === 'good' ? 'transparent' : color.card,
    borderWidth: 1, borderColor: tone === 'good' ? color.good : tone === 'warn' ? color.warn : color.line }}>
    <Text style={{ fontSize: 10, fontWeight: '600',
      color: tone === 'good' ? color.good : tone === 'warn' ? color.warn : tone === 'brand' ? color.text : color.muted }}>{children}</Text>
  </View>
);

export const BrandButton = ({ children, onPress, big }) => (
  <Pressable onPress={onPress} style={{ backgroundColor: color.brand, borderRadius: radius.button,
    paddingVertical: big ? 13 : 10, alignItems: 'center', marginTop: 12 }}>
    <Text style={{ color: color.text, fontWeight: '700', fontSize: big ? 15 : 13 }}>{children}</Text>
  </Pressable>
);

export const Stat = ({ value, label }) => (
  <View style={{ flex: 1, backgroundColor: color.card, borderWidth: 1, borderColor: color.line,
    borderRadius: radius.button, paddingVertical: 12, alignItems: 'center', marginHorizontal: 3 }}>
    <Text style={{ color: color.text, fontSize: 17, fontWeight: '700' }}>{value}</Text>
    <Text style={{ color: color.muted, fontSize: 10, marginTop: 2 }}>{label}</Text>
  </View>
);

export const Tile = ({ icon, label }) => (
  <View style={{ flex: 1, backgroundColor: color.card, borderWidth: 1, borderColor: color.line,
    borderRadius: radius.button, paddingVertical: 13, alignItems: 'center', marginHorizontal: 3 }}>
    <Text style={{ fontSize: 16 }}>{icon}</Text>
    <Text style={{ color: color.muted, fontSize: 10, marginTop: 4 }}>{label}</Text>
  </View>
);

export const ComingSoon = ({ note }) => (
  <View style={[s.cardOuter, { alignItems: 'center', paddingVertical: 26 }]}>
    <Pill tone="brand">Coming soon</Pill>
    <Text style={[s.muted, { marginTop: 10, textAlign: 'center', lineHeight: 18 }]}>{note}</Text>
  </View>
);
