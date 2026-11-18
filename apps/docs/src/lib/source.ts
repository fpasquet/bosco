import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';
import { DOCS_BASE_PATH } from '@/lib/constants';

export const source = loader({
  baseUrl: DOCS_BASE_PATH,
  source: docs.toFumadocsSource(),
});
