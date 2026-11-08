<!-- Généré par export.mjs (skill requirements-doc) depuis le cahier des charges : ne pas modifier ici. -->

# Bosco · exigences de développement

Extrait du cahier des charges pour l'équipe de développement et ses agents : règles et critères d'acceptation par lot, exigences non fonctionnelles, architecture et décisions techniques. Le document complet (lots chiffrés, planning, risques) se lit dans l'artifact du cahier des charges.

| | |
|---|---|
| Version | 0.15 · 07/11/2026 (Brouillon, à relire) |
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
| [interface.md](interface.md) | 4. Interface et identité visuelle |
| [exigences-non-fonctionnelles.md](exigences-non-fonctionnelles.md) | 5. Exigences non fonctionnelles |
| [architecture.md](architecture.md) | 6. Architecture |
| [stack.md](stack.md) | 7. Stack technique |
| [infrastructure.md](infrastructure.md) | 8. Infrastructure et exploitation |

## Écrans

| Lot | Écran | Titre | États | Implémentation | Specs |
|---|---|---|---|---|---|
| Lot 1 · Sessions | E1 | Vue d'ensemble | [E1a](lots/sessions.md#e1a), [E1b](lots/sessions.md#e1b), [E1c](lots/sessions.md#e1c), [E1d](lots/sessions.md#e1d), [E1e](lots/sessions.md#e1e), [E1f](lots/sessions.md#e1f) | En cours (Premier lancement (E1a) et vue d'ensemble en direct (E1b à E1e) développés : bandeau T'attend avec « Autoriser » et « Refuser » (motif facultatif), colonne T'attend en regroupement par état, message bref quand une autorisation reçoit sa réponse ici ou dans le terminal ; regroupement par dépôt ou par état, filtre par dépôt, indicateurs et coût du jour, progression de la lecture. Une session arrêtée passe en Terminée. Restent la liste des terminées du jour et Bosco injoignable (E1f).) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e1.html` |
| Lot 1 · Sessions | E2 | Détail d'une session | [E2a](lots/sessions.md#e2a), [E2b](lots/sessions.md#e2b), [E2c](lots/sessions.md#e2c), [E2d](lots/sessions.md#e2d) | En cours (Détail d'une session interactive développé (E2a, E2b) : fil en direct avec « Revenir au direct », carte d'autorisation avec motif du refus et « Répondu ailleurs », usage estimé, fichiers modifiés par l'agent, identifiant et commande de reprise d'une session close (claude --resume, précédée du dossier du profil perso). Écarts : une action du fil tient sur une ligne, sans détail dépliable. Restent les sessions du worker, À relire (E2c) et En échec (E2d), avec le lot 2.) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e2.html` |
| Lot 1 · Sessions | E3 | Historique | [E3a](lots/sessions.md#e3a), [E3b](lots/sessions.md#e3b) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e3.html` |
| Lot 1 · Sessions | E4 | Sources | [E4a](lots/sessions.md#e4a), [E4b](lots/sessions.md#e4b), [E4c](lots/sessions.md#e4c) | En cours (Liste des sources avec l'état du suivi en direct et le dernier signal (E4a, sans les réglages), et installation en trois étapes (E4b) : copie des réglages cochée par défaut, vérification sur un vrai signal, désinstallation qui remet les réglages d'avant. Écarts : le serveur Bosco (tâches et décisions) n'est pas encore ajouté au profil, et la ligne « Réponse aux autorisations vérifiée » attend une première autorisation. Restent les réglages d'E4a et l'appairage du téléphone (E4c).) | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e4.html` |
| Lot 2 · Tâches | E5 | File de tâches | [E5a](lots/taches.md#e5a), [E5b](lots/taches.md#e5b), [E5c](lots/taches.md#e5c) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e5.html` |
| Lot 2 · Tâches | E6 | Nouvelle tâche | [E6a](lots/taches.md#e6a), [E6b](lots/taches.md#e6b) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e6.html` |
| Lot 2 · Tâches | E7 | Revue d'une tâche | [E7a](lots/taches.md#e7a), [E7b](lots/taches.md#e7b), [E7c](lots/taches.md#e7c) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e7.html` |
| Lot 2 · Tâches | E8 | Droits des agents | [E8a](lots/taches.md#e8a) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e8.html` |
| Lot 2 · Tâches | E13 | Détail d'une tâche | [E13a](lots/taches.md#e13a), [E13b](lots/taches.md#e13b), [E13c](lots/taches.md#e13c) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e13.html` |
| Lot 3 · Contexte et isolation | E9 | Contexte transmis aux agents | [E9a](lots/contexte.md#e9a), [E9b](lots/contexte.md#e9b), [E9c](lots/contexte.md#e9c), [E9d](lots/contexte.md#e9d), [E9e](lots/contexte.md#e9e), [E9f](lots/contexte.md#e9f) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e9.html` |
| Lot 3 · Contexte et isolation | E10 | Intégrations | [E10a](lots/contexte.md#e10a), [E10b](lots/contexte.md#e10b) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e10.html` |
| Lot 3 · Contexte et isolation | E11 | Isolation du worker | [E11a](lots/contexte.md#e11a), [E11b](lots/contexte.md#e11b) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e11.html` |
| Lot 3 · Contexte et isolation | E12 | Environnement de test | [E12a](lots/contexte.md#e12a) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e12.html` |
| Lot 3 · Contexte et isolation | E14 | Socles | [E14a](lots/contexte.md#e14a), [E14b](lots/contexte.md#e14b) | À développer | [specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e14.html` |

## Identifiants

- **RF-…** règles fonctionnelles, **CA-…** critères d'acceptation, **NF-…** exigences non fonctionnelles, **DT-…** décisions techniques.
- Un identifiant ne change jamais de sens et n'est jamais réutilisé : un critère abandonné reste, barré et marqué « Retiré ».
- Un test cite le critère qu'il vérifie dans son nom (« CA-CONN-27 · refuse une clé d'API »). La couverture se mesure avec `trace.mjs` du skill `requirements-doc` : `node <skill>/scripts/trace.mjs docs/requirements`.
- Les décisions **DT-…** viennent du cahier des charges. Une décision prise pendant les développements (ADR de l'équipe, hors de ce dossier) qui en remplace une se reporte dans le cahier des charges, qui marque la DT « Remplacée ».
- Ces fichiers ne se modifient pas ici. Un écart entre le code et ces exigences se reporte dans les specs ou le cahier des charges, puis l'export suivant met ce dossier à jour.
