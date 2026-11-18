@RF-SESS-05
@RF-SESS-10
Feature: History
  As the developer, I want to find any past session by a word, a project or a group, and see what each day cost, so
  that I find again the session I am looking for.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-maison-rag.jsonl" for the session "5e0a91c3"
    And the Claude Code profile ".claude-perso" has the transcript "session-maison-budget.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude-perso" has the transcript "session-site-perso-fastify.jsonl" for the session "a41f07c2"
    And Bosco watches the profiles ".claude" and ".claude-perso"
    And the folders "maison,site-perso" are projects

  @CA-SESS-49
  Scenario: The history lists the days from the newest, each with its total
    When I send GET request to "/api/history"
    Then the response code should be 200
    And the response property "days.length" should equal "2"
    And the response property "days.0.date" should equal "2026-11-06"
    And the response property "days.0.sessions.length" should equal "2"
    And the response property "days.1.sessions.0.id" should equal "a41f07c2"

  @CA-SESS-47
  @CA-SESS-48
  Scenario: A word of a message or of a command finds its session, and the filters add up
    When I send GET request to "/api/history?q=indexation"
    Then the response property "days.0.sessions.0.id" should equal "5e0a91c3"
    When I send GET request to "/api/history?q=migrate"
    Then the response property "days.0.sessions.0.id" should equal "c41e9a07"
    When I send GET request to "/api/history?q=migrate&project=site-perso"
    Then the response property "days.length" should equal "0"

  @CA-SESS-127
  Scenario: Filtered on a group, the history keeps the sessions of its projects and adds up with the other filters
    Given I send POST request to "/api/groups" with the JSON "fixtures/groups/perso.json"
    When I send GET request to "/api/history?group=2"
    Then the response property "days.length" should equal "1"
    And the response property "days.0.sessions.0.id" should equal "a41f07c2"
    When I send GET request to "/api/history?group=2&q=indexation"
    Then the response property "days.length" should equal "0"
