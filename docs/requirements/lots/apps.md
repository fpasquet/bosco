<!-- Généré par export.mjs (skill requirements-doc) depuis sources/30-specs.md : ne pas modifier ici. -->

# <a id="34-lot-4-applications"></a>3.4 Lot 4 · Applications

## <a id="regles-fonctionnelles-du-lot"></a>Règles fonctionnelles du lot

- **RF-APPS-01** · **1. Une seule interface** : les applications montrent l'interface de Bosco telle qu'elle est, sur ordinateur et sur téléphone ; tout écran existe une fois. Seuls la barre système, les notifications, l'appairage et le certificat sont propres à une application.
- **RF-APPS-02** · **2. L'application du poste est facultative** : Bosco se lance toujours comme avant, en service ouvert dans le navigateur, sur Linux comme sur macOS (où il n'y a pas d'application). Sur Linux, l'application fait tourner Bosco : l'ouvrir démarre le service, la fermer le garde dans la barre système ; « Quitter Bosco » l'arrête ; elle peut se lancer à l'ouverture de session. Si un service Bosco tourne déjà sur le poste, l'application s'y relie par défaut, ou le remplace si on le choisit. Elle s'installe par un paquet pour Debian et Ubuntu, qui contient tout Bosco : rien d'autre à installer. Un paquet plus récent installé pendant que Bosco tourne se signale, et Bosco ne passe à la nouvelle version que quand on le relance ; une version plus ancienne ne démarre jamais sur les données qu'une plus récente a mises à jour.
- **RF-APPS-03** · **3. Rien ne quitte le réseau local** (règle 7 du lot 1) : le téléphone parle au poste sur le réseau local, sans service de notification d'Apple ou de Google. Les notifications du téléphone n'arrivent que tant que l'application est ouverte, ou connectée en arrière-plan si on l'a choisi (option désactivée par défaut, avec une notification permanente).
- **RF-APPS-04** · **4. L'appairage se fait par le QR code du poste** ([E4c](sessions.md#e4c)) : il porte l'adresse, le code et l'empreinte du certificat de Bosco ; l'application ne fait confiance qu'à ce certificat, sans avertissement de sécurité. Le téléphone garde son accès dans le trousseau du système.

