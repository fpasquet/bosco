@RF-CONT-13
Feature: Running containers
  As the developer, I want to see the sandboxes and the piloted turns that run, and what each one consumes, so that I
  know what weighs on my workstation.

  Background:
    Given Bosco watches the profiles ".claude" and ".claude-perso"

  @CA-CONT-70
  Scenario: Nothing runs
    When I send GET request to "/api/containers"
    Then the response code should be 200
    And the response property "totals.sandboxes" should equal "0"
    And the response property "sandboxes.length" should equal "0"
    And the response property "piloted.length" should equal "0"
    And the response property "unreachableSince" should equal "null"

  @CA-CONT-82
  Scenario: A new measure is taken on demand
    When I send POST request to "/api/containers/check"
    Then the response code should be 201
    And the response property "unreachableSince" should equal "null"
    And the response property "measuredAt" should not contain "null"
