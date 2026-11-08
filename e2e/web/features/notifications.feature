# language: fr
@RF-SESS-08
Fonctionnalité: Notifications
  En tant que développeur, je veux être prévenu quand une question m'attend ou qu'un travail est fini, et retrouver
  ces notifications dans Bosco, afin de ne pas être interrompu par chaque aller-retour avec un agent.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-labo-ia-bosco.jsonl » de la session « c41e9a07 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et le suivi en direct est installé dans le profil « .claude-perso »

  @CA-SESS-86
  @CA-SESS-87
  @CA-SESS-89
  @NF-18
  Scénario: Une question arrive en message bref devant Bosco, puis se retrouve dans le tiroir des notifications
    Quand j’ouvre Bosco au premier plan
    Et la session « c41e9a07 » du profil « .claude-perso » termine son tour en disant « Le digest est généré. Veux-tu que je lance les tests ? »
    Alors je vois le message « Question de fin de tour · Specs du tableau de bord Bosco »
    Quand je clique sur le bouton « Notifications : 1 non lues »
    Alors je vois le titre « Notifications »
    Et le tiroir des notifications montre « Le digest est généré. Veux-tu que je lance les tests ? »
    Et la page est accessible
    Quand je clique sur le bouton « Tout marquer comme lu »
    Alors je ne vois plus le texte « 1 non lue »

  @CA-SESS-88
  Scénario: Une autorisation se répond depuis le tiroir des notifications
    Quand j'ouvre la page « / »
    Et la session « c41e9a07 » du profil « .claude-perso » demande l’autorisation de lancer « npm run db:migrate »
    Et je clique sur le bouton « Notifications : 1 non lues »
    Et je clique sur le bouton « Autoriser » du tiroir
    Alors Claude Code reçoit la décision « allow »
    Et le tiroir des notifications montre « npm run db:migrate · autorisé dans bosco »

  @CA-SESS-83
  @CA-SESS-84
  @NF-18
  Scénario: Ce qui notifie se règle type par type, et les réglages sont gardés
    Quand j'ouvre la page « /settings/notifications »
    Alors l’interrupteur « Autorisation demandée » est « activé »
    Et l’interrupteur « Session terminée » est « désactivé »
    Et la liste « Fin de tour d’une session » vaut « Après un long tour »
    Et la liste « Durée d’un long tour » vaut « 2 min »
    Et la page est accessible
    Quand je choisis « Toujours » dans la liste « Fin de tour d’une session »
    Et je bascule l’interrupteur « Session terminée »
    Et je recharge la page
    Alors la liste « Fin de tour d’une session » vaut « Toujours »
    Et l’interrupteur « Session terminée » est « activé »

  @mobile
  @CA-SESS-90
  @NF-18
  Scénario: Sur le téléphone, la cloche ouvre l'écran des notifications
    Quand j'ouvre la page « / »
    Et la session « c41e9a07 » du profil « .claude-perso » termine son tour en disant « Le digest est généré. Veux-tu que je lance les tests ? »
    Et je clique sur le bouton « Notifications : 1 non lues »
    Alors je suis sur la page « /notifications »
    Et je vois le texte « Le digest est généré. Veux-tu que je lance les tests ? »
    Et la page est accessible
