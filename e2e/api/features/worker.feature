@RF-TACH-05
@RF-CONT-06
Feature: Worker
  As the developer, I want the worker to run each ready task in its own disposable copy, so that I only have to review
  its branch, and nothing runs when the worker cannot.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-labo-ia-rag.jsonl" for the session "5e0a91c3"
    And Bosco watches the profiles ".claude" and ".claude-perso"

  @CA-TACH-32
  Scenario: A ready task is run by the worker, then waits for review with its outcome
    When I send POST request to "/api/tasks" with the JSON "fixtures/tasks/worker-task.json"
    Then the task 1 should become "to_review"
    When I send GET request to "/api/tasks/1"
    Then the response property "outcome.branch" should equal "bosco/t-1-ajoute-un-test-du-decoupage-des-tableaux"
    And the response property "outcome.turns" should equal "14"
    And the response property "outcome.changes.files" should equal "2"
    And the response property "outcome.report" should equal "Fait : Ajoute un test du découpage des tableaux dans les PDF. Suis le format des tests existants."

  @CA-TACH-14
  @CA-TACH-16
  Scenario: Without Docker the tasks wait with the reason, and leave once it answers again
    Given Docker does not answer
    When I send POST request to "/api/tasks" with the JSON "fixtures/tasks/worker-task.json"
    And I ask the worker to check again
    Then the response property "unavailable" should equal "Docker ne répond pas"
    And the response property "waiting.1" should equal "Worker indisponible"
    When I send GET request to "/api/tasks/1"
    Then the response property "state" should equal "queued"

  @RF-TACH-07
  Scenario: A running task stops when it is cancelled
    When I send POST request to "/api/tasks" with the JSON "fixtures/tasks/worker-task.json"
    Then the task 1 should become "running"
    When I send POST request to "/api/tasks/1/cancel"
    Then the task 1 should become "cancelled"
