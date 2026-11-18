# language: fr
@RF-SESS-03
@RF-SESS-09
Fonctionnalité: Détail d'une session
  En tant que développeur, je veux suivre le fil d'une session sans retourner dans son terminal, et lui répondre quand
  elle m'attend, afin de garder un œil sur plusieurs agents à la fois.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-maison-budget.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude » contient le transcript « session-maison-recettes.jsonl » de la session « 5e0a91c3 »
    Et la session « 5e0a91c3 » a agi il y a quelques secondes
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et le suivi en direct est installé dans le profil « .claude-perso »

  @CA-SESS-27
  @CA-SESS-30
  @NF-18
  Scénario: Le fil d'une session en cours se met à jour sans recharger
    Quand j'ouvre la page « / »
    Et je clique sur le lien « Corriger la recherche des recettes par ingrédient »
    Alors je vois le titre « Corriger la recherche des recettes par ingrédient »
    Et je vois le texte « Corrige la recherche des recettes par ingrédient. »
    Et je vois le texte « La commande de reprise apparaît quand la session est close. »
    Et je ne vois pas le bouton « Copier la reprise »
    Et la page est accessible
    Quand la session « 5e0a91c3 » lance la commande « yarn lint »
    Alors je vois le texte « Lance yarn lint »

  Scénario: Une session close donne sa commande de reprise, avec le dossier du profil perso
    Étant donné la session « c41e9a07 » du profil « .claude-perso » se termine
    Quand j'ouvre la page « /sessions/c41e9a07 »
    Alors je vois le texte « claude --resume c41e9a07 »
    Et je vois le texte « CLAUDE_CONFIG_DIR= »

  @CA-SESS-31
  @CA-SESS-34
  @NF-18
  Scénario: Le fil s'arrête sur la carte d'autorisation, où un refus porte son motif
    Étant donné la session « c41e9a07 » du profil « .claude-perso » demande l’autorisation de lancer « npm run db:migrate »
    Quand j'ouvre la page « / »
    Et je clique sur le lien « Refuser »
    Alors je vois le texte « $ npm run db:migrate »
    Et la page est accessible
    Quand je saisis « Utilise la base de test docker. » dans le champ « Motif du refus (facultatif, transmis à l’agent) »
    Et je clique sur le bouton « Refuser »
    Alors Claude Code reçoit le refus avec le motif « La personne a refusé cette commande depuis Bosco. Motif : Utilise la base de test docker. »

  @CA-SESS-33
  Scénario: Une autorisation donnée dans le terminal est indiquée sur la carte
    Étant donné la session « c41e9a07 » du profil « .claude-perso » demande l’autorisation de lancer « npm run db:migrate »
    Quand j'ouvre la page « /sessions/c41e9a07 »
    Alors je vois le texte « $ npm run db:migrate »
    Quand la personne répond dans le terminal
    Alors je vois le texte « Répondu ailleurs à »
    Et je ne vois pas le bouton « Autoriser »

  @CA-SESS-36
  Scénario: Après une réponse, la vue d'ensemble revient s'il reste d'autres sessions en attente
    Étant donné la session « 5e0a91c3 » du profil « .claude-perso » termine son tour en disant « Veux-tu que je lance les tests ? »
    Et la session « c41e9a07 » du profil « .claude-perso » demande l’autorisation de lancer « npm run db:migrate »
    Quand j'ouvre la page « /sessions/c41e9a07 »
    Et je clique sur le bouton « Autoriser »
    Alors Claude Code reçoit la décision « allow »
    Et je suis sur la page « / »
    Et je vois le texte « Autorisé · Ajouter les catégories au budget du foyer »

  @CA-SESS-73
  Scénario: Le fil montre les réflexions, les commandes, les sous-agents, le plan et les sources de l'agent
    Étant donné le profil Claude Code « .claude » contient le transcript « session-maison-import.jsonl » de la session « 7b2e5d10 »
    Quand j'ouvre la page « /sessions/7b2e5d10 »
    Alors je vois le titre « Import des ingrédients »
    Et je vois le texte « A réfléchi »
    Quand je déplie l'étape « 2 commandes, 1 mise à jour du plan »
    Alors je vois le texte « Vérifie le lint du paquet recettes »
    Quand je déplie l'étape « Lance toute la suite de tests : échec · 2 tests, 1 en échec »
    Alors je vois le texte « Tests 1 failed | 1 passed (2) »
    Et je vois le texte « 1 à faire »
    Quand je déplie l'étape « 2 sources »
    Alors je vois le lien « recipe-ingredient-parser »
    Et la page est accessible
    Quand je déplie l'étape « Sous-agent · Chercher les recettes de test »
    Alors je vois le texte « Trouve les recettes de démonstration qui ont une quantité sur deux lignes. »
    Et je vois le texte « Deux recettes ont une quantité sur deux lignes »
    Et la page est accessible

  @CA-SESS-51
  @CA-SESS-97
  Scénario: Une session effacée par Claude Code se lit encore, sans se reprendre
    Étant donné la session « c41e9a07 » du profil « .claude-perso » se termine
    Et Claude Code a effacé le transcript de la session « c41e9a07 »
    Quand j'ouvre la page « /sessions/c41e9a07 »
    Alors je vois le texte « Effacée par Claude Code : elle ne se reprend plus. »
    Et je ne vois plus le texte « claude --resume c41e9a07 »
    Et je ne vois pas le bouton « Envoyer »
