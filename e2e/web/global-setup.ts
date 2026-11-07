import { replayClean } from '../shared/replay-clean.ts';
import { RECORDINGS } from './paths.ts';

// Les enregistrements du web sont les réponses de l'API de Bosco rejouées dans le navigateur, notées par chaque processus
export default replayClean(RECORDINGS, 'browser-');
