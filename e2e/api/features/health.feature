@NF-13
Feature: Service health
  The service answers on the loopback only: nothing outside the workstation reaches it before a phone is paired.

  Scenario: The service answers on the loopback
    When I send GET request to "/api/health"
    Then the response code should be 200
    And the response should match snapshot

  Scenario: The service is not reachable from the other network interfaces
    When I try to reach the service on each non-loopback interface
    Then every connection is refused
