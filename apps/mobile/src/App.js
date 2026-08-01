import { useState, useEffect } from 'react';
import { View, Text, Pressable, SafeAreaView, StatusBar } from 'react-native';
import { color } from './theme.js';
import { getSession } from './api.js';
import Wheel from './ui/wheel.js';
import Garage from './screens/Garage.js';
import Controls from './screens/Controls.js';
import Feed from './screens/Feed.js';
import CarSoul from './screens/CarSoul.js';
import Charging from './screens/Charging.js';
import Marketplace from './screens/Marketplace.js';
import Earnings from './screens/Earnings.js';
import CarProfile from './screens/CarProfile.js';
import SignIn from './screens/SignIn.js';

// Tab bar: home / chat / WHEEL(center=garage home) / feed / shop — wheel is one tap home from anywhere.
const TABS = [
  { key: 'controls', icon: '🎛', screen: Controls },
  { key: 'carsoul', icon: '💬', screen: CarSoul },
  { key: 'garage', wheel: true, screen: Garage },
  { key: 'feed', icon: '🗺', screen: Feed },
  { key: 'shop', icon: '🛒', screen: Marketplace },
];

export default function App() {
  const [tab, setTab] = useState('garage');
  const [route, setRoute] = useState(null); // {name:'profile'|'earnings'|'charging', ...params}
  const [authed, setAuthed] = useState(!!getSession());
  useEffect(() => { setAuthed(!!getSession()); }, []);

  if (!authed) return <SignIn onAuthed={() => setAuthed(true)} />;

  const nav = { go: (name, params) => setRoute({ name, ...params }), back: () => setRoute(null) };
  let Body;
  if (route?.name === 'profile') Body = () => <CarProfile nav={nav} handle={route.handle} />;
  else if (route?.name === 'earnings') Body = () => <Earnings nav={nav} />;
  else if (route?.name === 'charging') Body = () => <Charging nav={nav} />;
  else Body = TABS.find(t => t.key === tab).screen;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.deep }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1 }}><Body nav={nav} /></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
        borderTopWidth: 1, borderTopColor: color.line, backgroundColor: color.deep2, paddingVertical: 8, paddingBottom: 14 }}>
        {TABS.map(t => (
          <Pressable key={t.key} onPress={() => { setRoute(null); setTab(t.key); }} style={{ alignItems: 'center', width: 56 }}>
            {t.wheel
              ? <View style={{ marginTop: -22 }}><Wheel size={48} active={tab === t.key && !route} /></View>
              : <Text style={{ fontSize: 20, opacity: tab === t.key && !route ? 1 : 0.45 }}>{t.icon}</Text>}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
