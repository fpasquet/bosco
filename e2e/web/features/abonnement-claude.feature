# language: fr
@DT-39
Fonctionnalité: Abonnement Claude
  En tant que développeur, je veux choisir l'abonnement que prennent mes nouvelles sessions et régler les seuils de
  son quota, afin qu'un bac à sable n'épuise pas ma fenêtre de 5 h ou ma semaine sans que je le sache.

  Contexte:
    Étant donné Bosco surveille les profils « .claude » et « .claude-perso »

  @CA-CONT-99
  @CA-REGL-12
  @NF-18
  Scénario: Les seuils du quota et leur portée se règlent dans l'onglet de l'abonnement
    Quand j'ouvre la page « /settings »
    Et je clique sur le lien « Abonnement Claude »
    Alors je suis sur la page « /settings/subscription »
    Et le fil d’Ariane est « Réglages › Abonnement Claude »
    Et je vois le titre « Abonnement Claude »
    Et je vois le texte « Quota de l’abonnement »
    Et la page est accessible
    Quand je clique sur le bouton radio « Sessions en bac à sable et pilotées sur le poste »
    Et je recharge la page
    Alors le bouton radio « Sessions en bac à sable et pilotées sur le poste » est coché
