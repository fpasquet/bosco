# language: fr
@RF-SESS-04
Fonctionnalité: Sessions pilotées par Bosco
  En tant que développeur, je veux démarrer une session et lui écrire depuis Bosco, sur le poste ou le téléphone, afin
  de travailler avec un agent sans ouvrir de terminal.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-maison-budget.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude-perso » a accès à l’abonnement Claude de « camille@exemple.dev »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et le dossier « maison » est un projet

  @CA-SESS-92
  @CA-SESS-155
  Scénario: Une session démarre depuis la vue d'ensemble, puis répond à chaque message
    Quand j'ouvre la page « / »
    Et je clique sur le lien « Nouvelle session »
    Alors je vois le titre « Nouvelle session »
    Et la page est accessible
    Quand je saisis « Lis les catégories du budget » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « Reçu : Lis les catégories du budget · mode default · modèle défaut · effort défaut · images 0 »
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
    Et le bouton radio « Arrondir à la minute à la lecture Recommandé » est coché
    Et je vois l’étiquette « Recommandé »
    Et je ne vois plus le texte « (Recommended) »
    Et la page est accessible
    Quand je clique sur le bouton radio « Corriger les grilles de tarifs »
    Et je clique sur le bouton « Répondre »
    Alors je vois le texte « Réponse reçue : Corriger les grilles de tarifs »

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

  @CA-SESS-195
  @CA-SESS-196
  Scénario: Une session choisit sa branche ou son worktree, la branche active par défaut
    Quand j'ouvre la page « /sessions/new »
    Alors la liste « Branche ou worktree » vaut « main · branche active »
    Quand je choisis « develop · branche » dans la liste « Branche ou worktree »
    Alors je vois le texte « Bosco crée un worktree pour develop dans .claude/worktrees du projet : ton dossier garde sa branche. »
    Quand je choisis « feat/tarifs · worktree » dans la liste « Branche ou worktree »
    Alors je vois le texte « Dans le dossier de ce worktree : le dossier du projet garde sa branche. »
    Et je vois le texte « Sur ce poste, sur le worktree feat/tarifs, comme dans un terminal. »
    Et la page est accessible
    Quand je saisis « Lis les catégories du budget » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « Reçu : Lis les catégories du budget · mode default · modèle défaut · effort défaut · images 0 »
