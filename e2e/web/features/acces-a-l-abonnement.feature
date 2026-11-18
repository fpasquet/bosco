# language: fr
@RF-REGL-07
Fonctionnalité: Accès à l'abonnement par un jeton longue durée
  En tant que développeur, je veux qu'un profil que je lance avec un jeton longue durée (claude setup-token) soit un
  abonnement Claude comme les autres, afin de démarrer une session avec lui, sans que Bosco garde le jeton.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-maison-budget.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude-ultra » contient le transcript « session-site-perso-dependances.jsonl » de la session « a41f07c2 »
    Et le profil Claude Code « .claude-perso » a accès à l’abonnement Claude de « camille@exemple.dev »
    Et le dossier « .secrets » contient un jeton longue durée dans le fichier « ultra-token »
    Et Bosco surveille les profils « .claude-perso » et « .claude-ultra »
    Et le dossier « maison » est un projet

  @CA-REGL-32
  @CA-REGL-33
  Scénario: Un profil sans accès est grisé dans la nouvelle session, puis proposé une fois son jeton déclaré
    Quand j'ouvre la page « /sessions/new »
    Alors le choix « ultra · aucun accès · à régler dans le profil » de la liste « Abonnement Claude » est grisé
    Quand je clique sur le lien « à régler dans le profil ultra »
    Alors je vois le texte « Aucun accès à un abonnement Claude »
    Quand je clique sur le bouton « Utiliser un jeton longue durée »
    Et je clique sur le bouton « Ouvrir .secrets »
    Et je clique sur le bouton radio « ultra-token »
    Alors la page est accessible
    Quand je clique sur le bouton « Utiliser ce fichier »
    Alors je vois le texte « /.secrets/ultra-token »
    Et la fenêtre est fermée
    Et la page est accessible
    Quand j'ouvre la page « /sessions/new »
    Et je choisis « ultra · jeton longue durée » dans la liste « Abonnement Claude »
    Et je saisis « Lis le budget » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « · jeton …7f3a »

  @CA-REGL-32
  Scénario: Le jeton déclaré se retire, et le profil revient sans accès
    Quand j'ouvre la page « /settings/sources »
    Et je clique sur le lien « Gérer le profil ultra »
    Et je clique sur le bouton « Utiliser un jeton longue durée »
    Et je clique sur le bouton « Ouvrir .secrets »
    Et je clique sur le bouton radio « ultra-token »
    Et je clique sur le bouton « Utiliser ce fichier »
    Et je clique sur le bouton « Retirer le jeton longue durée »
    Alors je vois le texte « Jeton longue durée retiré : le profil revient à sa connexion. »
    Et je vois le texte « Aucun accès à un abonnement Claude »
