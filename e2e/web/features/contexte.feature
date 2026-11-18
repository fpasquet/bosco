# language: fr
@RF-CONT-01
@RF-CONT-02
Fonctionnalité: Contexte des agents
  En tant que développeur, je veux décider de ce que reçoit chaque agent d'un projet, afin qu'il travaille dans ce qui a
  été décidé, et qu'un agent ne fasse que proposer.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-maison-rag.jsonl » de la session « 5e0a91c3 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et les dossiers « maison » et « site-perso » sont des projets

  @CA-CONT-03
  @CA-CONT-06
  @CA-CONT-164
  @CA-CONT-165
  @NF-18
  Scénario: Une décision proposée par une session attend dans l'onglet Contexte du projet, puis le rejoint une fois acceptée
    Étant donné une session a proposé la décision « Normaliser les sigles » dans le projet « maison »
    Quand j'ouvre la page « /projects/1/context »
    Alors le fil d’Ariane est « Projets › maison › Contexte »
    Et l’entrée « maison » de la barre latérale est active
    Et je vois le texte « 1 décision proposée par un agent attend ta validation »
    Et la page est accessible
    Quand je clique sur le lien « Examiner DEC-1 »
    Alors le fil d’Ariane est « Projets › maison › DEC-1 »
    Et je vois le texte « Proposée par une session »
    Et la page est accessible
    Quand je clique sur le bouton « Accepter »
    Alors je suis sur la page « /projects/1/context »
    Et je vois le lien « DEC-1 Normaliser les sigles »
    Et je ne vois plus le texte « 1 décision proposée par un agent attend ta validation »

  @CA-CONT-12
  @CA-CONT-14
  @NF-18
  Scénario: Une nouvelle décision exige un titre, un contexte et une décision
    Quand j'ouvre la page « /projects/1/context/decisions/new »
    Et je clique sur le bouton « Accepter la décision »
    Alors je vois le texte « Donne un titre à la décision. »
    Et la page est accessible
    Quand je saisis « Découper les tableaux par ligne » dans le champ « Titre »
    Et je saisis « Les tableaux des PDF arrivent fusionnés. » dans le champ « Contexte »
    Et je saisis « Découper chaque tableau par ligne. » dans le champ « Décision »
    Et je clique sur le bouton « Accepter la décision »
    Alors je vois le lien « DEC-1 Découper les tableaux par ligne »

  @CA-CONT-20
  @CA-CONT-21
  @CA-CONT-22
  Scénario: Une décision acceptée change avec une note et garde sa version précédente
    Étant donné le projet « maison » a la décision acceptée « Garder Jest pour les tests »
    Quand j'ouvre la page « /projects/1/context/decisions/1/edit »
    Et je saisis « Garder Jest pour les tests existants » dans le champ « Titre »
    Alors je vois le texte « Changé : Garder Jest pour les tests existants »
    Et la page est accessible
    Quand je clique sur le bouton « Enregistrer la version 2 »
    Alors je vois le texte « Écris une note pour dire ce qui change. »
    Quand je saisis « Les nouveaux tests aussi » dans le champ « Note du changement (obligatoire) »
    Et je clique sur le bouton « Enregistrer la version 2 »
    Alors je suis sur la page « /projects/1/context/decisions/1 »
    Et je vois le texte « Les nouveaux tests aussi »
    Et je vois le texte « Version 1 »

  @CA-CONT-01
  @CA-CONT-05
  @CA-CONT-100
  @NF-18
  Scénario: Les instructions des groupes du projet se lisent dans son contexte et s'écrivent dans le groupe
    Étant donné le groupe « Tous les projets » a l’instruction « Node 22 au minimum. »
    Et le groupe « Perso » réunit le projet « maison »
    Et le groupe « Perso » a l’instruction « Aucun service payant ni de télémétrie. »
    Et le projet « maison » a la décision acceptée « Garder Jest pour les tests »
    Quand j'ouvre la page « /projects/1/context »
    Alors la liste « Tous les projets » contient « Node 22 au minimum. »
    Et la liste « Perso » contient « Aucun service payant ni de télémétrie. »
    Et je vois le texte « elles l’emportent sur les instructions des groupes »
    Et la page est accessible
    Quand je clique sur le lien « Modifier les instructions de Perso »
    Alors je suis sur la page « /groups/2/instructions »

  @CA-CONT-164
  Scénario: L'ancienne adresse du contexte d'un projet mène à l'onglet Contexte de sa page
    Quand j'ouvre la page « /context?project=maison »
    Alors je suis sur la page « /projects/1/context »

  @CA-CONT-11
  @CA-CONT-87
  @CA-CONT-102
  @NF-18
  Scénario: Sans décision, la première s'écrit depuis le contexte du projet, pour un projet choisi parmi tous
    Quand j'ouvre la page « /projects/2/context »
    Alors je vois le texte « Aucune décision pour site-perso : elles arrivent proposées par un agent, ou écrites ici. »
    Et la page est accessible
    Quand je clique sur le lien « Nouvelle décision »
    Alors la liste « Porte sur » vaut « site-perso »
    Quand je choisis « maison » dans la liste « Porte sur »
    Alors je suis sur la page « /projects/1/context/decisions/new »
    Et la liste « Porte sur » vaut « maison »
    Quand je saisis « Garder les fichiers audio 30 jours en cache » dans le champ « Titre »
    Et je saisis « Générer un même article plusieurs fois coûte cher. » dans le champ « Contexte »
    Et je saisis « Garder chaque fichier audio 30 jours. » dans le champ « Décision »
    Et je clique sur le bouton « Accepter la décision »
    Alors je suis sur la page « /projects/1/context »
    Et je vois le lien « DEC-1 Garder les fichiers audio 30 jours en cache »

  @mobile
  @CA-CONT-19
  @NF-18
  Scénario: Sur le téléphone, une décision proposée s'accepte, une décision acceptée se lit seulement
    Étant donné une session a proposé la décision « Normaliser les sigles » dans le projet « maison »
    Quand j'ouvre la page « /projects/1/context/decisions/1 »
    Et je clique sur le bouton « Accepter »
    Alors je suis sur la page « /projects/1/context »
    Quand j'ouvre la page « /projects/1/context/decisions/1 »
    Alors je vois le texte « Modifier, remplacer ou abandonner une décision se fait depuis le poste. »
    Et la page est accessible

  @CA-CONT-10
  Scénario: Une décision proposée arrive en notification et nomme la session de son agent, avec un lien vers elle
    Quand j'ouvre la page « / »
    Et la session du dossier « maison/packages/recettes » propose la décision « Normaliser les sigles »
    Et je clique sur le bouton « Notifications : 1 non lues »
    Alors le tiroir des notifications montre « Décision proposée »
    Quand je clique sur le bouton « Normaliser les sigles » du tiroir
    Alors je vois le texte « Proposée par l’agent de la session »
    Quand je clique sur le lien « Corriger l’indexation des PDF dans Elasticsearch » de la page
    Alors je suis sur la page « /sessions/5e0a91c3 »
