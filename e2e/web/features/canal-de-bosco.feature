# language: fr
@RF-SESS-09
Fonctionnalité: Canal de Bosco
  En tant que développeur, je veux écrire depuis Bosco à une session ouverte dans un terminal, afin de lui répondre
  depuis mon téléphone sans retourner à son terminal.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-labo-ia-bosco.jsonl » de la session « c41e9a07 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et la session « c41e9a07 » est ouverte dans Claude Code

  @CA-SESS-102
  Scénario: Le canal s'installe dans un profil depuis la bande d'une session du terminal
    Quand j'ouvre la page « /sessions/c41e9a07 »
    Et je clique sur le lien « Lancer tes sessions avec le canal de Bosco pour leur écrire d’ici »
    Alors je vois le titre « Canal de Bosco · profil perso »
    Quand je clique sur le bouton « Installer » de la fenêtre
    Alors je vois le texte « alias claude-bosco= »
    Et la page est accessible

  @CA-SESS-101
  Scénario: Une session du terminal lancée avec le canal reçoit le texte écrit dans Bosco
    Étant donné la session « c41e9a07 » a son canal de Bosco ouvert
    Quand j'ouvre la page « /sessions/c41e9a07 »
    Alors je vois le texte « Canal de Bosco »
    Et je vois le texte « Ouverte dans un terminal · ton message y arrive par le canal de Bosco »
    Et je ne vois pas le bouton « Joindre une image »
    Et la page est accessible
    Quand je saisis « Ajoute un test avec un tableau » dans le champ « Message à l’agent »
    Et je clique sur le bouton « Envoyer »
    Alors le canal de Bosco reçoit « Ajoute un test avec un tableau »
