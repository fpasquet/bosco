// Appairage par le QR code du poste (E18a, CA-APPS-05) : l'adresse, le code et l'empreinte du certificat ; la vue web
// ne fera confiance qu'à ce certificat, sans avertissement.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { type Pairing, parsePairing, shortFingerprint, spacedCode } from '../lib/pairing';
import { colors } from '../lib/theme';

export function PairScreen({ onPair }: Readonly<{ onPair: (pairing: Pairing & { fingerprint: string }) => void }>) {
  const [permission, requestPermission] = useCameraPermissions();
  const [found, setFound] = useState<null | Pairing>(null);
  const [code, setCode] = useState('');
  const [manual, setManual] = useState(false);
  const [link, setLink] = useState('');
  const [error, setError] = useState<null | string>(null);

  const read = (value: string) => {
    const pairing = parsePairing(value);
    if (!pairing) return setError('Ce QR code ne vient pas de Bosco.');
    if (!pairing.fingerprint) return setError('Ce QR code ne porte pas l’empreinte du certificat : mets Bosco à jour.');
    setError(null);
    setFound(pairing);
    setCode(pairing.code ?? '');
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.brand}>Bosco</Text>
      <Text style={styles.title}>Appairer Bosco</Text>
      <Text style={styles.muted}>Sur le poste, ouvre Sources › Accès depuis le téléphone et scanne le QR code.</Text>
      {!found && !manual && (
        <View style={styles.viewfinder}>
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => read(data)}
            />
          ) : (
            <Pressable style={styles.button} onPress={() => void requestPermission()}>
              <Text style={styles.buttonText}>Autoriser la caméra</Text>
            </Pressable>
          )}
        </View>
      )}
      {manual && !found && (
        <View style={styles.card}>
          <Text style={styles.label}>Lien d’appairage affiché sur le poste</Text>
          <TextInput
            style={styles.input}
            value={link}
            onChangeText={setLink}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="https://192.168.1.24:4310/pair?code=…"
          />
          <Pressable style={styles.button} onPress={() => read(link)}>
            <Text style={styles.buttonText}>Continuer</Text>
          </Pressable>
        </View>
      )}
      {found && (
        <>
          <View style={[styles.card, styles.found]}>
            <Text style={styles.foundTitle}>✓ Poste trouvé</Text>
            <Text style={styles.mono}>{found.url}</Text>
            <Text style={styles.small}>Certificat vérifié · empreinte {shortFingerprint(found.fingerprint ?? '')}</Text>
          </View>
          <Text style={styles.label}>Code affiché sur le poste</Text>
          <TextInput
            style={[styles.input, styles.code]}
            value={spacedCode(code)}
            onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
          />
          <Pressable
            style={[styles.button, code.length !== 6 && styles.disabled]}
            disabled={code.length !== 6}
            onPress={() => onPair({ ...found, code, fingerprint: found.fingerprint ?? '' })}
          >
            <Text style={styles.buttonText}>Appairer</Text>
          </Pressable>
        </>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      {!found && (
        <Pressable onPress={() => setManual(!manual)}>
          <Text style={styles.link}>{manual ? 'Scanner le QR code' : 'Saisir l’adresse à la main'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, padding: 24, paddingTop: 56, gap: 14 },
  brand: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  title: { color: colors.ink, fontSize: 24, fontWeight: '600' },
  muted: { color: colors.muted, fontSize: 14 },
  viewfinder: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1c1c1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  found: { backgroundColor: colors.successSoft, borderColor: colors.success },
  foundTitle: { color: colors.success, fontWeight: '600' },
  mono: { fontFamily: 'monospace', color: colors.ink },
  small: { color: colors.muted, fontSize: 12 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '500' },
  input: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 10, padding: 12 },
  code: { fontFamily: 'monospace', fontSize: 20, letterSpacing: 4 },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center' },
  disabled: { opacity: 0.5 },
  buttonText: { color: colors.onPrimary, fontWeight: '600' },
  error: { color: colors.danger },
  link: { color: colors.primary, textAlign: 'center', textDecorationLine: 'underline' },
});
