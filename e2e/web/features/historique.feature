# language: fr
@RF-SESS-05
@RF-SESS-10
Fonctionnalité: Historique et coûts
  En tant que développeur, je veux retrouver une session passée par un mot et voir ce que chaque jour a coûté, afin de
  savoir où part le budget.

  Contexte:
    Étant donné il est « 2026-11-06T15:10:00+01:00 » dans le navigateur
    Et le profil Claude Code « .claude » contient le transcript « session-labo-ia-rag.jsonl » de la session « 5e0a91c3 »
    Et le profil Claude Code « .claude-perso » contient le transcript « session-labo-ia-bosco.jsonl » de la session « c41e9a07 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-SESS-47
  @CA-SESS-49
  @NF-18
  Scénario: L'historique suit les jours, et la recherche porte sur les messages
    Quand j'ouvre la page « /history »
    Alors je vois le texte « 2 sessions »
    Et je vois le lien « Specs du tableau de bord Bosco »
    Et la page est accessible
    Quand je saisis « indexation » dans le champ « Rechercher dans les titres, messages et commandes »
    Alors je ne vois plus le texte « Specs du tableau de bord Bosco »
    Et je vois le lien « Corriger l’indexation des PDF dans Elasticsearch »

  @CA-SESS-52
  @CA-SESS-53
  @NF-18
  Scénario: Les coûts de la période sont des estimations, par jour et par dépôt
    Quand j'ouvre la page « /history?tab=costs »
    Alors je vois le texte « Total de la période »
    Et je vois le titre « Par dépôt »
    Et je vois le texte « Coût par jour »
    Et la page est accessible

  @CA-SESS-13
  Scénario: La vue filtrée sur un dépôt liste ses sessions terminées aujourd'hui
    Étant donné le suivi en direct est installé dans le profil « .claude-perso »
    Et la session « c41e9a07 » du profil « .claude-perso » se termine
    Quand j'ouvre la page « /?repo=labo-ia »
    Alors je vois le texte « Terminées aujourd’hui dans ce dépôt »
    Quand je clique sur le lien « Voir l’historique »
    Alors je suis sur la page « /history »
