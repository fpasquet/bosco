@RF-TACH-06
Feature: Task review
  As the developer, I want to read what an agent changed before validating its task, so that only reviewed work goes
  on, as a draft PR when I want one, and a rejected task can start again with my reason.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-labo-ia-rag.jsonl" for the session "5e0a91c3"
    And Bosco watches the profiles ".claude" and ".claude-perso"
    And I send POST request to "/api/tasks" with the JSON "fixtures/tasks/worker-task.json"
    And the task 1 should become "to_review"

  Scenario: The changes of the branch are read from its starting point
    When I send GET request to "/api/tasks/1/changes"
    Then the response property "files.0.path" should equal "lexique/sigles.json"
    When I send GET request to "/api/tasks/1/review"
    Then the response property "pullRequest" should equal "never"
    And the response property "commits" should equal "2"

  Scenario: A repository set to ask opens a draft PR when it is asked for
    When I send PUT request to "/api/rights/repositories/labo-ia" with the JSON "fixtures/review/ask.json"
    And I send POST request to "/api/tasks/1/validate" with the JSON "fixtures/review/with-pull-request.json"
    Then the response property "task.state" should equal "validated"
    And the response property "task.outcome.pullRequest" should equal "https://github.com/exemple/depot/pull/50"

  Scenario: By default, validating pushes nothing
    When I send POST request to "/api/tasks/1/validate" with the JSON "fixtures/review/with-pull-request.json"
    Then the response property "task.state" should equal "validated"
    And the response property "task.outcome.pullRequest" should equal "null"

  Scenario: A task rejected with a reason starts again from its branch
    When I send POST request to "/api/tasks/1/reject" with the JSON "fixtures/review/reject-relaunch.json"
    Then the task 1 should become "to_review"
    When I send GET request to "/api/tasks/1"
    Then the response property "instruction" should contain "Relecture : Ajoute aussi un tableau vide."

  Scenario: A task rejected for good, and a reason is required
    When I send POST request to "/api/tasks/1/reject" with the JSON "fixtures/review/reject-empty.json"
    Then the response code should be 400
    When I send POST request to "/api/tasks/1/reject" with the JSON "fixtures/review/reject.json"
    Then the response property "state" should equal "rejected"
