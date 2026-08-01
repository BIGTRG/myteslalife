// Screen 6 — Marketplace: shoppable mod lists, affiliate disclosure ALWAYS visible (FTC).
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { color, radius } from '../theme.js';
import { api, API_BASE, getSession } from '../api.js';
import { s, Header, Pill } from '../ui/kit.js';

export default function Marketplace() {
  const [products, setProducts] = useState(null);
  useEffect(() => { api('GET', '/v1/products').then(r => setProducts(r.data?.products ?? [])); }, []);

  return (
    <ScrollView style={s.screen}>
      <Header title="Marketplace" sub="Shop real owners' mod lists" badge="🛍" />
      <View style={[s.pad, { paddingBottom: 24 }]}>
        <Text style={[s.muted, { marginTop: 12 }]}>myteslalife earns a commission on some links.</Text>
        {products?.length === 0 && (
          <View style={s.cardOuter}><Text style={s.text}>The Essentials line and owner mod lists drop here first. Stocking now.</Text></View>
        )}
        {products?.map(p => (
          <View key={p.id} style={[s.cardOuter, s.row, { justifyContent: 'space-between' }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[s.text, { fontWeight: '700' }]}>{p.name}</Text>
              {(p.rating || p.fitment_note) ? <Text style={[s.muted, { marginTop: 3 }]}>{p.rating ? `★ ${p.rating}` : ''}{p.rating && p.fitment_note ? ' · ' : ''}{p.fitment_note ?? ''}</Text> : null}
            </View>
            <Pressable onPress={() => Linking.openURL(`${API_BASE}/v1/products/${p.id}/go?s=${getSession()}`)}
              style={{ backgroundColor: color.brand, borderRadius: radius.button, paddingHorizontal: 14, paddingVertical: 9 }}>
              <Text style={{ color: color.text, fontWeight: '700', fontSize: 13 }}>{p.price_cents ? `$${(p.price_cents / 100).toFixed(0)}` : 'Shop'}</Text>
            </Pressable>
          </View>
        ))}
        <View style={[s.cardOuter, { backgroundColor: color.card }]}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Text style={s.text}>🤝 Group buys</Text><Pill tone="brand">Coming soon</Pill>
          </View>
          <Text style={[s.muted, { marginTop: 5 }]}>Hit the member count, unlock the discount.</Text>
        </View>
      </View>
    </ScrollView>
  );
}
