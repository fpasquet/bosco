<!-- Généré par export.mjs (skill requirements-doc) depuis sources/30-specs.md : ne pas modifier ici. -->

# <a id="33-lot-3-contexte-et-isolation"></a>3.3 Lot 3 · Contexte et isolation

## <a id="regles-fonctionnelles-du-lot"></a>Règles fonctionnelles du lot

- **RF-CONT-01** · **1. Chaque agent reçoit le contexte de son dépôt** au lancement, worker comme session : les décisions acceptées du dépôt, celles des socles qui s'y appliquent, sa place dans l'architecture et les liens de sa tâche. Les décisions seulement proposées ne sont pas transmises. Pour une session interactive, cela demande le suivi en direct, et le texte est limité à 10 000 caractères.
- **RF-CONT-02** · **2. Un agent propose, un humain décide** : un agent peut proposer une décision pendant son travail, jamais l'accepter, la modifier une fois acceptée ni changer un statut.
- **RF-CONT-03** · **3. Les socles s'empilent** : un socle global s'applique à tous les dépôts, un socle partagé à ceux qui l'héritent. Une décision du dépôt reliée par « fait exception à » retire la décision du socle pour ce seul dépôt.
- **RF-CONT-04** · **4. Tout lien est accepté** ; ceux de GitHub, Jira et Confluence sont reconnus et enrichis (titre, état, auteur), rafraîchis toutes les heures. Un lien est gardé même si ses informations ne peuvent pas être lues.
- **RF-CONT-05** · **5. Les accès aux intégrations restent dans Bosco** : ils ne sont jamais transmis aux agents.
- **RF-CONT-06** · **6. Une tâche du worker tourne isolée** : dans un conteneur jetable, avec sa copie du dépôt et un dossier personnel temporaire, supprimés à la fin ; seule la branche reste.
- **RF-CONT-07** · **7. La sortie réseau suit une liste blanche** : l'agent ne joint que les domaines autorisés ; chaque refus est visible.
- **RF-CONT-08** · **8. Les services de test sont jetables** : lancés pour une tâche sur un réseau privé sans Internet, avec des options de lancement sûres seulement, puis supprimés.
- **RF-CONT-09** · **9. Contexte, intégrations et isolation se règlent par toi seul** : aucune session ni aucun agent ne peut les modifier.
- **RF-CONT-10** · **10. Bosco garde les décisions** : elles s'y créent, s'y modifient et s'y acceptent, avec l'historique de chaque changement (auteur, date, note).
- **RF-CONT-11** · **11. Une décision acceptée se modifie avec une note, ou se remplace par une nouvelle** : ses versions précédentes restent lisibles, et le changement ne touche que les agents lancés ensuite.
- **RF-CONT-12** · **12. Le worker utilise l'abonnement Claude du poste** : ses tâches partagent les limites de cet abonnement avec tes sessions. Si la limite est atteinte, la tâche s'arrête et se relance ensuite.

