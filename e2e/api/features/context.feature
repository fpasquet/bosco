@RF-CONT-01
@RF-CONT-02
@RF-CONT-15
Feature: Context of the agents
  As the developer, I want every agent to receive the instructions of all the projects and of the groups of its
  project, then the accepted decisions of its project, which prevail, so that it works within what was decided, and an
  agent only proposes, never decides.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-labo-ia-rag.jsonl" for the session "5e0a91c3"
    And Bosco watches the profiles ".claude" and ".claude-perso"
    And the folders "labo-ia,api-voix" are projects

  @CA-CONT-01
  @CA-CONT-25
  @CA-CONT-103
  @CA-CONT-106
  @CA-CONT-140
  Scenario: The common instructions come first, then those of each group of the project, then its decisions, which prevail
    Given I send PUT request to "/api/groups/1/instructions" with the JSON "fixtures/groups/all-instructions.json"
    And I send POST request to "/api/groups" with the JSON "fixtures/groups/node.json"
    And I send PUT request to "/api/groups/2/instructions" with the JSON "fixtures/groups/node-instructions.json"
    And I send POST request to "/api/groups" with the JSON "fixtures/groups/medias.json"
    And I send PUT request to "/api/groups/3/instructions" with the JSON "fixtures/groups/medias-instructions.json"
    And I send POST request to "/api/decisions" with the JSON "fixtures/context/project-decision.json"
    When I send GET request to "/api/context/preview?project=labo-ia"
    Then the response should match snapshot except for "at"
    When I send GET request to "/api/context?project=labo-ia"
    Then the response property "groups" should match the names "Tous les projets,Node.js"

  @CA-CONT-11
  Scenario: A decision is about a project only: what holds for several projects goes to the instructions of a group
    When I send POST request to "/api/decisions" with the JSON "fixtures/context/socle-decision.json"
    Then the response code should be 400
    And the response property "code" should equal "invalidRequest"

  @CA-CONT-03
  @CA-CONT-06
  Scenario: A decision proposed by a session waits for a human, then is sent once accepted
    When the session calls the Bosco tool "bosco_propose_decision" with:
      | path     | labo-ia                                  |
      | title    | Normaliser les sigles                    |
      | context  | Les sigles arrivent avec ou sans points. |
      | decision | Retirer les points avant la recherche.   |
    Then the Bosco tool answers "DEC-1 proposée"
    When I send GET request to "/api/context/preview?project=labo-ia"
    Then the response property "absent.proposed.0.id" should equal "1"
    When I send POST request to "/api/decisions/1/accept"
    And I send GET request to "/api/context/preview?project=labo-ia"
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

  @CA-CONT-86
  Scenario: Only the projects with a decision of their own, proposed or accepted, are offered
    When I send POST request to "/api/decisions" with the JSON "fixtures/context/project-decision.json"
    And I send POST request to "/api/decisions" with the JSON "fixtures/context/proposed-api-voix.json"
    And I send GET request to "/api/context/projects"
    Then the response property "projects" should equal "api-voix,labo-ia"
    When I send POST request to "/api/decisions/2/refuse"
    And I send GET request to "/api/context/projects"
    Then the response property "projects" should equal "labo-ia"

  Scenario: A session reads the context of the project it works in, and nothing outside of the known ones
    When I send POST request to "/api/decisions" with the JSON "fixtures/context/project-decision.json"
    And a Claude Code session in "labo-ia/packages/rag" calls the Bosco tool "bosco_context"
    Then the Bosco tool answers "DEC-1"
    When a Claude Code session in "ailleurs" calls the Bosco tool "bosco_context"
    Then the Bosco tool answers "Ce dossier n’est dans aucun projet connu de Bosco."

  Scenario: The MCP server of Bosco requires the secret of the installation
    When a program without the secret calls the Bosco tool "bosco_context"
    Then the Bosco tool is refused with the code 401
