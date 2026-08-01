// Screen 5 — Charging Hub: every network on one map, owner truth on every pin. Charge Pass parked (licensing).
import { View, Text, ScrollView, Pressable } from 'react-native';
import { color, radius } from '../theme.js';
import { s, Header, Pill } from '../ui/kit.js';

const PINS = [
  { c: 'pinSupercharger', x: '18%', y: '30%' }, { c: 'pinChargePoint', x: '58%', y: '18%' },
  { c: 'pinEVgo', x: '74%', y: '48%' }, { c: 'pinElectrifyAmerica', x: '38%', y: '62%' },
  { c: 'pinDestination', x: '62%', y: '74%' },
];

export default function Charging({ nav }) {
  return (
    <ScrollView style={s.screen}>
      <Header title="Charging Hub" sub="All networks · owner truth on every pin" badge="⚡" />
      <View style={[s.pad, { paddingBottom: 24 }]}>
        <View style={[s.cardOuter, { height: 190, overflow: 'hidden' }]}>
          {PINS.map((p, i) => (
            <View key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: 14, height: 14,
              borderRadius: radius.pill, backgroundColor: color[p.c], borderWidth: 2, borderColor: color.deep2 }} />
          ))}
          <Text style={[s.muted, { position: 'absolute', bottom: 10, left: 12 }]}>Live map — coming with location permissions</Text>
        </View>
        <View style={s.cardOuter}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Text style={s.text}>Supercharger · nearby</Text><Pill tone="good">open</Pill>
          </View>
          <Text style={[s.muted, { marginTop: 5 }]}>Member visit ratings + real $/kWh land here — reported by owners, not networks.</Text>
        </View>
        <View style={s.cardOuter}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Text style={s.text}>Stall-down reports</Text><Pill tone="warn">community</Pill>
          </View>
          <Text style={[s.muted, { marginTop: 5 }]}>“2 stalls down, reported 3h ago by @redoctober” — the truth layer every network map is missing.</Text>
        </View>
        <View style={[s.cardOuter, { backgroundColor: color.card }]}>
          <Text style={s.text}>⚡ Charge Pass — one wallet, every network</Text>
          <Text style={[s.muted, { marginTop: 5 }]}>In licensing review. Ships the moment it's legal to ship right.</Text>
        </View>
        {nav ? <Pressable onPress={nav.back}><Text style={{ color: color.spark, textAlign: 'center', marginTop: 14 }}>Back</Text></Pressable> : null}
      </View>
    </ScrollView>
  );
}
