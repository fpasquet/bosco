<!-- Généré par export.mjs (skill requirements-doc) depuis sources/30-specs.md : ne pas modifier ici. -->

# <a id="31-lot-1-sessions"></a>3.1 Lot 1 · Sessions

## <a id="regles-fonctionnelles-du-lot"></a>Règles fonctionnelles du lot

- **RF-SESS-01** · **1. Une session est découverte sans action de ta part** : toute session Claude Code écrite dans un dossier de configuration surveillé apparaît dans Bosco, avec son dépôt, sa branche et son profil (pro, perso ou worker). Bosco lit ces fichiers sans jamais les modifier.
- **RF-SESS-02** · **2. Une session a un seul état** : T'attend (autorisation demandée, ou tour terminé : l'agent a rendu la main), En cours, Inactive (aucun événement depuis 15 min sans être close ; délai réglable dans les sources). Un tour terminé resté sans réponse devient lui aussi Inactive après ce délai. Sans suivi en direct, Bosco ne peut pas savoir qu'une session attend : seuls En cours et Inactive sont disponibles, À relire, Terminée, En échec. T'attend passe toujours en premier.
- **RF-SESS-03** · **3. Une autorisation se donne depuis Bosco ou depuis le terminal**, au choix : la première réponse l'emporte et l'autre écran se met à jour. Les boutons « Autoriser » et « Refuser » n'existent que si le suivi en direct est installé pour ce profil ; sinon seul « Ouvrir » est proposé. Une autorisation vaut pour une seule commande : pas de « toujours autoriser » depuis Bosco.
- **RF-SESS-04** · **4. Un tour terminé ne se répond pas dans Bosco** : on revient au terminal de la session. Bosco montre le dernier message et le dossier, mais ne peut pas mettre un terminal au premier plan.
- **RF-SESS-05** · **5. Le coût est une estimation** au tarif public des modèles, calculée à partir des tokens (cache compris), même sous abonnement. Un modèle dont le tarif n'est pas connu apparaît « non chiffré ». Le coût du jour additionne les sessions commencées aujourd'hui.
- **RF-SESS-06** · **6. La vue d'ensemble se regroupe par dépôt ou par état** : tableau par dépôt, ou colonnes par état. Le choix est gardé d'une visite à l'autre.
- **RF-SESS-07** · **7. Bosco reste sur le poste** : rien n'est envoyé ailleurs, et il n'écoute que sur le poste tant que l'accès téléphone n'est pas activé. L'accès depuis le téléphone est désactivé par défaut ; il s'active pour le réseau local ([E4c](#e4c)), en connexion chiffrée, avec un code d'appairage. Sur mobile, « Autoriser » demande une confirmation.
- **RF-SESS-08** · **8. Chaque nouvelle attente déclenche une notification du bureau**, même quand Bosco n'est pas au premier plan. Activée par défaut, désactivable dans les sources.
- **RF-SESS-09** · **9. Une session se reprend seulement quand elle est close** : reprendre une session encore ouverte mélangerait deux conversations. La commande de reprise n'apparaît donc que pour une session terminée ou en échec.
- **RF-SESS-10** · **10. Bosco garde sa propre copie des sessions** : Claude Code efface ses fichiers après 30 jours par défaut. L'historique reste lisible et chiffré dans Bosco, mais une session effacée par Claude Code ne se reprend plus.
- **RF-SESS-11** · **11. Bosco se présente au premier lancement** : un bloc de bienvenue (logo, ce que fait Bosco, ses trois usages) précède le choix des profils, dans la page et sans fenêtre à fermer. Il se rouvre à tout moment depuis le logo (« À propos de Bosco »), avec l'origine du nom : le bosco est le maître d'équipage d'un navire.

## <a id="e1"></a>E1 · Vue d'ensemble

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e1.html` · implémentation : **Livré (Premier lancement (E1a) et vue d'ensemble en direct (E1b à E1e) développés : bandeau T'attend avec « Autoriser » et « Refuser » (motif facultatif), colonne T'attend en regroupement par état, message bref quand une autorisation reçoit sa réponse ici ou dans le terminal ; regroupement par dépôt ou par état, filtre par dépôt, indicateurs et coût du jour, progression de la lecture. Une session arrêtée passe en Terminée ; chaque nouvelle attente déclenche une notification du bureau. Bosco injoignable (E1f) : écran figé et daté, réponses désactivées, reconnexion toutes les 5 s. Sessions terminées du jour sous la vue filtrée et la vue par état, avec « Voir l'historique ».)**

### <a id="e1a"></a>E1a · Vue d'ensemble : premier lancement

Au tout premier lancement, Bosco se présente en quelques lignes, puis demande quels profils surveiller. Aucune session n'est affichée : Bosco a repéré des dossiers de configuration de Claude Code sur le poste et demande lesquels surveiller. Rien n'est lu avant la validation. Un second encart propose d'installer le suivi en direct, sans obligation.

- **Depuis** le premier lancement de Bosco
- **Ensuite** [E1b](#e1b) après « Surveiller ces profils » · [E4b](#e4b) via l'encart « Suivi en direct » · [E1e](#e1e) pendant la lecture des sessions

Règles de l'écran :

1. Bienvenue : le logo, ce que fait Bosco en une phrase et ses trois usages (sessions qui t'attendent, autorisations, tâches du worker), au-dessus du choix des profils, sans fenêtre à fermer (règle 11). Le même texte, avec l'origine du nom, se rouvre à tout moment depuis le logo de la barre latérale ou de l'en-tête du téléphone (« À propos de Bosco »).
2. Détection automatique des dossiers de configuration de Claude Code présents sur le poste : le dossier par défaut et ceux des autres profils (règle 1). Les deux sont cochés d'office ; en décocher un l'exclut de la surveillance.
3. Rien n'est lu avant « Surveiller ces profils ». Bosco lit les sessions sans jamais modifier les fichiers des profils (règles 1 et 7) ; les nombres de dépôts et la date de la dernière session viennent d'un simple aperçu des dossiers.
4. Sessions passées importées : celles des 30 derniers jours rejoignent l'historique ([E3a](#e3a)). Les sessions encore ouvertes apparaissent dans la vue d'ensemble.
5. Le suivi en direct est facultatif, mais indispensable pour savoir qu'une session t'attend : sans lui, Bosco lit les sessions mais ne voit pas les attentes en temps réel, et le bandeau T'attend n'apparaît pas. L'installation se fait par profil dans [E4b](#e4b) ; « Plus tard » masque l'encart, qui reste disponible dans les sources.

**Mobile** : le même bloc en pleine largeur, avec le bouton principal collé en bas (44 px). L'ajout d'un autre dossier se fait depuis le poste, comme l'installation du suivi en direct.

### <a id="e1b"></a>E1b · Vue d'ensemble : regroupée par dépôt

L'écran d'accueil, ouvert toute la journée à côté des terminaux. Le bandeau du haut réunit les sessions qui t'attendent, avec leur dernier message : on peut autoriser une commande sans quitter l'écran. Dessous, toutes les sessions ouvertes, groupées par dépôt, se comparent ligne à ligne.

- **Depuis** l'ouverture de Bosco, l'entrée « Vue d'ensemble », ou [E1a](#e1a) une fois une source activée
- **Ensuite** [E2b](#e2b) au clic sur une session qui t'attend · [E2a](#e2a) sur une session en cours · [E1d](#e1d) avec « Regrouper par : État » · [E1f](#e1f) si Bosco ne répond plus

Règles de l'écran :

1. Le bandeau n'apparaît que si au moins une session t'attend ; il disparaît quand la dernière reçoit sa réponse. Tri : la plus ancienne attente en premier. Il reste en tête même en regroupement par dépôt, parce que c'est la première chose à traiter. Une notification du bureau signale chaque nouvelle attente (règle 8). Sans suivi en direct, pas de bandeau : une ligne discrète propose de l'installer ([E4b](#e4b)).
2. « Autoriser » et « Refuser » n'existent que pour une **autorisation demandée** quand le suivi en direct est installé (règle 3). Un tour terminé n'a que « Voir la session » (règle 4) : la réponse se donne dans le terminal de la session. « Refuser » ouvre le détail [E2b](#e2b) pour écrire un motif, transmis à l'agent. Si la réponse a déjà été donnée dans le terminal, la ligne disparaît et un message bref l'indique.
3. « Regrouper par » bascule entre ce tableau par dépôt et les colonnes par état ([E1d](#e1d)). Le choix est gardé d'une visite à l'autre (règle 6).
4. Le coût du jour additionne les sessions commencées aujourd'hui, terminées comprises. Il est estimé au tarif public des modèles à partir des tokens, cache compris, même quand le compte est sous abonnement (règle 5).
5. Toute la ligne ouvre le détail de la session ([E2](#e2a)). Dans chaque dépôt, tri par état (T'attend, En cours, À relire, Inactive), puis par activité la plus récente. La marque « perso » distingue la session lancée avec le second dossier de configuration de Claude Code. Les sessions terminées ne sont pas ici : elles vont dans l'historique ([E3a](#e3a)).

**Mobile** : la ligne du tableau devient une ligne de liste (état, titre, branche et dernière action, activité). « Autoriser » et « Refuser » passent en grands boutons de 44 px ; sur mobile, « Autoriser » demande une confirmation ([E2b](#e2b)). Les dépôts et les profils de la barre latérale passent dans le bouton de filtres de l'en-tête.

### <a id="e1c"></a>E1c · Vue d'ensemble : filtrée par dépôt

La vue d'ensemble limitée à un dépôt, ici labo-ia. Le bandeau T'attend, les indicateurs et le tableau sont recalculés pour ce dépôt ; la colonne « Dossier » remplace les intertitres, car un monodépôt contient plusieurs dossiers.

- **Depuis** un clic sur « labo-ia » dans la barre latérale, depuis [E1b](#e1b)
- **Ensuite** [E3a](#e3a) via « Voir l'historique » · [E2b](#e2b) et [E2a](#e2a) au clic sur une session

Règles de l'écran :

1. Le filtre se pose depuis la barre latérale (clic sur un dépôt) ou depuis la recherche. Il s'affiche en puce à côté du titre et se retire d'un clic sur la croix, ce qui ramène à [E1b](#e1b). Le bandeau T'attend ne garde que les sessions du dépôt, avec les mêmes boutons et les mêmes règles (3 et 4).
2. Les indicateurs sont recalculés pour le dépôt : seules ses sessions comptent, terminées comprises pour le coût du jour. Le coût reste estimé (règle 5).
3. La colonne « Dossier » indique le sous-dossier où tourne la session : utile pour un monodépôt, où plusieurs paquets vivent côte à côte. Les intertitres de dépôt disparaissent, puisqu'il n'y en a plus qu'un.
4. Les sessions terminées aujourd'hui dans ce dépôt, des plus récentes aux plus anciennes. « Voir l'historique » ouvre [E3a](#e3a) déjà filtré sur le dépôt.

**Mobile** : la puce de filtre se place sous l'en-tête, avec le coût du jour du dépôt. Le bandeau et la liste suivent [E1b](#e1b), sans intertitre de dépôt ; seules les deux dernières terminées sont montrées avant le lien vers l'historique.

### <a id="e1d"></a>E1d · Vue d'ensemble : regroupée par état, en colonnes

Le même regroupement lu par état : une colonne par situation, chaque session en carte. La colonne T'attend remplace le bandeau d'E1b ; les cartes « En cours » montrent les trois dernières actions de l'agent pour voir d'un coup d'œil s'il avance.

- **Depuis** [E1b](#e1b) avec « Regrouper par : État »
- **Ensuite** [E2b](#e2b) au clic sur une session qui t'attend · [E2a](#e2a) sur une session en cours · [E2c](#e2c) via « Voir le diff »

Règles de l'écran :

1. Les mêmes sessions qu'en [E1b](#e1b), lues par état. Une carte change de colonne d'elle-même quand l'état de la session change (règle 2). Les terminées du jour sont en bas de la dernière colonne et renvoient à l'historique ([E3a](#e3a)) pour le reste ; les cartes d'une colonne sont triées par activité la plus récente.
2. Mini-fil : les trois dernières actions de l'agent, la plus récente en haut, pour voir s'il avance ou s'il tourne en rond. Sur mobile, un balayage horizontal passe d'une colonne à l'autre, en plus des puces d'état en haut.
3. La colonne T'attend remplace le bandeau d'E1b : mêmes boutons et mêmes règles. « Autoriser » et « Refuser » n'existent que pour une autorisation demandée (règle 3) ; un tour terminé n'a que « Voir la session » (règle 4). Une carte entière ouvre le détail de la session ([E2](#e2b)).
4. « Regrouper par » garde le dernier choix d'une visite à l'autre (règle 6). Il n'y a pas de bande d'indicateurs ici : le coût du jour (estimé, règle 5) passe dans le sous-titre pour laisser la hauteur aux colonnes.
5. Une session À relire affiche le compte rendu de l'agent et le résumé des modifications ; « Voir le diff » ouvre [E2c](#e2c). Les terminées du jour restent sous la colonne Inactives, la plus calme.

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

## <a id="e2"></a>E2 · Détail d'une session

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e2.html` · implémentation : **Livré (Détail d'une session développé (E2a, E2b, E2c, E2d) : fil en direct avec « Revenir au direct », carte d'autorisation avec motif du refus et « Répondu ailleurs », usage estimé, fichiers modifiés par l'agent, identifiant et commande de reprise d'une session close. Sessions du worker : la session de l'agent rejoint le profil du worker, devenu une source surveillée, rangée avec le dépôt du poste et titrée comme sa tâche ; état « À relire » ou « En échec » d'après sa tâche, la session à relire restant dans la vue d'ensemble ; bandeau « Ouvrir la revue » ou raison de l'arrêt et « Voir la tâche » ; reprise avec bosco resume, qui réinstalle la session dans le profil. Fil complet lu dans le transcript, sur les patterns d'AI Elements : demandes en bulles, réponses en Markdown (Streamdown, code coloré), réflexions, commandes et leur sortie, tests et leurs cas en échec, erreurs et leur pile d'appels, modifications en diff, plan de l'agent, sous-agents, étapes nombreuses repliées sous une ligne qui les résume ; une très longue session ne montre que ses derniers échanges, et un transcript effacé laisse le fil résumé. Vérifié sur de vraies tâches et sur une vraie session de plus de 80 Mo. Écarts : la relecture d'une session liée à une tâche se fait dans la revue de la tâche, sans onglets Modifications et Usage propres ; les refus de sortie réseau n'apparaissent pas dans le fil ; « Marquer comme relue » d'une session sans tâche n'est pas développé.)**

### <a id="e2a"></a>E2a · Détail d'une session : en cours

Le fil d'une session qui travaille, mis à jour au fil de l'eau : ce que l'agent dit, ce qu'il lit et modifie, ce que tu lui as demandé. À droite, la consommation et les fichiers touchés ; l'écran se lit sans rien faire et sert surtout à garder un œil sur une session sans retourner dans son terminal.

- **Depuis** [E1B](#e1b), [E1C](#e1c) ou [E1D](#e1d) au clic sur une session
- **Ensuite** [E2B](#e2b) quand l'agent demande une autorisation (même écran, le fil se prolonge d'une carte) · [E1B](#e1b) par la barre latérale

Règles de l'écran :

1. Le fil se met à jour sans recharger, le plus récent en bas. Tes demandes sont des bulles à droite ; les réponses de l'agent se lisent mises en forme (titres, listes, tableaux, code coloré). Chaque étape tient sur une ligne qui se déplie : une réflexion et sa durée, une commande et sa sortie, des tests et leurs cas en échec, une erreur et sa pile d'appels, une modification et ses lignes ajoutées ou retirées, le plan de l'agent. Plus de trois étapes à la suite se replient sous une ligne qui les résume. L'étape en cours tourne ; une étape restée sans résultat dans une session arrêtée est marquée « interrompu ». Une très longue session ne montre que ses derniers échanges, et une session dont Claude Code a effacé le transcript garde le fil résumé par Bosco.
2. « Revenir au direct » n'apparaît que lorsqu'on remonte dans le fil ; tant qu'on est en bas, le fil suit les nouveaux événements automatiquement.
3. Usage estimé au tarif public (règle 5), même sous abonnement. Le cache est la part des tokens lus depuis le cache plutôt que recalculés. Les chiffres bougent avec le fil.
4. Fichiers modifiés depuis le début de la session, comparés à l'état de la branche au démarrage ; le détail des lignes est dans le diff à la fin de la session ([E2C](#e2c)). Les fichiers viennent des actions de l'agent : les changements faits par une commande shell n'y figurent pas. Pour une session du worker, le diff vient de git et il est complet.
5. Une session encore ouverte ne se reprend pas : la reprise mélangerait deux conversations (règle 9). La commande de reprise n'apparaît que lorsque la session est close ; d'ici là, la colonne ne garde que l'identifiant. « Copier le chemin du dossier » copie le dossier du dépôt pour ouvrir un terminal dessus.

**Mobile** : écran poussé depuis la liste, avec le retour « Vue d'ensemble ». Trois onglets (Fil, Usage, Fichiers) remplacent la colonne de droite ; le fil occupe tout l'écran, sans barre du bas : « Copier le chemin du dossier » est une action du poste.

### <a id="e2b"></a>E2b · Détail d'une session : t'attend, autoriser ou refuser

Même écran qu'une session en cours, mais le fil s'arrête sur une carte : l'agent demande l'autorisation de lancer une commande. Tout ce qu'il faut pour décider est dans la carte (la commande, le dossier, ce que l'agent en dit), et on répond sans quitter Bosco.

- **Depuis** [E1B](#e1b) par « Autoriser » / « Refuser », ou au clic sur une session qui t'attend
- **Ensuite** [E1B](#e1b) une fois la réponse donnée

Règles de l'écran :

1. La carte n'existe que si le suivi en direct est installé (règle 3). Sans suivi en direct, il n'y a pas de carte : rien ne signale l'attente dans Bosco, qui propose seulement d'installer le suivi ([E4B](#e4b)).
2. La première réponse l'emporte, dans le terminal ou dans Bosco. Si l'autorisation a été donnée ailleurs, la carte devient « Répondu ailleurs à 15:15 » et ses boutons disparaissent. Si l'autorisation reste sans réponse trop longtemps, les boutons disparaissent de Bosco et le dialogue reste dans le terminal.
3. Le motif du refus est facultatif. Il est envoyé à l'agent comme consigne : il peut ainsi corriger sa demande au lieu de s'arrêter.
4. « Autoriser » vaut pour cette commande seulement. Pas de « toujours autoriser » depuis Bosco : une règle permanente se règle dans Claude Code (règle 3). Sur mobile, une confirmation précède l'envoi.
5. Après la réponse, retour à la vue d'ensemble s'il reste d'autres sessions en attente, avec un message bref (« Autorisé · Specs du tableau de bord »). Sinon, on reste sur le fil, qui repart.
6. Les fichiers de la colonne « Branche » viennent des actions de l'agent : les changements faits par une commande shell n'y figurent pas. Pour une session du worker, le diff vient de git et il est complet.

**Mobile** : écran poussé ; la carte d'autorisation se colle en bas en feuille, avec deux boutons de 44 px. Un appui sur « Autoriser » ouvre d'abord une confirmation qui rappelle la commande ; « Refuser » envoie directement, avec le motif s'il est rempli (règle 7).

### <a id="e2c"></a>E2c · Détail d'une session : à relire, usage et diff

Une session sans terminal vient de se terminer : l'écran sert à relire son travail. Le compte rendu de l'agent dit ce qui reste à vérifier, les onglets donnent les fichiers modifiés et un diff lisible, avec le résultat des tests tel que l'agent le déclare. Pour une session liée à une tâche, la relecture se fait dans la revue de la tâche.

- **Depuis** [E1B](#e1b) au clic sur une session « À relire » · [E3A](#e3a)
- **Ensuite** [E7A](taches.md#e7a) après « Ouvrir la revue »

Règles de l'écran :

1. « À relire » est posé automatiquement quand une session sans terminal se termine, ou à la main sur n'importe quelle session (règle 2).
2. Le diff est calculé depuis le point de départ de la branche : lignes ajoutées en vert, retirées en rouge, avec le numéro de ligne. Les blocs suivants se lisent en défilant.
3. « Ouvrir la revue » mène à la revue de la tâche T-12 ([E7a](taches.md#e7a)) : pour une session liée à une tâche, la relecture se fait dans la revue. « Marquer comme relue » n'existe que pour une session sans tâche : elle passe alors en Terminée, quitte la vue d'ensemble et reste consultable dans l'historique ([E3A](#e3a)).
4. Usage détaillé : tokens par type (entrée, sortie, cache lu, cache écrit), coût estimé au tarif public (règle 5) et durée. Une seule ligne de modèle ici, plusieurs s'il y en avait.
5. « Copier la reprise » copie la commande de reprise, par exemple pour traiter le point « À vérifier » : une session du worker doit être réinstallée dans le profil, d'où bosco resume. Pour une session interactive close, la commande affichée est claude --resume avec l'identifiant complet, précédée du dossier de configuration pour le profil perso. Sur téléphone, pas de copie : on ne colle rien dans un terminal depuis le téléphone.

**Mobile** : écran poussé ; les onglets (Modifications, Fil, Usage) passent en haut. La liste des fichiers précède le diff, en pleine largeur, dont le code défile horizontalement. « Ouvrir la revue » reste dans la barre du bas.

### <a id="e2d"></a>E2d · Détail d'une session : en échec

Une session du worker s'est arrêtée avant la fin. L'écran dit pourquoi en tête, garde le fil entier pour comprendre où elle en était, et propose soit de reprendre la session dans un terminal, soit d'ouvrir la tâche pour la relancer.

- **Depuis** [E3a](#e3a) au clic sur une session « En échec » · [E5b](taches.md#e5b)
- **Ensuite** [E13b](taches.md#e13b) au clic sur « Voir la tâche » · [E11b](contexte.md#e11b) depuis le refus réseau

Règles de l'écran :

1. Le bandeau donne la raison de l'arrêt. Les raisons possibles : budget atteint, nombre de tours atteint, limite de l'abonnement Claude atteinte, erreur de l'agent, interruption par toi, session coupée (poste éteint ou Docker arrêté). Le même motif apparaît sous le titre dans l'historique ([E3a](#e3a)).
2. Le fil reste entier, jusqu'à la ligne d'arrêt : on voit où la session en était. Les onglets « Modifications » et « Usage » fonctionnent comme dans [E2c](#e2c).
3. Un refus de sortie réseau est signalé dans le fil, à l'heure où il s'est produit, avec un lien vers la liste des domaines autorisés ([E11b](contexte.md#e11b)), où on peut l'ajouter si c'était voulu.
4. « Voir la tâche » ouvre la tâche T-9 ([E13b](taches.md#e13b)), où on la relance avec un budget revu. Ce bouton n'existe que pour une session du worker : une session interactive en échec n'a pas de tâche et n'a que « Copier la reprise ».
5. « Copier la reprise » copie la commande qui poursuit la session : pour une session du worker, bosco resume la réinstalle dans le profil. Pour une session interactive close, la commande affichée est claude --resume avec l'identifiant complet, précédée du dossier de configuration pour le profil perso. La reprise reste possible après un échec, tant que Claude Code n'a pas effacé la session (règle 10). Sur téléphone, pas de copie : on ne colle rien dans un terminal depuis le téléphone.

**Mobile** : écran poussé ; les onglets (Fil, Modifications, Usage) passent en haut. Le bandeau de raison précède le fil, et la barre du bas garde « Voir la tâche ».

## <a id="e3"></a>E3 · Historique

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e3.html` · implémentation : **Livré (Historique développé : liste par jour avec son total, chargée au défilement, recherche dans les titres, messages et commandes (index plein texte), filtres en puces qui se cumulent (période, dépôt, profil, état) ; onglet Coûts avec total, moyenne par jour ouvré, part du cache, graphique par jour ouvré empilé par dépôt, tableaux par dépôt (triable) et par modèle. Écarts : la répartition par modèle suit le modèle principal de chaque session ; « Tout afficher » d'un jour chargé n'existe pas, toutes ses sessions sont montrées.)**

### <a id="e3a"></a>E3a · Historique : recherche et liste

Toutes les sessions passées et ouvertes des profils surveillés, jour par jour. On y retrouve une session par un mot de son titre, d'un message ou d'une commande, et on voit ce que chaque journée a coûté.

- **Depuis** l'entrée « Historique » de la navigation · [E1c](#e1c) (« Voir l'historique ») · [E1b](#e1b) pour les sessions terminées
- **Ensuite** [E2c](#e2c) au clic sur une session terminée ou à relire · [E2a](#e2a) sur une session ouverte · [E3b](#e3b) avec l'onglet « Coûts »

Règles de l'écran :

1. La recherche porte sur les titres, les messages et les commandes de toutes les sessions des profils surveillés. Elle s'applique pendant la frappe ; le raccourci « / » place le curseur dans le champ.
2. Les filtres en puces se cumulent (période, dépôt, profil, état) et se retirent un par un. Tout l'historique des profils surveillés est conservé (réglable dans les [sources](#e4a)). Une session plus vieille que la rétention de Claude Code reste lisible, sans reprise (règle 10).
3. Chaque jour a son total : nombre de sessions et coût estimé (règle 5). Les jours se suivent du plus récent au plus ancien ; la liste se charge par jour au défilement.
4. L'état affiché est l'état final. Une session toujours ouverte garde son état actuel (T'attend, En cours). Pour une session « En échec », la raison (budget atteint, interrompue…) est visible sous le titre et au survol du badge ; la ligne ouvre [E2d](#e2d).
5. Toute la ligne ouvre le détail : [E2c](#e2c) pour une session terminée ou à relire, [E2a](#e2a) ou [E2b](#e2b) pour une session ouverte, [E2d](#e2d) pour une session en échec.
6. Les onglets « Liste » et « Coûts » partagent la recherche et les filtres. « Coûts » ouvre [E3b](#e3b).

**Mobile** : recherche en haut, puces de filtre défilantes, liste par jour en lignes compactes (état, titre, dépôt et profil, heure, coût). Les onglets « Liste » et « Coûts » passent sous la recherche ; les cibles font 44 px.

### <a id="e3b"></a>E3b · Historique : coûts par jour et par dépôt

L'onglet « Coûts » de l'historique répond à la question « où part le budget ? » : un total, un coût par jour empilé par dépôt, puis la répartition par dépôt et par modèle. Tout est estimé.

- **Depuis** l'onglet « Coûts » de [E3a](#e3a)
- **Ensuite** [E3a](#e3a) filtrée sur un dépôt au clic dans le tableau « Par dépôt » · [E3a](#e3a) avec l'onglet « Liste »

Règles de l'écran :

1. Tous les coûts sont des estimations, calculées au tarif public des modèles à partir des tokens, cache compris, même quand le compte est sous abonnement (règle 5). Le total et la moyenne couvrent la période choisie ; la moyenne ne compte que les jours ouvrés.
2. Une barre par jour ouvré, empilée par dépôt ; la hauteur est proportionnelle au coût et l'axe va de 0 à 8 $. Aujourd'hui est surligné avec son total. Un survol affiche le détail du jour : coût et sessions par dépôt. Les dépôts n'ont pas de couleur propre dans Bosco : les séries empruntent les couleurs du thème (primaire, info, avertissement, neutre), précisées dans la légende, et le tableau reprend les mêmes pastilles.
3. Le tableau se trie par colonne. Un clic sur un dépôt ouvre la liste [E3a](#e3a) déjà filtrée sur ce dépôt et sur la période.
4. La part du cache est la proportion de tokens servis par le cache plutôt que relus au tarif plein : plus elle est haute, moins les sessions coûtent.

**Mobile** : les indicateurs passent en grille de deux colonnes, le graphique se limite aux 14 derniers jours ouvrés avec une barre par jour (non empilée), et les répartitions par dépôt et par modèle deviennent des listes. Le détail d'un jour s'obtient en touchant sa barre.

## <a id="e4"></a>E4 · Sources

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `sessions/e4.html` · implémentation : **Livré (Sources développées (E4a, E4b) : interrupteur de lecture par profil, état du suivi en direct et dernier signal, seuil d'inactivité (5 à 60 min), notifications du bureau envoyées par le service à chaque nouvelle attente, historique conservé en entier ; installation du suivi en trois étapes. Écarts : « Ajouter un dossier », « Gérer » et l'état « À mettre à jour » d'une source illisible ne sont pas faits ; le serveur Bosco (tâches et décisions) n'est pas encore ajouté au profil. Accès depuis le téléphone (E4c) : écoute HTTPS sur le réseau local seulement une fois activé, certificat créé par Bosco, code de 6 chiffres valable 5 min, à usage unique et 5 essais, page d'appairage sur le téléphone, téléphones appairés retirés d'un clic. Écart : pas de QR code, l'adresse se copie.)**

### <a id="e4a"></a>E4a · Sources : profils surveillés et réglages

Les dossiers que Bosco lit, et ses réglages. Chaque source montre si le suivi en direct est installé et quand le dernier signal est arrivé : c'est ici qu'on voit d'un coup d'œil que tout est branché.

- **Depuis** l'entrée « Sources » de la navigation · [E1a](#e1a) après « Surveiller ces profils » · l'indicateur d'état des sources de la barre latérale
- **Ensuite** [E4b](#e4b) au clic sur « Vérifier le suivi en direct » · [E4c](#e4c) en activant « Accès depuis le téléphone » · [E1b](#e1b) en revenant à la vue d'ensemble

Règles de l'écran :

1. Une source est un dossier de configuration de Claude Code ou le dossier du worker. Désactiver l'interrupteur arrête la lecture de ce dossier sans rien effacer : les sessions déjà lues restent dans l'historique. Bosco ne modifie jamais les fichiers lus (règles 1 et 7). Si une version de Claude Code change le format des sessions, la source passe « À mettre à jour » : Bosco ne lit plus ses nouvelles sessions tant qu'il n'est pas mis à jour.
2. Le suivi en direct s'installe profil par profil. Quand il manque, la ligne propose « Installer », qui ouvre [E4b](#e4b) ; sinon, le lien « Vérifier le suivi en direct » y mène aussi. Sans lui, Bosco ne peut pas savoir qu'une session t'attend, et « Autoriser » reste indisponible (règles 2 et 3).
3. Le seuil d'inactivité, 15 minutes par défaut, fixe le délai sans événement après lequel une session passe à « Inactive » (règle 2). Réglable de 5 à 60 minutes.
4. L'accès depuis le téléphone est désactivé par défaut : Bosco n'écoute que sur ce poste et aucun accès n'existe en dehors (règle 7). L'activer ouvre l'accès sur le réseau local et affiche un code d'appairage à saisir sur le téléphone ([E4c](#e4c)) ; sur mobile, « Autoriser » demande ensuite une confirmation. Un téléphone appairé se retire d'un clic.
5. La notification du bureau signale chaque nouvelle attente, y compris quand Bosco n'est pas au premier plan. Activée par défaut, désactivable (règle 8).
6. Bosco garde sa propre copie des sessions : Claude Code efface ses fichiers après 30 jours par défaut, mais l'historique reste lisible dans Bosco. Une session effacée par Claude Code ne se reprend plus (règle 10).

**Mobile** : les entrées « Contexte » et « Réglages » de la barre latérale passent ici, sous forme de deux boutons ([E9a](contexte.md#e9a), [E10a](contexte.md#e10a)). Les sources deviennent des cartes, les réglages une liste d'options à ouvrir. L'ajout d'un dossier n'existe que sur le poste, avec un renvoi explicite à l'ordinateur (pastille 6) ; l'appairage d'un téléphone se déclenche aussi depuis le poste.

### <a id="e4b"></a>E4b · Sources : installation du suivi en direct

Un panneau latéral, au-dessus de la liste des sources, guide l'installation du suivi en direct d'un profil en trois étapes : ce que cela permet, l'installation, la vérification. Ici, la dernière étape est terminée.

- **Depuis** [E4a](#e4a) (« Vérifier le suivi en direct » ou « Installer ») · [E1a](#e1a) via « Ensuite : suivi en direct »
- **Ensuite** [E1b](#e1b) au clic sur « Terminer » · [E4a](#e4a) en fermant le panneau

Règles de l'écran :

1. L'installation se fait profil par profil et se défait en un clic : « Désinstaller » remet les réglages d'avant. Le panneau garde l'écran des sources visible derrière lui. Si Bosco est arrêté, Claude Code continue normalement.
2. Rien n'est installé sans clic. À l'étape d'installation, une copie des réglages actuels du profil est gardée par défaut (case cochée), et les réglages existants sont conservés : Bosco ajoute les siens sans rien remplacer. L'étape montre d'abord les 6 événements qui seront suivis et le serveur Bosco ajouté au profil (tâches et décisions).
3. La vérification repose sur un vrai signal d'une session ouverte, pas sur la seule écriture des réglages. Si aucune session n'est ouverte, l'étape l'indique : « Ouvre une session Claude Code dans ce profil pour terminer la vérification ».
4. Le worker n'a pas de suivi en direct : il s'exécute sans terminal et ses sessions sont lues à la fin, en lecture seule. « Terminer » ramène à [E1b](#e1b), où le bandeau « T'attend » propose désormais « Autoriser » et « Refuser ».

**Mobile** : l'installation se fait sur le poste, pas sur le téléphone. L'écran mobile renvoie à l'ordinateur et montre seulement l'état du suivi des trois sources (pas de bouton d'installation ni de désinstallation).

### <a id="e4c"></a>E4c · Sources : accès depuis le téléphone

Une fenêtre au-dessus des sources donne l'adresse à ouvrir sur le téléphone, par copie ou par QR code, et un code à saisir. Le code vaut 5 minutes et une seule fois. Sur le téléphone, un écran plein ne demande que ce code.

- **Depuis** [E4a](#e4a) en activant « Accès depuis le téléphone »
- **Ensuite** [E4a](#e4a) une fois le téléphone appairé · [E2b](#e2b) sur le téléphone, pour confirmer une autorisation

Règles de l'écran :

1. L'accès n'existe que sur le réseau local, et seulement une fois activé : rien n'est exposé sur Internet (règle 7). Le QR code évite de taper l'adresse, qui suit celle du poste et change avec le réseau. Hors de ce réseau, ou sur un Wi-Fi qui isole les appareils, le téléphone ne joint pas le poste.
2. Le code est valable 5 minutes, à usage unique, avec 5 essais au plus. Passé le délai ou après les essais, il est refusé : « Générer un nouveau code » en crée un autre et invalide l'ancien.
3. Après l'appairage, la fenêtre se ferme et le téléphone apparaît dans la liste de [E4a](#e4a), avec la date de l'appairage. Il se retire d'un clic, ce qui coupe son accès aussitôt. « Annuler » ferme la fenêtre sans rien activer de plus.
4. Bosco crée son propre certificat : les échanges sont chiffrés, mais le navigateur ne peut pas le vérifier. Il affiche donc un avertissement, à accepter une fois sur chaque téléphone. Les notifications du téléphone ne sont pas prévues : elles exigeraient un certificat reconnu.
5. Sur ce téléphone, « Autoriser » demande ensuite une confirmation avant d'envoyer la réponse à l'agent ([E2b](#e2b)).

**Mobile** : l'écran de gauche est celui qui s'ouvre sur le téléphone à l'adresse affichée par le poste, sans les onglets de l'application, puisqu'elle n'est pas encore accessible. Un champ de six chiffres et un bouton « Appairer » de 44 px suffisent.

## <a id="criteres-dacceptation"></a>Critères d'acceptation

### <a id="e1-vue-densemble"></a>E1 · Vue d'ensemble

- **CA-SESS-01** · [E1a](#e1a) · Étant donné le tout premier lancement de Bosco avec des dossiers de configuration de Claude Code présents sur le poste, quand la personne ouvre Bosco, alors aucune session n'est affichée et Bosco demande quels dossiers surveiller, le dossier par défaut et ceux des autres profils étant cochés d'office (RF-SESS-01).
- **CA-SESS-02** · [E1a](#e1a) · Étant donné l'écran de premier lancement, quand la personne n'a pas encore cliqué sur « Surveiller ces profils », alors aucune session n'est lue et seul un aperçu (nombre de dépôts, date de la dernière session) est montré (RF-SESS-01).
- **CA-SESS-03** · [E1a](#e1a) · Étant donné un dossier décoché, quand la personne clique sur « Surveiller ces profils », alors ce dossier est exclu de la surveillance et les sessions des 30 derniers jours des autres rejoignent l'historique (RF-SESS-01).
- **CA-SESS-04** · [E1a](#e1a) · Étant donné l'encart « Suivi en direct », quand la personne clique sur « Plus tard », alors l'encart est masqué et reste disponible dans les sources (RF-SESS-02).
- **CA-SESS-71** · [E1a](#e1a) · Étant donné le tout premier lancement de Bosco, quand la personne ouvre Bosco, alors un bloc de bienvenue (logo, une phrase sur ce que fait Bosco, ses trois usages) s'affiche au-dessus du choix des profils, dans la page, sans fenêtre à fermer ni clic supplémentaire avant « Surveiller ces profils » (RF-SESS-11).
- **CA-SESS-72** · [E1a](#e1a) · Étant donné Bosco déjà configuré, quand la personne clique sur le logo de la barre latérale ou de l'en-tête du téléphone, alors « À propos de Bosco » s'ouvre avec le même texte de bienvenue et l'origine du nom (le bosco, maître d'équipage d'un navire), et se ferme sans rien changer (RF-SESS-11).
- **CA-SESS-05** · [E1b](#e1b) · Étant donné au moins une session qui t'attend et le suivi en direct installé, quand la personne ouvre la vue d'ensemble, alors le bandeau T'attend est en tête, avec la plus ancienne attente en premier et le dernier message de chaque session, même en regroupement par dépôt (RF-SESS-02).
- **CA-SESS-06** · [E1b](#e1b) · Étant donné une autorisation demandée avec le suivi en direct installé, quand la personne regarde la ligne du bandeau, alors « Autoriser » et « Refuser » sont proposés, tandis qu'un tour terminé n'a que « Voir la session » (RF-SESS-03, RF-SESS-04).
- **CA-SESS-07** · [E1b](#e1b) · Étant donné une autorisation déjà donnée dans le terminal, quand la vue d'ensemble se met à jour, alors la ligne disparaît du bandeau et un message bref l'indique (RF-SESS-03).
- **CA-SESS-08** · [E1b](#e1b) · Étant donné aucune session qui t'attend, ou le suivi en direct non installé, quand la personne ouvre la vue d'ensemble, alors le bandeau n'apparaît pas et, sans suivi en direct, une ligne discrète propose de l'installer (RF-SESS-02).
- **CA-SESS-09** · [E1b](#e1b) · Étant donné la vue regroupée par dépôt, quand la personne la parcourt, alors dans chaque dépôt les sessions sont triées par état (T'attend, En cours, À relire, Inactive) puis par activité la plus récente, et les sessions terminées n'y figurent pas (RF-SESS-02, RF-SESS-06).
- **CA-SESS-10** · [E1b](#e1b) · Étant donné des sessions commencées aujourd'hui, dont des terminées, quand la personne lit le coût du jour, alors il additionne toutes ces sessions et est présenté comme une estimation au tarif public des modèles (RF-SESS-05).
- **CA-SESS-11** · [E1c](#e1c) · Étant donné la vue filtrée sur le dépôt labo-ia, quand la personne clique sur un dépôt de la barre latérale, alors une puce de filtre s'affiche à côté du titre et le bandeau T'attend, les indicateurs et le tableau ne portent que sur ce dépôt (RF-SESS-02).
- **CA-SESS-12** · [E1c](#e1c) · Étant donné la vue filtrée sur un dépôt, quand la personne clique sur la croix de la puce, alors le filtre est retiré et la vue d'ensemble [E1b](#e1b) revient.
- **CA-SESS-13** · [E1c](#e1c) · Étant donné la vue filtrée sur un dépôt, quand la personne regarde le tableau, alors la colonne « Dossier » remplace les intertitres de dépôt et les sessions terminées aujourd'hui dans ce dépôt sont listées des plus récentes aux plus anciennes, avec « Voir l'historique » qui ouvre [E3a](#e3a) déjà filtré sur le dépôt.
- **CA-SESS-14** · [E1d](#e1d) · Étant donné « Regrouper par : État », quand la personne ouvre la vue d'ensemble, alors une colonne par état s'affiche, chaque session en carte, et la colonne T'attend remplace le bandeau avec les mêmes boutons et règles (RF-SESS-06, RF-SESS-03).
- **CA-SESS-15** · [E1d](#e1d) · Étant donné une session En cours, quand la personne regarde sa carte, alors les trois dernières actions de l'agent sont montrées, la plus récente en haut.
- **CA-SESS-16** · [E1d](#e1d) · Étant donné une session dont l'état change, quand la mise à jour a lieu, alors sa carte change de colonne d'elle-même (RF-SESS-02).
- **CA-SESS-17** · [E1d](#e1d) · Étant donné une session À relire, quand la personne regarde sa carte, alors le compte rendu de l'agent et le résumé des modifications sont affichés et « Voir le diff » ouvre [E2c](#e2c).
- **CA-SESS-18** · [E1d](#e1d) · Étant donné le choix « Regrouper par : État », quand la personne quitte Bosco puis y revient, alors le choix est conservé (RF-SESS-06).
- **CA-SESS-19** · [E1e](#e1e) · Étant donné le premier affichage après « Surveiller ces profils », quand Bosco lit encore l'historique, alors un bandeau avec une barre de progression réelle (par exemple « 1 240 sessions lues sur 3 180 ») s'affiche et disparaît quand la lecture est finie.
- **CA-SESS-20** · [E1e](#e1e) · Étant donné la lecture en cours, quand des sessions ouvertes sont prêtes, alors elles apparaissent aussitôt, avant l'historique, et les suivantes sont des blocs animés.
- **CA-SESS-21** · [E1e](#e1e) · Étant donné la lecture en cours, quand la personne quitte l'écran puis revient, alors la lecture a continué et la progression se retrouve ; une attente détectée pendant la lecture déclenche la notification du bureau (RF-SESS-08).
- **CA-SESS-22** · [E1e](#e1e) · Étant donné un chargement ordinaire hors premier lancement, quand l'écran se charge, alors seuls des blocs animés s'affichent, sans bandeau ni barre, pendant moins d'une seconde.
- **CA-SESS-23** · [E1f](#e1f) · Étant donné que Bosco ne répond plus, quand la coupure est détectée (moins de 5 s), alors l'écran garde les dernières informations reçues, atténuées et datées, avec un bandeau en tête et la colonne « Vu à » à la place des durées.
- **CA-SESS-24** · [E1f](#e1f) · Étant donné Bosco injoignable, quand la personne regarde le bandeau T'attend, alors « Autoriser » et « Refuser » sont désactivés, « Voir la session » reste disponible et les autorisations se donnent dans le terminal (RF-SESS-03).
- **CA-SESS-25** · [E1f](#e1f) · Étant donné Bosco injoignable, quand la personne clique sur « Réessayer » ou attend, alors une reconnexion est tentée aussitôt par le bouton, ou toutes les 5 s sans action.
- **CA-SESS-26** · [E1f](#e1f) · Étant donné Bosco qui répond de nouveau, quand la connexion revient, alors le bandeau disparaît et l'écran se met à jour sans rechargement, une autorisation donnée entre-temps dans le terminal ayant fait disparaître sa ligne.

### <a id="e2-detail-dune-session"></a>E2 · Détail d'une session

- **CA-SESS-27** · [E2a](#e2a) · Étant donné une session En cours, quand la personne ouvre son détail, alors le fil se met à jour sans rechargement, le plus récent en bas, les actions repliées sur une ligne et dépliables, et l'action en cours porte une pastille animée.
- **CA-SESS-28** · [E2a](#e2a) · Étant donné un fil dans lequel la personne a remonté, quand de nouveaux événements arrivent, alors « Revenir au direct » est affiché ; tant qu'elle est en bas, le fil suit les événements sans ce bouton.
- **CA-SESS-29** · [E2a](#e2a) · Étant donné une session En cours, quand la personne regarde l'usage, alors il est présenté comme une estimation au tarif public, même sous abonnement, et les chiffres bougent avec le fil (RF-SESS-05).
- **CA-SESS-30** · [E2a](#e2a) · Étant donné une session encore ouverte, quand la personne regarde la colonne de droite, alors la commande de reprise n'apparaît pas, seul l'identifiant est gardé, et « Copier le chemin du dossier » copie le dossier du dépôt (RF-SESS-09).
- **CA-SESS-73** · [E2a](#e2a) · Étant donné une session dont le transcript existe, quand la personne ouvre son détail, alors ses demandes sont des bulles, les réponses de l'agent sont mises en forme (titres, listes, tableaux, code coloré), et chaque étape tient sur une ligne qui se déplie : réflexion et sa durée, commande et sa sortie, tests et leurs cas en échec, erreur et sa pile d'appels, modification et ses lignes ajoutées ou retirées, plan de l'agent ; plus de trois étapes à la suite se replient sous une ligne qui les résume.
- **CA-SESS-74** · [E2a](#e2a) · Étant donné une session dont Claude Code a effacé le transcript, quand la personne ouvre son détail, alors le fil montre le résumé gardé par Bosco ; étant donné une très longue session, alors seuls ses derniers échanges sont montrés, avec une mention qui le dit.
- **CA-SESS-31** · [E2b](#e2b) · Étant donné une autorisation demandée avec le suivi en direct installé, quand la personne ouvre la session, alors le fil s'arrête sur une carte montrant la commande, le dossier et ce que l'agent en dit, avec « Autoriser » et « Refuser » (RF-SESS-03).
- **CA-SESS-32** · [E2b](#e2b) · Étant donné le suivi en direct non installé, quand la personne ouvre la session, alors il n'y a pas de carte d'autorisation et Bosco propose seulement d'installer le suivi (RF-SESS-03).
- **CA-SESS-33** · [E2b](#e2b) · Étant donné une autorisation déjà donnée dans le terminal, quand la personne regarde la carte, alors elle indique « Répondu ailleurs à 15:15 » et ses boutons ont disparu ; la première réponse l'emporte (RF-SESS-03).
- **CA-SESS-34** · [E2b](#e2b) · Étant donné un refus avec un motif, quand la personne clique sur « Refuser », alors le motif, facultatif, est envoyé à l'agent comme consigne.
- **CA-SESS-35** · [E2b](#e2b) · Étant donné un clic sur « Autoriser », quand la réponse est envoyée, alors elle ne vaut que pour cette commande et aucune option « toujours autoriser » n'est proposée (RF-SESS-03).
- **CA-SESS-36** · [E2b](#e2b) · Étant donné une réponse donnée, quand il reste d'autres sessions en attente, alors la vue d'ensemble s'ouvre avec un message bref (« Autorisé · Specs du tableau de bord »), sinon la personne reste sur le fil qui repart.
- **CA-SESS-37** · [E2b](#e2b) · Étant donné un téléphone, quand la personne appuie sur « Autoriser », alors une confirmation rappelant la commande précède l'envoi, tandis que « Refuser » envoie directement (RF-SESS-07).
- **CA-SESS-38** · [E2c](#e2c) · Étant donné une session sans terminal qui se termine, quand elle passe À relire, alors son compte rendu, les fichiers modifiés et un diff apparaissent, avec lignes ajoutées en vert, retirées en rouge et numéro de ligne.
- **CA-SESS-39** · [E2c](#e2c) · Étant donné une session À relire liée à une tâche, quand la personne clique sur « Ouvrir la revue », alors la revue de la tâche T-12 ([E7a](taches.md#e7a)) s'ouvre et « Marquer comme relue » n'est pas proposé.
- **CA-SESS-40** · [E2c](#e2c) · Étant donné une session À relire sans tâche, quand la personne clique sur « Marquer comme relue », alors la session passe Terminée, quitte la vue d'ensemble et reste consultable dans l'historique ([E3a](#e3a)).
- **CA-SESS-41** · [E2c](#e2c) · Étant donné l'onglet Usage, quand la personne le consulte, alors il montre les tokens par type (entrée, sortie, cache lu, cache écrit), le coût estimé au tarif public et la durée (RF-SESS-05).
- **CA-SESS-42** · [E2c](#e2c) · Étant donné une session interactive close, quand la personne clique sur « Copier la reprise », alors la commande est claude --resume avec l'identifiant complet, précédée du dossier de configuration pour le profil perso, et pour une session du worker c'est bosco resume ; sur téléphone, la copie n'existe pas (RF-SESS-09).
- **CA-SESS-43** · [E2d](#e2d) · Étant donné une session du worker en échec, quand la personne ouvre son détail, alors un bandeau en tête donne la raison de l'arrêt (budget atteint, nombre de tours atteint, limite de l'abonnement Claude atteinte, erreur de l'agent, interruption par toi, session coupée) et le fil reste entier jusqu'à la ligne d'arrêt.
- **CA-SESS-44** · [E2d](#e2d) · Étant donné un refus de sortie réseau pendant la session, quand la personne lit le fil, alors il est signalé à l'heure où il s'est produit avec un lien vers la liste des domaines autorisés ([E11b](contexte.md#e11b)).
- **CA-SESS-45** · [E2d](#e2d) · Étant donné une session du worker en échec, quand la personne clique sur « Voir la tâche », alors la tâche T-9 ([E13b](taches.md#e13b)) s'ouvre ; une session interactive en échec n'a pas ce bouton et n'a que « Copier la reprise ».
- **CA-SESS-46** · [E2d](#e2d) · Étant donné une session en échec que Claude Code n'a pas encore effacée, quand la personne clique sur « Copier la reprise », alors la commande de reprise est copiée ; une session effacée par Claude Code ne se reprend plus (RF-SESS-09, RF-SESS-10).

### <a id="e3-historique"></a>E3 · Historique

- **CA-SESS-47** · [E3a](#e3a) · Étant donné la liste de l'historique, quand la personne tape un mot du titre, d'un message ou d'une commande, alors la liste se filtre pendant la frappe, et le raccourci « / » place le curseur dans le champ de recherche.
- **CA-SESS-48** · [E3a](#e3a) · Étant donné plusieurs filtres en puces (période, dépôt, profil, état), quand la personne les pose, alors ils se cumulent et se retirent un par un.
- **CA-SESS-49** · [E3a](#e3a) · Étant donné la liste, quand la personne la parcourt, alors les jours se suivent du plus récent au plus ancien, chacun avec son total (nombre de sessions et coût estimé), et la liste se charge par jour au défilement (RF-SESS-05).
- **CA-SESS-50** · [E3a](#e3a) · Étant donné une session « En échec », quand la personne regarde sa ligne, alors la raison est visible sous le titre et au survol du badge, et la ligne ouvre [E2d](#e2d) ; une session toujours ouverte garde son état actuel.
- **CA-SESS-51** · [E3a](#e3a) · Étant donné une session plus vieille que la rétention de Claude Code, quand la personne la consulte, alors elle reste lisible mais sans reprise (RF-SESS-10).
- **CA-SESS-52** · [E3b](#e3b) · Étant donné l'onglet « Coûts », quand la personne l'ouvre, alors le total et la moyenne couvrent la période choisie, la moyenne ne comptant que les jours ouvrés, et tous les montants sont présentés comme des estimations (RF-SESS-05).
- **CA-SESS-53** · [E3b](#e3b) · Étant donné le graphique, quand la personne le lit, alors il montre une barre par jour ouvré empilée par dépôt, sur un axe de 0 à 8 $, avec aujourd'hui surligné et son total.
- **CA-SESS-54** · [E3b](#e3b) · Étant donné le graphique, quand la personne survole un jour, alors le coût et les sessions par dépôt de ce jour s'affichent.
- **CA-SESS-55** · [E3b](#e3b) · Étant donné le tableau « Par dépôt », quand la personne clique sur un dépôt, alors la liste [E3a](#e3a) s'ouvre déjà filtrée sur ce dépôt et sur la période ; le tableau se trie par colonne.

### <a id="e4-sources"></a>E4 · Sources

- **CA-SESS-56** · [E4a](#e4a) · Étant donné une source, quand la personne désactive son interrupteur, alors la lecture de ce dossier s'arrête, rien n'est effacé et les sessions déjà lues restent dans l'historique (RF-SESS-01).
- **CA-SESS-57** · [E4a](#e4a) · Étant donné une version de Claude Code qui change le format des sessions, quand Bosco ne sait plus le lire, alors la source passe « À mettre à jour » et ses nouvelles sessions ne sont plus lues.
- **CA-SESS-58** · [E4a](#e4a) · Étant donné un profil sans suivi en direct, quand la personne regarde sa ligne, alors « Installer » ouvre [E4b](#e4b) ; sinon « Vérifier le suivi en direct » y mène (RF-SESS-02, RF-SESS-03).
- **CA-SESS-59** · [E4a](#e4a) · Étant donné le seuil d'inactivité, quand la personne le règle, alors il vaut 15 minutes par défaut et se règle de 5 à 60 minutes (RF-SESS-02).
- **CA-SESS-60** · [E4a](#e4a) · Étant donné l'accès depuis le téléphone, quand la personne ouvre les sources pour la première fois, alors il est désactivé et l'activer ouvre [E4c](#e4c) ; un téléphone appairé se retire d'un clic (RF-SESS-07).
- **CA-SESS-61** · [E4a](#e4a) · Étant donné la notification du bureau, quand la personne regarde les réglages, alors elle est activée par défaut et désactivable (RF-SESS-08).
- **CA-SESS-62** · [E4b](#e4b) · Étant donné le panneau d'installation, quand la personne arrive à l'étape d'installation, alors une copie des réglages actuels du profil est cochée par défaut et l'étape montre les 6 événements suivis et le serveur Bosco ajouté au profil, rien n'étant installé sans clic.
- **CA-SESS-63** · [E4b](#e4b) · Étant donné une installation faite, quand la personne clique sur « Désinstaller », alors les réglages d'avant sont remis.
- **CA-SESS-64** · [E4b](#e4b) · Étant donné aucune session ouverte dans le profil, quand la personne arrive à la vérification, alors l'étape indique « Ouvre une session Claude Code dans ce profil pour terminer la vérification ».
- **CA-SESS-65** · [E4b](#e4b) · Étant donné la dernière étape terminée, quand la personne clique sur « Terminer », alors la vue d'ensemble [E1b](#e1b) s'ouvre et le bandeau « T'attend » propose « Autoriser » et « Refuser » (RF-SESS-03).
- **CA-SESS-66** · [E4c](#e4c) · Étant donné l'activation de l'accès depuis le téléphone, quand la fenêtre s'ouvre, alors elle donne l'adresse par copie ou par QR code et un code valable 5 minutes, à usage unique, avec 5 essais au plus (RF-SESS-07).
- **CA-SESS-67** · [E4c](#e4c) · Étant donné un code expiré ou dont les essais sont épuisés, quand la personne le saisit, alors il est refusé ; « Générer un nouveau code » en crée un autre et invalide l'ancien.
- **CA-SESS-68** · [E4c](#e4c) · Étant donné un téléphone qui saisit le bon code, quand l'appairage réussit, alors la fenêtre se ferme et le téléphone apparaît dans la liste de [E4a](#e4a) avec la date d'appairage ; le retirer coupe son accès aussitôt.
- **CA-SESS-69** · [E4c](#e4c) · Étant donné la fenêtre ouverte, quand la personne clique sur « Annuler », alors la fenêtre se ferme sans rien activer de plus.
- **CA-SESS-70** · [E4c](#e4c) · Étant donné un téléphone hors du réseau local, quand il tente de joindre le poste, alors il ne le joint pas, rien n'étant exposé sur Internet ; sur un téléphone appairé, « Autoriser » demande une confirmation (RF-SESS-07).
