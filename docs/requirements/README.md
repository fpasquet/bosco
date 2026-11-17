<!-- Généré par export.mjs (skill requirements-doc) depuis le cahier des charges : ne pas modifier ici. -->

# Bosco · exigences de développement

Extrait du cahier des charges pour l'équipe de développement et ses agents : règles et critères d'acceptation par lot, exigences non fonctionnelles, architecture et décisions techniques. Le document complet (lots chiffrés, planning, risques) se lit dans l'artifact du cahier des charges.

| | |
|---|---|
| Version | 0.40 · 17/11/2026 (Brouillon, à relire) |
| Cahier des charges | [artifact](https://claude.ai/artifact/8ze73zWxiHUVDx99xfQqC4) |
| Specs UI | [artifact](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) |
| Source | `fpasquet/specs` · `bosco/requirements` |

## Contenu

| Fichier | Partie |
|---|---|
| [presentation.md](presentation.md) | 1. Présentation du projet |
| [utilisateurs.md](utilisateurs.md) | 2. Utilisateurs et rôles |
| [lots/sessions.md](lots/sessions.md) | 3.1 Lot 1 · Sessions |
| [lots/contexte.md](lots/contexte.md) | 3.2 Lot 3 · Projets, groupes et contexte |
| [lots/apps.md](lots/apps.md) | 3.3 Lot 4 · Applications |
| [lots/reglages.md](lots/reglages.md) | 3.4 Lot 5 · Réglages |
| [interface.md](interface.md) | 4. Interface et identité visuelle |
| [exigences-non-fonctionnelles.md](exigences-non-fonctionnelles.md) | 5. Exigences non fonctionnelles |
| [architecture.md](architecture.md) | 6. Architecture |
| [stack.md](stack.md) | 7. Stack technique |
| [infrastructure.md](infrastructure.md) | 8. Infrastructure et exploitation |

## Écrans

| Lot | Écran | Titre | États | Implémentation | Specs |
|---|---|---|---|---|---|
| Lot 1 · Sessions | E1 | Vue d'ensemble | [E1a](lots/sessions.md#e1a), [E1b](lots/sessions.md#e1b), [E1c](lots/sessions.md#e1c), [E1d](lots/sessions.md#e1d), [E1e](lots/sessions.md#e1e), [E1f](lots/sessions.md#e1f), [E1g](lots/sessions.md#e1g) | À faire évoluer (E1b, E1d, E1g : clic sur un projet ou un groupe qui ouvre sa page, bascule à trois choix ; E1c retiré, remplacé par la page d'un projet (E21c) ; E1g à développer.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e1.html` |
| Lot 1 · Sessions | E2 | Détail d'une session | [E2a](lots/sessions.md#e2a), [E2b](lots/sessions.md#e2b), [E2e](lots/sessions.md#e2e), [E2f](lots/sessions.md#e2f), [E2g](lots/sessions.md#e2g), [E2h](lots/sessions.md#e2h), [E2i](lots/sessions.md#e2i), [E2j](lots/sessions.md#e2j), [E2k](lots/sessions.md#e2k) | À faire évoluer (E2e : cinq modes avec icônes. Tous les états : fil d'Ariane « Projets › projet ». E2c, E2d retirés avec les tâches (DT-43). E2k à développer. E2k : session à plusieurs projets à développer. Écarts : les sorties refusées d'un bac à sable s'affichent en fin de fil et « Ajouter à la liste » ne remplit pas le domaine ; pas de consommation du conteneur dans la carte du bac à sable ; sur le téléphone, pas d'onglet « Bac à sable » et l'aide sous la zone de message est masquée ; la vue d'ensemble n'a pas la marque « Bac à sable » ; « Arrêter » est un bouton contour ; le serveur du canal s'appelle `bosco-channel`, `bosco` étant celui du serveur MCP.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e2.html` |
| Lot 1 · Sessions | E3 | Historique | [E3a](lots/sessions.md#e3a), [E3b](lots/sessions.md#e3b) | À faire évoluer (E3a : onglet Coûts retiré, l'usage a sa page (E23) ; E3b retiré. Écart : « Tout afficher » d'un jour chargé n'existe pas, toutes ses sessions sont montrées.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e3.html` |
| Lot 1 · Sessions | E23 | Usage | [E23a](lots/sessions.md#e23a), [E23b](lots/sessions.md#e23b) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e23.html` |
| Lot 1 · Sessions | E15 | Notifications | [E15a](lots/sessions.md#e15a), [E15b](lots/sessions.md#e15b), [E15c](lots/sessions.md#e15c) | À faire évoluer (E15b : onglet Notifications des Réglages, barre à cinq onglets, fil « Réglages › Notifications ». Écart : le titre d'une session sans titre donné par Claude Code est sa première demande, coupée à 60 caractères dans la notification du bureau.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e15.html` |
| Lot 1 · Sessions | E16 | Nouvelle session | [E16a](lots/sessions.md#e16a), [E16b](lots/sessions.md#e16b), [E16c](lots/sessions.md#e16c), [E16d](lots/sessions.md#e16d), [E16e](lots/sessions.md#e16e) | À faire évoluer (E16a à E16d : valeurs par défaut avec leur origine, cinq modes ; E16e à développer. E16c, E16d : session avec un groupe à développer ; E16a, E16b : champ Projets ; fil d'Ariane selon l'origine de la session.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e16.html` |
| Lot 3 · Projets, groupes et contexte | E20 | Projets | [E20a](lots/contexte.md#e20a), [E20b](lots/contexte.md#e20b), [E20c](lots/contexte.md#e20c), [E20d](lots/contexte.md#e20d) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e20.html` |
| Lot 3 · Projets, groupes et contexte | E21 | Page d'un projet | [E21c](lots/contexte.md#e21c), [E21a](lots/contexte.md#e21a), [E21b](lots/contexte.md#e21b) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e21.html` |
| Lot 3 · Projets, groupes et contexte | E22 | Page d'un groupe | [E22d](lots/contexte.md#e22d), [E22a](lots/contexte.md#e22a), [E22b](lots/contexte.md#e22b), [E22c](lots/contexte.md#e22c) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e22.html` |
| Lot 3 · Projets, groupes et contexte | E9 | Contexte d'un projet | [E9a](lots/contexte.md#e9a), [E9b](lots/contexte.md#e9b), [E9c](lots/contexte.md#e9c), [E9d](lots/contexte.md#e9d), [E9e](lots/contexte.md#e9e), [E9f](lots/contexte.md#e9f) | À faire évoluer (Tous les états : onglet Contexte de la page d'un projet, fil « Projets › api-tarifs › Contexte ». E9a, E9c, E9f : instructions des groupes, plus d'exception. Écart déjà connu : le compteur des décisions à valider n'est pas repris (désormais sur l'onglet Contexte).) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e9.html` |
| Lot 3 · Projets, groupes et contexte | E14 | Socles (retiré) | [E14a](lots/contexte.md#e14a) | À faire évoluer (Retiré : remplacé par les groupes (E22), à retirer du code.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e14.html` |
| Lot 4 · Applications | E17 | Application desktop | [E17a](lots/apps.md#e17a), [E17b](lots/apps.md#e17b), [E17c](lots/apps.md#e17c), [E17d](lots/apps.md#e17d) | Livré (Écarts : E17b est une boîte de dialogue native ; lancée depuis le dépôt sans chrome-sandbox configuré (sudo), l'application se lance sans bac à sable ; pas de paquet AppImage.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `apps/e17.html` |
| Lot 4 · Applications | E18 | Application Android | [E18a](lots/apps.md#e18a), [E18b](lots/apps.md#e18b), [E18c](lots/apps.md#e18c), [E18d](lots/apps.md#e18d) | Livré (Écarts : « Oublier ce poste » ne retire pas le téléphone côté poste (à faire dans Sources) ; la notification n'a pas encore le bouton « Autoriser » ; en arrière-plan sans l'option, Android gèle l'application et les notifications attendent son retour.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `apps/e18.html` |
| Lot 5 · Réglages | E4 | Sources et téléphone | [E4a](lots/reglages.md#e4a), [E4b](lots/reglages.md#e4b), [E4c](lots/reglages.md#e4c), [E4d](lots/reglages.md#e4d), [E4f](lots/reglages.md#e4f), [E4g](lots/reglages.md#e4g) | À faire évoluer (E4g à développer ; E4a : « Gérer » ouvre E4g. E4a : onglet Sources des Réglages, l'accès du téléphone part dans E4c, et la source « Bacs à sable » (tenue par Bosco, sans interrupteur ni « Gérer ») remplace la source « worker » ; E4b suit ; E4c : onglet Téléphone ; E4d retiré (remplacé par E20). Écarts connus : « Ajouter un dossier », « Gérer » et l'état « À mettre à jour » d'une source illisible ne sont pas faits ; le serveur de Bosco (décisions) ne s'ajoute pas encore au profil depuis cet écran.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `reglages/e4.html` |
| Lot 5 · Réglages | E11 | Bac à sable et abonnement | [E11a](lots/reglages.md#e11a), [E11c](lots/reglages.md#e11c) | À faire évoluer (E11c : renvoi vers E4g. E11a, E11c : barre d'onglets des Réglages ; E11a : domaines propres à chaque projet.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `reglages/e11.html` |
| Lot 5 · Réglages | E19 | Conteneurs en cours | [E19a](lots/reglages.md#e19a), [E19c](lots/reglages.md#e19c) | Livré | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `reglages/e19.html` |

## Identifiants

- **RF-…** règles fonctionnelles, **CA-…** critères d'acceptation, **NF-…** exigences non fonctionnelles, **DT-…** décisions techniques.
- Un identifiant ne change jamais de sens et n'est jamais réutilisé : un critère abandonné reste, barré et marqué « Retiré ».
- Un test cite le critère qu'il vérifie dans son nom (« CA-CONN-27 · refuse une clé d'API »). La couverture se mesure avec `trace.mjs` du skill `requirements-doc` : `node <skill>/scripts/trace.mjs docs/requirements`.
- Les décisions **DT-…** viennent du cahier des charges. Une décision prise pendant les développements (ADR de l'équipe, hors de ce dossier) qui en remplace une se reporte dans le cahier des charges, qui marque la DT « Remplacée ».
- Ces fichiers ne se modifient pas ici. Un écart entre le code et ces exigences se reporte dans les specs ou le cahier des charges, puis l'export suivant met ce dossier à jour.
