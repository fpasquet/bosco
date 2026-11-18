# language: fr
@RF-REGL-05
@RF-REGL-06
Fonctionnalité: Données
  En tant que développeur, je veux choisir l'historique que Bosco importe et pouvoir le réinitialiser, afin qu'il garde
  les sessions que je veux et reparte de zéro sans toucher à Claude Code.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-maison-budget.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude-perso » contient le transcript « session-site-perso-dependances.jsonl » de la session « a41f07c2 »
    Et le transcript de la session « a41f07c2 » date de 40 jours
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-REGL-28
  @NF-18
  Scénario: L'onglet Données dit la période importée, les sessions plus anciennes et la base
    Quand j'ouvre la page « /settings/data »
    Alors le fil d’Ariane est « Réglages › Données »
    Et le bouton « 30 derniers jours » est enfoncé
    Et je vois le texte « 1 session importée »
    Et je vois le texte « 1 session plus ancienne est encore dans le profil perso »
    Et je vois le titre « Base de Bosco »
    Et la page est accessible

  @CA-REGL-29
  Scénario: « Tout l'historique » ajoute les sessions plus anciennes
    Quand j'ouvre la page « /settings/data »
    Et je clique sur le bouton « Tout l’historique »
    Alors le bouton « Tout l’historique » est enfoncé
    Et je vois le texte « 2 sessions importées »

  @CA-REGL-30
  @NF-18
  Scénario: « Tout effacer » reste grisé tant que le mot n'est pas écrit
    Quand j'ouvre la page « /settings/data »
    Et je clique sur le bouton « Réinitialiser Bosco… »
    Alors je vois le titre « Réinitialiser Bosco ? »
    Et le bouton « Tout effacer » est désactivé
    Et la page est accessible

  @CA-REGL-31
  Scénario: La réinitialisation ramène Bosco au premier lancement
    Quand j'ouvre la page « /settings/data »
    Et je clique sur le bouton « Réinitialiser Bosco… »
    Et je saisis « reinitialiser » dans le champ « Écris RÉINITIALISER pour confirmer »
    Et je clique sur le bouton « Tout effacer » de la confirmation
    Alors je vois le titre « Bienvenue dans Bosco »

  @mobile
  @CA-REGL-28
  Scénario: Sur le téléphone, les données se lisent sans réinitialisation
    Quand j'ouvre la page « /settings/data »
    Alors je vois le texte « Modifiable depuis le poste. La réinitialisation de Bosco aussi. »
    Et je ne vois pas le bouton « Réinitialiser Bosco… »
