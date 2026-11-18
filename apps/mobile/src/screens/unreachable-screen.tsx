// Poste injoignable : réseau local seulement ; l'application réessaie toute seule.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';
import { countdown, RETRY_S, unreachableText } from '../lib/unreachable';

export function UnreachableScreen(
  props: Readonly<{
    lastUpdate: null | string;
    onChange: () => void;
    onRetry: () => void;
    url: string;
  }>,
) {
  const { lastUpdate, onChange, onRetry, url } = props;
  const [left, setLeft] = useState(RETRY_S);
  useEffect(() => {
    const timer = setInterval(() => {
      setLeft((current) => {
        const next = countdown(current);
        if (next.retry) onRetry();
        return next.left;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onRetry]);
  const text = unreachableText(url, lastUpdate);
  return (
    <View style={styles.screen}>
      <Text style={styles.icon}>⌁</Text>
      <Text style={styles.title}>{text.title}</Text>
      <Text style={styles.muted}>{text.hint}</Text>
      <Pressable style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>{text.retry}</Text>
      </Pressable>
      <Pressable onPress={onChange}>
        <Text style={styles.link}>{text.change}</Text>
      </Pressable>
      <Text style={styles.small}>Nouvelle tentative dans {left} s</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
    padding: 32,
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 40, color: colors.muted },
  title: { color: colors.ink, fontSize: 20, fontWeight: '600', textAlign: 'center' },
  muted: { color: colors.muted, textAlign: 'center' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  buttonText: { color: colors.onPrimary, fontWeight: '600' },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  small: { color: colors.muted, fontSize: 12 },
});
