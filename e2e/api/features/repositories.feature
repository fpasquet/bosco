Feature: Discovered repositories
  As the developer, I want Bosco to file my sessions under real git repositories, that I can narrow and hide, so that
  my home folder, throwaway folders and worktrees do not show up as repositories.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-labo-ia-bosco.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude" has the transcript "session-api-voix-fastify.jsonl" for the session "a41f07c2"
    And the Claude Code profile ".claude" has the transcript "session-labo-ia-worktree.jsonl" for the session "9b3c51f0"
    And the Claude Code profile ".claude" has the transcript "session-home-notes.jsonl" for the session "e7d2b410"
    And Bosco watches the profiles ".claude"

  @CA-SESS-77
  @CA-SESS-78
  Scenario: Only git repositories are found by default, a worktree with its origin, the most recent first
    When I send GET request to "/api/settings/repositories"
    Then the response property "repositories" should match the names "labo-ia,api-voix"
    And the response property "outside" should equal "1"
    And the response property "settings.excluded" should equal "/tmp"
    When I send GET request to "/api/sessions/9b3c51f0"
    Then the response property "session.repository.name" should equal "labo-ia"
    And the response property "session.branch" should equal "worktree-fix-ui"
    When I send GET request to "/api/sessions/e7d2b410"
    Then the response property "session.repository" should equal "null"

  @CA-SESS-77
  @CA-SESS-78
  Scenario: Without git only, the working folder counts; without attaching, a worktree counts on its own
    When I send PUT request to "/api/settings" with the JSON "fixtures/repositories/not-git-only.json"
    And I send PUT request to "/api/settings" with the JSON "fixtures/repositories/detached-worktrees.json"
    And I send GET request to "/api/settings/repositories"
    Then the response property "repositories.length" should equal "4"
    And the response property "repositories.3.name" should equal "fix-ui"
    And the response property "outside" should equal "0"

  @CA-SESS-79
  Scenario: Repository folders narrow the discovery, excluded folders win, and a relative path is refused
    When I send PUT request to "/api/settings" with the JSON "fixtures/repositories/labo-ia-only.json"
    And I send GET request to "/api/settings/repositories"
    Then the response property "repositories" should match the names "labo-ia"
    And the response property "outside" should equal "2"
    When I send PUT request to "/api/settings" with the JSON "fixtures/repositories/exclude-labo-ia.json"
    And I send GET request to "/api/settings/repositories"
    Then the response property "repositories.length" should equal "0"
    When I send PUT request to "/api/settings" with the JSON "fixtures/repositories/relative-root.json"
    Then the response code should be 400

  @CA-SESS-80
  @CA-SESS-81
  @CA-SESS-82
  Scenario: A hidden repository leaves the lists of the tasks, its sessions stay
    When I send GET request to "/api/repositories"
    Then the response property "repositories" should match the names "labo-ia,api-voix"
    When I send PUT request to "/api/settings" with the JSON "fixtures/repositories/hide-labo-ia.json"
    And I send GET request to "/api/repositories"
    Then the response property "repositories" should match the names "api-voix"
    When I send GET request to "/api/sessions/c41e9a07"
    Then the response property "session.repository.name" should equal "labo-ia"
    And the response property "session.repository.hidden" should equal "true"
    When I send GET request to "/api/settings/repositories"
    Then the response property "repositories" should match the names "labo-ia,api-voix"
