@RF-CONT-01
@RF-CONT-02
@RF-CONT-15
Feature: Context of the agents
  As the developer, I want every agent to receive the instructions of all the projects and of the groups of its
  project, then the accepted decisions of its project, which prevail, so that it works within what was decided, and an
  agent only proposes, never decides.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-maison-rag.jsonl" for the session "5e0a91c3"
    And Bosco watches the profiles ".claude" and ".claude-perso"
    And the folders "maison,site-perso" are projects

  @CA-CONT-01
  @CA-CONT-25
  @CA-CONT-103
  @CA-CONT-106
  @CA-CONT-140
  Scenario: The common instructions come first, then those of each group of the project, then its decisions, which prevail
    Given I send PUT request to "/api/groups/1/instructions" with the JSON "fixtures/groups/all-instructions.json"
    And I send POST request to "/api/groups" with the JSON "fixtures/groups/node.json"
    And I send PUT request to "/api/groups/2/instructions" with the JSON "fixtures/groups/node-instructions.json"
    And I send POST request to "/api/groups" with the JSON "fixtures/groups/perso.json"
    And I send PUT request to "/api/groups/3/instructions" with the JSON "fixtures/groups/perso-instructions.json"
    And I send POST request to "/api/decisions" with the JSON "fixtures/context/project-decision.json"
    When I send GET request to "/api/context/preview?project=maison"
    Then the response should match snapshot except for "at"
    When I send GET request to "/api/context?project=maison"
    Then the response property "groups" should match the names "Tous les projets,Node.js"

  @CA-CONT-11
  Scenario: A decision is about a project only: what holds for several projects goes to the instructions of a group
    When I send POST request to "/api/decisions" with the JSON "fixtures/context/socle-decision.json"
    Then the response code should be 400
    And the response property "code" should equal "invalidRequest"

  @CA-CONT-03
  @CA-CONT-06
  @CA-CONT-26
  @CA-CONT-28
  Scenario: A decision proposed by a session waits for a human, then is sent once accepted
    When the session calls the Bosco tool "bosco_propose_decision" with:
      | path     | maison                                   |
      | title    | Normaliser les sigles                    |
      | context  | Les sigles arrivent avec ou sans points. |
      | decision | Retirer les points avant la recherche.   |
    Then the Bosco tool answers "DEC-1 proposée"
    When I send GET request to "/api/context/preview?project=maison"
    Then the response property "absent.proposed.0.id" should equal "1"
    And the response property "text" should not contain "Normaliser les sigles"
    When I send POST request to "/api/decisions/1/accept"
    And I send GET request to "/api/context/preview?project=maison"
    Then the response property "text" should contain "DEC-1 Normaliser les sigles"

  @CA-CONT-21
  @CA-CONT-22
  Scenario: An accepted decision changes with a note, and keeps its versions
    When I send POST request to "/api/decisions" with the JSON "fixtures/context/project-decision.json"
    And I send POST request to "/api/decisions/1/versions" with the JSON "fixtures/context/version-without-note.json"
    Then the response code should be 400
    And the response property "message" should equal "Écris une note pour dire ce qui change."
    When I send POST request to "/api/decisions/1/versions" with the JSON "fixtures/context/version.json"
    Then the response property "versions.length" should equal "2"
    And the response property "versions.1.note" should equal "Les colonnes aussi"

  @CA-CONT-10
  Scenario: A decision proposed by an agent names its session, and arrives as a notification
    When a Claude Code session in "maison/packages/recettes" proposes the decision "Normaliser les sigles"
    Then the Bosco tool answers "DEC-1 proposée"
    When I send GET request to "/api/decisions/1"
    Then the response property "decision.versions.0.author" should equal "l’agent de la session « Corriger l’indexation des PDF dans Elasticsearch »"
    And the response property "decision.versions.0.session.id" should equal "5e0a91c3"
    When I send GET request to "/api/notifications"
    Then the response property "notifications.0.kind" should equal "decision"
    And the response property "notifications.0.decisionId" should equal "1"
    And the response property "notifications.0.sessionId" should equal "5e0a91c3"
    When I send POST request to "/api/decisions/1/accept"
    And I send GET request to "/api/notifications"
    Then the response property "notifications.0.settled" should equal "Acceptée"

  @CA-CONT-07
  @RF-CONT-01
  Scenario: A piloted session receives the context of its project at launch, and keeps it
    Given I send POST request to "/api/decisions" with the JSON "fixtures/context/project-decision.json"
    When I start a session in the project "maison" with the JSON "fixtures/pilot/start-context.json"
    Then the response code should be 201
    And "the started session" should end its turn with "Contexte reçu : # Contexte du projet maison · - DEC-1 Découper les tableaux par ligne"
    When I send POST request to "/api/decisions" with the JSON "fixtures/context/maison-later-decision.json"
    And I write to "the started session" with the JSON "fixtures/pilot/context.json"
    Then "the started session" should end its turn with "Contexte reçu : # Contexte du projet maison · - DEC-1 Découper les tableaux par ligne"

  @CA-CONT-23
  Scenario: The agents launched after a new version receive it, those launched before keep the one they received
    Given I send POST request to "/api/decisions" with the JSON "fixtures/context/budget-decision.json"
    And I send POST request to "/api/decisions/1/versions" with the JSON "fixtures/context/budget-version-2.json"
    When I start a session in the project "maison" with the JSON "fixtures/pilot/start-context.json"
    Then "the started session" should end its turn with "Contexte reçu : # Contexte du projet maison · - DEC-1 Ranger les catégories du budget avec leurs couleurs"
    Given the started session is called "the first session"
    When I send POST request to "/api/decisions/1/versions" with the JSON "fixtures/context/budget-version-3.json"
    And I start a session in the project "maison" with the JSON "fixtures/pilot/start-context.json"
    Then "the started session" should end its turn with "Contexte reçu : # Contexte du projet maison · - DEC-1 Ranger les catégories du budget avec leurs couleurs et leurs icônes"
    When I write to "the first session" with the JSON "fixtures/pilot/context.json"
    Then "the first session" should end its turn with "Contexte reçu : # Contexte du projet maison · - DEC-1 Ranger les catégories du budget avec leurs couleurs"

  @CA-CONT-09
  Scenario: A refused decision keeps its reason and is never sent
    When the session calls the Bosco tool "bosco_propose_decision" with:
      | path     | maison                                   |
      | title    | Normaliser les sigles                    |
      | context  | Les sigles arrivent avec ou sans points. |
      | decision | Retirer les points avant la recherche.   |
    And I send POST request to "/api/decisions/1/refuse" with the JSON "fixtures/context/refuse-reason.json"
    Then the response property "state" should equal "refused"
    And the response property "reason" should equal "Les sigles gardent leurs points dans les titres."
    When I send GET request to "/api/context/preview?project=maison"
    Then the response property "text" should not contain "Normaliser les sigles"
    And the response property "absent.proposed.length" should equal "0"

  @CA-CONT-17
  Scenario: An abandoned decision is no longer sent, and stays readable with its history
    When I send POST request to "/api/decisions" with the JSON "fixtures/context/project-decision.json"
    And I send POST request to "/api/decisions/1/abandon" with the JSON "fixtures/context/abandon-reason.json"
    Then the response property "state" should equal "abandoned"
    When I send GET request to "/api/context/preview?project=maison"
    Then the response property "text" should not contain "Découper les tableaux par ligne"
    When I send GET request to "/api/decisions/1"
    Then the response property "decision.versions.0.title" should equal "Découper les tableaux par ligne"
    And the response property "decision.reason" should equal "Les tableaux arrivent désormais découpés."

  @CA-CONT-104
  @CA-REGL-03
  Scenario: A session reads the context and proposes a decision, but cannot change any setting
    When a Claude Code session lists the Bosco tools
    Then the Bosco tools are "bosco_context,bosco_propose_decision"

  Scenario: A session reads the context of the project it works in, and nothing outside of the known ones
    When I send POST request to "/api/decisions" with the JSON "fixtures/context/project-decision.json"
    And a Claude Code session in "maison/packages/recettes" calls the Bosco tool "bosco_context"
    Then the Bosco tool answers "DEC-1"
    When a Claude Code session in "ailleurs" calls the Bosco tool "bosco_context"
    Then the Bosco tool answers "Ce dossier n’est dans aucun projet connu de Bosco."

  Scenario: The MCP server of Bosco requires the secret of the installation
    When a program without the secret calls the Bosco tool "bosco_context"
    Then the Bosco tool is refused with the code 401
