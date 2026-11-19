# language: fr
@RF-SESS-18
Fonctionnalité: Usage
  En tant que développeur, je veux voir ce que consomment mes sessions, par jour, projet, modèle et profil, avec ce que
  Bosco a fait et le quota de mes abonnements, afin de savoir où partent les tokens sans ouvrir chaque session.

  Contexte:
    Étant donné il est « 2026-11-17T15:00:00+01:00 » dans le navigateur
    Et le profil Claude Code « .claude-perso » contient le transcript « session-api-tarifs-usage.jsonl » de la session « d93b51f0 »
    Et le profil Claude Code « .claude-perso » contient le transcript « session-creneaux-usage.jsonl » de la session « 5b2d81e4 »
    Et le profil Claude Code « .claude-perso » contient le transcript « session-sejours-usage.jsonl » de la session « 8e14c2b7 »
    Et le profil Claude Code « .claude-perso » a accès à l’abonnement Claude de « camille@exemple.dev »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et les dossiers « api-tarifs » et « creneaux » sont des projets
    Et le dossier « sejours » est un projet
    Et le groupe « Club des Trois Lacs » réunit les projets « api-tarifs » et « creneaux »

  @CA-SESS-175
  @CA-SESS-144
  @NF-18
  Scénario: L'historique ne propose plus que la recherche, et l'usage s'ouvre par sa propre entrée
    Quand j'ouvre la page « /history »
    Alors je ne vois pas le bouton « Coûts »
    Quand je clique sur le lien « Usage » de la barre latérale
    Alors je suis sur la page « /usage »
    Et l’entrée « Usage » de la barre latérale est active
    Et la page n’a pas de fil d’Ariane
    Et je vois le titre « Usage »
    Et la page est accessible

  @CA-SESS-176
  @CA-SESS-177
  @CA-SESS-178
  Scénario: Les filtres valent pour toute la page, et l'activité, les tokens et le coût viennent des transcripts
    Quand j'ouvre la page « /usage »
    Et je clique sur le bouton « Depuis le début »
    Alors je vois le texte « Données depuis le 16 nov. 2026. »
    Et l’indicateur « Réutilisation du cache » vaut « 97,7 % »
    Et l’indicateur « Coût estimé » vaut « 0,35 $ »
    Et l’indicateur « Coût estimé » vaut « hors claude-nova-1, non chiffré »
    Et l’indicateur « PR créées » vaut « 1 »
    Quand j'ouvre la page « /usage »
    Alors le bouton « Depuis le début » est enfoncé

  @CA-SESS-179
  Scénario: Le graphique quotidien a sa légende, détaille un jour au focus et s'ouvre en tableau
    Quand j'ouvre la page « /usage?period=all »
    Alors la légende du graphique montre « Entrée, Sortie, Lecture du cache, Écriture en cache »
    Quand je place le focus sur le jour « lun. 16 nov. » du graphique
    Alors l’info-bulle du graphique dit « Lecture du cache100 k »
    Et l’info-bulle du graphique dit « Coût estimé0,09 $ »
    Quand je clique sur le bouton « Coût estimé »
    Et je clique sur le bouton « Voir en tableau »
    Alors je vois le tableau « Utilisation quotidienne, une ligne par jour »
    Et la page est accessible

  @CA-SESS-180
  Scénario: Le quota garde une ligne par abonnement, filtres posés, et passe en orange au-delà du seuil d'attente
    Étant donné l’abonnement du profil « .claude-perso » est à 52 % de sa fenêtre de 5 h
    Quand j'ouvre la page « /usage?period=all&group=2 »
    Alors la jauge « 5 h » du quota vaut « 52 % »
    Et je vois le texte « Les messages aux sessions retenues attendent »
    Quand je clique sur le lien « Seuils »
    Alors je suis sur la page « /settings/subscription »

  @CA-SESS-181
  Scénario: La répartition met les plus gros d'abord, et un clic sur un projet filtre toute la page
    Quand j'ouvre la page « /usage?period=all »
    Alors l’indicateur « Coût estimé » vaut « 0,35 $ »
    Quand je clique sur le bouton « creneaux : filtrer la page sur ce projet »
    Alors je vois le bouton « Retirer le filtre Projet : creneaux »
    Et l’indicateur « Coût estimé » vaut « 0,27 $ »

  @NF-18
  Scénario: La page défile dans la coquille, sans faire défiler la fenêtre ni laisser de vide en bas
    Quand j'ouvre la page « /usage?period=all »
    Alors je vois le bouton « creneaux : filtrer la page sur ce projet »
    Et seul le contenu défile, la fenêtre reste à sa hauteur

  @CA-SESS-188
  Scénario: Les sous-agents comptent dans le coût de leur session, et leur part se lit à part
    Quand j'ouvre la page « /usage?period=all »
    Alors l’indicateur « Coût estimé » vaut « dont 0,06 $ de sous-agents »
    Et je vois le texte « Sessions et sous-agents »
    Quand j'ouvre la page « /sessions/5b2d81e4 »
    Alors l’indicateur « Modèle » vaut « Opus 5.5 »
    Et l’indicateur « dont sous-agents » vaut « 0,06 $ · 63 k »

  @CA-SESS-182
  @CA-SESS-183
  Scénario: « Usage » du menu d'un groupe ouvre la page filtrée, et la puce se retire d'un clic
    Quand j'ouvre la page « / »
    Et j’ouvre au clavier le menu « Actions de Club des Trois Lacs »
    Et je clique sur l’élément de menu « Usage »
    Alors je suis sur la page « /usage »
    Et je vois le bouton « Retirer le filtre Groupe : Club des Trois Lacs »
    Quand je clique sur le bouton « Retirer le filtre Groupe : Club des Trois Lacs »
    Alors je ne vois pas le bouton « Retirer le filtre Groupe : Club des Trois Lacs »
    Et la liste « Projet ou groupe » vaut « Tous les projets et groupes »
    Quand je clique sur le bouton « 7 j »
    Et je clique sur le bouton « Réinitialiser »
    Alors le bouton « 30 j » est enfoncé

  @mobile
  @CA-SESS-175
  Scénario: Sur le téléphone, l'onglet Historique bascule entre les sessions et l'usage
    Quand j'ouvre la page « /history »
    Et je clique sur le lien « Usage »
    Alors je suis sur la page « /usage »
    Et je vois le texte « Utilisation quotidienne »
    Et la page est accessible
