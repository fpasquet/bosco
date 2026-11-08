# language: fr
@RF-SESS-03
Fonctionnalité: Bosco injoignable
  En tant que développeur, je veux que l'écran garde ce qu'il sait quand Bosco ne répond plus, et se remette à jour
  seul à son retour, afin de ne jamais répondre à une autorisation qui n'arriverait pas.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-labo-ia-bosco.jsonl » de la session « c41e9a07 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et le suivi en direct est installé dans le profil « .claude-perso »
    Et la session « c41e9a07 » du profil « .claude-perso » demande l’autorisation de lancer « npm run db:migrate »

  @CA-SESS-23
  @CA-SESS-24
  @CA-SESS-25
  @CA-SESS-26
  @NF-18
  Scénario: L'écran garde ses informations, désactive les réponses et se reconnecte
    Étant donné Bosco ne répond plus
    Quand j'ouvre la page « / »
    Alors je vois le texte « Bosco ne répond plus depuis »
    Et le tableau a la colonne « Vu à »
    Et le bouton « Autoriser » est désactivé
    Et la page est accessible
    Quand Bosco répond de nouveau
    Et je clique sur le bouton « Réessayer »
    Alors je ne vois plus le texte « Bosco ne répond plus depuis »
    Et le tableau a la colonne « Activité »
