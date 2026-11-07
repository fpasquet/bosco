# language: fr
@RF-SESS-03
Fonctionnalité: Suivi en direct
  En tant que développeur, je veux savoir aussitôt qu'une session m'attend et lui répondre depuis Bosco ou depuis le
  terminal, afin de ne pas laisser un agent bloqué sur une autorisation.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-labo-ia-bosco.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude » contient le transcript « session-labo-ia-rag.jsonl » de la session « 5e0a91c3 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-SESS-62
  @CA-SESS-64
  @CA-SESS-65
  @NF-18
  Scénario: Le suivi en direct s'installe pas à pas et se vérifie sur un vrai signal
    Quand j'ouvre la page « /sources »
    Et je clique sur le bouton « Installer » de la source « perso »
    Et je clique sur le bouton « Suivant » de la fenêtre
    Alors je vois le texte « Garder une copie des réglages actuels »
    Et la page est accessible
    Quand je clique sur le bouton « Installer » de la fenêtre
    Alors je vois le texte « Ouvre une session Claude Code dans ce profil pour terminer la vérification »
    Quand la session « c41e9a07 » du profil « .claude-perso » donne un signal
    Alors je vois le texte « Le suivi en direct fonctionne pour perso »
    Quand je clique sur le lien « Terminer » de la fenêtre
    Alors je vois le titre « Vue d’ensemble »

  @CA-SESS-05
  @CA-SESS-06
  @NF-18
  Scénario: Les sessions qui t'attendent sont en tête, la plus ancienne d'abord
    Étant donné le suivi en direct est installé dans le profil « .claude-perso »
    Et la session « 5e0a91c3 » du profil « .claude-perso » termine son tour en disant « Veux-tu que je lance les tests ? »
    Et la session « c41e9a07 » du profil « .claude-perso » demande l’autorisation de lancer « npm run db:migrate »
    Quand j'ouvre la page « / »
    Alors je vois le texte « 2 sessions attendent ta réponse »
    Et le bandeau des sessions qui t’attendent montre « Veux-tu que je lance les tests ? »
    Et le bandeau des sessions qui t’attendent montre « npm run db:migrate »
    Et la page est accessible

  @CA-SESS-35
  @CA-SESS-36
  Scénario: Une autorisation donnée dans Bosco répond à Claude Code
    Étant donné le suivi en direct est installé dans le profil « .claude-perso »
    Et la session « c41e9a07 » du profil « .claude-perso » demande l’autorisation de lancer « npm run db:migrate »
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « Autoriser »
    Alors Claude Code reçoit la décision « allow »
    Et je vois le texte « Autorisé · Specs du tableau de bord Bosco »
    Et je ne vois plus le bandeau des sessions qui t’attendent

  @CA-SESS-07
  Scénario: Une autorisation donnée dans le terminal disparaît du bandeau
    Étant donné le suivi en direct est installé dans le profil « .claude-perso »
    Et la session « c41e9a07 » du profil « .claude-perso » demande l’autorisation de lancer « npm run db:migrate »
    Quand j'ouvre la page « / »
    Alors je vois le texte « 1 session attend ta réponse »
    Quand la personne répond dans le terminal
    Alors je vois le texte « Répondu dans le terminal · Specs du tableau de bord Bosco »
    Et je ne vois plus le bandeau des sessions qui t’attendent

  @mobile
  @CA-SESS-37
  Scénario: Sur téléphone, « Autoriser » demande une confirmation rappelant la commande
    Étant donné le suivi en direct est installé dans le profil « .claude-perso »
    Et la session « c41e9a07 » du profil « .claude-perso » demande l’autorisation de lancer « npm run db:migrate »
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « Autoriser »
    Alors je vois le titre « Autoriser la commande »
    Quand je clique sur le bouton « Autoriser » de la fenêtre
    Alors Claude Code reçoit la décision « allow »
