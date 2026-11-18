# language: fr
@RF-SESS-14
Fonctionnalité: Sessions à plusieurs projets
  En tant que développeur, je veux démarrer une session sur les projets d'un groupe, sur le poste ou dans un bac à
  sable, afin qu'un seul agent change une API et les sites qui l'appellent, et la retrouver dans chacun de ses projets.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-maison-budget.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude-perso » a accès à l’abonnement Claude de « camille@exemple.dev »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et le dossier personnel contient les dossiers :
      | dossier     | git |
      | site-perso  | oui |
      | notes-clubs | non |
    Et les dossiers « maison » et « site-perso » sont des projets
    Et le groupe « Perso » réunit les projets « maison » et « site-perso »

  @NF-18
  @CA-SESS-128
  @CA-SESS-132
  @CA-SESS-138
  @CA-SESS-140
  Scénario: Une session démarrée dans un groupe tourne dans son projet principal et voit les autres
    Quand j'ouvre la page « /groups/2/sessions »
    Et je clique sur le lien « Nouvelle session dans ce groupe »
    Alors je vois le bouton « maison, projet principal »
    Et je vois le bouton « Retirer site-perso »
    Et je vois le texte « Sur ce poste, dans maison ; elle voit aussi site-perso. »
    Et la page est accessible
    Quand je saisis « Affiche les tarifs » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « Reçu : Affiche les tarifs · mode default · modèle défaut · effort défaut · images 0 · dossiers ajoutés site-perso avec leurs instructions »
    Et je vois le texte « Projets · 2 »
    Et je vois le texte « CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --resume »
    Et je vois le texte « --add-dir ~/ »
    Et la page est accessible

  @CA-SESS-133
  Scénario: L'étoile d'un autre projet en fait le projet principal, la croix le retire pour cette session
    Quand j'ouvre la page « /groups/2/sessions »
    Et je clique sur le lien « Nouvelle session dans ce groupe »
    Et je clique sur le bouton « Faire de site-perso le projet principal »
    Alors je vois le bouton « site-perso, projet principal »
    Et je vois le texte « Sur ce poste, dans site-perso ; elle voit aussi maison. »
    Quand je clique sur le bouton « Retirer maison »
    Alors je vois le texte « Sur ce poste, dans le dossier du projet, comme dans un terminal. »

  @CA-SESS-134
  Scénario: Une session ouverte dans un terminal dans le dossier d'un des projets est signalée pour ce projet
    Étant donné la session « c41e9a07 » est ouverte dans Claude Code
    Quand j'ouvre la page « /sessions/c41e9a07 »
    Alors je vois le texte « Ouverte dans un terminal · réponds-y là-bas. »
    Quand j'ouvre la page « /groups/2/sessions »
    Et je clique sur le lien « Nouvelle session dans ce groupe »
    Alors je vois le texte « une session est déjà ouverte dans ce dossier »
    Et je vois le lien « Voir la session »

  @CA-SESS-131
  Scénario: Un projet sans git grise le bac à sable, avec sa raison
    Étant donné le dossier « notes-clubs » est un projet
    Et le groupe « Clubs » réunit les projets « maison » et « notes-clubs »
    Quand j'ouvre la page « /groups/3/sessions »
    Et je clique sur le lien « Nouvelle session dans ce groupe »
    Alors je vois le texte « Bac à sable indisponible : notes-clubs n’est pas un dépôt git. »

  @CA-SESS-136
  @CA-SESS-137
  @CA-SESS-141
  @CA-CONT-128
  Scénario: Un groupe en bac à sable a une copie par projet, réunit leurs domaines et récupère les branches qui ont du travail
    Quand j'ouvre la page « /projects/1/settings »
    Et je saisis « paiement.exemple.dev » dans le champ « Ajouter un domaine »
    Et je clique sur le bouton « Ajouter le domaine »
    Alors je vois le bouton « Retirer paiement.exemple.dev »
    Quand j'ouvre la page « /groups/2/sessions »
    Et je clique sur le lien « Nouvelle session dans ce groupe »
    Et je clique sur le bouton radio « Bac à sable »
    Alors je vois le texte « Une copie de chacun des 2 projets »
    Et je vois le texte « 6 domaines, ceux des 2 projets »
    Et je vois le texte « Créée dans chacun des 2 projets »
    Et la page est accessible
    Quand je saisis « Ajoute les tarifs » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « Branches · 2 »
    Quand je clique sur le bouton « Récupérer les branches »
    Alors je vois le message « Récupérée dans maison (bosco/s-ajoute-les-tarifs) »

  @CA-SESS-123
  @CA-SESS-124
  @CA-SESS-125
  @CA-SESS-126
  Scénario: La vue par groupe montre une session dans chaque groupe de ses projets, et les projets sans groupe à la fin
    Étant donné le groupe « Node.js » réunit le projet « site-perso »
    Et le dossier « creneaux » est un projet
    Et la session pilotée « Affiche les tarifs » tourne dans les projets « maison, site-perso »
    Et la session pilotée « Range les créneaux » tourne dans les projets « creneaux »
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « Groupe »
    Alors la vue d’ensemble montre, dans l’ordre :
      | projet      | session            | état     |
      | Perso       | Affiche les tarifs | T’attend |
      | Node.js     | Affiche les tarifs | T’attend |
      | Sans groupe | Range les créneaux | T’attend |
    Et le tableau des sessions montre « maison +1 »
    Et le tableau des sessions montre « aussi dans Node.js »
    Et le tableau des sessions montre « aussi dans Perso »
    Et je vois le lien « Réglages du groupe Perso »
    Et la page est accessible

  @CA-CONT-158
  @CA-SESS-139
  Scénario: La page d'un projet ajouté montre la session sous « Aussi dans ce projet »
    Étant donné la session pilotée « Affiche les tarifs » tourne dans les projets « maison, site-perso »
    Quand j'ouvre la page « /projects/2/sessions »
    Alors je vois le titre « Aussi dans ce projet »
    Et je vois le lien « maison +1 »
    Et je vois le lien « Affiche les tarifs »

  @CA-CONT-176
  Scénario: « Hors projet » de la barre latérale ouvre la section des sessions hors de tout projet
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-home-notes.jsonl » de la session « e7d2b410 »
    Quand j'ouvre la page « / »
    Et je clique sur le lien « Hors projet » de la barre latérale
    Alors je suis sur la page « /projects »
    Et je vois le lien « Ranger les notes de la semaine »

  @mobile
  @CA-SESS-138
  @CA-SESS-140
  Scénario: Sur le téléphone, l'onglet « Projets » du détail reprend la carte des projets et la commande de reprise
    Étant donné la session pilotée « Affiche les tarifs » tourne dans les projets « maison, site-perso »
    Quand j'ouvre la page « / »
    Et je clique sur le lien « Affiche les tarifs »
    Et je clique sur l'onglet « Projets »
    Alors je vois le texte « Projets · 2 »
    Et je vois le texte « --add-dir ~/ »
    Et la page est accessible

  @CA-SESS-119
  Scénario: Regroupée par projet, la vue d'ensemble range la session sous son projet principal, nommée d'après lui
    Étant donné la session pilotée « Affiche les tarifs » tourne dans les projets « maison, site-perso »
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « Projet »
    Alors la vue d’ensemble montre, dans l’ordre :
      | projet | session            | état     |
      | maison | Affiche les tarifs | T’attend |
    Et le tableau des sessions montre « maison +1 »
    Quand je clique sur le lien « Affiche les tarifs »
    Alors je vois le texte « Projets · 2 »

  @CA-CONT-161
  Scénario: La colonne « Projet » de la page d'un groupe nomme le projet principal et le nombre des autres
    Étant donné la session pilotée « Affiche les tarifs » tourne dans les projets « maison, site-perso »
    Quand j'ouvre la page « /groups/2/sessions »
    Alors je vois le lien « maison +1 »
    Quand je clique sur le lien « maison +1 »
    Alors je suis sur la page « /projects/1/sessions »

  @CA-SESS-130
  Scénario: L'avertissement de session ouverte vaut pour chaque projet sur le poste, et disparaît en bac à sable
    Étant donné la session « c41e9a07 » est ouverte dans Claude Code
    Quand j'ouvre la page « /sessions/c41e9a07 »
    Alors je vois le texte « Ouverte dans un terminal · réponds-y là-bas. »
    Quand j'ouvre la page « /groups/2/sessions »
    Et je clique sur le lien « Nouvelle session dans ce groupe »
    Et je clique sur le bouton « Faire de site-perso le projet principal »
    Alors je vois le texte « maison : une session est déjà ouverte dans ce dossier »
    Quand je clique sur le bouton radio « Bac à sable »
    Alors je ne vois plus le texte « une session est déjà ouverte dans ce dossier »
