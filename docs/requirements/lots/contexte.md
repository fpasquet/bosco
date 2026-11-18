<!-- Généré par export.mjs (skill requirements-doc) depuis sources/30-specs.md : ne pas modifier ici. -->

# <a id="32-lot-3-projets-groupes-et-contexte"></a>3.2 Lot 3 · Projets, groupes et contexte

## <a id="regles-fonctionnelles-du-lot"></a>Règles fonctionnelles du lot

- **RF-CONT-01** · **1. Chaque agent reçoit le contexte de son projet** au lancement : les instructions de « Tous les projets », celles de chacun des groupes du projet, puis les décisions acceptées du projet, qui l'emportent, et sa place dans l'architecture. Pour une session à plusieurs projets, le contexte de chaque projet est transmis, le projet principal d'abord. Les décisions seulement proposées ne sont pas transmises. Pour une session interactive, cela demande le suivi en direct, et le texte est limité à 10 000 caractères.
- **RF-CONT-02** · **2. Un agent propose, un humain décide** : un agent peut proposer une décision pendant son travail, jamais l'accepter, la modifier une fois acceptée ni changer un statut.
- **RF-CONT-03** · **3. Les socles s'empilent** · Retirée (17/11/2026) : les socles sont remplacés par les groupes et leurs instructions (règle 15 ; [E22](#e22a)).
- **RF-CONT-04** · **4.** Mise de côté avec les tâches (17/11/2026, DT-43) : elle réglait les liens vers les PR, tickets et pages de documentation joints à un travail.
- **RF-CONT-05** · **5.** Mise de côté avec les tâches (17/11/2026, DT-43) : elle gardait les accès aux intégrations dans Bosco, sans les transmettre aux agents.
- **RF-CONT-06** · **6. Une session en bac à sable tourne isolée** : dans un conteneur, avec sa copie du projet et un dossier personnel temporaire ; seule la branche se récupère.
- **RF-CONT-07** · **7. La sortie réseau suit une liste blanche** : l'agent ne joint que les domaines autorisés ; chaque refus est visible.
- **RF-CONT-08** · **8.** Mise de côté avec les tâches (17/11/2026, DT-43) : elle réglait les environnements de test jetables lancés pour un travail isolé.
- **RF-CONT-09** · **9. Contexte, instructions des groupes et isolation se règlent par toi seul** : aucune session ni aucun agent ne peut les modifier.
- **RF-CONT-10** · **10. Bosco garde les décisions** : elles s'y créent, s'y modifient et s'y acceptent, avec l'historique de chaque changement (auteur, date, note).
- **RF-CONT-11** · **11. Une décision acceptée se modifie avec une note, ou se remplace par une nouvelle** : ses versions précédentes restent lisibles, et le changement ne touche que les agents lancés ensuite.
- **RF-CONT-12** · **12.** Mise de côté avec les tâches (17/11/2026, DT-43) : elle fixait l'abonnement Claude du travail confié à Bosco en arrière-plan et son arrêt quand la limite est atteinte.
- **RF-CONT-13** · **13. Ce que Bosco fait tourner se voit et s'arrête** : les tours de sessions pilotées et les bacs à sable démarrés sont listés avec ce qu'ils consomment, par rapport à leur plafond ; Bosco ne lance rien à la main, il interrompt un tour après une confirmation qui dit ce que cela provoque.
- **RF-CONT-14** · **14.** Mise de côté avec les tâches (17/11/2026, DT-43) : elle permettait la lecture de Jira et de Confluence, sans écriture, par les agents de ce travail.
- **RF-CONT-15** · **15. Les instructions d'un groupe s'ajoutent au contexte de chacun de ses projets**, après celles de « Tous les projets » ; une décision acceptée du projet l'emporte sur une instruction, et le texte transmis le dit. Elles se règlent dans le groupe ([E22b](#e22b)).
- **RF-CONT-16** · **16. Un projet est un dossier que tu ajoutes** : Bosco n'en crée plus seul. Le plus souvent, c'est un dépôt git ; un dossier sans git est accepté, mais ses sessions ne tournent pas en bac à sable. Son nom est celui du dossier ; si un autre projet porte déjà ce nom, le dossier parent le précède (« clients/api »), puis un numéro en dernier recours (« api (2) ») ; le nom se change dans les réglages du projet.
- **RF-CONT-17** · **17. Les projets s'ajoutent en parcourant les dossiers du poste**, sans saisir de chemin : on part du dossier personnel et on coche un ou plusieurs dossiers. Seuls les noms de dossiers se voient, jamais les fichiers ; les dossiers cachés sont masqués. Cela se fait depuis le poste seulement.
- **RF-CONT-18** · **18. Une session se range dans le projet qui contient son dossier de travail** : le plus profond l'emporte, et un worktree va avec son projet d'origine. Hors de tout projet, elle se range sous « Hors projet », toujours visible. Les dossiers où une session a tourné hors projet sont proposés en suggestions, à ajouter d'un clic ou à ignorer ; jamais les dossiers temporaires (/tmp et ceux du système), le dossier personnel lui-même ni les dossiers de Bosco : leurs sessions restent sous « Hors projet », et ils s'ajoutent quand même à la main par le navigateur.
- **RF-CONT-19** · **19. Un groupe réunit des projets**, et un projet peut être dans plusieurs groupes. Il sert à filtrer et à regrouper la vue d'ensemble et l'historique, à démarrer une session sur ses projets (le projet principal en tête) et à transmettre des instructions à leurs agents. Il remplace les socles : « Tous les projets » remplace le socle commun.
- **RF-CONT-20** · **20. Les instructions d'un groupe s'ajoutent au contexte de chacun de ses projets**, après celles de « Tous les projets » ; une décision acceptée du projet l'emporte. Changer les instructions d'un groupe, ou ses projets quand il a des instructions, demande une confirmation qui compte les projets touchés ; les agents déjà lancés ne sont pas touchés.
- **RF-CONT-21** · **21. Retirer un projet ne touche à rien sur le poste** : ses sessions passent sous « Hors projet », ses décisions sont gardées et reviennent s'il est ajouté de nouveau, et il sort de ses groupes. Supprimer un groupe ne retire aucun projet.
- **RF-CONT-22** · **22. Une nouvelle session reprend des valeurs par défaut pour son profil, ses autorisations, son modèle et son effort**, dans cet ordre : le choix de la session, le groupe choisi au démarrage, le projet principal, le profil réglé dans Bosco ([E4g](reglages.md#e4a)), puis ce que dit le profil Claude Code ; pour le profil lui-même : la session, le groupe, le projet, le profil par défaut. Chaque champ dit d'où vient sa valeur (« défaut du groupe », « défaut du projet api-tarifs »), et Bosco garde ces réglages sans modifier le profil Claude Code. Sans valeur à aucun niveau, un bac à sable démarre en « Accepter les modifications ». « Où elle tourne » reprend le dernier choix du projet principal. L'ordre complet est la règle 16 du lot 1 ; ils se règlent dans [E21a](#e21a) et [E22a](#e22a).
- **RF-CONT-23** · **23. Au passage à cette version**, chaque dépôt découvert et affiché devient un projet, et les dépôts masqués deviennent des suggestions ignorées. Le socle commun devient « Tous les projets » ; chaque socle partagé devient un groupe, dont les décisions deviennent les instructions, et les projets d'un socle qui en héritait rejoignent aussi le groupe parent. Une exception devient une décision ordinaire du projet.
- **RF-CONT-24** · **24. Projets et groupes se règlent par toi seul**, depuis le poste : le téléphone les lit, et peut démarrer une session avec un groupe.

## <a id="e20"></a>E20 · Projets

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e20.html` · implémentation : **En cours (En cours (feat/chosen-projects, feat/navigation-by-place) : E20a à E20d. Reste : puce « monodépôt », choix du groupe dans le navigateur, entrée « Usage » du menu ⋯.)**

### <a id="e20a"></a>E20a · Projets : liste, suggestions et groupes

Les dossiers que tu as choisis pour Bosco, les groupes qui les réunissent et les dossiers proposés d'après tes sessions. C'est la page « Tous les projets » : elle remplace l'onglet « Projets » des Réglages et les dépôts découverts tout seuls.

- **Depuis** « Tous les projets » dans la barre latérale · l'onglet Projets du téléphone · le fil d'Ariane « Projets » d'une page de projet ([E21c](#e21c))
- **Ensuite** [E20b](#e20b) avec « Ajouter des projets » · [E21c](#e21c) en cliquant sur un projet · [E22d](#e22d) en cliquant sur un groupe · [E22c](#e22c) avec « Nouveau groupe »

Règles de l'écran :

1. Les projets sont les dossiers que tu as ajoutés toi-même (règle 16) : Bosco n'en découvre plus. Un dossier sans git est accepté et porte la mention « sans git » ; ses sessions ne tournent pas en bac à sable. Un monodépôt (creneaux, sejours, maison) est un seul projet, repéré par sa puce « monodépôt » : ses paquets sont des sous-dossiers. « Ajouter des projets », dans l'en-tête, ouvre le navigateur de dossiers, comme le ＋ de l'intitulé « Projets » de la barre latérale.
2. Une session se range dans le projet qui contient son dossier de travail ; si aucun ne le contient, elle se range sous « Hors projet », ligne toujours visible, qui ne s'ouvre pas comme un projet (règle 18). Dans la barre latérale, « Hors projet » reste sous les projets.
3. Les suggestions sont les dossiers où une session a tourné hors de tes projets. « Ajouter » en fait un projet sans groupe ; « Ignorer » cesse de proposer ce dossier, qu'on retrouve ensuite par un lien « Ignorés · 1 ».
4. Les groupes réunissent des projets (règle 19) : un projet peut être dans plusieurs groupes. « Nouveau groupe », dans l'en-tête, comme le ＋ de l'intitulé « Groupes » de la barre latérale, ouvre la création ([E22c](#e22c)). « Tous les projets » contient toujours les 15 projets et n'a que des instructions. Un groupe masqué de la barre latérale garde l'icône d'un œil barré.
5. Au passage à cette version, chaque dépôt affiché est devenu un projet et chaque socle partagé un groupe (règle 23) : le compte de 15 projets reprend les dépôts qui étaient affichés. La barre latérale, elle, ne montre que les projets épinglés ou qui ont une session ouverte.
6. Un clic sur un projet ouvre sa page ([E21c](#e21c)), un clic sur un groupe ouvre la sienne ([E22d](#e22d)) ; la ligne « Tous les projets » de la barre latérale est active ici. Ajouter des projets et créer un groupe valent tout de suite et se font par toi seul (règle 24).

**Mobile** : c'est l'onglet « Projets » du téléphone, à la racine et non un écran poussé : les projets avec leurs groupes en petit, puis les groupes, en lecture seule ; un projet s'ouvre sur sa page, et le bandeau « Modifiable depuis le poste » explique ce qui reste réservé au poste.

### <a id="e20b"></a>E20b · Ajouter des projets : navigateur de dossiers

Une fenêtre qui parcourt les dossiers du poste : on coche un ou plusieurs dossiers, avec un groupe facultatif, et Bosco en fait des projets.

- **Depuis** [E20a](#e20a) avec « Ajouter des projets » · le ＋ de l'intitulé « Projets » de la barre latérale · [E20c](#e20c) · [E22a](#e22a) avec « Parcourir les dossiers… »
- **Ensuite** [E20a](#e20a) après « Ajouter 2 projets », avec les nouveaux projets dans la liste

Règles de l'écran :

1. Le navigateur part du dossier personnel, ou du dernier dossier ouvert. Le fil d'Ariane et « Dossier parent » remontent d'un cran. Seuls les dossiers s'affichent, jamais les fichiers, et les dossiers cachés sont masqués : on ne saisit aucun chemin (règle 17).
2. Entrer dans un dossier garde la sélection. Un dossier déjà ajouté est grisé et coché. Un dossier situé dans un projet déjà ajouté peut être ajouté à son tour, par exemple un sous-projet d'un monodépôt : la session se range alors dans le plus profond (règle 18).
3. Chaque dossier porte la mention « git » quand c'est un dépôt git. Un dossier sans git est accepté, avec l'avertissement « pas de bac à sable » : ses sessions tournent seulement sur le poste. La mention « suggestion » marque un dossier où une session a déjà tourné.
4. Le lien « Cocher les 2 dépôts git non ajoutés de ce dossier » coche d'un coup les dépôts git qui ne sont pas encore des projets.
5. Le groupe est facultatif : « Aucun groupe » par défaut. Ajouter range aussitôt les sessions déjà lues de ces dossiers, qui quittent « Hors projet ».

**Mobile** : pas de navigateur de dossiers : l'écran « Projets » en lecture seule porte un encart « Ajouter des projets se fait depuis le poste ».

### <a id="e20c"></a>E20c · Aucun projet encore

Le premier lancement, après le choix des profils, ou le passage à cette version sans aucun dépôt affiché : rien n'est rangé tant qu'aucun projet n'est choisi, et Bosco propose les dossiers où des sessions ont déjà tourné.

- **Depuis** le premier lancement, après le choix des profils ([E4a](reglages.md#e4a)) · « Tous les projets » dans la barre latérale quand il n'y a aucun projet
- **Ensuite** [E20b](#e20b) avec « Ajouter des projets » · [E20a](#e20a) après « Ajouter 5 projets »

Règles de l'écran :

1. Aucune session n'est perdue : tant qu'aucun projet n'existe, la vue d'ensemble range toutes les sessions sous « Hors projet » (règle 18). Elles rejoignent leur projet dès qu'il est ajouté.
2. Les suggestions viennent des sessions déjà lues par Bosco : les dossiers les plus actifs viennent en premier, avec leur nombre de sessions.
3. Les cases sont pré-cochées pour les dépôts git dont une session date de moins de 7 jours ; un dossier sans git ne l'est jamais. « Ajouter 5 projets » les ajoute d'un coup, sans groupe.
4. Tout se fait depuis le poste : sur le téléphone, l'onglet Projets se lit et renvoie au poste (règle 24).

**Mobile** : même état vide, en lecture seule : les suggestions sont listées sans case, et un encart renvoie au poste pour les ajouter.

### <a id="e20d"></a>E20d · Menu d'actions d'un projet

Le bouton ⋯ à droite de chaque projet et de chaque groupe de la barre latérale ouvre ses actions, sans quitter la page où l'on est. Ici, le menu d'api-tarifs ouvert depuis la vue d'ensemble.

- **Depuis** le bouton ⋯ d'un projet ou d'un groupe de la barre latérale, de n'importe quelle page · le bouton ⋯ de l'en-tête d'une page de projet ([E21c](#e21c)) ou de groupe ([E22d](#e22d)) · l'onglet Projets du téléphone
- **Ensuite** [E16a](sessions.md#e16a) avec « Nouvelle session dans api-tarifs » · [E21c](#e21c) avec « Sessions » · [E9a](#e9a) avec « Contexte » · [E21a](#e21a) avec « Réglages » · [E21b](#e21b) avec « Retirer le projet… » · [E22d](#e22d) avec le menu d'un groupe

Règles de l'écran :

1. Chaque projet et chaque groupe de la barre latérale a un bouton ⋯, tout à droite de sa ligne, après son compteur. Il reste discret : il apparaît sur la ligne active, au survol et au focus clavier (Tab, puis Entrée ou Espace ouvre le menu ; Échap le ferme). Un clic sur le reste de la ligne ouvre la page du projet ou du groupe, pas ce menu. Tant que le menu est ouvert, la ligne du projet reste en surbrillance, ⋯ enfoncé.
2. Les actions d'un projet : « Nouvelle session dans api-tarifs » (le formulaire s'ouvre avec le projet choisi), « Sessions », « Contexte » (avec le compteur des décisions à valider) et « Réglages » ouvrent les onglets de sa page ; « Usage » ouvre la page Usage filtrée sur ce projet ([E23a](sessions.md#e23a)) ; « Ajouter à un groupe » ouvre un sous-menu des groupes, avec « Nouveau groupe… » ; « Désépingler de la barre latérale » ; « Retirer le projet… » en rouge, qui ouvre la confirmation d'E21b. La liste est appelée à s'allonger.
3. Le menu d'un groupe : « Nouvelle session dans ce groupe », « Sessions », « Instructions », « Usage », « Réglages », « Masquer de la barre latérale » et « Supprimer le groupe… » en rouge. Supprimer un groupe ne retire aucun projet (règle 21).
4. Les boutons ＋ des intitulés : celui de « Projets » ouvre le navigateur de dossiers ([E20b](#e20b)), celui de « Groupes » ouvre « Nouveau groupe » ([E22c](#e22c)).
5. La barre latérale ne montre que les projets épinglés et ceux qui ont une session ouverte, puis « Tous les projets » ([E20a](#e20a)), qui les liste tous. Un projet qu'on vient d'ajouter n'est pas épinglé : il y apparaît dès qu'il a une session ouverte, et s'épingle par ce menu. Le projet dont la page est ouverte y apparaît aussi le temps de la visite, ligne active. « Hors projet » ouvre « Tous les projets » sur sa section « Hors projet ». « Désépingler » ne retire rien : le projet quitte seulement la barre latérale, tant qu'aucune session n'y est ouverte.

**Mobile** : l'onglet « Projets » ([E20a](#e20a)) ouvre une feuille du bas sur un projet : « Nouvelle session », « Sessions », « Contexte » et « Réglages » (en lecture seule). Ni retrait ni ajout à un groupe depuis le téléphone (règle 24).

## <a id="e21"></a>E21 · Page d'un projet

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e21.html` · implémentation : **Livré (Développé (feat/navigation-by-place, feat/multi-project-sessions, feat/session-defaults) : page d'un projet (Sessions, Contexte, Réglages), « Aussi dans ce projet », domaines du projet, valeurs par défaut des sessions. Accepté : les menus des valeurs par défaut n'ont pas d'icône, les modes en ont dans la zone de message et E4g.)**

### <a id="e21c"></a>E21c · Page d'un projet : sessions

Le premier onglet de la page d'un projet, ici creneaux : ses sessions, son bandeau T'attend et ses indicateurs. Il remplace la vue d'ensemble filtrée par dépôt (E1c, retiré) : on arrive sur une page qui dit où l'on est, et non sur un filtre.

- **Depuis** le nom du projet dans la barre latérale · « Tous les projets » ([E20a](#e20a)) · le fil d'Ariane d'une session ([E2a](sessions.md#e2a)) · « Sessions » du menu ⋯ ([E20d](#e20d))
- **Ensuite** [E3a](sessions.md#e3a) via « Voir l'historique » · [E2b](sessions.md#e2b) et [E2a](sessions.md#e2a) au clic sur une session · [E9a](#e9a) avec l'onglet Contexte · [E21a](#e21a) avec l'onglet Réglages · [E16a](sessions.md#e16a) avec « Nouvelle session »

Règles de l'écran :

1. On arrive ici par le nom du projet dans la barre latérale, par « Tous les projets », par le fil d'Ariane d'une session (« Projets › creneaux ») ou par le menu ⋯ : dans tous les cas, la page dit sa place (« Projets › creneaux ») et la ligne du projet est active dans la barre latérale. Sessions est l'onglet par défaut ; le compteur de « Contexte » apparaît quand une décision attend ta validation (aucune ici).
2. Le bandeau T'attend et les indicateurs ne comptent que les sessions de ce projet, avec les mêmes boutons et les mêmes règles que la vue d'ensemble (règles 3 et 4 du lot 1) ; le coût du jour reste estimé (règle 5 du lot 1), terminées comprises. Les sessions terminées aujourd'hui, des plus récentes aux plus anciennes, mènent à l'historique déjà filtré sur le projet ([E3a](sessions.md#e3a)).
3. La colonne « Dossier » indique le sous-dossier où tourne la session : utile pour un monodépôt, où plusieurs paquets vivent côte à côte. Il n'y a pas d'intertitre de projet, puisqu'il n'y en a qu'un.
4. « Aussi dans ce projet » liste les sessions à plusieurs projets dont creneaux est un projet ajouté, et non le principal : elles comptent une seule fois, dans la page de leur projet principal, dont le nom suit la session avec le nombre de projets ajoutés ([E2k](sessions.md#e2k)). La ligne n'apparaît que s'il y en a.
5. « Nouvelle session » part de ce projet : le formulaire s'ouvre avec creneaux déjà choisi ([E16a](sessions.md#e16a)). Le bouton ⋯ à côté ouvre le même menu que dans la barre latérale ([E20d](#e20d)).

**Mobile** : écran poussé « creneaux », ouvert depuis l'onglet Projets, avec les onglets Sessions | Contexte | Réglages en haut. Le bandeau et la liste suivent la vue d'ensemble du téléphone, avec « Nouvelle session » en pleine largeur ; seules les deux dernières terminées sont montrées avant le lien vers l'historique.

### <a id="e21a"></a>E21a · Réglages d'un projet

L'onglet « Réglages » de la page d'un projet : son identité, ses groupes, les valeurs par défaut de ses sessions (profil, autorisations, modèle, effort, lieu d'exécution) et ses domaines pour le bac à sable. Les sessions et le contexte ont chacun leur onglet.

- **Depuis** l'onglet Réglages de la page d'un projet, ouverte par son nom dans la barre latérale ou par « Tous les projets » ([E20a](#e20a)) · « Réglages » du menu ⋯ ([E20d](#e20d)) · les onglets [E21c](#e21c) et [E9a](#e9a)
- **Ensuite** [E21b](#e21b) avec « Retirer le projet » · [E21c](#e21c) avec l'onglet Sessions · [E9a](#e9a) avec l'onglet Contexte · [E16a](sessions.md#e16a) avec « Nouvelle session » · [E22b](#e22b) en ajoutant le projet à un groupe qui a des instructions

Règles de l'écran :

1. L'en-tête est celui de toute page de projet : fil d'Ariane « Projets › api-tarifs », nom, chemin et branche, puce « git » (absente d'un dossier sans git), « Nouvelle session » et le menu ⋯ ([E20d](#e20d)). Les onglets sont Sessions ([E21c](#e21c)), Contexte ([E9a](#e9a), avec le compteur des décisions proposées par un agent qui attendent ta validation) et Réglages, celui-ci.
2. Un projet peut être dans plusieurs groupes. « Ajouter à un groupe » ouvre un menu des autres groupes, avec « Nouveau groupe… ». Ajouter le projet à un groupe qui a des instructions demande la confirmation d'E22b.
3. Ce sont les valeurs par défaut d'une nouvelle session dans ce projet (règle 22). Chaque ligne a un sélecteur dont la première option est « Hériter » : la valeur vient alors du profil, et la ligne dit d'où (« défaut du profil pro »). Ici, Modèle et Effort sont réglés pour le projet. L'ordre complet est celui de la règle 16 du lot 1 ; un groupe choisi au démarrage l'emporte sur le projet. « Où elle tourne » reprend le dernier choix fait ici, et le bac à sable est grisé, avec sa raison, pour un projet sans git. La branche de départ est celle que le bac à sable copie.
4. Les domaines du projet s'ajoutent à la liste générale du bac à sable (E11a) pour ses sessions. Une session sur plusieurs projets réunit ceux de tous ses projets.
5. « Retirer le projet » est volontairement discret : il ouvre la confirmation d'E21b.

**Mobile** : écran poussé « api-tarifs », ouvert depuis l'onglet Projets, avec les onglets Sessions | Contexte | Réglages en haut ; les cartes se lisent sans bouton de modification, et « Nouvelle session » reste possible.

### <a id="e21b"></a>E21b · Retirer le projet

La confirmation avant de retirer un projet de Bosco : elle dit ce qui change et rappelle que rien n'est supprimé sur le poste.

- **Depuis** [E21a](#e21a) avec « Retirer le projet » · « Retirer le projet… » du menu ⋯ ([E20d](#e20d))
- **Ensuite** [E20a](#e20a) après « Retirer le projet », avec le projet en suggestion

Règles de l'écran :

1. Retirer un projet ne touche à rien sur le poste (règle 21) : ses sessions passent sous « Hors projet » et ses décisions sont gardées, elles reviennent si le projet est ajouté de nouveau.
2. Le projet sort de ses groupes. Si c'était le projet principal d'un groupe, le suivant le devient, et la ligne le dit (ici, creneaux dans Club des Trois Lacs).
3. Une session pilotée par Bosco qui tourne encore dans ce projet empêche de le retirer : le bouton est grisé et une ligne en donne la raison. Il n'y en a pas dans cet exemple.
4. Le dossier reste sur le poste : le projet revient en suggestion tant qu'une session y a tourné, et s'ajoute de nouveau d'un clic.

**Mobile** : pas de retrait depuis le téléphone (règle 24) : la maquette est celle d'E21a en lecture seule, sans la zone « Retirer le projet », et le menu ⋯ du téléphone n'a pas cette action.

## <a id="e22"></a>E22 · Page d'un groupe

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e22.html` · implémentation : **En cours (En cours (feat/project-groups, feat/navigation-by-place, feat/session-defaults) : instructions, réglages avec valeurs par défaut des sessions, nouveau groupe, aperçu pour un projet choisi ; reste : choix du groupe dans le navigateur.)**

### <a id="e22d"></a>E22d · Page d'un groupe : sessions

Le premier onglet de la page d'un groupe, ici Club des Trois Lacs : les sessions de tous ses projets réunies, avec leur projet en colonne. Il remplace le filtre par groupe de la vue d'ensemble : on arrive sur la page du groupe, qui dit où l'on est.

- **Depuis** le nom du groupe dans la barre latérale · le menu ⋯ du groupe, « Sessions » ([E20d](#e20d)) · la page des groupes, « Tous les projets » ([E20a](#e20a)) · [E1g](sessions.md#e1g) en cliquant sur un groupe
- **Ensuite** [E2b](sessions.md#e2b) et [E2a](sessions.md#e2a) au clic sur une session · [E21c](#e21c) au clic sur un projet · [E16c](sessions.md#e16c) avec « Nouvelle session dans ce groupe » · [E22b](#e22b) avec l'onglet Instructions · [E22a](#e22a) avec l'onglet Réglages

Règles de l'écran :

1. Les sessions de tous les projets du groupe, une fois chacune : une session à plusieurs projets ne figure qu'une fois, même si plusieurs de ses projets sont dans le groupe. Le bandeau T'attend et les indicateurs ne comptent que ces sessions, avec les mêmes boutons et les mêmes règles que la vue d'ensemble (règles 3 et 4 du lot 1) ; le coût du jour (3,15 $) reste estimé.
2. La colonne « Projet » indique le projet principal de la session, suivi du nombre de projets ajoutés (« api-tarifs +2 », [E2k](sessions.md#e2k)) ; un clic sur le nom ouvre la page de ce projet ([E21c](#e21c)).
3. « Nouvelle session dans ce groupe » ouvre le formulaire avec le groupe déjà choisi et son projet principal en tête ([E16c](sessions.md#e16c)). Cette action est aussi possible depuis le téléphone.
4. On arrive ici par le nom du groupe dans la barre latérale, par le menu ⋯ du groupe, ou par « Tous les projets » ; dans tous les cas la page dit sa place (« Groupes › Club des Trois Lacs ») et la ligne du groupe est active dans la barre latérale. Un groupe masqué de la barre latérale s'ouvre depuis « Tous les projets ».

**Mobile** : écran poussé « Club des Trois Lacs », ouvert depuis l'onglet Projets, avec les onglets Sessions | Instructions | Réglages en haut. Le bandeau T'attend garde ses boutons ; la liste donne le projet sous le titre de chaque session.

### <a id="e22a"></a>E22a · Réglages d'un groupe

L'onglet « Réglages » de la page d'un groupe : son nom, ses projets dans l'ordre (le principal en tête), les valeurs par défaut de ses sessions (profil, autorisations, modèle, effort) et sa présence dans la barre latérale. Les sessions et les instructions ont chacune leur onglet.

- **Depuis** « Tous les projets » ([E20a](#e20a)) en cliquant sur un groupe · le nom du groupe dans la barre latérale, puis l'onglet Réglages · « Réglages » du menu ⋯ ([E20d](#e20d)) · [E21a](#e21a) en cliquant sur un groupe du projet
- **Ensuite** [E16c](sessions.md#e16c) avec « Nouvelle session dans ce groupe » · [E22d](#e22d) avec l'onglet Sessions · [E22b](#e22b) avec l'onglet Instructions · [E20b](#e20b) avec « Parcourir les dossiers… »

Règles de l'écran :

1. Un groupe réunit des projets, dans un ordre (règle 19). Le projet principal, marqué d'une étoile, est le dossier de travail des sessions démarrées avec le groupe (règle 14 du lot 1) ; « Définir comme principal » le change. « Ajouter des projets » propose les projets connus, puis « Parcourir les dossiers… » (E20b).
2. Ces valeurs s'appliquent à une nouvelle session démarrée avec ce groupe et l'emportent sur celles des projets du groupe (règle 22 ; ordre complet : règle 16 du lot 1). Ici, le profil pro et le mode « Approuver pour moi » sont réglés pour le groupe ; Modèle et Effort héritent, et chaque ligne dit d'où vient sa valeur (« défaut du projet principal »). La première option de chaque sélecteur est « Hériter ».
3. Un groupe masqué de la barre latérale reste utilisable depuis « Tous les projets » et dans les filtres ; seule sa ligne de la barre latérale disparaît.
4. « Nouvelle session dans ce groupe » ouvre le formulaire de nouvelle session avec ce groupe déjà choisi ; le bouton ⋯ à côté ouvre le menu du groupe ([E20d](#e20d)). Cette action est aussi possible depuis le téléphone.
5. Supprimer un groupe ne retire aucun projet (règle 21) : ils restent dans Bosco, avec leurs sessions et leurs décisions.
6. Ajouter ou retirer un projet d'un groupe qui a des instructions demande une confirmation qui compte les projets touchés (règle 20), comme dans E22b.

**Mobile** : écran poussé en lecture seule, avec « Nouvelle session dans ce groupe » en pleine largeur en tête : démarrer une session avec un groupe est permis sur le téléphone.

### <a id="e22b"></a>E22b · Instructions d'un groupe et confirmation

L'onglet « Instructions » d'un groupe : le texte transmis aux agents de tous ses projets, l'ordre dans lequel il arrive, et la confirmation avant d'enregistrer, qui compte les projets touchés.

- **Depuis** [E22a](#e22a) avec l'onglet Instructions · « Instructions » du menu ⋯ d'un groupe ([E20d](#e20d)) · [E22d](#e22d) · [E21a](#e21a) en ajoutant le projet à un groupe qui a des instructions
- **Ensuite** [E9f](#e9f) avec « Aperçu du texte transmis » · [E22a](#e22a) après « Enregistrer »

Règles de l'écran :

1. Les instructions sont un texte libre, une consigne par ligne : c'est ce qui remplace les décisions des socles. Elles sont transmises aux agents de chacun des projets du groupe.
2. L'ordre du texte transmis à un agent d'api-tarifs : les instructions de « Tous les projets », celles de chacun de ses groupes, puis les décisions acceptées du projet, qui l'emportent en cas de conflit (règle 20). « Aperçu du texte transmis » ouvre l'aperçu d'E9f.
3. Enregistrer demande une confirmation qui compte les projets touchés. Elle précise que les agents déjà lancés ne sont pas touchés : ils gardent le contexte reçu au départ.
4. « Tous les projets » a le même onglet « Instructions », sans autres réglages : il contient toujours tous les projets et n'apparaît pas dans la barre latérale.
5. Aucune session ni aucun agent ne modifie ces instructions : elles se règlent par toi seul, depuis le poste (règle 24).

**Mobile** : les instructions se lisent (texte), avec la mention « Modifiable depuis le poste ».

### <a id="e22c"></a>E22c · Nouveau groupe

La fenêtre de création d'un groupe : un nom, une description facultative et les projets qu'il réunit.

- **Depuis** [E20a](#e20a) avec « Nouveau groupe » · le ＋ de l'intitulé « Groupes » de la barre latérale · [E21a](#e21a) avec « Nouveau groupe… » dans le menu « Ajouter à un groupe » (aussi dans [E20d](#e20d))
- **Ensuite** [E22a](#e22a) après « Créer le groupe »

Règles de l'écran :

1. Le nom est unique : s'il existe déjà, la création est refusée avec le message « Un groupe porte déjà ce nom. », sous le champ.
2. Les projets cochés forment le groupe ; le premier coché est le projet principal, ce que l'aide rappelle. Seuls les projets déjà ajoutés sont listés : un nouveau dossier s'ajoute d'abord par E20b.
3. Un groupe créé n'a pas d'instructions : rien ne change pour les agents de ses projets tant que tu n'en écris pas (E22b).
4. Le nouveau groupe est affiché dans la barre latérale par défaut ; ce réglage se change dans ses réglages (E22a).

**Mobile** : renvoi au poste : l'écran « Projets » en lecture seule, avec un encart « Créer un groupe se fait depuis le poste ».

## <a id="e9"></a>E9 · Contexte d'un projet

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e9.html` · implémentation : **En cours (En cours (feat/project-groups) : instructions des groupes à la place des socles, plus d'exception ; onglet Contexte de la page d'un projet avec la navigation. Le contexte d'une session à plusieurs projets réunit celui de chaque projet, le principal d'abord (feat/multi-project-sessions).)**

### <a id="e9a"></a>E9a · Contexte d'un projet

Tout ce que reçoit un agent au lancement dans un projet : les instructions de « Tous les projets » et de ses groupes, les décisions acceptées du projet, qui l'emportent, et sa place dans l'architecture. C'est l'onglet « Contexte » de la page du projet. Les décisions proposées par un agent attendent ta validation avant d'être transmises.

- **Depuis** l'onglet « Contexte » de la page d'un projet, ouverte par son nom dans la barre latérale (le compteur « 1 » indique une décision à valider) · « Contexte » du menu ⋯ ([E20d](#e20d)) · les onglets [E21c](#e21c) et [E21a](#e21a) · une notification de décision proposée
- **Ensuite** [E9b](#e9b) avec « Examiner » · [E9c](#e9c) avec « Nouvelle décision » · [E9d](#e9d) en ouvrant une décision · [E9f](#e9f) avec « Aperçu du texte transmis » · [E22b](#e22b) avec « Modifier » les instructions d'un groupe

Règles de l'écran :

1. Les décisions acceptées d'api-tarifs sont transmises à chaque agent au lancement, après les instructions des groupes, et la place du projet dans l'architecture suit (règle 1). Une décision ne nomme pas l'instruction qu'elle remplace : toutes les décisions du projet l'emportent sur les instructions des groupes, et le texte transmis le dit. Ouvrir une ligne affiche la décision, ses versions et ses liens ([E9d](#e9d)).
2. Les instructions viennent des groupes du projet : d'abord « Tous les projets », qui contient toujours tous les projets, puis chacun de ses groupes (règles 1 et 15). Elles se lisent ici et s'écrivent dans le groupe : « Modifier » ouvre ses instructions ([E22b](#e22b)). Une décision acceptée du projet l'emporte : elle reste transmise, avec la mention de l'instruction qu'elle remplace, et le texte transmis le dit.
3. Une décision seulement proposée n'est pas transmise : un agent propose, un humain décide (règle 2). Le bandeau n'apparaît que s'il y a des décisions à valider ; son compteur est repris sur l'onglet « Contexte » de la page du projet ; une décision proposée par un agent arrive aussi en notification. « Examiner » ouvre la décision ([E9b](#e9b)).
4. L'architecture dit ce que le projet appelle et qui l'appelle, pour que l'agent mesure l'effet de ses changements sur les autres projets.
5. « Aperçu du texte transmis » montre exactement le texte que lira l'agent au prochain lancement, décisions écartées et proposées exclues ([E9f](#e9f)).
6. Les décisions sont gérées dans Bosco : « Nouvelle décision » ouvre [E9c](#e9c), et chaque changement garde son auteur et sa date (règle 10). Cet écran se règle par toi seul, aucune session ni aucun agent ne peut le modifier (règle 9). Il n'y a plus de choix du projet : on arrive ici par l'onglet Contexte de la page du projet, par « Contexte » de son menu ⋯, ou depuis la notification d'une décision proposée. Quand le projet n'a aucune décision, l'écran le dit (« Aucune décision pour api-tarifs : elles arrivent proposées par un agent, ou écrites ici. ») et propose « Nouvelle décision ».

**Mobile** : écran poussé « api-tarifs » depuis la liste des projets, onglets Sessions | Contexte | Réglages. Le bandeau de la décision à valider passe en tête ; chaque bloc est repliable, seul le premier est ouvert.

### <a id="e9b"></a>E9b · Décision proposée par un agent, à valider

Une décision écrite par l'agent de la session « Monter TypeScript en version 6 » (en bac à sable) pendant son travail. Elle n'est transmise à personne tant que tu ne l'as pas acceptée, modifiée ou refusée.

- **Depuis** [E9a](#e9a) avec « Examiner »
- **Ensuite** [E9a](#e9a) une fois acceptée ou refusée · [Lot 1 · E2a](sessions.md#e2a) avec le lien vers la session

Règles de l'écran :

1. Seul un humain accepte : l'agent propose, il ne peut ni accepter sa décision, ni la modifier une fois acceptée (règle 2). « Accepter » enregistre la décision comme acceptée et ramène au contexte du projet ([E9a](#e9a)), où le bandeau disparaît.
2. La décision garde le format habituel des décisions : contexte, décision, conséquences, alternatives écartées. « Modifier avant d'accepter » rouvre ces champs ; la version acceptée est celle que tu as relue.
3. Une fois acceptée, la décision est transmise au lancement des prochains agents d'api-tarifs. Les agents déjà en cours ne la reçoivent pas (règle 1).
4. « Refuser » (avec un motif facultatif) passe la décision à « Refusée » : elle n'est jamais transmise et l'agent n'est pas relancé. Le motif est conservé avec la décision.
5. La décision est gardée dans Bosco avec son historique : auteur (l'agent de la session « Monter TypeScript en version 6 »), date de proposition, puis ta validation. Bosco ne garde pas de copie à part.

**Mobile** : écran poussé, sections repliables (Contexte et Décision ouvertes), barre basse « Refuser » / « Accepter » en 44 px. « Modifier avant d'accepter » et le motif de refus se font sur le poste.

### <a id="e9c"></a>E9c · Nouvelle décision

Bosco est le seul endroit où vivent les décisions : on les écrit ici, pour un projet. Une décision acceptée part dans le contexte des prochains agents.

- **Depuis** [E9a](#e9a) avec « Nouvelle décision »
- **Ensuite** [E9a](#e9a) après « Accepter la décision » ou « Garder en proposition »

Règles de l'écran :

1. Une décision porte sur un projet : « Porte sur » propose tous les projets, même ceux qui n'ont encore aucune décision, et part du projet dont on vient (la page [E9a](#e9a)). Il n'y a plus de décision de socle : ce qui vaut pour plusieurs projets s'écrit en instructions dans un groupe ([E22b](#e22b)).
2. Même format que les décisions proposées par un agent ([E9b](#e9b)). Titre, contexte et décision sont obligatoires.
3. Une décision acceptée du projet l'emporte sur les instructions de ses groupes : il n'y a rien à relier, le champ « Fait exception à » est retiré. Le texte transmis l'indique aux agents (règle 15, [E9f](#e9f)).
4. Une décision acceptée se modifie ou se remplace ensuite depuis [E9a](#e9a), sans perdre ses versions précédentes (règle 10). « Garder en proposition » la laisse hors du contexte transmis (règle 1).
5. Écrire une décision demande un clavier : le mobile renvoie vers le poste.

### <a id="e9d"></a>E9d · Décision acceptée et historique

Une décision acceptée se lit avec ses versions successives et ses liens. Elle se modifie avec une note, se remplace par une nouvelle décision ou s'abandonne, sans jamais perdre ce qui a été décidé avant.

- **Depuis** [E9a](#e9a) en ouvrant une ligne de décision
- **Ensuite** [E9e](#e9e) avec « Modifier » · [E9c](#e9c) avec « Remplacer »

Règles de l'écran :

1. Chaque changement crée une version qui garde son auteur, sa date et sa note ; la version 1 reste lisible à côté de la version actuelle (règle 11). Choisir une version l'affiche dans le corps de la page.
2. « Modifier » corrige le texte de la décision ([E9e](#e9e)) ; « Remplacer » en écrit une nouvelle ([E9c](#e9c)) quand c'est autre chose qui est décidé. La décision remplacée passe à « Remplacée » et garde un renvoi vers sa remplaçante.
3. « Abandonner » retire la décision du contexte transmis aux agents : elle n'est plus envoyée mais reste lisible avec son historique. Une confirmation est demandée, le motif est facultatif.
4. Les relations montrent ce qui touche la décision : DEC-6, proposée par un agent, la précise. Un clic ouvre l'élément lié.
5. Sur mobile, la décision se lit seulement : son historique et ses liens sont repliés (règle 9).

**Mobile** : écran poussé en lecture seule, sections repliables (Contexte et Décision ouvertes). Aucun bouton d'action : les changements se font sur le poste.

### <a id="e9e"></a>E9e · Modifier une décision acceptée

Corriger le texte d'une décision déjà acceptée. L'enregistrement crée une nouvelle version, avec une note obligatoire qui dit pourquoi ; les versions précédentes restent lisibles.

- **Depuis** [E9d](#e9d) avec « Modifier »
- **Ensuite** [E9d](#e9d) après « Enregistrer la version 3 » ou « Annuler »

Règles de l'écran :

1. Les champs reprennent le texte de la version 2 ; la partie changée est surlignée tant qu'elle n'est pas enregistrée, pour relire ce qui bouge. Titre, contexte et décision restent obligatoires ; le projet visé ne se change pas (pour une autre cible, « Remplacer » dans [E9d](#e9d)).
2. La note est obligatoire. Si elle est vide, « Enregistrer la version 3 » reste actif mais refuse l'enregistrement : le champ passe en erreur avec le message « Écris une note pour dire ce qui change. » et reçoit le focus. Aucune version n'est créée.
3. Le changement ne touche que les agents lancés ensuite (règle 11) : les sessions déjà lancées gardent la version 2 qu'elles ont reçue.
4. La version 3 s'ajoute à l'historique sans remplacer les précédentes : auteur, date et note sont gardés pour chacune (règle 10).
5. Écrire une décision demande un clavier : le mobile renvoie vers le poste.

**Mobile** : écran poussé qui renvoie vers le poste, comme pour une nouvelle décision ([E9c](#e9c)).

### <a id="e9f"></a>E9f · Aperçu du texte transmis

Le texte exact que lira un agent au prochain lancement dans api-tarifs, calculé à l'instant. Sert à vérifier le contexte avant de lancer ou à le copier.

- **Depuis** [E9a](#e9a) avec « Aperçu du texte transmis »
- **Ensuite** [E9a](#e9a) en fermant le panneau

Règles de l'écran :

1. C'est exactement ce que lit l'agent : instructions de « Tous les projets », puis de chacun des groupes du projet, décisions acceptées du projet qui l'emportent, place dans l'architecture (règles 1 et 15). Pour une session à plusieurs projets, le texte compte un bloc par projet, le projet principal d'abord, dans la limite de 10 000 caractères. « Copier » met ce texte dans le presse-papiers.
2. Les décisions seulement proposées par un agent n'y figurent pas (règle 2) ; la ligne du dessous rappelle ce qui manque, pour ne pas croire à un oubli. Une décision du projet ne retire aucune instruction : le texte annonce que les décisions du projet l'emportent sur toutes les instructions (règle 15). Pour un groupe, l'aperçu se calcule pour un projet choisi, le principal par défaut.
3. Le texte coûte des tokens à chaque lancement : l'estimation aide à juger si le contexte devient trop long.
4. L'aperçu est calculé à l'ouverture, à partir des décisions du moment. Il change dès qu'une décision est acceptée, modifiée ou abandonnée ; rouvrir le panneau le recalcule.

**Mobile** : écran poussé plein écran, en lecture seule. Le texte se fait défiler ; « Copier » reste en barre basse (44 px).

## <a id="e14"></a>E14 · Socles (retiré)

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e14.html` · implémentation : **Livré (Retiré du code (feat/project-groups).)**

### <a id="e14a"></a>E14a · SoclesRetiré

Remplacé par les groupes (E22) ; E14a, E14b et E14c sont gardés pour ne pas être réutilisés.

## <a id="criteres-dacceptation"></a>Critères d'acceptation

### <a id="e20-projets"></a>E20 · Projets

- **CA-CONT-109** · [E20a](#e20a) · Étant donné des dossiers ajoutés par la personne, quand elle ouvre « Tous les projets » dans la barre latérale (page « Projets », qui remplace l'ancien onglet des Réglages), alors elle voit ces projets, les groupes qui les réunissent et les suggestions, et Bosco n'a découvert aucun dépôt de lui-même (RF-CONT-16).
- **CA-CONT-110** · [E20a](#e20a) · Étant donné un projet qui est un dossier sans git, quand la personne consulte la liste, alors il porte la mention « sans git » et ses sessions ne tournent pas en bac à sable (RF-CONT-16).
- **CA-CONT-111** · [E20a](#e20a) · Étant donné une session dont le dossier de travail n'est dans aucun projet, quand la personne consulte la liste, alors la session est rangée sous la ligne « Hors projet », toujours visible, qui ne s'ouvre pas comme un projet (RF-CONT-18).
- **CA-CONT-112** · [E20a](#e20a) · Étant donné un dossier suggéré où une session a tourné hors de tout projet, quand la personne clique sur « Ajouter », alors il devient un projet sans groupe, et quand elle clique sur « Ignorer », alors le dossier n'est plus proposé et se retrouve par le lien « Ignorés · 1 » (RF-CONT-18).
- **CA-CONT-113** · [E20a](#e20a) · Étant donné un projet présent dans plusieurs groupes et le groupe « Tous les projets », quand la personne consulte les groupes, alors le projet apparaît dans chacun, « Tous les projets » contient les 15 projets et un groupe masqué de la barre latérale garde l'icône d'un œil barré (RF-CONT-19).
- **CA-CONT-114** · [E20b](#e20b) · Étant donné la fenêtre « Ajouter des projets » ouverte, quand la personne parcourt les dossiers, alors elle part du dossier personnel ou du dernier dossier ouvert, ne voit que des noms de dossiers sans fichiers ni dossiers cachés, remonte par le fil d'Ariane ou « Dossier parent » et ne saisit aucun chemin (RF-CONT-17).
- **CA-CONT-115** · [E20b](#e20b) · Étant donné un dossier coché puis un autre dossier ouvert, quand la personne entre dans ce dossier, alors sa sélection est conservée, et un dossier déjà ajouté est grisé et coché (RF-CONT-17).
- **CA-CONT-116** · [E20b](#e20b) · Étant donné un dossier situé dans un projet déjà ajouté, quand la personne l'ajoute à son tour, alors il devient un projet et la session se range dans le plus profond (RF-CONT-18).
- **CA-CONT-117** · [E20b](#e20b) · Étant donné un dossier git, un dossier sans git et un dossier où une session a déjà tourné, quand la personne les parcourt, alors le premier porte la mention « git », le deuxième est accepté avec l'avertissement « pas de bac à sable » et le troisième porte la mention « suggestion » (RF-CONT-16).
- **CA-CONT-118** · [E20b](#e20b) · Étant donné un dossier contenant 2 dépôts git non ajoutés, quand la personne clique sur « Cocher les 2 dépôts git non ajoutés de ce dossier », alors ces 2 dépôts sont cochés d'un coup.
- **CA-CONT-119** · [E20b](#e20b) · Étant donné 2 dossiers cochés avec « Aucun groupe » par défaut, quand la personne clique sur « Ajouter 2 projets », alors les nouveaux projets sont dans la liste d'[E20a](#e20a) et leurs sessions déjà lues quittent « Hors projet » (RF-CONT-18).
- **CA-CONT-120** · [E20c](#e20c) · Étant donné un premier lancement après le choix des profils, ou un passage à cette version sans aucun dépôt affiché, quand la personne ouvre « Tous les projets » alors qu'il n'y a aucun projet, alors Bosco lui propose les dossiers où des sessions ont déjà tourné et rien n'est rangé tant qu'aucun projet n'est choisi (RF-CONT-16).
- **CA-CONT-121** · [E20c](#e20c) · Étant donné qu'aucun projet n'existe, quand la personne ouvre la vue d'ensemble, alors toutes les sessions sont rangées sous « Hors projet » et rejoignent leur projet dès qu'il est ajouté (RF-CONT-18).
- **CA-CONT-122** · [E20c](#e20c) · Étant donné des suggestions issues des sessions déjà lues, quand la personne les consulte, alors les dossiers les plus actifs viennent en premier, avec leur nombre de sessions (RF-CONT-18).
- **CA-CONT-123** · [E20c](#e20c) · Étant donné 4 dépôts git dont une session date de moins de 7 jours et un dossier sans git, quand la personne ouvre l'écran, alors les 4 dépôts sont pré-cochés, le dossier sans git ne l'est jamais, et « Ajouter 4 projets » les ajoute d'un coup, sans groupe.
- **CA-CONT-124** · [E20c](#e20c) · Étant donné un téléphone, quand la personne ouvre cet état, alors les suggestions sont listées sans case et un encart renvoie au poste pour les ajouter (RF-CONT-24).
- **CA-CONT-149** · [E20a](#e20a) · Étant donné la page « Projets », quand la personne clique sur un projet ou sur un groupe, alors la page du projet ([E21c](#e21c)) ou du groupe ([E22d](#e22d)) s'ouvre, et la ligne « Tous les projets » de la barre latérale est active sur la page « Projets » (RF-CONT-16, RF-SESS-15).
- **CA-CONT-150** · [E20d](#e20d) · Étant donné chaque projet et chaque groupe de la barre latérale, quand la personne les parcourt, alors le bouton ⋯ est tout à droite de la ligne, après son compteur, et n'apparaît que sur la ligne active, au survol et au focus clavier (Tab, puis Entrée ou Espace ouvre le menu, Échap le ferme) ; un clic sur le reste de la ligne ouvre la page du projet ou du groupe, pas le menu, et la ligne reste en surbrillance tant que le menu est ouvert.
- **CA-CONT-151** · [E20d](#e20d) · Étant donné le menu ⋯ d'un projet, quand la personne l'ouvre, alors elle y trouve « Nouvelle session dans api-tarifs » (formulaire déjà rempli), « Sessions », « Contexte » (avec le compteur des décisions à valider) et « Réglages », qui ouvrent les onglets de sa page, « Ajouter à un groupe » (sous-menu des groupes avec « Nouveau groupe… »), « Désépingler de la barre latérale » et « Retirer le projet… » en rouge, qui ouvre la confirmation d'[E21b](#e21b) (RF-CONT-21).
- **CA-CONT-152** · [E20d](#e20d) · Étant donné le menu ⋯ d'un groupe, quand la personne l'ouvre, alors elle y trouve « Nouvelle session dans ce groupe », « Sessions », « Instructions », « Réglages », « Masquer de la barre latérale » et « Supprimer le groupe… » en rouge, et supprimer un groupe ne retire aucun projet (RF-CONT-21).
- **CA-CONT-153** · [E20d](#e20d) · Étant donné la barre latérale, quand la personne la lit ou clique sur « Désépingler », alors elle ne montre que les projets épinglés et ceux qui ont une session ouverte, puis « Tous les projets » qui les liste tous ; « Désépingler » ne retire rien, le projet quitte seulement la barre latérale tant qu'aucune session n'y est ouverte, et les boutons ＋ de « Projets » et de « Groupes » ouvrent le navigateur de dossiers ([E20b](#e20b)) et « Nouveau groupe » ([E22c](#e22c)).
- **CA-CONT-154** · [E20d](#e20d) · Étant donné un téléphone, quand la personne touche un projet de l'onglet « Projets », alors une feuille du bas propose « Nouvelle session », « Sessions », « Contexte » et « Réglages » en lecture seule, sans retrait ni ajout à un groupe (RF-CONT-24).

- **CA-CONT-172** · [E20a](#e20a) · Étant donné des sessions qui ont tourné dans /tmp, dans un dossier temporaire du système, dans le dossier personnel lui-même ou dans un dossier de Bosco, quand la personne ouvre « Tous les projets », alors aucun de ces dossiers n'est proposé en suggestion, leurs sessions restent sous « Hors projet » et le navigateur permet quand même de les ajouter (RF-CONT-18).
- **CA-CONT-173** · [E20b](#e20b) · Étant donné un projet nommé « api » déjà ajouté, quand la personne ajoute un autre dossier nommé « api », alors le nouveau projet prend le nom de son dossier parent suivi du sien (« clients/api »), puis un numéro si ce nom est encore pris (« api (2) »), et le nom se change ensuite dans les réglages du projet (RF-CONT-16).

- **CA-CONT-174** · [E22b](#e22b) · Étant donné un groupe de plusieurs projets, quand la personne ouvre l'aperçu du texte transmis depuis ses instructions, alors un choix « pour le projet … » propose ses projets, le projet principal d'abord (le premier par ordre alphabétique pour « Tous les projets »), et l'aperçu suit le projet choisi (RF-CONT-15).

- **CA-CONT-175** · [E20d](#e20d) · Étant donné un projet ni épinglé ni actif, quand la personne ouvre sa page (depuis « Tous les projets » ou un lien), alors il apparaît dans la barre latérale le temps de la visite, avec sa ligne active, puis disparaît quand elle quitte sa page (RF-SESS-15).
- **CA-CONT-176** · [E20a](#e20a) · Étant donné des sessions hors de tout projet, quand la personne clique sur « Hors projet » dans la barre latérale, alors « Tous les projets » s'ouvre sur sa section « Hors projet », qui liste ces sessions et les suggestions (RF-CONT-18).

### <a id="e21-page-dun-projet"></a>E21 · Page d'un projet

- **CA-CONT-125** · [E21a](#e21a) · Étant donné un projet, quand la personne ouvre sa page, alors l'en-tête montre le fil d'Ariane « Projets › api-tarifs », le nom, le chemin et la branche avec la puce « git » (absente d'un dossier sans git), « Nouvelle session » et le menu ⋯, puis les onglets Sessions, Contexte et Réglages, l'onglet « Contexte » affichant le compteur des décisions proposées par un agent qui attendent sa validation (RF-SESS-15).
- **CA-CONT-126** · [E21a](#e21a) · Étant donné un projet, quand la personne clique sur « Ajouter à un groupe », alors un menu liste les autres groupes avec « Nouveau groupe… », et ajouter le projet à un groupe qui a des instructions ouvre la confirmation d'[E22b](#e22b) (RF-CONT-20).
- **CA-CONT-127** · [E21a](#e21a) · Étant donné un projet sans git, quand la personne consulte « Où elle tourne », alors le bac à sable est grisé avec sa raison, et pour un projet avec git le réglage reprend le dernier choix fait ici (RF-CONT-22).
- **CA-CONT-128** · [E21a](#e21a) · Étant donné des domaines ajoutés à un projet, quand une session démarre sur plusieurs projets, alors elle réunit les domaines de tous ses projets en plus de la liste générale du bac à sable.
- **CA-CONT-129** · [E21a](#e21a) · Étant donné un téléphone, quand la personne ouvre un projet depuis l'onglet Projets, alors un écran poussé « api-tarifs » porte les onglets Sessions | Contexte | Réglages, les cartes se lisent sans bouton de modification, et « Nouvelle session » reste possible (RF-CONT-24).
- **CA-CONT-166** · [E21a](#e21a) · Étant donné l'onglet Réglages d'un projet, quand la personne le lit, alors les valeurs par défaut de ses sessions (profil, autorisations, modèle, effort, lieu d'exécution) ont chacune un sélecteur dont la première option est « Hériter » (RF-CONT-22).
- **CA-CONT-167** · [E21a](#e21a) · Étant donné une ligne du projet réglée sur « Hériter », quand la personne la regarde, alors la valeur vient du profil et la ligne dit d'où (« défaut du profil pro »), une valeur choisie ici (le modèle et l'effort, par exemple) valant pour ses nouvelles sessions (RF-CONT-22, RF-SESS-16).
- **CA-CONT-168** · [E21a](#e21a) · Étant donné un projet dont les valeurs par défaut sont réglées et une session lancée avec un groupe, quand les valeurs sont lues, alors le groupe choisi l'emporte sur le projet principal, lui-même avant le profil puis le profil Claude Code, et le choix de la session passe avant tout (RF-CONT-22, RF-SESS-16).
- **CA-CONT-130** · [E21b](#e21b) · Étant donné la confirmation « Retirer le projet », quand la personne la lit, alors elle indique que rien n'est supprimé sur le poste, que les sessions passent sous « Hors projet » et que les décisions sont gardées pour revenir si le projet est ajouté de nouveau (RF-CONT-21).
- **CA-CONT-131** · [E21b](#e21b) · Étant donné un projet qui est le projet principal d'un groupe, quand la personne le retire, alors il sort de ses groupes, le projet suivant devient principal et la ligne le dit (RF-CONT-21).
- **CA-CONT-132** · [E21b](#e21b) · Étant donné une session pilotée par Bosco qui tourne encore dans le projet, quand la personne ouvre la confirmation, alors le bouton est grisé et une ligne en donne la raison (RF-CONT-21).
- **CA-CONT-133** · [E21b](#e21b) · Étant donné un projet retiré dont une session a tourné, quand la personne revient sur [E20a](#e20a), alors le dossier est proposé en suggestion et s'ajoute de nouveau d'un clic (RF-CONT-21).
- **CA-CONT-155** · [E21c](#e21c) · Étant donné un projet creneaux, quand la personne y arrive par son nom dans la barre latérale, par « Tous les projets », par le fil d'Ariane d'une session ou par le menu ⋯, alors la page affiche « Projets › creneaux », la ligne du projet est active dans la barre latérale, Sessions est l'onglet par défaut et le compteur de « Contexte » n'apparaît que si une décision attend sa validation (RF-SESS-15).
- **CA-CONT-156** · [E21c](#e21c) · Étant donné la page d'un projet, quand la personne lit le bandeau T'attend, les indicateurs et le tableau, alors ils ne comptent que les sessions de ce projet, avec les mêmes boutons et règles que la vue d'ensemble, le coût du jour restant estimé, terminées comprises ; les sessions terminées aujourd'hui, des plus récentes aux plus anciennes, mènent par « Voir l'historique » à l'historique déjà filtré sur le projet ([E3a](sessions.md#e3a)).
- **CA-CONT-157** · [E21c](#e21c) · Étant donné un monodépôt dont plusieurs paquets ont des sessions, quand la personne regarde le tableau, alors la colonne « Dossier » indique le sous-dossier où tourne chaque session et aucun intertitre de projet n'est affiché.
- **CA-CONT-158** · [E21c](#e21c) · Étant donné une session à plusieurs projets dont creneaux est un projet ajouté et non le principal, quand la personne ouvre la page de creneaux, alors elle figure sous « Aussi dans ce projet », avec le nom du projet principal et le nombre de projets ajoutés, et elle ne compte qu'une fois, dans la page de son projet principal ; la ligne n'apparaît que s'il y en a (RF-SESS-14).
- **CA-CONT-159** · [E21c](#e21c) · Étant donné la page d'un projet, quand la personne clique sur « Nouvelle session », alors le formulaire s'ouvre avec creneaux déjà choisi, et le bouton ⋯ à côté ouvre le même menu que dans la barre latérale ; sur le téléphone, l'écran poussé « creneaux » a les onglets Sessions | Contexte | Réglages et seules les deux dernières sessions terminées sont montrées avant le lien vers l'historique ([E16a](sessions.md#e16a), [E20d](#e20d)).

### <a id="e22-page-dun-groupe"></a>E22 · Page d'un groupe

- **CA-CONT-134** · [E22a](#e22a) · Étant donné un groupe de plusieurs projets, quand la personne ouvre ses réglages, alors les projets sont dans l'ordre avec le principal marqué d'une étoile, et « Définir comme principal » change ce projet (RF-CONT-19).
- **CA-CONT-135** · [E22a](#e22a) · Étant donné un groupe, quand la personne clique sur « Ajouter des projets », alors les projets connus sont proposés, puis « Parcourir les dossiers… » ouvre [E20b](#e20b) (RF-CONT-19).
- **CA-CONT-136** · [E22a](#e22a) · ~~Étant donné un groupe avec un abonnement Claude par défaut, quand la personne clique sur « Nouvelle session dans ce groupe », alors le formulaire s'ouvre avec ce groupe déjà choisi et l'abonnement du groupe, à défaut l'abonnement par défaut de Bosco (RF-CONT-22).~~ Retiré (17/11/2026, profil proposé selon la cascade, CA-CONT-171).
- **CA-CONT-169** · [E22a](#e22a) · Étant donné l'onglet Réglages d'un groupe, quand la personne le lit, alors les valeurs par défaut de ses sessions (profil, autorisations, modèle, effort) ont chacune un sélecteur dont la première option est « Hériter », et la personne voit par exemple le profil pro et « Approuver pour moi » réglés pour le groupe (RF-CONT-22).
- **CA-CONT-170** · [E22a](#e22a) · Étant donné un groupe qui hérite d'une valeur, quand la personne regarde la ligne, alors elle dit d'où vient la valeur (« défaut du projet principal »), et les valeurs réglées pour le groupe l'emportent sur celles des projets du groupe pour une session démarrée avec lui (RF-CONT-22, RF-SESS-16).
- **CA-CONT-171** · [E22a](#e22a) · Étant donné un groupe, quand la personne clique sur « Nouvelle session dans ce groupe », alors le formulaire s'ouvre avec ce groupe déjà choisi et le profil du groupe, à défaut celui du projet principal, à défaut le profil par défaut de Bosco (RF-CONT-22).
- **CA-CONT-137** · [E22a](#e22a) · Étant donné un groupe masqué de la barre latérale, quand la personne utilise « Tous les projets » et les filtres, alors le groupe reste utilisable et seule sa ligne de la barre latérale a disparu.
- **CA-CONT-138** · [E22a](#e22a) · Étant donné un groupe supprimé, quand la personne consulte la liste, alors ses projets restent dans Bosco avec leurs sessions et leurs décisions (RF-CONT-21).
- **CA-CONT-139** · [E22a](#e22a) · Étant donné un téléphone, quand la personne ouvre un groupe, alors l'écran est en lecture seule avec « Nouvelle session dans ce groupe » en pleine largeur en tête, et la session peut être démarrée (RF-CONT-24).
- **CA-CONT-140** · [E22b](#e22b) · Étant donné le texte des instructions d'un groupe, une consigne par ligne, quand un agent d'un de ses projets démarre, alors il reçoit dans l'ordre les instructions de « Tous les projets », celles de chacun de ses groupes, puis les décisions acceptées du projet, qui l'emportent en cas de conflit (RF-CONT-20).
- **CA-CONT-141** · [E22b](#e22b) · Étant donné des instructions modifiées, quand la personne clique sur « Enregistrer », alors une confirmation compte les projets touchés et précise que les agents déjà lancés ne sont pas touchés (RF-CONT-20).
- **CA-CONT-142** · [E22b](#e22b) · Étant donné l'onglet « Instructions », quand la personne clique sur « Aperçu du texte transmis », alors l'aperçu d'[E9f](#e9f) s'ouvre.
- **CA-CONT-143** · [E22b](#e22b) · Étant donné « Tous les projets », quand la personne l'ouvre, alors il a le même onglet « Instructions » sans autres réglages, contient toujours tous les projets et n'apparaît pas dans la barre latérale (RF-CONT-19).
- **CA-CONT-144** · [E22b](#e22b) · Étant donné un téléphone, quand la personne ouvre les instructions, alors elles se lisent avec la mention « Modifiable depuis le poste » (RF-CONT-24).
- **CA-CONT-145** · [E22c](#e22c) · Étant donné un groupe qui porte déjà un nom, quand la personne crée un groupe avec ce même nom, alors la création est refusée avec le message « Un groupe porte déjà ce nom. » sous le champ.
- **CA-CONT-146** · [E22c](#e22c) · Étant donné plusieurs projets cochés dans la fenêtre, quand la personne clique sur « Créer le groupe », alors le premier coché est le projet principal et seuls les projets déjà ajoutés sont listés (RF-CONT-19).
- **CA-CONT-147** · [E22c](#e22c) · Étant donné un groupe qui vient d'être créé, quand la personne consulte ses réglages, alors il n'a pas d'instructions, rien ne change pour les agents de ses projets, et il est affiché dans la barre latérale par défaut (RF-CONT-20).
- **CA-CONT-148** · [E22c](#e22c) · Étant donné un téléphone, quand la personne cherche à créer un groupe, alors l'écran « Projets » en lecture seule affiche l'encart « Ajouter des projets se fait depuis le poste », avec l'icône écran, et n'offre ni ajout de projet ni création de groupe (RF-CONT-24).
- **CA-CONT-160** · [E22d](#e22d) · Étant donné un groupe, quand la personne ouvre sa page, alors elle réunit les sessions de tous ses projets, une seule fois chacune même si plusieurs de leurs projets sont dans le groupe, et le bandeau T'attend et les indicateurs ne comptent que ces sessions, avec les mêmes boutons et règles que la vue d'ensemble, le coût du jour restant estimé.
- **CA-CONT-161** · [E22d](#e22d) · Étant donné la page d'un groupe, quand la personne lit la colonne « Projet », alors elle indique le projet principal de la session suivi du nombre de projets ajoutés (« api-tarifs +2 »), et un clic sur le nom ouvre la page de ce projet ([E21c](#e21c)).
- **CA-CONT-162** · [E22d](#e22d) · Étant donné la page d'un groupe, quand la personne clique sur « Nouvelle session dans ce groupe », alors le formulaire s'ouvre avec le groupe déjà choisi et son projet principal en tête, y compris depuis le téléphone ([E16c](sessions.md#e16c)) (RF-CONT-22).
- **CA-CONT-163** · [E22d](#e22d) · Étant donné un groupe ouvert par son nom dans la barre latérale, par son menu ⋯ ou par « Tous les projets », quand la page s'affiche, alors le fil d'Ariane est « Groupes › Club des Trois Lacs », la ligne du groupe est active dans la barre latérale et les onglets sont Sessions, Instructions et Réglages ; un groupe masqué de la barre latérale s'ouvre depuis « Tous les projets » (RF-SESS-15).

### <a id="e9a-contexte-dun-projet"></a>E9a · Contexte d'un projet

- **CA-CONT-01** · [E9a](#e9a) · Étant donné le projet api-tarifs avec des décisions acceptées et un groupe qui contient api-tarifs avec des instructions, quand la personne ouvre l'onglet « Contexte » de la page du projet, alors elle voit les instructions de « Tous les projets » puis celles de chacun des groupes du projet, les décisions acceptées du projet et la place du projet dans l'architecture, qui sont transmises à chaque agent au lancement (RF-CONT-01, RF-CONT-15).
- ~~**CA-CONT-02** · [E9a](#e9a) · Étant donné une décision du dépôt reliée par « fait exception à » à une décision d'un socle, quand la personne consulte la liste, alors la décision du socle reste visible, barrée et marquée « Écartée », elle n'est pas transmise, et la décision du dépôt l'indique sous son titre (RF-CONT-03).~~ Retiré (17/11/2026, socles remplacés par les groupes, lot 5 : plus de « fait exception à », une décision du projet l'emporte (RF-CONT-15)).
- **CA-CONT-03** · [E9a](#e9a) · Étant donné une décision seulement proposée par un agent, quand la personne ouvre l'onglet « Contexte » de la page du projet, alors le bandeau de validation s'affiche avec son compteur, repris sur l'onglet « Contexte » de la page du projet, la décision n'est pas transmise, et « Examiner » ouvre la décision (RF-CONT-02).
- **CA-CONT-04** · [E9a](#e9a) · Étant donné aucune décision à valider, quand la personne ouvre l'onglet « Contexte » de la page du projet, alors le bandeau n'apparaît pas (RF-CONT-02).
- **CA-CONT-05** · [E9a](#e9a) · Étant donné l'onglet « Contexte » d'un projet, quand la personne choisit « Nouvelle décision », « Aperçu du texte transmis » ou « Modifier » sur les instructions d'un groupe, alors elle arrive respectivement sur [E9c](#e9c), [E9f](#e9f) et [E22b](#e22b) (RF-CONT-10, RF-CONT-15).
- **CA-CONT-164** · [E9a](#e9a) · Étant donné l'onglet « Contexte » d'un projet, quand la personne l'ouvre depuis la barre latérale, le menu ⋯ ou une notification de décision proposée, alors le fil d'Ariane est « Projets › api-tarifs › Contexte » et la ligne du projet est active dans la barre latérale (RF-SESS-15).
- ~~**CA-CONT-86** · [E9a](#e9a) · Étant donné des dépôts connus dont seuls certains ont une décision à eux, proposée ou acceptée, quand la personne ouvre le choix du dépôt, alors il ne propose que ces dépôts, plus celui qu'elle vient d'ouvrir ; quand aucun dépôt n'a de décision, l'écran affiche « Aucun dépôt n'a encore de décision : elles arrivent proposées par un agent, ou écrites ici. » avec « Nouvelle décision » (RF-CONT-10).~~ Retiré (17/11/2026, plus de choix du projet dans le contexte : on arrive depuis la page du projet ou la notification d'une décision proposée).

### <a id="e9b-decision-proposee-par-un-agent-a-valider"></a>E9b · Décision proposée par un agent, à valider

- **CA-CONT-06** · [E9b](#e9b) · Étant donné une décision proposée par un agent, quand la personne clique sur « Accepter », alors la décision est enregistrée comme acceptée, la personne revient au contexte du projet ([E9a](#e9a)) et le bandeau disparaît (RF-CONT-02).
- **CA-CONT-07** · [E9b](#e9b) · Étant donné une décision acceptée, quand les prochains agents d'api-tarifs sont lancés, alors ils la reçoivent, et les agents déjà en cours ne la reçoivent pas (RF-CONT-01).
- **CA-CONT-08** · [E9b](#e9b) · Étant donné une décision proposée, quand la personne clique sur « Modifier avant d'accepter », alors les champs contexte, décision, conséquences et alternatives écartées se rouvrent et la version acceptée est celle que la personne a relue (RF-CONT-10).
- **CA-CONT-09** · [E9b](#e9b) · Étant donné une décision proposée, quand la personne clique sur « Refuser » avec ou sans motif, alors la décision passe à « Refusée », elle n'est jamais transmise, l'agent n'est pas relancé et le motif est conservé avec la décision (RF-CONT-02).
- **CA-CONT-10** · [E9b](#e9b) · Étant donné une décision proposée, quand la personne consulte son historique, alors elle y voit l'auteur (l'agent), la date de proposition, puis la validation de la personne (RF-CONT-10).

### <a id="e9c-nouvelle-decision"></a>E9c · Nouvelle décision

- **CA-CONT-11** · [E9c](#e9c) · Étant donné le formulaire « Nouvelle décision », quand la personne ouvre « Porte sur », alors la décision porte sur un projet, par défaut celui de la page dont elle vient, et il n'y a plus de décision de socle : ce qui vaut pour plusieurs projets s'écrit en instructions dans un groupe ([E22b](#e22b)) (RF-CONT-15).
- **CA-CONT-12** · [E9c](#e9c) · Étant donné le formulaire « Nouvelle décision », quand la personne laisse vide le titre, le contexte ou la décision, alors la création est refusée car ces trois champs sont obligatoires (RF-CONT-10).
- ~~**CA-CONT-13** · [E9c](#e9c) · Étant donné une décision de dépôt, quand la personne renseigne « Fait exception à » avec une décision d'un socle, alors cette décision est retirée du socle pour ce seul dépôt et sans changement ailleurs ; le champ n'apparaît pas pour une décision de socle (RF-CONT-03).~~ Retiré (17/11/2026, socles remplacés par les groupes, lot 5 : plus de « Fait exception à », une décision acceptée du projet l'emporte sur les instructions (RF-CONT-15), voir CA-CONT-103).
- **CA-CONT-14** · [E9c](#e9c) · Étant donné une nouvelle décision, quand la personne choisit « Accepter la décision », alors elle est transmise aux prochains agents, et quand elle choisit « Garder en proposition », alors elle reste hors du contexte transmis (RF-CONT-01, RF-CONT-10).
- **CA-CONT-87** · [E9c](#e9c) · Étant donné une nouvelle décision de projet, quand la personne ouvre « Porte sur », alors tous les projets y figurent, même sans décision (RF-CONT-10).
- **CA-CONT-100** · [E9a](#e9a) · Étant donné les instructions de « Tous les projets » et des groupes du projet, quand la personne les lit dans l'onglet « Contexte », alors elles se lisent ici et s'écrivent dans le groupe : « Modifier » ouvre les instructions du groupe ([E22b](#e22b)) (RF-CONT-15).
- **CA-CONT-101** · [E9a](#e9a) · Étant donné des décisions acceptées du projet et des instructions de ses groupes, quand la personne consulte la liste, alors chaque instruction reste transmise, aucune décision ne nomme d'instruction, et le texte transmis annonce que les décisions du projet l'emportent sur toutes les instructions (RF-CONT-15).
- **CA-CONT-102** · [E9a](#e9a) · Étant donné un projet sans aucune décision, quand la personne ouvre l'onglet « Contexte », alors l'écran dit « Aucune décision pour api-tarifs : elles arrivent proposées par un agent, ou écrites ici. » et propose « Nouvelle décision » (RF-CONT-10).
- **CA-CONT-103** · [E9c](#e9c) · Étant donné une décision acceptée du projet, quand le contexte est transmis, alors elle l'emporte sur les instructions des groupes du projet sans rien à relier, le champ « Fait exception à » n'existant plus, et le texte transmis l'indique aux agents (RF-CONT-15).
- **CA-CONT-104** · [E9a](#e9a) · Étant donné les instructions des groupes, le contexte et l'isolation, quand une session ou un agent tente de les modifier, alors cela n'est pas possible : ils se règlent par la personne seule (RF-CONT-09).

### <a id="e9d-decision-acceptee-et-historique"></a>E9d · Décision acceptée et historique

- **CA-CONT-15** · [E9d](#e9d) · Étant donné une décision acceptée modifiée, quand la personne l'ouvre, alors chaque version garde son auteur, sa date et sa note, la version 1 reste lisible à côté de la version actuelle et choisir une version l'affiche dans le corps de la page (RF-CONT-11).
- **CA-CONT-16** · [E9d](#e9d) · Étant donné une décision acceptée, quand la personne clique sur « Remplacer » et écrit une nouvelle décision, alors la décision remplacée passe à « Remplacée » et garde un renvoi vers sa remplaçante (RF-CONT-11).
- **CA-CONT-17** · [E9d](#e9d) · Étant donné une décision acceptée, quand la personne clique sur « Abandonner » et confirme, avec ou sans motif, alors la décision n'est plus envoyée aux agents mais reste lisible avec son historique (RF-CONT-11).
- **CA-CONT-18** · ~~[E9d](#e9d) · Étant donné la décision liée à DEC-6, T-12 et T-13, quand la personne consulte les relations, alors DEC-6 la précise, T-12 l'a reçue à son lancement, T-13 la recevra, et un clic ouvre l'élément lié (RF-CONT-01).~~ Retiré (17/11/2026, tâches et worker retirés des specs, DT-43).
- **CA-CONT-19** · [E9d](#e9d) · Étant donné un mobile, quand la personne ouvre une décision acceptée, alors elle la lit sans aucun bouton d'action, son historique et ses liens étant repliés (RF-CONT-09).
- **CA-CONT-165** · [E9d](#e9d) · Étant donné une décision ouverte depuis le contexte d'un projet, quand la personne lit le haut de la page, alors le fil d'Ariane est « Projets › api-tarifs › DEC-6 » (RF-SESS-15).

### <a id="e9e-modifier-une-decision-acceptee"></a>E9e · Modifier une décision acceptée

- **CA-CONT-20** · [E9e](#e9e) · Étant donné la décision en version 2, quand la personne clique sur « Modifier », alors les champs reprennent le texte de la version 2, la partie changée est surlignée tant qu'elle n'est pas enregistrée, et le projet visé ne se change pas (RF-CONT-11).
- **CA-CONT-21** · [E9e](#e9e) · Étant donné une note vide, quand la personne clique sur « Enregistrer la version 3 », alors l'enregistrement est refusé, le champ passe en erreur avec le message « Écris une note pour dire ce qui change. », il reçoit le focus et aucune version n'est créée (RF-CONT-11).
- **CA-CONT-22** · [E9e](#e9e) · Étant donné une note renseignée, quand la personne enregistre la version 3, alors elle s'ajoute à l'historique sans remplacer les précédentes, avec auteur, date et note pour chacune (RF-CONT-10, RF-CONT-11).
- **CA-CONT-23** · [E9e](#e9e) · Étant donné la version 3 enregistrée, quand les agents sont lancés ensuite, alors les agents lancés ensuite reçoivent la version 3 et ceux déjà lancés gardent la version 2 qu'ils ont reçue (RF-CONT-11).
- **CA-CONT-24** · [E9e](#e9e) · Étant donné un mobile, quand la personne ouvre l'écran de modification, alors il renvoie vers le poste (RF-CONT-10).

### <a id="e9f-apercu-du-texte-transmis"></a>E9f · Aperçu du texte transmis

- **CA-CONT-25** · [E9f](#e9f) · Étant donné un projet, quand la personne ouvre l'aperçu, alors elle lit les instructions de « Tous les projets », puis celles de chacun des groupes du projet, les décisions acceptées du projet qui l'emportent, et la place dans l'architecture, et « Copier » met ce texte dans le presse-papiers (RF-CONT-01, RF-CONT-15).
- **CA-CONT-26** · [E9f](#e9f) · Étant donné des décisions seulement proposées par un agent, quand la personne ouvre l'aperçu, alors elles n'y figurent pas et la ligne du dessous rappelle ce qui manque (RF-CONT-02).
- **CA-CONT-105** · [E9f](#e9f) · Étant donné une session à plusieurs projets, quand la personne ouvre l'aperçu, alors le texte compte un bloc par projet, le projet principal d'abord, dans la limite de 10 000 caractères (RF-CONT-01).
- **CA-CONT-106** · [E9f](#e9f) · Étant donné une décision du projet qui l'emporte sur une instruction, quand la personne ouvre l'aperçu, alors l'instruction n'est pas retirée du texte et le texte dit laquelle l'emporte (RF-CONT-15).
- **CA-CONT-107** · [E9f](#e9f) · Étant donné une session interactive, quand le contexte est transmis, alors cela demande le suivi en direct et le texte est limité à 10 000 caractères (RF-CONT-01).
- **CA-CONT-27** · ~~[E9f](#e9f) · Étant donné aucune tâche choisie, quand la personne ouvre l'aperçu, alors les liens ne sont pas comptés dans l'estimation des tokens (RF-CONT-01).~~ Retiré (17/11/2026, tâches et worker retirés des specs, DT-43).
- **CA-CONT-28** · [E9f](#e9f) · Étant donné une décision acceptée, modifiée ou abandonnée depuis l'ouverture, quand la personne rouvre le panneau, alors le texte est recalculé à partir des décisions du moment (RF-CONT-11).

### <a id="e14a-socles-liste-et-heritages-retire-le-17112026"></a>E14a · Socles : liste et héritages (retiré le 17/11/2026)

- ~~**CA-CONT-55** · [E14a](#e14a) · Étant donné un socle global et un socle partagé, quand la personne ouvre la liste, alors le socle global s'applique à tous les dépôts (ici les 15), le socle partagé seulement à ceux qui l'héritent, et ils s'empilent dans le contexte d'un dépôt (RF-CONT-03).~~ Retiré (17/11/2026, socles remplacés par les groupes, lot 5).
- ~~**CA-CONT-56** · [E14a](#e14a) · Étant donné un socle avec des dépôts qui en héritent, quand la personne clique sur « + 9 autres », alors la liste complète des dépôts se déplie (RF-CONT-03).~~ Retiré (17/11/2026, socles remplacés par les groupes, lot 5).
- ~~**CA-CONT-57** · [E14a](#e14a) · Étant donné une exception locale, quand la personne consulte les exceptions, alors api-tarifs garde Jest (DEC-5) au lieu de « Tests avec Vitest », écartée pour lui seul (RF-CONT-03).~~ Retiré (17/11/2026, socles remplacés par les groupes, lot 5).
- ~~**CA-CONT-58** · [E14a](#e14a) · Étant donné un changement de socle (décision, dépôts), quand la personne veut enregistrer, alors une confirmation indique le nombre de dépôts concernés avant l'enregistrement, et les agents déjà lancés ne sont pas touchés (RF-CONT-03, RF-CONT-11).~~ Retiré (17/11/2026, socles remplacés par les groupes, lot 5).
- ~~**CA-CONT-59** · [E14a](#e14a) · Étant donné un mobile, quand la personne ouvre l'écran, alors elle le lit seulement, sans bouton de création ni de gestion des dépôts (RF-CONT-09).~~ Retiré (17/11/2026, socles remplacés par les groupes, lot 5).

### <a id="e14b-nouveau-socle-retire-le-17112026"></a>E14b · Nouveau socle (retiré le 17/11/2026)

- ~~**CA-CONT-60** · E14b · Étant donné le choix « Global », quand la personne le sélectionne, alors la liste des dépôts disparaît ; avec « Partagé », le socle s'applique aux seuls dépôts cochés (RF-CONT-03).~~ Retiré (17/11/2026, socles remplacés par les groupes, lot 5).
- ~~**CA-CONT-61** · E14b · Étant donné un socle qui hérite d'un autre, quand la personne le crée, alors il reçoit les décisions de l'autre en plus des siennes (RF-CONT-03).~~ Retiré (17/11/2026, socles remplacés par les groupes, lot 5).
- ~~**CA-CONT-62** · E14b · Étant donné un héritage en boucle, quand la personne clique sur « Créer le socle », alors le message « Un socle ne peut pas hériter de lui-même, même indirectement. » s'affiche, le champ passe en erreur et « Créer le socle » reste sans effet (RF-CONT-03).~~ Retiré (17/11/2026, socles remplacés par les groupes, lot 5).
- ~~**CA-CONT-63** · E14b · Étant donné un socle vide, quand les dépôts cochés sont lancés, alors ils n'en reçoivent rien de plus tant qu'il n'a pas de décision acceptée (RF-CONT-01, RF-CONT-03).~~ Retiré (17/11/2026, socles remplacés par les groupes, lot 5).
- ~~**CA-CONT-64** · E14b · Étant donné un mobile, quand la personne ouvre l'écran, alors il renvoie vers le poste (RF-CONT-09).~~ Retiré (17/11/2026, socles remplacés par les groupes, lot 5).

### <a id="e14c-modifier-un-socle-retire-le-17112026"></a>E14c · Modifier un socle (retiré le 17/11/2026)

- ~~**CA-CONT-65** · E14c · Étant donné un socle existant, quand la personne clique sur « Modifier le socle », alors le formulaire du nouveau socle s'ouvre prérempli (nom, portée, héritage, dépôts) ; une fois enregistré, les prochains agents des dépôts qu'il couvre désormais reçoivent ses décisions (RF-CONT-03).~~ Retiré (17/11/2026, socles remplacés par les groupes, lot 5).
- ~~**CA-CONT-66** · E14c · Étant donné une décision d'un socle écrite et acceptée d'emblée, ou changée par une nouvelle version, quand la personne enregistre, alors la même confirmation compte les dépôts concernés, socles qui en héritent compris ; une décision seulement proposée s'enregistre sans confirmation (RF-CONT-03, RF-CONT-11).~~ Retiré (17/11/2026, socles remplacés par les groupes, lot 5).
