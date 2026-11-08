@RF-CONT-08
Feature: Test environments
  As the developer, I want the worker to start the test services of a repository around its agent, so that the agent
  can run the tests, without publishing anything on my workstation.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-labo-ia-rag.jsonl" for the session "5e0a91c3"
    And Bosco watches the profiles ".claude" and ".claude-perso"
    And the repository "labo-ia" has the test services file "api-voix.yaml"

  @CA-CONT-49
  @CA-CONT-50
  @CA-CONT-51
  Scenario: In automatic mode, the services with an image are launched, but the application and node
    When I send GET request to "/api/repositories/labo-ia/test-environment"
    Then the response property "file" should equal "compose.yaml"
    And the response property "launched" should match the names "database,rabbitmq"
    And the response property "excluded.0.reason" should equal "c’est l’application elle-même"
    And the response property "excluded.1.reason" should equal "sert à lancer l’application"
    And the response property "removed" should equal "ports publiés,volumes nommés"

  @CA-CONT-50
  Scenario: Only the checked services are launched, or none
    When I send PUT request to "/api/repositories/labo-ia/test-environment" with the JSON "fixtures/test-environments/choose-rabbitmq.json"
    Then the response property "launched" should match the names "rabbitmq"
    When I send PUT request to "/api/repositories/labo-ia/test-environment" with the JSON "fixtures/test-environments/none.json"
    Then the response property "launched.length" should equal "0"

  @CA-CONT-54
  Scenario: The agent image is a name, never an option
    When I send PUT request to "/api/repositories/labo-ia/test-environment" with the JSON "fixtures/test-environments/bad-image.json"
    Then the response code should be 400
    When I send GET request to "/api/repositories/labo-ia/test-environment"
    Then the response property "defaultImage" should equal "bosco-agent:1"

  @CA-CONT-52
  Scenario: A worker task launches the services, then the last launch is kept
    When I send POST request to "/api/tasks" with the JSON "fixtures/tasks/worker-task.json"
    Then the task 1 should become "to_review"
    When I send GET request to "/api/repositories/labo-ia/test-environment"
    Then the response property "lastRun.taskId" should equal "1"
    And the response property "lastRun.launches" should match the names "database,rabbitmq"
