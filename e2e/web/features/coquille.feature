# language: fr
@NF-18
Fonctionnalité: Coquille
  La coquille donne accès aux écrans : une barre latérale sur le poste, des onglets en bas sur le téléphone.

  Scénario: La vue d'ensemble s'ouvre dans la coquille
    Quand j'ouvre la page « / »
    Alors je vois le lien « Vue d’ensemble »
    Et la page est accessible

  @mobile
  Scénario: Sur téléphone, les onglets du bas mènent aux écrans
    Quand j'ouvre la page « / »
    Alors je vois le lien « Ensemble »
    Et la page est accessible
