# language: fr
@RF-CONT-06
@RF-CONT-07
Fonctionnalité: Isolation du worker
  En tant que développeur, je veux voir et régler ce qu'un agent du worker peut joindre, afin qu'une tâche n'envoie
  mon code nulle part ailleurs, et autoriser un domaine refusé sans relancer la tâche.

  Contexte:
    Étant donné Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-CONT-41
  @NF-18
  Scénario: Les limites de chaque agent et la capacité du worker
    Quand j'ouvre la page « /settings »
    Et je clique sur le lien « Isolation du worker »
    Alors je suis sur la page « /settings/isolation »
    Et je vois le titre « Isolation du worker »
    Et je vois le texte « sans droits d’administration »
    Et la page est accessible
    Quand je choisis « 2 au plus » dans la liste « Agents en même temps »
    Et je recharge la page
    Alors la liste « Agents en même temps » vaut « 2 au plus »

  @CA-CONT-45
  @CA-CONT-46
  @NF-18
  Scénario: Un domaine refusé s'autorise depuis les refus récents
    Étant donné le proxy de la tâche 12 a refusé « pypi.org »
    Quand j'ouvre la page « /settings/isolation/egress »
    Alors je vois le texte « Le filtrage se fait par nom de domaine : un domaine autorisé reste une sortie possible. »
    Et la page est accessible
    Quand je clique sur le bouton « Autoriser ce domaine : pypi.org »
    Alors je vois le texte « Aucun refus récent : les agents n’ont rien tenté hors de la liste. »
    Et la liste « Domaines ajoutés » contient « pypi.org »

  @CA-CONT-43
  @CA-CONT-44
  Scénario: Un domaine s'ajoute par son nom et se retire d'un clic
    Quand j'ouvre la page « /settings/isolation/egress »
    Et je saisis « https://pypi.org » dans le champ « Ajouter un domaine »
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
  @NF-18
  Scénario: Sur le téléphone, l'isolation se lit depuis les sources, sans rien modifier
    Étant donné le proxy de la tâche 12 a refusé « pypi.org »
    Quand j'ouvre la page « /sources »
    Et je clique sur le lien « Isolation du worker »
    Alors je vois le texte « Modifiable depuis le poste. Ces réglages sont réservés à toi. »
    Et la page est accessible
    Quand je clique sur le lien « Sortie réseau et secrets »
    Alors je vois le texte « pypi.org »
    Et je ne vois pas le bouton « Autoriser ce domaine : pypi.org »
