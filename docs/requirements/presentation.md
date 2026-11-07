<!-- Généré par export.mjs (skill requirements-doc) depuis sources/10-presentation.md : ne pas modifier ici. -->

# <a id="1-presentation-du-projet"></a>1. Présentation du projet

## <a id="11-objet-du-document"></a>1.1 Objet du document

Ce document fixe ce qu'il faut construire, comment, et dans quel ordre. Il sert de référence à Claude Code pendant le développement et au développeur pour la recette. Les specs UI restent la référence des écrans : maquettes desktop et mobile, annotations, parcours. Ce document ne les remplace pas ; il en reprend les règles et y ajoute les critères d'acceptation et la partie technique.

## <a id="12-contexte-et-enjeux"></a>1.2 Contexte et enjeux

Plusieurs sessions Claude Code tournent en même temps sur le poste, dans plusieurs dépôts : deux profils interactifs (pro et perso) et des sessions sans terminal. Rien ne dit aujourd'hui laquelle attend une réponse, où en sont les autres, ni combien elles coûtent. Il faut passer d'un terminal à l'autre pour le savoir.

Bosco est un poste de pilotage local. Son nom vient du bosco, le maître d'équipage d'un navire, qui fait travailler l'équipage et rend compte au capitaine : ici, l'équipage, ce sont les sessions et le worker, et le capitaine, c'est le développeur. Il découvre les sessions sans rien leur demander, signale celles qui attendent, permet d'autoriser une commande sans changer de fenêtre, puis de confier du travail à Claude Code et de le relire avant toute fusion.

## <a id="13-objectifs"></a>1.3 Objectifs

| Objectif | Vérification |
|---|---|
| Une session ouverte sur le poste apparaît sans action de l'utilisateur | [E1b](lots/sessions.md#e1b), RF-SESS-01 |
| Une session qui attend se voit en moins de 3 secondes | NF-01 |
| Une autorisation se donne depuis Bosco ou depuis le terminal | [E2b](lots/sessions.md#e2b), RF-SESS-03 |
| Une tâche confiée au worker se termine par une relecture, sans fusion automatique | [E7a](lots/taches.md#e7a), RF-TACH-06 |
| Un agent du worker ne voit ni les autres dépôts ni les accès du poste | [E11a](lots/contexte.md#e11a), RF-CONT-06 |

## <a id="14-perimetre"></a>1.4 Périmètre

- **Inclus** : les trois lots des specs, sur Linux, pour un seul utilisateur sur son poste.
- **Exclus de cette version** : macOS, distribution aux équipes, partage entre postes, autres agents que Claude Code, tâches programmées, notifications sur le téléphone, accès au téléphone hors du réseau local.

## <a id="15-documents-de-reference"></a>1.5 Documents de référence

| Document | Lien | Date |
|---|---|---|
| Specs UI | [artifact](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) | 07/11/2026 |
| Document de cadrage | [artifact](https://claude.ai/artifact/5zNvQgowE6pa2zYRTJwh4J) | 07/11/2026 |

## <a id="16-glossaire"></a>1.6 Glossaire

| Terme | Définition |
|---|---|
| Session | Une conversation Claude Code, interactive ou lancée par le worker |
| Profil | Dossier de configuration Claude Code : pro, perso, ou worker |
| T'attend | État d'une session qui a demandé une autorisation ou terminé son tour |
| Suivi en direct | Réglages ajoutés à un profil pour que Claude Code prévienne Bosco |
| Tâche | Consigne préparée pour Claude Code, dans un dépôt, avec un mode |
| Worker | Partie de Bosco qui exécute les tâches sans terminal, dans un conteneur jetable |
| Ma session | Mode d'une tâche prise par une session interactive |
| Tâche préalable | Tâche qui doit être validée avant qu'une autre parte |
| Socle | Ensemble de décisions communes à plusieurs dépôts |
| Décision | Choix de projet transmis aux agents une fois accepté |
| Service de test | Base ou autre service lancé pour une tâche, sur un réseau privé |
