<!-- Généré par export.mjs (skill requirements-doc) depuis le cahier des charges : ne pas modifier ici. -->

# Bosco · exigences de développement

Extrait du cahier des charges pour l'équipe de développement et ses agents : règles et critères d'acceptation par lot, exigences non fonctionnelles, architecture et décisions techniques. Le document complet (lots chiffrés, planning, risques) se lit dans l'artifact du cahier des charges.

| | |
|---|---|
| Version | 0.36 · 17/11/2026 (Brouillon, à relire) |
| Cahier des charges | [artifact](https://claude.ai/artifact/8ze73zWxiHUVDx99xfQqC4) |
| Specs UI | [artifact](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) |
| Source | `fpasquet/specs` · `bosco/requirements` |

## Contenu

| Fichier | Partie |
|---|---|
| [presentation.md](presentation.md) | 1. Présentation du projet |
| [utilisateurs.md](utilisateurs.md) | 2. Utilisateurs et rôles |
| [lots/sessions.md](lots/sessions.md) | 3.1 Lot 1 · Sessions |
| [lots/taches.md](lots/taches.md) | 3.2 Lot 2 · Tâches |
| [lots/contexte.md](lots/contexte.md) | 3.3 Lot 3 · Contexte et isolation |
| [lots/apps.md](lots/apps.md) | 3.4 Lot 4 · Applications |
| [interface.md](interface.md) | 4. Interface et identité visuelle |
| [exigences-non-fonctionnelles.md](exigences-non-fonctionnelles.md) | 5. Exigences non fonctionnelles |
| [architecture.md](architecture.md) | 6. Architecture |
| [stack.md](stack.md) | 7. Stack technique |
| [infrastructure.md](infrastructure.md) | 8. Infrastructure et exploitation |

## Écrans

| Lot | Écran | Titre | États | Implémentation | Specs |
|---|---|---|---|---|---|
| Lot 1 · Sessions | E1 | Vue d'ensemble | [E1a](lots/sessions.md#e1a), [E1b](lots/sessions.md#e1b), [E1c](lots/sessions.md#e1c), [E1d](lots/sessions.md#e1d), [E1e](lots/sessions.md#e1e), [E1f](lots/sessions.md#e1f) | Livré | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e1.html` |
| Lot 1 · Sessions | E2 | Détail d'une session | [E2a](lots/sessions.md#e2a), [E2b](lots/sessions.md#e2b), [E2c](lots/sessions.md#e2c), [E2d](lots/sessions.md#e2d), [E2e](lots/sessions.md#e2e), [E2f](lots/sessions.md#e2f), [E2g](lots/sessions.md#e2g), [E2h](lots/sessions.md#e2h), [E2i](lots/sessions.md#e2i), [E2j](lots/sessions.md#e2j) | Livré (Écarts : les sorties refusées d'un bac à sable s'affichent en fin de fil et « Ajouter à la liste » ne remplit pas le domaine ; pas de consommation du conteneur dans la carte du bac à sable ; sur le téléphone, pas d'onglet « Bac à sable » et l'aide sous la zone de message est masquée ; la vue d'ensemble n'a pas la marque « Bac à sable » ; « Arrêter » est un bouton contour ; le serveur du canal s'appelle `bosco-channel`, `bosco` étant celui du serveur MCP.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e2.html` |
| Lot 1 · Sessions | E3 | Historique | [E3a](lots/sessions.md#e3a), [E3b](lots/sessions.md#e3b) | Livré (Écarts : la répartition par modèle suit le modèle principal de chaque session ; « Tout afficher » d'un jour chargé n'existe pas, toutes ses sessions sont montrées.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e3.html` |
| Lot 1 · Sessions | E4 | Sources | [E4a](lots/sessions.md#e4a), [E4b](lots/sessions.md#e4b), [E4c](lots/sessions.md#e4c), [E4d](lots/sessions.md#e4d), [E4f](lots/sessions.md#e4f) | Livré (Écarts : « Ajouter un dossier », « Gérer » et l'état « À mettre à jour » d'une source illisible ne sont pas faits ; le serveur de Bosco (décisions) ne s'ajoute pas encore au profil depuis cet écran.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e4.html` |
| Lot 1 · Sessions | E15 | Notifications | [E15a](lots/sessions.md#e15a), [E15b](lots/sessions.md#e15b), [E15c](lots/sessions.md#e15c) | Livré (Écart : le titre d'une session sans titre donné par Claude Code est sa première demande, coupée à 60 caractères dans la notification du bureau.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e15.html` |
| Lot 1 · Sessions | E16 | Nouvelle session | [E16a](lots/sessions.md#e16a), [E16b](lots/sessions.md#e16b) | Livré | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e16.html` |
| Lot 2 · Tâches | E5 | File de tâches | [E5a](lots/taches.md#e5a), [E5b](lots/taches.md#e5b), [E5c](lots/taches.md#e5c) | Écart (Mis de côté le 17/11/2026 avec les tâches (DT-40) : retiré dans fpasquet/bosco#47, retour préparé dans fpasquet/bosco#48.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e5.html` |
| Lot 2 · Tâches | E6 | Nouvelle tâche | [E6a](lots/taches.md#e6a), [E6b](lots/taches.md#e6b) | Écart (Mis de côté le 17/11/2026 avec les tâches (DT-40) : retiré dans fpasquet/bosco#47, retour préparé dans fpasquet/bosco#48. Écart à reprendre au retour : modèle et effort ne se choisissent pas encore.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e6.html` |
| Lot 2 · Tâches | E7 | Revue d'une tâche | [E7a](lots/taches.md#e7a), [E7b](lots/taches.md#e7b), [E7c](lots/taches.md#e7c) | Écart (Mis de côté le 17/11/2026 avec les tâches (DT-40) : retiré dans fpasquet/bosco#47, retour préparé dans fpasquet/bosco#48. Écarts à reprendre au retour : « Voir le texte transmis » déplie le texte dans le fil au lieu d'ouvrir E9f ; pas de puces de contexte sur la consigne ; sur le téléphone, la revue se lit en une colonne, sans onglets ; le lien de la PR ne rejoint pas encore la session.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e7.html` |
| Lot 2 · Tâches | E8 | Droits des agents | [E8a](lots/taches.md#e8a) | Écart (Mis de côté le 17/11/2026 avec les tâches (DT-40) : retiré dans fpasquet/bosco#47, retour préparé dans fpasquet/bosco#48. Écart à reprendre au retour : l'effort n'est pas réglable.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e8.html` |
| Lot 2 · Tâches | E13 | Détail d'une tâche | [E13a](lots/taches.md#e13a), [E13b](lots/taches.md#e13b), [E13c](lots/taches.md#e13c), [E13d](lots/taches.md#e13d) | Écart (Mis de côté le 17/11/2026 avec les tâches (DT-40) : retiré dans fpasquet/bosco#47, retour préparé dans fpasquet/bosco#48.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e13.html` |
| Lot 3 · Contexte et isolation | E9 | Contexte transmis aux agents | [E9a](lots/contexte.md#e9a), [E9b](lots/contexte.md#e9b), [E9c](lots/contexte.md#e9c), [E9d](lots/contexte.md#e9d), [E9e](lots/contexte.md#e9e), [E9f](lots/contexte.md#e9f) | Livré (Écart : le compteur des décisions à valider n'est pas repris sur l'entrée « Contexte ».) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e9.html` |
| Lot 3 · Contexte et isolation | E10 | Liens d'une tâche | [E10b](lots/contexte.md#e10b) | Écart (Mis de côté le 17/11/2026 avec les tâches (DT-40) : retiré dans fpasquet/bosco#47, retour préparé dans fpasquet/bosco#48. Écarts à reprendre au retour : les liens s'ajoutent aux tâches seulement, pas aux sessions ni aux décisions ; CA-CONT-97 n'a pas de scénario.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e10.html` |
| Lot 3 · Contexte et isolation | E11 | Isolation du bac à sable et abonnement | [E11a](lots/contexte.md#e11a), [E11b](lots/contexte.md#e11b), [E11c](lots/contexte.md#e11c) | Livré | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e11.html` |
| Lot 3 · Contexte et isolation | E19 | Conteneurs en cours | [E19a](lots/contexte.md#e19a), [E19b](lots/contexte.md#e19b), [E19c](lots/contexte.md#e19c), [E19d](lots/contexte.md#e19d) | Livré | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e19.html` |
| Lot 3 · Contexte et isolation | E12 | Environnement de test | [E12a](lots/contexte.md#e12a) | Écart (Mis de côté le 17/11/2026 avec les tâches (DT-40) : retiré dans fpasquet/bosco#47, retour préparé dans fpasquet/bosco#48. Écart à reprendre au retour : un service qui dépend d'un fichier du dépôt monté ne démarre pas.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e12.html` |
| Lot 3 · Contexte et isolation | E14 | Socles | [E14a](lots/contexte.md#e14a), [E14b](lots/contexte.md#e14b), [E14c](lots/contexte.md#e14c) | Livré | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e14.html` |
| Lot 4 · Applications | E17 | Application desktop | [E17a](lots/apps.md#e17a), [E17b](lots/apps.md#e17b), [E17c](lots/apps.md#e17c), [E17d](lots/apps.md#e17d) | Livré (Écarts : E17b est une boîte de dialogue native ; lancée depuis le dépôt sans chrome-sandbox configuré (sudo), l'application se lance sans bac à sable ; pas de paquet AppImage.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `apps/e17.html` |
| Lot 4 · Applications | E18 | Application Android | [E18a](lots/apps.md#e18a), [E18b](lots/apps.md#e18b), [E18c](lots/apps.md#e18c), [E18d](lots/apps.md#e18d) | Livré (Écarts : « Oublier ce poste » ne retire pas le téléphone côté poste (à faire dans Sources) ; la notification n'a pas encore le bouton « Autoriser » ; en arrière-plan sans l'option, Android gèle l'application et les notifications attendent son retour.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `apps/e18.html` |

## Identifiants

- **RF-…** règles fonctionnelles, **CA-…** critères d'acceptation, **NF-…** exigences non fonctionnelles, **DT-…** décisions techniques.
- Un identifiant ne change jamais de sens et n'est jamais réutilisé : un critère abandonné reste, barré et marqué « Retiré ».
- Un test cite le critère qu'il vérifie dans son nom (« CA-CONN-27 · refuse une clé d'API »). La couverture se mesure avec `trace.mjs` du skill `requirements-doc` : `node <skill>/scripts/trace.mjs docs/requirements`.
- Les décisions **DT-…** viennent du cahier des charges. Une décision prise pendant les développements (ADR de l'équipe, hors de ce dossier) qui en remplace une se reporte dans le cahier des charges, qui marque la DT « Remplacée ».
- Ces fichiers ne se modifient pas ici. Un écart entre le code et ces exigences se reporte dans les specs ou le cahier des charges, puis l'export suivant met ce dossier à jour.
