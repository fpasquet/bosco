@RF-SESS-12
Feature: Sessions in a sandbox
  As the developer, I want a piloted session to run in a sandbox, isolated from my workstation, so that the agent
  works on a copy of the repository and its own branch, which I retrieve when I want.

  Background:
    Given the Claude Code profile ".claude-perso" has the transcript "session-labo-ia-bosco.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude-perso" has an access to the Claude subscription of "camille@exemple.dev"
    And Bosco watches the profiles ".claude-perso"

  @CA-SESS-106
  @CA-SESS-109
  Scenario: A session starts in a sandbox on its own branch, and its turns run in its container
    When I start a session in the repository "labo-ia" with the JSON "fixtures/pilot/start-sandbox.json"
    Then the response code should be 201
    And "the started session" should end its turn with "Reçu : Monte TypeScript en version 6 · mode acceptEdits · modèle défaut · effort défaut · images 0"
    And "the started session" should run in a sandbox on the branch "bosco/s-typescript-6" from "develop", "running"
    When I write to "the started session" with the JSON "fixtures/pilot/schema.json"
    Then "the started session" should end its turn with "Reçu : Vérifie aussi le schéma de config · mode acceptEdits · modèle défaut · effort défaut · images 0"

  @CA-SESS-106
  Scenario: The branch of a session is under the prefix of the sandboxes
    When I start a session in the repository "labo-ia" with the JSON "fixtures/pilot/start-sandbox-bad-branch.json"
    Then the response code should be 400
    And the response property "code" should equal "invalidSandboxBranch"

  @CA-SESS-110
  @CA-SESS-111
  Scenario: A stopped sandbox starts again with the next message, without losing the session
    When I start a session in the repository "labo-ia" with the JSON "fixtures/pilot/start-sandbox.json"
    And "the started session" should end its turn with "Reçu : Monte TypeScript en version 6 · mode acceptEdits · modèle défaut · effort défaut · images 0"
    And I stop the sandbox of "the started session"
    Then "the started session" should run in a sandbox on the branch "bosco/s-typescript-6" from "develop", "stopped"
    When I write to "the started session" with the JSON "fixtures/pilot/schema.json"
    Then "the started session" should run in a sandbox on the branch "bosco/s-typescript-6" from "develop", "running"

  @CA-SESS-108
  @CA-SESS-112
  Scenario: The branch is retrieved between two turns, and the refused exits are read
    When I start a session in the repository "labo-ia" with the JSON "fixtures/pilot/start-sandbox.json"
    And "the started session" should end its turn with "Reçu : Monte TypeScript en version 6 · mode acceptEdits · modèle défaut · effort défaut · images 0"
    And I retrieve the branch of "the started session"
    Then the response property "branch" should equal "bosco/s-typescript-6"
    When I read the refused exits of "the started session"
    Then the response property "refusals.0.host" should equal "raw.githubusercontent.com"

  @CA-SESS-114
  Scenario: A deleted sandbox no longer takes a message
    When I start a session in the repository "labo-ia" with the JSON "fixtures/pilot/start-sandbox.json"
    And "the started session" should end its turn with "Reçu : Monte TypeScript en version 6 · mode acceptEdits · modèle défaut · effort défaut · images 0"
    And I delete the sandbox of "the started session"
    Then the response code should be 204
    When I write to "the started session" with the JSON "fixtures/pilot/schema.json"
    Then the response code should be 409
    And the response property "code" should equal "sandboxRemoved"
