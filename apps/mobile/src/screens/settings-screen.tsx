// Réglages de l'application (E18d, CA-APPS-08) : le poste appairé, rester connecté en arrière-plan, vibrer.
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { AppPreferences, Workstation } from '../lib/storage';
import { colors } from '../lib/theme';

export interface SettingsScreenProps {
  onBack: () => void;
  onForget: () => void;
  onNotificationSettings: () => void;
  onPreferences: (preferences: AppPreferences) => void;
  preferences: AppPreferences;
  workstation: Workstation;
}

export function SettingsScreen(props: Readonly<SettingsScreenProps>) {
  const { onBack, onForget, onNotificationSettings, onPreferences, preferences, workstation } = props;
  return (
    <View style={styles.screen}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Retour à Bosco">
        <Text style={styles.back}>‹ Ensemble</Text>
      </Pressable>
      <Text style={styles.title}>Réglages de l’application</Text>
      <Text style={styles.section}>Poste</Text>
      <View style={styles.card}>
        <Text style={styles.mono}>{workstation.url}</Text>
        <Text style={styles.small}>appairé le {new Date(workstation.pairedAt).toLocaleDateString('fr-FR')}</Text>
        <Pressable style={styles.danger} onPress={onForget}>
          <Text style={styles.dangerText}>Oublier ce poste</Text>
        </Pressable>
      </View>
      <Text style={styles.section}>Notifications</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Rester connecté en arrière-plan</Text>
            <Text style={styles.small}>
              Les notifications arrivent même application fermée, tant que le téléphone est sur le réseau du poste. Une
              notification permanente « Bosco suit tes sessions » le signale.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Rester connecté en arrière-plan"
            value={preferences.background}
            onValueChange={(background) => onPreferences({ ...preferences, background })}
          />
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, styles.rowText]}>Vibrer pour une autorisation</Text>
          <Switch
            accessibilityLabel="Vibrer pour une autorisation"
            value={preferences.vibrate}
            onValueChange={(vibrate) => onPreferences({ ...preferences, vibrate })}
          />
        </View>
        <Pressable onPress={onNotificationSettings}>
          <Text style={styles.link}>Choisir ce qui notifie →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, padding: 20, paddingTop: 48, gap: 12 },
  back: { color: colors.muted },
  title: { color: colors.ink, fontSize: 20, fontWeight: '600' },
  section: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 8 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  mono: { fontFamily: 'monospace', color: colors.ink },
  small: { color: colors.muted, fontSize: 12 },
  label: { color: colors.ink, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, gap: 4 },
  danger: { borderColor: colors.danger, borderWidth: 1, borderRadius: 8, padding: 8, alignSelf: 'flex-start' },
  dangerText: { color: colors.danger },
  link: { color: colors.primary, fontWeight: '500' },
});
