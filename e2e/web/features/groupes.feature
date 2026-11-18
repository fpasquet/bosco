# language: fr
@RF-CONT-19
@RF-CONT-20
@RF-CONT-21
Fonctionnalité: Groupes de projets
  En tant que développeur, je veux réunir mes projets en groupes et écrire des instructions qui arrivent aux agents de
  chacun de leurs projets, afin d'écrire une seule fois ce qui vaut pour plusieurs projets.

  Contexte:
    Étant donné le profil Claude Code « .claude » contient le transcript « session-maison-recettes.jsonl » de la session « 5e0a91c3 »
    Et Bosco surveille les profils « .claude » et « .claude-perso »
    Et les dossiers « maison » et « site-perso » sont des projets

  @CA-CONT-146
  @CA-CONT-147
  @NF-18
  Scénario: Un nouveau groupe réunit les projets cochés, le premier coché en principal, et s'affiche dans la barre latérale
    Quand j'ouvre la page « /projects »
    Et je clique sur le bouton « Nouveau groupe »
    Et je saisis « Node.js » dans le champ « Nom »
    Et je coche « site-perso »
    Et je coche « maison »
    Alors je vois le texte « 2 projets cochés »
    Et la page est accessible
    Quand je clique sur le bouton « Créer le groupe »
    Alors je suis sur la page « /groups/2/settings »
    Et la liste « Projets du groupe » contient « site-perso »
    Et je vois l’étiquette « principal »
    Et je vois le lien « Node.js »
    Et la page est accessible

  @CA-CONT-145
  Scénario: Un nom déjà pris par un groupe est refusé sous le champ
    Étant donné le groupe « Node.js » réunit le projet « site-perso »
    Quand j'ouvre la page « /projects »
    Et je clique sur le bouton « Nouveau groupe »
    Et je saisis « node.js » dans le champ « Nom »
    Et je clique sur le bouton « Créer le groupe »
    Alors je vois le texte « Un groupe porte déjà ce nom. »

  @CA-CONT-113
  @CA-CONT-126
  Scénario: Un projet rejoint un groupe qui a des instructions depuis la liste, après une confirmation
    Étant donné le groupe « Node.js » réunit le projet « site-perso »
    Et le groupe « Node.js » a l’instruction « Les textes lus sont en français. »
    Quand j'ouvre la page « /projects »
    Et je clique sur le bouton « Ajouter à un groupe : maison »
    Et je clique sur l’élément de menu « Node.js »
    Alors je vois le texte « Les instructions du groupe arriveront aux prochains agents de »
    Quand je clique sur le bouton « Ajouter » de la confirmation
    Alors la liste « Projets » contient « ~/maison · Node.js »

  @CA-CONT-140
  @CA-CONT-141
  @CA-CONT-142
  @NF-18
  Scénario: Les instructions d'un groupe s'enregistrent après une confirmation qui compte les projets touchés
    Étant donné le groupe « Node.js » réunit le projet « site-perso »
    Quand j'ouvre la page « /groups/2/instructions »
    Et je saisis « Les textes lus sont en français. » dans le champ « Instructions de Node.js »
    Et je clique sur le bouton « Enregistrer »
    Alors je vois le texte « Elles seront transmises aux prochains agents de »
    Et la page est accessible
    Quand je clique sur le bouton « Enregistrer » de la confirmation
    Et je clique sur le bouton « Aperçu du texte transmis »
    Alors je vois le texte « ## Instructions du groupe Node.js »

  @CA-CONT-137
  @NF-18
  Scénario: Un groupe masqué quitte la barre latérale et reste ouvert depuis les projets
    Étant donné le groupe « Node.js » réunit le projet « site-perso »
    Quand j'ouvre la page « /groups/2/settings »
    Alors je vois le lien « Node.js »
    Et la page est accessible
    Quand je bascule l’interrupteur « Afficher dans la barre latérale »
    Alors la barre latérale ne montre pas le groupe « Node.js »
    Quand j'ouvre la page « /projects »
    Et je clique sur le lien « Node.js »
    Alors je suis sur la page « /groups/2/sessions »

  @CA-CONT-138
  Scénario: Supprimer un groupe ne retire aucun de ses projets
    Étant donné le groupe « Node.js » réunit le projet « site-perso »
    Quand j'ouvre la page « /groups/2/settings »
    Et je clique sur le bouton « Supprimer le groupe »
    Alors je vois le texte « Aucun projet n’est retiré : ils restent dans Bosco, avec leurs sessions et leurs décisions. »
    Quand je clique sur le bouton « Supprimer le groupe » de la confirmation
    Alors je suis sur la page « /projects »
    Et la liste « Projets » contient « site-perso »

  @CA-CONT-143
  Scénario: « Tous les projets » n'a que ses instructions et n'apparaît pas dans la barre latérale
    Quand j'ouvre la page « /groups/1 »
    Alors je suis sur la page « /groups/1/instructions »
    Et je vois le texte « Instructions transmises aux agents de tous les projets »
    Et les onglets du groupe sont « Instructions »
    Et la barre latérale ne montre pas le groupe « Tous les projets »

  @mobile
  @CA-CONT-144
  @RF-CONT-24
  Scénario: Sur le téléphone, les instructions d'un groupe se lisent seulement
    Étant donné le groupe « Node.js » réunit le projet « site-perso »
    Et le groupe « Node.js » a l’instruction « Les textes lus sont en français. »
    Quand j'ouvre la page « /groups/2/instructions »
    Alors je vois le texte « Modifiable depuis le poste. Les instructions se rédigent depuis le poste seulement. »
    Et je vois le texte « Les textes lus sont en français. »

  @CA-CONT-142
  Scénario: L'aperçu des instructions de « Tous les projets » se lit pour le projet choisi, le premier par ordre alphabétique d'abord
    Quand j'ouvre la page « /groups/1/instructions »
    Et je clique sur le bouton « Aperçu du texte transmis »
    Alors la liste « pour le projet » vaut « maison »
    Quand je choisis « site-perso » dans la liste « pour le projet »
    Alors je vois le titre « Texte transmis à un agent de site-perso »

  @CA-CONT-174
  Scénario: L'aperçu des instructions d'un groupe de plusieurs projets se lit pour chacun, le projet principal d'abord
    Étant donné le groupe « Perso » réunit les projets « site-perso » et « maison »
    Et le groupe « Perso » a l’instruction « Aucun service payant ni de télémétrie. »
    Quand j'ouvre la page « /groups/2/instructions »
    Et je clique sur le bouton « Aperçu du texte transmis »
    Alors la liste « pour le projet » vaut « site-perso »
    Quand je choisis « maison » dans la liste « pour le projet »
    Alors je vois le titre « Texte transmis à un agent de maison »

  @mobile
  @CA-CONT-139
  Scénario: Sur le téléphone, un groupe se lit seulement, et une session y démarre depuis son en-tête
    Étant donné le profil Claude Code « .claude » a accès à l’abonnement Claude de « camille@exemple.dev »
    Et le groupe « Perso » réunit les projets « maison » et « site-perso »
    Quand j'ouvre la page « /groups/2/sessions »
    Et je clique sur le lien « Nouvelle session dans ce groupe »
    Et je saisis « Ajoute les catégories au budget du foyer » dans le champ « Premier message »
    Et je clique sur le bouton « Démarrer »
    Alors je vois le texte « Reçu : Ajoute les catégories au budget du foyer »

  @CA-CONT-135
  Scénario: « Parcourir les dossiers… » depuis un groupe y range les projets ajoutés
    Étant donné le groupe « Node.js » réunit le projet « site-perso »
    Et le dossier personnel contient les dossiers :
      | dossier        | git |
      | www/site-clubs | oui |
    Quand j'ouvre la page « /groups/2/settings »
    Et je clique sur le bouton « Parcourir les dossiers… »
    Alors la liste « Dans le groupe : » vaut « Node.js »
    Quand je clique sur le bouton « Ouvrir www »
    Et je coche « site-clubs »
    Et je clique sur le bouton « Ajouter 1 projet »
    Alors je vois le texte « Projet ajouté »
    Et je vois le bouton « Retirer site-clubs du groupe »