## <a id="e17"></a>E17 · Application desktop

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `apps/e17.html` · implémentation : **Livré (Application du poste développée (Linux) : démarre le service ou s'y relie, fenêtre de l'interface, barre système (pastille, sessions qui t'attendent, Nouvelle session, Suspendre les notifications 1 h, Lancer au démarrage, Quitter Bosco), notifications natives sans notify-send du service. Lancée depuis le dépôt (make desktop, make desktop-install) avec le Node du poste, ou installée par son paquet .deb (make desktop-package), qui embarque le service et Node 26 et active le bac à sable. Mises à jour : version du paquet tirée du dépôt, make desktop-update, mise à jour installée signalée et relance (E17c), données d'un Bosco plus récent refusées (E17d). Vérifié sur le poste (vraie question d'agent notifiée en natif ; application du paquet démarrée sans Node du poste ; mise à jour simulée signalée puis relancée ; base plus récente refusée avec son message). Écarts : E17b est une boîte de dialogue native ; lancée depuis le dépôt sans chrome-sandbox configuré (sudo), elle se lance sans bac à sable ; pas de paquet AppImage.)**

### <a id="e17a"></a>E17a · Application du poste : barre système

Sur le poste, l'application fait tourner Bosco et vit dans la barre système du bureau. Le cadre montre le bureau Linux à 15:14 : le menu déroulé sous l'icône, la fenêtre de l'application sur la vue d'ensemble, et une notification native d'autorisation. L'application est facultative : Bosco se lance toujours comme avant, dans le navigateur.

- **Depuis** le lancement de l'application · [E17B](#e17b)
- **Ensuite** [E2B](sessions.md#e2b) au clic sur une session du menu · [E1B](sessions.md#e1b) avec « Ouvrir Bosco »

Règles de l'écran :

1. L'icône de Bosco vit dans la barre système du bureau. Sa pastille donne le nombre de sessions qui t'attendent ; l'icône change d'aspect dès qu'une session t'attend, et revient à la normale quand il n'y en a plus.
2. Le menu de la barre système liste les sessions qui t'attendent, avec leur dernière demande ; un clic ouvre la session dans la fenêtre de l'application ([E2b](sessions.md#e2b)). Dessous : ouvrir Bosco, démarrer une session ([E16a](sessions.md#e16a)).
3. « Suspendre les notifications 1 h » coupe les notifications du bureau pendant une heure ; la pastille et les cartes T'attend continuent de se mettre à jour.
4. « Lancer au démarrage » : Bosco démarre à l'ouverture de session du poste, fenêtre fermée, directement dans la barre système.
5. Fermer la fenêtre garde Bosco dans la barre système. « Quitter Bosco » arrête le service, et avec lui les tours pilotés en cours, après confirmation. Bosco reste utilisable sans l'application, dans le navigateur (macOS compris).
6. Notification native du bureau : mêmes règles que celles des notifications de Bosco ([E15b](sessions.md#e15b)). « Ouvrir » affiche la session dans la fenêtre de l'application.

**Mobile** : sans objet sur le téléphone. L'application du téléphone est décrite en [E18a](#e18a).

### <a id="e17b"></a>E17b · Application du poste : un service Bosco tourne déjà

Au premier lancement de l'application, si un service Bosco tourne déjà sur le poste, une boîte de dialogue propose de s'y relier ou de le remplacer. L'application est facultative : se relier au service est le choix recommandé.

- **Depuis** le premier lancement de l'application
- **Ensuite** [E17A](#e17a) après « Continuer »

Règles de l'écran :

1. Au premier lancement, l'application cherche un service Bosco déjà présent sur le poste. S'il y en a un, elle le dit au lieu de lancer un second service ; sinon elle démarre le sien sans rien demander (règle 2).
2. « Se relier au service » est le choix recommandé : l'application n'est qu'une fenêtre sur le service, qui continue de tourner sans elle. Bosco reste donc toujours utilisable dans le navigateur, comme avant. La barre système et les notifications marchent aussi dans ce cas.
3. « Remplacer le service par l'application » arrête le service existant et l'empêche de redémarrer seul ; l'application fait alors tourner Bosco. Les mêmes données sont reprises : sessions, tâches et réglages, rien n' est perdu.

**Mobile** : sans objet sur le téléphone.

### <a id="e17c"></a>E17c · Application du poste : mise à jour installée

Un paquet plus récent de l'application a été installé pendant que Bosco tournait : ses fichiers sont remplacés, mais Bosco tourne encore sur l'ancienne version. L'application le remarque d'elle-même et propose de relancer Bosco. Le cadre montre le bureau à 17:42, une minute après l'installation.

- **Depuis** [E17A](#e17a), après l'installation d'un paquet plus récent
- **Ensuite** [E17A](#e17a) sur la nouvelle version, après « Relancer »

Règles de l'écran :

1. Une mise à jour installée passe en tête du menu de la barre système, avec sa version, tant que Bosco n'a pas été relancé. « Relancer Bosco » arrête le service de l'application, puis rouvre l'application et son service sur la nouvelle version ; la fenêtre revient sur la vue d'ensemble. Bosco ne se relance jamais tout seul : un tour piloté en cours n'est pas interrompu sans qu'on l'ait choisi.
2. Une seule notification par version installée, même quand les notifications sont suspendues. Un clic sur la notification fait comme la ligne du menu. Pour mettre à jour l'application depuis le dépôt, une seule commande reconstruit et installe le paquet ; chaque paquet porte une version plus récente que le précédent.

**Mobile** : sans objet sur le téléphone. L'application du téléphone se met à jour par un nouveau paquet Android, sans écran propre.

### <a id="e17d"></a>E17d · Application du poste : données d'un Bosco plus récent

L'application et le service lancé depuis le dépôt partagent les données du poste. Quand un Bosco plus récent les a mises à jour, une version plus ancienne refuse de démarrer dessus plutôt que de risquer de les abîmer, et le dit.

- **Depuis** le lancement de l'application, quand son service s'arrête au démarrage
- **Ensuite** l'application se ferme après « Ok »

Règles de l'écran :

1. Le service vérifie, avant de toucher aux données, qu'aucune mise à jour plus récente que lui n'y est passée. Sinon il ne démarre pas et ne modifie rien : sessions, tâches et réglages restent tels que le Bosco plus récent les a laissés. La même règle vaut pour le service lancé depuis le dépôt, qui l'écrit dans son terminal.
2. « Ok » ferme l'application. Tout autre arrêt du service au démarrage (port déjà pris, par exemple) s'affiche de la même façon, avec ses derniers messages, au lieu de fermer l'application sans un mot.

**Mobile** : sans objet sur le téléphone. L'application du téléphone se met à jour par un nouveau paquet Android, sans écran propre.

## <a id="e18"></a>E18 · Application Android

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `apps/e18.html` · implémentation : **Livré (Application Android développée : appairage par le lien du QR code (caméra ou saisie), confiance dans le seul certificat dont le QR code porte l'empreinte, trousseau, interface téléphone dans une vue web, poste injoignable avec nouvelle tentative, réglages (oublier le poste, rester connecté en arrière-plan par un service au premier plan, vibrer), notifications locales qui ouvrent leur session. Vérifié dans un émulateur Android 15 relié au poste de développement. Écarts : « Oublier ce poste » ne retire pas le téléphone côté poste (à faire dans Sources) ; la notification n'a pas encore le bouton « Autoriser » ; application en arrière-plan sans l'option, Android la gèle et les notifications attendent son retour.)**

### <a id="e18a"></a>E18a · Application Android : appairage par QR code

Au premier lancement, l'application Android s'appaire au poste en lisant son QR code. Écran pour téléphone seulement : pas de version desktop. L'appairage se fait sur le réseau local, avec l'adresse, le code et l'empreinte du certificat portés par le QR code.

- **Depuis** le premier lancement de l'application Android
- **Ensuite** [E18B](#e18b) une fois appairée

Règles de l'écran :

1. Le QR code affiché par le poste ([E4c](sessions.md#e4c)) porte l'adresse de Bosco, le code d'appairage et l'empreinte de son certificat. La caméra le lit ; une fois lu, l'écran montre le poste trouvé.
2. Le certificat de Bosco est vérifié par son empreinte, reçue par le QR code : l'application n'a plus d'avertissement de sécurité à afficher (règle 4). Elle ne fait confiance qu'à ce certificat.
3. Le code est à usage unique et valable 5 minutes, comme dans [E4c](sessions.md#e4c). Il est rempli à la lecture du QR code, et peut aussi se saisir à la main.
4. « Appairer » termine l'appairage. L'accès est gardé dans le trousseau du téléphone ; « Oublier ce poste » le retire, dans les réglages de l'application ([E18d](#e18d)).

### <a id="e18b"></a>E18b · Application Android : connectée

Une fois appairée, l'application Android ouvre la vue d'ensemble de Bosco, celle du téléphone ([E1b](sessions.md#e1b)). Écran pour téléphone seulement : pas de version desktop. Un message bref signale ici une session qui t'attend.

- **Depuis** [E18A](#e18a) après « Appairer » · le lancement de l'application
- **Ensuite** [E2B](sessions.md#e2b) au clic sur une session qui t'attend · [E18C](#e18c) si le poste ne répond plus

Règles de l'écran :

1. L'application montre l'interface téléphone de Bosco telle quelle, la même que dans le navigateur du téléphone (règle 1) : bandeau T'attend, sessions par dépôt, barre du bas. Il n'y a pas de barre d'adresse : c'est une application.
2. Quand une session t'attend pendant que l'application est ouverte, un message bref s'affiche en haut de l'écran, comme dans [E15c](sessions.md#e15c).
3. Une notification (application fermée ou en arrière-plan) et son bouton « Ouvrir » ouvrent directement la session concernée, sans passer par la vue d'ensemble.

### <a id="e18c"></a>E18c · Application Android : poste injoignable

Quand le téléphone ne trouve plus le poste, l'application affiche un écran plein qui dit pourquoi et réessaie seul. Écran pour téléphone seulement : pas de version desktop.

- **Depuis** [E18B](#e18b) quand le poste ne répond plus
- **Ensuite** [E18B](#e18b) dès que le poste répond de nouveau · [E18A](#e18a) avec « Changer de poste »

Règles de l'écran :

1. Le téléphone ne joint Bosco que sur le réseau local du poste, sans service intermédiaire (règle 3) : hors de ce réseau, l'écran le dit et rappelle l'adresse du poste.
2. L'application réessaie toute seule toutes les 5 s ; « Réessayer » force une tentative tout de suite, « Changer de poste » ouvre l'appairage d'un autre poste ([E18a](#e18a)).
3. Rien n'est perdu : l'écran garde l'heure de la dernière mise à jour, et les réponses se donnent au retour sur le réseau du poste.

### <a id="e18d"></a>E18d · Application Android : réglages de l'application

Les réglages propres à l'application : le poste appairé et les notifications. À droite, le volet de notifications d'Android, avec la notification permanente et une notification d'autorisation. Écran pour téléphone seulement : pas de version desktop.

- **Depuis** [E18B](#e18b) par le menu de l'écran
- **Ensuite** [E18A](#e18a) après « Oublier ce poste » · [E15B](sessions.md#e15b) avec « Choisir ce qui notifie »

Règles de l'écran :

1. « Oublier ce poste » retire l'accès du trousseau du téléphone et révoque l'appairage côté poste aussi : le téléphone doit être appairé de nouveau pour revenir ([E18a](#e18a)).
2. « Rester connecté en arrière-plan » garde une connexion au poste pour notifier application fermée, tant que le téléphone est sur le réseau du poste. C'est une option, désactivée par défaut (point ouvert du lot) : rien ne quitte le réseau local.
3. Tant que l'option est active, Android affiche une notification permanente « Bosco suit tes sessions », avec le nombre de sessions qui t'attendent.
4. « Autoriser » depuis la notification demande la confirmation du téléphone, comme dans Bosco (règle 7 du lot 1, [E2b](sessions.md#e2b)). « Ouvrir » ouvre la session.
5. Ce qui notifie (autorisations, questions, tâches) se règle dans Bosco ([E15b](sessions.md#e15b)).

## <a id="criteres-dacceptation"></a>Critères d'acceptation

### <a id="e17-application-du-poste"></a>E17 · Application du poste

- **CA-APPS-01** · [E17a](#e17a) · Étant donné l'application du poste lancée sans service Bosco, quand elle s'ouvre, alors elle démarre le service et montre l'interface de Bosco dans sa fenêtre ; fermer la fenêtre garde Bosco dans la barre système, « Quitter Bosco » arrête le service ; « Lancer au démarrage » démarre Bosco à l'ouverture de session, fenêtre fermée.
- **CA-APPS-02** · [E17a](#e17a) · Étant donné des sessions qui t'attendent, quand la personne regarde la barre système, alors l'icône porte leur nombre, et son menu les liste ; un clic ouvre la session dans la fenêtre ; « Nouvelle session » ouvre E16a ; « Suspendre les notifications 1 h » les coupe une heure.
- **CA-APPS-03** · [E17a](#e17a) · Étant donné l'application du poste, quand une notification part (règles d'E15), alors elle s'affiche en notification native du bureau, avec « Ouvrir » qui ouvre la session dans la fenêtre ; le service ne l'envoie pas une seconde fois.
- **CA-APPS-04** · [E17b](#e17b) · Étant donné un service Bosco qui répond déjà sur le poste, quand l'application s'ouvre la première fois, alors elle propose de s'y relier (choix par défaut) ou de le remplacer ; reliée, elle n'est qu'une fenêtre sur le service, et Bosco reste utilisable dans le navigateur, comme avant.
- **CA-APPS-09** · [E17a](#e17a) · Étant donné le paquet de l'application du poste installé sur Debian ou Ubuntu, sans Node sur le poste, quand elle s'ouvre, alors elle démarre Bosco avec le Node qu'elle embarque et son bac à sable activé ; installer un paquet plus récent garde les sessions, les tâches et les réglages.
- **CA-APPS-10** · [E17c](#e17c), [E17d](#e17d) · Étant donné un paquet plus récent de l'application installé pendant que Bosco tourne, quand l'application le remarque, alors elle le signale une fois par une notification et en tête du menu de la barre système, et « Relancer Bosco » arrête son service puis rouvre l'application et le service sur la nouvelle version ; étant donné des données mises à jour par un Bosco plus récent, quand une version plus ancienne démarre, alors son service refuse de démarrer sans rien modifier, et l'application le dit.

### <a id="e18-application-android"></a>E18 · Application Android

- **CA-APPS-05** · [E18a](#e18a) · Étant donné le QR code d'appairage du poste (E4c), quand l'application Android le scanne et que le code est saisi, alors elle s'appaire, ne fait confiance qu'au certificat dont le QR code donne l'empreinte (sans avertissement), et garde son accès dans le trousseau du téléphone.
- **CA-APPS-06** · [E18b](#e18b) · Étant donné l'application appairée sur le réseau du poste, quand elle s'ouvre, alors elle montre l'interface téléphone de Bosco telle qu'elle est dans le navigateur ; un lien de notification ouvre la session.
- **CA-APPS-07** · [E18c](#e18c) · Étant donné le poste injoignable, quand l'application s'ouvre ou perd la connexion, alors elle le dit, avec l'adresse et la dernière mise à jour, réessaie toute seule et propose « Réessayer » et « Changer de poste ».
- **CA-APPS-08** · [E18d](#e18d) · Étant donné « Rester connecté en arrière-plan » activé (désactivé par défaut), quand l'application est fermée sur le réseau du poste, alors une notification permanente « Bosco suit tes sessions » le signale et les notifications de Bosco arrivent ; « Autoriser » depuis une notification demande la confirmation du téléphone ; « Oublier ce poste » révoque l'accès, sur le poste aussi.
