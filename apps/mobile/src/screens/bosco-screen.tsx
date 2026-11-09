// L'interface téléphone de Bosco, telle qu'elle est (E18b, CA-APPS-06) : la vue web ne fait confiance qu'au certificat
// du poste ; les notifications et l'ouverture des réglages arrivent par des messages de la page.
import { forwardRef, useImperativeHandle, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { type BridgeMessage, parseBridgeMessage } from '../lib/notifications';
import { colors } from '../lib/theme';
import { UnreachableScreen } from './unreachable-screen';

export interface BoscoHandle {
  open(path: string): void;
}

export interface BoscoScreenProps {
  /** Première page : l'appairage avec son code, puis la vue d'ensemble */
  initialPath: string;
  onChangeWorkstation: () => void;
  onMessage: (message: BridgeMessage) => void;
  url: string;
}

// Les types de react-native-webview valent `never` sans paramètre (WebViewProps & undefined) avec TypeScript 6
const BoscoWebView = WebView<object>;

const clock = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export const BoscoScreen = forwardRef<BoscoHandle, BoscoScreenProps>(function BoscoScreen(props, handle) {
  const { initialPath, onChangeWorkstation, onMessage, url } = props;
  const [source, setSource] = useState(`${url}${initialPath}`);
  const [unreachable, setUnreachable] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<null | string>(null);
  useImperativeHandle(handle, () => ({
    // L'adresse de la vue web change : un script injecté ne passe pas quand l'application revient de l'arrière-plan
    open: (path) => {
      setUnreachable(false);
      const separator = path.includes('?') ? '&' : '?';
      setSource(`${url}${path}${separator}from=${Date.now()}`);
    },
  }));
  if (unreachable)
    return (
      <UnreachableScreen
        url={url}
        lastUpdate={lastUpdate}
        onChange={onChangeWorkstation}
        onRetry={() => {
          setUnreachable(false);
          setSource(`${url}/?retry=${Date.now()}`);
        }}
      />
    );
  return (
    <View style={styles.screen}>
      <BoscoWebView
        source={{ uri: source }}
        // L'application se présente à la page : elle transmet les notifications et ouvre ses réglages
        applicationNameForUserAgent="BoscoAndroid/1.0"
        sharedCookiesEnabled
        onMessage={(event: WebViewMessageEvent) => {
          const message = parseBridgeMessage(event.nativeEvent.data);
          if (message) onMessage(message);
        }}
        onLoadEnd={() => setLastUpdate(clock())}
        onError={() => setUnreachable(true)}
        // Ce qui sort de Bosco (GitHub, Jira…) s'ouvre hors de l'application
        originWhitelist={[url]}
      />
    </View>
  );
});

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas } });
