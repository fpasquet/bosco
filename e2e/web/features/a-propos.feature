# language: fr
@RF-REGL-08
@RF-REGL-09
@RF-REGL-10
@RF-REGL-11
Fonctionnalité: À propos
  En tant que développeur, je veux voir la version de Bosco, ses nouveautés et l'arrivée d'une version plus récente,
  afin de mettre Bosco à jour quand je le décide.

  @CA-REGL-34
  @CA-REGL-39
  @NF-18
  Scénario: L'onglet À propos dit la version, les mises à jour et les nouveautés
    Quand j'ouvre la page « /settings/about »
    Alors le fil d’Ariane est « Réglages › À propos »
    Et je vois le texte « paquet .deb »
    Et l’interrupteur « Chercher les nouvelles versions » est « activé »
    Et le bouton « Stable » est enfoncé
    Et je vois le titre « Mises à jour »
    Et je vois le texte « tiré des messages de commit »
    Et la page est accessible

  @CA-REGL-35
  Scénario: Une version plus récente se montre avec ses notes et le paquet à télécharger
    Étant donné GitHub publie les versions 0.2.0, 0.3.0 et 0.4.0-beta.1
    Quand j'ouvre la page « /settings/about »
    Et je clique sur le bouton « Vérifier maintenant »
    Alors je vois le titre « Version 0.3.0 disponible »
    Et je vois le lien « Télécharger le .deb »
    Et je vois le texte « Show the version and the changelog in the settings »

  @CA-REGL-35
  Scénario: Le canal bêta propose aussi les betas
    Étant donné GitHub publie les versions 0.2.0, 0.3.0 et 0.4.0-beta.1
    Quand j'ouvre la page « /settings/about »
    Et je clique sur le bouton « Bêta »
    Alors je vois le titre « Version 0.4.0-beta.1 disponible »

  @CA-REGL-37
  @NF-18
  Scénario: Après une mise à jour, le bandeau l'annonce une fois et mène aux nouveautés
    Étant donné Bosco est passé de la version « 0.1.0 » à la version « 0.2.0 »
    Quand j'ouvre la page « / »
    Et je clique sur le lien « Voir les nouveautés »
    Alors je suis sur la page « /settings/about »
    Quand j'ouvre la page « / »
    Alors je ne vois plus le texte « Bosco 0.2.0 installé »

  @CA-REGL-38
  Scénario: L'avis d'une version disponible se ferme et ne revient pas
    Étant donné GitHub publie les versions 0.2.0, 0.3.0 et 0.4.0-beta.1
    Et j'ouvre la page « /settings/about »
    Et je clique sur le bouton « Vérifier maintenant »
    Quand j'ouvre la page « / »
    Et je clique sur le bouton « Fermer le bandeau »
    Et je recharge la page
    Alors je ne vois plus le texte « Version 0.3.0 disponible »

  @mobile
  @CA-REGL-34
  Scénario: Sur le téléphone, la version et les mises à jour se lisent sans réglage
    Quand j'ouvre la page « /settings/about »
    Alors je vois le texte « Jamais vérifiée · canal stable »
    Et je ne vois pas l’interrupteur « Chercher les nouvelles versions »
    Et je ne vois pas le bouton « Vérifier maintenant »
