# language: fr
@RF-TACH-05
Fonctionnalité: Droits des agents
  En tant que développeur, je veux régler ce que les agents peuvent faire dans chaque dépôt, afin qu'une tâche puisse
  resserrer ces droits sans jamais les dépasser.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-labo-ia-rag.jsonl » de la session « 5e0a91c3 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @NF-18
  Scénario: Le budget d'un dépôt se resserre, puis revient au général
    Quand j'ouvre la page « /tasks »
    Et je clique sur le lien « Droits des agents »
    Alors je vois le titre « Droits des agents »
    Et la page est accessible
    Quand je clique sur le bouton « Modifier : Budget au plus »
    Et je saisis « 1,5 » dans le champ « Budget au plus »
    Et je clique sur le bouton « Enregistrer »
    Et je clique sur le bouton « Revenir au général : Budget au plus »
    Alors je ne vois pas le bouton « Revenir au général : Budget au plus »

  @mobile
  @NF-18
  Scénario: Sur le téléphone, les droits se lisent sans rien modifier
    Quand j'ouvre la page « /tasks/rights »
    Alors je vois le texte « Modifiable depuis le poste. Ces droits sont réservés à toi. »
    Et je ne vois pas le bouton « Modifier : Budget au plus »
    Et la page est accessible
