@RF-SESS-16
@RF-SESS-17
@RF-REGL-03
@RF-CONT-22
Feature: Session defaults and permission modes
  As the developer, I want to set once the profile, the permissions, the model and the effort of a session, for a
  profile, a project or a group, so that each new session starts as I want and says where each value comes from.

  Background:
    Given the Claude Code profile ".claude-perso" has the transcript "session-labo-ia-bosco.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude-perso" has an access to the Claude subscription of "camille@exemple.dev"
    And Bosco watches the profiles ".claude-perso"
    And the home folder has the folders:
      | folder     | git |
      | api-tarifs | yes |
      | site-clubs | yes |
      | creneaux   | yes |
    And the folders "api-tarifs,site-clubs,creneaux" are projects
    And I send POST request to "/api/groups" with the JSON "fixtures/groups/clubs.json"

  @CA-SESS-157
  @CA-SESS-164
  @CA-CONT-168
  @CA-CONT-170
  Scenario: A session started with a group takes the mode of the group, the model and the effort of its principal project
    Given I send PATCH request to "/api/projects/1" with the JSON "fixtures/projects/defaults-sonnet-high.json"
    And I send PATCH request to "/api/groups/2" with the JSON "fixtures/groups/defaults-auto.json"
    When I send GET request to "/api/pilot/defaults?group=2"
    Then the response should match snapshot
    When I start a session in the project "api-tarifs" with the JSON "fixtures/pilot/start-club.json"
    Then "the started session" should end its turn with "Reçu : Affiche les tarifs sur chaque page de club · mode auto · modèle claude-sonnet-5-5 · effort high · images 0 · dossiers ajoutés site-clubs, creneaux avec leurs instructions"

  @CA-SESS-160
  Scenario: A choice made for the session wins over every default
    Given I send PATCH request to "/api/groups/2" with the JSON "fixtures/groups/defaults-auto.json"
    When I start a session in the project "api-tarifs" with the JSON "fixtures/pilot/start-club-plan.json"
    Then "the started session" should end its turn with "Reçu : Affiche les tarifs sur chaque page de club · mode plan · modèle défaut · effort low · images 0 · dossiers ajoutés site-clubs, creneaux avec leurs instructions"

  @CA-REGL-17
  @CA-REGL-19
  @CA-REGL-20
  @CA-REGL-21
  Scenario: A profile keeps its defaults in Bosco, over what its Claude Code settings say, without touching them
    Given the Claude Code profile ".claude-perso" has the settings "fixtures/settings-claude-sonnet.json"
    And I send PATCH request to "/api/groups/2" with the JSON "fixtures/groups/defaults-perso.json"
    When I set the defaults of the profile ".claude-perso" with the JSON "fixtures/profile-defaults-accept.json"
    Then the response should match snapshot except for "source.id"
    And the settings of the profile ".claude-perso" should equal "fixtures/settings-claude-sonnet.json"
    When I start a session in the project "api-tarifs" with the JSON "fixtures/pilot/start-defaults.json"
    Then "the started session" should end its turn with "Reçu : Lis les grilles de tarifs · mode acceptEdits · modèle claude-sonnet-5-5 · effort medium · images 0"

  @CA-REGL-19
  Scenario: A profile without settings in Bosco reads those of its Claude Code profile, with their origin
    Given the Claude Code profile ".claude-perso" has the settings "fixtures/settings-claude-sonnet.json"
    When I send GET request to "/api/pilot/defaults?project={{profiles}}/api-tarifs"
    Then the response property "permissionMode.value" should equal "plan"
    And the response property "permissionMode.origin.level" should equal "claudeProfile"
    And the response property "model.value" should equal "claude-sonnet-5-5"
    When I read the settings of the profile ".claude-perso"
    Then the response property "defaults.permissionMode" should equal "null"
    And the response property "claude.effort" should equal "medium"

  @CA-SESS-161
  @CA-SESS-162
  @CA-SESS-165
  Scenario: In a sandbox, the edits pass when no level sets the mode, and a mode set by the group wins without confirmation
    When I send GET request to "/api/pilot/defaults?project={{profiles}}/api-tarifs&sandbox=true"
    Then the response property "permissionMode.value" should equal "acceptEdits"
    And the response property "permissionMode.origin.level" should equal "sandbox"
    Given I send PATCH request to "/api/groups/2" with the JSON "fixtures/groups/defaults-full-access.json"
    When I send GET request to "/api/pilot/defaults?group=2&sandbox=true"
    Then the response property "permissionMode.value" should equal "bypassPermissions"
    And the response property "permissionMode.origin.level" should equal "group"

  @CA-SESS-166
  @CA-SESS-167
  Scenario: The mode, the model and the effort changed in the toolbar hold from the next turn, full access included
    When I start a session in the project "api-tarifs" with the JSON "fixtures/pilot/start-defaults.json"
    And "the started session" should end its turn with "Reçu : Lis les grilles de tarifs · mode default · modèle défaut · effort défaut · images 0"
    And I write to "the started session" with the JSON "fixtures/pilot/full-access.json"
    Then "the started session" should end its turn with "Reçu : Lance les tests · mode bypassPermissions · modèle claude-sonnet-5-5 · effort défaut · images 0"

  @CA-SESS-168
  Scenario: When Claude Code suspends auto mode after three refusals, the session says so and asks in Bosco again
    When I start a session in the project "api-tarifs" with the JSON "fixtures/pilot/start-auto-refusals.json"
    Then "the started session" should wait for the permission "rm -rf node_modules"
    And "the started session" should have auto mode suspended after 3 refusals in a row
