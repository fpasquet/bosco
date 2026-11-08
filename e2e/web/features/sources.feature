# language: fr
@RF-SESS-01
@RF-SESS-08
Fonctionnalité: Sources et réglages
  En tant que développeur, je veux régler ce que Bosco lit et quand il me prévient, afin qu'il suive ma façon de
  travailler.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-labo-ia-bosco.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude » contient le transcript « session-labo-ia-rag.jsonl » de la session « 5e0a91c3 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-SESS-59
  @NF-18
  Scénario: Les réglages sont gardés d'une visite à l'autre
    Quand j'ouvre la page « /sources »
    Alors la liste « Seuil d’inactivité » vaut « 15 min »
    Et la page est accessible
    Quand je choisis « 30 min » dans la liste « Seuil d’inactivité »
    Et je recharge la page
    Alors la liste « Seuil d’inactivité » vaut « 30 min »

  @CA-SESS-56
  Scénario: Une source mise en pause n'est plus lue
    Quand j'ouvre la page « /sources »
    Et je bascule l’interrupteur « Lire le profil perso »
    Alors je vois le texte « En pause »
