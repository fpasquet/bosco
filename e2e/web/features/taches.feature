# language: fr
@RF-TACH-01
@RF-TACH-03
Fonctionnalité: Tâches
  En tant que développeur, je veux préparer du travail pour Claude Code, avec ses préalables et ses garde-fous, afin
  qu'il parte quand il le peut, dans les limites de son dépôt.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-labo-ia-rag.jsonl » de la session « 5e0a91c3 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-TACH-01
  @CA-TACH-19
  @NF-18
  Scénario: La première tâche se prépare depuis la file vide
    Quand j'ouvre la page « /tasks »
    Alors je vois le titre « Prépare du travail pour Claude Code »
    Et la page est accessible
    Quand je clique sur le lien « Nouvelle tâche »
    Et je saisis « Ajoute un test du découpage des tableaux. » dans le champ « Consigne »
    Et je clique sur le bouton « Créer la tâche »
    Alors je suis sur la page « /tasks »
    Et je vois le lien « T-1 Ajoute un test du découpage des tableaux »

  @CA-TACH-27
  @CA-TACH-30
  @NF-18
  Scénario: Un budget au-dessus du plafond du dépôt est refusé avec ses issues
    Quand j'ouvre la page « /tasks/new »
    Et je saisis « Supprime les anciens index. » dans le champ « Consigne »
    Et je saisis « 3 » dans le champ « Budget ($) »
    Et je clique sur le bouton « Créer la tâche »
    Alors je vois le texte « 1 point à corriger »
    Et la page est accessible

  @CA-TACH-08
  @RF-TACH-07
  Scénario: Annuler une tâche attendue demande confirmation et fait échouer la suite
    Étant donné une tâche du worker « Ajoute un test du découpage. » existe dans le dépôt « labo-ia »
    Et une tâche du worker « Documente le découpage. » attend la tâche 1 dans le dépôt « labo-ia »
    Quand j'ouvre la page « /tasks/2 »
    Alors je vois le texte « Partira de la branche de T-1. »
    Quand j'ouvre la page « /tasks/1 »
    Et je clique sur le bouton « Annuler la tâche »
    Alors je vois le texte « Annuler cette tâche fera échouer 1 tâche »
    Quand je clique sur le bouton « Annuler la tâche » de la confirmation
    Alors je ne vois pas le bouton « Annuler la tâche »
    Quand j'ouvre la page « /tasks/2 »
    Alors je vois le message « Préalable T-1 annulée »
