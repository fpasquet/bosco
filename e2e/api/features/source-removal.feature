@RF-REGL-04
Feature: Removing a source
  As the developer, I want to remove a Claude Code profile from the sources, so that Bosco forgets it and its
  sessions and takes back what it installed in it, without touching the files of Claude Code.

  Background:
    Given the Claude Code profile ".claude-perso" has the transcript "session-maison-budget.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude" has the transcript "session-site-perso-dependances.jsonl" for the session "a41f07c2"
    And the Claude Code profile ".claude" has an access to the Claude subscription of "camille@exemple.dev"
    And the Claude Code profile ".claude-perso" has an access to the Claude subscription of "camille.perso@exemple.dev"
    And Bosco watches the profiles ".claude" and ".claude-perso"

  @CA-REGL-24
  Scenario: The confirmation says what removing a profile would change
    Given the Claude Code profile ".claude-perso" has the settings "fixtures/settings-perso.json"
    And I install live tracking for the profile ".claude-perso"
    And I send PUT request to "/api/isolation/subscription" with the JSON "fixtures/isolation/perso-profile.json"
    When I read what removing the source of the profile ".claude-perso" would change
    Then the response code should be 200
    And the response should match snapshot
    When I send GET request to "/api/sources/unknown/removal"
    Then the response code should be 404

  @CA-REGL-25
  Scenario: A removed source is forgotten with its sessions, and its profile keeps its files without Bosco
    Given the Claude Code profile ".claude-perso" has the settings "fixtures/settings-perso.json"
    And I install live tracking for the profile ".claude-perso"
    When I remove the source of the profile ".claude-perso"
    Then the response code should be 204
    And the settings of the profile ".claude-perso" should equal "fixtures/settings-perso.json"
    And the profile ".claude-perso" should lack the MCP server of Bosco
    And the transcript of the session "c41e9a07" should still be in its profile
    When I send GET request to "/api/sessions"
    Then the response property "sessions.length" should equal "1"
    When I send GET request to "/api/sources"
    Then the response property "sources.length" should equal "1"

  @CA-REGL-25
  Scenario: Removing the last chosen profile brings back the first launch
    When I remove the source of the profile ".claude-perso"
    And I remove the source of the profile ".claude"
    And I send GET request to "/api/sources"
    Then the response property "sources.length" should equal "0"
    And the response property "candidates.length" should equal "2"

  @CA-REGL-26
  Scenario: The groups and the default subscription that took the removed profile take the default subscription
    Given the home folder has the folders:
      | folder     | git |
      | api-tarifs | yes |
      | site-clubs | yes |
      | creneaux   | yes |
    And the folders "api-tarifs,site-clubs,creneaux" are projects
    And I send POST request to "/api/groups" with the JSON "fixtures/groups/clubs.json"
    And I send PATCH request to "/api/groups/2" with the JSON "fixtures/groups/defaults-perso.json"
    And I send PUT request to "/api/isolation/subscription" with the JSON "fixtures/isolation/perso-profile.json"
    When I remove the source of the profile ".claude-perso"
    And I send GET request to "/api/isolation"
    Then the response property "subscription.account" should equal "camille@exemple.dev"
    When I send GET request to "/api/groups/2"
    Then the response property "defaults.profile" should equal "null"

  @CA-REGL-27
  Scenario: A removed profile added again is a new source, and its sessions are read again
    When I remove the source of the profile ".claude-perso"
    And I send POST request to "/api/sources/folder" with the JSON "fixtures/add-perso-folder.json"
    Then the response code should be 201
    And Bosco should read the session "c41e9a07"

  @CA-REGL-24
  @RF-REGL-02
  Scenario: A paired phone cannot remove a source
    Given phone access is enabled
    And a pairing code is shown on the workstation
    When the phone enters the code
    And the phone sends DELETE request to "/api/sources/any"
    Then the phone gets the code 403
