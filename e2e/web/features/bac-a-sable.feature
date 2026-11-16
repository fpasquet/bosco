# language: fr
@RF-SESS-12
Fonctionnalité: Sessions en bac à sable
  En tant que développeur, je veux faire tourner une session pilotée dans un bac à sable, isolé de mon poste, afin
  que l'agent travaille sur une copie du dépôt et sa propre branche, que je récupère quand je veux.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-labo-ia-bosco.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude-perso » a accès à l’abonnement Claude de « camille@exemple.dev »
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @NF-18
  @CA-SESS-106
  @CA-SESS-113
  Scénario: Une session démarre dans un bac à sable et se pilote comme les autres
    Quand j'ouvre la page « /sessions/new »
    Et je clique sur le bouton radio « Bac à sable »
    Alors je vois le texte « Rien d’autre du poste : ni fichiers, ni accès, ni autres dépôts »
    Et la page est accessible
    Quand je saisis « Monte TypeScript en version 6 » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « Reçu : Monte TypeScript en version 6 · mode acceptEdits · modèle défaut · effort défaut · images 0 »
    Et je vois le texte « S’arrête à »
    Et je vois le texte « Elle ne se reprend que dans Bosco »
    Et la page est accessible

  @CA-SESS-108
  @CA-SESS-112
  Scénario: Les sorties refusées se lisent dans le fil, et la branche se récupère
    Quand j'ouvre la page « /sessions/new »
    Et je clique sur le bouton radio « Bac à sable »
    Et je saisis « Monte TypeScript en version 6 » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « raw.githubusercontent.com »
    Quand je clique sur le bouton « Récupérer la branche »
    Alors je vois le texte « Branche récupérée : bosco/s-monte-typescript-en-version-6 »
