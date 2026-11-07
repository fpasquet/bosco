import { replayClean } from '../shared/replay-clean.ts';
import { RECORDINGS } from './paths.ts';

// Les enregistrements de l'API sont les appels sortants de Bosco, notés par ses instances
export default replayClean(RECORDINGS, 'server-');
