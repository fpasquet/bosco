@RF-TACH-01
@RF-TACH-03
Feature: Tasks
  As the developer, I want to prepare work for Claude Code with its prerequisites and guardrails, so that it starts
  only when it can, within the limits of its repository.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-labo-ia-rag.jsonl" for the session "5e0a91c3"
    And Bosco watches the profiles ".claude" and ".claude-perso"

  @CA-TACH-19
  @CA-TACH-21
  @CA-TACH-22
  Scenario: A task is created in a repository of the watched sessions, and a following one waits for it
    When I send GET request to "/api/repositories"
    Then the response property "repositories.0.name" should equal "labo-ia"
    When I send POST request to "/api/tasks" with the JSON "fixtures/tasks/worker-task.json"
    Then the response code should be 201
    And the response property "id" should equal "1"
    And the response property "state" should equal "queued"
    And the response property "title" should equal "Ajoute un test du découpage des tableaux dans les PDF"
    When I send POST request to "/api/tasks" with the JSON "fixtures/tasks/following-task.json"
    Then the response property "state" should equal "blocked"
    And the response property "startFrom" should equal "1"

  @CA-TACH-27
  @CA-TACH-28
  @CA-TACH-29
  Scenario: A task over the limits of its repository is refused with every reason
    When I send POST request to "/api/tasks" with the JSON "fixtures/tasks/worker-task.json"
    And I send POST request to "/api/tasks/1/cancel"
    And I send POST request to "/api/tasks" with the JSON "fixtures/tasks/invalid-task.json"
    Then the response code should be 400
    And the response property "issues.0.field" should equal "budgetUsd"
    And the response property "issues.1.field" should equal "tools"
    And the response property "issues.2.field" should equal "prerequisites"

  @RF-TACH-07
  @CA-TACH-09
  Scenario: Cancelling a task fails the tasks that wait for it, in cascade
    When I send POST request to "/api/tasks" with the JSON "fixtures/tasks/worker-task.json"
    And I send POST request to "/api/tasks" with the JSON "fixtures/tasks/following-task.json"
    And I send GET request to "/api/tasks/1/cancellation"
    Then the response property "failing.0.id" should equal "2"
    When I send POST request to "/api/tasks/1/cancel"
    Then the response property "state" should equal "cancelled"
    When I send GET request to "/api/tasks/2"
    Then the response property "state" should equal "failed"
    And the response property "failure" should equal "Préalable T-1 annulée"
