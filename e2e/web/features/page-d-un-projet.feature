# language: fr
@RF-CONT-22
@RF-CONT-24
Fonctionnalité: Page d'un projet
  En tant que développeur, je veux régler un projet depuis sa page, afin que ses nouvelles sessions partent de là où je
  les fais tourner et que ses groupes se gèrent à côté de lui.

  Contexte:
    Étant donné Bosco surveille les profils « .claude » et « .claude-perso »
    Et les dossiers « maison » et « site-perso » sont des projets

  @CA-CONT-125
  @CA-CONT-127
  @CA-REGL-02
  @NF-18
  Scénario: Les réglages d'un projet sans git disent sa place, et le bac à sable y est grisé avec sa raison
    Quand j'ouvre la page « /projects/1/settings »
    Alors le fil d’Ariane est « Projets › maison »
    Et l’onglet « Réglages » est ouvert
    Et je vois l’étiquette « sans git »
    Et je vois le texte « Bac à sable indisponible : maison n’est pas un dépôt git. »
    Et le bouton radio « Sur le poste » est coché
    Et la page est accessible

  @CA-CONT-126
  Scénario: Un projet rejoint un groupe qui a des instructions depuis ses réglages, après une confirmation
    Étant donné le groupe « Perso » réunit le projet « site-perso »
    Et le groupe « Perso » a l’instruction « Les textes lus sont en français. »
    Quand j'ouvre la page « /projects/1/settings »
    Et je clique sur le bouton « Ajouter à un groupe : maison »
    Et je clique sur l’élément de menu « Perso »
    Alors je vois le texte « Les instructions du groupe arriveront aux prochains agents de »
    Quand je clique sur le bouton « Ajouter » de la confirmation
    Alors je vois le lien « Perso » dans la page

  @CA-CONT-130
  Scénario: Le retrait d'un projet depuis ses réglages demande une confirmation qui garde tout sur le poste
    Quand j'ouvre la page « /projects/2/settings »
    Et je clique sur le bouton « Retirer le projet »
    Alors je vois le texte « Rien n’est supprimé sur le poste : ni le dossier, ni les sessions »
    Quand je clique sur le bouton « Annuler »
    Alors je suis sur la page « /projects/2/settings »

  @CA-CONT-159
  Scénario: « Nouvelle session » d'un projet part de ce projet, et ⋯ à côté ouvre le menu du projet
    Quand j'ouvre la page « /projects/1/sessions »
    Et je clique sur le bouton « Actions du projet »
    Alors je vois l’élément de menu « Épingler dans la barre latérale »
    Quand j’appuie sur Échap
    Et je clique sur le lien « Nouvelle session » de la page
    Alors je vois le bouton « maison, projet principal »

  @mobile
  @CA-CONT-159
  Scénario: Sur le téléphone, un projet a les onglets Sessions, Contexte et Réglages
    Quand j'ouvre la page « /projects/1/sessions »
    Alors les onglets « Onglets du projet » sont « Sessions, Contexte, Réglages »
    Et je vois le lien « Nouvelle session »

  @mobile
  @CA-CONT-129
  @NF-18
  Scénario: Sur le téléphone, les réglages d'un projet se lisent, sans retrait, et la nouvelle session reste possible
    Quand j'ouvre la page « /projects/1/settings »
    Alors je vois le texte « Modifiable depuis le poste. Le retrait d’un projet aussi. »
    Et je ne vois pas le bouton « Retirer le projet »
    Et je vois le lien « Nouvelle session »
    Et la page est accessible
