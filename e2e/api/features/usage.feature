@RF-SESS-18
Feature: Usage of the sessions
  As the developer, I want to know what my sessions consume, by day, project, model and profile, with what Bosco did,
  so that I see where the tokens of my subscription go without opening each session.

  Background:
    Given the Claude Code profile ".claude-perso" has the transcript "session-api-tarifs-usage.jsonl" for the session "d93b51f0"
    And the Claude Code profile ".claude-perso" has the transcript "session-creneaux-usage.jsonl" for the session "5b2d81e4"
    And the Claude Code profile ".claude-perso" has the transcript "session-sejours-usage.jsonl" for the session "8e14c2b7"
    And the folders "api-tarifs,site-clubs,creneaux,sejours" are projects
    And I send POST request to "/api/groups" with the JSON "fixtures/groups/clubs.json"
    And Bosco watches the profiles ".claude-perso"

  @CA-SESS-176
  @CA-SESS-178
  Scenario: The tokens of every turn add up, with the reuse of the cache and the cost at the public price
    When I send GET request to "/api/usage?period=all"
    Then the response code should be 200
    And the response property "since" should equal "2026-11-16"
    And the response property "tokens.input" should equal "6000"
    And the response property "tokens.output" should equal "11000"
    And the response property "tokens.cacheRead" should equal "250000"
    And the response property "tokens.cacheCreation" should equal "40000"
    And the response property "tokens.cacheReuse" should equal "97.7"
    And the response property "tokens.turnsWithoutCacheRead" should equal "40"
    And the response property "tokens.sessions" should equal "3"
    And the response property "tokens.turns" should equal "5"
    And the response property "tokens.costUsd" should equal "0.354"
    And the response property "tokens.unpricedModels" should equal "claude-nova-1"

  @CA-SESS-177
  Scenario: A pull request created by an agent counts once, found by its command and the address it gives
    When I send GET request to "/api/usage?period=all"
    Then the response property "activity.pullRequests" should equal "1"
    And the response property "activity.pilotedSessions" should equal "0"

  @CA-SESS-181
  Scenario: The cost splits by project, by model and by profile, the biggest first, a model without price unpriced
    When I send GET request to "/api/usage?period=all"
    Then the response property "byProject.0.label" should equal "creneaux"
    And the response property "byProject.0.share" should equal "74.9"
    And the response property "byProject.1.label" should equal "api-tarifs"
    And the response property "byModel.2.label" should equal "claude-nova-1"
    And the response property "byModel.2.usd" should equal "null"
    And the response property "byProfile.0.label" should equal "perso"

  @CA-SESS-182
  @CA-SESS-184
  Scenario: Filtered on a group, the page counts only the sessions of its projects
    When I send GET request to "/api/usage?period=all&group=2"
    Then the response property "tokens.sessions" should equal "2"
    And the response property "tokens.costUsd" should equal "0.354"
    And the response property "byProject.length" should equal "2"
    And the response property "byProject.1.label" should equal "api-tarifs"
    When I send GET request to "/api/usage?period=all&project=1&model=claude-sonnet-5-5"
    Then the response property "tokens.turns" should equal "3"
    And the response property "models" should equal "claude-sonnet-5-5"

  @CA-SESS-188
  Scenario: The subagents of a session count in its usage and cost, at their own price, with their share apart
    When I send GET request to "/api/usage?period=all"
    Then the response property "tokens.subagents.tokens" should equal "63000"
    And the response property "tokens.subagents.costUsd" should equal "0.057"
    And the response property "byOrigin.1.label" should equal "Sous-agents"
    And the response property "byOrigin.1.usd" should equal "0.057"
    When I send GET request to "/api/sessions/5b2d81e4"
    Then the response property "session.model" should equal "claude-opus-5-5"
    And the response property "session.subagents.tokens" should equal "63000"
    And the response property "session.subagents.usd" should equal "0.057"

  @CA-SESS-176
  Scenario: A period other than 7, 30 or 90 days, or since the start, is refused
    When I send GET request to "/api/usage?period=12"
    Then the response code should be 400
    And the response property "code" should equal "invalidRequest"
