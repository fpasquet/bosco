// Ce que les scénarios ne voient pas : la réduction d'un fichier Compose aux options sûres (CA-CONT-51).
import { describe, expect, it } from 'vitest';
import { parseCompose } from './compose-file.ts';

const COMPOSE = `
services:
  app:
    build: .
    ports: ['3000:3000']
  database:
    image: mysql:8.0
    ports: ['3306:3306']
    volumes: ['db-data:/var/lib/mysql', './init:/docker-entrypoint-initdb.d']
    environment:
      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD:-root}
      MYSQL_DATABASE: voix
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost']
      interval: 5s
      retries: 10
  rabbitmq:
    image: rabbitmq:3.8
    environment: ['RABBITMQ_DEFAULT_USER=guest']
    command: rabbitmq-server --verbose
    privileged: true
volumes:
  db-data:
`;

describe('parseCompose', () => {
  it('keeps the image, variables, command and health check, and names what is removed', () => {
    const [app, database, rabbitmq] = parseCompose(COMPOSE);
    expect(app).toMatchObject({ name: 'app', image: null, removed: ['ports publiés'] });
    expect(database).toMatchObject({
      image: 'mysql:8.0',
      environment: { MYSQL_ROOT_PASSWORD: 'root', MYSQL_DATABASE: 'voix' },
      healthcheck: { command: 'mysqladmin ping -h localhost', interval: '5s', retries: 10, timeout: null },
      removed: ['ports publiés', 'volumes nommés', 'dossiers du poste'],
    });
    expect(rabbitmq).toMatchObject({
      environment: { RABBITMQ_DEFAULT_USER: 'guest' },
      command: ['rabbitmq-server', '--verbose'],
      removed: ['droits étendus'],
    });
  });

  it('reads nothing from an unreadable file', () => {
    expect(parseCompose('services: [')).toEqual([]);
  });
});
