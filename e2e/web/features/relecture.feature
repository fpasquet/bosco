# language: fr
@RF-TACH-06
Fonctionnalité: Relecture d'une tâche
  En tant que développeur, je veux lire ce qu'un agent a changé avant de valider sa tâche, afin que seul un travail
  relu continue, en PR brouillon si je le veux, et qu'une tâche rejetée reparte avec mon motif.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-labo-ia-rag.jsonl » de la session « 5e0a91c3 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et une tâche du worker « Ajoute un test du découpage des tableaux. » existe dans le dépôt « labo-ia »
    Et la tâche 1 est à relire

  @NF-18
  Scénario: La revue montre la consigne, le compte rendu et le diff, puis la tâche se rejette pour de bon
    Quand j'ouvre la page « /tasks/1 »
    Alors je vois le texte « Compte rendu de l’agent »
    Et la liste « Fichiers modifiés » contient « lexique/sigles.json »
    Et la page est accessible
    Quand je clique sur le bouton « Rejeter »
    Alors le bouton « Rejeter et relancer » est désactivé
    Quand je saisis « Hors sujet. » dans le champ « Motif (obligatoire) »
    Et je décoche « Relancer la tâche avec ce motif comme consigne complémentaire »
    Et je clique sur le bouton « Rejeter » de la fenêtre
    Alors je ne vois pas le bouton « Valider »
    Et je vois le message « Hors sujet. »

  @NF-18
  Scénario: Le dépôt demande une PR : la validation la propose et l'ouvre en brouillon
    Étant donné le dépôt « labo-ia » demande une PR à chaque validation
    Quand j'ouvre la page « /tasks/1 »
    Alors je vois le texte « Compte rendu de l’agent »
    Et la page est accessible
    Quand je clique sur le bouton « Valider »
    Alors je vois le titre « Valider T-1 »
    Quand je clique sur le bouton « Valider et ouvrir la PR »
    Alors je vois le lien « https://github.com/exemple/depot/pull/50 »
