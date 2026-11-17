# language: fr
@RF-SESS-15
@RF-CONT-21
Fonctionnalité: Navigation par lieux
  En tant que développeur, je veux que chaque page dise sa place et que la barre latérale mène aux pages de mes projets
  et de mes groupes, afin de savoir où je suis quelle que soit la façon d'y arriver.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-labo-ia-rag.jsonl » de la session « 5e0a91c3 »
    Et le profil Claude Code « .claude » contient le transcript « session-home-notes.jsonl » de la session « e7d2b410 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et les dossiers « labo-ia » et « api-voix » sont des projets

  @CA-CONT-150
  @CA-CONT-151
  @NF-18
  Scénario: Le menu ⋯ d'un projet de la barre latérale s'ouvre au clavier et mène aux onglets de sa page
    Étant donné le projet « labo-ia » est épinglé
    Quand j'ouvre la page « / »
    Et j’ouvre au clavier le menu « Actions de labo-ia »
    Alors le menu propose, dans l’ordre :
      | Nouvelle session dans labo-ia    |
      | Sessions                         |
      | Contexte                         |
      | Réglages                         |
      | Ajouter à un groupe              |
      | Désépingler de la barre latérale |
      | Retirer le projet…               |
    Et la page est accessible
    Quand j’appuie sur Échap
    Alors le menu est fermé
    Quand j’ouvre au clavier le menu « Actions de labo-ia »
    Et je clique sur l’élément de menu « Réglages »
    Alors je suis sur la page « /projects/1/settings »

  @CA-CONT-153
  Scénario: Un projet épinglé reste dans la barre latérale, et la quitte désépinglé sans être retiré
    Quand j'ouvre la page « / »
    Alors la barre latérale ne montre pas le projet « labo-ia »
    Quand j'ouvre la page « /projects/1/settings »
    Et je clique sur le bouton « Actions du projet »
    Et je clique sur l’élément de menu « Épingler dans la barre latérale »
    Et je clique sur le bouton « Actions du projet »
    Alors je vois l’élément de menu « Désépingler de la barre latérale »
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « Actions de labo-ia »
    Et je clique sur l’élément de menu « Désépingler de la barre latérale »
    Alors la barre latérale ne montre pas le projet « labo-ia »
    Quand je clique sur le lien « Tous les projets » de la barre latérale
    Alors la liste « Projets » contient « labo-ia »

  @CA-CONT-153
  Scénario: Les ＋ des intitulés de la barre latérale créent un groupe et ajoutent des projets
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « Créer un groupe »
    Alors je vois le titre « Nouveau groupe »
    Quand je clique sur le bouton « Fermer »
    Et je clique sur le bouton « Ajouter un projet »
    Alors je vois le titre « Ajouter des projets »

  @CA-CONT-152
  @CA-CONT-137
  Scénario: Le menu ⋯ d'un groupe propose ses onglets et le masque de la barre latérale
    Étant donné le groupe « Médias » réunit le projet « api-voix »
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « Actions de Médias »
    Alors le menu propose, dans l’ordre :
      | Nouvelle session dans ce groupe |
      | Sessions                        |
      | Instructions                    |
      | Réglages                        |
      | Masquer de la barre latérale    |
      | Supprimer le groupe…            |
    Quand je clique sur l’élément de menu « Masquer de la barre latérale »
    Alors la barre latérale ne montre pas le groupe « Médias »

  @CA-CONT-130
  @CA-CONT-131
  @CA-CONT-133
  @NF-18
  Scénario: Retirer un projet depuis son menu dit ce qui change, puis il revient en suggestion
    Étant donné le groupe « Médias » réunit les projets « labo-ia » et « api-voix »
    Et le projet « labo-ia » est épinglé
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « Actions de labo-ia »
    Et je clique sur l’élément de menu « Retirer le projet… »
    Alors je vois le texte « Dans Médias, api-voix devient le projet principal. »
    Et je vois le texte « Rien n’est supprimé sur le poste : ni le dossier, ni les sessions »
    Et la page est accessible
    Quand je clique sur le bouton « Retirer le projet » de la confirmation
    Alors je suis sur la page « /projects »
    Et la liste « Suggestions » contient « labo-ia »

  @CA-CONT-149
  Scénario: Dans « Tous les projets », un projet ouvre sa page, et « Tous les projets » est actif
    Quand j'ouvre la page « /projects »
    Alors le fil d’Ariane est « Projets »
    Et l’entrée « Tous les projets » de la barre latérale est active
    Quand je clique sur le lien « api-voix » de la page
    Alors je suis sur la page « /projects/2/sessions »
    Et je vois le texte « Aucune session ouverte dans ce projet. »

  @CA-CONT-160
  @CA-CONT-161
  @CA-CONT-163
  @CA-SESS-126
  @NF-18
  Scénario: Un groupe de la barre latérale ouvre sa page sur les sessions de ses projets
    Étant donné il est « 2026-11-06T15:10:00+01:00 » dans le navigateur
    Et le groupe « Médias » réunit le projet « labo-ia »
    Quand j'ouvre la page « / »
    Et je clique sur le lien « Médias » de la barre latérale
    Alors je suis sur la page « /groups/2/sessions »
    Et le fil d’Ariane est « Groupes › Médias »
    Et l’entrée « Médias » de la barre latérale est active
    Et les onglets du groupe sont « Sessions, Instructions, Réglages »
    Et le tableau a la colonne « Projet »
    Et la page est accessible
    Quand je clique sur le lien « labo-ia » de la page
    Alors je suis sur la page « /projects/1/sessions »

  @CA-SESS-154
  @CA-CONT-162
  Scénario: Une nouvelle session dans un groupe part de son projet principal, avec le groupe dans le fil d'Ariane
    Étant donné le groupe « Médias » réunit le projet « api-voix »
    Quand j'ouvre la page « /groups/2/sessions »
    Et je clique sur le lien « Nouvelle session dans ce groupe »
    Alors le fil d’Ariane est « Groupes › Médias › Nouvelle session »
    Et je vois le texte « Avec le groupe Médias · projet principal api-voix »

  @CA-SESS-152
  @CA-SESS-153
  Scénario: Une nouvelle session ouverte depuis le menu d'un projet a ce projet choisi et sa place dans le fil d'Ariane
    Quand j'ouvre la page « /projects/2/sessions »
    Et je clique sur le bouton « Actions du projet »
    Et je clique sur l’élément de menu « Nouvelle session dans api-voix »
    Alors le fil d’Ariane est « Projets › api-voix › Nouvelle session »
    Et l’entrée « api-voix » de la barre latérale est active

  @CA-SESS-146
  @CA-SESS-147
  @NF-18
  Scénario: Une session dit la place de son projet, et le fil d'Ariane mène à sa page
    Quand j'ouvre la page « /sessions/5e0a91c3 »
    Alors le fil d’Ariane est « Projets › labo-ia »
    Et l’entrée « labo-ia » de la barre latérale est active
    Et la page est accessible
    Quand je clique sur le lien « labo-ia » de la page
    Alors je suis sur la page « /projects/1/sessions »
    Et l’onglet « Sessions » est ouvert

  @CA-SESS-146
  Scénario: Une session hors de tout projet porte « Hors projet », et la vue d'ensemble reste active
    Quand j'ouvre la page « /sessions/e7d2b410 »
    Alors le fil d’Ariane est « Hors projet »
    Et l’entrée « Vue d’ensemble » de la barre latérale est active

  @CA-SESS-143
  @CA-SESS-144
  Scénario: L'ancienne vue d'ensemble filtrée sur un projet mène à sa page, l'historique n'a pas de fil d'Ariane
    Quand j'ouvre la page « /?project=labo-ia »
    Alors je suis sur la page « /projects/1/sessions »
    Quand j'ouvre la page « /history »
    Alors la page n’a pas de fil d’Ariane
    Et l’entrée « Historique » de la barre latérale est active

  @mobile
  @CA-CONT-154
  @NF-18
  Scénario: Sur le téléphone, un projet de l'onglet Projets ouvre une feuille, sans retrait ni groupe
    Quand j'ouvre la page « /projects »
    Et je clique sur le bouton « labo-ia »
    Alors la feuille propose, dans l’ordre :
      | Nouvelle session |
      | Sessions         |
      | Contexte         |
      | Réglages         |
    Et la feuille ne propose pas « Retirer »
    Et la feuille ne propose pas « Ajouter à un groupe »
    Et la page est accessible

  @mobile
  @CA-SESS-148
  Scénario: Sur le téléphone, le fil d'Ariane d'une session devient le retour à son projet
    Quand j'ouvre la page « /sessions/5e0a91c3 »
    Et je clique sur le lien « labo-ia »
    Alors je suis sur la page « /projects/1/sessions »
