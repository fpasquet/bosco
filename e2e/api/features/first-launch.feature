@RF-SESS-01
Feature: Profiles at first launch
  As the developer, I want Bosco to propose the Claude Code profiles of my workstation and read only the ones I choose,
  so that nothing is read without my consent.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-labo-ia-rag.jsonl" for the session "5e0a91c3"
    And the Claude Code profile ".claude-perso" has the transcript "session-labo-ia-bosco.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude-perso" has the transcript "session-api-voix-fastify.jsonl" for the session "a41f07c2"
    And the transcript of the session "a41f07c2" was last modified 40 days ago

  @CA-SESS-01
  @CA-SESS-02
  Scenario: The profiles are proposed with a preview, and no session is read
    When I send GET request to "/api/sources"
    Then the response code should be 200
    And the response should match snapshot except for "home, candidates.0.lastSessionAt, candidates.1.lastSessionAt"
    When I send GET request to "/api/sessions"
    Then the response should match snapshot

  @CA-SESS-03
  Scenario: Only the chosen profiles are read, over the last 30 days
    When I send POST request to "/api/sources" with the JSON "fixtures/watch-perso-profile.json"
    Then the response code should be 201
    And the response should match snapshot except for "sources.0.id, sources.1.id"
    When I send GET request to "/api/sessions"
    Then the response should match snapshot except for "sessions.0.sourceId"

  @CA-SESS-27
  Scenario: The detail of a session gives its feed in order
    When I send POST request to "/api/sources" with the JSON "fixtures/watch-perso-profile.json"
    And I send GET request to "/api/sessions/c41e9a07"
    Then the response code should be 200
    And the response should match snapshot except for "session.sourceId"
    When I send GET request to "/api/sessions/unknown"
    Then the response code should be 404

  @CA-SESS-73
  Scenario: The conversation of a session gives its replies and its tools with their results
    When I send POST request to "/api/sources" with the JSON "fixtures/watch-perso-profile.json"
    And I send GET request to "/api/sessions/c41e9a07/conversation"
    Then the response code should be 200
    And the response should match snapshot
    When I send GET request to "/api/sessions/unknown/conversation"
    Then the response code should be 404
