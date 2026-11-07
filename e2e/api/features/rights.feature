@RF-TACH-05
Feature: Agent rights
  As the developer, I want to set what the agents may do in each repository, so that a task can tighten these rights
  but never exceed them.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-labo-ia-rag.jsonl" for the session "5e0a91c3"
    And Bosco watches the profiles ".claude" and ".claude-perso"

  Scenario: A repository without its own rights takes the general settings
    When I send GET request to "/api/rights?repository=labo-ia"
    Then the response property "effective.maxBudgetUsd" should equal "2"
    And the response property "origins.maxBudgetUsd" should equal "général"
    And the response property "effective.pullRequest" should equal "never"

  Scenario: A repository tightens a right, which then caps its tasks, and the denied tools add up
    When I send PUT request to "/api/rights/general" with the JSON "fixtures/rights/general-denied.json"
    And I send PUT request to "/api/rights/repositories/labo-ia" with the JSON "fixtures/rights/tighter-budget.json"
    Then the response property "effective.maxBudgetUsd" should equal "1"
    And the response property "origins.maxBudgetUsd" should equal "dépôt"
    And the response property "effective.deniedTools" should equal "Bash(curl:*),Bash(npm publish:*)"
    And the response property "origins.deniedTools" should equal "général + dépôt"
    When I send POST request to "/api/tasks" with the JSON "fixtures/tasks/worker-task.json"
    Then the response code should be 400
    And the response property "issues.0.field" should equal "budgetUsd"

  Scenario: A repository never exceeds the general settings, and comes back to them
    When I send PUT request to "/api/rights/repositories/labo-ia" with the JSON "fixtures/rights/higher-budget.json"
    Then the response code should be 400
    And the response property "message" should equal "Le budget du dépôt ne dépasse pas celui des réglages généraux."
    When I send PUT request to "/api/rights/repositories/labo-ia" with the JSON "fixtures/rights/tighter-budget.json"
    And I send PUT request to "/api/rights/repositories/labo-ia" with the JSON "fixtures/rights/general-budget.json"
    Then the response property "origins.maxBudgetUsd" should equal "général"
