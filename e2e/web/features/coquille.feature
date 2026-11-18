# language: fr
@NF-18
Fonctionnalité: Coquille
  La coquille donne accès aux écrans : une barre latérale sur le poste, des onglets en bas sur le téléphone.

  Scénario: La vue d'ensemble s'ouvre dans la coquille
    Quand j'ouvre la page « / »
    Alors je vois le lien « Vue d’ensemble »
    Et la page est accessible

  @mobile
  @CA-SESS-145
  Scénario: Sur téléphone, les onglets du bas mènent aux écrans
    Quand j'ouvre la page « / »
    Alors les onglets « Navigation principale » sont « Ensemble, Historique, Projets, Réglages »
    Et la page est accessible

  @CA-SESS-72
  Scénario: Le logo de la barre latérale ouvre « À propos de Bosco », qui se ferme sans rien changer
    Quand j'ouvre la page « /history »
    Et je clique sur le bouton « À propos de Bosco »
    Alors je vois le titre « À propos de Bosco »
    Et je vois le texte « Le bosco est le maître d’équipage d’un navire »
    Et je vois le texte « Isole une session »
    Et la page est accessible
    Quand j’appuie sur Échap
    Alors je ne vois plus le texte « Le bosco est le maître d’équipage d’un navire »
    Et je suis sur la page « /history »

  @mobile
  @CA-SESS-72
  Scénario: Sur le téléphone, le logo de l'en-tête ouvre « À propos de Bosco »
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « À propos de Bosco »
    Alors je vois le texte « Le bosco est le maître d’équipage d’un navire »
    Et la page est accessible
