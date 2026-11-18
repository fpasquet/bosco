import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

export const revalidate = false;

// Recherche hébergée avec le site : l'index entier est exporté au build, puis interrogé dans le navigateur
export const { staticGET: GET } = createFromSource(source);
