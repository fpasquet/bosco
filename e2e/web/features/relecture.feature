# language: fr
@RF-TACH-06
@RF-TACH-10
Fonctionnalité: Relecture d'une tâche
  En tant que développeur, je veux lire tout ce qu'un agent a fait avant de valider sa tâche, comme pour une session,
  afin que seul un travail relu continue, en PR brouillon si je le veux, et de pouvoir lui demander une correction.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-labo-ia-rag.jsonl » de la session « 5e0a91c3 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et une tâche du worker « Ajoute un test du découpage des tableaux. » existe dans le dépôt « labo-ia »
    Et la tâche 1 est à relire

  @NF-18
  @CA-TACH-86
  @CA-TACH-87
  Scénario: La revue montre le fil de l'agent, son compte rendu, puis le diff de sa branche
    Quand j'ouvre la page « /tasks/1 »
    Alors je vois le texte « Consigne de la tâche »
    Et je vois le titre « Compte rendu de l’agent »
    Et la page est accessible
    Quand je clique sur l'onglet « Modifications »
    Alors la liste « Fichiers modifiés » contient « lexique/sigles.json »

  @CA-TACH-89
  Scénario: Un message à l'agent le fait reprendre sur la même branche
    Quand j'ouvre la page « /tasks/1 »
    Et je saisis « Ajoute aussi un tableau vide. » dans le champ « Message à l’agent »
    Et je clique sur le bouton « Envoyer »
    Alors je vois le texte « Fait : Ajoute aussi un tableau vide. »

  @CA-TACH-91
  Scénario: Le rejet abandonne la tâche, avec un motif obligatoire
    Quand j'ouvre la page « /tasks/1 »
    Et je clique sur le bouton « Rejeter »
    Alors le bouton « Rejeter T-1 » est désactivé
    Quand je saisis « Hors sujet. » dans le champ « Motif (obligatoire) »
    Et je clique sur le bouton « Rejeter T-1 » de la fenêtre
    Alors je ne vois pas le bouton « Valider »
    Et je vois le message « Hors sujet. »

  @CA-TACH-91
  Scénario: Plutôt que rejeter, on écrit à l'agent depuis la fenêtre de rejet
    Quand j'ouvre la page « /tasks/1 »
    Et je clique sur le bouton « Rejeter »
    Et je clique sur le bouton « Écrire à l’agent » de la fenêtre
    Alors le champ « Message à l’agent » a le focus

  @NF-18
  Scénario: Le dépôt demande une PR : la validation la propose et l'ouvre en brouillon
    Étant donné le dépôt « labo-ia » demande une PR à chaque validation
    Quand j'ouvre la page « /tasks/1 »
    Alors je vois le titre « Compte rendu de l’agent »
    Et la page est accessible
    Quand je clique sur le bouton « Valider »
    Alors je vois le titre « Valider T-1 »
    Quand je clique sur le bouton « Valider et ouvrir la PR »
    Alors je vois le lien « https://github.com/exemple/depot/pull/50 »

  @CA-TACH-95
  Scénario: La session de l'agent mène à l'écran de sa tâche
    Quand j'ouvre la page « /sessions/scripted-1 »
    Alors je suis sur la page « /tasks/1 »
