// Screen 3 — The Feed: follow cars, not just people.
import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { color } from '../theme.js';
import { api } from '../api.js';
import { s, Header, Pill } from '../ui/kit.js';

export default function Feed({ nav }) {
  const [posts, setPosts] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    const r = await api('GET', '/v1/feed');
    setPosts(r.data?.posts ?? []);
    setRefreshing(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView style={s.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={color.spark} />}>
      <Header title="Feed" sub={posts ? `${posts.length} recent stories` : 'Loading…'} badge="F" />
      <View style={[s.pad, { paddingBottom: 24 }]}>
        {posts?.length === 0 && (
          <View style={s.cardOuter}>
            <Text style={s.text}>Nothing here yet — follow a few cars and their milestones, trip logs, and club events land here.</Text>
          </View>
        )}
        {posts?.map(p => (
          <Pressable key={p.id} onPress={() => nav.go('profile', { handle: p.handle })}>
            <View style={s.cardOuter}>
              <View style={[s.row, { justifyContent: 'space-between' }]}>
                <Text style={{ color: color.spark, fontSize: 13, fontWeight: '600' }}>⚡ @{p.handle}</Text>
                <Text style={s.muted}>{new Date(p.created_at).toLocaleDateString()}</Text>
              </View>
              {p.title ? <Text style={[s.text, { fontWeight: '700', marginTop: 6 }]}>{p.title}</Text> : null}
              {p.body ? <Text style={[s.text, { marginTop: 4, lineHeight: 20 }]}>{p.body}</Text> : null}
              <View style={[s.row, { marginTop: 10, gap: 8 }]}>
                <Pill>{p.kind}</Pill>
                <Text style={s.muted}>♥ {p.likes}   💬 {p.replies}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
