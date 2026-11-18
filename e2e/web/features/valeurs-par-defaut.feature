# language: fr
@RF-SESS-16
@RF-SESS-17
@RF-REGL-03
@RF-CONT-22
Fonctionnalité: Valeurs par défaut des sessions et modes d'autorisation
  En tant que développeur, je veux régler une fois le profil, les autorisations, le modèle et l'effort de mes sessions,
  pour un profil, un projet ou un groupe, afin que chaque nouvelle session parte comme je le veux et dise d'où vient
  chaque valeur, avec cinq modes d'autorisation et l'accès complet confirmé sur le poste.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-maison-budget.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude-perso » a accès à l’abonnement Claude de « camille@exemple.dev »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et le dossier personnel contient les dossiers :
      | dossier    | git |
      | site-perso | oui |
    Et les dossiers « maison » et « site-perso » sont des projets
    Et le groupe « Perso » réunit les projets « maison » et « site-perso »

  @NF-18
  @CA-SESS-157
  @CA-SESS-164
  @CA-CONT-168
  @CA-CONT-171
  Scénario: Une session démarrée avec un groupe prend le mode du groupe, le modèle et l'effort du projet principal
    Étant donné le groupe « Perso » part par défaut en « Approuver pour moi »
    Et le projet « maison » règle par défaut le modèle « Sonnet 5.5 » et l’effort « élevé »
    Quand j'ouvre la page « /groups/2/sessions »
    Et je clique sur le lien « Nouvelle session dans ce groupe »
    Alors le réglage « Autorisations » vaut « Approuver pour moi, défaut du groupe »
    Et le réglage « Modèle » vaut « Sonnet 5.5, défaut du projet maison »
    Et le réglage « Effort » vaut « élevé, défaut du projet maison »
    Et la page est accessible
    Quand je saisis « Affiche les tarifs » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « Reçu : Affiche les tarifs · mode auto · modèle claude-sonnet-5-5 · effort high »

  @CA-SESS-156
  @CA-SESS-163
  Scénario: Le profil proposé est celui du groupe, et le dit
    Étant donné le groupe « Perso » prend par défaut le profil « .claude-perso »
    Quand j'ouvre la page « /groups/2/sessions »
    Et je clique sur le lien « Nouvelle session dans ce groupe »
    Alors la liste « Abonnement Claude » vaut « perso · défaut du groupe · camille@exemple.dev »

  @CA-SESS-158
  @CA-SESS-159
  Scénario: Le menu des autorisations propose cinq modes, et grise « Approuver pour moi » quand le modèle ne le permet pas
    Quand j'ouvre la page « /sessions/new »
    Et j’ouvre le menu des réglages « Autorisations »
    Alors le menu propose les modes, dans l’ordre :
      | Demander                   |
      | Accepter les modifications |
      | Plan                       |
      | Approuver pour moi         |
      | Accès complet              |
    Quand j’appuie sur Échap
    Et je choisis « Haiku 4.5 » dans le menu des réglages « Modèle »
    Et j’ouvre le menu des réglages « Autorisations »
    Alors le choix « Approuver pour moi » du menu est grisé, avec sa raison « Pas disponible avec ce modèle »

  @CA-SESS-161
  Scénario: En bac à sable sans mode réglé, les modifications passent, et la puce le dit
    Quand j'ouvre la page « /sessions/new »
    Et je clique sur le bouton radio « Bac à sable »
    Alors le réglage « Autorisations » vaut « Accepter les modifications, défaut en bac à sable »

  @CA-SESS-169
  @CA-SESS-172
  Scénario: Choisir l'accès complet sur le poste ouvre une confirmation, et « Annuler » rend le mode précédent
    Quand j'ouvre la page « /sessions/new »
    Et je choisis « Accès complet » dans le menu des réglages « Autorisations »
    Alors je vois le titre « Donner l’accès complet sur le poste ? »
    Et la page est accessible
    Quand je clique sur le bouton « Annuler » de la confirmation
    Alors le réglage « Autorisations » vaut « Demander, celui du profil Claude Code »

  @CA-SESS-170
  @CA-SESS-173
  Scénario: Un accès complet venu du groupe se confirme au démarrage, puis la session part sans demande
    Étant donné le groupe « Perso » part par défaut en « Accès complet »
    Quand j'ouvre la page « /groups/2/sessions »
    Et je clique sur le lien « Nouvelle session dans ce groupe »
    Et je saisis « Lance les tests » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le titre « Donner l’accès complet sur le poste ? »
    Quand je clique sur le bouton « Donner l’accès complet » de la confirmation
    Alors je vois le texte « Reçu : Lance les tests · mode bypassPermissions »
    Et le réglage « Autorisations » vaut « Accès complet »

  @CA-SESS-171
  @CA-SESS-174
  Scénario: « Utiliser un bac à sable » garde l'accès complet, sans autre confirmation
    Quand j'ouvre la page « /groups/2/sessions »
    Et je clique sur le lien « Nouvelle session dans ce groupe »
    Et je choisis « Accès complet » dans le menu des réglages « Autorisations »
    Et je clique sur le bouton « Utiliser un bac à sable » de la confirmation
    Alors le bouton radio « Bac à sable » est coché
    Et le réglage « Autorisations » vaut « Accès complet, choisi pour cette session »
    Quand je saisis « Lance les tests » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « Reçu : Lance les tests · mode bypassPermissions »

  @CA-SESS-166
  @CA-SESS-169
  Scénario: Dans une session, le mode change pour les tours suivants, et l'accès complet se confirme
    Quand j'ouvre la page « /sessions/new »
    Et je saisis « Lis les catégories du budget » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « Reçu : Lis les catégories du budget · mode default »
    Quand je choisis « Accès complet » dans le menu des réglages « Autorisations »
    Et je clique sur le bouton « Donner l’accès complet » de la confirmation
    Et je saisis « Et les tests » dans le champ « Message à l’agent »
    Et je clique sur le bouton « Envoyer »
    Alors je vois le texte « Reçu : Et les tests · mode bypassPermissions »

  @CA-SESS-191
  Scénario: Passer à l'accès complet pendant un tour autorise la demande qui attend et les suivantes
    Quand j'ouvre la page « /sessions/new »
    Et je saisis « Lance deux autorisations » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le bouton « Autoriser »
    Quand je choisis « Accès complet » dans le menu des réglages « Autorisations »
    Et je clique sur le bouton « Donner l’accès complet » de la confirmation
    Alors je vois le texte « Deux commandes lancées · mode bypassPermissions »

  @CA-SESS-168
  Scénario: Quand Claude Code suspend « Approuver pour moi », le fil le dit et la demande revient dans Bosco
    Quand j'ouvre la page « /sessions/new »
    Et je choisis « Approuver pour moi » dans le menu des réglages « Autorisations »
    Et je saisis « Nettoie le projet, quitte à essuyer des refus » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « Approuver pour moi suspendu après 3 refus : les demandes reviennent dans Bosco »
    Et je vois le bouton « Autoriser »
    Quand je recharge la page
    Alors je vois le texte « Approuver pour moi suspendu après 3 refus : les demandes reviennent dans Bosco »

  @NF-18
  @CA-REGL-16
  @CA-REGL-17
  @CA-REGL-19
  Scénario: « Gérer » ouvre les réglages d'un profil, qui reprennent ceux du profil Claude Code jusqu'à ce qu'on en choisisse
    Étant donné le profil Claude Code « .claude-perso » règle le modèle « Sonnet 5.5 »
    Quand j'ouvre la page « /settings/sources »
    Et je clique sur le lien « Gérer le profil perso »
    Alors je vois le titre « perso »
    Et je vois le texte « camille@exemple.dev »
    Et la liste « Modèle » vaut « Celui du profil Claude Code · Sonnet 5.5 »
    Et la page est accessible
    Quand je choisis « Plan » dans le menu des réglages « Autorisations »
    Et je clique sur le bouton « Enregistrer »
    Alors je vois le message « Réglages du profil enregistrés : ils valent pour les sessions suivantes. »

  @CA-REGL-18
  Scénario: Les autorisations d'un profil proposent les cinq modes, et l'accès complet s'y confirme à chaque session
    Quand j'ouvre la page « /settings/sources »
    Et je clique sur le lien « Gérer le profil perso »
    Et je choisis « Haiku 4.5 » dans la liste « Modèle »
    Et j’ouvre le menu des réglages « Autorisations »
    Alors le menu propose les modes, dans l’ordre :
      | Celui du profil Claude Code |
      | Demander                    |
      | Accepter les modifications  |
      | Plan                        |
      | Approuver pour moi          |
      | Accès complet               |
    Et le choix « Approuver pour moi » du menu est grisé, avec sa raison « Pas disponible avec ce modèle »
    Quand j’appuie sur Échap
    Et je choisis « Accès complet » dans le menu des réglages « Autorisations »
    Et je clique sur le bouton « Enregistrer »
    Et j'ouvre la page « /sessions/new »
    Et je choisis « perso · camille@exemple.dev » dans la liste « Abonnement Claude »
    Et je saisis « Lance les tests » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le titre « Donner l’accès complet sur le poste ? »

  @mobile
  @CA-REGL-22
  Scénario: Sur le téléphone, les réglages d'un profil se lisent seulement
    Quand j'ouvre la page « /settings/sources »
    Et je clique sur le lien « Gérer le profil perso »
    Alors je vois le texte « Modifiable depuis le poste. Ces réglages sont réservés à toi. »
    Et je ne vois pas le bouton « Enregistrer »
    Et la page est accessible

  @CA-CONT-166
  @CA-CONT-167
  Scénario: Les réglages d'un projet héritent de chaque valeur et disent d'où elle vient, jusqu'à ce qu'on la règle
    Quand j'ouvre la page « /projects/1/settings »
    Alors la liste « Autorisations » vaut « Hériter »
    Et je vois le texte « Hérité · celui du profil Claude Code (Demander) »
    Quand je choisis « Sonnet 5.5 » dans la liste « Modèle »
    Alors la liste « Modèle » vaut « Sonnet 5.5 »

  @CA-CONT-169
  @CA-CONT-170
  Scénario: Les réglages d'un groupe héritent du projet principal, et un mode réglé ici vaut pour ses sessions
    Étant donné le projet « maison » règle par défaut le modèle « Sonnet 5.5 » et l’effort « élevé »
    Quand j'ouvre la page « /groups/2/settings »
    Alors je vois le texte « Hérité · défaut du projet principal, maison (Sonnet 5.5) »
    Quand je choisis « Approuver pour moi » dans la liste « Autorisations »
    Alors la liste « Autorisations » vaut « Approuver pour moi »
