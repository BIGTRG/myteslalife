import { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { color, radius, DISCLAIMER } from '../theme.js';
import { api, setSession } from '../api.js';
import Wheel from '../ui/wheel.js';
import { s, BrandButton } from '../ui/kit.js';

export default function SignIn({ onAuthed }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [stage, setStage] = useState('email'); // email -> link
  const [err, setErr] = useState(null);

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
      <View style={{ alignItems: 'center', marginBottom: 22 }}>
        <Wheel size={64} />
        <Text style={[s.h1, { marginTop: 14 }]}>myteslalife</Text>
        <Text style={s.sub}>Every car has a life. This is where it lives.</Text>
      </View>
      <View style={s.cardOuter}>
        {stage === 'email' ? (
          <>
            <Text style={s.label}>Sign in or join</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="you@email.com"
              placeholderTextColor={color.muted} autoCapitalize="none" keyboardType="email-address"
              style={{ backgroundColor: color.card, color: color.text, borderWidth: 1, borderColor: color.line,
                borderRadius: radius.button, padding: 12, marginTop: 10, fontSize: 15 }} />
            <BrandButton big onPress={async () => {
              if (!email.includes('@')) return;
              await api('POST', '/v1/auth/magic-link', { email });
              setStage('link');
            }}>Email me a magic link</BrandButton>
          </>
        ) : (
          <>
            <Text style={s.label}>Check your email</Text>
            <Text style={[s.text, { marginTop: 8, lineHeight: 20 }]}>We sent a sign-in link to {email}. Open it on this device, or paste the code from the link:</Text>
            <TextInput value={token} onChangeText={setToken} placeholder="paste code"
              placeholderTextColor={color.muted} autoCapitalize="none"
              style={{ backgroundColor: color.card, color: color.text, borderWidth: 1, borderColor: color.line,
                borderRadius: radius.button, padding: 12, marginTop: 10, fontSize: 15 }} />
            <BrandButton big onPress={async () => {
              const r = await api('POST', '/v1/auth/redeem', { token: token.trim() });
              if (r.status === 200) { setSession(r.data.session); onAuthed(); }
              else setErr('That code is expired or already used.');
            }}>Sign in</BrandButton>
            {err ? <Text style={{ color: color.warn, fontSize: 12, marginTop: 8 }}>{err}</Text> : null}
          </>
        )}
      </View>
      <Text style={{ color: color.muted, fontSize: 10, textAlign: 'center', marginTop: 22, lineHeight: 15 }}>{DISCLAIMER}</Text>
    </ScrollView>
  );
}
