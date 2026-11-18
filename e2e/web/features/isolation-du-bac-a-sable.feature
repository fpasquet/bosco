# language: fr
@RF-CONT-06
@RF-CONT-07
Fonctionnalité: Isolation du bac à sable
  En tant que développeur, je veux voir et régler ce que l'agent d'un bac à sable peut joindre, afin qu'une session
  n'envoie mon code nulle part ailleurs.

  Contexte:
    Étant donné Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-CONT-41
  @CA-CONT-43
  @CA-CONT-44
  @CA-REGL-08
  @NF-18
  Scénario: Les limites d'un bac à sable, et un domaine qui s'ajoute par son nom puis se retire d'un clic
    Quand j'ouvre la page « /settings »
    Et je clique sur le lien « Bac à sable »
    Alors je suis sur la page « /settings/sandbox »
    Et le fil d’Ariane est « Réglages › Bac à sable »
    Et je vois le texte « sans droits d’administration »
    Et je vois le texte « Le filtrage se fait par nom de domaine : un domaine autorisé reste une sortie possible. »
    Et la page est accessible
    Quand je saisis « https://pypi.org » dans le champ « Ajouter un domaine »
    Et je clique sur le bouton « Ajouter »
    Alors je vois le texte « Un nom de domaine seul, sans protocole ni chemin : pypi.org ou *.github.com. »
    Quand je saisis « *.github.com » dans le champ « Ajouter un domaine »
    Et je clique sur le bouton « Ajouter »
    Alors la liste « Domaines ajoutés » contient « *.github.com »
    Et je ne vois pas le bouton « Retirer claude.ai »
    Quand je clique sur le bouton « Retirer *.github.com »
    Alors la liste « Domaines ajoutés » ne contient plus « *.github.com »

  @mobile
  @CA-CONT-42
  @CA-REGL-11
  @NF-18
  Scénario: Sur le téléphone, l'isolation se lit depuis les réglages, sans rien modifier
    Quand j'ouvre la page « /settings/sources »
    Et je clique sur le lien « Bac à sable »
    Alors je vois le texte « Modifiable depuis le poste. Ces réglages sont réservés à toi. »
    Et je vois le texte « api.anthropic.com »
    Et la page est accessible
