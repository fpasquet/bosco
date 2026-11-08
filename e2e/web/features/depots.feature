# language: fr
Fonctionnalité: Dépôts découverts
  En tant que développeur, je veux que Bosco range mes sessions sous de vrais dépôts git, que je peux restreindre et
  masquer, afin que mon dossier personnel, les dossiers jetables et les worktrees ne deviennent pas des dépôts.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-labo-ia-bosco.jsonl » de la session « c41e9a07 »
    Et le profil Claude Code « .claude » contient le transcript « session-api-voix-fastify.jsonl » de la session « a41f07c2 »
    Et le profil Claude Code « .claude » contient le transcript « session-home-notes.jsonl » de la session « e7d2b410 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-SESS-77
  @CA-SESS-80
  @CA-SESS-81
  @CA-SESS-82
  @NF-18
  Scénario: Seuls les dépôts git sont trouvés, et un dépôt masqué n'est plus proposé pour une tâche
    Quand j'ouvre la page « /settings/repositories »
    Alors la liste « Dépôts trouvés » contient « labo-ia »
    Et la liste « Dépôts trouvés » contient « 1 session »
    Et l’interrupteur « Dépôts git seulement » est « activé »
    Et la page est accessible
    Quand j'ouvre la page « /tasks/new »
    Alors le choix « Dépôt » propose « labo-ia, api-voix »
    Quand j'ouvre la page « /settings/repositories »
    Et je clique sur le bouton « Affiché : labo-ia »
    Alors je ne vois pas le bouton « Affiché : labo-ia »
    Quand j'ouvre la page « /tasks/new »
    Alors le choix « Dépôt » propose « api-voix »

  @CA-SESS-79
  Scénario: Un dossier exclu retire ses dépôts, et un chemin relatif est refusé
    Quand j'ouvre la page « /settings/repositories »
    Et je saisis « ~/api-voix » dans le champ « Ajouter un dossier : Dossiers exclus »
    Et je clique sur le bouton « Ajouter : Dossiers exclus »
    Alors la liste « Dossiers exclus » contient « ~/api-voix »
    Et la liste « Dépôts trouvés » ne contient pas « api-voix »
    Et la liste « Dépôts trouvés » contient « 2 sessions »
    Quand je saisis « www » dans le champ « Ajouter un dossier : Dossiers de dépôts »
    Et je clique sur le bouton « Ajouter : Dossiers de dépôts »
    Alors je vois le texte « n’est pas un chemin absolu »

  @mobile
  @CA-SESS-82
  @NF-18
  Scénario: Sur le téléphone, les dépôts se lisent depuis les sources, sans rien modifier
    Quand j'ouvre la page « /sources »
    Et je clique sur le lien « Dépôts »
    Alors je vois le texte « Modifiable depuis le poste. Ces réglages sont réservés à toi. »
    Et la liste « Dépôts trouvés » contient « labo-ia »
    Et je ne vois pas le bouton « Retirer /tmp »
    Et la page est accessible
