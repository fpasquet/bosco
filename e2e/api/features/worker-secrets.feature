@RF-CONT-05
@RF-CONT-12
Feature: Secrets of the worker tasks
  As the developer, I want to choose the Claude subscription and the npm access that the worker tasks receive, so
  that they install from my private registries and count against the subscription I chose.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-api-voix-fastify.jsonl" for the session "a41f07c2"
    And the Claude Code profile ".claude-perso" has the transcript "session-labo-ia-bosco.jsonl" for the session "c41e9a07"
    And Bosco watches the profiles ".claude" and ".claude-perso"

  @CA-CONT-67
  Scenario: The worker takes the Claude subscription of the chosen profile, only one that has an access
    Given the Claude Code profile ".claude" has an access to the Claude subscription of "camille@exemple.dev"
    When I send GET request to "/api/isolation"
    Then the response property "secrets.claude.account" should equal "camille@exemple.dev"
    And the response property "secrets.claude.available" should equal "true"
    When I send PUT request to "/api/isolation/secrets" with the JSON "fixtures/isolation/perso-profile.json"
    Then the response code should be 400
    Given the Claude Code profile ".claude-perso" has an access to the Claude subscription of "camille.perso@exemple.dev"
    When I send PUT request to "/api/isolation/secrets" with the JSON "fixtures/isolation/perso-profile.json"
    Then the response code should be 200
    And the response property "secrets.claude.account" should equal "camille.perso@exemple.dev"

  @CA-CONT-68
  Scenario: The .npmrc of the workstation goes to the tasks, its registries are allowed, never its tokens shown
    When I send GET request to "/api/isolation"
    Then the response property "secrets.npmrc.exists" should equal "false"
    And the response property "secrets.npmrc.path" should equal "~/.npmrc"
    Given the workstation has the npm settings "npmrc"
    When I send PUT request to "/api/isolation/secrets" with the JSON "fixtures/isolation/relative-npmrc.json"
    Then the response code should be 400
    When I send GET request to "/api/isolation"
    Then the response property "secrets.npmrc.exists" should equal "true"
    And the response property "secrets.npmrc.registries.0.scope" should equal "@interne"
    And the response property "domains.registries" should equal "npm.registre.exemple.dev"
    And the response should not contain "jeton-de-lecture"

  @CA-CONT-69
  Scenario: The default GitHub account is the active one of GitHub CLI, or one chosen among the connected ones
    When I send GET request to "/api/isolation"
    Then the response property "secrets.github.account" should equal "camille-dev"
    And the response property "secrets.github.choices" should equal "camille-dev,camille-pro"
    When I send PUT request to "/api/isolation/secrets" with the JSON "fixtures/isolation/github-unknown.json"
    Then the response code should be 400
    When I send PUT request to "/api/isolation/secrets" with the JSON "fixtures/isolation/github-pro.json"
    Then the response property "secrets.github.account" should equal "camille-pro"

  @CA-TACH-72
  Scenario: A repository takes its own Claude subscription and GitHub account, or comes back to the defaults
    Given the Claude Code profile ".claude" has an access to the Claude subscription of "camille@exemple.dev"
    And the Claude Code profile ".claude-perso" has an access to the Claude subscription of "camille.perso@exemple.dev"
    When I send GET request to "/api/rights?repository=api-voix"
    Then the response property "accounts.claude.effective.account" should equal "camille@exemple.dev"
    And the response property "accounts.github.origin" should equal "général"
    When I send PUT request to "/api/rights/repositories/api-voix/accounts" with the JSON "fixtures/rights/api-voix-accounts.json"
    Then the response property "accounts.claude.effective.account" should equal "camille.perso@exemple.dev"
    And the response property "accounts.claude.origin" should equal "dépôt"
    And the response property "accounts.github.effective" should equal "camille-dev"
    And the response property "accounts.github.origin" should equal "dépôt"
