// Screen 8 — Car Profile: the living page every Tesla gets. Autobiography from real posts.
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { color, radius } from '../theme.js';
import { api } from '../api.js';
import { s, Header, Pill, Stat, BrandButton } from '../ui/kit.js';

export default function CarProfile({ nav, handle }) {
  const [d, setD] = useState(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    api('GET', `/v1/cars/@${handle}`).then(r => r.status === 200 ? setD(r.data) : setMissing(true));
  }, [handle]);

  if (missing) return (
    <ScrollView style={s.screen}><Header title={`@${handle}`} sub="This profile is private or gone" />
      <Pressable onPress={nav.back}><Text style={{ color: color.spark, textAlign: 'center', marginTop: 20 }}>Back</Text></Pressable>
    </ScrollView>
  );
  if (!d) return <ScrollView style={s.screen}><Header title={`@${handle}`} sub="Loading…" /></ScrollView>;

  return (
    <ScrollView style={s.screen}>
      <Header title={`@${d.car.handle}`} sub={`${d.car.model_year} ${d.car.model} · ${d.car.followers} follower${d.car.followers === 1 ? '' : 's'}`} badge="R" />
      <View style={[s.pad, { paddingBottom: 24 }]}>
        <View style={[s.row, { marginTop: 12, gap: 8 }]}>
          <Pill tone="good">Owner verified</Pill>
          <Pill>“{d.car.nickname}”</Pill>
        </View>
        <View style={[s.row, { marginTop: 12 }]}>
          <Stat value={d.car.miles ? Number(d.car.miles).toLocaleString() : '—'} label="miles" />
          <Stat value={d.autobiography.length} label="chapters" />
          <Stat value={d.mod_list.length} label="mods" />
        </View>
        <View style={s.cardOuter}>
          <Text style={s.label}>The Autobiography</Text>
          {d.autobiography.length === 0 && <Text style={[s.text, { marginTop: 8 }]}>The story starts with the first post.</Text>}
          {d.autobiography.map(ch => (
            <View key={ch.id} style={{ flexDirection: 'row', marginTop: 12 }}>
              <View style={{ width: 8, height: 8, borderRadius: radius.pill, backgroundColor: color.brand, marginTop: 5, marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={[s.text, { fontWeight: '700' }]}>{ch.title || ch.kind}</Text>
                {ch.body ? <Text style={[s.muted, { marginTop: 2, lineHeight: 17 }]}>{ch.body}</Text> : null}
                <Text style={[s.muted, { marginTop: 2, fontSize: 10 }]}>{new Date(ch.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
          ))}
        </View>
        {d.mod_list.length > 0 && (
          <View style={s.cardOuter}>
            <Text style={s.label}>Mod list</Text>
            {d.mod_list.map((m2, i) => (
              <Text key={i} style={[s.text, { marginTop: 8 }]}>• {m2.name}{m2.note ? ` — ${m2.note}` : ''}</Text>
            ))}
            <Text style={[s.muted, { marginTop: 10, fontSize: 10 }]}>{d.affiliate_disclosure}</Text>
          </View>
        )}
        <BrandButton big onPress={() => {}}>💬 Interview this car</BrandButton>
        <Text style={{ color: color.muted, fontSize: 10, textAlign: 'center', marginTop: 16, lineHeight: 15 }}>{d.disclaimer}</Text>
        <Pressable onPress={nav.back}><Text style={{ color: color.spark, textAlign: 'center', marginTop: 14 }}>Back</Text></Pressable>
      </View>
    </ScrollView>
  );
}
