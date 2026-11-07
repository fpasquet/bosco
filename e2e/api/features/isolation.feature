@RF-CONT-07
Feature: Worker isolation
  As the developer, I want the agents of the worker to reach only the domains I allow, and to see what they were
  refused, so that a task cannot send my code anywhere else.

  Background:
    Given Bosco watches the profiles ".claude" and ".claude-perso"

  @CA-CONT-43
  Scenario: The default domains are locked
    When I send GET request to "/api/isolation"
    Then the response property "domains.locked" should equal "api.anthropic.com,claude.ai,platform.claude.com,registry.npmjs.org,registry.yarnpkg.com"
    When I send DELETE request to "/api/isolation/domains/claude.ai"
    Then the response code should be 400

  @CA-CONT-44
  Scenario: A domain is added by name, then removed in one click
    When I send POST request to "/api/isolation/domains" with the JSON "fixtures/isolation/pypi.json"
    Then the response property "domains.added" should equal "pypi.org"
    When I send DELETE request to "/api/isolation/domains/pypi.org"
    Then the response property "domains.added.length" should equal "0"

  @CA-CONT-44
  Scenario: An address is not a domain
    When I send POST request to "/api/isolation/domains" with the JSON "fixtures/isolation/url.json"
    Then the response code should be 400
    And the response property "message" should equal "Un nom de domaine seul, sans protocole ni chemin : pypi.org ou *.github.com."

  @CA-CONT-45
  Scenario: A refused domain is listed with its task, and leaves the list once allowed
    Given the proxy of the task 12 refused "pypi.org"
    When I send GET request to "/api/isolation"
    Then the response property "refusals.0.host" should equal "pypi.org"
    And the response property "refusals.0.taskId" should equal "12"
    When I send POST request to "/api/isolation/domains" with the JSON "fixtures/isolation/pypi.json"
    Then the response property "refusals.length" should equal "0"

  @CA-CONT-40
  @CA-CONT-41
  Scenario: The agent ceiling is set here, and the limits of each agent are shown
    When I send PUT request to "/api/isolation/capacity" with the JSON "fixtures/isolation/one-agent.json"
    Then the response property "capacity.maxAgents" should equal "1"
    And the response property "limits.processes" should equal "512"
    When I ask the worker to check again
    Then the response property "capacity" should equal "1"

  @CA-CONT-42
  Scenario: A paired phone reads the isolation settings but cannot change them
    Given phone access is enabled
    And a pairing code is shown on the workstation
    When the phone enters the code
    And the phone opens "/api/isolation"
    Then the phone gets the code 200
    When the phone sends POST request to "/api/isolation/domains"
    Then the phone gets the code 403
