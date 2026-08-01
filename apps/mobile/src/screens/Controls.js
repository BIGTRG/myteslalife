// Screen 2 — Full Remote Control. Phase 1: full layout, live vehicle link is P2 (Fleet API pending).
import { View, Text, ScrollView } from 'react-native';
import { color } from '../theme.js';
import { s, Header, Pill, Tile } from '../ui/kit.js';

const GRID = [
  ['🔓 Unlock', '📯 Honk', '🔦 Flash'],
  ['🧳 Frunk', '📦 Trunk', '💨 Vent'],
  ['🛡 Sentry', '🚘 Remote Start', '🅿️ Valet'],
];

export default function Controls() {
  return (
    <ScrollView style={s.screen}>
      <Header title="Controls" sub="Live vehicle link — coming with car connect" badge="R" />
      <View style={s.pad}>
        {GRID.map((row, i) => (
          <View key={i} style={[s.row, { marginTop: i === 0 ? 14 : 8 }]}>
            {row.map(cell => {
              const [icon, ...rest] = cell.split(' ');
              return <Tile key={cell} icon={icon} label={rest.join(' ')} />;
            })}
          </View>
        ))}
        <View style={s.cardOuter}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Text style={s.text}>❄️ Climate</Text><Pill>Auto 70°F</Pill>
          </View>
          <Text style={[s.muted, { marginTop: 6 }]}>Defrost · seat heat · wheel heat — one tap when connected</Text>
        </View>
        <View style={s.cardOuter}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Text style={s.text}>⚡ Charging</Text><Pill tone="brand">Schedule</Pill>
          </View>
          <Text style={[s.muted, { marginTop: 6 }]}>Charge limit + off-peak scheduling</Text>
        </View>
        <View style={[s.cardOuter, { marginBottom: 24 }]}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Text style={s.text}>😇 Teen Mode</Text><Pill tone="warn">Speed cap</Pill>
          </View>
          <Text style={[s.muted, { marginTop: 6 }]}>Geofence alerts: school → home. The feature the official app doesn't have.</Text>
        </View>
      </View>
    </ScrollView>
  );
}
