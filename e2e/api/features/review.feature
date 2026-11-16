@RF-TACH-06
Feature: Task review
  As the developer, I want to read what an agent changed before validating its task, so that only reviewed work goes
  on, as a draft PR when I want one, and an agent I ask for a correction picks up its work where it left it.

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

  @CA-TACH-72
  Scenario: The draft PR is opened with the GitHub account of the repository
    When I send PUT request to "/api/rights/repositories/labo-ia" with the JSON "fixtures/review/ask.json"
    And I send PUT request to "/api/rights/repositories/labo-ia/accounts" with the JSON "fixtures/rights/labo-ia-github.json"
    And I send POST request to "/api/tasks/1/validate" with the JSON "fixtures/review/with-pull-request.json"
    Then the response property "task.outcome.pullRequest" should equal "https://github.com/camille-pro/depot/pull/50"

  Scenario: By default, validating pushes nothing
    When I send POST request to "/api/tasks/1/validate" with the JSON "fixtures/review/with-pull-request.json"
    Then the response property "task.state" should equal "validated"
    And the response property "task.outcome.pullRequest" should equal "null"

  @CA-TACH-89
  @RF-TACH-10
  Scenario: A message to the agent of a task to review resumes it on the same branch
    When I send POST request to "/api/tasks/1/resume" with the JSON "fixtures/review/resume.json"
    Then the task 1 should become "to_review"
    When I send GET request to "/api/tasks/1"
    Then the response property "outcome.turns" should equal "28"
    And the response property "outcome.branch" should equal "bosco/t-1-ajoute-un-test-du-decoupage-des-tableaux"
    And the response property "outcome.report" should equal "Fait : Ajoute aussi un tableau vide."

  @CA-TACH-90
  Scenario: A resume asks for a message, and keeps the budget under the cap of the repository
    When I send POST request to "/api/tasks/1/resume" with the JSON "fixtures/review/resume-over-cap.json"
    Then the response code should be 400
    And the response property "issues.0.field" should equal "budgetUsd"

  @CA-TACH-91
  Scenario: A rejected task is abandoned, and a reason is required
    When I send POST request to "/api/tasks/1/reject" with the JSON "fixtures/review/reject-empty.json"
    Then the response code should be 400
    When I send POST request to "/api/tasks/1/reject" with the JSON "fixtures/review/reject.json"
    Then the response property "state" should equal "rejected"