## <a id="e9"></a>E9 · Contexte transmis aux agents

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e9.html` · implémentation : **À développer**

### <a id="e9a"></a>E9a · Contexte d'un dépôt

Tout ce que reçoit un agent au lancement dans un dépôt : les décisions acceptées du dépôt, celles des socles qui s'y appliquent et sa place dans l'architecture. Les décisions proposées par un agent attendent ta validation avant d'être transmises.

- **Depuis** l'entrée « Contexte » de la barre latérale (le compteur « 1 » indique une décision à valider)
- **Ensuite** [E9b](#e9b) avec « Examiner » · [E9c](#e9c) avec « Nouvelle décision » · [E9d](#e9d) en ouvrant une décision · [E9f](#e9f) avec « Aperçu du texte transmis » · [E14a](#e14a) avec « Gérer les socles »

Règles de l'écran :

1. Les décisions acceptées d'api-voix sont transmises à chaque agent au lancement, avec celles des socles et la place du dépôt dans l'architecture (règle 1). Une décision qui fait exception à celle d'un socle l'indique sous son titre. Ouvrir une ligne affiche la décision, ses versions et ses liens ([E9d](#e9d)).
2. Les socles s'empilent : le socle commun (global) s'applique à tous les dépôts, le socle Node.js (partagé) à ceux qui l'héritent. Une décision du dépôt reliée par « fait exception à » retire celle du socle pour ce dépôt seul : elle reste visible, barrée et marquée « Écartée », mais n'est pas transmise (règle 3). « Gérer les socles » ouvre la liste des socles et de leurs dépôts ([E14a](#e14a)).
3. Une décision seulement proposée n'est pas transmise : un agent propose, un humain décide (règle 2). Le bandeau n'apparaît que s'il y a des décisions à valider ; son compteur est repris sur l'entrée « Contexte » de la barre latérale. « Examiner » ouvre la décision ([E9b](#e9b)).
4. L'architecture dit ce que le dépôt appelle et qui l'appelle, pour que l'agent mesure l'effet de ses changements sur les autres dépôts.
5. « Aperçu du texte transmis » montre exactement le texte que lira l'agent au prochain lancement, décisions écartées et proposées exclues ([E9f](#e9f)). Les liens propres à une tâche s'y ajoutent au lancement ([E10b](#e10b)).
6. Les décisions sont gérées dans Bosco : « Nouvelle décision » ouvre [E9c](#e9c), et chaque changement garde son auteur et sa date (règle 10). Cet écran se règle par toi seul, aucune session ni aucun agent ne peut le modifier (règle 9).

**Mobile** : écran poussé depuis l'onglet Sources (Contexte et Réglages s'y ouvrent). Le bandeau de la décision à valider passe en tête ; chaque bloc est repliable, seul le premier est ouvert. Pas d'infobulle ni de colonne « Utilisé par » : les tâches concernées se retrouvent depuis la file.

### <a id="e9b"></a>E9b · Décision proposée par un agent, à valider

Une décision écrite par l'agent de T-12 pendant son travail. Elle n'est transmise à personne tant que tu ne l'as pas acceptée, modifiée ou refusée.

- **Depuis** [E9a](#e9a) avec « Examiner »
- **Ensuite** [E9a](#e9a) une fois acceptée ou refusée · [Lot 1 · E2a](sessions.md#e2a) avec le lien vers la session

Règles de l'écran :

1. Seul un humain accepte : l'agent propose, il ne peut ni accepter sa décision, ni la modifier une fois acceptée (règle 2). « Accepter » enregistre la décision comme acceptée et ramène au contexte du dépôt ([E9a](#e9a)), où le bandeau disparaît.
2. La décision garde le format habituel des décisions : contexte, décision, conséquences, alternatives écartées. « Modifier avant d'accepter » rouvre ces champs ; la version acceptée est celle que tu as relue.
3. Une fois acceptée, la décision est transmise au lancement des prochains agents d'api-voix, les tâches pas encore lancées comprises (ici T-13). Les agents déjà en cours ne la reçoivent pas (règle 1).
4. « Refuser » (avec un motif facultatif) passe la décision à « Refusée » : elle n'est jamais transmise et l'agent n'est pas relancé. Le motif est conservé avec la décision.
5. La décision est gardée dans Bosco avec son historique : auteur (l'agent de T-12), date de proposition, puis ta validation. Bosco ne garde pas de copie à part.

**Mobile** : écran poussé, sections repliables (Contexte et Décision ouvertes), barre basse « Refuser » / « Accepter » en 44 px. « Modifier avant d'accepter » et le motif de refus se font sur le poste.

### <a id="e9c"></a>E9c · Nouvelle décision

Bosco est le seul endroit où vivent les décisions : on les écrit ici, pour un dépôt ou pour un socle. Une décision acceptée part dans le contexte des prochains agents.

- **Depuis** [E9a](#e9a) avec « Nouvelle décision »
- **Ensuite** [E9a](#e9a) après « Accepter la décision » ou « Garder en proposition »

Règles de l'écran :

1. Une décision porte sur un dépôt ou sur un socle. Sur un socle, elle s'applique à tous les dépôts concernés (règle 3).
2. Même format que les décisions proposées par un agent ([E9b](#e9b)). Titre, contexte et décision sont obligatoires.
3. « Fait exception à » retire la décision choisie du socle pour ce seul dépôt, sans la changer ailleurs (règle 3). Le champ n'apparaît que pour une décision de dépôt.
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
4. Les relations montrent ce qui touche la décision : DEC-6, proposée par un agent, la précise ; T-12 l'a reçue à son lancement ; T-13 la recevra. Un clic ouvre l'élément lié.
5. Sur mobile, la décision se lit seulement : son historique et ses liens sont repliés (règle 9).

**Mobile** : écran poussé en lecture seule, sections repliables (Contexte et Décision ouvertes). Aucun bouton d'action : les changements se font sur le poste.

### <a id="e9e"></a>E9e · Modifier une décision acceptée

Corriger le texte d'une décision déjà acceptée. L'enregistrement crée une nouvelle version, avec une note obligatoire qui dit pourquoi ; les versions précédentes restent lisibles.

- **Depuis** [E9d](#e9d) avec « Modifier »
- **Ensuite** [E9d](#e9d) après « Enregistrer la version 3 » ou « Annuler »

Règles de l'écran :

1. Les champs reprennent le texte de la version 2 ; la partie changée est surlignée tant qu'elle n'est pas enregistrée, pour relire ce qui bouge. Titre, contexte et décision restent obligatoires ; le dépôt visé ne se change pas (pour une autre cible, « Remplacer » dans [E9d](#e9d)).
2. La note est obligatoire. Si elle est vide, « Enregistrer la version 3 » reste actif mais refuse l'enregistrement : le champ passe en erreur avec le message « Écris une note pour dire ce qui change. » et reçoit le focus. Aucune version n'est créée.
3. Le changement ne touche que les agents lancés ensuite (règle 11) : T-13 recevra la version 3, T-12 garde la version 2 qu'elle a reçue.
4. La version 3 s'ajoute à l'historique sans remplacer les précédentes : auteur, date et note sont gardés pour chacune (règle 10).
5. Écrire une décision demande un clavier : le mobile renvoie vers le poste.

**Mobile** : écran poussé qui renvoie vers le poste, comme pour une nouvelle décision ([E9c](#e9c)).

### <a id="e9f"></a>E9f · Aperçu du texte transmis

Le texte exact que lira un agent au prochain lancement dans api-voix, calculé à l'instant, avec ou sans les liens d'une tâche. Sert à vérifier le contexte avant de lancer ou à le copier.

- **Depuis** [E9a](#e9a) avec « Aperçu du texte transmis »
- **Ensuite** [E9a](#e9a) en fermant le panneau

Règles de l'écran :

1. C'est exactement ce que lit l'agent : décisions acceptées du dépôt, socles qui s'y appliquent, place dans l'architecture, puis les liens de la tâche choisie (règle 1). « Copier » met ce texte dans le presse-papiers.
2. Les décisions proposées par un agent et les décisions écartées par une exception n'y figurent pas (règles 2 et 3) ; la ligne du dessous rappelle ce qui manque, pour ne pas croire à un oubli.
3. Le texte coûte des tokens à chaque lancement : l'estimation aide à juger si le contexte devient trop long. Sans tâche choisie, les liens ne sont pas comptés.
4. L'aperçu est calculé à l'ouverture, à partir des décisions du moment. Il change dès qu'une décision est acceptée, modifiée ou abandonnée ; rouvrir le panneau le recalcule.

**Mobile** : écran poussé plein écran, en lecture seule. Le texte se fait défiler ; « Copier » reste en barre basse (44 px). Le choix de la tâche se fait au-dessus du texte.

## <a id="e10"></a>E10 · Intégrations

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e10.html` · implémentation : **À développer**

