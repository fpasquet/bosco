<!-- Généré par export.mjs (skill requirements-doc) depuis sources/30-specs.md : ne pas modifier ici. -->

# <a id="34-lot-5-reglages"></a>3.4 Lot 5 · Réglages

## <a id="regles-fonctionnelles-du-lot"></a>Règles fonctionnelles du lot

- **RF-REGL-01** · **Un seul endroit** : les réglages globaux de Bosco sont réunis sous « Réglages », en bas de la barre latérale, en cinq onglets : Sources, Téléphone, Notifications, Abonnement Claude, Bac à sable. Ce qui ne concerne qu'un projet ou un groupe se règle dans sa page, jamais ici.
- **RF-REGL-02** · **Réservés à toi** : les réglages sont réservés à toi et valent tout de suite ; sur le téléphone ils se lisent seulement, sauf ce que chaque écran permet (règle 7 du lot 1).
- **RF-REGL-03** · **Réglages d'un profil** : chaque profil surveillé règle dans Bosco les autorisations, le modèle et l'effort par défaut des sessions qu'on y lance avec lui ([E4g](#e4g)). Sans réglage, la valeur est celle du profil Claude Code, affichée avec son origine ; Bosco garde ces réglages sans modifier le profil. Ils cèdent à ceux du projet, du groupe et de la session (règle 16 du lot 1).

