// Screen 7 — Earnings Manager. HARD compliance rule: NO income claims, NO projections (robotaxi not open).
import { View, Text, ScrollView, Pressable } from 'react-native';
import { color } from '../theme.js';
import { s, Header, ComingSoon } from '../ui/kit.js';

export default function Earnings({ nav }) {
  return (
    <ScrollView style={s.screen}>
      <Header title="Earnings" sub="Robotaxi + energy — when it opens" badge="$" />
      <View style={[s.pad, { paddingBottom: 24 }]}>
        <ComingSoon note="Tesla hasn't opened the robotaxi fleet to owners yet. The day they do, your car goes on payroll here: AI dispatch, honest profit-per-mile, tax-ready exports. No projections, no promises — we don't guess your money." />
        {nav ? <Pressable onPress={nav.back}><Text style={{ color: color.spark, textAlign: 'center', marginTop: 6 }}>Back</Text></Pressable> : null}
      </View>
    </ScrollView>
  );
}
