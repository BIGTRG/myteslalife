// Screen 4 — CarSoul™ Chat. P2: needs real telemetry. Ships as a styled preview, honest about it.
import { View, Text, ScrollView } from 'react-native';
import { color, radius } from '../theme.js';
import { s, Header, Pill, ComingSoon } from '../ui/kit.js';

const Bubble = ({ from, children }) => (
  <View style={{ alignSelf: from === 'car' ? 'flex-start' : 'flex-end', maxWidth: '85%',
    backgroundColor: from === 'car' ? color.card : color.brand,
    borderRadius: radius.card, padding: 12, marginTop: 10 }}>
    {from === 'car' ? <Text style={{ color: color.spark, fontSize: 9, letterSpacing: 1, marginBottom: 4 }}>YOUR CAR</Text> : null}
    <Text style={{ color: color.text, fontSize: 13, lineHeight: 19 }}>{children}</Text>
  </View>
);

export default function CarSoul() {
  return (
    <ScrollView style={s.screen}>
      <Header title="CarSoul™" sub="Your car talks back — from its real data" badge="C" />
      <View style={[s.pad, { paddingBottom: 24 }]}>
        <View style={s.cardOuter}>
          <Bubble from="car">Boss, I'm at 84% and it's 72° inside. Someone parked VERY close on my left — I got it on camera. Want the clip?</Bubble>
          <Bubble from="me">How's your battery doing compared to other Model Ys?</Bubble>
          <Bubble from="car">Holding 94% of original capacity — better than 78% of 2024 Model Ys at my mileage. Your 80% home-charging habit is why. Gold star.</Bubble>
        </View>
        <ComingSoon note="CarSoul goes live when your car is connected — every line above comes from real telemetry, never invented. The Member Copilot plans trips, books hotels, and invites convoys." />
      </View>
    </ScrollView>
  );
}
