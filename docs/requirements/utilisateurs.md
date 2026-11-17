<!-- Généré par export.mjs (skill requirements-doc) depuis sources/20-utilisateurs.md : ne pas modifier ici. -->

# <a id="2-utilisateurs-et-roles"></a>2. Utilisateurs et rôles

## <a id="21-personas"></a>2.1 Personas

**Le développeur**, seul utilisateur de cette version. Il fait tourner plusieurs sessions Claude Code en parallèle, garde Bosco ouvert à côté de ses terminaux, et consulte parfois son téléphone. Écrans les plus utilisés : [E1b](lots/sessions.md#e1b), [E2b](lots/sessions.md#e2b), E5b, E7a.

## <a id="22-roles-et-permissions"></a>2.2 Rôles et permissions

Bosco n'a pas de comptes. La distinction qui compte oppose l'utilisateur aux agents, et le poste au téléphone.

| Action | Sur le poste | Téléphone appairé | Agent |
|---|---|---|---|
| Autoriser ou refuser une commande | Oui | Oui, avec confirmation | Non |
| Proposer une décision | Oui | Non | Oui |
| Accepter, modifier ou abandonner une décision | Oui | Accepter ou refuser seulement | Non |
| Créer une décision, ajouter un projet, régler un groupe et ses instructions | Oui | Non | Non |
| Démarrer une session avec un groupe | Oui | Oui | Non |
| Modifier les droits, l'isolation, les intégrations, les sources | Oui | Non | Non |
| Appairer un téléphone | Oui | Non | Non |
| Ajouter un dossier surveillé | Oui | Non | Non |
