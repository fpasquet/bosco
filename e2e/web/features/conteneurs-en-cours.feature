# language: fr
@RF-CONT-13
Fonctionnalité: Conteneurs en cours
  En tant que développeur, je veux voir les bacs à sable démarrés et les tours pilotés sur le poste, et ce que chacun
  consomme, afin de savoir ce qui pèse sur mon poste.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-maison-budget.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude-perso » a accès à l’abonnement Claude de « camille@exemple.dev »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et le dossier « maison » est un projet

  @CA-CONT-71
  @CA-CONT-72
  @NF-18
  Scénario: Le panneau montre les bacs à sable et les tours sur le poste, et reste déplié d'une page à l'autre
    Étant donné une session tourne dans un bac à sable
    Et une session pilotée a un long tour en cours sur le poste
    Quand j'ouvre la page « / »
    Et je clique sur le résumé « Conteneurs » de la barre latérale
    Alors je vois le titre « Conteneurs en cours »
    Et je vois le titre « Bacs à sable »
    Et je vois le titre « Tours sur le poste »
    Et je vois le texte « 0,0 / 2 cœurs »
    Et la page est accessible
    Quand j'ouvre la page « /history »
    Alors je vois le titre « Conteneurs en cours »
    Quand je recharge la page
    Alors je vois le titre « Tours sur le poste »
    Quand je clique sur le bouton « Replier »
    Alors je ne vois plus le texte « Tours sur le poste »

  @CA-CONT-74
  Scénario: Un tour s'arrête depuis le panneau, un bac à sable s'ouvre sur sa session
    Étant donné une session tourne dans un bac à sable
    Et une session pilotée a un long tour en cours sur le poste
    Quand j'ouvre la page « / »
    Et je clique sur le résumé « Conteneurs » de la barre latérale
    Et je clique sur le bouton « Arrêter le tour »
    Alors je ne vois plus le texte « Tours sur le poste »
    Et je ne vois pas le bouton « Démarrer »
    Quand je clique sur le lien « Voir la session »
    Alors le titre de la page porte « Bac à sable »

  @CA-CONT-181
  Scénario: Le tour d'un bac à sable se compte avec son bac à sable, pas parmi les tours sur le poste
    Étant donné une session a un long tour en cours dans un bac à sable
    Quand j'ouvre la page « / »
    Et je clique sur le résumé « Conteneurs » de la barre latérale
    Alors je vois le titre « Bacs à sable »
    Et je ne vois plus le texte « Tours sur le poste »

  @CA-CONT-81
  Scénario: Quand Docker ne répond plus, les dernières mesures restent, grisées et datées, sans action
    Étant donné une session tourne dans un bac à sable
    Et Docker ne répond plus
    Quand j'ouvre la page « / »
    Et je clique sur le résumé « Conteneurs » de la barre latérale
    Alors je vois le texte « Docker ne répond pas depuis »
    Et je vois le texte « Bosco ne peut plus mesurer les bacs à sable »
    Et je vois le texte « Dernières mesures · »
    Et je vois le texte « 1,3 / 4 Go »
    Et le bouton « Voir la session » est désactivé

  @mobile
  @CA-CONT-76
  @NF-18
  Scénario: Sur le téléphone, les conteneurs en cours s'ouvrent depuis les réglages, une carte par élément
    Étant donné une session tourne dans un bac à sable
    Et une session pilotée a un long tour en cours sur le poste
    Quand j'ouvre la page « /settings »
    Et je clique sur le lien « Conteneurs en cours »
    Alors je vois le texte « CPU 0,0 / 2 cœurs · 1,3 / 4 Go »
    Et je vois le lien « Voir la session »
    Et je vois le bouton « Arrêter le tour »
    Et la page est accessible
