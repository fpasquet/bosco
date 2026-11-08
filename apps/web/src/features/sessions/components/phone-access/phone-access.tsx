'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Smartphone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
  devicesQuery,
  issuePairingCode,
  type PairingCodeDto,
  phoneAccessQuery,
  revokeDevice,
  setPhoneAccess,
} from '../../api/access';
import { useCopy } from '../../hooks/use-copy';
import { useNow } from '../../hooks/use-now';
import { sinceNow } from '../../lib/format';
import { useNotices } from '../../lib/notices';
import { PairingDialog } from '../pairing-dialog';

/** Pendant l'appairage, la liste des téléphones se relit à cet intervalle pour voir arriver le nouveau. */
const WAITING_REFRESH_MS = 2000;

/**
 * Accès depuis le téléphone (E4a, E4c) : désactivé par défaut ; l'activer ouvre l'appairage par code, et un téléphone
 * appairé se retire d'un clic (CA-SESS-60, CA-SESS-68, CA-SESS-69).
 */
export function PhoneAccess() {
  const now = useNow();
  const client = useQueryClient();
  const copy = useCopy();
  const push = useNotices((state) => state.push);
  const [code, setCode] = useState<null | PairingCodeDto>(null);
  const known = useRef<Set<string>>(new Set());
  const { data: access } = useQuery(phoneAccessQuery);
  const { data: devices } = useQuery({ ...devicesQuery, refetchInterval: code ? WAITING_REFRESH_MS : false });
  const newCode = useMutation({ mutationFn: issuePairingCode, onSuccess: setCode });
  const enable = useMutation({
    mutationFn: () => setPhoneAccess(true),
    onSuccess: (status) => {
      client.setQueryData(phoneAccessQuery.queryKey, status);
      known.current = new Set((devices ?? []).map((device) => device.id));
      newCode.mutate();
    },
    onError: () =>
      push('L’accès du téléphone n’a pas pu s’ouvrir : ce poste n’a pas d’adresse sur le réseau local.', 'warning'),
  });
  const disable = useMutation({
    mutationFn: () => setPhoneAccess(false),
    onSuccess: (status) => client.setQueryData(phoneAccessQuery.queryKey, status),
  });
  const revoke = useMutation({
    mutationFn: revokeDevice,
    onSuccess: () => client.invalidateQueries({ queryKey: devicesQuery.queryKey }),
  });
  // Un téléphone nouvellement appairé ferme la fenêtre et rejoint la liste (CA-SESS-68)
  useEffect(() => {
    if (!code || !devices) return;
    if (devices.some((device) => !known.current.has(device.id))) {
      setCode(null);
      push('Téléphone appairé', 'success');
    }
  }, [code, devices, push]);
  if (!access) return null;
  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium">Accès depuis le téléphone</p>
          <p className="text-xs text-muted">
            {access.enabled
              ? `Activé sur le réseau local : ${access.urls.join(', ')}`
              : 'Désactivé : aucun accès en dehors de ce poste.'}
          </p>
        </div>
        {access.enabled && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted"
            disabled={disable.isPending}
            onClick={() => disable.mutate()}
          >
            Désactiver
          </Button>
        )}
        <Button
          variant={access.enabled ? 'outline' : 'primary'}
          size="sm"
          disabled={enable.isPending}
          onClick={() => enable.mutate()}
        >
          {access.enabled ? 'Appairer un téléphone' : 'Activer et appairer un téléphone'}
        </Button>
      </div>
      {devices && devices.length > 0 && (
        <ul
          aria-label="Téléphones appairés"
          className="flex flex-col divide-y divide-line rounded-control border border-line"
        >
          {devices.map((device) => (
            <li key={device.id} className="flex items-center gap-3 px-3 py-2">
              <Smartphone aria-hidden className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate">{device.name}</span>
              <span className="text-xs text-muted">appairé {sinceNow(new Date(device.pairedAt), now)}</span>
              <Button variant="ghost" size="sm" onClick={() => revoke.mutate(device.id)}>
                Retirer
              </Button>
            </li>
          ))}
        </ul>
      )}
      <PairingDialog
        open={code !== null}
        code={code}
        now={now}
        url={access.urls[0] ?? null}
        onCopy={copy}
        onNewCode={() => newCode.mutate()}
        onCancel={() => setCode(null)}
      />
    </div>
  );
}
