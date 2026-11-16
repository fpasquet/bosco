# language: fr
@RF-CONT-04
@RF-CONT-05
@RF-CONT-14
Fonctionnalité: Intégrations et liens d'une tâche
  En tant que développeur, je veux coller les liens d'une tâche et que Bosco lise leur titre et leur état, afin que
  l'agent les connaisse sans jamais recevoir les accès aux services.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-labo-ia-rag.jsonl » de la session « 5e0a91c3 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-CONT-34
  @CA-CONT-36
  @NF-18
  Scénario: Un lien GitHub se reconnaît avant l'ajout, puis s'affiche avec ce que Bosco a lu
    Étant donné Docker ne répond pas
    Et une tâche du worker « Ajoute un test du découpage. » existe dans le dépôt « labo-ia »
    Quand j'ouvre la page « /tasks/1 »
    Et je saisis « https://github.com/groupe/labo-ia/pull/42 » dans le champ « Coller une adresse »
    Alors je vois le texte « Pull request GitHub reconnue »
    Quand je clique sur le bouton « Ajouter »
    Alors la liste « Liens de la tâche » contient « Ouverte »
    Et la page est accessible

  @CA-CONT-88
  @NF-18
  Scénario: Les intégrations disent ce qu'elles lisent, et renvoient Jira et Confluence aux agents
    Quand j'ouvre la page « /settings »
    Alors je suis sur la page « /settings/integrations »
    Et je vois le texte « Lu avec GitHub CLI du poste : aucun jeton n’est gardé. »
    Et je vois le texte « Reconnus à leur adresse : clé du ticket, titre de la page »
    Et la page est accessible
    Quand je clique sur le lien « Lecture par les agents »
    Alors je suis sur la page « /settings/isolation/egress »
