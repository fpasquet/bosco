/** Fichier d'unité systemd de l'utilisateur : Bosco démarre avec la session et redémarre s'il s'arrête. */
export function serviceUnit({ node, cli, name }: { cli: string; name: string; node: string }): string {
  return [
    '[Unit]',
    `Description=${name}, local control room for Claude Code sessions`,
    'After=network.target',
    '',
    '[Service]',
    `ExecStart=${node} ${cli} start --no-open`,
    'Restart=on-failure',
    'RestartSec=2',
    '',
    '[Install]',
    'WantedBy=default.target',
    '',
  ].join('\n');
}
