@DT-39
Feature: Quota of the Claude subscription
  As the developer, I want my piloted sessions to leave room in the quota of my Claude subscription, so that a sandbox
  never uses up the 5 h window or the week without me knowing.

  Background:
    Given the Claude Code profile ".claude-perso" has the transcript "session-labo-ia-bosco.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude-perso" has an access to the Claude subscription of "camille@exemple.dev"
    And Bosco watches the profiles ".claude-perso"
    And the folder "labo-ia" is a project

  @CA-CONT-99
  Scenario: The thresholds keep each wait under its stop
    When I send GET request to "/api/quota"
    Then the response property "thresholds.fiveHour.wait" should equal "50"
    And the response property "thresholds.sevenDay.stop" should equal "90"
    And the response property "scope" should equal "sandbox"
    When I send PUT request to "/api/quota/thresholds" with the JSON "fixtures/quota/equal-thresholds.json"
    Then the response code should be 400
    And the response property "code" should equal "invalidQuota"
    When I send PUT request to "/api/quota/thresholds" with the JSON "fixtures/quota/thresholds.json"
    Then the response property "thresholds.fiveHour.wait" should equal "60"

  @CA-SESS-116
  Scenario: Above its wait threshold, the subscription starts no sandbox, and leaves the workstation alone
    Given the Claude subscription of ".claude-perso" is at 52 % of its 5 h window
    When I start a session in the project "labo-ia" with the JSON "fixtures/pilot/start-sandbox.json"
    Then the response code should be 409
    And the response property "code" should equal "quotaHeld"
    And the response property "message" should contain "Quota de l’abonnement : 5 h à 52 %"
    When I start a session in the project "labo-ia" with the JSON "fixtures/pilot/start-labo-ia.json"
    Then the response code should be 201

  @CA-SESS-117
  Scenario: The thresholds can hold the piloted sessions of the workstation too
    Given the Claude subscription of ".claude-perso" is at 52 % of its 5 h window
    When I send PUT request to "/api/quota/scope" with the JSON "fixtures/quota/all-sessions.json"
    Then the response property "scope" should equal "all"
    When I start a session in the project "labo-ia" with the JSON "fixtures/pilot/start-labo-ia.json"
    Then the response code should be 409
    And the response property "code" should equal "quotaHeld"
