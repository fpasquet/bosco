# language: fr
@RF-REGL-01
@RF-REGL-02
Fonctionnalité: Réglages
  En tant que développeur, je veux trouver les réglages globaux de Bosco au même endroit, en onglets, afin de ne pas
  chercher où se règle ce qui vaut pour tout le poste.

  Contexte:
    Étant donné Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-REGL-01
  @CA-REGL-04
  @NF-18
  Scénario: « Réglages » s'ouvre sur les sources, dans six onglets, sans l'accès du téléphone
    Quand j'ouvre la page « /settings »
    Alors je suis sur la page « /settings/sources »
    Et le fil d’Ariane est « Réglages › Sources »
    Et l’entrée « Réglages » de la barre latérale est active
    Et les onglets « Onglets des réglages » sont « Sources, Téléphone, Notifications, Abonnement Claude, Bac à sable, Données »
    Et je ne vois plus le texte « Accès depuis le téléphone »
    Et la page est accessible

  @CA-SESS-150
  Scénario: L'onglet Notifications garde « Réglages » actif et dit sa place
    Quand j'ouvre la page « /settings/sources »
    Et je clique sur le lien « Notifications » de la page
    Alors je suis sur la page « /settings/notifications »
    Et le fil d’Ariane est « Réglages › Notifications »
    Et l’entrée « Réglages » de la barre latérale est active

  @CA-REGL-01
  Scénario: L'ancienne page Sources et l'ancienne isolation mènent à leurs onglets
    Quand j'ouvre la page « /sources »
    Alors je suis sur la page « /settings/sources »
    Quand j'ouvre la page « /settings/isolation »
    Alors je suis sur la page « /settings/sandbox »

  @mobile
  @CA-REGL-05
  @NF-18
  Scénario: Sur le téléphone, l'onglet Réglages liste les six onglets puis les conteneurs, avant les sources
    Quand j'ouvre la page « / »
    Et je clique sur le lien « Réglages »
    Alors je suis sur la page « /settings/sources »
    Et les onglets « Réglages du poste » sont « Sources, Téléphone, Notifications, Abonnement Claude, Bac à sable, Données, Conteneurs en cours »
    Et je vois le texte « Seuil d’inactivité »
    Et la page est accessible
