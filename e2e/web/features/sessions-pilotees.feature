# language: fr
@RF-SESS-04
Fonctionnalité: Sessions pilotées par Bosco
  En tant que développeur, je veux démarrer une session et lui écrire depuis Bosco, sur le poste ou le téléphone, afin
  de travailler avec un agent sans ouvrir de terminal.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-labo-ia-bosco.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude-perso » a accès à l’abonnement Claude de « camille@exemple.dev »
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-SESS-91
  @CA-SESS-92
  Scénario: Une session démarre depuis la vue d'ensemble, puis répond à chaque message
    Quand j'ouvre la page « / »
    Et je clique sur le lien « Nouvelle session »
    Alors je vois le titre « Nouvelle session »
    Et la page est accessible
    Quand je saisis « Lis le lexique » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « Reçu : Lis le lexique · mode default · modèle défaut · effort défaut · images 0 »
    Et je vois le texte « Pilotée dans Bosco depuis »
    Et la page est accessible
    Quand je saisis « Et les tests » dans le champ « Message à l’agent »
    Et je clique sur le bouton « Envoyer »
    Alors je vois le texte « Reçu : Et les tests · mode default · modèle défaut · effort défaut · images 0 »

  @CA-SESS-96
  Scénario: Une question de l'agent se répond dans Bosco
    Quand j'ouvre la page « /sessions/new »
    Et je saisis « Pose une question » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « L’agent te pose une question »
    Et la page est accessible
    Quand je clique sur le bouton radio « Corriger les entrées du lexique »
    Et je clique sur le bouton « Répondre »
    Alors je vois le texte « Réponse reçue : Corriger les entrées du lexique »

  @CA-SESS-97
  Scénario: Une session close reprend dans Bosco quand on lui écrit
    Quand j'ouvre la page « /sessions/c41e9a07 »
    Alors je vois le texte « Session close · ton message la reprend dans Bosco, sur ce poste »
    Quand je saisis « Reprends » dans le champ « Message à l’agent »
    Et je clique sur le bouton « Envoyer »
    Alors je vois le texte « Reçu : Reprends · mode default · modèle défaut · effort défaut · images 0 »

  @CA-SESS-98
  Scénario: Une session ouverte dans un terminal se répond dans son terminal
    Étant donné la session « c41e9a07 » est ouverte dans Claude Code
    Quand j'ouvre la page « /sessions/c41e9a07 »
    Alors je vois le texte « Ouverte dans un terminal · réponds-y là-bas. »
    Et je ne vois pas le bouton « Envoyer »
