// Screen 1 — My Garage (Home): live car status, one-tap controls, Road Trip Mode, streaks.
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { color, radius } from '../theme.js';
import { api } from '../api.js';
import { s, Header, Pill, Stat, Tile, BrandButton } from '../ui/kit.js';

export default function Garage({ nav }) {
  const [me, setMe] = useState(null);
  const [car, setCar] = useState(null);
  useEffect(() => {
    api('GET', '/v1/me').then(r => { setMe(r.data?.member); setCar(r.data?.cars?.[0] ?? null); });
  }, []);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView style={s.screen}>
      <Header title={`${greet}${me?.first_name ? ', ' + me.first_name : ''}`}
        sub={car ? `${car.nickname} is ready` : 'Set up your garage'} badge={(me?.first_name ?? me?.email ?? 'M')[0].toUpperCase()} />
      <View style={s.pad}>
        <View style={s.cardOuter}>
          {car ? (
            <>
              <View style={[s.row, { justifyContent: 'space-between' }]}>
                <Text style={{ color: color.text, fontSize: 17, fontWeight: '700' }}>“{car.nickname}”</Text>
                <Pill tone="good">● Online</Pill>
              </View>
              <Text style={[s.muted, { marginTop: 3 }]}>{car.model_year} {car.model}{car.miles ? ` · ${Number(car.miles).toLocaleString()} mi` : ''}</Text>
              <View style={{ height: 6, backgroundColor: color.card, borderRadius: radius.pill, marginTop: 12 }}>
                <View style={{ width: '84%', height: 6, borderRadius: radius.pill, backgroundColor: color.spark }} />
              </View>
              <View style={[s.row, { justifyContent: 'space-between', marginTop: 6 }]}>
                <Text style={s.muted}>Battery + live status</Text>
                <Pill>Connect car · coming soon</Pill>
              </View>
              <View style={[s.row, { marginTop: 12 }]}>
                <Tile icon="🔒" label="Lock" /><Tile icon="❄️" label="Climate" /><Tile icon="📍" label="Locate" /><Tile icon="⚡" label="Charge" />
              </View>
              <BrandButton big onPress={() => {}}>🚗 Road Trip Mode</BrandButton>
              <Pressable onPress={() => nav.go('profile', { handle: car.handle })}>
                <Text style={{ color: color.spark, fontSize: 13, textAlign: 'center', marginTop: 12 }}>View @{car.handle} — the car profile</Text>
              </Pressable>
            </>
          ) : <Text style={s.text}>Loading your garage…</Text>}
        </View>
        <View style={s.cardOuter}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Text style={s.label}>This week</Text><Pill tone="brand">Level 1</Pill>
          </View>
          <View style={[s.row, { marginTop: 10 }]}>
            <Stat value="—" label="miles" /><Stat value="—" label="Wh/mi" /><Stat value="—" label="city rank" />
          </View>
          <Text style={[s.muted, { marginTop: 10 }]}>Streaks and city rank light up when your car is connected.</Text>
        </View>
        <Pressable onPress={() => nav.go('earnings')}>
          <View style={[s.cardOuter, s.row, { justifyContent: 'space-between', marginBottom: 24 }]}>
            <Text style={s.text}>💵 Earnings — robotaxi + energy</Text>
            <Pill>Coming soon</Pill>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}
