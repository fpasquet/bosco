# language: fr
@RF-SESS-01
@RF-SESS-08
Fonctionnalité: Sources et réglages
  En tant que développeur, je veux régler ce que Bosco lit et quand il me prévient, afin qu'il suive ma façon de
  travailler.

  Contexte:
    Étant donné le profil Claude Code « .claude-perso » contient le transcript « session-maison-budget.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude » contient le transcript « session-maison-rag.jsonl » de la session « 5e0a91c3 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-SESS-59
  @NF-18
  Scénario: Les réglages sont gardés d'une visite à l'autre
    Quand j'ouvre la page « /settings/sources »
    Alors la liste « Seuil d’inactivité » vaut « 15 min »
    Et la page est accessible
    Quand je choisis « 30 min » dans la liste « Seuil d’inactivité »
    Et je recharge la page
    Alors la liste « Seuil d’inactivité » vaut « 30 min »

  @CA-SESS-56
  Scénario: Une source mise en pause n'est plus lue
    Quand j'ouvre la page « /settings/sources »
    Et je bascule l’interrupteur « Lire le profil perso »
    Alors je vois le texte « En pause »

  @mobile
  @CA-REGL-06
  Scénario: Sur le téléphone, les sources et le seuil d'inactivité se lisent sans se modifier
    Quand j'ouvre la page « /settings/sources »
    Alors l’interrupteur « Lire le profil perso » n’est pas modifiable
    Et je vois le texte « 15 min »
    Et je vois le texte « Le suivi en direct s’installe depuis le poste »
    Et je vois le texte « Pour ajouter un dossier, ouvre Bosco sur le poste. »
    Et je ne vois pas le bouton « Ajouter un dossier »

  @RF-SESS-01
  @NF-18
  Scénario: « Ajouter un dossier » surveille un autre dossier de configuration de Claude Code
    Étant donné le profil Claude Code « .claude-pro » contient le transcript « session-site-perso-fastify.jsonl » de la session « a41f07c2 »
    Quand j'ouvre la page « /settings/sources »
    Et je clique sur le bouton « Ajouter un dossier »
    Et je saisis le dossier du profil « .claude-pro » dans le champ « Dossier de configuration »
    Alors la page est accessible
    Quand je clique sur le bouton « Ajouter » de la fenêtre
    Alors je vois le texte « Dossier ajouté : pro est surveillé. »
    Et l’interrupteur « Lire le profil pro » est « activé »

  @CA-SESS-57
  Scénario: Un suivi en direct installé par une autre version de Bosco est à mettre à jour
    Étant donné le suivi en direct est installé dans le profil « .claude-perso »
    Et le suivi en direct du profil « .claude-perso » vient d’une autre version de Bosco
    Quand j'ouvre la page « /settings/sources »
    Alors je vois l’étiquette « À mettre à jour »
    Quand je clique sur le bouton « Mettre à jour le suivi en direct du profil perso »
    Et je clique sur le bouton « Mettre à jour » de la fenêtre
    Alors je vois le texte « Suivi en direct · perso »
    Et je ne vois plus le texte « À mettre à jour »
