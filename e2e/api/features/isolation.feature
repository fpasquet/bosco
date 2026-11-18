@RF-CONT-07
Feature: Sandbox isolation
  As the developer, I want the agents of my sandboxes to reach only the domains I allow, and to choose the Claude
  subscription they use, so that a session cannot send my code anywhere else.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-site-perso-fastify.jsonl" for the session "a41f07c2"
    And the Claude Code profile ".claude-perso" has the transcript "session-maison-budget.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude" has an access to the Claude subscription of "camille@exemple.dev"
    And the Claude Code profile ".claude-perso" has an access to the Claude subscription of "camille.perso@exemple.dev"
    And Bosco watches the profiles ".claude" and ".claude-perso"
    And the folders "maison,site-perso" are projects

  @CA-REGL-10
  Scenario: The default domains are locked, and the limits of each sandbox are shown
    When I send GET request to "/api/isolation"
    Then the response property "domains.locked" should equal "api.anthropic.com,claude.ai,platform.claude.com,registry.npmjs.org,registry.yarnpkg.com"
    And the response property "limits.processes" should equal "512"
    When I send DELETE request to "/api/isolation/domains/claude.ai"
    Then the response code should be 400

  @CA-REGL-10
  Scenario: A domain is added by name, then removed in one click
    When I send POST request to "/api/isolation/domains" with the JSON "fixtures/isolation/pypi.json"
    Then the response property "domains.added" should equal "pypi.org"
    When I send DELETE request to "/api/isolation/domains/pypi.org"
    Then the response property "domains.added.length" should equal "0"

  @CA-REGL-10
  Scenario: An address is not a domain
    When I send POST request to "/api/isolation/domains" with the JSON "fixtures/isolation/url.json"
    Then the response code should be 400
    And the response property "message" should equal "Un nom de domaine seul, sans protocole ni chemin : pypi.org ou *.github.com."

  Scenario: The default subscription is chosen among the watched profiles, and a new session takes it
    When I send GET request to "/api/isolation"
    Then the response property "subscription.account" should equal "camille@exemple.dev"
    When I send PUT request to "/api/isolation/subscription" with the JSON "fixtures/isolation/perso-profile.json"
    Then the response property "subscription.account" should equal "camille.perso@exemple.dev"
    When I send GET request to "/api/pilot/defaults"
    Then the response property "profile.value" should contain ".claude-perso"
    And the response property "profile.origin.level" should equal "defaultProfile"

  @CA-CONT-42
  Scenario: A paired phone reads the isolation settings but cannot change them
    Given phone access is enabled
    And a pairing code is shown on the workstation
    When the phone enters the code
    And the phone opens "/api/isolation"
    Then the phone gets the code 200
    When the phone sends POST request to "/api/isolation/domains"
    Then the phone gets the code 403
