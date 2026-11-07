# language: fr
@RF-SESS-01
Fonctionnalité: Premier lancement
  En tant que développeur, je veux que Bosco se présente et me propose les profils Claude Code du poste, afin de choisir
  ceux qu'il surveille avant qu'il ne lise quoi que ce soit.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-labo-ia-rag.jsonl » de la session « 5e0a91c3 »
    Et le profil Claude Code « .claude-perso » contient le transcript « session-labo-ia-bosco.jsonl » de la session « c41e9a07 »

  @CA-SESS-71
  @CA-SESS-01
  @NF-18
  Scénario: Bosco se présente et propose les profils du poste
    Quand j'ouvre la page « / »
    Alors je vois le titre « Bienvenue dans Bosco »
    Et je vois le titre « Bosco a trouvé 2 profils Claude Code sur ce poste »
    Et la page est accessible

  @CA-SESS-03
  Scénario: Les profils choisis sont surveillés
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « Surveiller ces profils »
    Alors je finis par ne plus voir le bouton « Surveiller ces profils »
    Et je vois le titre « Vue d’ensemble »

  @CA-SESS-04
  Scénario: L'encart du suivi en direct se range à plus tard
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « Plus tard »
    Alors je finis par ne plus voir le bouton « Plus tard »
