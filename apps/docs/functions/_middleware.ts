// Middleware Cloudflare Pages : l'adresse pages.dev du projet renvoie vers le domaine rattaché, chemin et paramètres
// gardés. Les déploiements de prévisualisation (<hash>.bosco-c5q.pages.dev) restent servis tels quels.
const PAGES_DEV_HOSTNAME = 'bosco-c5q.pages.dev';
const CUSTOM_HOSTNAME = 'bosco.suitebase.dev';

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  if (url.hostname === PAGES_DEV_HOSTNAME) {
    url.hostname = CUSTOM_HOSTNAME;
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
};
