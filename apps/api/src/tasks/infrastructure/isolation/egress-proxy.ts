// Proxy de sortie d'une tâche du worker (RF-CONT-07), lancé seul dans son conteneur : c'est le seul pont entre le
// réseau privé de l'agent et Internet. Il ne laisse passer que les domaines de la liste, relue à chaque connexion
// (un domaine autorisé depuis Bosco vaut tout de suite), et note chaque refus. Sans dépendance ni import du projet :
// Node le lance tel quel dans l'image de l'agent.
import { appendFileSync, readFileSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { connect } from 'node:net';

const ALLOW = process.env.BOSCO_EGRESS_ALLOW ?? '/bosco/allow/allow.json';
const REFUSALS = process.env.BOSCO_EGRESS_REFUSALS ?? '/bosco/log/refusals.jsonl';
const PORT = Number(process.env.BOSCO_EGRESS_PORT ?? 3128);

/** Même règle que le domaine (egress.ts) : un nom exact, ou « *. » pour ses sous-domaines. */
function allowed(host: string): boolean {
  let domains: string[];
  try {
    domains = JSON.parse(readFileSync(ALLOW, 'utf8')) as string[];
  } catch {
    return false;
  }
  const name = host.toLowerCase().replace(/\.$/, '');
  return domains.some((domain) => {
    const rule = domain.toLowerCase();
    return rule.startsWith('*.') ? name.endsWith(rule.slice(1)) : name === rule;
  });
}

function refuse(host: string): void {
  try {
    appendFileSync(REFUSALS, `${JSON.stringify({ at: new Date().toISOString(), host })}\n`);
  } catch {
    // Le refus s'applique même si la note n'a pas pu s'écrire
  }
}

const server = createServer((incoming, answer) => {
  // HTTP en clair : la requête arrive sous sa forme absolue (http://hôte/chemin)
  let target: URL;
  try {
    target = new URL(incoming.url ?? '');
  } catch {
    answer.writeHead(400).end();
    return;
  }
  if (!allowed(target.hostname)) {
    refuse(target.hostname);
    answer.writeHead(403, { 'content-type': 'text/plain' }).end(`Domaine refusé par Bosco : ${target.hostname}\n`);
    return;
  }
  const upstream = request(target, { method: incoming.method, headers: incoming.headers }, (response) => {
    answer.writeHead(response.statusCode ?? 502, response.headers);
    response.pipe(answer);
  });
  upstream.on('error', () => answer.writeHead(502).end());
  incoming.pipe(upstream);
});

// HTTPS : tunnel CONNECT vers hôte:port, seulement pour un domaine autorisé
server.on('connect', (incoming, socket, head) => {
  const target = incoming.url ?? '';
  const separator = target.lastIndexOf(':');
  const host = separator > 0 ? target.slice(0, separator) : target;
  const port = separator > 0 ? Number(target.slice(separator + 1)) : 443;
  socket.on('error', () => undefined);
  if (!host || !allowed(host)) {
    refuse(host);
    socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');
    return;
  }
  const upstream = connect(port, host, () => {
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  upstream.on('error', () => socket.end('HTTP/1.1 502 Bad Gateway\r\n\r\n'));
  socket.on('close', () => upstream.destroy());
});

server.listen(PORT, '0.0.0.0');
