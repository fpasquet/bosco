@RF-SESS-05
@RF-SESS-10
Feature: History and costs
  As the developer, I want to find any past session by a word and see what each day cost, so that I know where the
  budget goes.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-labo-ia-rag.jsonl" for the session "5e0a91c3"
    And the Claude Code profile ".claude-perso" has the transcript "session-labo-ia-bosco.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude-perso" has the transcript "session-api-voix-fastify.jsonl" for the session "a41f07c2"
    And Bosco watches the profiles ".claude" and ".claude-perso"

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
    When I send GET request to "/api/history?q=migrate&repo=api-voix"
    Then the response property "days.length" should equal "0"

  @CA-SESS-52
  Scenario: The costs of a period are estimates, averaged on the working days
    When I send GET request to "/api/history/costs?from=2026-11-02"
    Then the response code should be 200
    And the response property "sessions" should equal "2"
    And the response property "byRepository.0.name" should equal "labo-ia"
