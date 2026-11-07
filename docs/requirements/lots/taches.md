<!-- Généré par export.mjs (skill requirements-doc) depuis sources/30-specs.md : ne pas modifier ici. -->

# <a id="32-lot-2-taches"></a>3.2 Lot 2 · Tâches

## <a id="regles-fonctionnelles-du-lot"></a>Règles fonctionnelles du lot

- **RF-TACH-01** · **1. Une tâche a un dépôt, une consigne et un mode** : Worker (sans terminal, dans une copie jetable du dépôt, sur une branche dédiée rapatriée dans le dépôt à la fin) ou Ma session (elle attend qu'une session Claude Code interactive la prenne, dans le dépôt, sous tes yeux). Un lien de contexte (ticket, PR, décision) est facultatif.
- **RF-TACH-02** · **2. Une tâche a un seul état** : En file, Bloquée (attend ses préalables), En attente d'une session (mode Ma session), En cours, À relire, Validée, Rejetée, En échec, Annulée.
- **RF-TACH-03** · **3. Une tâche peut attendre d'autres tâches**, de n'importe quel dépôt : elle part quand **toutes** ses préalables sont validées. Une préalable en échec, rejetée sans relance ou annulée fait échouer celles qui l'attendent, en cascade. On ne peut pas attendre une tâche déjà en échec.
- **RF-TACH-04** · **4. Même dépôt : la suite part du travail précédent**. Si une seule préalable du même dépôt n'est pas encore fusionnée, la tâche part de sa branche ; s'il y en a plusieurs, elle attend leur fusion. Dans un autre dépôt, seul l'ordre compte.
- **RF-TACH-05** · **5. Les garde-fous se resserrent de haut en bas** : réglages généraux, puis dépôt, puis tâche. Une tâche peut restreindre les outils, le budget et le nombre de tours de son dépôt, jamais les dépasser. Le dépôt fixe aussi combien d'agents travaillent en même temps. Le worker ne lance une tâche que s'il lui reste une place et assez de mémoire. Ces garde-fous ne valent que pour le worker : en mode Ma session, ce sont les réglages de la session qui s'appliquent. Le budget est une estimation : il peut être légèrement dépassé avant l'arrêt.
- **RF-TACH-06** · **6. Rien n'est fusionné sans toi** : valider une tâche débloque les suivantes, mais Bosco ne fusionne jamais. Selon le réglage du dépôt, la validation peut aussi **pousser la branche et ouvrir une PR en brouillon** : Jamais (par défaut), Demander à chaque fois ou Toujours. Seule la branche de la tâche est poussée, jamais la branche principale, avec git et GitHub CLI du poste : l'ouverture de PR est réservée aux dépôts GitHub.
- **RF-TACH-07** · **7. Une tâche peut être annulée à tout moment** : le worker arrête l'agent en quelques secondes ; une session interactive est prévenue qu'elle doit s'arrêter.
- **RF-TACH-08** · **8. Une tâche se modifie tant qu'elle n'a pas démarré, et se relance après un échec** : la relance repart de sa branche ou de zéro, avec un budget revu si besoin. Annuler une tâche fait échouer celles qui l'attendent, après confirmation.

## <a id="e5"></a>E5 · File de tâches

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e5.html` · implémentation : **À développer**

### <a id="e5a"></a>E5a · File de tâches : vide

Premier usage, aucune tâche préparée. L'écran explique en une phrase à quoi servent les tâches et présente les deux façons de les confier à Claude Code, avant de proposer d'en créer une.

- **Depuis** l'entrée « Tâches » de la navigation, tant qu'aucune tâche n'existe
- **Ensuite** [E6a](#e6a) avec « Nouvelle tâche » · [E5b](#e5b) une fois la tâche créée

Règles de l'écran :

1. Deux modes pour confier une tâche (règle 1). Worker : un agent sans terminal travaille dans une copie jetable du dépôt, puis tu relis sa branche. Ma session : la tâche attend qu'une session Claude Code interactive la prenne, sous tes yeux.
2. Le mode Worker est grisé tant que Docker ou l'accès à l'abonnement Claude manque (règle 12 du lot 3). La carte renvoie alors vers l'isolation du worker pour le régler ([E11b](contexte.md#e11b)).
3. Une session Claude Code peut aussi créer une tâche. Elle apparaît dans la file avec la mention « créée par une session » et passe par les mêmes droits que les autres.
4. Tant qu'un dépôt n'a pas ses propres droits, les réglages généraux s'appliquent aux tâches qu'on y crée. Ce lien ouvre les droits des agents ([E8a](#e8a)).

**Mobile** : même état vide, les deux cartes sont empilées. Le bouton flottant « + » crée une tâche ([E6a](#e6a)).

### <a id="e5b"></a>E5b · File de tâches : avec dépendances

Tout le travail préparé pour Claude Code, du plus urgent au plus lointain : d'abord ce qui attend ta relecture, puis ce qui attend une session, puis ce qui est bloqué. L'enchaînement à droite montre pourquoi une tâche ne part pas encore.

- **Depuis** l'entrée « Tâches » de la navigation · [E5a](#e5a) après la première tâche
- **Ensuite** [E6a](#e6a) avec « Nouvelle tâche » · [E13a](#e13a) en ouvrant une ligne · [E7a](#e7a) avec « Relire » · [E5c](#e5c) si le worker est indisponible

Règles de l'écran :

1. Le worker fait travailler au plus 4 agents à la fois, tous dépôts confondus, et chaque dépôt peut fixer sa propre limite (1 pour api-voix, voir [E8a](#e8a)). Il lui faut aussi assez de mémoire libre ([E11a](contexte.md#e11a)). Une tâche prête mais sans place ou sans mémoire suffisante reste « En file », avec la raison, et part dès que c'est possible (règle 5).
2. « Attend » liste les tâches préalables avec leur état. Une tâche part quand toutes sont validées (règle 3). Si une préalable échoue, est rejetée sans relance ou est annulée, la tâche passe « En échec » avec le motif « Préalable T-… en échec », et celles qui l'attendent aussi.
3. L'enchaînement dessine les tâches actives liées entre elles. Au survol d'une tâche de la liste, sa chaîne se met en évidence. T-13 est dans le même dépôt que T-12 : elle partira de la branche de T-12 tant que celle-ci n'est pas fusionnée (règle 4). T-15 est dans un autre dépôt : seul l'ordre compte.
4. Une tâche « Ma session » attend qu'une session Claude Code la prenne : on demande dans la session « prends la prochaine tâche Bosco », dans le bon dépôt. La session reçoit la consigne et le contexte, signale ses étapes (visibles en direct ici), puis clôt la tâche, qui passe « À relire ». Deux sessions ne prennent jamais la même tâche.
5. Budget : dépensé sur prévu. Toute ligne ouvre le détail de la tâche ([E13a](#e13a)) ; « Relire » ouvre directement sa revue ([E7a](#e7a)). La même tâche apparaît dans la vue d'ensemble comme une session du profil worker « À relire » ([E2c](sessions.md#e2c)). Tri de la liste : à relire, en attente d'une session, en cours, en file, bloquées ; puis la plus ancienne en premier.

**Mobile** : la liste devient des cartes dans le même ordre ; l'enchaînement est remplacé par les puces « Attend » sur chaque carte. Le bouton flottant crée une tâche ([E6a](#e6a)). Une tâche « Ma session » ne peut pas être prise depuis le téléphone, d'où la mention « À prendre depuis Claude Code sur le poste ».

### <a id="e5c"></a>E5c · File de tâches : worker indisponible

Docker ne répond plus : le worker ne peut pas lancer d'agent. L'écran le dit clairement, rassure sur ce qui n'est pas perdu et laisse utilisable tout ce qui ne dépend pas du worker.

- **Depuis** [E5b](#e5b) quand Docker s'arrête de répondre
- **Ensuite** [E5b](#e5b) dès que Docker répond de nouveau · [E13b](#e13b) pour une tâche en échec

Règles de l'écran :

1. Aucune tâche n'échoue parce que Docker est indisponible : les tâches du worker restent en file ou bloquées, avec la raison « Worker indisponible », et rien n'est perdu. L'indicateur du haut passe en rouge. Le même état s'applique si l'accès à l'abonnement Claude manque (règle 12 du lot 3) : les tâches du worker attendent, avec la même raison.
2. Bosco revérifie seul : dès que Docker répond, le bandeau disparaît et les tâches prêtes partent selon la place et la mémoire (règle 5). « Réessayer » force la vérification tout de suite.
3. Les tâches « Ma session » ne dépendent pas de Docker : elles se prennent depuis Claude Code comme d'habitude (T-14). « Relire » et « Valider » restent possibles aussi.
4. Une tâche en cours au moment de la coupure passe « En échec » (motif « Docker ne répond pas »). Elle apparaît dans l'onglet Échecs et se relance depuis son détail ([E13b](#e13b)), une fois Docker revenu.

**Mobile** : le même bandeau en tête de liste, avec « Réessayer » en 44 px, puis les cartes dans le même ordre. L'enchaînement n'existe pas sur mobile. Pas de pastille 4 : l'onglet Échecs n'est pas montré sur cette capture.

## <a id="e6"></a>E6 · Nouvelle tâche

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e6.html` · implémentation : **À développer**

### <a id="e6a"></a>E6a · Nouvelle tâche : formulaire

Le formulaire pour préparer du travail à Claude Code : où, quoi, comment, après quoi, et dans quelles limites. Le récapitulatif de droite annonce quand la tâche partira et ce qu'elle coûtera au plus, avant de la créer. Les valeurs montrent la tâche T-16.

- **Depuis** [E5b](#e5b) ou [E5a](#e5a) avec « Nouvelle tâche »
- **Ensuite** [E5b](#e5b) avec « Créer la tâche » · [E6b](#e6b) si le formulaire contient des erreurs

Règles de l'écran :

1. Les dépôts proposés sont ceux des sources surveillées. Le dossier de travail est facultatif : par défaut, la racine du dépôt.
2. Un mode par tâche (règle 1). Worker : sans terminal, dans une copie jetable du dépôt. Ma session : la tâche attend qu'une session Claude Code la prenne dans le dépôt.
3. Une tâche part quand toutes ses préalables sont validées, de n'importe quel dépôt (règle 3). Si une préalable du même dépôt n'est pas encore fusionnée, la tâche part de sa branche et le champ « Branche de départ » est grisé ; sinon elle part de la branche principale du dépôt (règle 4).
4. Les garde-fous sont plafonnés par les droits du dépôt : une tâche peut les resserrer, jamais les dépasser (règle 5). Modèle et effort sont hérités tant qu'on n'en choisit pas d'autres ; les outils sont ceux du dépôt, qu'on peut restreindre. Voir les droits dans [E8a](#e8a). Si le mode « Ma session » est choisi, le bloc Garde-fous disparaît, remplacé par « Les réglages de ta session s'appliquent. »
5. Le contexte (ticket, PR, décision) est facultatif : il est transmis à l'agent avec la consigne.
6. Pas de programmation à une heure donnée en V2 : la tâche part dès que ses conditions sont remplies. La programmation est écartée de cette version.

**Mobile** : le formulaire tient en une colonne dans un écran poussé. Le mode devient un sélecteur à deux segments ; le dossier (racine du dépôt) n'est pas affiché et la branche de départ est rappelée sous les préalables ; les garde-fous sont repliés derrière un résumé « 1,50 $ · 30 tours · Sonnet 5.5 ». Le bouton « Créer la tâche » est collé en bas, à 44 px de haut.

### <a id="e6b"></a>E6b · Nouvelle tâche : erreurs

Le même formulaire après un clic sur « Créer la tâche » avec trois erreurs : un budget au-dessus du plafond du dépôt, un outil que le dépôt n'autorise pas et une préalable déjà en échec. Chaque message dit quoi corriger et comment. Les valeurs sont celles de T-16, modifiées pour l'exemple.

- **Depuis** [E6a](#e6a) avec « Créer la tâche »
- **Ensuite** [E8a](#e8a) avec le lien vers les droits du dépôt · [E5b](#e5b) une fois les erreurs corrigées

Règles de l'écran :

1. Le bandeau récapitule les erreurs, chaque point renvoie à son champ. Le focus se place sur le premier champ en erreur. « Créer la tâche » reste actif : il relance la vérification.
2. Budget plafonné par le dépôt (règle 5). Le message donne le plafond et les deux issues : corriger la valeur ou relever le plafond dans les droits du dépôt.
3. Un outil hors des droits du dépôt est refusé (règle 5) : le message cite ce que le dépôt autorise.
4. On ne peut pas attendre une tâche déjà en échec (règle 3). Il faut la relancer ou retirer la préalable.
5. La vérification est refaite au lancement : si les droits du dépôt se sont resserrés depuis la création, le surplus est écarté et noté dans le journal de la tâche.

**Mobile** : le bandeau est en haut, chaque message sous son champ, le bouton « Créer la tâche » collé en bas. Le formulaire est défilé jusqu'aux erreurs, les garde-fous sont dépliés et le bandeau reste en haut.

## <a id="e7"></a>E7 · Revue d'une tâche

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e7.html` · implémentation : **À développer**

### <a id="e7a"></a>E7a · Revue d'une tâche : à relire

Une tâche du worker est terminée : l'écran sert à juger son travail avant de la valider. La consigne et le compte rendu de l'agent se lisent côte à côte, suivis des fichiers modifiés, du diff et des tests. À droite : ce que la tâche a consommé, les droits qui ont été appliqués et ce que la validation débloque.

- **Depuis** [E5b](#e5b) avec « Relire » · [E2c](sessions.md#e2c)
- **Ensuite** [E7b](#e7b) avec « Rejeter » · [E7c](#e7c) après « Valider » (dépôt réglé sur « Demander à chaque fois »), sinon [E5b](#e5b)

Règles de l'écran :

1. La consigne (repliée sur deux lignes) et le compte rendu de l'agent sont côte à côte, pour juger l'écart entre ce qui était demandé et ce qui a été fait. Le point « À vérifier » de l'agent est en gras. Le résultat des tests est celui que l'agent déclare : Bosco ne relance pas les tests.
2. Le diff est calculé depuis le point de départ de la branche : lignes ajoutées en vert, retirées en rouge. Les blocs suivants se lisent en défilant. La déclaration de l'agent sur les tests figure juste dessous.
3. La consommation est rapportée au budget et au nombre de tours prévus (règle 5). Le coût est une estimation au tarif public.
4. Valider débloque les tâches suivantes (règle 3) : T-13 part tout de suite, sur la branche de T-12 (règle 4) ; T-15 attend encore T-14. Une fois la tâche validée, sa session passe « Terminée ».
5. Bosco ne fusionne jamais (règle 6). Selon le réglage du dépôt ([E8a](#e8a)), la validation peut pousser la branche et ouvrir une PR en brouillon : ici « Demander à chaque fois », donc « Valider » ouvre la confirmation [E7c](#e7c). La commande de fusion reste à copier pour fusionner soi-même. « Voir la session » mène au détail de la session correspondante ([E2c](sessions.md#e2c)).
6. « Rejeter » ouvre la fenêtre de rejet avec un motif ([E7b](#e7b)). « Liens » ouvre les liens de la tâche ([E10b](contexte.md#e10b)) ; sur mobile, depuis le menu de l'en-tête.

**Mobile** : écran poussé avec trois onglets (Résumé, Modifications, Après). Le résumé réunit consigne, compte rendu, tests et consommation ; la fusion se trouve dans l'onglet Après. « Rejeter » et « Valider » restent dans la barre du bas, sous le pouce.

### <a id="e7b"></a>E7b · Revue d'une tâche : rejet avec motif

Une fenêtre au-dessus de la revue demande pourquoi la tâche est rejetée. Le motif est transmis à l'agent ; par défaut, la tâche repart avec ce motif en consigne complémentaire. Décocher la relance rejette la tâche pour de bon, avec ses conséquences sur les suivantes.

- **Depuis** [E7a](#e7a) avec « Rejeter »
- **Ensuite** [E5b](#e5b) avec « Rejeter et relancer » · [E7a](#e7a) avec « Annuler »

Règles de l'écran :

1. Le motif est obligatoire : sans lui, le bouton reste inactif. Il est transmis à l'agent et gardé dans le journal de la tâche.
2. La relance est cochée par défaut : le motif s'ajoute à la consigne et la tâche repart sur la même branche. Décochée, la tâche est rejetée pour de bon (règle 3).
3. Sans relance, la tâche passe « Rejetée » et celles qui l'attendent échouent en cascade (règle 3). L'encadré le dit avant le clic ; il reste visible même quand la case est cochée.
4. La relance crée une nouvelle session du profil worker, visible dans la vue d'ensemble ([E1b](sessions.md#e1b)), sur la même branche. Avec la case décochée, le bouton devient « Rejeter » et la tâche sort de la liste des tâches actives.

**Mobile** : la fenêtre devient une feuille qui monte du bas, au-dessus de la revue ; les boutons font 44 px de haut et sont empilés, l'action principale en premier.

### <a id="e7c"></a>E7c · Revue d'une tâche : valider et ouvrir une PR brouillon

Le dépôt api-voix est réglé sur « Demander à chaque fois » : avant de valider, Bosco montre exactement ce qu'il va pousser et la PR qu'il va ouvrir, en brouillon. On peut aussi valider sans rien pousser.

- **Depuis** [E7a](#e7a) avec « Valider »
- **Ensuite** [E5b](#e5b) une fois validée, avec ou sans PR · [E7a](#e7a) avec « Annuler »

Règles de l'écran :

1. Cette question n'apparaît que si le dépôt est réglé sur « Demander à chaque fois » ([E8a](#e8a), règle 6). Réglé sur « Jamais » (par défaut), « Valider » valide sans question et sans rien pousser. Réglé sur « Toujours », « Valider » pousse et ouvre la PR directement, puis un message bref donne le lien.
2. Seule la branche de la tâche est poussée, jamais la branche principale, et la PR est toujours ouverte en brouillon vers la branche de départ de la tâche (ici develop).
3. Titre et description sont préremplis avec le titre de la tâche et le compte rendu de l'agent ; on peut les modifier avant d'envoyer. Sur mobile, seul le titre se modifie.
4. Bosco pousse avec git et GitHub CLI de ce poste : aucun jeton n'est demandé ni conservé. Si GitHub CLI n'est pas connecté ou si le dépôt n'est pas sur GitHub, seule « Valider sans pousser » reste proposée. Si l'envoi échoue (droits, branche déjà existante, réseau), la tâche reste validée, un message explique la cause et propose « Réessayer ».
5. Après l'envoi, le lien de la PR s'ajoute à la tâche (revue, file, historique) et à la session correspondante. « Valider sans pousser » valide seulement : la branche reste locale, la commande de fusion est toujours disponible dans la revue.

**Mobile** : feuille en bas de l'écran, les trois actions empilées en 44 px. Pas de pastille 2 ni 4 sur mobile : la branche et la destination sont résumées sur une ligne, et la règle d'accès est la même.

## <a id="e8"></a>E8 · Droits des agents

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e8.html` · implémentation : **À développer**

### <a id="e8a"></a>E8a · Droits des agents d'un dépôt

Ce qu'un agent peut faire dans un dépôt, ligne par ligne : la valeur générale, celle du dépôt et celle qui s'applique vraiment, avec son origine. On y modifie une valeur du dépôt ou on revient au général.

- **Depuis** [E5a](#e5a) · [E6a](#e6a) · [E6b](#e6b) · [E7a](#e7a)
- **Ensuite** [E6b](#e6b) après « Modifier » le budget

Règles de l'écran :

1. Les droits se resserrent de haut en bas : réglages généraux, puis dépôt, puis tâche (règle 5). Une tâche peut restreindre les outils, le budget et le nombre de tours de son dépôt, jamais les dépasser. Le dépôt fixe aussi combien d'agents travaillent en même temps. Le sélecteur de dépôt propose aussi « Réglages généraux », qui règle la colonne Général.
2. La colonne « Effectif » donne la valeur qui s'applique et son origine : « dépôt », « général » ou « général + dépôt » pour les interdits, qui s'additionnent. Une valeur sans réglage propre au dépôt s'affiche « hérité » en gris.
3. « Modifier » change la valeur du dépôt. « Revenir au général » supprime la valeur propre au dépôt, qui reprend alors celle des réglages généraux ; il n'apparaît que si le dépôt a sa propre valeur. « Modifier » sur le budget est le point d'arrivée depuis [E6b](#e6b).
4. Ces réglages sont réservés à l'humain : une session ou un agent ne peut ni les lire ni les changer pour s'accorder plus de droits. Les interdits déjà écrits dans les réglages Claude Code du dépôt s'appliquent aussi.
5. Quand les droits se resserrent, ils s'appliquent au lancement des tâches déjà créées : le surplus est écarté et noté dans leur journal ([E6b](#e6b)).
6. Sur mobile, les droits se lisent mais ne se modifient pas.
7. « PR brouillon à la validation » a trois valeurs : **Jamais** (réglage général par défaut), **Demander à chaque fois** (confirmation à chaque validation, [E7c](#e7c)) et **Toujours** (la validation pousse et ouvre la PR sans question). Seule la branche de la tâche est poussée, toujours en brouillon (règle 6). Ce réglage est réservé aux dépôts GitHub.

**Mobile** : écran poussé en lecture seule. Le tableau devient une liste de réglages : valeur effective, origine, et valeur générale pour comparer. Aucun bouton de modification ; la mention « Modifiable depuis le poste » l'explique.

## <a id="e13"></a>E13 · Détail d'une tâche

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `taches/e13.html` · implémentation : **À développer**

### <a id="e13a"></a>E13a · Détail d'une tâche : bloquée

Une tâche qui n'a pas encore démarré : on voit ce qu'elle doit faire, ce qu'elle attend et de quelle branche elle partira. Tant qu'elle n'a pas démarré, on peut la modifier ou l'annuler.

- **Depuis** [E5b](#e5b) en ouvrant une ligne
- **Ensuite** [E13c](#e13c) avec « Annuler la tâche » · [E6a](#e6a) avec « Modifier » · [E7a](#e7a) avec « Voir T-12 »

Règles de l'écran :

1. Le même écran sert à toutes les tâches qui n'ont pas fini : En file, Bloquée, En attente d'une session et En cours. Pour une tâche en cours, l'en-tête donne le lien vers la session et le fil en direct. Une fois la tâche à relire, l'écran de référence est la revue ([E7a](#e7a)).
2. « Elle attend » liste les tâches préalables avec leur état : une tâche part quand toutes sont validées (règle 3). T-13 est dans le même dépôt que T-12 : elle partira de sa branche, et T-15, qui l'attend à son tour, viendra ensuite (règle 4). « Voir T-12 » ouvre sa revue.
3. « Modifier » ouvre le formulaire de la tâche prérempli ([E6a](#e6a)) tant qu'elle n'a pas démarré (règle 8). Une fois démarrée, le bouton disparaît ; il reste l'annulation.
4. Le journal de la tâche garde chaque changement d'état avec son heure : création, attente, départ, relances, échec, validation. Il ne se vide jamais, même après une relance.
5. « Annuler la tâche » ouvre la confirmation ([E13c](#e13c)) : T-15 attend T-13 et passerait En échec (règle 7).

**Mobile** : écran poussé, les cartes s'empilent dans le même ordre ; les garde-fous tiennent sur une ligne. « Modifier » et « Annuler la tâche » restent dans la barre du bas, sous le pouce.

### <a id="e13b"></a>E13b · Détail d'une tâche : en échec et relance

Une tâche du worker s'est arrêtée avant la fin. L'écran dit pourquoi, montre ce qui reste (la branche) et propose de la relancer avec un budget revu et, si besoin, une consigne en plus.

- **Depuis** [E5b](#e5b) (onglet Échecs) · [E2d](sessions.md#e2d) avec « Voir la tâche »
- **Ensuite** [E5b](#e5b) avec « Relancer la tâche » · [E2d](sessions.md#e2d) avec « Voir la session »

Règles de l'écran :

1. La cause est dite en toutes lettres : budget atteint, nombre de tours dépassé, erreur de l'agent, interruption ou session coupée. « Voir la session » ouvre le fil complet ([E2d](sessions.md#e2d)).
2. Repartir de la branche garde le travail déjà fait (proposé par défaut tant que la branche existe) ; repartir de zéro reprend une copie propre du dépôt, au point de départ de la tâche.
3. Le budget proposé est revu à la hausse, dans les limites du dépôt (règle 5) : au-delà de 2,00 $, le champ est refusé avec un message sous le champ. Le nombre de tours se règle de la même façon dans le formulaire de la tâche ([E6a](#e6a)). Le budget est une estimation : il peut être légèrement dépassé.
4. Relancer ne crée pas de nouvelle tâche : T-9 repasse « En file », avec le même numéro, et le journal garde l'échec (règle 8). Elle part dès qu'une place et assez de mémoire sont libres.
5. Si des tâches attendaient celle-ci et ont échoué en cascade (règle 3), elles se relancent avec elle et redeviennent « Bloquées ».

**Mobile** : écran poussé ; le formulaire de relance remplace la colonne de droite, et « Relancer la tâche » reste dans la barre du bas. La consommation et le journal se consultent depuis la session (pas de pastille 5 ici : la cascade est signalée par un message après la relance).

### <a id="e13c"></a>E13c · Détail d'une tâche : annulation

Annuler une tâche dont d'autres dépendent a un effet en cascade : la confirmation le dit avant de le faire. Une tâche que personne n'attend s'annule directement.

- **Depuis** [E13a](#e13a) avec « Annuler la tâche »
- **Ensuite** [E5b](#e5b) une fois annulée (onglet Terminées) · [E13a](#e13a) avec « Garder la tâche »

Règles de l'écran :

1. Annuler une tâche fait échouer en cascade celles qui l'attendent, avec le motif « Préalable T-13 annulée » (règle 3). L'encadré les nomme avant que tu confirmes.
2. La confirmation n'apparaît que si des tâches attendent celle-ci. Sinon l'annulation est directe, suivie d'un message bref avec « Annuler l'annulation » pendant quelques secondes (règle 8).
3. Une tâche déjà démarrée dans le worker : l'agent s'arrête en quelques secondes et la branche reste disponible pour la relire ou la reprendre (règle 7).
4. Une tâche prise par une session interactive : la session est prévenue à sa prochaine étape qu'elle doit s'arrêter (règle 7). Elle n'est pas coupée de force.
5. La tâche passe « Annulée » et rejoint l'onglet Terminées de la file ([E5b](#e5b)), barrée. Le journal garde l'annulation et son motif.

**Mobile** : feuille en bas de l'écran, boutons empilés en 44 px. Les deux cas d'une tâche déjà démarrée sont résumés en une phrase, donc pas de pastille 4.

## <a id="criteres-dacceptation"></a>Critères d'acceptation

### <a id="e5-file-de-taches"></a>E5 · File de tâches

- **CA-TACH-01** · [E5a](#e5a) · Étant donné qu'aucune tâche n'existe, quand la personne ouvre l'entrée « Tâches » de la navigation, alors l'écran explique en une phrase à quoi servent les tâches, présente les deux modes Worker et Ma session et propose « Nouvelle tâche » (RF-TACH-01).
- **CA-TACH-02** · [E5a](#e5a) · Étant donné que Docker ou l'accès à l'abonnement Claude manque, quand la personne consulte les deux modes, alors le mode Worker est grisé et la carte renvoie vers l'isolation du worker pour le régler.
- **CA-TACH-03** · [E5a](#e5a) · Étant donné qu'une session Claude Code crée une tâche, quand la personne consulte la file, alors la tâche apparaît avec la mention « créée par une session » et passe par les mêmes droits que les autres.
- **CA-TACH-04** · [E5a](#e5a) · Étant donné un dépôt qui n'a pas ses propres droits, quand une tâche y est créée, alors les réglages généraux s'appliquent et un lien ouvre les droits des agents (RF-TACH-05).
- **CA-TACH-05** · [E5b](#e5b) · Étant donné plusieurs tâches dans des états différents, quand la personne ouvre la file, alors elles sont triées ainsi : à relire, en attente d'une session, en cours, en file, bloquées, puis la plus ancienne en premier.
- **CA-TACH-06** · [E5b](#e5b) · Étant donné 4 agents déjà au travail, tous dépôts confondus, ou une mémoire libre insuffisante, quand une tâche est prête, alors elle reste « En file » avec la raison et part dès qu'une place et assez de mémoire se libèrent (RF-TACH-05).
- **CA-TACH-07** · [E5b](#e5b) · Étant donné un dépôt qui fixe sa propre limite d'agents simultanés (1 pour api-voix), quand une tâche de ce dépôt est prête alors qu'un agent y travaille déjà, alors elle attend une place (RF-TACH-05).
- **CA-TACH-08** · [E5b](#e5b) · Étant donné une tâche qui attend d'autres tâches, quand la personne lit « Attend », alors chaque préalable est listée avec son état et la tâche ne part que lorsque toutes sont validées (RF-TACH-03).
- **CA-TACH-09** · [E5b](#e5b) · Étant donné une préalable en échec, rejetée sans relance ou annulée, quand la file est affichée, alors la tâche qui l'attend est « En échec » avec le motif « Préalable T-… en échec », et celles qui l'attendent aussi (RF-TACH-03).
- **CA-TACH-10** · [E5b](#e5b) · Étant donné une tâche du même dépôt que sa préalable non fusionnée, quand la personne survole la tâche, alors sa chaîne est mise en évidence dans l'enchaînement et la tâche partira de la branche de la préalable, alors que pour une préalable d'un autre dépôt seul l'ordre compte (RF-TACH-04).
- **CA-TACH-11** · [E5b](#e5b) · Étant donné une tâche « Ma session » en attente, quand la personne demande dans une session Claude Code, dans le bon dépôt, « prends la prochaine tâche Bosco », alors la session reçoit la consigne et le contexte, ses étapes sont visibles en direct, la tâche passe « À relire » à sa clôture, et deux sessions ne prennent jamais la même tâche (RF-TACH-01).
- **CA-TACH-12** · [E5b](#e5b) · Étant donné une tâche « Ma session » sur mobile, quand la personne l'affiche, alors la mention « À prendre depuis Claude Code sur le poste » est visible et la tâche ne peut pas être prise depuis le téléphone.
- **CA-TACH-13** · [E5b](#e5b) · Étant donné une tâche à relire, quand la personne clique sur « Relire », alors la revue de la tâche s'ouvre directement ; un clic sur toute autre ligne ouvre le détail de la tâche.
- **CA-TACH-14** · [E5c](#e5c) · Étant donné que Docker ne répond plus, quand la personne ouvre la file, alors un bandeau le dit, l'indicateur du haut est rouge et les tâches du worker restent en file ou bloquées avec la raison « Worker indisponible », sans rien perdre.
- **CA-TACH-15** · [E5c](#e5c) · Étant donné que l'accès à l'abonnement Claude manque, quand la personne ouvre la file, alors les tâches du worker attendent avec la même raison « Worker indisponible ».
- **CA-TACH-16** · [E5c](#e5c) · Étant donné le bandeau « Worker indisponible », quand Docker répond de nouveau ou que la personne clique sur « Réessayer », alors le bandeau disparaît et les tâches prêtes partent selon la place et la mémoire (RF-TACH-05).
- **CA-TACH-17** · [E5c](#e5c) · Étant donné que Docker est indisponible, quand la personne utilise les tâches « Ma session », « Relire » et « Valider », alors ces actions restent possibles.
- **CA-TACH-18** · [E5c](#e5c) · Étant donné une tâche en cours au moment de la coupure de Docker, quand la personne ouvre la file, alors la tâche est « En échec » avec le motif « Docker ne répond pas », visible dans l'onglet Échecs, et se relance depuis son détail une fois Docker revenu.

### <a id="e6-nouvelle-tache"></a>E6 · Nouvelle tâche

- **CA-TACH-19** · [E6a](#e6a) · Étant donné le formulaire de nouvelle tâche, quand la personne choisit le dépôt, alors seuls les dépôts des sources surveillées sont proposés et le dossier de travail, facultatif, vaut par défaut la racine du dépôt.
- **CA-TACH-20** · [E6a](#e6a) · Étant donné le formulaire, quand la personne choisit un mode, alors elle ne peut en choisir qu'un par tâche : Worker (sans terminal, dans une copie jetable du dépôt) ou Ma session (la tâche attend qu'une session Claude Code la prenne) (RF-TACH-01).
- **CA-TACH-21** · [E6a](#e6a) · Étant donné une préalable du même dépôt pas encore fusionnée, quand la personne la sélectionne, alors la tâche partira de sa branche et le champ « Branche de départ » est grisé ; sans telle préalable, la tâche part de la branche principale du dépôt (RF-TACH-04).
- **CA-TACH-22** · [E6a](#e6a) · Étant donné des préalables de n'importe quel dépôt, quand la personne les sélectionne, alors la tâche partira quand toutes seront validées (RF-TACH-03).
- **CA-TACH-23** · [E6a](#e6a) · Étant donné le mode Worker, quand la personne règle les garde-fous, alors elle peut restreindre les outils, le budget et le nombre de tours du dépôt sans les dépasser, et le modèle et l'effort sont hérités tant qu'elle n'en choisit pas d'autres (RF-TACH-05).
- **CA-TACH-24** · [E6a](#e6a) · Étant donné le mode « Ma session » choisi, quand la personne regarde le formulaire, alors le bloc Garde-fous disparaît, remplacé par « Les réglages de ta session s'appliquent. » (RF-TACH-05).
- **CA-TACH-25** · [E6a](#e6a) · Étant donné un lien de contexte (ticket, PR, décision) renseigné, quand la tâche part, alors il est transmis à l'agent avec la consigne ; il reste facultatif (RF-TACH-01).
- **CA-TACH-26** · [E6a](#e6a) · Étant donné le formulaire, quand la personne cherche à programmer une heure de départ, alors aucune programmation n'est proposée et la tâche part dès que ses conditions sont remplies.
- **CA-TACH-27** · [E6b](#e6b) · Étant donné un budget au-dessus du plafond du dépôt, quand la personne clique sur « Créer la tâche », alors le message donne le plafond et les deux issues : corriger la valeur ou relever le plafond dans les droits du dépôt (RF-TACH-05).
- **CA-TACH-28** · [E6b](#e6b) · Étant donné un outil que le dépôt n'autorise pas, quand la personne clique sur « Créer la tâche », alors l'outil est refusé et le message cite ce que le dépôt autorise (RF-TACH-05).
- **CA-TACH-29** · [E6b](#e6b) · Étant donné une préalable déjà en échec, quand la personne clique sur « Créer la tâche », alors le message demande de la relancer ou de retirer la préalable (RF-TACH-03).
- **CA-TACH-30** · [E6b](#e6b) · Étant donné un formulaire avec des erreurs, quand la personne clique sur « Créer la tâche », alors un bandeau récapitule les erreurs avec un renvoi vers chaque champ, le focus se place sur le premier champ en erreur et « Créer la tâche » reste actif pour relancer la vérification.
- **CA-TACH-31** · [E6b](#e6b) · Étant donné des droits du dépôt resserrés depuis la création de la tâche, quand elle se lance, alors le surplus est écarté et noté dans le journal de la tâche.

### <a id="e7-revue-dune-tache"></a>E7 · Revue d'une tâche

- **CA-TACH-32** · [E7a](#e7a) · Étant donné une tâche du worker à relire, quand la personne ouvre la revue, alors la consigne (repliée sur deux lignes) et le compte rendu de l'agent sont côte à côte, le point « À vérifier » est en gras, suivis des fichiers modifiés, du diff et des tests.
- **CA-TACH-33** · [E7a](#e7a) · Étant donné le diff, quand la personne le lit, alors il est calculé depuis le point de départ de la branche, avec les lignes ajoutées en vert et retirées en rouge, et le résultat des tests est celui que l'agent déclare : Bosco ne relance pas les tests.
- **CA-TACH-34** · [E7a](#e7a) · Étant donné la colonne de droite, quand la personne la lit, alors la consommation est rapportée au budget et au nombre de tours prévus, et le coût est une estimation au tarif public (RF-TACH-05).
- **CA-TACH-35** · [E7a](#e7a) · Étant donné une tâche à relire dont d'autres tâches dépendent, quand la personne la valide, alors les tâches suivantes sont débloquées (T-13 part tout de suite sur la branche de T-12, T-15 attend encore T-14) et la session de la tâche passe « Terminée » (RF-TACH-03, RF-TACH-04, RF-TACH-06).
- **CA-TACH-36** · [E7a](#e7a) · Étant donné un dépôt réglé sur « Jamais », quand la personne clique sur « Valider », alors la tâche est validée sans question et rien n'est poussé ; Bosco ne fusionne jamais et la commande de fusion reste à copier (RF-TACH-06).
- **CA-TACH-37** · [E7a](#e7a) · Étant donné un dépôt réglé sur « Demander à chaque fois », quand la personne clique sur « Valider », alors la confirmation de validation s'ouvre (RF-TACH-06).
- **CA-TACH-38** · [E7a](#e7a) · Étant donné la revue, quand la personne clique sur « Rejeter », alors la fenêtre de rejet avec un motif s'ouvre ; « Voir la session » mène au détail de la session correspondante et « Liens » ouvre les liens de la tâche.
- **CA-TACH-39** · [E7b](#e7b) · Étant donné la fenêtre de rejet, quand le motif est vide, alors le bouton reste inactif ; une fois le motif saisi, il est transmis à l'agent et gardé dans le journal de la tâche.
- **CA-TACH-40** · [E7b](#e7b) · Étant donné la case de relance cochée par défaut, quand la personne clique sur « Rejeter et relancer », alors le motif s'ajoute à la consigne, la tâche repart sur la même branche et une nouvelle session du profil worker apparaît dans la vue d'ensemble (RF-TACH-08).
- **CA-TACH-41** · [E7b](#e7b) · Étant donné la case de relance décochée, quand la personne clique sur « Rejeter », alors la tâche passe « Rejetée », sort de la liste des tâches actives et celles qui l'attendent échouent en cascade (RF-TACH-03).
- **CA-TACH-42** · [E7b](#e7b) · Étant donné la fenêtre de rejet, quand la personne la lit, alors l'encadré annonce la conséquence en cascade avant le clic, même quand la case est cochée.
- **CA-TACH-43** · [E7c](#e7c) · Étant donné le dépôt api-voix réglé sur « Demander à chaque fois », quand la personne clique sur « Valider », alors Bosco montre ce qu'il va pousser et la PR qu'il va ouvrir en brouillon, vers la branche de départ de la tâche (ici develop), et seule la branche de la tâche est poussée, jamais la branche principale (RF-TACH-06).
- **CA-TACH-44** · [E7c](#e7c) · Étant donné la confirmation de PR, quand la personne la lit, alors titre et description sont préremplis avec le titre de la tâche et le compte rendu de l'agent et peuvent être modifiés avant l'envoi ; sur mobile, seul le titre se modifie.
- **CA-TACH-45** · [E7c](#e7c) · Étant donné un dépôt réglé sur « Toujours », quand la personne clique sur « Valider », alors la branche est poussée et la PR en brouillon ouverte directement, puis un message bref donne le lien (RF-TACH-06).
- **CA-TACH-46** · [E7c](#e7c) · Étant donné que GitHub CLI n'est pas connecté ou que le dépôt n'est pas sur GitHub, quand la confirmation s'affiche, alors seule « Valider sans pousser » est proposée, et aucun jeton n'est demandé ni conservé (RF-TACH-06).
- **CA-TACH-47** · [E7c](#e7c) · Étant donné un échec de l'envoi (droits, branche déjà existante, réseau), quand la personne valide, alors la tâche reste validée, un message explique la cause et propose « Réessayer ».
- **CA-TACH-48** · [E7c](#e7c) · Étant donné une PR ouverte, quand la personne consulte la tâche, alors le lien de la PR figure dans la revue, la file, l'historique et la session correspondante ; avec « Valider sans pousser », la branche reste locale et la commande de fusion reste disponible dans la revue.

### <a id="e8-droits-des-agents"></a>E8 · Droits des agents

- **CA-TACH-49** · [E8a](#e8a) · Étant donné le sélecteur de dépôt, quand la personne choisit « Réglages généraux », alors elle règle la colonne Général ; pour un dépôt, chaque ligne montre la valeur générale, celle du dépôt et la valeur effective (RF-TACH-05).
- **CA-TACH-50** · [E8a](#e8a) · Étant donné la colonne « Effectif », quand la personne la lit, alors elle donne la valeur qui s'applique et son origine : « dépôt », « général » ou « général + dépôt » pour les interdits, qui s'additionnent ; une valeur sans réglage propre au dépôt s'affiche « hérité » en gris.
- **CA-TACH-51** · [E8a](#e8a) · Étant donné une valeur propre au dépôt, quand la personne clique sur « Revenir au général », alors cette valeur est supprimée et la valeur des réglages généraux s'applique ; le bouton n'apparaît que si le dépôt a sa propre valeur.
- **CA-TACH-52** · [E8a](#e8a) · Étant donné « PR brouillon à la validation », quand la personne règle le dépôt, alors elle choisit entre Jamais (réglage général par défaut), Demander à chaque fois et Toujours, réglage réservé aux dépôts GitHub (RF-TACH-06).
- **CA-TACH-53** · [E8a](#e8a) · Étant donné une session ou un agent, quand il tente de lire ou de changer ces réglages, alors il ne le peut pas, et les interdits écrits dans les réglages Claude Code du dépôt s'appliquent aussi.
- **CA-TACH-54** · [E8a](#e8a) · Étant donné des droits resserrés, quand une tâche déjà créée se lance, alors le surplus est écarté et noté dans son journal.
- **CA-TACH-55** · [E8a](#e8a) · Étant donné un mobile, quand la personne ouvre les droits d'un dépôt, alors ils sont en lecture seule, sans bouton de modification, avec la mention « Modifiable depuis le poste ».

### <a id="e13-detail-dune-tache"></a>E13 · Détail d'une tâche

- **CA-TACH-56** · [E13a](#e13a) · Étant donné une tâche En file, Bloquée, En attente d'une session ou En cours, quand la personne ouvre sa ligne, alors le même écran s'affiche ; pour une tâche en cours, l'en-tête donne le lien vers la session et le fil en direct (RF-TACH-02).
- **CA-TACH-57** · [E13a](#e13a) · Étant donné une tâche bloquée, quand la personne lit « Elle attend », alors les préalables sont listées avec leur état et « Voir T-12 » ouvre sa revue ; T-13, du même dépôt que T-12, partira de sa branche, et T-15 viendra ensuite (RF-TACH-03, RF-TACH-04).
- **CA-TACH-58** · [E13a](#e13a) · Étant donné une tâche qui n'a pas démarré, quand la personne clique sur « Modifier », alors le formulaire de la tâche s'ouvre prérempli ; une fois la tâche démarrée, le bouton disparaît et seule l'annulation reste (RF-TACH-08).
- **CA-TACH-59** · [E13a](#e13a) · Étant donné une tâche, quand la personne lit son journal, alors chaque changement d'état figure avec son heure (création, attente, départ, relances, échec, validation) et il ne se vide jamais, même après une relance.
- **CA-TACH-60** · [E13a](#e13a) · Étant donné une tâche que d'autres attendent (T-15 attend T-13), quand la personne clique sur « Annuler la tâche », alors la confirmation d'annulation s'ouvre (RF-TACH-07).
- **CA-TACH-61** · [E13b](#e13b) · Étant donné une tâche du worker en échec, quand la personne ouvre son détail, alors la cause est dite en toutes lettres (budget atteint, nombre de tours dépassé, erreur de l'agent, interruption ou session coupée) et « Voir la session » ouvre le fil complet.
- **CA-TACH-62** · [E13b](#e13b) · Étant donné une branche qui existe encore, quand la personne prépare la relance, alors « repartir de la branche » est proposé par défaut et garde le travail déjà fait ; « repartir de zéro » reprend une copie propre du dépôt au point de départ de la tâche (RF-TACH-08).
- **CA-TACH-63** · [E13b](#e13b) · Étant donné un budget de relance supérieur à 2,00 $, quand la personne le saisit, alors le champ est refusé avec un message sous le champ (RF-TACH-05).
- **CA-TACH-64** · [E13b](#e13b) · Étant donné une tâche en échec, quand la personne clique sur « Relancer la tâche », alors la même tâche (T-9) repasse « En file » sous le même numéro, le journal garde l'échec, et elle part dès qu'une place et assez de mémoire sont libres (RF-TACH-08).
- **CA-TACH-65** · [E13b](#e13b) · Étant donné des tâches échouées en cascade parce qu'elles attendaient cette tâche, quand la personne la relance, alors elles se relancent avec elle et redeviennent « Bloquées » (RF-TACH-03).
- **CA-TACH-66** · [E13c](#e13c) · Étant donné une tâche que d'autres attendent, quand la personne confirme l'annulation, alors les tâches qui l'attendent échouent en cascade avec le motif « Préalable T-13 annulée », nommées dans l'encadré avant la confirmation (RF-TACH-03, RF-TACH-08).
- **CA-TACH-67** · [E13c](#e13c) · Étant donné une tâche que personne n'attend, quand la personne clique sur « Annuler la tâche », alors l'annulation est directe, sans confirmation, suivie d'un message bref avec « Annuler l'annulation » pendant quelques secondes (RF-TACH-07).
- **CA-TACH-68** · [E13c](#e13c) · Étant donné une tâche déjà démarrée dans le worker, quand elle est annulée, alors l'agent s'arrête en quelques secondes et la branche reste disponible pour la relire ou la reprendre (RF-TACH-07).
- **CA-TACH-69** · [E13c](#e13c) · Étant donné une tâche prise par une session interactive, quand elle est annulée, alors la session est prévenue à sa prochaine étape qu'elle doit s'arrêter, sans être coupée de force (RF-TACH-07).
- **CA-TACH-70** · [E13c](#e13c) · Étant donné une tâche annulée, quand la personne ouvre la file, alors elle est « Annulée », barrée, dans l'onglet Terminées, et son journal garde l'annulation et son motif ; « Garder la tâche » ramène au détail sans rien changer.
