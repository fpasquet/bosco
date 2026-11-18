<!-- Généré par export.mjs (skill requirements-doc) depuis sources/30-specs.md : ne pas modifier ici. -->

# <a id="31-lot-1-sessions"></a>3.1 Lot 1 · Sessions

## <a id="regles-fonctionnelles-du-lot"></a>Règles fonctionnelles du lot

- **RF-SESS-01** · **1. Une session est découverte sans action de ta part** : toute session Claude Code écrite dans un dossier de configuration surveillé apparaît dans Bosco, avec son projet, sa branche et son profil (pro ou perso, ou les bacs à sable tenus par Bosco). Elle se range dans le projet qui contient son dossier de travail, sinon sous « Hors projet » ([E20a](contexte.md#e20a)). Bosco lit ces fichiers sans jamais les modifier.
- **RF-SESS-02** · **2. Une session a un seul état** : T'attend (autorisation demandée, ou tour terminé : l'agent a rendu la main), En cours, Inactive (aucun événement depuis 15 min sans être close ; délai réglable dans les sources). Un tour terminé resté sans réponse devient lui aussi Inactive après ce délai. Sans suivi en direct, Bosco ne peut pas savoir qu'une session attend : seuls En cours et Inactive sont disponibles, Terminée et En échec. T'attend passe toujours en premier.
- **RF-SESS-03** · **3. Une autorisation se donne depuis Bosco ou depuis le terminal**, au choix : la première réponse l'emporte et l'autre écran se met à jour. Les boutons « Autoriser » et « Refuser » n'existent que si le suivi en direct est installé pour ce profil ; sinon seul « Ouvrir » est proposé. Une autorisation vaut pour une seule commande : pas de « toujours autoriser » depuis Bosco.
- **RF-SESS-04** · **4. Bosco écrit aux sessions qu'il pilote** : une session démarrée dans Bosco ([E16a](#e16a)), ou une session close reprise en lui écrivant ([E2g](#e2g)), se pilote depuis Bosco, sur le poste comme sur le téléphone : messages, questions de l'agent, autorisations selon le mode choisi au démarrage, parmi cinq (Demander, Accepter les modifications, Plan, Approuver pour moi, Accès complet ; règle 17), avec des valeurs par défaut réglables (règle 16). Elle tourne sur le poste, dans le dossier du projet principal et avec l'abonnement choisi au démarrage (celui du groupe, sinon l'abonnement par défaut), comme dans un terminal, ou dans un bac à sable si on le choisit au démarrage (règle 12) ; elle peut toucher plusieurs projets (règle 14). Une session ouverte dans un terminal se répond dans son terminal : Bosco en montre le dernier message et le dossier, mais ne peut pas mettre un terminal au premier plan.
- **RF-SESS-05** · **5. Le coût est une estimation** au tarif public des modèles, calculée à partir des tokens (cache compris), même sous abonnement. Un modèle dont le tarif n'est pas connu apparaît « non chiffré ». Le coût du jour additionne les sessions commencées aujourd'hui.
- **RF-SESS-06** · **6. La vue d'ensemble se regroupe par projet, par groupe ou par état** : tableau par projet, tableau par groupe ([E1g](#e1g)), ou colonnes par état. Une session à plusieurs projets se range sous son projet principal, et apparaît dans chaque groupe qui contient l'un de ses projets. Le choix est gardé d'une visite à l'autre.
- **RF-SESS-07** · **7. Bosco reste sur le poste** : rien n'est envoyé ailleurs, et il n'écoute que sur le poste tant que l'accès téléphone n'est pas activé. L'accès depuis le téléphone est désactivé par défaut ; il s'active pour le réseau local ([E4c](reglages.md#e4c)), en connexion chiffrée, avec un code d'appairage. Sur mobile, « Autoriser » demande une confirmation.
- **RF-SESS-08** · **8. Bosco notifie ce qui t'attend et ce qui est fini, selon tes réglages** : une autorisation demandée, une question de l'agent, une fin de tour qui finit par une question ; une fin de tour après un long tour (2 min par défaut), une session terminée (désactivée par défaut). La notification du bureau part même quand Bosco n'est pas au premier plan ; devant Bosco, un message bref la remplace. Le centre de notifications garde tout 7 jours (E15).
- **RF-SESS-09** · **9. Une session se reprend seulement quand elle est close** : reprendre une session encore ouverte mélangerait deux conversations. La commande de reprise n'apparaît donc que pour une session close. Entre deux tours, une session pilotée par Bosco est close : elle se reprend dans un terminal (commande de reprise) ou dans Bosco (en lui écrivant). Tant qu'un terminal l'a rouverte, Bosco ne lui écrit plus, sauf par le canal de Bosco : une session lancée avec ce canal reçoit dans son terminal les messages écrits dans Bosco, en texte seulement ([E2i](#e2i), [E4f](reglages.md#e4f)).
- **RF-SESS-10** · **10. Bosco garde sa propre copie des sessions** : Claude Code efface ses fichiers après 30 jours par défaut. L'historique reste lisible et chiffré dans Bosco, mais une session effacée par Claude Code ne se reprend plus.
- **RF-SESS-11** · **11. Bosco se présente au premier lancement** : un bloc de bienvenue (logo, ce que fait Bosco, ses trois usages) précède le choix des profils, dans la page et sans fenêtre à fermer. Il se rouvre à tout moment depuis le logo (« À propos de Bosco »), avec l'origine du nom : le bosco est le maître d'équipage d'un navire.
- **RF-SESS-12** · **12. Une session pilotée peut tourner dans un bac à sable** : au démarrage ([E16b](#e16b)), on choisit où elle tourne, sur le poste ou dans un bac à sable. Le bac à sable est un conteneur sur le poste, isolé du poste ([E11a](reglages.md#e11a)) : il ne voit qu'une copie de chaque projet de la session, sur la branche de la session, et l'accès à l'abonnement choisi, jamais les fichiers, les accès ni les autres projets du poste ; sa sortie réseau se limite aux domaines autorisés, et chaque refus s'affiche dans le fil ([E2j](#e2j)). Elle se pilote comme les autres sessions, en « Accepter les modifications » par défaut, seulement quand ni le profil, ni le groupe, ni le projet ne règlent les autorisations (règle 16). Le travail reste dans le bac à sable, qui survit à l'arrêt de son conteneur, jusqu'à ce que « Récupérer la branche » la rapatrie dans le projet du poste, sans toucher à la branche courante ; pour une session à plusieurs projets, « Récupérer les branches » rapatrie celles qui ont du travail, projet par projet. Le conteneur reste démarré pendant la session, s'arrête après 30 min sans message et redémarre au message suivant ; il n'est recréé que pour reprendre une session terminée, ou s'il a disparu. Elle ne se reprend que dans Bosco : la reprendre dans un terminal du poste la sortirait du bac à sable. L'accès à l'abonnement est une copie de celui du profil, gardée hors du conteneur et retirée avec le bac à sable ; rien d'autre du profil n'entre (ni ses serveurs, ni ses connecteurs) : les instructions, skills et commandes du projet viennent avec la copie. Le bac à sable est supprimé 7 jours après le dernier message, ou plus tôt à la main ; si la branche a du travail non récupéré, une notification le dit la veille.
- **RF-SESS-13** · **13. Le quota de l'abonnement retient les sessions pilotées** : Bosco lit à chaque tour piloté la part utilisée de la fenêtre de 5 h et de la semaine de l'abonnement de la session ([E11c](reglages.md#e11c)). Au-delà du seuil d'attente (50 % de 5 h, 70 % de la semaine par défaut), un message à une session retenue est refusé avec la raison, et un message en attente n'est pas envoyé ; au-delà du seuil d'arrêt (80 %, 90 %), le tour en cours s'interrompt et le fil en dit la raison. Les seuils retiennent les sessions en bac à sable, et aussi, au choix, celles pilotées sur le poste ; une session lancée dans un terminal n'est jamais touchée. Une nouvelle session propose l'abonnement du groupe choisi, sinon l'abonnement par défaut, réglé dans [E11c](reglages.md#e11c).
- **RF-SESS-14** · **14. Une session pilotée peut porter sur plusieurs projets** : au démarrage ([E16c](#e16c), [E16d](#e16d)), on choisit un groupe ou plusieurs projets. La session tourne dans le projet principal, qui est son dossier de travail, et voit les autres, qu'elle peut lire et modifier, avec leurs instructions ([E9f](contexte.md#e9f)). Elle se range sous son projet principal (« api-tarifs +2 », [E2k](#e2k)) ; la page d'un projet montre aussi, à part, les sessions qui le touchent ([E21c](contexte.md#e21c)). Sur le poste, l'avertissement « session déjà ouverte dans ce dossier » vaut pour chaque projet. En bac à sable, chaque projet a sa copie, sur la même branche de session ; la sortie réseau réunit les domaines de tous les projets, et un nom de branche déjà pris dans l'un d'eux est refusé. Une session lancée dans un terminal n'a qu'un projet, celui de son dossier. Claude Code ne lit les instructions des projets ajoutés qu'avec une variable d'environnement, et ne garde pas ces projets d'un tour à l'autre (essai du 17/11/2026 sur Claude Code 2.1.326) : Bosco les repasse à chaque tour avec cette variable, et la commande affichée pour reprendre la session dans un terminal les ajoute aussi. Un projet sans git ne tourne pas en bac à sable : le choix « Bac à sable » est alors grisé, avec sa raison.
- **RF-SESS-15** · **15. Chaque page dit sa place dans la navigation** : un fil d'Ariane au-dessus du titre donne à la page une place fixe, quelle que soit la façon d'y arriver (barre latérale, menu ⋯, tableau, notification), et l'entrée correspondante de la barre latérale est active. La page d'un projet est « Projets › api-tarifs » (« › Contexte » pour l'onglet Contexte, « › DEC-6 » pour une décision) ; celle d'un groupe, « Groupes › Club des Trois Lacs » ; la liste des projets, « Projets » ; une session, « Projets › api-tarifs » au-dessus de son titre, avec son projet principal (« Hors projet » sans projet), et c'est ce projet qui est actif dans la barre latérale, sinon la vue d'ensemble ; une nouvelle session, « Nouvelle session », précédé du projet ou du groupe d'où elle part ; les réglages, « Réglages › Sources » et ses autres onglets, avec « Réglages » actif. La vue d'ensemble, l'historique et l'usage, pages de premier niveau, n'ont pas de fil : leur titre dit leur place. Sur le téléphone, le fil devient le retour de l'écran poussé.
- **RF-SESS-16** · **16. Les sessions démarrent avec des valeurs par défaut, dont l'origine s'affiche** : le profil, les autorisations, le modèle et l'effort ont une valeur par défaut à chaque niveau. Pour les autorisations, le modèle et l'effort, l'ordre est : le choix fait pour la session, puis le groupe choisi (session lancée avec un groupe), puis le projet principal, puis le profil (réglé dans Bosco, [E4g](reglages.md#e4g)), puis ce que dit le profil Claude Code. Le profil lui-même suit : la session, le groupe, le projet, le profil par défaut ([E11c](reglages.md#e11c)). Chaque champ et chaque puce disent d'où vient leur valeur (« défaut du groupe », « défaut du projet api-tarifs », « défaut du profil pro », « celui du profil Claude Code »). En bac à sable, sans valeur réglée à aucun niveau, le mode est « Accepter les modifications » (règle 12). Les choix se font au démarrage et se changent ensuite entre deux tours ([E2e](#e2e)). Bosco garde ses réglages, sans modifier le profil Claude Code.
- **RF-SESS-17** · **17. Une session pilotée a cinq modes d'autorisation** : Demander (chaque autorisation arrive dans Bosco), Accepter les modifications (celles des fichiers passent, le reste est demandé), Plan (l'agent propose un plan avant de toucher aux fichiers), Approuver pour moi (un vérificateur examine chaque demande) et Accès complet (aucune demande). Chacun a son icône, et la puce de la barre d'outils la montre avec le libellé. Approuver pour moi dépend du modèle : il est grisé, avec sa raison (« Pas disponible avec ce modèle »), quand le modèle choisi ne le permet pas, et Claude Code le suspend après 3 refus de suite ou 20 au total : les demandes reviennent alors dans Bosco et le fil le dit ([E2e](#e2e)). Accès complet est permis partout, en orange : sur le poste, le choisir ouvre à chaque session une confirmation ([E16e](#e16e)), qui vaut aussi pour un défaut réglé à un niveau ; en bac à sable, aucune confirmation, car le bac à sable est isolé du poste.
- **RF-SESS-18** · **18. La page Usage montre ce que consomment les sessions**, d'après leurs transcripts (tokens d'entrée, de sortie, de lecture et d'écriture du cache, tours, modèle) : [E23a](#e23a), et [E23b](#e23b) une fois filtrée. Le coût est estimé au tarif public de l'API (règle 5) ; un modèle sans tarif connu est exclu du coût et signalé. La réutilisation du cache est la lecture du cache divisée par l'entrée plus la lecture du cache. Le quota de chaque abonnement est celui que Claude Code donne à chaque tour (règle 13). L'activité de Bosco compte les sessions pilotées lancées, le temps de travail des agents (durée cumulée des tours), les bacs à sable créés, les branches récupérées et les PR créées, repérées dans le fil des sessions (la commande qui crée une PR et l'adresse qu'elle rend) : une PR créée hors d'une session n'est pas comptée. Les filtres (période, profil, projet ou groupe, modèle) valent pour toute la page, sauf le quota, qui se lit par abonnement ; ils sont gardés d'une visite à l'autre, et la période ne remonte pas avant l'historique conservé. Une session à plusieurs projets compte pour chacun des projets du groupe qu'elle touche, une seule fois dans les totaux du groupe.

## <a id="e1"></a>E1 · Vue d'ensemble

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e1.html` · implémentation : **Livré (Développé (feat/navigation-by-place, feat/multi-project-sessions) : barre latérale par lieu, clic sur un projet ou un groupe qui ouvre sa page, E1c retiré, vue d'ensemble par groupe (E1g), sessions à plusieurs projets rangées sous leur projet principal. Accepté (feat/session-defaults) : dans la vue par groupe, « api-tarifs +2 » suit le titre de la session, sur sa ligne.)**

### <a id="e1a"></a>E1a · Vue d'ensemble : premier lancement

Au tout premier lancement, Bosco se présente en quelques lignes, puis demande quels profils surveiller. Aucune session n'est affichée : Bosco a repéré des dossiers de configuration de Claude Code sur le poste et demande lesquels surveiller. Rien n'est lu avant la validation. Un second encart propose d'installer le suivi en direct, sans obligation.

- **Depuis** le premier lancement de Bosco
- **Ensuite** [E1b](#e1b) après « Surveiller ces profils » · [E4b](reglages.md#e4b) via l'encart « Suivi en direct » · [E1e](#e1e) pendant la lecture des sessions

Règles de l'écran :

1. Bienvenue : le logo, ce que fait Bosco en une phrase et ses trois usages (sessions qui t'attendent, autorisations, bacs à sable), au-dessus du choix des profils, sans fenêtre à fermer (règle 11). Le même texte, avec l'origine du nom, se rouvre à tout moment depuis le logo de la barre latérale ou de l'en-tête du téléphone (« À propos de Bosco »).
2. Détection automatique des dossiers de configuration de Claude Code présents sur le poste : le dossier par défaut et ceux des autres profils (règle 1). Les deux sont cochés d'office ; en décocher un l'exclut de la surveillance.
3. Rien n'est lu avant « Surveiller ces profils ». Bosco lit les sessions sans jamais modifier les fichiers des profils (règles 1 et 7) ; les nombres de dossiers et la date de la dernière session viennent d'un simple aperçu des dossiers.
4. Sessions passées importées : celles des 30 derniers jours rejoignent l'historique ([E3a](#e3a)). Les sessions encore ouvertes apparaissent dans la vue d'ensemble.
5. Le suivi en direct est facultatif, mais indispensable pour savoir qu'une session t'attend : sans lui, Bosco lit les sessions mais ne voit pas les attentes en temps réel, et le bandeau T'attend n'apparaît pas. L'installation se fait par profil dans [E4b](reglages.md#e4b) ; « Plus tard » masque l'encart, qui reste disponible dans les sources.

**Mobile** : le même bloc en pleine largeur, avec le bouton principal collé en bas (44 px). L'ajout d'un autre dossier se fait depuis le poste, comme l'installation du suivi en direct.

### <a id="e1b"></a>E1b · Vue d'ensemble : regroupée par projet

L'écran d'accueil, ouvert toute la journée à côté des terminaux. Le bandeau du haut réunit les sessions qui t'attendent, avec leur dernier message : on peut autoriser une commande sans quitter l'écran. Dessous, toutes les sessions ouvertes, groupées par projet, se comparent ligne à ligne.

- **Depuis** l'ouverture de Bosco, l'entrée « Vue d'ensemble », ou [E1a](#e1a) une fois une source activée · le fil d'Ariane des autres pages quand elles y renvoient
- **Ensuite** [E2b](#e2b) au clic sur une session qui t'attend · [E2a](#e2a) sur une session en cours · [E1d](#e1d) avec « Regrouper par : État » · [E1f](#e1f) si Bosco ne répond plus · [E21c](contexte.md#e21c) au clic sur un projet de la barre latérale, [E22d](contexte.md#e22d) sur un groupe · [E20d](contexte.md#e20d) avec le ⋯ d'un projet ou d'un groupe

Règles de l'écran :

1. Le bandeau n'apparaît que si au moins une session t'attend ; il disparaît quand la dernière reçoit sa réponse. Tri : la plus ancienne attente en premier. Il reste en tête même en regroupement par projet, parce que c'est la première chose à traiter. Une notification du bureau signale chaque nouvelle attente (règle 8). Sans suivi en direct, pas de bandeau : une ligne discrète propose de l'installer ([E4b](reglages.md#e4b)).
2. « Autoriser » et « Refuser » n'existent que pour une **autorisation demandée** quand le suivi en direct est installé (règle 3). Un tour terminé n'a que « Voir la session » (règle 4) : la réponse se donne dans le terminal de la session. « Refuser » ouvre le détail [E2b](#e2b) pour écrire un motif, transmis à l'agent. Si la réponse a déjà été donnée dans le terminal, la ligne disparaît et un message bref l'indique.
3. « Regrouper par » bascule entre trois choix : ce tableau par projet, le tableau par groupe ([E1g](#e1g)) et les colonnes par état ([E1d](#e1d)). Une session à plusieurs projets se range sous son projet principal (« api-tarifs +2 », [E2k](#e2k)). Le choix est gardé d'une visite à l'autre (règle 6).
4. Le coût du jour additionne les sessions commencées aujourd'hui, terminées comprises. Il est estimé au tarif public des modèles à partir des tokens, cache compris, même quand le compte est sous abonnement (règle 5).
5. Toute la ligne ouvre le détail de la session ([E2](#e2a)). Dans chaque projet, tri par état (T'attend, En cours, Inactive), puis par activité la plus récente. La marque « perso » distingue la session lancée avec le second dossier de configuration de Claude Code. Les sessions terminées ne sont pas ici : elles vont dans l'historique ([E3a](#e3a)). Un monodépôt (creneaux, sejours, maison) est un seul projet : ses sessions se rangent sous lui, et le paquet qu'elles touchent se lit dans le chemin (« creneaux/packages/paiement »).
6. « Nouvelle session » démarre une session sans terminal : formulaire [E16a](#e16a). Sur mobile, le bouton rond « + » en bas à droite fait la même chose.

**Mobile** : la ligne du tableau devient une ligne de liste (état, titre, branche et dernière action, activité). « Autoriser » et « Refuser » passent en grands boutons de 44 px ; sur mobile, « Autoriser » demande une confirmation ([E2b](#e2b)). Les profils de la barre latérale passent dans le bouton de filtres de l'en-tête ; les projets et les groupes s'ouvrent depuis l'onglet « Projets » ([E20a](contexte.md#e20a)).

### <a id="e1c"></a>E1c · Vue d'ensemble : filtrée par projetRetiré

Ancienne vue d'ensemble limitée à un projet ou à un groupe, ouverte par un clic dans la barre latérale. L'identifiant est gardé pour ne pas le réutiliser.

### <a id="e1d"></a>E1d · Vue d'ensemble : regroupée par état, en colonnes

Le même regroupement lu par état : une colonne par situation, chaque session en carte. La colonne T'attend remplace le bandeau d'E1b ; les cartes « En cours » montrent les trois dernières actions de l'agent pour voir d'un coup d'œil s'il avance.

- **Depuis** [E1b](#e1b) avec « Regrouper par : État »
- **Ensuite** [E2b](#e2b) au clic sur une session qui t'attend · [E2a](#e2a) sur une session en cours

Règles de l'écran :

1. Les mêmes sessions qu'en [E1b](#e1b), lues par état. Une carte change de colonne d'elle-même quand l'état de la session change (règle 2). Les terminées du jour sont en bas de la dernière colonne et renvoient à l'historique ([E3a](#e3a)) pour le reste ; les cartes d'une colonne sont triées par activité la plus récente.
2. Mini-fil : les trois dernières actions de l'agent, la plus récente en haut, pour voir s'il avance ou s'il tourne en rond. Sur mobile, un balayage horizontal passe d'une colonne à l'autre, en plus des puces d'état en haut.
3. La colonne T'attend remplace le bandeau d'E1b : mêmes boutons et mêmes règles. « Autoriser » et « Refuser » n'existent que pour une autorisation demandée (règle 3) ; un tour terminé n'a que « Voir la session » (règle 4). Une carte entière ouvre le détail de la session ([E2](#e2b)).
4. « Regrouper par » propose trois choix (projet, groupe, état) et garde le dernier d'une visite à l'autre (règle 6). Il n'y a pas de bande d'indicateurs ici : le coût du jour (estimé, règle 5) passe dans le sous-titre pour laisser la hauteur aux colonnes.
5. Les terminées du jour restent sous la colonne Inactives, la plus calme.

**Mobile** : les colonnes deviennent des puces d'état défilantes en haut ; une seule colonne est affichée à la fois, en cartes, avec des boutons de 44 px. L'écran montre la colonne T'attend.

### <a id="e1e"></a>E1e · Vue d'ensemble : chargement

Le premier affichage après l'activation des profils : Bosco lit encore l'historique des sessions. L'écran garde sa forme avec des blocs animés, une barre de progression réelle (le total est connu) et les sessions déjà arrivées, pour ne pas rester vide.

- **Depuis** [E1a](#e1a) après « Surveiller ces profils »
- **Ensuite** [E1b](#e1b) quand la lecture est finie

Règles de l'écran :

1. Les sessions ouvertes sont lues en premier et apparaissent dès qu'elles sont prêtes ; l'historique se lit ensuite, sans bloquer l'écran. Ici, deux lignes sont déjà arrivées, les suivantes sont des blocs animés.
2. La progression est réelle : le nombre total de sessions est connu avant la lecture (« 1 240 sessions lues sur 3 180 »). Le bandeau disparaît quand la lecture est finie.
3. On peut quitter l'écran à tout moment : la lecture continue et la progression se retrouve au retour. Les attentes détectées pendant la lecture sont signalées par la notification du bureau (règle 8).
4. Le chargement ordinaire, hors premier lancement, n'affiche que ces blocs animés, sans bandeau ni barre : moins d'une seconde est attendue. Les indicateurs et le coût du jour n'ont de valeur qu'une fois la lecture finie (règle 5).

**Mobile** : le bandeau de lecture passe en tête, en version compacte (progression, nombre de sessions lues, rappel qu'on peut quitter l'écran). Les blocs animés et les lignes déjà arrivées reprennent la liste mobile de [E1b](#e1b).

### <a id="e1f"></a>E1f · Vue d'ensemble : Bosco injoignable

Bosco ne répond plus : l'écran ne se vide pas, il garde les dernières informations reçues, atténuées et datées, et le dit en tête. Les réponses aux autorisations sont désactivées tant que Bosco est injoignable. La reconnexion est automatique.

- **Depuis** n'importe quel écran de Bosco, quand la connexion est perdue · [E1b](#e1b)
- **Ensuite** [E1b](#e1b) dès que Bosco répond de nouveau

Règles de l'écran :

1. Bosco détecte la coupure en moins de 5 s et tente de se reconnecter toutes les 5 s sans rien demander. « Réessayer » force une tentative immédiate. Rien n'est effacé de l'écran.
2. Les données sont figées avec leur heure : la colonne « Vu à » remplace les durées, qui seraient fausses. Les pastilles « En cours » ne sont plus animées, et le bloc d'état de la barre latérale disparaît : il ne pourrait afficher qu'une information périmée.
3. « Autoriser » et « Refuser » sont désactivés : une réponse qui n'arriverait pas à l'agent serait trompeuse. Les autorisations se donnent alors dans le terminal (règle 3). « Voir la session » reste disponible.
4. Au retour de Bosco, le bandeau disparaît et l'écran se remet à jour tout seul, sans rechargement. Une autorisation donnée entre-temps dans le terminal fait disparaître sa ligne ([E1b](#e1b)).

**Mobile** : le même bandeau passe en tête, avec un bouton « Réessayer » de 44 px. Si le téléphone a quitté le réseau, le message devient « Le poste ne répond pas » : Bosco ne tourne que sur le poste (règle 7).

### <a id="e1g"></a>E1g · Vue d'ensemble : regroupée par groupe

Le même regroupement lu par groupe : un intertitre par groupe, avec ses projets et ses sessions, pour suivre d'un coup d'œil tout ce qui touche un client ou une technologie. Une session à plusieurs projets apparaît dans chaque groupe de ses projets, avec la mention de l'autre groupe.

- **Depuis** [E1b](#e1b) avec « Regrouper par : Groupe »
- **Ensuite** [E2b](#e2b) au clic sur une session qui t'attend · [E2a](#e2a) et [E2k](#e2k) sur une session en cours · [E22d](contexte.md#e22d) au clic sur un groupe de la barre latérale · [E22a](contexte.md#e22a) via « Réglages du groupe »

Règles de l'écran :

1. « Regrouper par » propose trois choix : projet ([E1b](#e1b)), groupe et état ([E1d](#e1d)). Le dernier choix est gardé d'une visite à l'autre (règle 6). Le bandeau T'attend, les indicateurs et le tri des lignes sont ceux d'E1b.
2. Une session apparaît dans chaque groupe qui contient l'un de ses projets : api-tarifs est dans Club des Trois Lacs et dans Node.js, donc sa session est montrée dans les deux, avec la mention « aussi dans … ». Le compte des sessions de chaque intertitre compte donc une session par groupe où elle figure.
3. Une session à plusieurs projets se nomme d'après son projet principal et le nombre des autres (« api-tarifs +2 »). Elle s'ouvre dans [E2k](#e2k). En regroupement par projet, elle reste rangée sous api-tarifs, son projet principal (règle 14).
4. Les groupes se suivent dans l'ordre de la barre latérale. « Sans groupe » (projets qu'aucun groupe ne contient) puis « Hors projet » ferment la liste, seulement s'ils ont des sessions : ils n'apparaissent pas ici. « Tous les projets » n'a pas d'intertitre, puisqu'il contient tout.
5. Un clic sur un groupe de la barre latérale n'applique pas de filtre : il ouvre la page du groupe ([E22d](contexte.md#e22d)), avec les sessions de ses projets. Un lien « Réglages du groupe » ouvre [E22a](contexte.md#e22a). Un groupe masqué de la barre latérale s'ouvre depuis « Tous les projets » ([E20a](contexte.md#e20a)).

**Mobile** : la bascule « Regrouper par » garde ses trois choix en puces au-dessus de la liste ; les intertitres sont ceux des groupes, avec le nombre de projets. Les lignes suivent [E1b](#e1b), avec la mention « aussi dans … » dans la ligne du bas.

## <a id="e2"></a>E2 · Détail d'une session

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e2.html` · implémentation : **Écart (Développé (jusqu'à feat/close-remaining-gaps) : fil d'Ariane, cinq modes, sessions à plusieurs projets, suivi en direct proposé depuis le détail, choix recommandé coché d'office, session effacée refusée, marque « Bac à sable » dans la vue d'ensemble et l'historique. Accepté : « Arrêter » en bouton contour ; serveur du canal `bosco-channel` (`bosco` est le serveur MCP) ; sur le téléphone, les fichiers sont dans l'onglet Usage et la carte d'autorisation n'est pas une feuille du bas. Écarts E2j : les sorties refusées s'affichent en fin de fil, pas de consommation du conteneur, pas d'onglet « Bac à sable » sur le téléphone, aide sous la zone de message masquée sur le téléphone.)**

### <a id="e2a"></a>E2a · Détail d'une session : en cours

Le fil d'une session qui travaille, mis à jour au fil de l'eau : ce que l'agent dit, ce qu'il lit et modifie, ce que tu lui as demandé. À droite, la consommation et les fichiers touchés ; l'écran se lit sans rien faire et sert surtout à garder un œil sur une session sans retourner dans son terminal.

- **Depuis** [E1B](#e1b), [E1D](#e1d), [E21c](contexte.md#e21c) ou [E22d](contexte.md#e22d) au clic sur une session
- **Ensuite** [E2B](#e2b) quand l'agent demande une autorisation (même écran, le fil se prolonge d'une carte) · [E1B](#e1b) par la barre latérale · [E21c](contexte.md#e21c) par le fil d'Ariane (« Projets › creneaux »)

Règles de l'écran :

1. Le fil se met à jour sans recharger, le plus récent en bas. Tes demandes sont des bulles à droite ; les réponses de l'agent se lisent mises en forme (titres, listes, tableaux, code coloré). Chaque étape tient sur une ligne qui se déplie : une réflexion et sa durée, une commande et sa sortie, des tests et leurs cas en échec, une erreur et sa pile d'appels, une modification et ses lignes ajoutées ou retirées, un sous-agent et ses propres étapes, avec son modèle, sa consigne et son résultat. Plus de trois étapes à la suite se replient sous une ligne qui les résume, ouverte tant que l'agent y travaille. Le plan de l'agent se lit à la fin de chaque tour qui l'a changé (ce qui reste à faire, puis ce qui est fait), et les pages qu'il a consultées sont listées sous le tour. L'étape en cours tourne ; une étape restée sans résultat dans une session arrêtée est marquée « interrompu ». Une très longue session ne montre que ses derniers échanges, et une session dont Claude Code a effacé le transcript garde le fil résumé par Bosco.
2. « Revenir au direct » n'apparaît que lorsqu'on remonte dans le fil ; tant qu'on est en bas, le fil suit les nouveaux événements automatiquement.
3. Usage estimé au tarif public (règle 5), même sous abonnement. Le cache est la part des tokens lus depuis le cache plutôt que recalculés. Les chiffres bougent avec le fil.
4. Fichiers modifiés depuis le début de la session, comparés à l'état de la branche au démarrage. Les fichiers viennent des actions de l'agent : les changements faits par une commande shell n'y figurent pas.
5. Une session encore ouverte ne se reprend pas : la reprise mélangerait deux conversations (règle 9). La commande de reprise n'apparaît que lorsque la session est close ; d'ici là, la colonne ne garde que l'identifiant. « Copier le chemin du dossier » copie le dossier du projet pour ouvrir un terminal dessus.
6. Une session ouverte dans un terminal ne reçoit pas de message de Bosco : la reprendre ici mélangerait deux conversations (règle 9). On y répond dans le terminal ; la bande remplace le composer. Lancée avec le canal de Bosco ([E4f](reglages.md#e4f)), elle reçoit au contraire les messages écrits ici, en texte seulement ([E2i](#e2i)). Une fois la session close, elle se reprend aussi bien dans un terminal que dans Bosco ([E2g](#e2g)).

**Mobile** : écran poussé depuis la liste, avec le retour au projet (« creneaux »), qui reprend le fil d'Ariane du poste. Trois onglets (Fil, Usage, Fichiers) remplacent la colonne de droite ; le fil occupe tout l'écran, sans barre du bas : « Copier le chemin du dossier » est une action du poste.

### <a id="e2b"></a>E2b · Détail d'une session : t'attend, autoriser ou refuser

Même écran qu'une session en cours, mais le fil s'arrête sur une carte : l'agent demande l'autorisation de lancer une commande. Tout ce qu'il faut pour décider est dans la carte (la commande, le dossier, ce que l'agent en dit), et on répond sans quitter Bosco.

- **Depuis** [E1B](#e1b) par « Autoriser » / « Refuser », ou au clic sur une session qui t'attend
- **Ensuite** [E1B](#e1b) une fois la réponse donnée

Règles de l'écran :

1. La carte n'existe que si le suivi en direct est installé (règle 3). Sans suivi en direct, il n'y a pas de carte : rien ne signale l'attente dans Bosco, qui propose seulement d'installer le suivi ([E4B](reglages.md#e4b)).
2. La première réponse l'emporte, dans le terminal ou dans Bosco. Si l'autorisation a été donnée ailleurs, la carte devient « Répondu ailleurs à 15:15 » et ses boutons disparaissent. Si l'autorisation reste sans réponse trop longtemps, les boutons disparaissent de Bosco et le dialogue reste dans le terminal.
3. Le motif du refus est facultatif. Il est envoyé à l'agent comme consigne : il peut ainsi corriger sa demande au lieu de s'arrêter.
4. « Autoriser » vaut pour cette commande seulement. Pas de « toujours autoriser » depuis Bosco : une règle permanente se règle dans Claude Code (règle 3). Sur mobile, une confirmation précède l'envoi.
5. Après la réponse, retour à la vue d'ensemble s'il reste d'autres sessions en attente, avec un message bref (« Autorisé · Budget du foyer »). Sinon, on reste sur le fil, qui repart.
6. Les fichiers de la colonne « Branche » viennent des actions de l'agent : les changements faits par une commande shell n'y figurent pas.

**Mobile** : écran poussé ; la carte d'autorisation se colle en bas en feuille, avec deux boutons de 44 px. Un appui sur « Autoriser » ouvre d'abord une confirmation qui rappelle la commande ; « Refuser » envoie directement, avec le motif s'il est rempli (règle 7).

### <a id="e2e"></a>E2e · Détail d'une session : pilotée par Bosco

Une session démarrée depuis Bosco : on lui écrit directement depuis l'interface, sur le poste comme sur le téléphone. Le point focal est le composer sous le fil : un éditeur de texte avec mentions de fichiers et commandes, des images en pièces jointes, et une barre d'outils pour les autorisations, le modèle et l'effort. Un message écrit pendant que l'agent travaille attend la fin du tour ; « Arrêter » interrompt le tour. À droite, la consommation, les fichiers touchés et la commande pour reprendre la session dans un terminal entre deux tours.

- **Depuis** [E16A](#e16a) « Démarrer » · [E1B](#e1b) au clic sur la session
- **Ensuite** [E2F](#e2f) quand l'agent pose une question · [E2B](#e2b) quand il demande une autorisation · [E2H](#e2h) en tapant @ ou /

Règles de l'écran :

1. L'éditeur est un vrai champ de texte : plusieurs lignes, qui grandit avec le texte jusqu'à 10 lignes, puis défile. Entrée envoie, Maj+Entrée ajoute une ligne. @ mentionne un fichier du projet et / en tête de message choisit une commande : les deux deviennent des puces non modifiables, le reste est du texte simple (un bloc de code s'affiche en police à chasse fixe). Voir [E2h](#e2h). Si l'agent travaille, le message ne part pas tout de suite : il part au tour suivant.
2. Un message écrit pendant que l'agent travaille attend la fin du tour : « partira à la fin du tour ». « Annuler » le retire tant qu'il n'est pas parti. Il n'y a qu'un message en attente : un second s'ajoute au même.
3. Le bouton rond envoie le message (flèche). Pendant un tour, avec le champ vide, il devient un carré « Arrêter » : il interrompt le tour, comme Échap dans le terminal ; le message en attente reste et part aussitôt après. Champ rempli pendant un tour, c'est la flèche : le message part en attente.
4. La barre d'outils montre le mode d'autorisations avec son icône et propose les cinq (Demander, Accepter les modifications, Plan, Approuver pour moi, Accès complet ; règle 17), puis le modèle et l'effort. Comme l'agent est lancé à chaque tour, changer de mode vaut dès le tour suivant, ainsi que le modèle et l'effort. Passer à Accès complet sur le poste ouvre la confirmation d'[E16e](#e16e) ; le mode passe alors en orange. Quand Claude Code suspend Approuver pour moi après 3 refus de suite ou 20 au total, une ligne du fil le dit, à la fin du tour où c'est arrivé : « Approuver pour moi suspendu après 3 refus : les demandes reviennent dans Bosco ». Avec « Demander », chaque autorisation arrive dans Bosco sous la forme de la carte [E2b](#e2b). Le bouton « + » ajoute une image.
5. Pièces jointes : des images seulement (capture collée, glissée dans l'éditeur ou ajoutée par « + »), cinq au plus. Chaque puce se retire avec sa croix.
6. Entre deux tours, la session est close : elle se reprend dans un terminal avec la commande affichée, ou ici en écrivant. Tant qu'un terminal l'a rouverte, Bosco ne lui écrit plus (règle 9) : elle se lit alors comme une session ouverte dans un terminal ([E2a](#e2a)).

**Mobile** : écran poussé depuis la liste, onglet Fil. Le composer est une carte réduite collée en bas : « + », un éditeur d'une à trois lignes et le bouton rond ; pendant un tour, « Arrêter » remplace la flèche tant que le champ est vide. Les menus (autorisations, modèle, effort) s'ouvrent depuis une rangée de puces au-dessus de l'éditeur, qui défile horizontalement. Le message en attente s'affiche sous le fil, avec « Annuler ».

### <a id="e2f"></a>E2f · Détail d'une session : question de l'agent

Même session, un peu plus tard : l'agent a besoin d'un choix et le fil se termine par une carte de question. On répond sans quitter Bosco ; la session reprend aussitôt. L'état est « T'attend », comme pour une autorisation.

- **Depuis** [E2E](#e2e)
- **Ensuite** [E2E](#e2e) quand l'agent reprend

Règles de l'écran :

1. Une question de l'agent se répond dans Bosco. Les choix sont des boutons radio ; une question à choix multiples s'affiche en cases à cocher, et plusieurs questions se suivent dans la même carte. Le choix recommandé par l'agent est coché d'office et porte l'étiquette « Recommandé ».
2. « Autre » donne un champ de texte libre : la réponse écrite est transmise telle quelle à l'agent.
3. « Passer » laisse l'agent continuer sans réponse, comme Échap dans le terminal.
4. Tant que la question est sans réponse, le composer est désactivé, avec ses boutons : « Réponds d'abord à la question ».
5. La question arrive aussi en notification « Question de l'agent » et dans le centre de notifications ([E15a](#e15a)). Dans une session ouverte dans un terminal, une question se répond dans le terminal : Bosco n'affiche alors que « répondu dans le terminal ».

**Mobile** : la carte de question occupe le bas du fil ; les choix sont de grandes lignes tactiles et « Répondre » prend toute la largeur. Le composer, désactivé, reste visible dessous.

### <a id="e2g"></a>E2g · Détail d'une session : close, reprise dans Bosco

Une session terminée (ici celle d'un terminal) n'est pas un cul-de-sac : le composer en bas du fil la reprend en un message, dans Bosco. La commande de reprise pour un terminal reste proposée à droite.

- **Depuis** [E1B](#e1b) · [E3A](#e3a) (historique)
- **Ensuite** [E2E](#e2e) une fois le premier message envoyé

Règles de l'écran :

1. Le premier message relance la session : la flèche ronde l'envoie, et Bosco reprend la session sur ce poste, dans le dossier du projet, pour un tour. Elle devient alors une session pilotée dans Bosco (icône message-square) et se lit comme [E2e](#e2e). L'éditeur est le même (fichiers par @, commandes par /, images).
2. Le bandeau rappelle où la session tourne (ce poste, ce dossier) et avec quel profil : le profil de la session, ici pro. Les réglages de la barre d'outils (autorisations, modèle, effort) valent pour ce premier message.
3. Deux façons de continuer la même conversation : écrire ici, ou copier la commande de reprise dans un terminal. Une fois rouverte dans un terminal, Bosco ne lui écrit plus (règle 9).
4. Une session effacée par Claude Code ne se reprend plus (règle 10) : le composer est alors remplacé par « Effacée par Claude Code : elle ne se reprend plus ».

**Mobile** : le composer est la carte réduite collée en bas, sous le bandeau court « Session close · ton message la reprend ». Les menus d'autorisations, de modèle et d'effort sont dans la rangée de puces au-dessus de l'éditeur. Pas de commande à copier sur le téléphone.

### <a id="e2h"></a>E2h · Détail d'une session : mentionner un fichier ou lancer une commande

Dans l'éditeur du composer, « @ » ouvre la liste des fichiers du projet et « / » en tête de message celle des commandes et skills. Le choix devient une puce dans le message. L'exemple montre la session entre deux tours, pendant qu'on tape une mention.

- **Depuis** [E2E](#e2e)
- **Ensuite** [E2E](#e2e)

Règles de l'écran :

1. « @ » propose les fichiers suivis du projet, les plus proches du texte tapé d'abord, avec la partie tapée en gras. Le fichier choisi devient une puce non modifiable dans le message, et l'agent le lit.
2. « / » en tête de message propose les commandes et skills du profil et du projet, chacun avec son origine. Les commandes propres au terminal (réglages, connexion…) n'y sont pas. La commande choisie devient une puce en tête du message.
3. Au clavier : ↑ ↓ pour choisir, Entrée pour insérer, Échap pour fermer le menu sans rien insérer.
4. Sur le téléphone, une feuille remonte au-dessus du clavier à la place du menu : les lignes sont plus hautes et se touchent.

**Mobile** : l'éditeur contient « / » et la feuille « Commandes et skills » remonte au-dessus du clavier : un nom en mono, son origine et sa description par ligne. Pour « @ », la même feuille liste les fichiers du projet.

### <a id="e2i"></a>E2i · Détail d'une session : ouverte dans un terminal, avec le canal de Bosco

La session d'un terminal, lancée avec le canal de Bosco : on peut lui écrire d'ici, en texte seulement. Le fil est celui de E2a, avec les messages envoyés depuis Bosco signalés comme tels ; la zone de message est une version réduite du composer, sans réglages, puisque ceux-ci se font dans le terminal.

- **Depuis** [E1B](#e1b), [E1D](#e1d), [E21c](contexte.md#e21c) ou [E22d](contexte.md#e22d) au clic sur une session
- **Ensuite** [E2B](#e2b) quand l'agent demande une autorisation

Règles de l'écran :

1. L'étiquette « Canal de Bosco » est présente tant que la session du terminal a son canal ouvert, c'est-à-dire lancée avec le canal ([E4f](reglages.md#e4f)). Elle disparaît à la fermeture de la session ; sans elle, l'écran est celui de [E2a](#e2a).
2. Un message envoyé par le canal s'affiche dans le fil comme ta demande, avec la mention « depuis Bosco ». Dans le terminal, il arrive sous la forme ← bosco-channel : … et l'agent y répond comme à une saisie.
3. La zone de message est réduite : du texte seulement, sans images, sans « + », sans réglages d'autorisations, de modèle ou d'effort, sans « Arrêter » : tout cela se règle dans le terminal. Si l'agent travaille, le message attend la fin du tour, dans le terminal. Les fichiers par @ et les commandes par / se choisissent comme dans [E2h](#e2h).
4. Les autorisations et le reste du fil continuent de passer par le suivi en direct : une autorisation demandée arrive en carte T'attend ([E2b](#e2b)).

**Mobile** : écran poussé depuis la liste, onglet Fil. La zone de message réduite est collée en bas : le rappel « Ouverte dans un terminal · ton message y arrive par le canal de Bosco », un champ de texte et le bouton rond d'envoi, sans « + » ni puces de réglages.

### <a id="e2j"></a>E2j · Détail d'une session : dans un bac à sable

Une session pilotée qui tourne dans un bac à sable : même fil, même zone de message, mêmes autorisations qu'[E2e](#e2e). Ce qui change est à droite : l'état du bac à sable et ce qu'il consomme, puis la branche de la session, avec ce qu'elle contient et « Récupérer la branche », qui ramène le travail dans le projet du poste. Dans le fil, une sortie réseau refusée s'affiche à l'endroit où l'agent l'a tentée.

- **Depuis** [E16B](#e16b) « Démarrer » · [E1B](#e1b) au clic sur la session
- **Ensuite** [E11a](reglages.md#e11a) pour ajouter un domaine · [E19A](reglages.md#e19a) dans les conteneurs en cours

Règles de l'écran :

1. La marque « Bac à sable » suit la session partout : en-tête, vue d'ensemble ([E1b](#e1b)), notifications, historique. L'agent ne voit qu'une copie du projet, sur la branche de la session, et l'accès à l'abonnement : ni les fichiers du poste, ni ses accès, ni les autres projets (règle 12). La session ne se reprend que dans Bosco : aucune commande de reprise dans un terminal n'est proposée.
2. Une sortie réseau refusée s'affiche dans le fil, à son heure, avec le domaine et la commande qui l'a tentée ; l'agent reçoit le refus comme une erreur de sa commande. « Ajouter à la liste » propose les domaines du projet ([E21a](contexte.md#e21a)) ou la liste générale d'[E11a](reglages.md#e11a), avec le domaine rempli (sur le poste seulement) ; il vaut au tour suivant. Plusieurs refus du même domaine dans un tour se regroupent en une ligne.
3. Le conteneur reste démarré pendant la session : chaque tour s'y exécute sans le recréer, et ce que l'agent lance en arrière-plan (serveur de développement, surveillance des fichiers) continue d'un tour à l'autre. Après 30 min sans message, il s'arrête (« En veille ») ; le message suivant le redémarre en quelques secondes, sans rien perdre : la copie du projet, la conversation et ce que l'agent a installé sont gardés hors du conteneur. Il n'est recréé que pour reprendre une session terminée, après un changement d'image du projet ou s'il a disparu. Ses plafonds sont ceux de l'isolation du bac à sable ([E11a](reglages.md#e11a)) ; démarré, il apparaît dans les conteneurs en cours ([E19a](reglages.md#e19a)).
4. « Récupérer la branche » enregistre le travail en cours de la session dans sa branche, puis rapatrie la branche dans le projet du poste, sans changer la branche courante ni toucher aux fichiers du poste. Elle se récupère entre deux tours, autant de fois qu'on veut : la dernière version remplace la précédente, et une branche du poste qui a avancé de son côté n'est jamais écrasée (message bref « Branche modifiée sur le poste : récupérée sous bosco/s-typescript-6-2 »). Après, la carte dit « récupérée à 15:16 » et la liste des fichiers ce qui a changé depuis.
5. Zone de message, autorisations et questions comme en [E2e](#e2e) et [E2f](#e2f). « Accepter les modifications » est le mode par défaut ; une commande demandée en « Demander » arrive comme une carte [E2b](#e2b). Un message envoyé pendant que le bac à sable redémarre attend « Démarrage du bac à sable », puis part.
6. Le menu « … » propose « Arrêter le bac à sable » et « Supprimer le bac à sable » : la suppression se confirme, prévient si la branche a du travail non récupéré, puis efface le conteneur et la copie du projet ; la session reste lisible dans l'historique, mais ne se reprend plus. Sans suppression à la main, le bac à sable est supprimé 7 jours après le dernier message ; si la branche a du travail non récupéré, une notification le dit la veille, avec « Récupérer la branche ».

**Mobile** : le même fil, avec la sortie refusée en ligne d'avertissement. Une barre au-dessus de la zone de message rappelle la branche et porte « Récupérer » ; l'onglet Bac à sable reprend l'état, la consommation et les actions du menu, l'onglet Fichiers la liste de la branche. Ajouter un domaine à la liste ne se fait que sur le poste.

### <a id="e2k"></a>E2k · Détail d'une session : à plusieurs projets

Une session pilotée qui porte sur plusieurs projets, ici ceux du groupe Club des Trois Lacs : même fil, même zone de message qu'[E2e](#e2e). Ce qui change est à droite : la carte « Projets » dit où la session tourne (le projet principal) et ce qu'elle touche ailleurs, et la commande de reprise dans un terminal ajoute les autres projets.

- **Depuis** [E16c](#e16c) « Démarrer » · [E1b](#e1b) et [E1g](#e1g) au clic sur la session
- **Ensuite** [E22a](contexte.md#e22a) pour le groupe

Règles de l'écran :

1. La session tourne dans le projet principal, api-tarifs : c'est son dossier de travail, et l'étoile le marque. Elle voit aussi site-clubs et creneaux, qu'elle peut lire et modifier, avec leurs instructions ; chaque projet montre sa branche et ses fichiers modifiés (règle 14).
2. Elle se range sous api-tarifs dans la vue d'ensemble (« api-tarifs +2 », [E1b](#e1b)), et apparaît dans la page de chacun de ses projets, sous « Aussi dans ce projet » ([E21c](contexte.md#e21c)), et dans les groupes qui les contiennent ([E1g](#e1g)).
3. La commande de reprise ajoute les autres projets, précédée de la variable qui fait lire leurs instructions, pour retrouver le même contexte dans un terminal ; elle n'apparaît qu'entre deux tours, comme pour toute session pilotée (règle 9). Une session lancée dans un terminal n'a qu'un projet, celui de son dossier.
4. En bac à sable ([E16d](#e16d)), la carte devient « Branches » : une ligne par projet, avec ce que la branche contient. « Récupérer les branches » rapatrie celles qui ont du travail, un projet à la fois ou toutes ; les projets sans changement sont laissés (comme [E2j](#e2j)).
5. Le contexte transmis à l'agent est celui de chaque projet, le projet principal d'abord : instructions de « Tous les projets » et des groupes, puis décisions du projet ([E9f](contexte.md#e9f)).

**Mobile** : un onglet « Projets » à côté de « Fil » et « Usage » reprend la carte des projets et la commande de reprise ; le fil et la zone de message sont ceux d'[E2e](#e2e).

## <a id="e3"></a>E3 · Historique

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e3.html` · implémentation : **Livré (Développé (feat/usage-page) : onglet « Coûts » retiré, l'usage a sa page (E23) ; filtre par groupe. Écart : « Tout afficher » d'un jour chargé n'existe pas, toutes ses sessions sont montrées.)**

### <a id="e3a"></a>E3a · Historique : recherche et liste

Toutes les sessions passées et ouvertes des profils surveillés, jour par jour. On y retrouve une session par un mot de son titre, d'un message ou d'une commande, et on voit ce que chaque journée a coûté.

- **Depuis** l'entrée « Historique » de la navigation · [E21c](contexte.md#e21c) (« Voir l'historique ») · [E1b](#e1b) pour les sessions terminées
- **Ensuite** [E2g](#e2g) au clic sur une session terminée · [E2a](#e2a) sur une session ouverte

Règles de l'écran :

1. La recherche porte sur les titres, les messages et les commandes de toutes les sessions des profils surveillés. Elle s'applique pendant la frappe ; le raccourci « / » place le curseur dans le champ.
2. Les filtres en puces se cumulent (période, projet, groupe, profil, état) et se retirent un par un. Filtrer sur un groupe garde les sessions de tous ses projets, celles à plusieurs projets comprises (règle 14). Tout l'historique des profils surveillés est conservé (réglable dans les [sources](reglages.md#e4a)). Une session plus vieille que la rétention de Claude Code reste lisible, sans reprise (règle 10).
3. Chaque jour a son total : nombre de sessions et coût estimé (règle 5). Les jours se suivent du plus récent au plus ancien ; la liste se charge par jour au défilement.
4. L'état affiché est l'état final. Une session toujours ouverte garde son état actuel (T'attend, En cours). Pour une session « En échec », la raison (quota de l'abonnement atteint, interrompue…) est visible sous le titre et au survol du badge.
5. Toute la ligne ouvre le détail : [E2g](#e2g) pour une session terminée, [E2a](#e2a) ou [E2b](#e2b) pour une session ouverte.
6. L'historique n'est plus que la recherche des sessions : l'usage (tokens, coût estimé, quota) a sa page, [E23a](#e23a), sous « Usage » dans la barre latérale. Sur le téléphone, la bascule « Sessions | Usage » en tête de l'onglet y mène.

**Mobile** : recherche en haut, puces de filtre défilantes, liste par jour en lignes compactes (état, titre, projet et profil, heure, coût). La bascule « Sessions | Usage » est en tête de l'onglet ; les cibles font 44 px.

### <a id="e3b"></a>E3b · Historique : coûts par jour et par projetRetiré

Ancien onglet « Coûts » de l'historique : un total, un coût par jour empilé par projet, puis la répartition par projet et par modèle. L'identifiant est gardé pour ne pas le réutiliser.

## <a id="e23"></a>E23 · Usage

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e23.html` · implémentation : **Livré (Développé (feat/usage-page) : filtres dans l'adresse, graphique quotidien en SVG (jours au clavier, vue en tableau), quota, répartition (cinq lignes puis « N autres »), PR créées ; sur le téléphone, le graphique montre les 7 derniers jours de la période.)**

### <a id="e23a"></a>E23a · Usage : 30 derniers jours

La page qui répond à « qu’ont consommé mes sessions ? » : l’activité de Bosco, les tokens et le coût estimé, un graphique par jour, le quota de chaque abonnement et la répartition par projet, par modèle et par profil. Une seule ligne de filtres vaut pour toute la page, sauf pour le quota.

- **Depuis** l’entrée « Usage » de la navigation · « Usage » du menu ⋯ d’un projet ou d’un groupe, déjà filtrée ([E20d](contexte.md#e20d), [E23b](#e23b)) · le téléphone, onglet Historique › Usage
- **Ensuite** [E23b](#e23b) dès qu’un filtre de projet ou de groupe est choisi, ou au clic sur un projet de la répartition · [E11c](reglages.md#e11c) au clic sur « Seuils »

Règles de l'écran :

1. Les chiffres viennent des transcripts des sessions, relus par Bosco : tokens d’entrée, de sortie, de lecture et d’écriture du cache, tours et modèle (règle 18). Les données ne remontent pas avant l’historique conservé ; le sous-titre dit depuis quand.
2. Une seule ligne de filtres : période (7 j, 30 j par défaut, 90 j, depuis le début), profil, projet ou groupe, modèle. Ils valent pour toute la page, sauf le quota, qui se lit par abonnement. Les choix sont gardés d’une visite à l’autre. « Voir en tableau » ouvre les mêmes données, une ligne par jour.
3. Cinq tuiles disent ce que Bosco a fait : sessions pilotées lancées, temps de travail des agents (durée cumulée des tours), bacs à sable créés, branches récupérées et PR créées. Les PR sont repérées dans le fil des sessions, par la commande qui en crée une et l’adresse qu’elle rend : une PR créée hors d’une session n’est pas comptée.
4. La réutilisation du cache est la lecture du cache divisée par l’entrée plus la lecture du cache ; « tours sans lecture du cache » compte les tours qui n’ont rien relu. Le coût est estimé au tarif public de l’API, même sous abonnement (règle 5) : un modèle sans tarif connu est exclu du total et signalé sous le chiffre.
5. Un seul axe vertical, gradué en millions de tokens ; les quatre séries sont empilées dans un ordre fixe (lecture du cache en bas, entrée en haut), séparées de 2 px, et la légende reste toujours affichée. Le total n’est inscrit que sur le pic et sur le dernier jour, marqué « en cours ». Au survol d’un jour, les autres barres s’estompent et une info-bulle détaille les quatre séries, le total et le coût estimé. « Coût estimé » remplace les tokens par le coût sur le même axe unique : jamais deux mesures sur deux axes. Un segment trop fin pour se voir garde 2 px de haut.
6. Une ligne par abonnement : la part utilisée de la fenêtre de 5 h et de la semaine, telle que Claude Code la donne à chaque tour (règle 13), et l’heure de remise à zéro. Deux repères marquent le seuil d’attente et le seuil d’arrêt. La jauge passe en orange au-delà du seuil d’attente, avec l’icône « main » et la conséquence : les messages aux sessions retenues attendent. « Seuils » ouvre le réglage.
7. Les plus gros d’abord, les petits regroupés en « autres » ; la barre est la part du total, d’une seule couleur car c’est une grandeur et non une identité. Un clic sur un projet filtre toute la page sur lui. Un modèle sans tarif connu s’y affiche « non chiffré ».

**Mobile** : l’onglet Historique s’ouvre sur la bascule « Sessions | Usage », avec « Usage » actif. Les filtres sont des puces défilantes, les tuiles passent sur deux colonnes, le graphique se limite aux 7 derniers jours avec une barre lisible par jour (toucher une barre ouvre son détail) ; le quota et la répartition suivent en dessous, la page défile.

### <a id="e23b"></a>E23b · Usage : filtrée sur un groupe, survol d’un jour

La même page limitée à un groupe sur 7 jours : les filtres affichent leur valeur, la puce du groupe se retire d’un clic ou toute la ligne se réinitialise, et le survol du dernier jour détaille ses quatre séries. Le quota ne bouge pas : il vaut pour l’abonnement entier.

- **Depuis** « Usage » du menu ⋯ du groupe Club des Trois Lacs ([E20d](contexte.md#e20d)) · un filtre de groupe ou de projet choisi dans [E23a](#e23a) · un clic sur un projet de la répartition
- **Ensuite** [E23a](#e23a) avec « Réinitialiser » · [E11c](reglages.md#e11c) au clic sur « Seuils »

Règles de l'écran :

1. On arrive déjà filtré depuis le menu ⋯ d’un groupe ou d’un projet (« Usage »), ou en choisissant un groupe ou un projet dans le filtre de [E23a](#e23a). Le groupe se lit dans la puce et dans les chiffres : tout ce qui suit ne porte que sur ses projets.
2. La puce « Groupe : Club des Trois Lacs » se retire d’un clic sur la croix ; « Réinitialiser » remet tous les filtres à leur valeur par défaut (30 j, tous). Les filtres restent gardés d’une visite à l’autre.
3. Le quota ne se filtre pas : il vaut pour tout l’abonnement, quel que soit le groupe, et il est toujours montré en entier. Le graphique couvre 7 jours ; le survol du 17 nov. donne ses quatre séries (18,2 M de tokens), le total et le coût estimé (7,90 $).
4. Une session qui touche plusieurs projets du groupe compte pour chacun de ces projets dans la répartition, mais une seule fois dans les totaux du groupe : la somme des projets peut dépasser le total.
5. La répartition par projet se limite aux projets du groupe : api-tarifs, creneaux et site-clubs. Un clic sur l’un d’eux remplace le groupe par ce projet dans le filtre.

**Mobile** : même logique que [E23a](#e23a) : la puce du groupe s’ajoute aux puces défilantes (toucher la croix la retire) et le graphique garde 7 jours.

## <a id="e15"></a>E15 · Notifications

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e15.html` · implémentation : **Livré (Développé : onglet Notifications, fil « Réglages › Notifications », lecture seule sur le téléphone. Accepté : le titre d'une session sans titre est sa première demande, coupée à la fin d'un mot.)**

### <a id="e15a"></a>E15a · Notifications : centre de notifications

La cloche de la barre latérale ouvre un tiroir avec les notifications récentes, lues ou non : ce qui t'attend en tête, puis ce qui est fini. On y répond à une autorisation sans quitter l'écran.

- **Depuis** la cloche de la barre latérale, sur tous les écrans · une notification du bureau, au clic
- **Ensuite** [E2b](#e2b) en ouvrant une session · [E15b](#e15b) avec « Réglages »

Règles de l'écran :

1. La cloche porte le nombre de notifications non lues ; elle ouvre un tiroir à droite, sur toute la hauteur, au-dessus de l'écran en cours, qui reste visible en retrait. La croix, Échap ou un clic à côté le referment. « Tout marquer comme lu » vide le compteur sans rien effacer. « À traiter » ne garde que ce qui attend encore une réponse ; « Toutes » montre aussi ce qui est fini ou déjà répondu.
2. Une notification dit son type (Autorisation, Question de l'agent, Question de fin de tour, En échec, Fin de tour, Session terminée), la session, et un extrait : la commande, la question ou la fin du message. Une autorisation se répond ici : « Autoriser » et « Refuser » comme dans le bandeau T'attend (règle 3) ; une question n'a que « Ouvrir » (règle 4). Un clic sur la ligne ouvre la session ([E2b](#e2b)) et marque la notification lue.
3. Une notification déjà traitée le dit (« répondu dans le terminal ») et sort de « À traiter ». Le centre garde exactement ce que les réglages notifient ([E15b](#e15b)), même quand la notification du bureau est coupée ou que Bosco était devant toi.
4. Les notifications sont gardées 7 jours. « Réglages des notifications » ouvre [E15b](#e15b).
5. Sur le téléphone, la cloche est dans la barre du haut ; la liste s'ouvre en écran poussé. Une autorisation s'y répond comme dans [E2b](#e2b), avec la confirmation du téléphone.

**Mobile** : écran poussé depuis la cloche de la barre du haut, mêmes filtres, réponses possibles aux autorisations.

### <a id="e15b"></a>E15b · Réglages : notifications

L'onglet « Notifications » des Réglages, à côté de Sources, Téléphone, Abonnement Claude et Bac à sable ([lot 5](reglages.md#e4a)). Ce qui mérite une notification : une question qui t'attend, un travail fini. Chaque cas se coupe ou se garde ; une fin de tour ne notifie que si l'agent a travaillé longtemps. L'aperçu montre la notification du bureau.

- **Depuis** « Réglages » en bas de la barre latérale, onglet « Notifications » · « Réglages des notifications » de [E15a](#e15a)
- **Ensuite** [E15a](#e15a), qui suit les mêmes réglages

Règles de l'écran :

1. La notification du bureau est envoyée par le service, même sans onglet ouvert (règle 8) ; elle se coupe sans toucher au tiroir des notifications ([E15a](#e15a)), qui garde tout. Quand l'onglet Bosco est au premier plan, un message bref ([E15c](#e15c)) la remplace : inutile de doubler ce qui est déjà sous tes yeux.
2. « Une question t'attend » : une autorisation demandée, une question de l'agent (il propose des choix) et une fin de tour dont le dernier message finit par une question. Les trois sont activées par défaut.
3. « Un travail est fini » : une fin de tour sans question et une session terminée (désactivée par défaut). La fin de tour propose Jamais, Après un long tour (par défaut, à partir de 2 min, réglable de 1 à 30 min) ou Toujours : un tour se mesure de ta demande jusqu'à la main rendue.
4. La notification du bureau porte l'icône de Bosco ; son titre dit le type (Question, Autorisation, En échec, Fin de tour, Session terminée) et le projet ; son texte donne la session en gras, coupée à la fin d'un mot, puis un extrait : les dernières phrases entières du message, sans mise en forme, ou la commande à autoriser. « Ouvrir » ou un clic ouvre la session dans Bosco. Une seule notification par session : la suivante remplace la précédente au lieu de s'empiler. Une question ou une autorisation passe en priorité haute et reste affichée ; le reste disparaît seul.
5. Sur le téléphone, les réglages se lisent sans se changer ; la mention « Modifiable depuis le poste » l'explique.

**Mobile** : écran poussé en lecture seule, ouvert depuis Réglages.

### <a id="e15c"></a>E15c · Notifications : messages brefs

Les messages en bas de l'écran : la confirmation d'une action, et la notification qui remplace celle du bureau quand Bosco est devant toi. Ils disent leur sujet en une ligne, proposent au plus une action et se ferment seuls.

- **Depuis** une action (« Autoriser ») · une notification quand Bosco est au premier plan ([E15b](#e15b))
- **Ensuite** l'action du message : [E2b](#e2b)

Règles de l'écran :

1. Un message bref a une couleur selon son sens (réussi, information, à traiter), une icône, un titre d'une ligne (l'action ou le type, puis la session) et une ligne d'extrait. Il se ferme seul après 5 secondes, ou d'un clic sur la croix ; le survol le garde ouvert.
2. Un message qui propose une action (« Ouvrir ») la garde 8 secondes, une seule par message. Quand l'onglet Bosco est au premier plan, une notification arrive en message bref au lieu de la notification du bureau ([E15b](#e15b)), avec « Ouvrir » ; une question reste affichée jusqu'à ce qu'on l'ouvre ou la ferme. Trois messages au plus, le plus récent en bas ; un message de plus fait partir le plus ancien. Chacun est annoncé aux lecteurs d'écran.
3. Sur le téléphone, le message prend toute la largeur au-dessus de la barre d'onglets.

**Mobile** : mêmes messages, sur toute la largeur, au-dessus de la barre d'onglets.

## <a id="e16"></a>E16 · Nouvelle session

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e16.html` · implémentation : **Livré (Développé (feat/multi-project-sessions, feat/session-defaults) : champ « Projets », valeurs par défaut avec leur origine, cinq modes, confirmation de l'accès complet sur le poste. Haiku 4.5, seul modèle sans « Approuver pour moi », figure au menu des modèles ; la confirmation de l'accès complet est demandée par l'interface, l'API ne la vérifie pas.)**

### <a id="e16a"></a>E16a · Nouvelle session : formulaire

Démarrer une session sans ouvrir de terminal, comme on ouvre un nouveau fil : le projet et l'abonnement en haut, puis le premier message dans le composer, avec ses réglages (autorisations, modèle, effort) dans la barre d'outils. Le récapitulatif de droite rappelle où la session tourne et comment elle se poursuit. Le fil d'Ariane dit d'où l'on vient : « Nouvelle session » depuis la vue d'ensemble, « Projets › api-tarifs › Nouvelle session » depuis un projet (règle 15).

- **Depuis** [E1B](#e1b) avec « Nouvelle session » · [E21c](contexte.md#e21c) avec « Nouvelle session » d'un projet (projet déjà rempli) · [E20d](contexte.md#e20d) avec « Nouvelle session dans … » du menu ⋯ d'un projet
- **Ensuite** [E2E](#e2e) avec « Démarrer » · [E16B](#e16b) avec « Bac à sable » · [E16c](#e16c) avec un groupe · [E16e](#e16e) avec « Accès complet »

Règles de l'écran :

1. La liste propose d'abord les groupes, puis les projets que tu as ajoutés, les plus récents d'abord. Un seul projet ici : sa puce porte l'étoile du projet principal, et le dossier, la branche courante et les fichiers modifiés s'affichent dessous. Plusieurs projets, ou un groupe, se choisissent comme en [E16c](#e16c).
2. Le profil proposé suit l'ordre des valeurs par défaut (règle 16) : le groupe choisi, sinon le projet principal, sinon le profil par défaut réglé dans [E11c](reglages.md#e11c) ; ici « pro · profil par défaut ». On peut en choisir un autre pour cette session.
3. Le premier message se rédige dans le même éditeur que pour écrire à une session ([E2e](#e2e)) : plusieurs lignes, fichiers par @, commandes par /, images en pièces jointes ([E2h](#e2h)).
4. Avertissement non bloquant : si une session est déjà ouverte dans ce dossier, dans un terminal, les deux agents modifieraient les mêmes fichiers. On peut démarrer quand même ; « Voir la session » ouvre l'autre session.
5. La barre d'outils règle les autorisations, le modèle et l'effort ; chaque puce dit d'où vient sa valeur (règle 16) : « défaut du profil pro » pour les autorisations, « défaut du projet api-tarifs » pour le modèle et l’effort ; sans réglage nulle part, « celui du profil Claude Code ». Le menu des autorisations propose les cinq modes, chacun avec son icône (règle 17) : Demander (coché ici), Accepter les modifications, Plan, Approuver pour moi (grisé, avec sa raison, si le modèle choisi ne le permet pas) et Accès complet, en orange. Choisir Accès complet sur le poste ouvre la confirmation d'[E16e](#e16e). Ces choix se font au démarrage et se changent ensuite entre deux tours depuis la session ([E2e](#e2e)).
6. « Démarrer » ouvre [E2e](#e2e) et lance le premier tour. La session apparaît dans la vue d'ensemble ([E1b](#e1b)) avec l'icône message-square. « Annuler » revient à la vue d'ensemble.
7. « Sur le poste » est le défaut : la session tourne dans le dossier du projet principal, comme dans un terminal (règle 4). « Bac à sable » la fait tourner dans un conteneur isolé, sur une copie du projet (règle 12) : le formulaire devient celui d'[E16b](#e16b). Le choix est gardé pour la nouvelle session suivante du même projet principal.

**Mobile** : écran poussé « Nouvelle session » (retour « Vue d'ensemble »), dans le même ordre : projet, avertissement, abonnement, où elle tourne, puis le composer pleine largeur. Les autorisations, le modèle et l'effort s'ouvrent depuis la rangée de puces au-dessus de l'éditeur, et « Démarrer » est pleine largeur sous la carte.

### <a id="e16b"></a>E16b · Nouvelle session : dans un bac à sable

La même session, mais dans un bac à sable : un conteneur sur le poste, qui ne voit qu'une copie du projet, sur sa propre branche. Le formulaire ajoute la branche de départ et le nom de la branche de la session ; le récapitulatif dit ce que l'agent voit, où il peut se connecter, et comment le travail revient dans le projet.

- **Depuis** [E16A](#e16a) avec « Bac à sable »
- **Ensuite** [E2J](#e2j) avec « Démarrer »

Règles de l'écran :

1. Même champ « Projets » qu'en [E16a](#e16a) ; avec un groupe, le formulaire est celui d'[E16d](#e16d). Pas d'avertissement pour une session ouverte dans le même dossier : le bac à sable travaille sur sa propre copie, les deux agents ne se gênent pas.
2. « Partir de » propose la branche courante du projet, puis les autres branches. La copie prend la branche telle qu'elle est enregistrée : les fichiers modifiés du poste, non commités, ne sont pas copiés, et le formulaire le dit. Le nom de la branche de la session est proposé d'après le premier message, sous le préfixe bosco/s- ; il se modifie, et un nom déjà pris dans le projet est refusé.
3. « Bac à sable » est indisponible, grisé avec sa raison, dans deux cas : Docker ne répond pas (« Docker ne répond pas »), ou un projet de la session n'est pas un dépôt git (« notes-clubs n'est pas un dépôt git »).
4. Quand aucun niveau (profil, groupe, projet) ne règle les autorisations, le mode passe à « Accepter les modifications », signalé « défaut en bac à sable » : l'agent ne peut abîmer que sa copie (règle 12). Si un niveau en règle un, il l'emporte, y compris « Approuver pour moi » ou « Accès complet », sans confirmation puisque le bac à sable est isolé (règle 17). Les cinq modes restent possibles, et le mode se change ensuite entre deux tours depuis la session.
5. « Démarrer » prépare le bac à sable (copie du projet, démarrage du conteneur, quelques secondes affichées « Préparation du bac à sable » dans le fil), puis lance le premier tour : [E2j](#e2j).
6. Le bac à sable est isolé du poste ([E11a](reglages.md#e11a)) : image de l'agent, plafonds de mémoire, de processeur et de processus, sortie réseau limitée aux domaines autorisés (règle 12). L'accès à l'abonnement choisi est une copie de celui du profil, gardée hors du conteneur et retirée avec le bac à sable. Rien d'autre du profil n'entre, ni ses serveurs ni ses connecteurs : les instructions, skills et commandes du projet viennent avec la copie.

**Mobile** : le même ordre qu'[E16a](#e16a), avec la branche de départ et celle de la session côte à côte à la place de l'avertissement. Le récapitulatif n'est pas repris : ce que voit l'agent se lit sur la session ([E2j](#e2j)).

### <a id="e16c"></a>E16c · Nouvelle session : avec un groupe

Démarrer une session sur plusieurs projets en choisissant un groupe : ses projets remplissent le champ, le projet principal en tête, et la session tourne sur le poste. On retire ou on ajoute un projet pour cette session seulement, sans changer le groupe. Le récapitulatif dit où elle tourne et ce qu'elle voit d'autre. Ici la session part de la page du groupe, ce que dit le fil d'Ariane (règle 15).

- **Depuis** [E16a](#e16a) en choisissant un groupe · [E22d](contexte.md#e22d) avec « Nouvelle session dans ce groupe » · [E20d](contexte.md#e20d) avec le menu ⋯ d'un groupe
- **Ensuite** [E2k](#e2k) avec « Démarrer » · [E16d](#e16d) avec « Bac à sable »

Règles de l'écran :

1. Choisir un groupe (puce « Club des Trois Lacs ») remplit le champ avec ses projets, le projet principal en tête. On retire un projet avec la croix de sa puce, ou on en ajoute un avec « + Projet », pour cette session seulement : le groupe ne change pas. Le champ propose les groupes avant les projets.
2. Le projet principal, marqué d'une étoile, est le dossier de travail de la session : elle y tourne et voit les autres, qu'elle peut lire et modifier. On le change en cliquant l'étoile d'un autre projet (règle 14).
3. L'avertissement s'applique à chaque projet : ici une session est déjà ouverte dans le dossier de creneaux, dans un terminal. Il ne bloque pas ; « Voir la session » ouvre l'autre session.
4. L'abonnement proposé est celui du groupe (« défaut du groupe »), réglé dans [E22a](contexte.md#e22a) ; à défaut, l'abonnement par défaut de [E11c](reglages.md#e11c). « Où elle tourne » reprend le dernier choix du projet principal.
5. Le récapitulatif nomme le projet principal et ceux que la session voit en plus. Pour chaque projet, l'agent reçoit son contexte, le projet principal d'abord ([E9f](contexte.md#e9f)). « Démarrer » ouvre [E2k](#e2k).
6. Les valeurs par défaut suivent l'ordre de la règle 16 et chaque puce dit d'où elle vient : « Approuver pour moi · défaut du groupe » (le groupe Club des Trois Lacs le règle), « Sonnet 5.5 · défaut du projet api-tarifs » et « Effort : élevé · défaut du projet api-tarifs » (le groupe ne règle ni le modèle ni l'effort, le projet principal les règle). Le menu propose les cinq modes (règle 17) ; Approuver pour moi est coché, et il est grisé avec sa raison si le modèle choisi ne le permet pas.

**Mobile** : démarrer une session avec un groupe est permis sur le téléphone. Le champ « Projets » garde ses puces, qui passent à la ligne ; le récapitulatif n'est pas repris, la session se lit ensuite dans [E2k](#e2k).

### <a id="e16d"></a>E16d · Nouvelle session : groupe dans un bac à sable

Un groupe lancé dans un bac à sable : une copie de chacun de ses projets, sur une même branche de session. Le tableau dit, pour chaque projet, d'où part la copie et ce qui n'y entre pas ; le récapitulatif dit ce que l'agent voit, les domaines réunis, et comment le travail revient.

- **Depuis** [E16c](#e16c) avec « Bac à sable »
- **Ensuite** [E2k](#e2k) avec « Démarrer », avec la carte « Branches » · [E16b](#e16b) pour un seul projet

Règles de l'écran :

1. Une copie par projet, toutes sur la même branche de session, créée à partir de la branche de départ de chacun. Les fichiers modifiés du poste, non commités, ne sont pas copiés, et le tableau le dit. Le nom de la branche est refusé s'il existe déjà dans l'un des projets du groupe (règle 14).
2. Si un projet de la sélection n'est pas un dépôt git, « Bac à sable » est grisé avec sa raison : « notes-clubs n'est pas un dépôt git ». Sans bac à sable, la session tourne sur le poste ([E16c](#e16c)).
3. La sortie réseau réunit les domaines de la liste générale et ceux de chacun des 3 projets : 11 domaines, ouverts par « Voir » dans [E11a](reglages.md#e11a). Les accès et les fichiers du poste restent hors du bac à sable (règle 12).
4. Après le travail, « Récupérer les branches » ([E2k](#e2k)) rapatrie dans le poste la branche de chaque projet qui a du travail, un projet à la fois ou tous ensemble ; les autres sont laissés. « Démarrer » prépare une copie par projet, puis lance le premier tour.
5. Les puces portent les mêmes origines qu'en [E16c](#e16c) : un mode réglé par le groupe, ici « Approuver pour moi », s'applique aussi en bac à sable ; « Accepter les modifications · défaut en bac à sable » ne vaut que si aucun niveau ne règle les autorisations (règles 12 et 16). Un groupe réglé sur « Accès complet » s'applique sans confirmation dans le bac à sable (règle 17).

**Mobile** : le même ordre qu'[E16c](#e16c), avec le tableau des projets resserré en liste à la place du récapitulatif.

### <a id="e16e"></a>E16e · Nouvelle session : accès complet sur le poste

Choisir « Accès complet » pour une session qui tourne sur le poste demande une confirmation, à chaque session : l'agent modifiera les fichiers et lancera des commandes sans rien demander, partout où ses outils peuvent aller. Le formulaire reste visible derrière, avec la puce passée à « Accès complet ». En bac à sable, cette confirmation n'existe pas : le bac à sable est isolé du poste (règle 17).

- **Depuis** [E16A](#e16a) avec « Accès complet » dans le menu des autorisations, sur le poste
- **Ensuite** [E2E](#e2e) avec « Donner l'accès complet » · [E16B](#e16b) avec « Utiliser un bac à sable »

Règles de l'écran :

1. La confirmation s'ouvre à chaque session démarrée sur le poste avec « Accès complet », y compris quand ce mode vient d'un réglage par défaut (profil, projet ou groupe) : on le confirme au démarrage, jamais une fois pour toutes (règles 16 et 17). Elle n'existe pas en bac à sable, isolé du poste.
2. « Utiliser un bac à sable » bascule le formulaire en [E16b](#e16b) en gardant le mode « Accès complet » : l'agent peut alors tout faire sans rien demander, mais seulement dans sa copie du projet (règle 12).
3. « Annuler » ferme la confirmation et rend le formulaire [E16a](#e16a), avec le mode précédent.
4. « Donner l'accès complet » ferme la confirmation ; le formulaire garde la puce orange, et « Démarrer » lance la session, dont la barre d'outils montre la puce orange ([E2e](#e2e)).

**Mobile** : la confirmation est une feuille du bas, avec le même texte ; « Donner l'accès complet » est en tête, pleine largeur.

## <a id="criteres-dacceptation"></a>Critères d'acceptation

### <a id="e1-vue-densemble"></a>E1 · Vue d'ensemble

- **CA-SESS-01** · [E1a](#e1a) · Étant donné le tout premier lancement de Bosco avec des dossiers de configuration de Claude Code présents sur le poste, quand la personne ouvre Bosco, alors aucune session n'est affichée et Bosco demande quels dossiers surveiller, le dossier par défaut et ceux des autres profils étant cochés d'office (RF-SESS-01).
- **CA-SESS-02** · [E1a](#e1a) · Étant donné l'écran de premier lancement, quand la personne n'a pas encore cliqué sur « Surveiller ces profils », alors aucune session n'est lue et seul un aperçu (nombre de dossiers, date de la dernière session) est montré (RF-SESS-01).
- **CA-SESS-03** · [E1a](#e1a) · Étant donné un dossier décoché, quand la personne clique sur « Surveiller ces profils », alors ce dossier est exclu de la surveillance et les sessions des 30 derniers jours des autres rejoignent l'historique (RF-SESS-01).
- **CA-SESS-04** · [E1a](#e1a) · Étant donné l'encart « Suivi en direct », quand la personne clique sur « Plus tard », alors l'encart est masqué et reste disponible dans les sources (RF-SESS-02).
- **CA-SESS-71** · [E1a](#e1a) · Étant donné le tout premier lancement de Bosco, quand la personne ouvre Bosco, alors un bloc de bienvenue (logo, une phrase sur ce que fait Bosco, ses trois usages) s'affiche au-dessus du choix des profils, dans la page, sans fenêtre à fermer ni clic supplémentaire avant « Surveiller ces profils » (RF-SESS-11).
- **CA-SESS-72** · [E1a](#e1a) · Étant donné Bosco déjà configuré, quand la personne clique sur le logo de la barre latérale ou de l'en-tête du téléphone, alors « À propos de Bosco » s'ouvre avec le même texte de bienvenue et l'origine du nom (le bosco, maître d'équipage d'un navire), et se ferme sans rien changer (RF-SESS-11).
- **CA-SESS-05** · [E1b](#e1b) · Étant donné au moins une session qui t'attend et le suivi en direct installé, quand la personne ouvre la vue d'ensemble, alors le bandeau T'attend est en tête, avec la plus ancienne attente en premier et le dernier message de chaque session, même en regroupement par projet (RF-SESS-02).
- **CA-SESS-06** · [E1b](#e1b) · Étant donné une autorisation demandée avec le suivi en direct installé, quand la personne regarde la ligne du bandeau, alors « Autoriser » et « Refuser » sont proposés, tandis qu'un tour terminé n'a que « Voir la session » (RF-SESS-03, RF-SESS-04).
- **CA-SESS-07** · [E1b](#e1b) · Étant donné une autorisation déjà donnée dans le terminal, quand la vue d'ensemble se met à jour, alors la ligne disparaît du bandeau et un message bref l'indique (RF-SESS-03).
- **CA-SESS-08** · [E1b](#e1b) · Étant donné aucune session qui t'attend, ou le suivi en direct non installé, quand la personne ouvre la vue d'ensemble, alors le bandeau n'apparaît pas et, sans suivi en direct, une ligne discrète propose de l'installer (RF-SESS-02).
- **CA-SESS-09** · [E1b](#e1b) · Étant donné la vue regroupée par projet, quand la personne la parcourt, alors dans chaque projet les sessions sont triées par état (T'attend, En cours, Inactive) puis par activité la plus récente, et les sessions terminées n'y figurent pas (RF-SESS-02, RF-SESS-06).
- **CA-SESS-10** · [E1b](#e1b) · Étant donné des sessions commencées aujourd'hui, dont des terminées, quand la personne lit le coût du jour, alors il additionne toutes ces sessions et est présenté comme une estimation au tarif public des modèles (RF-SESS-05).
- **CA-SESS-11** · ~~[E1c](#e1c) · Étant donné la vue filtrée sur le projet creneaux, quand la personne clique sur un projet de la barre latérale, alors une puce de filtre s'affiche à côté du titre et le bandeau T'attend, les indicateurs et le tableau ne portent que sur ce projet (RF-SESS-02).~~ Retiré (17/11/2026, E1c remplacé par la page d'un projet (E21c)).
- **CA-SESS-12** · ~~[E1c](#e1c) · Étant donné la vue filtrée sur un projet, quand la personne clique sur la croix de la puce, alors le filtre est retiré et la vue d'ensemble [E1b](#e1b) revient.~~ Retiré (17/11/2026, E1c remplacé par la page d'un projet (E21c)).
- **CA-SESS-13** · ~~[E1c](#e1c) · Étant donné la vue filtrée sur un projet, quand la personne regarde le tableau, alors la colonne « Dossier » remplace les intertitres de projet et les sessions terminées aujourd'hui dans ce projet sont listées des plus récentes aux plus anciennes, avec « Voir l'historique » qui ouvre [E3a](#e3a) déjà filtré sur le projet.~~ Retiré (17/11/2026, E1c remplacé par la page d'un projet (E21c)).
- **CA-SESS-14** · [E1d](#e1d) · Étant donné « Regrouper par : État », quand la personne ouvre la vue d'ensemble, alors une colonne par état s'affiche, chaque session en carte, et la colonne T'attend remplace le bandeau avec les mêmes boutons et règles (RF-SESS-06, RF-SESS-03).
- **CA-SESS-15** · [E1d](#e1d) · Étant donné une session En cours, quand la personne regarde sa carte, alors les trois dernières actions de l'agent sont montrées, la plus récente en haut.
- **CA-SESS-16** · [E1d](#e1d) · Étant donné une session dont l'état change, quand la mise à jour a lieu, alors sa carte change de colonne d'elle-même (RF-SESS-02).
- **CA-SESS-17** · ~~[E1d](#e1d) · Étant donné une session À relire, quand la personne regarde sa carte, alors le compte rendu de l'agent et le résumé des modifications sont affichés et « Voir le diff » ouvre E2c.~~ Retiré (17/11/2026, tâches et worker retirés des specs, DT-43).
- **CA-SESS-18** · [E1d](#e1d) · Étant donné le choix « Regrouper par : État », quand la personne quitte Bosco puis y revient, alors le choix est conservé (RF-SESS-06).
- **CA-SESS-76** · [E1d](#e1d) · Étant donné la vue regroupée par état sur le téléphone, quand la personne choisit une puce d'état ou balaie l'écran, alors une seule colonne s'affiche, celle de la puce, la première qui a des sessions à l'ouverture ; une colonne vide le dit.
- **CA-SESS-19** · [E1e](#e1e) · Étant donné le premier affichage après « Surveiller ces profils », quand Bosco lit encore l'historique, alors un bandeau avec une barre de progression réelle (par exemple « 1 240 sessions lues sur 3 180 ») s'affiche et disparaît quand la lecture est finie.
- **CA-SESS-20** · [E1e](#e1e) · Étant donné la lecture en cours, quand des sessions ouvertes sont prêtes, alors elles apparaissent aussitôt, avant l'historique, et les suivantes sont des blocs animés.
- **CA-SESS-21** · [E1e](#e1e) · Étant donné la lecture en cours, quand la personne quitte l'écran puis revient, alors la lecture a continué et la progression se retrouve ; une attente détectée pendant la lecture déclenche la notification du bureau (RF-SESS-08).
- **CA-SESS-22** · [E1e](#e1e) · Étant donné un chargement ordinaire hors premier lancement, quand l'écran se charge, alors seuls des blocs animés s'affichent, sans bandeau ni barre, pendant moins d'une seconde.
- **CA-SESS-23** · [E1f](#e1f) · Étant donné que Bosco ne répond plus, quand la coupure est détectée (moins de 5 s), alors l'écran garde les dernières informations reçues, atténuées et datées, avec un bandeau en tête et la colonne « Vu à » à la place des durées.
- **CA-SESS-24** · [E1f](#e1f) · Étant donné Bosco injoignable, quand la personne regarde le bandeau T'attend, alors « Autoriser » et « Refuser » sont désactivés, « Voir la session » reste disponible et les autorisations se donnent dans le terminal (RF-SESS-03).
- **CA-SESS-25** · [E1f](#e1f) · Étant donné Bosco injoignable, quand la personne clique sur « Réessayer » ou attend, alors une reconnexion est tentée aussitôt par le bouton, ou toutes les 5 s sans action.
- **CA-SESS-26** · [E1f](#e1f) · Étant donné Bosco qui répond de nouveau, quand la connexion revient, alors le bandeau disparaît et l'écran se met à jour sans rechargement, une autorisation donnée entre-temps dans le terminal ayant fait disparaître sa ligne.
- **CA-SESS-118** · [E1b](#e1b) · Étant donné la vue d'ensemble, quand la personne ouvre « Regrouper par », alors trois choix sont proposés (Projet, Groupe, État), le tableau par projet étant celui d'E1b, et le dernier choix est conservé d'une visite à l'autre (RF-SESS-06).
- **CA-SESS-119** · [E1b](#e1b) · Étant donné une session pilotée à plusieurs projets, quand la personne regarde la vue regroupée par projet, alors elle est rangée sous son projet principal, nommée d'après lui et le nombre des autres (« api-tarifs +2 »), et s'ouvre dans [E2k](#e2k) (RF-SESS-06, RF-SESS-14).
- **CA-SESS-120** · [E1b](#e1b) · Étant donné une session dont le dossier de travail n'est dans aucun projet ajouté, quand la personne regarde la vue d'ensemble, alors elle se range sous « Hors projet » (RF-SESS-01).
- **CA-SESS-121** · ~~[E1c](#e1c) · Étant donné la vue d'ensemble, quand la personne clique sur un groupe de la barre latérale, alors la puce « Groupe : Club des Trois Lacs » s'affiche et le bandeau T'attend, les indicateurs et le tableau portent sur les sessions des projets du groupe ; la croix de la puce ramène à [E1b](#e1b) (RF-SESS-06).~~ Retiré (17/11/2026, E1c remplacé par la page d'un projet (E21c)).
- **CA-SESS-122** · ~~[E1c](#e1c) · Étant donné la vue filtrée sur un projet, quand la personne regarde le tableau, alors les sessions à plusieurs projets qui touchent ce projet y figurent aussi (RF-SESS-14).~~ Retiré (17/11/2026, E1c remplacé par la page d'un projet (E21c)).
- **CA-SESS-143** · [E1b](#e1b) · Étant donné la vue d'ensemble, quand la personne clique sur un projet de la barre latérale, alors la page du projet s'ouvre ([E21c](contexte.md#e21c)) au lieu d'une vue filtrée, et un clic sur un groupe ouvre la page du groupe ([E22d](contexte.md#e22d)) (RF-SESS-15).
- **CA-SESS-144** · [E1b](#e1b) · Étant donné la vue d'ensemble, l'historique ou l'usage, pages de premier niveau, quand la personne lit le haut de la page, alors il n'y a pas de fil d'Ariane et le titre dit la place de la page (RF-SESS-15).
- **CA-SESS-145** · [E1b](#e1b) · Étant donné le téléphone, quand la personne cherche un projet ou un groupe, alors les profils sont dans le bouton de filtres de l'en-tête et les projets et les groupes s'ouvrent depuis l'onglet « Projets » ([E20a](contexte.md#e20a)).
- **CA-SESS-123** · [E1g](#e1g) · Étant donné « Regrouper par : Groupe », quand la personne ouvre la vue d'ensemble, alors un intertitre par groupe, dans l'ordre de la barre latérale, montre ses projets et ses sessions, avec le bandeau T'attend, les indicateurs et le tri des lignes d'[E1b](#e1b) ; le choix est conservé d'une visite à l'autre (RF-SESS-06).
- **CA-SESS-124** · [E1g](#e1g) · Étant donné une session à plusieurs projets dont les projets sont dans deux groupes, quand la personne lit la vue par groupe, alors elle apparaît dans chacun de ces groupes avec la mention « aussi dans … », et le compte de chaque intertitre compte une session par groupe où elle figure (RF-SESS-06, RF-SESS-14).
- **CA-SESS-125** · [E1g](#e1g) · Étant donné des projets qu'aucun groupe ne contient ou des sessions hors projet, quand la personne lit la vue par groupe, alors « Sans groupe » puis « Hors projet » ferment la liste seulement s'ils ont des sessions, et « Tous les projets » n'a pas d'intertitre (RF-SESS-06).
- **CA-SESS-126** · [E1g](#e1g) · Étant donné la vue par groupe, quand la personne clique sur « Réglages du groupe », alors [E22a](contexte.md#e22a) s'ouvre ; un clic sur un groupe de la barre latérale n'applique aucun filtre : il ouvre la page du groupe ([E22d](contexte.md#e22d)), et un groupe masqué de la barre latérale s'ouvre depuis « Tous les projets » ([E20a](contexte.md#e20a)) (RF-SESS-06, RF-SESS-15).

### <a id="e2-detail-dune-session"></a>E2 · Détail d'une session

- **CA-SESS-27** · [E2a](#e2a) · Étant donné une session En cours, quand la personne ouvre son détail, alors le fil se met à jour sans rechargement, le plus récent en bas, les actions repliées sur une ligne et dépliables, et l'action en cours porte une pastille animée.
- **CA-SESS-28** · [E2a](#e2a) · Étant donné un fil dans lequel la personne a remonté, quand de nouveaux événements arrivent, alors « Revenir au direct » est affiché ; tant qu'elle est en bas, le fil suit les événements sans ce bouton.
- **CA-SESS-29** · [E2a](#e2a) · Étant donné une session En cours, quand la personne regarde l'usage, alors il est présenté comme une estimation au tarif public, même sous abonnement, et les chiffres bougent avec le fil (RF-SESS-05).
- **CA-SESS-30** · [E2a](#e2a) · Étant donné une session encore ouverte, quand la personne regarde la colonne de droite, alors la commande de reprise n'apparaît pas, seul l'identifiant est gardé, et « Copier le chemin du dossier » copie le dossier du projet (RF-SESS-09).
- **CA-SESS-73** · [E2a](#e2a) · Étant donné une session dont le transcript existe, quand la personne ouvre son détail, alors ses demandes sont des bulles, les réponses de l'agent sont mises en forme (titres, listes, tableaux, code coloré), et chaque étape tient sur une ligne qui se déplie : réflexion et sa durée, commande et sa sortie, tests et leurs cas en échec, erreur et sa pile d'appels, modification et ses lignes ajoutées ou retirées, un sous-agent avec son modèle, sa consigne, ses étapes et son résultat ; plus de trois étapes à la suite se replient sous une ligne qui les résume ; le plan de l'agent (à faire, fait) et les pages consultées suivent chaque tour qui les concerne.
- **CA-SESS-74** · [E2a](#e2a) · Étant donné une session dont Claude Code a effacé le transcript, quand la personne ouvre son détail, alors le fil montre le résumé gardé par Bosco ; étant donné une très longue session, alors seuls ses derniers échanges sont montrés, avec une mention qui le dit.
- **CA-SESS-31** · [E2b](#e2b) · Étant donné une autorisation demandée avec le suivi en direct installé, quand la personne ouvre la session, alors le fil s'arrête sur une carte montrant la commande, le dossier et ce que l'agent en dit, avec « Autoriser » et « Refuser » (RF-SESS-03).
- **CA-SESS-32** · [E2b](#e2b) · Étant donné le suivi en direct non installé, quand la personne ouvre la session, alors il n'y a pas de carte d'autorisation et Bosco propose seulement d'installer le suivi (RF-SESS-03).
- **CA-SESS-33** · [E2b](#e2b) · Étant donné une autorisation déjà donnée dans le terminal, quand la personne regarde la carte, alors elle indique « Répondu ailleurs à 15:15 » et ses boutons ont disparu ; la première réponse l'emporte (RF-SESS-03).
- **CA-SESS-34** · [E2b](#e2b) · Étant donné un refus avec un motif, quand la personne clique sur « Refuser », alors le motif, facultatif, est envoyé à l'agent comme consigne.
- **CA-SESS-35** · [E2b](#e2b) · Étant donné un clic sur « Autoriser », quand la réponse est envoyée, alors elle ne vaut que pour cette commande et aucune option « toujours autoriser » n'est proposée (RF-SESS-03).
- **CA-SESS-36** · [E2b](#e2b) · Étant donné une réponse donnée, quand il reste d'autres sessions en attente, alors la vue d'ensemble s'ouvre avec un message bref (« Autorisé · Créneaux libres du planning »), sinon la personne reste sur le fil qui repart.
- **CA-SESS-37** · [E2b](#e2b) · Étant donné un téléphone, quand la personne appuie sur « Autoriser », alors une confirmation rappelant la commande précède l'envoi, tandis que « Refuser » envoie directement (RF-SESS-07).
- **CA-SESS-146** · [E2a](#e2a) · Étant donné une session d'un projet, quand la personne ouvre son détail, alors un fil d'Ariane « Projets › api-tarifs » est au-dessus du titre, avec le projet principal de la session, et ce projet est actif dans la barre latérale ; une session sans projet porte « Hors projet » et la vue d'ensemble reste active (RF-SESS-15).
- **CA-SESS-147** · [E2a](#e2a) · Étant donné le détail d'une session, quand la personne clique sur le projet du fil d'Ariane (« Projets › creneaux »), alors la page du projet s'ouvre sur son onglet Sessions ([E21c](contexte.md#e21c)) ; quelle que soit l'entrée (barre latérale, tableau, notification), le fil est le même (RF-SESS-15).
- **CA-SESS-148** · [E2a](#e2a) · Étant donné le téléphone, quand la personne ouvre le détail d'une session, alors l'écran est poussé et le fil d'Ariane devient le retour au projet (« creneaux ») (RF-SESS-15).

### <a id="e3-historique"></a>E3 · Historique

- **CA-SESS-47** · [E3a](#e3a) · Étant donné la liste de l'historique, quand la personne tape un mot du titre, d'un message ou d'une commande, alors la liste se filtre pendant la frappe, et le raccourci « / » place le curseur dans le champ de recherche.
- **CA-SESS-48** · [E3a](#e3a) · Étant donné plusieurs filtres en puces (période, projet, profil, état), quand la personne les pose, alors ils se cumulent et se retirent un par un.
- **CA-SESS-49** · [E3a](#e3a) · Étant donné la liste, quand la personne la parcourt, alors les jours se suivent du plus récent au plus ancien, chacun avec son total (nombre de sessions et coût estimé), et la liste se charge par jour au défilement (RF-SESS-05).
- **CA-SESS-50** · [E3a](#e3a) · Étant donné une session « En échec », quand la personne regarde sa ligne, alors la raison est visible sous le titre et au survol du badge, et la ligne ouvre la session ; une session toujours ouverte garde son état actuel.
- **CA-SESS-51** · [E3a](#e3a) · Étant donné une session plus vieille que la rétention de Claude Code, quand la personne la consulte, alors elle reste lisible mais sans reprise (RF-SESS-10).
- **CA-SESS-52** · ~~[E3b](#e3b) · Étant donné l'onglet « Coûts », quand la personne l'ouvre, alors le total et la moyenne couvrent la période choisie, la moyenne ne comptant que les jours ouvrés, et tous les montants sont présentés comme des estimations (RF-SESS-05).~~ Retiré (17/11/2026, E3b remplacé par la page Usage (E23)).
- **CA-SESS-53** · ~~[E3b](#e3b) · Étant donné le graphique, quand la personne le lit, alors il montre une barre par jour ouvré empilée par projet, sur un axe de 0 à 8 $, avec aujourd'hui surligné et son total.~~ Retiré (17/11/2026, E3b remplacé par la page Usage (E23)).
- **CA-SESS-54** · ~~[E3b](#e3b) · Étant donné le graphique, quand la personne survole un jour, alors le coût et les sessions par projet de ce jour s'affichent.~~ Retiré (17/11/2026, E3b remplacé par la page Usage (E23)).
- **CA-SESS-55** · ~~[E3b](#e3b) · Étant donné le tableau « Par projet », quand la personne clique sur un projet, alors la liste [E3a](#e3a) s'ouvre déjà filtrée sur ce projet et sur la période ; le tableau se trie par colonne.~~ Retiré (17/11/2026, E3b remplacé par la page Usage (E23)).
- **CA-SESS-149** · [E3a](#e3a) · Étant donné la page d'un projet, quand la personne clique sur « Voir l'historique », alors l'historique s'ouvre déjà filtré sur le projet, avec les sessions terminées du projet ([E21c](contexte.md#e21c)).
- **CA-SESS-127** · [E3a](#e3a) · Étant donné un filtre « groupe » posé dans l'historique, quand la personne regarde la liste, alors elle garde les sessions de tous les projets du groupe, celles à plusieurs projets comprises, et le filtre se cumule avec les autres puces (RF-SESS-14).
- **CA-SESS-175** · [E3a](#e3a) · Étant donné l'historique, quand la personne le regarde, alors il ne propose plus que la recherche des sessions, sans onglet « Coûts » : l'usage a sa page, ouverte par « Usage » dans la barre latérale ([E23a](#e23a)), et sur le téléphone par la bascule « Sessions | Usage » en tête de l'onglet (RF-SESS-18).

### <a id="e15-notifications"></a>E15 · Notifications

- **CA-SESS-83** · [E15b](#e15b) · Étant donné les réglages par défaut, quand une autorisation est demandée, que l'agent pose une question ou qu'une fin de tour finit par une question, alors une notification part ; une session terminée ne notifie pas tant que son réglage est coupé, et seuls les événements nouveaux notifient, jamais l'historique relu (RF-SESS-08).
- **CA-SESS-84** · [E15b](#e15b) · Étant donné une fin de tour sans question, quand le réglage vaut « Après un long tour », alors elle ne notifie que si le tour, de la demande à la main rendue, a duré au moins le seuil (2 min par défaut, de 1 à 30) ; « Toujours » notifie chaque fin de tour, « Jamais » aucune (RF-SESS-08).
- **CA-SESS-85** · [E15b](#e15b) · Étant donné une notification du bureau, quand elle s'affiche, alors elle porte l'icône de Bosco, son type et le projet en titre (« Question · reservations »), puis la session en gras, coupée à la fin d'un mot, et un extrait : les dernières phrases entières du message, sans mise en forme ; « Ouvrir » ouvre la session dans Bosco ; la suivante d'une même session la remplace ; une question ou une autorisation passe en priorité haute (RF-SESS-08).
- **CA-SESS-86** · [E15b](#e15b) · Étant donné l'onglet Bosco au premier plan sur le poste, quand une notification arrive, alors elle s'affiche en message bref dans Bosco au lieu de la notification du bureau, tant que ce réglage est activé (RF-SESS-08).
- **CA-SESS-150** · [E15b](#e15b) · Étant donné « Réglages » en bas de la barre latérale, quand la personne ouvre l'onglet « Notifications » ou clique sur « Réglages des notifications » du tiroir, alors le fil d'Ariane est « Réglages › Notifications », « Réglages » est actif dans la barre latérale et l'onglet est à côté de Sources, Téléphone, Abonnement Claude et Bac à sable (RF-SESS-15).
- **CA-SESS-151** · [E15b](#e15b) · Étant donné le téléphone, quand la personne ouvre les réglages des notifications depuis « Réglages », alors l'écran est en lecture seule avec la mention « Modifiable depuis le poste » (RF-SESS-08).
- **CA-SESS-87** · [E15a](#e15a) · Étant donné des notifications reçues, quand la personne ouvre la cloche, alors un tiroir les liste sur 7 jours, rangées par jour, les non lues comptées sur la cloche ; « À traiter » ne garde que ce qui attend encore une réponse, et « Tout marquer comme lu » vide le compteur sans rien effacer.
- **CA-SESS-88** · [E15a](#e15a) · Étant donné une autorisation en attente dans le tiroir, quand la personne clique sur « Autoriser » ou « Refuser », alors la réponse part comme depuis le bandeau T'attend et la notification dit « autorisé dans Bosco » ; un clic sur une notification ouvre sa session et la marque lue (RF-SESS-03).
- **CA-SESS-89** · [E15c](#e15c) · Étant donné un message bref, quand il s'affiche, alors il a la couleur de son sens, un titre et un extrait, une action au plus et une croix ; il se ferme seul après 5 s (8 s avec une action), reste ouvert au survol, et une question reste affichée jusqu'à ce qu'on l'ouvre ou la ferme ; trois messages au plus.
- **CA-SESS-90** · [E15a](#e15a) · Étant donné le téléphone, quand la personne touche la cloche de la barre du haut, alors l'écran des notifications s'ouvre, avec les mêmes filtres, et une autorisation s'y répond.

### <a id="e2e-a-e2h-e16-sessions-pilotees-par-bosco"></a>E2e à E2h, E16 · Sessions pilotées par Bosco

- **CA-SESS-91** · [E16a](#e16a) · ~~Étant donné un projet, un abonnement Claude (celui du groupe choisi, sinon l'abonnement par défaut) et un premier message, quand la personne clique sur « Démarrer », alors la session démarre sur le poste, dans le dossier du projet principal, avec le mode d'autorisations, le modèle et l'effort choisis ; elle s'ouvre dans Bosco et apparaît dans la vue d'ensemble avec l'icône des sessions pilotées. Une session déjà ouverte dans ce dossier, dans un terminal, est signalée sans bloquer (RF-SESS-04).~~ Retiré (17/11/2026, profil et valeurs par défaut en cascade, CA-SESS-155).
- **CA-SESS-92** · [E2e](#e2e) · Étant donné une session pilotée entre deux tours, quand la personne envoie un message, alors un tour commence avec ce message : texte, fichiers mentionnés, commande en tête, images jointes (5 au plus) ; à la fin du tour l'agent s'arrête et la session est close, reprenable dans un terminal comme dans Bosco (RF-SESS-04, RF-SESS-09).
- **CA-SESS-93** · [E2e](#e2e) · Étant donné un tour en cours, quand la personne envoie un message, alors il attend la fin du tour (« partira à la fin du tour ») et part avec le tour suivant ; un second message rejoint le premier ; « Annuler » le retire ; « Arrêter » interrompt le tour et garde le message en attente.
- **CA-SESS-94** · [E2e](#e2e) · Étant donné le mode d'autorisations, le modèle et l'effort de la barre d'outils, quand la personne en change, alors le changement vaut dès le message envoyé et pour les suivants ; il est gardé avec la session.
- **CA-SESS-95** · [E2e](#e2e) · Étant donné une session pilotée en mode « Demander », quand l'agent demande une autorisation, alors elle arrive dans Bosco comme une carte T'attend et une notification, et la réponse donnée dans Bosco part à l'agent ; « Accepter les modifications » laisse passer les modifications de fichiers, « Plan » fait proposer un plan avant toute modification (RF-SESS-03).
- **CA-SESS-96** · [E2f](#e2f) · Étant donné une question de l'agent dans une session pilotée, quand la personne choisit une réponse (ou plusieurs pour une question à choix multiples), écrit « Autre » ou clique sur « Passer », alors la réponse part à l'agent et le tour continue ; tant que la question attend, la zone de message est désactivée.
- **CA-SESS-97** · [E2g](#e2g) · Étant donné une session close, d'un terminal ou de Bosco, quand la personne lui écrit, alors la session reprend dans Bosco avec la même conversation et devient pilotée ; une session effacée par Claude Code ne se reprend plus (RF-SESS-09, RF-SESS-10).
- **CA-SESS-98** · [E2a](#e2a) · Étant donné une session ouverte dans un terminal, quand la personne ouvre son détail, alors la zone de message est remplacée par « Ouverte dans un terminal · réponds-y là-bas », et Bosco refuse de lui écrire tant qu'elle n'est pas close (RF-SESS-09).
- **CA-SESS-99** · [E2h](#e2h) · Étant donné l'éditeur, quand la personne tape « @ », alors Bosco propose les fichiers suivis du projet, les plus proches du texte tapé d'abord, et le fichier choisi devient une puce ; quand elle tape « / » en tête de message, Bosco propose les commandes et skills du profil et du projet avec leur origine ; ↑↓, Entrée et Échap pilotent la liste.
- **CA-SESS-100** · [E2e](#e2e) · Étant donné le téléphone, quand la personne ouvre une session pilotée ou une nouvelle session, alors elle peut écrire, joindre une image, choisir le mode, le modèle et l'effort depuis une rangée de puces, et les suggestions de « @ » et « / » s'ouvrent dans une feuille (RF-SESS-07).
- **CA-SESS-166** · [E2e](#e2e) · Étant donné la barre d'outils d'une session pilotée, quand la personne ouvre le mode d'autorisations, alors elle propose les cinq modes avec leur icône (Demander, Accepter les modifications, Plan, Approuver pour moi, Accès complet) et le changement de mode, de modèle ou d'effort vaut dès le tour suivant (RF-SESS-04, RF-SESS-17).
- **CA-SESS-167** · [E2e](#e2e) · Étant donné une session pilotée en « Approuver pour moi », quand l'agent demande une autorisation, alors un vérificateur examine chaque demande ; en « Accès complet », aucune demande n'est posée (RF-SESS-17).
- **CA-SESS-168** · [E2e](#e2e) · Étant donné « Approuver pour moi », quand Claude Code le suspend après 3 refus de suite ou 20 au total, alors une ligne du fil dit « Approuver pour moi suspendu après 3 refus : les demandes reviennent dans Bosco » et les demandes arrivent de nouveau dans Bosco (RF-SESS-17).
- **CA-SESS-169** · [E2e](#e2e) · Étant donné une session sur le poste, quand la personne passe à « Accès complet », alors la confirmation d'[E16e](#e16e) s'ouvre et le mode passe en orange (RF-SESS-17).
- **CA-SESS-152** · [E16a](#e16a) · Étant donné une nouvelle session, quand la personne la démarre depuis la vue d'ensemble, alors le fil d'Ariane est « Nouvelle session » ; depuis un projet, il est « Projets › api-tarifs › Nouvelle session » et le projet est déjà rempli (RF-SESS-15).
- **CA-SESS-153** · [E16a](#e16a) · Étant donné le menu ⋯ d'un projet dans la liste des projets, quand la personne choisit « Nouvelle session dans … », alors le formulaire s'ouvre avec ce projet déjà rempli ([E20d](contexte.md#e20d)) (RF-SESS-15).
- **CA-SESS-154** · [E16c](#e16c) · Étant donné la page d'un groupe ou le menu ⋯ d'un groupe, quand la personne choisit « Nouvelle session dans ce groupe », alors le formulaire s'ouvre avec le groupe déjà choisi et le fil d'Ariane est précédé de ce groupe ([E22d](contexte.md#e22d), [E20d](contexte.md#e20d)) (RF-SESS-15).
- **CA-SESS-128** · [E16a](#e16a) · Étant donné le champ « Projets », quand la personne l'ouvre, alors il propose d'abord les groupes puis les projets ajoutés, les plus récents d'abord ; avec un seul projet, sa puce porte l'étoile du projet principal et le dossier, la branche courante et les fichiers modifiés s'affichent dessous (RF-SESS-04, RF-SESS-14).
- **CA-SESS-129** · [E16a](#e16a) · ~~Étant donné un groupe choisi dans le champ, quand le formulaire se met à jour, alors l'abonnement proposé est celui du groupe, sinon l'abonnement par défaut réglé dans [E11c](reglages.md#e11c), et la personne peut en choisir un autre pour cette session (RF-SESS-13).~~ Retiré (17/11/2026, profil proposé selon la cascade, CA-SESS-156).
- **CA-SESS-155** · [E16a](#e16a) · Étant donné un projet, un abonnement Claude et un premier message, quand la personne clique sur « Démarrer », alors la session démarre sur le poste, dans le dossier du projet principal, avec le profil, le mode d'autorisations, le modèle et l'effort choisis ; elle s'ouvre dans Bosco et apparaît dans la vue d'ensemble avec l'icône des sessions pilotées, et une session déjà ouverte dans ce dossier, dans un terminal, est signalée sans bloquer (RF-SESS-04, RF-SESS-16).
- **CA-SESS-156** · [E16a](#e16a) · Étant donné un projet ou un groupe choisi, quand le formulaire se met à jour, alors le profil proposé est celui du groupe choisi, sinon celui du projet principal, sinon le profil par défaut réglé dans [E11c](reglages.md#e11c) (« pro · profil par défaut »), et la personne peut en choisir un autre pour cette session (RF-SESS-16, RF-SESS-13).
- **CA-SESS-157** · [E16a](#e16a) · Étant donné une nouvelle session dont la personne n'a pas choisi les autorisations, le modèle ni l'effort, quand elle regarde la barre d'outils, alors chaque puce prend la valeur du premier niveau qui la règle, dans l'ordre : groupe choisi, projet principal, profil réglé dans Bosco ([E4g](reglages.md#e4g)), profil Claude Code, et dit d'où elle vient (« défaut du groupe », « défaut du projet api-tarifs », « défaut du profil pro », « celui du profil Claude Code ») (RF-SESS-16).
- **CA-SESS-158** · [E16a](#e16a) · Étant donné le menu des autorisations, quand la personne l'ouvre, alors il propose cinq modes, chacun avec son icône : Demander, Accepter les modifications, Plan, Approuver pour moi et Accès complet (en orange), la puce de la barre d'outils montrant l'icône et le libellé du mode choisi (RF-SESS-17).
- **CA-SESS-159** · [E16a](#e16a) · Étant donné un modèle qui ne permet pas « Approuver pour moi », quand la personne ouvre le menu des autorisations, alors ce mode est grisé avec sa raison (« Pas disponible avec ce modèle ») (RF-SESS-17).
- **CA-SESS-160** · [E16a](#e16a) · Étant donné un mode, un modèle ou un effort choisi pour la session, quand la personne démarre, alors son choix l'emporte sur tous les niveaux de valeurs par défaut et se change ensuite entre deux tours depuis la session ([E2e](#e2e)) (RF-SESS-16).

### <a id="e16e-acces-complet-sur-le-poste"></a>E16e · Accès complet sur le poste

- **CA-SESS-170** · [E16e](#e16e) · Étant donné une session qui démarre sur le poste en « Accès complet », y compris quand ce mode vient d'un réglage par défaut (profil, projet ou groupe), quand la personne clique sur « Démarrer », alors une confirmation s'ouvre à chaque session, jamais une fois pour toutes (RF-SESS-17, RF-SESS-16).
- **CA-SESS-171** · [E16e](#e16e) · Étant donné la confirmation, quand la personne clique sur « Utiliser un bac à sable », alors le formulaire devient celui d'[E16b](#e16b) en gardant le mode « Accès complet », sans autre confirmation (RF-SESS-17, RF-SESS-12).
- **CA-SESS-172** · [E16e](#e16e) · Étant donné la confirmation, quand la personne clique sur « Annuler », alors elle se ferme et le formulaire reprend le mode précédent (RF-SESS-17).
- **CA-SESS-173** · [E16e](#e16e) · Étant donné la confirmation, quand la personne clique sur « Donner l'accès complet », alors elle se ferme, la puce reste orange et « Démarrer » lance la session dont la barre d'outils montre la puce orange ; sur le téléphone, la confirmation est une feuille du bas où ce bouton est en tête, pleine largeur (RF-SESS-17, RF-SESS-07).
- **CA-SESS-174** · [E16e](#e16e) · Étant donné une session lancée en bac à sable en « Accès complet », quand la personne la démarre, alors aucune confirmation n'est demandée, le bac à sable étant isolé du poste (RF-SESS-17).

### <a id="e2i-e4f-canal-de-bosco"></a>E2i, E4f · Canal de Bosco

- **CA-SESS-101** · [E2i](#e2i) · Étant donné une session ouverte dans un terminal, lancée avec le canal de Bosco, quand la personne lui écrit depuis Bosco, alors le texte arrive dans le terminal comme une saisie et l'agent y répond ; une image est refusée (« texte seulement ») ; sans canal, Bosco refuse et la bande « Ouverte dans un terminal » demeure (RF-SESS-09).
- **CA-SESS-103** · [E2i](#e2i) · Étant donné une session dont le canal est ouvert, quand la personne ouvre son détail, alors l'en-tête porte « Canal de Bosco », la zone de message est réduite (texte seulement, sans réglages ni « Arrêter »), et ses demandes envoyées par le canal s'affichent dans le fil « depuis Bosco ».
- **CA-SESS-104** · [E2a](#e2a) · Étant donné une session ouverte dans un terminal sans canal, quand la personne ouvre son détail, alors la bande « Ouverte dans un terminal » mène à l'installation du canal sur le profil de la session (E4f).

### <a id="e16b-e2j-sessions-en-bac-a-sable"></a>E16b, E2j · Sessions en bac à sable

- **CA-SESS-106** · [E16b](#e16b) · ~~Étant donné le formulaire d'une nouvelle session, quand la personne choisit « Bac à sable », alors le formulaire demande la branche de départ (la branche courante par défaut) et le nom de la branche de la session (proposé sous `bosco/s-`, refusé s'il existe déjà dans le projet), dit que les fichiers modifiés du poste ne sont pas copiés, passe le mode à « Accepter les modifications » et résume ce que voit l'agent ; « Bac à sable » est indisponible, avec sa raison, quand Docker ne répond pas (RF-SESS-12).~~ Retiré (17/11/2026, mode en bac à sable conditionné par les réglages, CA-SESS-161).
- **CA-SESS-107** · [E16b](#e16b) · Étant donné une session en bac à sable démarrée, quand l'agent travaille, alors il ne voit qu'une copie de chaque projet de la session sur la branche de la session et l'accès à l'abonnement choisi : ni les fichiers du poste ni les autres projets du poste, aucun dossier n'étant monté en dehors des copies de la session, aucun autre accès n'est transmis, et le conteneur a les plafonds et l'utilisateur sans droits d'une session en bac à sable (RF-SESS-12, RF-CONT-06).
- **CA-SESS-108** · [E2j](#e2j) · Étant donné une session en bac à sable, quand l'agent joint un domaine hors de la liste du projet, alors la connexion est refusée, l'agent reçoit une erreur, et le fil affiche « Sortie réseau refusée » avec le domaine, l'heure et la commande ; « Ajouter à la liste » propose les domaines du projet ou la liste générale, avec le domaine rempli, valable au tour suivant (RF-SESS-12).
- **CA-SESS-109** · [E2j](#e2j) · Étant donné une session en bac à sable entre deux tours, quand la personne envoie un message, alors le tour s'exécute dans le conteneur déjà démarré, sans le recréer, et un processus lancé en arrière-plan au tour précédent tourne encore (RF-SESS-12).
- **CA-SESS-110** · [E2j](#e2j) · Étant donné un bac à sable sans message depuis 30 min, quand le délai passe, alors le conteneur s'arrête ; au message suivant, il redémarre (« Démarrage du bac à sable »), puis le tour part avec la même conversation, la même copie du projet et ce que l'agent avait installé (RF-SESS-12).
- **CA-SESS-111** · [E2j](#e2j) · Étant donné une session en bac à sable terminée, ou dont le conteneur a disparu, quand la personne lui écrit, alors Bosco recrée le conteneur sur la copie gardée de la session, et la conversation reprend là où elle s'était arrêtée (RF-SESS-12).
- **CA-SESS-112** · [E2j](#e2j) · Étant donné une branche de session avec du travail, quand la personne clique sur « Récupérer la branche » entre deux tours, alors le travail en cours est enregistré dans la branche, la branche arrive dans le projet du poste, et la branche courante et les fichiers du poste ne changent pas ; une branche du poste qui a avancé de son côté n'est jamais écrasée : la récupération prend un autre nom et le dit (RF-SESS-12).
- **CA-SESS-113** · [E2j](#e2j) · Étant donné une session en bac à sable, quand la personne ouvre son détail, alors l'en-tête porte « Bac à sable », aucune commande de reprise dans un terminal n'est proposée, et la colonne de droite montre l'état du bac à sable, sa consommation, l'heure d'arrêt et les fichiers de la branche ; démarré, le bac à sable apparaît dans les conteneurs en cours (RF-SESS-12, RF-CONT-13).
- **CA-SESS-114** · [E2j](#e2j) · Étant donné une session en bac à sable, quand la personne choisit « Supprimer le bac à sable » et confirme, alors le conteneur et la copie du projet sont effacés, après un avertissement si la branche a du travail non récupéré ; la session reste lisible dans l'historique et ne se reprend plus (RF-SESS-12).
- **CA-SESS-115** · [E2j](#e2j) · Étant donné un bac à sable sans message depuis 7 jours, quand le délai passe, alors le conteneur et la copie du projet sont supprimés et la session reste lisible dans l'historique ; si la branche a du travail non récupéré, une notification l'annonce la veille, avec « Récupérer la branche » (RF-SESS-12).
- **CA-SESS-130** · [E16b](#e16b) · Étant donné « Bac à sable » choisi, quand la personne regarde le champ « Projets », alors il est le même qu'en [E16a](#e16a), sans avertissement de session ouverte dans le même dossier puisque le bac à sable travaille sur sa propre copie (RF-SESS-12).
- **CA-SESS-131** · [E16b](#e16b) · Étant donné un projet de la session qui n'est pas un dépôt git, quand la personne regarde le choix « Bac à sable », alors il est grisé avec sa raison (« notes-clubs n'est pas un dépôt git ») et la session tourne sur le poste (RF-SESS-14).
- **CA-SESS-161** · [E16b](#e16b) · Étant donné « Bac à sable » choisi, quand ni le profil, ni le groupe, ni le projet ne règlent les autorisations, alors le mode passe à « Accepter les modifications », signalé « défaut en bac à sable » (RF-SESS-12, RF-SESS-16).
- **CA-SESS-162** · [E16b](#e16b) · Étant donné « Bac à sable » choisi et un niveau (profil, groupe ou projet) qui règle les autorisations, quand la personne regarde la puce, alors ce mode l'emporte, y compris « Approuver pour moi » ou « Accès complet », sans confirmation puisque le bac à sable est isolé du poste, et les cinq modes restent possibles (RF-SESS-12, RF-SESS-17).
- **CA-SESS-185** · [E16b](#e16b) · Étant donné « Bac à sable » choisi, quand la personne démarre la session avec un nom de branche hors du préfixe `bosco/s-`, alors le démarrage est refusé et le formulaire le dit (RF-SESS-12).

### <a id="e2k-e16c-e16d-sessions-a-plusieurs-projets"></a>E2k, E16c, E16d · Sessions à plusieurs projets

- **CA-SESS-132** · [E16c](#e16c) · Étant donné le groupe « Club des Trois Lacs » choisi, quand la personne regarde le champ, alors ses projets le remplissent, le projet principal en tête, et retirer un projet par sa croix ou en ajouter par « + Projet » ne vaut que pour cette session sans changer le groupe (RF-SESS-14).
- **CA-SESS-133** · [E16c](#e16c) · Étant donné plusieurs projets choisis, quand la personne clique sur l'étoile d'un autre projet, alors il devient le projet principal, dossier de travail de la session, qui voit les autres et peut les lire et les modifier (RF-SESS-14).
- **CA-SESS-134** · [E16c](#e16c) · Étant donné une session déjà ouverte dans un terminal dans le dossier d'un des projets, quand la personne prépare la session, alors un avertissement non bloquant le signale pour ce projet et « Voir la session » ouvre l'autre session (RF-SESS-14).
- **CA-SESS-135** · [E16c](#e16c) · ~~Étant donné un groupe choisi, quand la personne clique sur « Démarrer », alors la session démarre sur le poste avec l'abonnement « défaut du groupe », à défaut l'abonnement par défaut, et [E2k](#e2k) s'ouvre ; la même démarche est permise sur le téléphone (RF-SESS-13, RF-SESS-14).~~ Retiré (17/11/2026, profil proposé selon la cascade, CA-SESS-163).
- **CA-SESS-163** · [E16c](#e16c) · Étant donné un groupe choisi, quand la personne clique sur « Démarrer », alors la session démarre sur le poste avec le profil « défaut du groupe », à défaut celui du projet principal, à défaut le profil par défaut, et [E2k](#e2k) s'ouvre ; la même démarche est permise sur le téléphone (RF-SESS-13, RF-SESS-14, RF-SESS-16).
- **CA-SESS-164** · [E16c](#e16c) · Étant donné le groupe « Club des Trois Lacs » qui règle les autorisations mais ni le modèle ni l'effort, quand la personne regarde la barre d'outils, alors elle montre « Approuver pour moi · défaut du groupe », « Sonnet 5.5 · défaut du projet api-tarifs » et « Effort : élevé · défaut du projet api-tarifs », le mode Approuver pour moi étant coché et grisé avec sa raison si le modèle choisi ne le permet pas (RF-SESS-16, RF-SESS-17).
- **CA-SESS-136** · [E16d](#e16d) · Étant donné un groupe lancé en « Bac à sable », quand la personne regarde le tableau, alors une copie par projet est prévue, toutes sur la même branche de session créée depuis la branche de départ de chacun, sans les fichiers modifiés non commités du poste ; un nom de branche déjà pris dans l'un des projets est refusé (RF-SESS-12, RF-SESS-14).
- **CA-SESS-137** · [E16d](#e16d) · Étant donné un groupe en bac à sable, quand la personne lit le récapitulatif, alors la sortie réseau réunit les domaines de la liste générale et ceux de chaque projet (11 domaines, ouverts par « Voir » dans [E11a](reglages.md#e11a)), les accès et les fichiers du poste restant hors du bac à sable (RF-SESS-12, RF-SESS-14).
- **CA-SESS-165** · [E16d](#e16d) · Étant donné un groupe en bac à sable, quand la personne regarde les puces, alors un mode réglé par le groupe (« Approuver pour moi », « Accès complet ») s'applique sans confirmation, et « Accepter les modifications · défaut en bac à sable » ne vaut que si aucun niveau ne règle les autorisations (RF-SESS-12, RF-SESS-16, RF-SESS-17).
- **CA-SESS-138** · [E2k](#e2k) · Étant donné une session à plusieurs projets, quand la personne ouvre son détail, alors la carte « Projets » montre le projet principal, marqué d'une étoile, où elle tourne, et les autres qu'elle voit, chacun avec sa branche et ses fichiers modifiés ; « Voir le diff » les réunit un par un (RF-SESS-14).
- **CA-SESS-139** · [E2k](#e2k) · Étant donné une session à plusieurs projets, quand la personne regarde la vue d'ensemble, la page de ses projets et les groupes, alors elle est rangée sous son projet principal (« api-tarifs +2 »), apparaît dans la page de chacun de ses projets, sous « Aussi dans ce projet » ([E21c](contexte.md#e21c)), et dans les groupes qui les contiennent (RF-SESS-06, RF-SESS-14, RF-SESS-15).
- **CA-SESS-140** · [E2k](#e2k) · Étant donné une session pilotée à plusieurs projets entre deux tours, quand la personne copie la commande de reprise, alors elle ajoute les autres projets, précédée de `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` ; elle n'apparaît pas pendant un tour, et une session lancée dans un terminal n'a qu'un projet, celui de son dossier (RF-SESS-09, RF-SESS-14).
- **CA-SESS-141** · [E2k](#e2k) · Étant donné une session à plusieurs projets en bac à sable, quand la personne ouvre son détail, alors la carte devient « Branches », une ligne par projet avec ce que la branche contient, et « Récupérer les branches » rapatrie celles qui ont du travail, un projet à la fois ou toutes, les projets sans changement étant laissés (RF-SESS-12, RF-SESS-14).
- **CA-SESS-142** · [E2k](#e2k) · Étant donné une session à plusieurs projets, quand l'agent reçoit son contexte, alors celui de chaque projet lui est transmis, le projet principal d'abord : instructions de « Tous les projets » et des groupes, puis décisions du projet ([E9f](contexte.md#e9f)) (RF-SESS-14).

### <a id="e23-usage"></a>E23 · Usage

- **CA-SESS-176** · [E23a](#e23a) · Étant donné la page Usage, quand la personne l'ouvre, alors une seule ligne de filtres (période : 7 j, 30 j par défaut, 90 j, depuis le début ; profil ; projet ou groupe ; modèle) vaut pour toute la page sauf le quota, les choix sont gardés d'une visite à l'autre, et le sous-titre dit depuis quand les données remontent (RF-SESS-18).
- **CA-SESS-177** · [E23a](#e23a) · Étant donné cinq tuiles d'activité, quand la personne les lit, alors elles donnent les sessions pilotées lancées, le temps de travail des agents, les bacs à sable créés, les branches récupérées et les PR créées, repérées dans le fil des sessions : une PR créée hors d'une session n'est pas comptée (RF-SESS-18).
- **CA-SESS-178** · [E23a](#e23a) · Étant donné les tokens et le coût, quand la personne lit la réutilisation du cache, alors elle est la lecture du cache divisée par l'entrée plus la lecture du cache, « tours sans lecture du cache » compte les tours qui n'ont rien relu, et le coût est estimé au tarif public de l'API, un modèle sans tarif connu étant exclu du total et signalé sous le chiffre (RF-SESS-05, RF-SESS-18).
- **CA-SESS-179** · [E23a](#e23a) · Étant donné le graphique par jour, quand la personne le lit puis survole un jour, alors un seul axe gradué en millions de tokens empile les quatre séries (lecture du cache en bas, entrée en haut) avec la légende toujours affichée, les autres barres s'estompent et une info-bulle détaille les quatre séries, le total et le coût estimé ; « Coût estimé » remplace les tokens sur le même axe, et « Voir en tableau » donne les mêmes données, une ligne par jour.
- **CA-SESS-180** · [E23a](#e23a) · Étant donné un filtre de profil, de projet ou de groupe posé, quand la personne regarde le quota, alors il garde une ligne par abonnement avec la part utilisée de la fenêtre de 5 h et de la semaine et l'heure de remise à zéro ; la jauge passe en orange au-delà du seuil d'attente, avec l'icône « main » et la conséquence, et « Seuils » ouvre le réglage ([E11c](reglages.md#e11c)) (RF-SESS-13, RF-SESS-18).
- **CA-SESS-181** · [E23a](#e23a) · Étant donné la répartition par projet, par modèle et par profil, quand la personne la lit, alors les plus gros viennent d'abord, les petits sont regroupés en « autres », la barre est la part du total, un modèle sans tarif connu s'affiche « non chiffré », et un clic sur un projet filtre toute la page sur lui (RF-SESS-18).
- **CA-SESS-182** · [E23b](#e23b) · Étant donné le menu ⋯ d'un groupe ou d'un projet, quand la personne choisit « Usage », alors la page s'ouvre déjà filtrée, la puce « Groupe : Club des Trois Lacs » se lit dans la ligne de filtres, et les chiffres comme la répartition par projet ne portent que sur les projets du groupe (RF-SESS-18).
- **CA-SESS-183** · [E23b](#e23b) · Étant donné la page filtrée sur un groupe, quand la personne clique sur la croix de la puce, alors le filtre de groupe est retiré, et « Réinitialiser » remet tous les filtres à leur valeur par défaut (30 j, tous) ; le quota, lui, reste celui de l'abonnement entier, quel que soit le groupe (RF-SESS-18).
- **CA-SESS-184** · [E23b](#e23b) · Étant donné une session qui touche plusieurs projets du groupe, quand la personne lit la répartition et les totaux, alors elle compte pour chacun de ces projets dans la répartition mais une seule fois dans les totaux du groupe : la somme des projets peut dépasser le total (RF-SESS-14, RF-SESS-18).
