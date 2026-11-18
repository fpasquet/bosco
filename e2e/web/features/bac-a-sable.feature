# language: fr
@RF-SESS-12
Fonctionnalité: Sessions en bac à sable
  En tant que développeur, je veux faire tourner une session pilotée dans un bac à sable, isolé de mon poste, afin
  que l'agent travaille sur une copie du projet et sa propre branche, que je récupère quand je veux.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-maison-budget.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude-perso » a accès à l’abonnement Claude de « camille@exemple.dev »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et le dossier « maison » est un projet

  @NF-18
  @CA-SESS-161
  Scénario: Une session démarre dans un bac à sable et se pilote comme les autres
    Quand j'ouvre la page « /sessions/new »
    Et je clique sur le bouton radio « Bac à sable »
    Alors je vois le texte « Rien d’autre du poste : ni fichiers, ni accès, ni autres projets »
    Et la page est accessible
    Quand je saisis « Monte TypeScript en version 6 » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « Reçu : Monte TypeScript en version 6 · mode acceptEdits · modèle défaut · effort défaut · images 0 »
    Et je vois le texte « S’arrête à »
    Et je vois le texte « Elle ne se reprend que dans Bosco »
    Et la page est accessible

  @CA-SESS-113
  @RF-CONT-13
  Scénario: Le détail d'une session en bac à sable montre son bac à sable, sa consommation et sa branche
    Quand j'ouvre la page « /sessions/new »
    Et je clique sur le bouton radio « Bac à sable »
    Et je saisis « Monte TypeScript en version 6 » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Et je vois le texte « Reçu : Monte TypeScript en version 6 · mode acceptEdits · modèle défaut · effort défaut · images 0 »
    Alors le titre de la page porte « Bac à sable »
    Et le titre de la page porte « Monte TypeScript en version 6 »
    Et je vois l’étiquette « Démarré »
    Et je vois le texte « 0,0 / 2 cœurs »
    Et je vois le texte « 1,3 / 4 Go »
    Et je vois le texte « S’arrête à »
    Et je vois le texte « Aucun fichier modifié par l’agent »
    Et je ne vois plus le texte « Reprendre dans un terminal »
    Et je vois le texte « 1 bac à sable »

  @mobile
  @CA-SESS-113
  @NF-18
  Scénario: Sur le téléphone, le bac à sable d'une session a son onglet, et l'aide reste sous la zone de message
    Quand j'ouvre la page « /sessions/new »
    Et je clique sur le bouton radio « Bac à sable »
    Et je saisis « Monte TypeScript en version 6 » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Et je vois le texte « Reçu : Monte TypeScript en version 6 · mode acceptEdits · modèle défaut · effort défaut · images 0 »
    Alors je vois le texte « pour envoyer »
    Quand je clique sur l’onglet « Bac à sable »
    Alors je vois l’étiquette « Démarré »
    Et je vois le texte « 1,3 / 4 Go »
    Et je vois le bouton « Arrêter le bac à sable »
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

  @CA-SESS-108
  Scénario: « Ajouter à la liste » remplit le domaine refusé dans les domaines du projet de la session
    Quand j'ouvre la page « /sessions/new »
    Et je clique sur le bouton radio « Bac à sable »
    Et je saisis « Monte TypeScript en version 6 » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Et je clique sur le bouton « Ajouter à la liste : raw.githubusercontent.com »
    Alors je vois l’élément de menu « À la liste générale »
    Quand je clique sur l’élément de menu « Aux domaines de maison »
    Alors je suis sur la page « /projects/1/settings »
    Et le champ « Ajouter un domaine » vaut « raw.githubusercontent.com »
    Quand je clique sur le bouton « Ajouter le domaine »
    Alors je vois le bouton « Retirer raw.githubusercontent.com »

  @CA-SESS-108
  Scénario: « Ajouter à la liste » peut aussi remplir le domaine refusé dans la liste générale
    Quand j'ouvre la page « /sessions/new »
    Et je clique sur le bouton radio « Bac à sable »
    Et je saisis « Monte TypeScript en version 6 » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Et je clique sur le bouton « Ajouter à la liste : raw.githubusercontent.com »
    Et je clique sur l’élément de menu « À la liste générale »
    Alors je suis sur la page « /settings/sandbox »
    Et le champ « Ajouter un domaine » vaut « raw.githubusercontent.com »

  @CA-REGL-15
  Scénario: La source « Bacs à sable » est tenue par Bosco, sans interrupteur ni suivi en direct
    Quand j'ouvre la page « /sessions/new »
    Et je clique sur le bouton radio « Bac à sable »
    Et je saisis « Monte TypeScript en version 6 » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Et je vois le texte « Reçu : Monte TypeScript en version 6 · mode acceptEdits · modèle défaut · effort défaut · images 0 »
    Et j'ouvre la page « /settings/sources »
    Alors je vois l’étiquette « Tenue par Bosco »
    Et je vois le texte « Piloté par Bosco »
    Et je vois le texte « 1 bac à sable · dernier tour à »
    Et je ne vois pas l’interrupteur « Lire le profil Bacs à sable »
    Et l’interrupteur « Lire le profil perso » est « activé »

  @RF-SESS-12
  Scénario: La marque « Bac à sable » suit la session dans la vue d'ensemble et l'historique
    Quand j'ouvre la page « /sessions/new »
    Et je clique sur le bouton radio « Bac à sable »
    Et je saisis « Monte TypeScript en version 6 » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Et je vois le texte « Reçu : Monte TypeScript en version 6 · mode acceptEdits · modèle défaut · effort défaut · images 0 »
    Et j'ouvre la page « / »
    Alors le tableau des sessions montre « Bac à sable »
    Quand j'ouvre la page « /history »
    Alors je vois l’étiquette « Bac à sable »
