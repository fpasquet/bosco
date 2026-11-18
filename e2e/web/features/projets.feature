# language: fr
@RF-CONT-16
@RF-CONT-18
@RF-CONT-25
Fonctionnalité: Tous les projets
  En tant que développeur, je veux que chaque dépôt git où une session a tourné devienne un projet, et ajouter moi-même
  les autres dossiers, en parcourant ceux du poste ou parmi ceux où une session a tourné, afin de voir tout mon travail
  rangé par projet.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-maison-budget.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude » contient le transcript « session-site-perso-dependances.jsonl » de la session « a41f07c2 »
    Et le profil Claude Code « .claude » contient le transcript « session-home-notes.jsonl » de la session « e7d2b410 »
    Et le profil Claude Code « .claude » contient le transcript « session-notes-clubs.jsonl » de la session « b52e18d3 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-CONT-177
  @CA-CONT-122
  @CA-CONT-149
  @NF-18
  Scénario: Les dépôts où des sessions ont tourné sont des projets, un dossier sans git est proposé
    Quand j'ouvre la page « / »
    Et je clique sur le lien « Tous les projets »
    Alors je suis sur la page « /projects »
    Et la liste « Projets » contient « maison »
    Et la liste « Projets » contient « site-perso »
    Et la liste « Suggestions » contient « notes-clubs »
    Et la liste « Suggestions » ne contient pas « maison »
    Et la page est accessible

  @CA-CONT-114
  @CA-CONT-115
  @CA-CONT-117
  @CA-CONT-118
  @CA-CONT-119
  @NF-18
  Scénario: Le navigateur ajoute d'un coup des dossiers cochés dans plusieurs dossiers
    Étant donné le dossier personnel contient les dossiers :
      | dossier           | git |
      | www/site-clubs    | oui |
      | www/site-tournois | oui |
      | www/archives      | non |
    Et le dossier « maison » est un projet
    Quand j'ouvre la page « /projects »
    Et je clique sur le bouton « Ajouter des projets »
    Et je coche « notes-clubs »
    Et je clique sur le bouton « Ouvrir www »
    Et je clique sur le bouton « Cocher les 2 dépôts git non ajoutés de ce dossier »
    Et je coche « archives »
    Alors la case « site-tournois » est cochée
    Et je vois le texte « Sans git, pas de bac à sable »
    Et la page est accessible
    Quand je clique sur le bouton « Dossier parent »
    Alors la case « notes-clubs » est cochée
    Quand je clique sur le bouton « Ajouter 4 projets »
    Alors la liste « Projets » contient « site-clubs »
    Et la liste « Projets » contient « archives »
    Et la liste « Projets » contient « notes-clubs »

  @CA-CONT-111
  @CA-CONT-115
  @NF-18
  Scénario: Les projets ajoutés sont listés, « Hors projet » reste visible, et un dossier ajouté est grisé et coché
    Étant donné le dossier « maison » est un projet
    Quand j'ouvre la page « /projects »
    Alors la liste « Projets » contient « maison »
    Et la liste « Projets » contient « Hors projet »
    Et la liste « Projets » contient « 2 sessions »
    Et la page est accessible
    Quand je clique sur le bouton « Ajouter des projets »
    Alors la case « maison » est cochée
    Et la case « site-perso » est cochée

  @CA-CONT-112
  Scénario: Une suggestion ignorée se retrouve parmi les ignorées, une autre s'ajoute d'un clic
    Étant donné le dossier « maison » est un projet
    Quand j'ouvre la page « /projects »
    Et je clique sur le bouton « Ignorer notes-clubs »
    Et je clique sur le bouton « Ignorés · 1 »
    Alors la liste « Ignorés » contient « notes-clubs »
    Et la liste « Suggestions » ne contient pas « notes-clubs »
    Quand je clique sur le bouton « Ne plus ignorer notes-clubs »
    Et je clique sur le bouton « Ajouter notes-clubs »
    Alors la liste « Projets » contient « notes-clubs »

  @mobile
  @CA-CONT-124
  @NF-18
  Scénario: Sur le téléphone, les projets et les suggestions se lisent, l'ajout renvoie au poste
    Quand j'ouvre la page « /projects »
    Alors je vois le texte « Ajouter des projets se fait depuis le poste. »
    Et la liste « Suggestions » contient « notes-clubs »
    Et je ne vois pas le bouton « Ajouter des projets »
    Et la page est accessible

  @mobile
  @CA-CONT-148
  Scénario: Sur le téléphone, la liste des projets renvoie au poste pour en ajouter
    Étant donné le dossier « maison » est un projet
    Quand j'ouvre la page « /projects »
    Alors je vois le texte « Ajouter des projets se fait depuis le poste. »
    Et je ne vois pas le bouton « Nouveau groupe »