## <a id="e4"></a>E4 · Sources et téléphone

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `reglages/e4.html` · implémentation : **Livré (Développé (jusqu'à feat/finish-sandbox-and-sources) : onglets Sources et Téléphone, « Gérer » d'un profil (E4g), source « Bacs à sable » à part, lecture seule sur le téléphone (garde de l'API comprise), « Ajouter un dossier » par le navigateur de dossiers (dossiers cachés visibles), « À mettre à jour » quand le suivi en direct vient d'une autre version de Bosco ou que 3 transcripts de suite sont illisibles (état gardé jusqu'au redémarrage), serveur MCP installé et retiré avec le suivi en direct.)**

### <a id="e4a"></a>E4a · Sources : profils surveillés et réglages

Premier onglet des Réglages : les dossiers que Bosco lit, le suivi en direct, le canal de Bosco et le seuil d'inactivité. L'accès depuis le téléphone a son propre onglet (E4c). Chaque source montre si le suivi en direct est installé et quand le dernier signal est arrivé : c'est ici qu'on voit d'un coup d'œil que tout est branché.

- **Depuis** « Réglages » en bas de la barre latérale (onglet Sources par défaut) · [E1a](sessions.md#e1a) après « Surveiller ces profils » · la ligne d'état des sources, en pied de la barre latérale
- **Ensuite** [E4b](#e4b) au clic sur « Vérifier le suivi en direct » · [E4c](#e4c) l'onglet Téléphone · [E1b](sessions.md#e1b) en revenant à la vue d'ensemble

Règles de l'écran :

1. Une source est un dossier de configuration de Claude Code, ou la source « Bacs à sable » (pastille 10). Désactiver l'interrupteur arrête la lecture de ce dossier sans rien effacer : les sessions déjà lues restent dans l'historique. Bosco ne modifie jamais les fichiers lus (règles 1 et 7). Si une version de Claude Code change le format des sessions, la source passe « À mettre à jour » : Bosco ne lit plus ses nouvelles sessions tant qu'il n'est pas mis à jour.
2. Le suivi en direct s'installe profil par profil. Quand il manque, la ligne propose « Installer », qui ouvre [E4b](#e4b) ; sinon, le lien « Vérifier le suivi en direct » y mène aussi. Sans lui, Bosco ne peut pas savoir qu'une session t'attend, et « Autoriser » reste indisponible (règles 2 et 3).
3. Le seuil d'inactivité, 15 minutes par défaut, fixe le délai sans événement après lequel une session passe à « Inactive » (règle 2). Réglable de 5 à 60 minutes.
4. L'accès depuis le téléphone n'est plus réglé ici : il a son onglet « Téléphone » ([E4c](#e4c)), avec l'adresse, les téléphones appairés et l'appairage (règle 7 du lot 1).
5. Les notifications ont leur onglet des Réglages ([E15b](sessions.md#e15b)) : ce qui notifie, et la notification du bureau, envoyée même quand Bosco n'est pas au premier plan (règle 8 du lot 1).
6. « Ajouter un dossier » ajoute une source : un autre dossier de configuration de Claude Code, à surveiller comme un profil. Il n'existe que sur le poste : sur le téléphone, la liste renvoie à l'ordinateur (pastille 6 du mobile).
7. Bosco garde sa propre copie des sessions : Claude Code efface ses fichiers après 30 jours par défaut, mais l'historique reste lisible dans Bosco. Une session effacée par Claude Code ne se reprend plus (règle 10).
8. Le canal de Bosco, lui aussi installé profil par profil, permet d'écrire depuis Bosco à une session ouverte dans un terminal. « Installer » ouvre [E4f](#e4f).
9. Sur le téléphone, « Réglages » est un onglet de la barre du bas, dont cet écran est la racine : la liste des cinq onglets des Réglages (Sources, Téléphone, Notifications, Abonnement Claude, Bac à sable) puis « Conteneurs en cours » ([E19a](#e19a)), chacun ouvrant son écran en lecture seule. Le contenu de Sources suit la liste. Les projets et les groupes ont leur propre onglet « Projets » ([E20a](contexte.md#e20a)).
10. La source « Bacs à sable » est tenue par Bosco : il l'ajoute au premier bac à sable et elle porte le fil des sessions en bac à sable. La désactiver les ferait disparaître, d'où l'absence d'interrupteur et de « Gérer ». Elle n'a ni suivi en direct à installer ni canal : c'est Bosco qui lance ces sessions, d'où « Piloté par Bosco ».
11. « Gérer » sur la ligne d'un profil (pro, perso) ouvre ses réglages ([E4g](#e4g)) : compte, autorisations, modèle et effort par défaut des sessions. La ligne « Bacs à sable » n'a pas de « Gérer » : Bosco la tient lui-même.

**Mobile** : racine de l'onglet « Réglages » du téléphone (pastille 9). Les sources deviennent des cartes, les réglages une liste d'options à ouvrir, en lecture seule (règle 2 du lot). L'ajout d'un dossier n'existe que sur le poste, avec un renvoi explicite à l'ordinateur (pastille 6) ; l'appairage d'un téléphone se déclenche aussi depuis le poste.

### <a id="e4b"></a>E4b · Sources : installation du suivi en direct

Un panneau latéral, au-dessus de la liste des sources, guide l'installation du suivi en direct d'un profil en trois étapes : ce que cela permet, l'installation, la vérification. Ici, la dernière étape est terminée.

- **Depuis** [E4a](#e4a) (« Vérifier le suivi en direct » ou « Installer ») · [E1a](sessions.md#e1a) via « Ensuite : suivi en direct »
- **Ensuite** [E1b](sessions.md#e1b) au clic sur « Terminer » · [E4a](#e4a) en fermant le panneau

Règles de l'écran :

1. L'installation se fait profil par profil et se défait en un clic : « Désinstaller » remet les réglages d'avant. Le panneau garde l'écran des sources visible derrière lui. Si Bosco est arrêté, Claude Code continue normalement.
2. Rien n'est installé sans clic. À l'étape d'installation, une copie des réglages actuels du profil est gardée par défaut (case cochée), et les réglages existants sont conservés : Bosco ajoute les siens sans rien remplacer. Un seul Bosco suit un profil : si un autre Bosco du poste y avait installé le suivi (celui des développements, ou l'application du poste), ses réglages sont remplacés par ceux de ce Bosco, pour que Claude Code ne signale pas d'erreur quand l'autre est arrêté. L'étape montre d'abord les 6 événements qui seront suivis et le serveur Bosco ajouté au profil (décisions).
3. La vérification repose sur un vrai signal d'une session ouverte, pas sur la seule écriture des réglages. Si aucune session n'est ouverte, l'étape l'indique : « Ouvre une session Claude Code dans ce profil pour terminer la vérification ».
4. La source « Bacs à sable » n'a pas de suivi en direct à installer : c'est Bosco qui lance ces sessions ([E4a](#e4a), pastille 10). « Terminer » ramène à [E1b](sessions.md#e1b), où le bandeau « T'attend » propose désormais « Autoriser » et « Refuser ».

**Mobile** : l'installation se fait sur le poste, pas sur le téléphone. L'écran mobile renvoie à l'ordinateur et montre seulement l'état du suivi des trois sources (pas de bouton d'installation ni de désinstallation).

### <a id="e4c"></a>E4c · Téléphone : accès depuis le téléphone

Onglet « Téléphone » des Réglages : l'interrupteur « Accès depuis le téléphone », l'adresse et les téléphones appairés (aucun ici). « Appairer un téléphone » ouvre une fenêtre, au-dessus de l'onglet, qui donne l'adresse à ouvrir sur le téléphone, par copie ou par QR code, et un code à saisir. Le code vaut 5 minutes et une seule fois. Sur le téléphone, un écran plein ne demande que ce code.

- **Depuis** l'onglet « Téléphone » des Réglages, en activant l'accès ou par « Appairer un téléphone »
- **Ensuite** l'onglet « Téléphone », une fois le téléphone appairé · [E2b](sessions.md#e2b) sur le téléphone, pour confirmer une autorisation

Règles de l'écran :

1. L'accès n'existe que sur le réseau local, et seulement une fois activé : rien n'est exposé sur Internet (règle 7). Le QR code évite de taper l'adresse, qui suit celle du poste et change avec le réseau, et le code : il ouvre la page d'appairage avec le code rempli, et le téléphone s'appaire seul. Hors de ce réseau, ou sur un Wi-Fi qui isole les appareils, le téléphone ne joint pas le poste.
2. Le code est valable 5 minutes, à usage unique, avec 5 essais au plus. Passé le délai ou après les essais, il est refusé : « Générer un nouveau code » en crée un autre et invalide l'ancien.
3. Après l'appairage, la fenêtre se ferme et le téléphone apparaît dans la liste des téléphones appairés de l'onglet, avec la date de l'appairage. Il se retire d'un clic, ce qui coupe son accès aussitôt. « Annuler » ferme la fenêtre sans rien activer de plus.
4. Bosco crée son propre certificat : les échanges sont chiffrés, mais le navigateur ne peut pas le vérifier. Il affiche donc un avertissement, à accepter une fois sur chaque téléphone. Les notifications du téléphone ne sont pas prévues : elles exigeraient un certificat reconnu.
5. Sur ce téléphone, « Autoriser » demande ensuite une confirmation avant d'envoyer la réponse à l'agent ([E2b](sessions.md#e2b)).

**Mobile** : l'écran de gauche est celui qui s'ouvre sur le téléphone à l'adresse affichée par le poste, sans les onglets de l'application, puisqu'elle n'est pas encore accessible. Un champ de six chiffres et un bouton « Appairer » de 44 px suffisent.

### <a id="e4d"></a>E4d · Réglages : dépôts découvertsRetiré

Remplacé par les projets que tu choisis (E20). L'identifiant est gardé pour ne pas le réutiliser.

### <a id="e4f"></a>E4f · Sources : installer le canal de Bosco

Un panneau latéral, au-dessus de la liste des sources, guide l'installation du canal de Bosco d'un profil : ce que cela permet, l'installation, puis la commande pour lancer ses sessions avec le canal. Ici, le profil pro est installé et il reste à lancer une session avec le canal.

- **Depuis** [E4a](#e4a) (« Installer » sur la ligne d'un profil) · [E2A](sessions.md#e2a) via le lien de la bande grise
- **Ensuite** [E2I](sessions.md#e2i) en lançant une session avec le canal · [E4A](#e4a) en fermant le panneau

Règles de l'écran :

1. L'installation se fait profil par profil et se défait en un clic : « Retirer » remet les serveurs du profil comme avant. Rien n'est installé sans clic, et Bosco ajoute son canal sans rien remplacer des serveurs existants.
2. Le canal ne marche que pour une session lancée avec cette commande. Pour un profil autre que ~/.claude, elle est précédée du dossier de configuration du profil (ici CLAUDE_CONFIG_DIR=~/.claude-perso pour perso). Un alias évite de la retaper.
3. Fonction en aperçu de recherche de Claude Code : à chaque lancement, il faut confirmer un canal en développement local, et une organisation Team ou Enterprise peut désactiver les canaux. Il faut aussi un compte claude.ai. Une fois la session ouverte, Claude Code affiche la ligne « Channels (experimental) messages from server:bosco-channel inject directly in this session ».
4. Rien ne change pour une session lancée sans le canal : la bande grise d'[E2a](sessions.md#e2a) reste affichée, on répond dans le terminal. Avec le canal, la session se lit comme [E2i](sessions.md#e2i).

**Mobile** : la feuille d'installation s'ouvre en plein écran, avec les mêmes étapes. Les commandes sont affichées sans bouton de copie : on les copie depuis le poste.

### <a id="e4g"></a>E4g · Sources : réglages d'un profil

La page d'un profil surveillé : son compte, et les valeurs par défaut des sessions lancées dans Bosco avec lui (autorisations, modèle, effort). Chaque valeur dit d'où elle vient. Un profil sans réglage reprend ce que dit le profil Claude Code, lu sans être modifié.

- **Depuis** [E4a](#e4a) (« Gérer » sur la ligne d'un profil)
- **Ensuite** [E11c](#e11c) pour changer le profil par défaut · [E4a](#e4a) en revenant à la liste

Règles de l'écran :

1. Les autorisations par défaut des sessions de ce profil : un des cinq modes (Demander, Accepter les modifications, Plan, Approuver pour moi, Accès complet), chacun avec son icône. « Accès complet » choisi ici demande quand même une confirmation à chaque session sur le poste (règle 17 du lot 1). « Approuver pour moi » est grisé, avec sa raison, quand le modèle par défaut ne le permet pas.
2. Le modèle par défaut. Sans réglage, la valeur est celle que dit le profil Claude Code, lue sans être modifiée et affichée avec son origine (« Celui du profil Claude Code · Sonnet 5.5 »). Choisir une valeur ici ne touche jamais aux fichiers du profil : Bosco garde ses réglages à lui (règle 3 du lot).
3. L'effort par défaut, sur le même principe : repli sur le profil Claude Code, affiché avec son origine, et valeur choisie ici gardée par Bosco.
4. L'ordre de priorité : le choix de la session l'emporte sur le groupe choisi, puis sur le projet principal, puis sur ces réglages, puis sur ce que dit le profil Claude Code (règle 16 du lot 1). Chaque champ et chaque puce de session disent d'où vient leur valeur (« défaut du profil pro »).
5. « Utilisé par » liste les groupes (ici Club des Trois Lacs et Gîtes du Haut-Vallon) pour lesquels ce profil est le profil par défaut et le nombre de sessions ouvertes. Enregistrer ne change pas ces sessions ouvertes : les réglages valent pour les suivantes ; un choix se change entre deux tours depuis la session elle-même (E2e).
6. Sur le téléphone, écran poussé en lecture seule depuis la ligne du profil : les valeurs et leur origine s'affichent, sans sélecteur ni bouton ; le renvoi dit « Modifiable depuis le poste ».

**Mobile** : écran poussé en lecture seule (pastille 6) ; les modifications se font depuis le poste.

## <a id="e11"></a>E11 · Bac à sable et abonnement

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `reglages/e11.html` · implémentation : **Livré (Développé (feat/navigation-by-place, feat/multi-project-sessions, feat/session-defaults) : barre à cinq onglets, domaines propres à chaque projet, lien de l'abonnement par défaut vers les réglages du profil (E4g).)**

### <a id="e11a"></a>E11a · Isolation du bac à sable

Où et avec quelles limites travaille une session en bac à sable : un conteneur par session, des ressources plafonnées, ce que l'agent peut ou non voir et les seuls domaines qu'il peut joindre. Onglet « Bac à sable » des Réglages, sans sous-onglet.

- **Depuis** l'onglet « Bac à sable » des Réglages, « Réglages » en bas de la barre latérale
- **Ensuite** [E11c](#e11c) pour l'abonnement et son quota · [E19a](#e19a) pour les conteneurs en cours · [E2j](sessions.md#e2j) pour les refus de domaine d'une session

Règles de l'écran :

1. Un conteneur par session en bac à sable, sur la copie du dépôt et la branche de cette session. Il s'arrête après 30 minutes sans message et repart au message suivant ; la copie reste jusqu'à ce que la branche soit récupérée.
2. Le tableau résume ce que l'agent voit : fichiers, secrets, réseau. Seul l'accès à l'abonnement Claude de la session lui est transmis ; ni compte GitHub, ni .npmrc, ni connecteur. L'image est la même pour tous les bacs à sable.
3. Les ressources sont plafonnées pour chaque bac à sable : mémoire, processeurs et nombre de processus. L'utilisateur sans droits d'administration est verrouillé : il ne se désactive pas. Les conteneurs en cours se suivent dans [E19a](#e19a).
4. La liste par défaut est verrouillée : ce sont les domaines dont Claude Code et les installations ont besoin ; elle ne se modifie pas.
5. Un domaine ajouté vaut tout de suite, sans relancer les bacs à sable déjà démarrés (RF-CONT-07) ; la croix « Retirer » vaut de même. « *.domaine » couvre les sous-domaines. Les domaines refusés se lisent dans chaque session ([E2j](sessions.md#e2j)). Chaque projet peut aussi ajouter ses propres domaines ([E21a](contexte.md#e21a)) : ils s'ajoutent à cette liste pour ses bacs à sable, et une session à plusieurs projets réunit ceux de ses projets.
6. Le filtrage se fait par nom de domaine : un domaine autorisé reste une sortie possible pour une donnée que l'agent y enverrait. Mieux vaut peu de domaines.
7. Ces réglages sont réservés au poste : aucune session ni aucun agent ne peut les lire pour les contourner ni les modifier (CA-CONT-42). Sur le téléphone, ils se lisent seulement.

**Mobile** : écran poussé en lecture seule, ouvert depuis Réglages. Le tableau devient une liste ; ni champ d'ajout ni croix, et la mention « Modifiable depuis le poste » l'explique.

### <a id="e11c"></a>E11c · Abonnement Claude

L'abonnement proposé à chaque nouvelle session et le quota qui retient ou arrête les tours. Onglet « Abonnement Claude » des Réglages, après Notifications. Il reprend le bloc de quota qui vivait dans l'isolation.

- **Depuis** l'onglet « Abonnement Claude » des Réglages · le message d'une session retenue par le quota ([E2g](sessions.md#e2g))
- **Ensuite** [E11a](#e11a) pour l'isolation du bac à sable · [E16b](sessions.md#e16b) pour choisir l'abonnement au démarrage

Règles de l'écran :

1. L'abonnement par défaut est proposé à chaque nouvelle session ; on peut en choisir un autre au démarrage ([E16b](sessions.md#e16b)). « Modifier » ouvre un choix parmi les profils surveillés qui ont un accès, avec leur compte, puis « Enregistrer ». Sans aucun accès, la carte le dit et renvoie à une connexion dans un profil surveillé. Cet abonnement est le **profil par défaut** de Bosco : ses autorisations, son modèle et son effort par défaut se règlent dans [E4g](#e4g). Un projet ou un groupe peut choisir un autre profil, et la session a le dernier mot (règle 16 du lot 1).
2. Deux seuils par fenêtre (5 h et semaine). Au-delà du seuil d'attente, un message à une session retenue est refusé avec la raison (« Quota de l'abonnement : 5 h à 52 %, reprise vers 16:00 ») et un message en attente n'est pas envoyé. Au-delà du seuil d'arrêt, le tour en cours s'interrompt et le fil dit « Tour arrêté : Quota de l'abonnement atteint : fenêtre de 5 h à 81 % ». L'attente reste sous l'arrêt, de 1 à 100 % (CA-CONT-99).
3. Le quota se lit par abonnement : part utilisée de la fenêtre de 5 h et de la semaine, avec l'heure de remise à zéro. Il est lu à chaque tour d'une session pilotée de l'abonnement ; un abonnement jamais lu est considéré libre jusqu'au premier tour, et une fenêtre dont l'heure de remise à zéro est passée repart de 0 %. Les sessions lancées dans un terminal ne sont jamais arrêtées par Bosco.
4. Par défaut, les seuils ne retiennent que les sessions en bac à sable : le poste est laissé tranquille (CA-SESS-116). La seconde option étend la retenue aux sessions pilotées sur le poste (CA-SESS-117). Le choix vaut pour les messages suivants.

**Mobile** : écran poussé en lecture seule, ouvert depuis Réglages : jauges, seuils et portée s'affichent, sans champ ni bouton. Le choix de l'abonnement et les seuils se modifient depuis le poste.

## <a id="e19"></a>E19 · Conteneurs en cours

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `reglages/e19.html` · implémentation : **Livré**

### <a id="e19a"></a>E19a · Conteneurs en cours : panneau déplié

Ce que Bosco fait tourner en ce moment, et ce que chaque élément consomme : les bacs à sable démarrés et les tours en cours sur le poste. Le panneau s'ouvre par-dessus n'importe quelle page, ici la vue d'ensemble, qui reste utilisable.

- **Depuis** « Conteneurs » en bas de la barre latérale, sur toutes les pages · sur le téléphone, Réglages › « Conteneurs en cours »
- **Ensuite** [E2j](sessions.md#e2j) avec « Voir la session » d'un bac à sable · [E2g](sessions.md#e2g) avec « Arrêter le tour » · [E19c](#e19c) si Docker ne répond pas

Règles de l'écran :

1. « Conteneurs » n'apparaît en bas de la barre latérale que si quelque chose tourne : le nombre de bacs à sable, de tours sur le poste et la mémoire au total, mis à jour toutes les 5 s ; le panneau y ajoute le processeur. Un clic déplie ou replie le panneau, sur n'importe quelle page ; il reste déplié d'une page à l'autre, et l'appareil s'en souvient (règle 13).
2. Deux groupes : « Bacs à sable », une ligne par bac à sable démarré, et « Tours sur le poste », les sessions pilotées dont un tour est en cours. Seul ce que Bosco a lancé est listé : ni les autres conteneurs du poste ni les sessions ouvertes dans un terminal.
3. Le processeur et la mémoire d'un bac à sable se lisent par rapport à son plafond ([E11a](#e11a) : 2 cœurs et 4 Go). À partir de 80 %, la jauge passe en orange avec « Proche du plafond » : au-delà de sa mémoire, un conteneur voit ses commandes échouer. Un tour sur le poste n'a pas de plafond : sa valeur s'affiche seule.
4. Une action par nature, jamais de démarrage à la main. « Voir la session » ouvre la session ([E2j](sessions.md#e2j)). Un bac à sable s'arrête depuis sa session, pas d'ici. « Arrêter le tour » interrompt le tour en cours de la session pilotée, qui se reprend ensuite ([E2g](sessions.md#e2g)).

**Mobile** : écran poussé, ouvert depuis Réglages › « Conteneurs en cours ». Une carte par bac à sable (« Voir la session ») et par tour (« Arrêter le tour »), les jauges sous le titre.

### <a id="e19c"></a>E19c · Conteneurs en cours : Docker ne répond pas

Quand Docker ne répond plus, Bosco ne peut ni mesurer les bacs à sable ni en démarrer. Le résumé le dit au lieu de disparaître, et le panneau montre les dernières mesures, datées.

- **Depuis** « Conteneurs · Docker ne répond pas » en bas de la barre latérale
- **Ensuite** [E19a](#e19a) dès que Docker répond

Règles de l'écran :

1. Le résumé reste affiché quand Docker ne répond pas, en orange avec « Docker ne répond pas » : Bosco ne sait plus si un bac à sable tourne, il ne le cache donc pas.
2. L'encadré dit depuis quand et ce qui ne marche plus. Un message à une session en bac à sable ne peut pas la démarrer tant que Docker ne répond pas ; les sessions pilotées sur le poste ne sont pas touchées. « Réessayer » relance la connexion tout de suite ; sinon Bosco réessaie toutes les 30 s.
3. Les dernières mesures restent visibles, grisées et datées, actions désactivées. Dès que Docker répond, le panneau revient à [E19a](#e19a) avec des valeurs à jour.

**Mobile** : même écran poussé qu'[E19a](#e19a), l'encadré en tête avec « Réessayer » en 44 px.

## <a id="criteres-dacceptation"></a>Critères d'acceptation

### <a id="e4-sources-et-telephone"></a>E4 · Sources et téléphone

- **CA-REGL-01** · [E4a](#e4a) · Étant donné « Réglages » en bas de la barre latérale, quand la personne l'ouvre, alors la page s'ouvre sur l'onglet Sources et propose cinq onglets, dans l'ordre : Sources, Téléphone, Notifications, Abonnement Claude, Bac à sable, avec le fil d'Ariane « Réglages › Sources » et « Réglages » actif dans la barre latérale (RF-REGL-01, RF-SESS-15).
- **CA-REGL-02** · [E4a](#e4a) · Étant donné un réglage qui ne concerne qu'un projet ou un groupe (abonnement par défaut du groupe, instructions, domaines du projet, « Où elle tourne »), quand la personne cherche où le régler, alors il se trouve dans la page du projet ou du groupe et jamais dans les cinq onglets de « Réglages » (RF-REGL-01).
- **CA-REGL-03** · [E4a](#e4a) · Étant donné un réglage modifié sur le poste, quand la personne l'enregistre ou le change, alors il vaut tout de suite, et aucune session ni aucun agent ne peut le modifier (RF-REGL-02, RF-CONT-09).
- **CA-REGL-04** · [E4a](#e4a) · Étant donné l'onglet Sources, quand la personne le lit, alors l'accès depuis le téléphone n'y est plus réglé et se trouve dans l'onglet « Téléphone », celui des notifications ayant aussi son propre onglet ([E4c](#e4c), [E15b](sessions.md#e15b)) (RF-REGL-01).
- **CA-REGL-05** · [E4a](#e4a) · Étant donné le téléphone, quand la personne touche l'onglet « Réglages » de la barre du bas, alors la racine liste les cinq onglets (Sources, Téléphone, Notifications, Abonnement Claude, Bac à sable) puis « Conteneurs en cours » ([E19a](#e19a)), chacun ouvrant son écran en lecture seule, le contenu de Sources suivant la liste, et les projets et les groupes ayant leur propre onglet « Projets » (RF-REGL-02, RF-SESS-07).
- **CA-REGL-06** · [E4a](#e4a) · Étant donné le téléphone, quand la personne regarde les sources, alors elles sont des cartes en lecture seule, l'ajout d'un dossier et l'installation du suivi en direct renvoient à l'ordinateur et l'appairage d'un téléphone se déclenche depuis le poste (RF-REGL-02).
- **CA-REGL-07** · [E4c](#e4c) · Étant donné l'onglet « Téléphone » des Réglages, quand la personne l'ouvre, alors il montre l'interrupteur « Accès depuis le téléphone », l'adresse et la liste des téléphones appairés (aucun au départ), « Appairer un téléphone » ouvrant la fenêtre au-dessus de l'onglet, avec le fil d'Ariane « Réglages › Téléphone » (RF-SESS-07, RF-SESS-15).
- **CA-SESS-56** · [E4a](#e4a) · Étant donné une source, quand la personne désactive son interrupteur, alors la lecture de ce dossier s'arrête, rien n'est effacé et les sessions déjà lues restent dans l'historique (RF-SESS-01).
- **CA-SESS-57** · [E4a](#e4a) · Étant donné une version de Claude Code qui change le format des sessions, quand Bosco ne sait plus le lire, alors la source passe « À mettre à jour » et ses nouvelles sessions ne sont plus lues.
- **CA-SESS-186** · [E4a](#e4a) · Étant donné un profil dont le suivi en direct a été installé par une autre version de Bosco (adresse, secret ou événements différents), quand la personne ouvre l'onglet Sources, alors le profil est « À mettre à jour » et « Mettre à jour » réinstalle le suivi en direct.
- **CA-SESS-58** · [E4a](#e4a) · Étant donné un profil sans suivi en direct, quand la personne regarde sa ligne, alors « Installer » ouvre [E4b](#e4b) ; sinon « Vérifier le suivi en direct » y mène (RF-SESS-02, RF-SESS-03).
- **CA-SESS-59** · [E4a](#e4a) · Étant donné le seuil d'inactivité, quand la personne le règle, alors il vaut 15 minutes par défaut et se règle de 5 à 60 minutes (RF-SESS-02).
- **CA-SESS-60** · [E4c](#e4c) · Étant donné l'accès depuis le téléphone, quand la personne ouvre l'onglet « Téléphone » des Réglages pour la première fois, alors il est désactivé et l'activer ouvre la fenêtre d'appairage ; un téléphone appairé se retire d'un clic (RF-SESS-07).
- **CA-SESS-61** · [E4a](#e4a) · Étant donné la notification du bureau, quand la personne ouvre l'onglet « Notifications » des Réglages ([E15b](sessions.md#e15b)), alors elle est activée par défaut et désactivable, sans toucher au tiroir des notifications (RF-SESS-08).
- **CA-SESS-62** · [E4b](#e4b) · Étant donné le panneau d'installation, quand la personne arrive à l'étape d'installation, alors une copie des réglages actuels du profil est cochée par défaut et l'étape montre les 6 événements suivis et le serveur Bosco ajouté au profil, rien n'étant installé sans clic.
- **CA-SESS-63** · [E4b](#e4b) · Étant donné une installation faite, quand la personne clique sur « Désinstaller », alors les réglages d'avant sont remis.
- **CA-SESS-105** · [E4b](#e4b) · Étant donné un profil dont un autre Bosco du poste suit les sessions (service des développements, application du poste), quand la personne installe le suivi en direct depuis ce Bosco, alors les hooks de l'autre Bosco sont remplacés par les siens, les autres réglages restant intacts ; « Désinstaller » ne retire ensuite que les siens.
- **CA-SESS-64** · [E4b](#e4b) · Étant donné aucune session ouverte dans le profil, quand la personne arrive à la vérification, alors l'étape indique « Ouvre une session Claude Code dans ce profil pour terminer la vérification ».
- **CA-SESS-65** · [E4b](#e4b) · Étant donné la dernière étape terminée, quand la personne clique sur « Terminer », alors la vue d'ensemble [E1b](sessions.md#e1b) s'ouvre et le bandeau « T'attend » propose « Autoriser » et « Refuser » (RF-SESS-03).
- **CA-SESS-66** · [E4c](#e4c) · Étant donné l'activation de l'accès depuis le téléphone, quand la fenêtre s'ouvre, alors elle donne l'adresse par copie ou par QR code et un code valable 5 minutes, à usage unique, avec 5 essais au plus (RF-SESS-07).
- **CA-SESS-67** · [E4c](#e4c) · Étant donné un code expiré ou dont les essais sont épuisés, quand la personne le saisit, alors il est refusé ; « Générer un nouveau code » en crée un autre et invalide l'ancien.
- **CA-SESS-68** · [E4c](#e4c) · Étant donné un téléphone qui saisit le bon code, quand l'appairage réussit, alors la fenêtre se ferme et le téléphone apparaît dans la liste des téléphones appairés de l'onglet « Téléphone » avec la date d'appairage ; le retirer coupe son accès aussitôt.
- **CA-SESS-69** · [E4c](#e4c) · Étant donné la fenêtre ouverte, quand la personne clique sur « Annuler », alors la fenêtre se ferme sans rien activer de plus.
- **CA-SESS-70** · [E4c](#e4c) · Étant donné un téléphone hors du réseau local, quand il tente de joindre le poste, alors il ne le joint pas, rien n'étant exposé sur Internet ; sur un téléphone appairé, « Autoriser » demande une confirmation (RF-SESS-07).
- **CA-SESS-75** · [E4c](#e4c) · Étant donné un code d'appairage affiché sur le poste, quand la personne scanne le QR code de la fenêtre avec son téléphone, alors la page d'appairage s'ouvre avec le code rempli et le téléphone s'appaire sans rien saisir ; le champ du code n'accepte que 6 chiffres.
- **CA-SESS-77** · [E4d](#e4d) · ~~Étant donné « Dépôts git seulement », activé par défaut, quand une session tourne hors d'un dépôt git (dossier personnel, dossier temporaire), alors elle se range sous « Hors dépôt git » sans créer de dépôt ; désactivé, son dossier de travail compte comme un dépôt.~~ Retiré (17/11/2026, E4d remplacé par les projets choisis, lot 5).
- **CA-SESS-78** · [E4d](#e4d) · ~~Étant donné « Worktrees rattachés à leur dépôt », activé par défaut, quand une session tourne dans un worktree git (comme ceux de `.claude/worktrees/`), alors elle se range avec le dépôt d'origine, sous sa branche, au lieu de compter comme un dépôt à part.~~ Retiré (17/11/2026, E4d remplacé par les projets choisis, lot 5).
- **CA-SESS-79** · [E4d](#e4d) · ~~Étant donné des dossiers de dépôts et des dossiers exclus (`/tmp` par défaut), quand une session tourne dans un dépôt hors des premiers ou dans un des seconds, alors elle se range sous « Hors dépôt git » ; les dossiers exclus l'emportent, sans dossier de dépôts tout le poste compte, et un chemin s'écrit comme dans le terminal (`~/www`).~~ Retiré (17/11/2026, E4d remplacé par les projets choisis, lot 5).
- **CA-SESS-80** · [E4d](#e4d) · ~~Étant donné la liste « Dépôts trouvés », faite des dépôts où une session Claude Code a tourné, les plus récents d'abord, quand la personne masque un dépôt, alors il disparaît de la barre latérale, des filtres, des tâches et du contexte, ses sessions restent dans la vue d'ensemble, et un clic l'affiche de nouveau.~~ Retiré (17/11/2026, E4d remplacé par les projets choisis, lot 5).
- **CA-SESS-81** · [E4d](#e4d) · ~~Étant donné une nouvelle tâche (E6a), quand la personne choisit son dépôt, alors seuls les dépôts git affichés sont proposés, les plus récents d'abord, même si « Dépôts git seulement » est désactivé.~~ Retiré (17/11/2026, E4d remplacé par les projets choisis, lot 5).
- **CA-SESS-82** · [E4d](#e4d) · ~~Étant donné un réglage des dépôts changé, quand la personne revient à la vue d'ensemble, alors les sessions s'y rangent aussitôt selon le réglage, sans relire l'historique ; sur le téléphone, ces réglages se lisent sans pouvoir être changés.~~ Retiré (17/11/2026, E4d remplacé par les projets choisis, lot 5).
- **CA-REGL-15** · [E4a](#e4a) · Étant donné la liste des sources, quand la personne regarde la source « Bacs à sable », alors Bosco l'a ajoutée au premier bac à sable, elle porte le fil des sessions en bac à sable, elle n'a ni interrupteur ni « Gérer » ni suivi en direct à installer ni canal, et sa ligne dit « Piloté par Bosco » (RF-SESS-12).
- **CA-REGL-16** · [E4a](#e4a) · Étant donné la ligne d'un profil (pro, perso) de l'onglet Sources, quand la personne clique sur « Gérer », alors la page de ses réglages s'ouvre ([E4g](#e4g)) : compte, autorisations, modèle et effort par défaut des sessions (RF-REGL-03).

### <a id="e4f-canal-de-bosco"></a>E4f · Canal de Bosco

- **CA-SESS-102** · [E4f](#e4f) · Étant donné un profil surveillé, quand la personne installe le canal de Bosco, alors il s'ajoute aux serveurs du profil sans rien remplacer, et Bosco donne la commande qui lance une session avec lui (avec le dossier de configuration pour un profil autre que `~/.claude`) et son alias ; « Retirer » l'enlève.

### <a id="e4g-reglages-dun-profil"></a>E4g · Réglages d'un profil

- **CA-REGL-17** · [E4g](#e4g) · Étant donné un profil surveillé de l'onglet Sources, quand la personne l'ouvre, alors la page montre son compte et les valeurs par défaut des sessions lancées dans Bosco avec lui (autorisations, modèle, effort), chacune avec son origine (RF-REGL-03).
- **CA-REGL-18** · [E4g](#e4g) · Étant donné les autorisations par défaut du profil, quand la personne ouvre le choix, alors il propose les cinq modes avec leur icône (Demander, Accepter les modifications, Plan, Approuver pour moi, Accès complet), « Approuver pour moi » étant grisé avec sa raison quand le modèle par défaut ne le permet pas, et « Accès complet » choisi ici demande quand même une confirmation à chaque session sur le poste (RF-REGL-03, RF-SESS-17).
- **CA-REGL-19** · [E4g](#e4g) · Étant donné un profil sans réglage de modèle ou d'effort, quand la personne regarde le champ, alors la valeur est celle du profil Claude Code, affichée avec son origine (« Celui du profil Claude Code · Sonnet 5.5 »), et choisir une valeur ici ne modifie jamais les fichiers du profil (RF-REGL-03).
- **CA-REGL-20** · [E4g](#e4g) · Étant donné une session lancée dans Bosco, quand ses autorisations, son modèle ou son effort sont lus, alors le choix de la session l'emporte sur le groupe choisi, puis sur le projet principal, puis sur ces réglages du profil, puis sur ce que dit le profil Claude Code, et chaque champ et chaque puce disent d'où vient leur valeur (« défaut du profil pro ») (RF-REGL-03, RF-SESS-16).
- **CA-REGL-21** · [E4g](#e4g) · Étant donné « Utilisé par », quand la personne le lit, alors il liste les groupes dont ce profil est le profil par défaut et le nombre de sessions ouvertes, et enregistrer ne change pas ces sessions ouvertes : les réglages valent pour les suivantes (RF-REGL-03).
- **CA-REGL-22** · [E4g](#e4g) · Étant donné le téléphone, quand la personne ouvre un profil depuis sa ligne, alors l'écran est poussé en lecture seule, avec les valeurs et leur origine, sans sélecteur ni bouton, et la mention « Modifiable depuis le poste » (RF-REGL-02, RF-REGL-03).

### <a id="e11a-isolation-du-bac-a-sable"></a>E11a · Isolation du bac à sable

- ~~**CA-CONT-39** · [E11a](#e11a) · Étant donné une tâche du worker, quand elle tourne, alors elle a son conteneur jetable, supprimé à la fin, et seule la branche reste (RF-CONT-06).~~ Retiré (17/11/2026, worker et tâches mis de côté : E11a décrit désormais le bac à sable des sessions).
- ~~**CA-CONT-40** · [E11a](#e11a) · Étant donné le plafond de 4 agents atteint ou une mémoire insuffisante au-delà de la marge gardée libre, quand une tâche est lancée, alors elle reste « En file » avec la raison et part dès qu'une place se libère (RF-CONT-06).~~ Retiré (17/11/2026, worker et tâches mis de côté : E11a décrit désormais le bac à sable des sessions).
- **CA-CONT-41** · [E11a](#e11a) · Étant donné les ressources plafonnées pour chaque bac à sable, quand la personne consulte l'écran, alors elle voit la mémoire, les processeurs et le nombre de processus, et l'utilisateur sans droits d'administration est verrouillé, sans pouvoir être désactivé (RF-CONT-06).
- **CA-CONT-42** · [E11a](#e11a) · Étant donné les réglages d'isolation, quand une session ou un agent tente de les lire ou de les modifier, alors cela n'est pas possible : ils sont réservés à la personne (RF-CONT-09).

- **CA-CONT-98** · [E11c](#e11c) · Étant donné l'abonnement Claude, quand la personne ouvre le bloc « Quota de l'abonnement » de l'onglet « Abonnement Claude » des Réglages, alors chaque abonnement montre l'usage de sa fenêtre de 5 h et de sa semaine, avec l'heure de remise à zéro, lu au dernier tour d'une session de cet abonnement ; une fenêtre dont l'heure de remise à zéro est passée repart de 0 % (RF-SESS-13).
- **CA-CONT-99** · [E11c](#e11c) · Étant donné les seuils du quota, quand la personne les change, alors ils valent dès le prochain message ou le prochain tour ; un seuil d'attente doit rester sous son seuil d'arrêt, entre 1 et 100 %, sinon le champ est refusé avec un message (RF-SESS-13).
- **CA-REGL-08** · [E11a](#e11a) · Étant donné l'onglet « Bac à sable » des Réglages, quand la personne l'ouvre depuis « Réglages » en bas de la barre latérale, alors il s'affiche sans sous-onglet, avec le fil d'Ariane « Réglages › Bac à sable », et un conteneur par session en bac à sable s'arrête après 30 minutes sans message et repart au message suivant, la copie restant jusqu'à ce que la branche soit récupérée (RF-SESS-12, RF-REGL-01).
- **CA-REGL-09** · [E11a](#e11a) · Étant donné le tableau de ce que l'agent voit, quand la personne le lit, alors il résume fichiers, secrets et réseau, seul l'accès à l'abonnement Claude de la session est transmis (ni compte GitHub, ni .npmrc, ni connecteur) et l'image est la même pour tous les bacs à sable (RF-SESS-12).
- **CA-REGL-10** · [E11a](#e11a) · Étant donné la liste des domaines autorisés, quand la personne ajoute un domaine (ou `*.domaine` pour ses sous-domaines) ou le retire par sa croix, alors le changement vaut tout de suite sans relancer les bacs à sable déjà démarrés, la liste par défaut étant verrouillée ; l'avertissement rappelle qu'un domaine autorisé reste une sortie possible pour une donnée (RF-CONT-07).
- **CA-REGL-11** · [E11a](#e11a) · Étant donné le téléphone, quand la personne ouvre l'onglet « Bac à sable » depuis Réglages, alors l'écran est poussé en lecture seule, le tableau devient une liste, sans champ d'ajout ni croix, avec la mention « Modifiable depuis le poste » (RF-REGL-02).
- **CA-CONT-108** · [E11a](#e11a) · Étant donné les domaines propres à un projet ([E21a](contexte.md#e21a)), quand une session tourne en bac à sable, alors ils s'ajoutent à la liste générale pour les bacs à sable de ce projet, une session à plusieurs projets réunit ceux de ses projets, et un domaine ajouté vaut tout de suite sans relancer les bacs à sable déjà démarrés (RF-CONT-07).

### <a id="e19a-conteneurs-en-cours-panneau-deplie"></a>E19a · Conteneurs en cours : panneau déplié

- **CA-CONT-70** · [E19a](#e19a) · Étant donné que rien ne tourne, quand la personne regarde le bas de la barre latérale, alors « Conteneurs » n'y figure pas ; dès qu'un bac à sable ou un tour de session pilotée tourne, il apparaît avec le nombre de bacs à sable, de tours sur le poste et la mémoire au total, mis à jour toutes les 5 s (RF-CONT-13).
- **CA-CONT-71** · [E19a](#e19a) · Étant donné le résumé « Conteneurs », quand la personne clique dessus, alors le panneau se déplie par-dessus la page, qui reste utilisable ; il reste déplié d'une page à l'autre, et l'appareil s'en souvient après un rechargement ; un nouveau clic ou « Replier » le replie.
- **CA-CONT-72** · [E19a](#e19a) · Étant donné des bacs à sable démarrés et une session pilotée en cours, quand la personne lit le panneau, alors il montre deux groupes : « Bacs à sable » (une ligne par bac à sable démarré) et « Tours sur le poste » (les sessions pilotées dont un tour est en cours) ; aucun autre conteneur du poste ni aucune session ouverte dans un terminal n'y figure.
- **CA-CONT-73** · [E19a](#e19a) · Étant donné un conteneur à 80 % ou plus de son plafond de processeur ou de mémoire (2 cœurs et 4 Go par bac à sable), quand le panneau s'affiche, alors sa valeur passe en orange avec « Proche du plafond » ; une session pilotée, sans plafond, affiche sa valeur seule.
- **CA-CONT-74** · [E19a](#e19a) · Étant donné les lignes du panneau, quand la personne agit, alors « Voir la session » d'un bac à sable ouvre la session ([E2j](sessions.md#e2j)), un bac à sable ne s'arrête que depuis sa session, « Arrêter le tour » interrompt la session pilotée, qui se reprend ensuite ([E2g](sessions.md#e2g)) ; aucun bouton ne démarre un conteneur.
- **CA-CONT-75** · ~~[E19a](#e19a) · Étant donné le pied du panneau, quand la personne le lit, alors il donne les agents au travail sur le plafond et la mémoire disponible au-delà de la marge gardée libre ([E11a](#e11a)).~~ Retiré (17/11/2026, tâches et worker retirés des specs, DT-43).
- **CA-CONT-76** · [E19a](#e19a) · Étant donné un mobile, quand la personne ouvre « Conteneurs en cours » depuis Réglages, alors un écran poussé montre une carte par bac à sable (« Voir la session ») et par tour (« Arrêter le tour »), les jauges sous le titre.

### <a id="e19c-conteneurs-en-cours-docker-ne-repond-pas"></a>E19c · Conteneurs en cours : Docker ne répond pas

- **CA-CONT-80** · [E19c](#e19c) · Étant donné que Docker ne répond plus, quand la personne regarde la barre latérale, alors « Conteneurs » reste affiché, en orange, avec « Docker ne répond pas ».
- **CA-CONT-81** · [E19c](#e19c) · Étant donné le panneau ouvert pendant la panne, quand la personne le lit, alors un encadré dit depuis quand Docker ne répond pas et ce qui ne marche plus, et les dernières mesures restent visibles, grisées et datées, leurs actions désactivées.
- **CA-CONT-82** · [E19c](#e19c) · Étant donné la panne, quand la personne clique sur « Réessayer », alors la connexion est retentée tout de suite ; sinon Bosco réessaie toutes les 30 s, et dès que Docker répond, le panneau revient à [E19a](#e19a) avec des valeurs à jour.

### <a id="e11c-abonnement-claude"></a>E11c · Abonnement Claude

- **CA-SESS-116** · [E11c](#e11c) · Étant donné l'abonnement d'une session au-delà de son seuil d'attente, et les seuils réglés pour les sessions en bac à sable, quand la personne démarre une session en bac à sable ou lui écrit, alors le message est refusé avec la raison (« Quota de l'abonnement : 5 h à 52 %, reprise vers 16:00 »), et une session pilotée sur le poste démarre comme avant (RF-SESS-13).
- **CA-SESS-117** · [E11c](#e11c) · Étant donné les seuils réglés pour les sessions en bac à sable et pilotées sur le poste, quand l'abonnement dépasse le seuil d'attente, alors une session pilotée sur le poste est aussi retenue ; au-delà du seuil d'arrêt, le tour en cours s'interrompt et le fil dit « Tour arrêté » avec la raison (RF-SESS-13).
- **CA-REGL-12** · [E11c](#e11c) · Étant donné l'onglet « Abonnement Claude » des Réglages, quand la personne l'ouvre, alors il vient après Notifications, le fil d'Ariane est « Réglages › Abonnement Claude » et la carte propose l'abonnement par défaut de chaque nouvelle session ; « Modifier » ouvre un choix parmi les profils surveillés qui ont un accès, avec leur compte, puis « Enregistrer », et sans aucun accès la carte le dit et renvoie à une connexion dans un profil surveillé (RF-SESS-13, RF-REGL-01).
- **CA-REGL-13** · [E11c](#e11c) · Étant donné un abonnement jamais lu, quand la personne consulte le quota, alors il est considéré libre jusqu'au premier tour d'une session pilotée de cet abonnement, et les sessions lancées dans un terminal ne sont jamais arrêtées par Bosco (RF-SESS-13).
- **CA-REGL-14** · [E11c](#e11c) · Étant donné le téléphone, quand la personne ouvre l'onglet « Abonnement Claude » depuis Réglages, alors l'écran est poussé en lecture seule : jauges, seuils et portée s'affichent sans champ ni bouton, le choix de l'abonnement et les seuils se modifiant depuis le poste (RF-REGL-02).
- **CA-REGL-23** · [E11c](#e11c) · Étant donné l'abonnement par défaut de l'onglet « Abonnement Claude », quand la personne le consulte, alors il est le profil par défaut de Bosco, ses autorisations, son modèle et son effort par défaut se règlent dans [E4g](#e4g), et un projet ou un groupe peut choisir un autre profil, la session ayant le dernier mot (RF-SESS-13, RF-SESS-16).
