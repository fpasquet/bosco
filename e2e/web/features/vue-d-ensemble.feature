# language: fr
@RF-SESS-02
@RF-SESS-06
Fonctionnalité: Vue d'ensemble
  En tant que développeur, je veux voir d'un coup d'œil les sessions ouvertes, groupées par dépôt ou par état, afin de
  savoir où en sont mes agents et ce que coûte la journée.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-labo-ia-rag.jsonl » de la session « 5e0a91c3 »
    Et le profil Claude Code « .claude-perso » contient le transcript « session-labo-ia-bosco.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude » contient le transcript « session-api-voix-fastify.jsonl » de la session « a41f07c2 »

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
  Scénario: Dans chaque dépôt, les sessions sont triées par état puis par activité
    Étant donné il est « 2026-11-06T15:10:00+01:00 » dans le navigateur
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Alors la vue d’ensemble montre, dans l’ordre :
      | dépôt   | session                                          | état     |
      | labo-ia | Specs du tableau de bord Bosco                   | Inactive |
      | labo-ia | Corriger l’indexation des PDF dans Elasticsearch | Inactive |

  @CA-SESS-10
  Scénario: Le coût du jour additionne les sessions commencées aujourd'hui
    Étant donné il est « 2026-11-06T15:10:00+01:00 » dans le navigateur
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Alors l’indicateur « Sessions aujourd’hui » vaut « 2 »
    Et l’indicateur « Coût du jour » vaut « 0,07 $ »
    Et je vois le texte « estimé »

  @CA-SESS-11
  @CA-SESS-12
  Scénario: Un dépôt de la barre latérale filtre la vue d'ensemble
    Étant donné il est « 2026-11-06T15:10:00+01:00 » dans le navigateur
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Et je clique sur le lien « labo-ia »
    Alors je vois le texte « Dépôt : labo-ia »
    Et le tableau a la colonne « Dossier »
    Quand je clique sur le lien « Retirer le filtre Dépôt : labo-ia »
    Alors je ne vois plus le texte « Dépôt : labo-ia »

  @CA-SESS-14
  @CA-SESS-15
  @CA-SESS-18
  @NF-18
  Scénario: Regroupée par état, chaque session est une carte de sa colonne
    Étant donné la session « 5e0a91c3 » a agi il y a quelques secondes
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « État »
    Alors la colonne « En cours » montre la session « Corriger l’indexation des PDF dans Elasticsearch »
    Et la carte de la session « Corriger l’indexation des PDF dans Elasticsearch » montre les actions :
      | Bash · yarn test --forceExit |
    Et la page est accessible
    Quand je recharge la page
    Alors le bouton « État » est enfoncé

  @CA-SESS-16
  Scénario: Une session qui reprend change de colonne d'elle-même
    Étant donné la session « 5e0a91c3 » est inactive depuis 20 minutes
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « État »
    Alors la colonne « Inactives » montre la session « Corriger l’indexation des PDF dans Elasticsearch »
    Quand la session « 5e0a91c3 » lance la commande « yarn lint »
    Alors la colonne « En cours » montre la session « Corriger l’indexation des PDF dans Elasticsearch »
    Et la carte de la session « Corriger l’indexation des PDF dans Elasticsearch » montre les actions :
      | Bash · yarn lint             |
      | Bash · yarn test --forceExit |
