# language: fr
@RF-SESS-07
Fonctionnalité: Accès depuis le téléphone
  En tant que développeur, je veux appairer mon téléphone sur le réseau local avec un code court, afin de répondre
  depuis le téléphone à une session qui m'attend, sans que personne d'autre ne le puisse.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-labo-ia-rag.jsonl » de la session « 5e0a91c3 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-SESS-60
  @CA-SESS-66
  @CA-SESS-69
  @NF-18
  Scénario: Activer l'accès montre l'adresse et un code, et Annuler ferme la fenêtre
    Quand j'ouvre la page « /sources »
    Alors je vois le texte « Désactivé : aucun accès en dehors de ce poste. »
    Quand je clique sur le bouton « Activer et appairer un téléphone »
    Alors je vois le texte « à usage unique »
    Et je vois le texte « Accepte l’avertissement du navigateur »
    Et la page est accessible
    Quand je clique sur le bouton « Annuler » de la fenêtre
    Alors je ne vois plus le texte « à usage unique »

  @CA-SESS-68
  Scénario: Le téléphone s'appaire avec le code puis accède à Bosco
    Étant donné l’accès depuis le téléphone est activé avec un code affiché sur le poste
    Quand le téléphone ouvre l’adresse du poste
    Alors le téléphone voit le titre « Appairer ce téléphone »
    Quand le téléphone saisit le code
    Alors le téléphone voit la page « / »
