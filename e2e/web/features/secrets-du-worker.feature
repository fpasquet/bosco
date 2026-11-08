# language: fr
@RF-CONT-05
@RF-CONT-12
Fonctionnalité: Secrets des tâches du worker
  En tant que développeur, je veux choisir l'abonnement Claude et l'accès npm que reçoivent les tâches du worker, afin
  qu'elles installent depuis mes registres privés et comptent dans l'abonnement que j'ai choisi.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-api-voix-fastify.jsonl » de la session « a41f07c2 »
    Et le profil Claude Code « .claude-perso » contient le transcript « session-labo-ia-bosco.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude » a accès à l’abonnement Claude de « camille@exemple.dev »
    Et le profil Claude Code « .claude-perso » a accès à l’abonnement Claude de « camille.perso@exemple.dev »
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-CONT-67
  @CA-CONT-68
  @NF-18
  Scénario: L'abonnement se choisit parmi les profils, et le .npmrc du poste dit ses registres
    Étant donné le poste a le fichier npm « npmrc »
    Quand j'ouvre la page « /settings/isolation/egress »
    Alors je vois le texte « camille@exemple.dev »
    Et la liste « Registres privés » contient « @interne → npm.registre.exemple.dev »
    Et la liste « Registres du .npmrc » contient « npm.registre.exemple.dev »
    Et je ne vois plus le texte « jeton-de-lecture »
    Et la page est accessible
    Quand je clique sur le bouton « Modifier le profil de l’abonnement »
    Et je choisis « profil perso · camille.perso@exemple.dev » dans la liste « Profil de l’abonnement Claude »
    Et je clique sur le bouton « Enregistrer »
    Alors je vois le texte « Abonnement Claude · profil perso · camille.perso@exemple.dev »

  @mobile
  @CA-CONT-68
  Scénario: Sur le téléphone, les secrets se lisent sans se changer
    Quand j'ouvre la page « /settings/isolation/egress »
    Alors je vois le texte « Accès npm · ~/.npmrc »
    Et je ne vois pas le bouton « Modifier le fichier .npmrc »
