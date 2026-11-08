'use client';
// Interface ouverte dans l'application Android de Bosco (E18, DT-33) : la page lui transmet ses notifications et
// ouvre ses réglages par des messages ; ailleurs (navigateur), rien ne change.
import { useSyncExternalStore } from 'react';

/** Message vers l'application : une notification à montrer, ou ses réglages à ouvrir */
export type AndroidAppMessage =
  { body: string; path: string; title: string; type: 'notification'; urgent: boolean } | { type: 'app-settings' };

interface AndroidBridge {
  postMessage(message: string): void;
}

function bridge(): AndroidBridge | null {
  return (globalThis as { ReactNativeWebView?: AndroidBridge }).ReactNativeWebView ?? null;
}

export function postToAndroidApp(message: AndroidAppMessage): boolean {
  const target = bridge();
  target?.postMessage(JSON.stringify(message));
  return target !== null;
}

const noSubscription = () => () => undefined;

/** Vrai dans l'application Android ; faux au rendu serveur et dans un navigateur. */
export function useAndroidApp(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => bridge() !== null,
    () => false,
  );
}
