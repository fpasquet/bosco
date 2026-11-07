// Ce que les scénarios ne voient pas : le service systemd lance la commande sans ouvrir de navigateur.
import { describe, expect, it } from 'vitest';
import { serviceUnit } from './service-unit.ts';

describe('serviceUnit', () => {
  it('starts the service without opening a browser and restarts it on failure', () => {
    const unit = serviceUnit({ node: '/usr/bin/node', cli: '/opt/bosco/cli.js', name: 'Bosco' });
    expect(unit).toContain('ExecStart=/usr/bin/node /opt/bosco/cli.js start --no-open');
    expect(unit).toContain('Restart=on-failure');
  });
});