### <a id="e10a"></a>E10a · Intégrations : connexions

Les services dont Bosco lit les liens (GitHub, Jira, Confluence) : état de chaque connexion, ce qui est lu, nombre de liens et rafraîchissement. Les accès restent dans Bosco, jamais chez les agents.

- **Depuis** l'entrée « Réglages » de la barre latérale · [E10b](#e10b) avec le lien « Non rafraîchi »
- **Ensuite** [E11a](#e11a) avec l'onglet « Isolation du worker » · [E12a](#e12a) avec « Environnements de test »

Règles de l'écran :

1. Chaque intégration indique ce qu'elle reconnaît et lit dans un lien : titre, état, auteur ou responsable, selon le service. Le nombre de liens est celui des liens déjà ajoutés aux tâches, sessions et décisions (règle 4).
2. Quand une connexion échoue, la ligne passe en erreur avec la cause et la conséquence : ici, 3 liens Confluence ne sont plus rafraîchis, mais restent affichés avec leurs dernières informations connues. « Renouveler le jeton » est l'action à mener ; le reste continue de fonctionner.
3. Les accès aux intégrations restent dans Bosco : ils ne sont jamais transmis aux agents, qui ne reçoivent que le titre, l'état et l'adresse d'un lien (règle 5). Ces réglages sont réservés à toi, aucune session ni aucun agent ne peut les modifier (règle 9).
4. Les liens sont rafraîchis toutes les heures ; « Rafraîchir maintenant » relance la lecture sans attendre. Un lien dont les informations ne peuvent pas être lues est gardé tel quel, avec son adresse (règle 4).
5. Une adresse d'un service non configuré, ou d'un service inconnu, est tout de même acceptée : elle est gardée avec le titre de la page seulement, sans état ni auteur.

**Mobile** : écran poussé depuis l'onglet Sources, en lecture seule. L'intégration en erreur passe en tête, les autres sont des lignes compactes. « Renouveler sur le poste » rappelle que le jeton se renouvelle depuis le poste ; l'onglet Isolation du worker et les environnements de test ne sont pas repris.

### <a id="e10b"></a>E10b · Liens d'une tâche

Les décisions, tickets, pages et PR liés à une tâche, ajoutés en collant une adresse. Bosco reconnaît le service, lit le titre et l'état, puis transmet le tout à l'agent avec sa consigne.

- **Depuis** [Lot 2 · E7a](taches.md#e7a) (revue de T-12)
- **Ensuite** [Lot 2 · E7a](taches.md#e7a) une fois le lien ajouté · [E10a](#e10a) avec « Non rafraîchi »

Règles de l'écran :

1. On colle une adresse : tout lien est accepté, ceux de GitHub, Jira et Confluence sont reconnus automatiquement et le service s'affiche avant l'ajout (règle 4). Une adresse non reconnue s'ajoute aussi, avec le titre de la page seulement.
2. Pour chaque lien, Bosco affiche les informations lues : titre, état, auteur ou responsable, et l'heure de la dernière lecture. Elles sont relues toutes les heures.
3. Un lien dont l'intégration est en erreur reste dans la liste, signalé « Non rafraîchi », avec ses dernières informations connues. Le renvoi mène aux connexions ([E10a](#e10a)) pour renouveler l'accès.
4. L'agent reçoit les liens avec sa consigne : titre, état et adresse. Il ne reçoit ni le contenu des pages ni les accès aux intégrations (règles 1 et 5).
5. Les liens s'ajoutent de la même façon sur une session ou sur une décision ; ce panneau ne concerne que la tâche. Retirer un lien (croix) ne le supprime que de cette tâche.

**Mobile** : feuille modale en bas de l'écran, au-dessus de la revue de la tâche. Le bouton « Ajouter » est pleine largeur (44 px) ; le retrait d'un lien se fait sur le poste, ainsi que la pastille 5.

## <a id="e11"></a>E11 · Isolation du worker

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e11.html` · implémentation : **À développer**

### <a id="e11a"></a>E11a · Isolation du worker : mode et ressources

Où et avec quelles limites travaille un agent du worker : un conteneur jetable par tâche, des ressources plafonnées et ce que l'agent peut ou non voir. C'est le premier des deux sous-onglets de l'isolation.

- **Depuis** l'onglet « Isolation du worker » des Réglages · [E12a](#e12a) pour l'image
- **Ensuite** [E11b](#e11b) avec « Sortie réseau et secrets » · [E8a](taches.md#e8a) pour les droits des agents

Règles de l'écran :

1. Dans cette version, un seul mode : chaque tâche du worker a son conteneur jetable, supprimé à la fin ; seule la branche reste (règle 6). Plusieurs tâches peuvent utiliser les mêmes ports, puisque rien n'est publié sur le poste.
2. Une tâche ne démarre que si le plafond d'agents n'est pas atteint et s'il reste assez de mémoire au-delà de la marge gardée libre. Sinon, elle reste « En file » avec la raison, et part dès qu'une place se libère. Le plafond de 4 agents se règle ici.
3. Les ressources sont plafonnées pour chaque agent : mémoire, processeurs et nombre de processus. L'utilisateur sans droits d'administration est verrouillé : il ne se désactive pas.
4. Le tableau résume ce que l'agent voit fichiers, secrets, réseau. Les secrets et les domaines se règlent dans [E11b](#e11b) ; l'image se choisit par dépôt dans [E12a](#e12a).
5. Ces réglages sont réservés à toi : aucune session ni aucun agent ne peut les lire pour les contourner ni les modifier (règle 9).

**Mobile** : écran poussé en lecture seule. Le tableau devient une liste ; la mention « Modifiable depuis le poste » l'explique. Réglages s'ouvre depuis l'onglet Sources.

### <a id="e11b"></a>E11b · Isolation du worker : sortie réseau et secrets

Quels domaines un agent du worker peut joindre, ce qui a été refusé et ce qu'il reçoit comme secrets. Deuxième sous-onglet de l'isolation.

- **Depuis** [E11a](#e11a) avec « Sortie réseau et secrets » · le lien « Voir les refus » d'une tâche bloquée
- **Ensuite** retour à [E11a](#e11a) · [E4a](sessions.md#e4a) pour les sources

Règles de l'écran :

1. La liste par défaut est verrouillée : ces domaines sont nécessaires à Claude Code et aux installations, ils ne se retirent pas (règle 7).
2. On ajoute un domaine par nom ; `*.domaine` couvre ses sous-domaines. Les domaines ajoutés se retirent d'un clic. Tout domaine absent de la liste est refusé (règle 7).
3. Chaque refus est visible avec l'heure, la tâche et le domaine. « Autoriser ce domaine » l'ajoute à la liste sans relancer la tâche : l'agent peut réessayer.
4. Le filtrage se fait par nom de domaine : un domaine autorisé reste une sortie possible pour un agent qui voudrait y envoyer des données. L'avertissement reste affiché.
5. Les jetons sont créés pour la tâche et expirent ou sont révoqués à sa fin. Les accès des intégrations et les réglages du poste ne sont jamais transmis (règle 5). Le worker utilise l'abonnement Claude du profil choisi, avec une copie temporaire de son accès (règle 12) : ses tâches comptent dans les limites de cet abonnement.
6. Les registres privés sont ceux que les tâches utilisent pour installer les paquets et les images du dépôt. Bosco s'authentifie avec les identifiants du registre sur le poste : l'agent ne voit qu'un jeton temporaire, jamais ces identifiants.

**Mobile** : écran poussé en lecture seule, refus récents en tête. Autoriser un domaine se fait depuis le poste.

## <a id="e12"></a>E12 · Environnement de test

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e12.html` · implémentation : **À développer**

### <a id="e12a"></a>E12a · Environnement de test d'un dépôt

Ce qui est lancé autour de l'agent pour tester un dépôt : l'image de l'agent et les services de test (base de données, cache), avec ce qui est écarté et pourquoi.

- **Depuis** l'onglet « Environnements de test » des Réglages · le pied de [E11a](#e11a)
- **Ensuite** le choix « Choisir » ouvre la sélection des services · [E8a](taches.md#e8a) pour les droits du dépôt

Règles de l'écran :

1. Les services de test sont lus dans le fichier des services de test du dépôt, à la branche de départ (ici develop), jamais dans la branche d'une tâche non relue : un agent ne peut pas se donner des services en modifiant ce fichier.
2. « Automatique » lance les services qui ont une image, sauf l'application elle-même et les images exclues par défaut. « Choisir » permet de cocher les services un à un ; « Aucun » désactive les services de test.
3. Certaines options de lancement sont retirées par sécurité : ports publiés, volumes nommés. Rien n'est publié sur le poste et les données sont jetables (règle 8).
4. Les services tournent sur un réseau privé sans Internet. L'agent les joint par leur nom (database, rabbitmq), pas par une adresse.
5. Chaque service est limité en mémoire et en processeur, et l'attente est bornée. Si un service ne démarre pas à temps, la tâche continue sans services et l'agent en est prévenu : l'échec n'est pas bloquant.
6. L'image de l'agent se choisit par dépôt ; sans choix, l'image par défaut décrite dans [E11a](#e11a) s'applique. Les images privées sont téléchargées par le worker avec son propre accès, que l'agent ne voit pas.

**Mobile** : écran poussé en lecture seule, cartes « Lancés », « Écartés » et « Dernier lancement ». Aucune modification possible ; la mention « Modifiable depuis le poste » l'explique.

## <a id="e14"></a>E14 · Socles

[specs](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1) · `contexte/e14.html` · implémentation : **À développer**

### <a id="e14a"></a>E14a · Socles : liste et héritages

Les socles regroupent des décisions communes à plusieurs dépôts. Cet écran montre pour chacun ses décisions, les dépôts qui en héritent et les exceptions locales.

- **Depuis** [E9a](#e9a) avec « Gérer les socles »
- **Ensuite** [E14b](#e14b) avec « Nouveau socle » · [E9c](#e9c) avec « Nouvelle décision »

Règles de l'écran :

1. Un socle est global (il s'applique à tous les dépôts, ici les 15) ou partagé (seulement à ceux qui l'héritent). Les socles s'empilent dans le contexte d'un dépôt (règle 3).
2. Les dépôts qui héritent du socle sont listés ; le renvoi « + 9 autres » déplie la liste complète. Un socle peut aussi hériter d'un autre socle.
3. Les exceptions sont listées avec le dépôt concerné : api-voix garde Jest (DEC-5) au lieu de « Tests avec Vitest », qui est écartée pour lui seul.
4. Changer un socle (décision, dépôts) touche les prochains agents de tous ces dépôts : une confirmation indique le nombre de dépôts concernés avant d'enregistrer. Les agents déjà lancés ne sont pas touchés.
5. Les socles se règlent par toi seul : aucune session ni aucun agent ne peut les modifier (règle 9). Sur mobile, l'écran se lit seulement.

**Mobile** : écran poussé depuis Contexte, en lecture seule. Chaque socle est une carte ; pas de bouton de création ni de gestion des dépôts.

### <a id="e14b"></a>E14b · Nouveau socle

Créer un socle : lui donner un nom, une portée, un éventuel socle dont il hérite et les dépôts concernés. Les décisions s'y ajoutent ensuite.

- **Depuis** [E14a](#e14a) avec « Nouveau socle »
- **Ensuite** [E14a](#e14a) après « Créer le socle »

Règles de l'écran :

1. Global : le socle s'applique à tous les dépôts, la liste des dépôts disparaît. Partagé : il s'applique aux seuls dépôts cochés (règle 3).
2. Un socle peut hériter d'un autre : il reçoit alors ses décisions en plus des siennes. Une boucle est refusée avec le message « Un socle ne peut pas hériter de lui-même, même indirectement. », le champ passe en erreur et « Créer le socle » reste sans effet.
3. Un socle vide n'a aucun effet tant qu'il n'a pas de décision acceptée : les dépôts cochés n'en reçoivent rien de plus.
4. Créer un socle demande un clavier et un regard d'ensemble : le mobile renvoie vers le poste (règle 9).

**Mobile** : écran poussé qui renvoie vers le poste, comme pour une nouvelle décision ([E9c](#e9c)).

## <a id="criteres-dacceptation"></a>Critères d'acceptation

### <a id="e9a-contexte-dun-depot"></a>E9a · Contexte d'un dépôt

- **CA-CONT-01** · [E9a](#e9a) · Étant donné le dépôt api-voix avec des décisions acceptées, le socle commun (global) et le socle Node.js (partagé), quand la personne ouvre le contexte du dépôt, alors elle voit les décisions acceptées du dépôt, celles des socles qui s'y appliquent et la place du dépôt dans l'architecture, qui sont transmises à chaque agent au lancement (RF-CONT-01).
- **CA-CONT-02** · [E9a](#e9a) · Étant donné une décision du dépôt reliée par « fait exception à » à une décision d'un socle, quand la personne consulte la liste, alors la décision du socle reste visible, barrée et marquée « Écartée », elle n'est pas transmise, et la décision du dépôt l'indique sous son titre (RF-CONT-03).
- **CA-CONT-03** · [E9a](#e9a) · Étant donné une décision seulement proposée par un agent, quand la personne ouvre le contexte du dépôt, alors le bandeau de validation s'affiche avec son compteur, repris sur l'entrée « Contexte » de la barre latérale, la décision n'est pas transmise, et « Examiner » ouvre la décision (RF-CONT-02).
- **CA-CONT-04** · [E9a](#e9a) · Étant donné aucune décision à valider, quand la personne ouvre le contexte du dépôt, alors le bandeau n'apparaît pas (RF-CONT-02).
- **CA-CONT-05** · [E9a](#e9a) · Étant donné le contexte d'un dépôt, quand la personne choisit « Nouvelle décision », « Aperçu du texte transmis » ou « Gérer les socles », alors elle arrive respectivement sur [E9c](#e9c), [E9f](#e9f) et [E14a](#e14a) (RF-CONT-10).

### <a id="e9b-decision-proposee-par-un-agent-a-valider"></a>E9b · Décision proposée par un agent, à valider

- **CA-CONT-06** · [E9b](#e9b) · Étant donné une décision proposée par l'agent de T-12, quand la personne clique sur « Accepter », alors la décision est enregistrée comme acceptée, la personne revient au contexte du dépôt ([E9a](#e9a)) et le bandeau disparaît (RF-CONT-02).
- **CA-CONT-07** · [E9b](#e9b) · Étant donné une décision acceptée, quand les prochains agents d'api-voix sont lancés, alors ils la reçoivent, y compris pour la tâche T-13 pas encore lancée, et les agents déjà en cours ne la reçoivent pas (RF-CONT-01).
- **CA-CONT-08** · [E9b](#e9b) · Étant donné une décision proposée, quand la personne clique sur « Modifier avant d'accepter », alors les champs contexte, décision, conséquences et alternatives écartées se rouvrent et la version acceptée est celle que la personne a relue (RF-CONT-10).
- **CA-CONT-09** · [E9b](#e9b) · Étant donné une décision proposée, quand la personne clique sur « Refuser » avec ou sans motif, alors la décision passe à « Refusée », elle n'est jamais transmise, l'agent n'est pas relancé et le motif est conservé avec la décision (RF-CONT-02).
- **CA-CONT-10** · [E9b](#e9b) · Étant donné une décision proposée, quand la personne consulte son historique, alors elle y voit l'auteur (l'agent de T-12), la date de proposition, puis la validation de la personne (RF-CONT-10).

### <a id="e9c-nouvelle-decision"></a>E9c · Nouvelle décision

- **CA-CONT-11** · [E9c](#e9c) · Étant donné le formulaire « Nouvelle décision », quand la personne choisit un dépôt ou un socle comme cible, alors la décision porte sur cette cible et, sur un socle, elle s'applique à tous les dépôts concernés (RF-CONT-03).
- **CA-CONT-12** · [E9c](#e9c) · Étant donné le formulaire « Nouvelle décision », quand la personne laisse vide le titre, le contexte ou la décision, alors la création est refusée car ces trois champs sont obligatoires (RF-CONT-10).
- **CA-CONT-13** · [E9c](#e9c) · Étant donné une décision de dépôt, quand la personne renseigne « Fait exception à » avec une décision d'un socle, alors cette décision est retirée du socle pour ce seul dépôt et sans changement ailleurs ; le champ n'apparaît pas pour une décision de socle (RF-CONT-03).
- **CA-CONT-14** · [E9c](#e9c) · Étant donné une nouvelle décision, quand la personne choisit « Accepter la décision », alors elle est transmise aux prochains agents, et quand elle choisit « Garder en proposition », alors elle reste hors du contexte transmis (RF-CONT-01, RF-CONT-10).

### <a id="e9d-decision-acceptee-et-historique"></a>E9d · Décision acceptée et historique

- **CA-CONT-15** · [E9d](#e9d) · Étant donné une décision acceptée modifiée, quand la personne l'ouvre, alors chaque version garde son auteur, sa date et sa note, la version 1 reste lisible à côté de la version actuelle et choisir une version l'affiche dans le corps de la page (RF-CONT-11).
- **CA-CONT-16** · [E9d](#e9d) · Étant donné une décision acceptée, quand la personne clique sur « Remplacer » et écrit une nouvelle décision, alors la décision remplacée passe à « Remplacée » et garde un renvoi vers sa remplaçante (RF-CONT-11).
- **CA-CONT-17** · [E9d](#e9d) · Étant donné une décision acceptée, quand la personne clique sur « Abandonner » et confirme, avec ou sans motif, alors la décision n'est plus envoyée aux agents mais reste lisible avec son historique (RF-CONT-11).
- **CA-CONT-18** · [E9d](#e9d) · Étant donné la décision liée à DEC-6, T-12 et T-13, quand la personne consulte les relations, alors DEC-6 la précise, T-12 l'a reçue à son lancement, T-13 la recevra, et un clic ouvre l'élément lié (RF-CONT-01).
- **CA-CONT-19** · [E9d](#e9d) · Étant donné un mobile, quand la personne ouvre une décision acceptée, alors elle la lit sans aucun bouton d'action, son historique et ses liens étant repliés (RF-CONT-09).

### <a id="e9e-modifier-une-decision-acceptee"></a>E9e · Modifier une décision acceptée

- **CA-CONT-20** · [E9e](#e9e) · Étant donné la décision en version 2, quand la personne clique sur « Modifier », alors les champs reprennent le texte de la version 2, la partie changée est surlignée tant qu'elle n'est pas enregistrée, et le dépôt visé ne se change pas (RF-CONT-11).
- **CA-CONT-21** · [E9e](#e9e) · Étant donné une note vide, quand la personne clique sur « Enregistrer la version 3 », alors l'enregistrement est refusé, le champ passe en erreur avec le message « Écris une note pour dire ce qui change. », il reçoit le focus et aucune version n'est créée (RF-CONT-11).
- **CA-CONT-22** · [E9e](#e9e) · Étant donné une note renseignée, quand la personne enregistre la version 3, alors elle s'ajoute à l'historique sans remplacer les précédentes, avec auteur, date et note pour chacune (RF-CONT-10, RF-CONT-11).
- **CA-CONT-23** · [E9e](#e9e) · Étant donné la version 3 enregistrée, quand les agents sont lancés ensuite, alors T-13 reçoit la version 3 et T-12 garde la version 2 qu'elle a reçue (RF-CONT-11).
- **CA-CONT-24** · [E9e](#e9e) · Étant donné un mobile, quand la personne ouvre l'écran de modification, alors il renvoie vers le poste (RF-CONT-10).

### <a id="e9f-apercu-du-texte-transmis"></a>E9f · Aperçu du texte transmis

- **CA-CONT-25** · [E9f](#e9f) · Étant donné une tâche choisie, quand la personne ouvre l'aperçu, alors elle lit les décisions acceptées du dépôt, les socles qui s'y appliquent, la place dans l'architecture, puis les liens de la tâche, et « Copier » met ce texte dans le presse-papiers (RF-CONT-01).
- **CA-CONT-26** · [E9f](#e9f) · Étant donné des décisions proposées par un agent et des décisions écartées par une exception, quand la personne ouvre l'aperçu, alors elles n'y figurent pas et la ligne du dessous rappelle ce qui manque (RF-CONT-02, RF-CONT-03).
- **CA-CONT-27** · [E9f](#e9f) · Étant donné aucune tâche choisie, quand la personne ouvre l'aperçu, alors les liens ne sont pas comptés dans l'estimation des tokens (RF-CONT-01).
- **CA-CONT-28** · [E9f](#e9f) · Étant donné une décision acceptée, modifiée ou abandonnée depuis l'ouverture, quand la personne rouvre le panneau, alors le texte est recalculé à partir des décisions du moment (RF-CONT-11).

### <a id="e10a-integrations-connexions"></a>E10a · Intégrations : connexions

- **CA-CONT-29** · [E10a](#e10a) · Étant donné les intégrations GitHub, Jira et Confluence, quand la personne ouvre l'écran, alors chaque ligne indique ce qui est reconnu et lu dans un lien (titre, état, auteur ou responsable, selon le service) et le nombre de liens déjà ajoutés aux tâches, sessions et décisions (RF-CONT-04).
- **CA-CONT-30** · [E10a](#e10a) · Étant donné une connexion Confluence en échec, quand la personne ouvre l'écran, alors la ligne passe en erreur avec la cause et la conséquence : 3 liens Confluence ne sont plus rafraîchis mais restent affichés avec leurs dernières informations connues, « Renouveler le jeton » est proposé et le reste continue de fonctionner (RF-CONT-04).
- **CA-CONT-31** · [E10a](#e10a) · Étant donné des liens rafraîchis toutes les heures, quand la personne clique sur « Rafraîchir maintenant », alors la lecture est relancée sans attendre, et un lien dont les informations ne peuvent pas être lues est gardé tel quel, avec son adresse (RF-CONT-04).
- **CA-CONT-32** · [E10a](#e10a) · Étant donné l'adresse d'un service non configuré ou inconnu, quand elle est ajoutée, alors elle est acceptée et gardée avec le titre de la page seulement, sans état ni auteur (RF-CONT-04).
- **CA-CONT-33** · [E10a](#e10a) · Étant donné les accès aux intégrations, quand un agent est lancé, alors il ne reçoit que le titre, l'état et l'adresse d'un lien et jamais les accès, et aucune session ni aucun agent ne peut modifier ces réglages (RF-CONT-05, RF-CONT-09).

### <a id="e10b-liens-dune-tache"></a>E10b · Liens d'une tâche

- **CA-CONT-34** · [E10b](#e10b) · Étant donné une adresse GitHub, Jira ou Confluence collée, quand la personne la saisit, alors le service est reconnu et affiché avant l'ajout (RF-CONT-04).
- **CA-CONT-35** · [E10b](#e10b) · Étant donné une adresse non reconnue, quand la personne l'ajoute, alors le lien est ajouté avec le titre de la page seulement (RF-CONT-04).
- **CA-CONT-36** · [E10b](#e10b) · Étant donné un lien ajouté, quand la personne consulte la liste, alors elle voit pour chaque lien le titre, l'état, l'auteur ou responsable et l'heure de la dernière lecture, relues toutes les heures (RF-CONT-04).
- **CA-CONT-37** · [E10b](#e10b) · Étant donné un lien dont l'intégration est en erreur, quand la personne consulte la liste, alors il reste dans la liste, signalé « Non rafraîchi », avec ses dernières informations connues, et le renvoi mène aux connexions ([E10a](#e10a)) (RF-CONT-04).
- **CA-CONT-38** · [E10b](#e10b) · Étant donné un lien retiré par la croix, quand la personne confirme le retrait, alors il n'est supprimé que de cette tâche, et l'agent reçoit les liens avec sa consigne : titre, état et adresse, sans le contenu des pages ni les accès aux intégrations (RF-CONT-01, RF-CONT-05).

### <a id="e11a-isolation-du-worker-mode-et-ressources"></a>E11a · Isolation du worker : mode et ressources

- **CA-CONT-39** · [E11a](#e11a) · Étant donné une tâche du worker, quand elle tourne, alors elle a son conteneur jetable, supprimé à la fin, et seule la branche reste (RF-CONT-06).
- **CA-CONT-40** · [E11a](#e11a) · Étant donné le plafond de 4 agents atteint ou une mémoire insuffisante au-delà de la marge gardée libre, quand une tâche est lancée, alors elle reste « En file » avec la raison et part dès qu'une place se libère (RF-CONT-06).
- **CA-CONT-41** · [E11a](#e11a) · Étant donné les ressources plafonnées pour chaque agent, quand la personne consulte l'écran, alors elle voit la mémoire, les processeurs et le nombre de processus, et l'utilisateur sans droits d'administration est verrouillé, sans pouvoir être désactivé (RF-CONT-06).
- **CA-CONT-42** · [E11a](#e11a) · Étant donné les réglages d'isolation, quand une session ou un agent tente de les lire ou de les modifier, alors cela n'est pas possible : ils sont réservés à la personne (RF-CONT-09).

### <a id="e11b-isolation-du-worker-sortie-reseau-et-secrets"></a>E11b · Isolation du worker : sortie réseau et secrets

- **CA-CONT-43** · [E11b](#e11b) · Étant donné la liste par défaut, quand la personne consulte les domaines, alors ils sont verrouillés et ne se retirent pas (RF-CONT-07).
- **CA-CONT-44** · [E11b](#e11b) · Étant donné un domaine ajouté par nom, ou par `*.domaine` pour ses sous-domaines, quand la personne le retire d'un clic, alors il disparaît de la liste, et tout domaine absent de la liste est refusé (RF-CONT-07).
- **CA-CONT-45** · [E11b](#e11b) · Étant donné un accès refusé, quand la personne consulte les refus, alors chaque refus est visible avec l'heure, la tâche et le domaine, et « Autoriser ce domaine » l'ajoute à la liste sans relancer la tâche (RF-CONT-07).
- **CA-CONT-46** · [E11b](#e11b) · Étant donné le filtrage par nom de domaine, quand la personne ouvre l'écran, alors l'avertissement reste affiché : un domaine autorisé reste une sortie possible pour un agent qui voudrait y envoyer des données (RF-CONT-07).
- **CA-CONT-47** · [E11b](#e11b) · Étant donné une tâche terminée, quand la personne consulte les jetons, alors ils ont été créés pour la tâche et ont expiré ou ont été révoqués à sa fin, et les accès des intégrations et les réglages du poste ne sont jamais transmis (RF-CONT-05).
- **CA-CONT-48** · [E11b](#e11b) · Étant donné une tâche du worker, quand elle tourne, alors elle compte dans les limites de l'abonnement Claude du profil choisi (RF-CONT-12).

### <a id="e12a-environnement-de-test-dun-depot"></a>E12a · Environnement de test d'un dépôt

- **CA-CONT-49** · [E12a](#e12a) · Étant donné le dépôt et sa branche de départ (ici develop), quand la personne consulte l'écran, alors les services de test sont lus dans le fichier des services de test de cette branche, jamais dans celle d'une tâche non relue (RF-CONT-08).
- **CA-CONT-50** · [E12a](#e12a) · Étant donné le choix « Automatique », quand les services sont lancés, alors ceux qui ont une image le sont, sauf l'application elle-même et les images exclues par défaut ; « Choisir » permet de cocher les services un à un et « Aucun » désactive les services de test (RF-CONT-08).
- **CA-CONT-51** · [E12a](#e12a) · Étant donné des options de lancement retirées par sécurité, quand la personne consulte les services écartés, alors elle voit les ports publiés et les volumes nommés écartés, rien n'est publié sur le poste et les données sont jetables (RF-CONT-08).
- **CA-CONT-52** · [E12a](#e12a) · Étant donné des services de test lancés, quand l'agent les joint, alors ils sont sur un réseau privé sans Internet, joints par leur nom (database, rabbitmq) et non par une adresse (RF-CONT-08).
- **CA-CONT-53** · [E12a](#e12a) · Étant donné un service qui ne démarre pas à temps, quand la tâche est lancée, alors elle continue sans services, l'agent en est prévenu et l'échec n'est pas bloquant (RF-CONT-08).
- **CA-CONT-54** · [E12a](#e12a) · Étant donné un dépôt sans image choisie, quand une tâche est lancée, alors l'image par défaut décrite dans [E11a](#e11a) s'applique (RF-CONT-06).

### <a id="e14a-socles-liste-et-heritages"></a>E14a · Socles : liste et héritages

- **CA-CONT-55** · [E14a](#e14a) · Étant donné un socle global et un socle partagé, quand la personne ouvre la liste, alors le socle global s'applique à tous les dépôts (ici les 15), le socle partagé seulement à ceux qui l'héritent, et ils s'empilent dans le contexte d'un dépôt (RF-CONT-03).
- **CA-CONT-56** · [E14a](#e14a) · Étant donné un socle avec des dépôts qui en héritent, quand la personne clique sur « + 9 autres », alors la liste complète des dépôts se déplie (RF-CONT-03).
- **CA-CONT-57** · [E14a](#e14a) · Étant donné une exception locale, quand la personne consulte les exceptions, alors api-voix garde Jest (DEC-5) au lieu de « Tests avec Vitest », écartée pour lui seul (RF-CONT-03).
- **CA-CONT-58** · [E14a](#e14a) · Étant donné un changement de socle (décision, dépôts), quand la personne veut enregistrer, alors une confirmation indique le nombre de dépôts concernés avant l'enregistrement, et les agents déjà lancés ne sont pas touchés (RF-CONT-03, RF-CONT-11).
- **CA-CONT-59** · [E14a](#e14a) · Étant donné un mobile, quand la personne ouvre l'écran, alors elle le lit seulement, sans bouton de création ni de gestion des dépôts (RF-CONT-09).

### <a id="e14b-nouveau-socle"></a>E14b · Nouveau socle

- **CA-CONT-60** · [E14b](#e14b) · Étant donné le choix « Global », quand la personne le sélectionne, alors la liste des dépôts disparaît ; avec « Partagé », le socle s'applique aux seuls dépôts cochés (RF-CONT-03).
- **CA-CONT-61** · [E14b](#e14b) · Étant donné un socle qui hérite d'un autre, quand la personne le crée, alors il reçoit les décisions de l'autre en plus des siennes (RF-CONT-03).
- **CA-CONT-62** · [E14b](#e14b) · Étant donné un héritage en boucle, quand la personne clique sur « Créer le socle », alors le message « Un socle ne peut pas hériter de lui-même, même indirectement. » s'affiche, le champ passe en erreur et « Créer le socle » reste sans effet (RF-CONT-03).
- **CA-CONT-63** · [E14b](#e14b) · Étant donné un socle vide, quand les dépôts cochés sont lancés, alors ils n'en reçoivent rien de plus tant qu'il n'a pas de décision acceptée (RF-CONT-01, RF-CONT-03).
- **CA-CONT-64** · [E14b](#e14b) · Étant donné un mobile, quand la personne ouvre l'écran, alors il renvoie vers le poste (RF-CONT-09).
