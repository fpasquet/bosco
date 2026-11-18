@RF-REGL-05
@RF-REGL-06
Feature: Data of Bosco
  As the developer, I want to choose how much of the history Bosco imports and to reset Bosco, so that it holds the
  sessions I want and can start over without touching the files of Claude Code.

  Background:
    Given the Claude Code profile ".claude-perso" has the transcript "session-maison-budget.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude-perso" has the transcript "session-site-perso-dependances.jsonl" for the session "a41f07c2"
    And the transcript of the session "a41f07c2" was last modified 40 days ago
    And Bosco watches the profiles ".claude-perso"
    And the folders "maison,site-perso" are projects

  @CA-REGL-28
  Scenario: The data tab gives the imported period, the sessions, the older ones and the database
    When I send GET request to "/api/data"
    Then the response code should be 200
    And the response should match snapshot except for "home, database.bytes, database.dataDir, history.oldestSessionAt"

  @CA-REGL-29
  Scenario: The whole history reads the older sessions in the background, also for a profile added later
    Given the Claude Code profile ".claude-pro" has the transcript "session-maison-recettes.jsonl" for the session "5e0a91c3"
    And the transcript of the session "5e0a91c3" was last modified 50 days ago
    When I send PUT request to "/api/data/history" with the JSON "fixtures/data/history-all.json"
    Then the response code should be 200
    And the response property "history.period" should equal "all"
    And Bosco should read the session "a41f07c2"
    When I send POST request to "/api/sources/folder" with the JSON "fixtures/add-pro-folder.json"
    Then Bosco should read the session "5e0a91c3"

  @CA-REGL-29
  Scenario: Going back to the last 30 days keeps the sessions already imported
    Given I send PUT request to "/api/data/history" with the JSON "fixtures/data/history-all.json"
    And Bosco should read the session "a41f07c2"
    When I send PUT request to "/api/data/history" with the JSON "fixtures/data/history-30-days.json"
    Then the response property "history.period" should equal "30-days"
    And the response property "history.sessions" should equal "2"

  @CA-REGL-30
  Scenario: The reset is refused without the confirmation word
    When I send POST request to "/api/reset" with the JSON "fixtures/data/reset-wrong.json"
    Then the response code should be 400
    And the response property "code" should equal "resetNotConfirmed"
    When I send GET request to "/api/sessions"
    Then the response property "sessions.length" should equal "1"

  @CA-REGL-31
  Scenario: The reset erases what Bosco kept, takes back what it installed and brings back the first launch
    Given the Claude Code profile ".claude-perso" has the settings "fixtures/settings-perso.json"
    And I install live tracking for the profile ".claude-perso"
    When I send POST request to "/api/reset" with the JSON "fixtures/data/reset-confirm.json"
    Then the response code should be 204
    And the settings of the profile ".claude-perso" should equal "fixtures/settings-perso.json"
    And the profile ".claude-perso" should lack the MCP server of Bosco
    And the transcript of the session "c41e9a07" should still be in its profile
    When I send GET request to "/api/sources"
    Then the response property "sources.length" should equal "0"
    And the response property "candidates.length" should equal "1"
    When I send GET request to "/api/projects"
    Then the response property "projects.length" should equal "0"

  @CA-REGL-31
  Scenario: After a reset, the profiles chosen again are read from the start
    Given I send POST request to "/api/reset" with the JSON "fixtures/data/reset-confirm.json"
    When I send POST request to "/api/sources" with the JSON "fixtures/watch-perso-profile.json"
    Then the response code should be 201
    And Bosco should read the session "c41e9a07"

  @CA-REGL-28
  @CA-REGL-31
  @RF-REGL-02
  Scenario: A paired phone reads the data of Bosco but can neither change the period nor reset Bosco
    Given phone access is enabled
    And a pairing code is shown on the workstation
    When the phone enters the code
    And the phone opens "/api/data"
    Then the phone gets the code 200
    When the phone sends PUT request to "/api/data/history"
    Then the phone gets the code 403
    When the phone sends POST request to "/api/reset"
    Then the phone gets the code 403
