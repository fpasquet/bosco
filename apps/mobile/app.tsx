// Application Android de Bosco (E18, DT-33) : une coquille autour de l'interface téléphone ; seuls l'appairage, la
// confiance dans le certificat du poste, le trousseau et les notifications sont natifs.
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { boscoTrust } from './modules/bosco-trust';
import { notify, setupNotifications } from './src/lib/notifications';
import {
  type AppPreferences,
  loadPreferences,
  loadWorkstation,
  savePreferences,
  saveWorkstation,
  type Workstation,
} from './src/lib/storage';
import { colors } from './src/lib/theme';
import { type BoscoHandle, BoscoScreen } from './src/screens/bosco-screen';
import { PairScreen } from './src/screens/pair-screen';
import { SettingsScreen } from './src/screens/settings-screen';

type Screen = { kind: 'bosco'; path: string } | { kind: 'loading' } | { kind: 'pair' } | { kind: 'settings' };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'loading' });
  const [workstation, setWorkstation] = useState<null | Workstation>(null);
  const [preferences, setPreferences] = useState<AppPreferences>({ background: false, vibrate: true });
  const bosco = useRef<BoscoHandle>(null);

  useEffect(() => {
    void (async () => {
      const [stored, saved] = await Promise.all([loadWorkstation(), loadPreferences()]);
      setPreferences(saved);
      await setupNotifications(saved.vibrate);
      setWorkstation(stored);
      setScreen(stored ? { kind: 'bosco', path: '/' } : { kind: 'pair' });
    })();
  }, []);

  // Une notification touchée ouvre sa session dans la vue web (CA-APPS-06) : par l'écouteur, et au retour au premier
  // plan par la dernière réponse, que l'écouteur ne reçoit pas toujours quand Android rouvre l'application
  const handled = useRef<null | string>(null);
  useEffect(() => {
    const openFrom = (response: Notifications.NotificationResponse | null) => {
      const identifier = response?.notification.request.identifier ?? null;
      const path = (response?.notification.request.content.data as undefined | { path?: string })?.path;
      if (!identifier || !path || handled.current === identifier) return;
      handled.current = identifier;
      // Les réglages de l'application se ferment : la session s'ouvre dans la vue web
      setScreen((current) => (current.kind === 'settings' ? { kind: 'bosco', path: '/' } : current));
      bosco.current?.open(path);
    };
    const listener = Notifications.addNotificationResponseReceivedListener(openFrom);
    const state = AppState.addEventListener('change', (next) => {
      if (next === 'active') openFrom(Notifications.getLastNotificationResponse());
    });
    return () => {
      listener.remove();
      state.remove();
    };
  }, []);

  // Connecté en arrière-plan (E18d, désactivé par défaut) : un service au premier plan, avec sa notification permanente,
  // empêche Android de geler l'application ; sans lui, les notifications n'arrivent qu'application ouverte
  useEffect(() => {
    boscoTrust.setKeepAlive(preferences.background && workstation !== null);
  }, [preferences.background, workstation]);

  // Retour Android depuis les réglages : revenir à Bosco
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen.kind !== 'settings') return false;
      setScreen({ kind: 'bosco', path: '/' });
      return true;
    });
    return () => subscription.remove();
  }, [screen.kind]);

  const forget = async () => {
    await saveWorkstation(null);
    setWorkstation(null);
    setScreen({ kind: 'pair' });
  };

  // Android 15 dessine sous les barres du système : la zone sûre garde l'interface hors de la barre d'état et des gestes
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        {screen.kind === 'pair' && (
          <PairScreen
            onPair={({ code, fingerprint, url }) => {
              const paired = { fingerprint, url, pairedAt: new Date().toISOString() };
              void saveWorkstation(paired).then(() => {
                setWorkstation(paired);
                // La page d'appairage du poste s'appaire seule avec le code de son adresse (E4c)
                setScreen({ kind: 'bosco', path: `/pair?code=${code ?? ''}` });
              });
            }}
          />
        )}
        {(screen.kind === 'bosco' || screen.kind === 'settings') && workstation && (
          <BoscoScreen
            ref={bosco}
            url={workstation.url}
            initialPath={screen.kind === 'bosco' ? screen.path : '/'}
            onChangeWorkstation={() => void forget()}
            onMessage={(message) => {
              if (message.type === 'app-settings') setScreen({ kind: 'settings' });
              else if (AppState.currentState !== 'active' || message.urgent) void notify(message);
            }}
          />
        )}
        {screen.kind === 'settings' && workstation && (
          <View style={StyleSheet.absoluteFill}>
            <SettingsScreen
              workstation={workstation}
              preferences={preferences}
              onBack={() => setScreen({ kind: 'bosco', path: '/' })}
              onForget={() => void forget()}
              onNotificationSettings={() => {
                setScreen({ kind: 'bosco', path: '/' });
                bosco.current?.open('/settings/notifications');
              }}
              onPreferences={(next) => {
                setPreferences(next);
                void savePreferences(next).then(() => setupNotifications(next.vibrate));
              }}
            />
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.canvas } });
