# language: fr
@RF-CONT-08
Fonctionnalité: Environnements de test
  En tant que développeur, je veux voir et choisir les services de test lancés autour de l'agent d'un dépôt, afin
  qu'il puisse lancer les tests sans rien publier sur mon poste.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-labo-ia-rag.jsonl » de la session « 5e0a91c3 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et le dépôt « labo-ia » a le fichier des services de test « api-voix.yaml »

  @CA-CONT-49
  @CA-CONT-50
  @CA-CONT-51
  @NF-18
  Scénario: Les services lancés, écartés, et les options retirées
    Quand j'ouvre la page « /settings/test-environments »
    Alors je vois le titre « Environnement de test »
    Et je vois le texte « c’est l’application elle-même »
    Et je vois le texte « ports publiés »
    Et la page est accessible
    Quand je clique sur le bouton radio « Choisir »
    Et je coche « rabbitmq »
    Et je recharge la page
    Alors la case « rabbitmq » est cochée

  @mobile
  @CA-CONT-49
  @NF-18
  Scénario: Sur le téléphone, l'environnement de test se lit depuis les sources
    Quand j'ouvre la page « /sources »
    Et je clique sur le lien « Environnements de test »
    Alors je vois le texte « Sélection : Automatique »
    Et je vois le texte « Modifiable depuis le poste. Ces réglages sont réservés à toi. »
    Et la page est accessible
