<!-- Généré par export.mjs (skill requirements-doc) depuis sources/40-interface.md : ne pas modifier ici. -->

# <a id="4-interface-et-identite-visuelle"></a>4. Interface et identité visuelle

## <a id="41-principes"></a>4.1 Principes

Disposition retenue : proposition A « Tour de contrôle », avec les colonnes d'état de la proposition B en second regroupement. Barre latérale permanente (navigation, dépôts, profils, état des sources). L'écran d'accueil répond d'abord à « qui attend ma réponse ? » par un bandeau en tête. Thème « Atelier clair », densité standard. L'interface est en français et tutoie l'utilisateur.

## <a id="42-logo"></a>4.2 Logo

Le logo est le sifflet de bosco, l'appeau avec lequel le maître d'équipage appelle l'équipage : Bosco appelle le développeur quand une session a besoin de lui. Pictogramme blanc sur `primary`, sur une grille de 24 px avec un trait de 2 px. Deux fichiers, dans les specs (`specs/ui/assets/`), à reprendre tels quels :

- `logo.svg` : le sifflet complet, avec sa chaînette, pour 24 px et plus ;
- `favicon.svg` : sans la chaînette, avec un trait plus épais, pour 16 et 32 px (favicon, icône de notification du bureau).

Dans l'interface, le pictogramme est tracé en ligne et prend la couleur du texte (`currentColor`). Il est décoratif à côté du nom sur ordinateur (`aria-hidden`) et porte le nom « Bosco » dans l'en-tête du téléphone, où il est seul (`role="img"`).

## <a id="43-identite-visuelle-tokens"></a>4.3 Identité visuelle (tokens)

Les tokens sont le contrat entre les maquettes et le code : ils se reprennent tels quels (bloc `@theme` de Tailwind CSS v4). Les maquettes et l'application emploient les classes de daisyUI 5.7.50, avec un thème daisyUI pointé sur ces tokens (`base-100` → `surface`, `base-200` → `surface-alt`, `base-300` → `line`, `base-content` → `ink`, `error` → `danger`, rayons et hauteur des champs tirés des tokens) : une couleur se change dans les tokens, jamais dans le thème (DT-25).

| Token | Valeur | Usage |
|---|---|---|
| `font-sans` | `"Instrument Sans", ui-sans-serif, system-ui, sans-serif` |  |
| `font-display` | `"Instrument Sans", ui-sans-serif, system-ui, sans-serif` |  |
| `font-mono` | `"JetBrains Mono", ui-monospace, monospace` | Surfaces : neutres légèrement teintés vers le vert d'eau de la marque |
| `color-canvas` | `#f3f6f5` |  |
| `color-surface` | `#ffffff` |  |
| `color-surface-alt` | `#ebf0ef` |  |
| `color-line` | `#d9e1df` |  |
| `color-line-strong` | `#7f8c88` | Texte |
| `color-ink` | `#142321` |  |
| `color-muted` | `#52615d` | Navigation principale : barre latérale claire |
| `color-nav` | `#ffffff` |  |
| `color-nav-ink` | `#142321` |  |
| `color-nav-muted` | `#52615d` |  |
| `color-nav-active` | `#dfeeeb` | Marque : vert d'eau réservé aux actions et à la sélection |
| `color-primary` | `#0d6e66` |  |
| `color-primary-hover` | `#0a5751` |  |
| `color-primary-soft` | `#dfeeeb` |  |
| `color-on-primary` | `#ffffff` | États : T'attend = warning, En cours = info, À relire = primary, Inactive = muted, Terminée = success, En échec = danger |
| `color-success` | `#1f7a45` |  |
| `color-success-soft` | `#e2f2e8` |  |
| `color-warning` | `#8a5300` |  |
| `color-warning-soft` | `#fcefd4` |  |
| `color-danger` | `#b42318` |  |
| `color-danger-soft` | `#fce8e6` |  |
| `color-on-danger` | `#ffffff` |  |
| `color-info` | `#1d5ba3` |  |
| `color-info-soft` | `#e4effb` | Formes, densité, relief |
| `radius-control` | `0.375rem` |  |
| `radius-card` | `0.625rem` |  |
| `spacing-control` | `2.25rem` |  |
| `spacing-row` | `3rem` |  |
| `shadow-card` | `0 1px 2px rgb(20 35 33 / 0.06)` |  |
| `shadow-overlay` | `0 12px 32px rgb(20 35 33 / 0.18)` |  |
| `color-overlay` | `#1423214d` | voile sous les fenêtres et panneaux (bg-overlay) : encre à 30 % |

## <a id="44-composants"></a>4.4 Composants

Classes de daisyUI employées par les maquettes, reprises par les composants de l'application : `btn` (`btn-primary` principal, `btn-outline` secondaire, `btn-ghost` discret, `btn-error`, tailles `btn-sm` et `btn-xs`, `btn-block` sur mobile), `badge badge-soft` par état (`badge-ghost` pour le neutre), `input`, `checkbox`, `toggle` (état par `aria-checked`), `table`, `kbd`, `modal` et `modal-box` (`modal-bottom` pour les feuilles mobiles). Les couleurs et les mises en page passent par les tokens (`bg-surface`, `text-muted`, `border-line`) ; les panneaux latéraux et les cartes restent en utilitaires des tokens.

| Composant | Rôle | Écrans |
|---|---|---|
| Coquille desktop et mobile | Barre latérale, ou en-tête et onglets bas | Tous |
| Écran poussé mobile | Retour, titre, menu | Détails |
| Badge d'état | Un libellé et une couleur par état, partout identiques | Tous |
| Bandeau d'attente | Sessions qui t'attendent, avec leur question | [E1b](lots/sessions.md#e1b) |
| Carte d'autorisation | Commande, motif, Refuser, Autoriser | [E2b](lots/sessions.md#e2b) |
| Carte de session | Colonnes par état, mini-fil des trois dernières actions | [E1d](lots/sessions.md#e1d) |
| Fil d'événements | Messages et actions, repliables | [E2a](lots/sessions.md#e2a) |
| Vue de diff | Fichiers et lignes modifiés | [E2c](lots/sessions.md#e2c), [E7a](lots/taches.md#e7a) |
| Enchaînement | Schéma des dépendances entre tâches | [E5b](lots/taches.md#e5b) |
| Tableau d'origine | Valeur effective et origine d'un réglage | [E8a](lots/taches.md#e8a) |
| Modale et feuille mobile | Confirmations | [E7b](lots/taches.md#e7b), [E7c](lots/taches.md#e7c), [E13c](lots/taches.md#e13c) |
| Panneau latéral | Détails sans quitter l'écran | [E4b](lots/sessions.md#e4b), [E9f](lots/contexte.md#e9f), [E10b](lots/contexte.md#e10b), [E14b](lots/contexte.md#e14b) |

## <a id="45-responsive-et-mobile"></a>4.5 Responsive et mobile

Deux tailles de référence : desktop 1280 × 820, mobile 390 × 844. Point de rupture principal à 768 px. Chaque écran a sa maquette mobile. Sur téléphone, on consulte et on répond ; on configure sur le poste. Saisie d'un chemin, d'une décision ou d'un socle, droits, isolation et intégrations renvoient au poste. Cibles tactiles de 44 px au moins.

## <a id="46-accessibilite"></a>4.6 Accessibilité

Niveau visé : WCAG 2.2 AA. Contrastes du thème vérifiés le 06/11/2026. Un état n'est jamais porté par la seule couleur : il a toujours son libellé. Navigation complète au clavier sur desktop, focus visible, animations désactivées si le système le demande.
