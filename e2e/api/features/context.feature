@RF-CONT-01
@RF-CONT-02
@RF-CONT-03
Feature: Context of the agents
  As the developer, I want every agent to receive the accepted decisions of its repository and of the socles that
  apply to it, so that it works within what was decided, and an agent only proposes, never decides.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-labo-ia-rag.jsonl" for the session "5e0a91c3"
    And Bosco watches the profiles ".claude" and ".claude-perso"

  @CA-CONT-01
  @CA-CONT-25
  Scenario: The accepted decisions of the repository and of its socles are sent, an excepted one is left out
    When I send POST request to "/api/socles" with the JSON "fixtures/context/global-socle.json"
    And I send POST request to "/api/decisions" with the JSON "fixtures/context/socle-decision.json"
    And I send POST request to "/api/decisions" with the JSON "fixtures/context/exception.json"
    And I send GET request to "/api/context/preview?repository=labo-ia"
    Then the response property "text" should contain "DEC-2 Garder Jest pour les tests (fait exception à « Tests avec Vitest »)"
    And the response property "absent.excluded.0.id" should equal "1"
    When I send GET request to "/api/socles"
    Then the response property "socles.0.exceptions.0.repository" should equal "labo-ia"

  @CA-CONT-03
  @CA-CONT-06
  Scenario: A decision proposed by a session waits for a human, then is sent once accepted
    When the session calls the Bosco tool "bosco_propose_decision" with:
      | path     | labo-ia                                  |
      | title    | Normaliser les sigles                    |
      | context  | Les sigles arrivent avec ou sans points. |
      | decision | Retirer les points avant la recherche.   |
    Then the Bosco tool answers "DEC-1 proposée"
    When I send GET request to "/api/context/preview?repository=labo-ia"
    Then the response property "absent.proposed.0.id" should equal "1"
    When I send POST request to "/api/decisions/1/accept"
    And I send GET request to "/api/context/preview?repository=labo-ia"
    Then the response property "text" should contain "DEC-1 Normaliser les sigles"

  @CA-CONT-21
  @CA-CONT-22
  Scenario: An accepted decision changes with a note, and keeps its versions
    When I send POST request to "/api/decisions" with the JSON "fixtures/context/repository-decision.json"
    And I send POST request to "/api/decisions/1/versions" with the JSON "fixtures/context/version-without-note.json"
    Then the response code should be 400
    And the response property "message" should equal "Écris une note pour dire ce qui change."
    When I send POST request to "/api/decisions/1/versions" with the JSON "fixtures/context/version.json"
    Then the response property "versions.length" should equal "2"
    And the response property "versions.1.note" should equal "Les colonnes aussi"

  @CA-CONT-07
  Scenario: A worker agent receives the context at its launch, noted in the log of its task
    When I send POST request to "/api/decisions" with the JSON "fixtures/context/repository-decision.json"
    And I send POST request to "/api/tasks" with the JSON "fixtures/tasks/worker-task.json"
    Then the task 1 should become "to_review"
    When I send GET request to "/api/tasks/1"
    Then the response property "log.3.event" should equal "Contexte transmis"
    And the response property "log.3.detail" should equal "DEC-1 v1"

  Scenario: A socle never inherits from itself, even indirectly
    When I send POST request to "/api/socles" with the JSON "fixtures/context/global-socle.json"
    And I send POST request to "/api/socles" with the JSON "fixtures/context/node-socle.json"
    And I send PUT request to "/api/socles/1" with the JSON "fixtures/context/looping-socle.json"
    Then the response code should be 400
    And the response property "message" should equal "Un socle ne peut pas hériter de lui-même, même indirectement."
