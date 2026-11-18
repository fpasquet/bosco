<!-- Généré par export.mjs (skill requirements-doc) depuis sources/50-exigences-non-fonctionnelles.md : ne pas modifier ici. -->

# <a id="5-exigences-non-fonctionnelles"></a>5. Exigences non fonctionnelles

| Id | Catégorie | Exigence | Vérification |
|---|---|---|---|
| **NF-01** | Temps réel | Avec le suivi en direct, un changement d'état d'une session apparaît en moins de 3 s | Test de bout en bout chronométré sur une vraie session |
| **NF-02** | Performance | La vue d'ensemble s'affiche en moins de 1 s avec 3 180 sessions en base | Mesure sur un jeu de données de cette taille |
| **NF-03** | Performance | Une recherche dans l'historique répond en moins de 500 ms sur 3 180 sessions | Mesure automatisée |
| **NF-04** | Sobriété | Au repos, Bosco consomme moins de 400 Mo de mémoire et moins de 1 % de processeur | Mesure sur le poste pendant 10 min |
| **NF-05** | Autonomie | Si Bosco est arrêté, Claude Code continue normalement : un hook en échec ne bloque aucune session | Test : arrêter Bosco pendant une session |
| **NF-06** | Reprise | Au redémarrage, Bosco rattrape les sessions écrites pendant son arrêt | Test d'arrêt et de relance |
| **NF-07** | Reprise | Mise de côté avec les tâches (17/11/2026, DT-43) : un redémarrage du service n'interrompait pas les tâches du worker. | — |
| **NF-08** | Résilience | Une ligne de transcript inconnue n'arrête pas l'ingestion : elle est ignorée et comptée | Test sur des fichiers altérés |
| **NF-09** | Compatibilité | Le comportement de RF-SESS-03 est vérifié par un test automatisé à chaque nouvelle version de Claude Code | Test d'intégration avec une vraie session |
| **NF-10** | Capacité | Mise de côté avec les tâches (17/11/2026, DT-43) : le worker faisait tourner 4 agents en parallèle. | — |
| **NF-11** | Isolation | Un agent en bac à sable ne peut lire ni le dossier personnel, ni les autres projets que ceux de sa session, ni joindre un domaine hors liste | Test d'évasion automatisé |
| **NF-12** | Nettoyage | Un bac à sable supprimé ne laisse ni conteneur, ni réseau, ni dossier temporaire, même après un arrêt brutal | Test d'arrêt brutal, nettoyage au démarrage |
| **NF-13** | Sécurité | Sans accès téléphone activé, Bosco n'écoute sur aucune interface réseau autre que la boucle locale et le pont des conteneurs | Vérification des ports ouverts |
| **NF-14** | Sécurité | Un téléphone n'accède à rien avant l'appairage ; le code vaut 5 min, un seul usage, 5 essais | Test automatisé |
| **NF-15** | Sécurité | Aucun accès d'intégration ni identifiant du poste n'apparaît dans un journal ou chez un agent | Revue et test de recherche de secrets |
| **NF-16** | Données | Rien ne quitte le poste, hors les appels de Claude Code, des intégrations configurées et la recherche des releases (NF-20) | Revue des appels sortants |
| **NF-17** | Conservation | Tout l'historique est conservé, même après effacement par Claude Code (30 jours par défaut) | Test sur une session purgée |
| **NF-18** | Accessibilité | WCAG 2.2 AA sur les écrans desktop | Contrôle automatisé puis revue |
| **NF-19** | Qualité | Chaque critère d'acceptation est couvert par un test qui le cite | `trace.mjs` |
| **NF-20** | Données | La recherche d'une version plus récente est un GET en lecture aux releases publiques de GitHub, une fois par jour au plus, sans identifiant ni cookie, avec un agent utilisateur générique ; elle se coupe dans l'onglet À propos | Test du rythme sur une horloge factice, revue de l'appel |
