@RF-TACH-05
Feature: Quota of the Claude subscription
  As the developer, I want the worker to leave room to my sessions in the quota of my Claude subscription, so that its
  tasks never use up the 5 h window or the week without me knowing.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-labo-ia-rag.jsonl" for the session "5e0a91c3"
    And Bosco watches the profiles ".claude" and ".claude-perso"

  @CA-CONT-99
  Scenario: The thresholds keep each wait under its stop, and apply to every task
    When I send GET request to "/api/quota"
    Then the response property "thresholds.fiveHour.wait" should equal "50"
    And the response property "thresholds.sevenDay.stop" should equal "90"
    When I send PUT request to "/api/quota/thresholds" with the JSON "fixtures/quota/equal-thresholds.json"
    Then the response code should be 400
    And the response property "code" should equal "invalidQuota"
    When I send PUT request to "/api/quota/thresholds" with the JSON "fixtures/quota/thresholds.json"
    Then the response property "thresholds.fiveHour.wait" should equal "60"

  @CA-TACH-99
  @CA-TACH-102
  Scenario: A ready task waits while the subscription is above its wait threshold
    Given the subscription of the worker is at 52 % of its 5 h window
    When I send POST request to "/api/tasks" with the JSON "fixtures/tasks/worker-task.json"
    And I ask the worker to check again
    Then the response property "waiting.1" should contain "Quota de l’abonnement : 5 h à 52 %"
    And the response property "quota.fiveHour" should equal "52"
    When I send GET request to "/api/tasks/1"
    Then the response property "state" should equal "queued"
