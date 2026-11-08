@RF-SESS-09
Feature: Bosco channel
  As the developer, I want to write from Bosco to a session open in a terminal, so that I can answer it from my phone
  without going back to its terminal.

  Background:
    Given the Claude Code profile ".claude-perso" has the transcript "session-labo-ia-bosco.jsonl" for the session "c41e9a07"
    And Bosco watches the profiles ".claude-perso"

  @CA-SESS-102
  Scenario: The channel installs in a profile and gives its launch command
    When I send GET request to "/api/channel/profiles"
    Then the response property "profiles.0.installed" should equal "false"
    And the response property "profiles.0.command" should equal "CLAUDE_CONFIG_DIR=~/.claude-perso claude --dangerously-load-development-channels server:bosco-channel"
    When I send POST request to "/api/channel/profiles" with the JSON "fixtures/pilot/install-channel-perso.json"
    Then the response code should be 204
    When I send GET request to "/api/channel/profiles"
    Then the response property "profiles.0.installed" should equal "true"

  @CA-SESS-101
  Scenario: A session open in a terminal with its channel receives the text written in Bosco
    Given the session "c41e9a07" is open in a terminal of the profile ".claude-perso"
    When I write to "c41e9a07" with the JSON "fixtures/pilot/resume.json"
    Then the response code should be 409
    Given the session "c41e9a07" has its Bosco channel open
    When I write to "c41e9a07" with the JSON "fixtures/pilot/channel-image.json"
    Then the response code should be 400
    When I write to "c41e9a07" with the JSON "fixtures/pilot/resume.json"
    Then the response property "status" should equal "channel"
    And the Bosco channel receives "Reprends"
