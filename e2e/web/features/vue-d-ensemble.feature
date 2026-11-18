# language: fr
@RF-SESS-02
@RF-SESS-06
Fonctionnalité: Vue d'ensemble
  En tant que développeur, je veux voir d'un coup d'œil les sessions ouvertes, groupées par projet ou par état, afin de
  savoir où en sont mes agents et ce que coûte la journée.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-maison-recettes.jsonl » de la session « 5e0a91c3 »
    Et le profil Claude Code « .claude-perso » contient le transcript « session-maison-budget.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude » contient le transcript « session-site-perso-dependances.jsonl » de la session « a41f07c2 »
    Et les dossiers « maison » et « site-perso » sont des projets

  @CA-SESS-08
  @NF-18
  Scénario: Sans suivi en direct, une ligne propose de l'installer
    Étant donné il est « 2026-11-06T15:10:00+01:00 » dans le navigateur
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Alors je vois le lien « Installer le suivi en direct »
    Et je ne vois plus le texte « attendent ta réponse »
    Et la page est accessible

  @CA-SESS-09
  Scénario: Dans chaque projet, les sessions sont triées par état puis par activité
    Étant donné il est « 2026-11-06T15:10:00+01:00 » dans le navigateur
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Alors la vue d’ensemble montre, dans l’ordre :
      | projet | session                                           | état     |
      | maison | Ajouter les catégories au budget du foyer         | Inactive |
      | maison | Corriger la recherche des recettes par ingrédient | Inactive |

  @CA-SESS-10
  Scénario: Le coût du jour additionne les sessions commencées aujourd'hui
    Étant donné il est « 2026-11-06T15:10:00+01:00 » dans le navigateur
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Alors l’indicateur « Sessions aujourd’hui » vaut « 2 »
    Et l’indicateur « Coût du jour » vaut « 0,07 $ »
    Et je vois le texte « estimé »

  @CA-SESS-143
  @CA-SESS-144
  @CA-CONT-155
  @CA-CONT-157
  @NF-18
  Scénario: Un projet de la barre latérale ouvre sa page, qui dit sa place, au lieu de filtrer la vue d'ensemble
    Étant donné il est « 2026-11-06T15:10:00+01:00 » dans le navigateur
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Alors la page n’a pas de fil d’Ariane
    Et l’entrée « Vue d’ensemble » de la barre latérale est active
    Quand je clique sur le lien « maison » de la barre latérale
    Alors je suis sur la page « /projects/1/sessions »
    Et le fil d’Ariane est « Projets › maison »
    Et l’entrée « maison » de la barre latérale est active
    Et les onglets « Onglets du projet » sont « Sessions, Contexte, Réglages »
    Et l’onglet « Sessions » est ouvert
    Et le tableau a la colonne « Dossier »
    Et la page est accessible

  @CA-SESS-14
  @CA-SESS-15
  @CA-SESS-18
  @NF-18
  Scénario: Regroupée par état, chaque session est une carte de sa colonne
    Étant donné la session « 5e0a91c3 » a agi il y a quelques secondes
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « État »
    Alors la colonne « En cours » montre la session « Corriger la recherche des recettes par ingrédient »
    Et la carte de la session « Corriger la recherche des recettes par ingrédient » montre les actions :
      | Bash · yarn test --forceExit |
    Et la page est accessible
    Quand je recharge la page
    Alors le bouton « État » est enfoncé

  @CA-SESS-76
  @mobile
  Scénario: Sur le téléphone, les puces d'état montrent une colonne à la fois
    Étant donné la session « 5e0a91c3 » a agi il y a quelques secondes
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « État »
    Alors le bouton « En cours · 1 » est enfoncé
    Et la colonne « En cours » montre la session « Corriger la recherche des recettes par ingrédient »
    Et la page est accessible
    Quand je clique sur le bouton « Inactives · 0 »
    Alors je vois le texte « Aucune session »
    Et je ne vois plus le texte « Corriger la recherche des recettes par ingrédient »

  @CA-SESS-16
  Scénario: Une session qui reprend change de colonne d'elle-même
    Étant donné la session « 5e0a91c3 » est inactive depuis 20 minutes
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « État »
    Alors la colonne « Inactives » montre la session « Corriger la recherche des recettes par ingrédient »
    Quand la session « 5e0a91c3 » lance la commande « yarn lint »
    Alors la colonne « En cours » montre la session « Corriger la recherche des recettes par ingrédient »
    Et la carte de la session « Corriger la recherche des recettes par ingrédient » montre les actions :
      | Bash · yarn lint             |
      | Bash · yarn test --forceExit |

  @CA-SESS-09
  Scénario: Une session arrêtée quitte la vue d'ensemble d'elle-même
    Étant donné la session « 5e0a91c3 » a agi il y a quelques secondes
    Et la session « 5e0a91c3 » est ouverte dans Claude Code
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Alors la vue d’ensemble montre la session « Corriger la recherche des recettes par ingrédient »
    Quand la session « 5e0a91c3 » est arrêtée dans Claude Code
    Alors la vue d’ensemble ne montre plus la session « Corriger la recherche des recettes par ingrédient »

  @CA-SESS-118
  Scénario: « Regrouper par » propose le projet, le groupe et l'état, et garde le dernier choix
    Étant donné la session « 5e0a91c3 » a agi il y a quelques secondes
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Alors le bouton « Projet » est enfoncé
    Quand je clique sur le bouton « Groupe »
    Alors le bouton « Groupe » est enfoncé
    Quand je clique sur le bouton « État »
    Et je recharge la page
    Alors le bouton « État » est enfoncé

  @CA-SESS-120
  Scénario: Une session dont le dossier n'est dans aucun projet se range sous « Hors projet »
    Étant donné le profil Claude Code « .claude » contient le transcript « session-home-notes.jsonl » de la session « e7d2b410 »
    Et la session « e7d2b410 » a agi il y a quelques secondes
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Alors le tableau des sessions montre « Hors projet »
    Et le tableau des sessions montre « Ranger les notes de la semaine »
