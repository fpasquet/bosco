# language: fr
@RF-CONT-01
@RF-CONT-02
Fonctionnalité: Contexte des agents
  En tant que développeur, je veux décider de ce que reçoit chaque agent d'un dépôt, afin qu'il travaille dans ce qui a
  été décidé, et qu'un agent ne fasse que proposer.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-labo-ia-rag.jsonl » de la session « 5e0a91c3 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-CONT-03
  @CA-CONT-06
  @NF-18
  Scénario: Une décision proposée par une session attend, puis rejoint le contexte une fois acceptée
    Étant donné une session a proposé la décision « Normaliser les sigles » dans le dépôt « labo-ia »
    Quand j'ouvre la page « /context?repository=labo-ia »
    Alors je vois le texte « 1 décision proposée par un agent attend ta validation »
    Et la page est accessible
    Quand je clique sur le lien « Examiner DEC-1 »
    Alors je vois le texte « Proposée par une session »
    Et la page est accessible
    Quand je clique sur le bouton « Accepter »
    Alors je suis sur la page « /context »
    Et je vois le lien « DEC-1 Normaliser les sigles »
    Et je ne vois plus le texte « 1 décision proposée par un agent attend ta validation »

  @CA-CONT-12
  @CA-CONT-14
  @NF-18
  Scénario: Une nouvelle décision exige un titre, un contexte et une décision
    Quand j'ouvre la page « /context/decisions/new?repository=labo-ia »
    Et je clique sur le bouton « Accepter la décision »
    Alors je vois le texte « Donne un titre à la décision. »
    Et la page est accessible
    Quand je saisis « Découper les tableaux par ligne » dans le champ « Titre »
    Et je saisis « Les tableaux des PDF arrivent fusionnés. » dans le champ « Contexte »
    Et je saisis « Découper chaque tableau par ligne. » dans le champ « Décision »
    Et je clique sur le bouton « Accepter la décision »
    Alors je vois le lien « DEC-1 Découper les tableaux par ligne »

  @CA-CONT-21
  @CA-CONT-22
  Scénario: Une décision acceptée change avec une note et garde sa version précédente
    Étant donné le dépôt « labo-ia » a la décision acceptée « Garder Jest pour les tests »
    Quand j'ouvre la page « /context/decisions/1/edit »
    Et je saisis « Garder Jest pour les tests existants » dans le champ « Titre »
    Et je clique sur le bouton « Enregistrer la version 2 »
    Alors je vois le texte « Écris une note pour dire ce qui change. »
    Quand je saisis « Les nouveaux tests aussi » dans le champ « Note du changement (obligatoire) »
    Et je clique sur le bouton « Enregistrer la version 2 »
    Alors je suis sur la page « /context/decisions/1 »
    Et je vois le texte « Les nouveaux tests aussi »
    Et je vois le texte « Version 1 »

  @CA-CONT-55
  @NF-18
  Scénario: Un socle partagé se crée pour les dépôts cochés
    Quand j'ouvre la page « /context/socles/new »
    Et je saisis « Socle Node.js » dans le champ « Nom »
    Et je coche « labo-ia »
    Et je clique sur le bouton « Créer le socle »
    Alors je suis sur la page « /context/socles »
    Et je vois le titre « Socle Node.js partagé »
    Et la page est accessible

  @CA-CONT-58
  @CA-CONT-65
  @NF-18
  Scénario: Un socle se modifie, après une confirmation qui compte les dépôts concernés
    Quand j'ouvre la page « /context/socles/new »
    Et je saisis « Socle Node.js » dans le champ « Nom »
    Et je clique sur le bouton « Créer le socle »
    Et je clique sur le lien « Modifier le socle Socle Node.js »
    Et je coche « labo-ia »
    Et je clique sur le bouton « Enregistrer »
    Alors je vois le texte « Ce changement touche les prochains agents de 1 dépôt. »
    Et la page est accessible
    Quand je clique sur le bouton « Enregistrer » de la confirmation
    Alors je suis sur la page « /context/socles »
    Et la liste « Dépôts » contient « labo-ia »

  @CA-CONT-66
  Scénario: Une décision d'un socle acceptée d'emblée passe par la même confirmation
    Quand j'ouvre la page « /context/socles/new »
    Et je saisis « Socle Node.js » dans le champ « Nom »
    Et je coche « labo-ia »
    Et je clique sur le bouton « Créer le socle »
    Et je clique sur le lien « Nouvelle décision du socle Socle Node.js »
    Et je saisis « Tests avec Vitest » dans le champ « Titre »
    Et je saisis « Un seul outil de test. » dans le champ « Contexte »
    Et je saisis « Écrire les tests avec Vitest. » dans le champ « Décision »
    Et je clique sur le bouton « Accepter la décision »
    Alors je vois le texte « Ce changement touche les prochains agents de 1 dépôt. »
    Quand je clique sur le bouton « Enregistrer » de la confirmation
    Alors je suis sur la page « /context/socles »
    Et je vois le lien « Tests avec Vitest »

  @CA-CONT-86
  Scénario: Le choix du dépôt ne propose que les dépôts qui ont une décision
    Étant donné le profil Claude Code « .claude » contient le transcript « session-api-voix-fastify.jsonl » de la session « a41f07c2 »
    Et le dépôt « labo-ia » a la décision acceptée « Garder Jest pour les tests »
    Quand j'ouvre la page « /context »
    Alors le choix « Dépôt » propose « labo-ia »

  @CA-CONT-87
  @NF-18
  Scénario: Sans décision, la première s'écrit pour un dépôt choisi parmi les dépôts connus
    Étant donné le profil Claude Code « .claude » contient le transcript « session-api-voix-fastify.jsonl » de la session « a41f07c2 »
    Quand j'ouvre la page « /context »
    Alors je vois le texte « Aucun dépôt n’a encore de décision : elles arrivent proposées par un agent, ou écrites ici. »
    Et la page est accessible
    Quand je clique sur le lien « Nouvelle décision »
    Et je choisis « api-voix » dans la liste « Porte sur »
    Alors la liste « Porte sur » vaut « api-voix »
    Et la page est accessible
    Quand je saisis « Garder les fichiers audio 30 jours en cache » dans le champ « Titre »
    Et je saisis « Générer un même article plusieurs fois coûte cher. » dans le champ « Contexte »
    Et je saisis « Garder chaque fichier audio 30 jours. » dans le champ « Décision »
    Et je clique sur le bouton « Accepter la décision »
    Alors la liste « Dépôt » vaut « api-voix »
    Et je vois le lien « DEC-1 Garder les fichiers audio 30 jours en cache »

  @mobile
  @CA-CONT-19
  @NF-18
  Scénario: Sur le téléphone, une décision proposée s'accepte, une décision acceptée se lit seulement
    Étant donné une session a proposé la décision « Normaliser les sigles » dans le dépôt « labo-ia »
    Quand j'ouvre la page « /context/decisions/1 »
    Et je clique sur le bouton « Accepter »
    Alors je suis sur la page « /context »
    Quand j'ouvre la page « /context/decisions/1 »
    Alors je vois le texte « Modifier, remplacer ou abandonner une décision se fait depuis le poste. »
    Et la page est accessible
