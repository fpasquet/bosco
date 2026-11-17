@RF-CONT-13
Feature: Running containers
  As the developer, I want to see what Bosco runs and what each part consumes, so that I can stop or restart what is
  stuck and know why the next task waits.

  Background:
    Given Bosco watches the profiles ".claude" and ".claude-perso"

  @CA-CONT-70
  @CA-CONT-75
  Scenario: Nothing runs, and the capacity of the worker is given
    When I send GET request to "/api/containers"
    Then the response code should be 200
    And the response property "totals.agents" should equal "0"
    And the response property "agents.length" should equal "0"
    And the response property "leftovers.length" should equal "0"
    And the response property "capacity.maxAgents" should equal "4"
    And the response property "unreachableSince" should equal "null"

  @CA-CONT-82
  Scenario: A new measure is taken on demand
    When I send POST request to "/api/containers/check"
    Then the response code should be 201
    And the response property "unreachableSince" should equal "null"
    And the response property "measuredAt" should not contain "null"

  @CA-CONT-74
  @CA-CONT-77
  Scenario: Only a running test service restarts, only a leftover container is removed
    When I send POST request to "/api/containers/bosco-t18/restart"
    Then the response code should be 404
    When I send DELETE request to "/api/containers/leftovers/bosco-t18"
    Then the response code should be 404
    When I send GET request to "/api/containers/bosco-t17-svc-database/logs"
    Then the response code should be 404
