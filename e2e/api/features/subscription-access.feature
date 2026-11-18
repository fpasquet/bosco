@RF-REGL-07
Feature: Access to the Claude subscription by a long-lived token
  As the developer, I want a profile I run with a long-lived token (claude setup-token) to be a Claude subscription like
  the others, so that I can start a session with it, without Bosco ever keeping the token.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-site-perso-dependances.jsonl" for the session "a41f07c2"
    And the Claude Code profile ".claude-ultra" has the transcript "session-maison-budget.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude" has an access to the Claude subscription of "camille@exemple.dev"
    And the folder "secrets" has a long-lived token in the file "ultra-token"
    And the folder "secrets" has an empty file "empty-token"
    And Bosco watches the profiles ".claude" and ".claude-ultra"
    And the folders "maison,site-perso" are projects

  @CA-REGL-32
  Scenario: A profile without login has no access until the file of its long-lived token is declared, then removed
    When I read the settings of the profile ".claude-ultra"
    Then the response property "access.kind" should equal "none"
    When I declare the file "secrets/ultra-token" as the long-lived token of the profile ".claude-ultra"
    Then the response code should be 200
    And the response property "access.kind" should equal "token"
    And the response property "access.tokenFile" should contain "secrets/ultra-token"
    And the response should not contain "sk-ant-oat01"
    When I remove the long-lived token of the profile ".claude-ultra"
    Then the response property "access.kind" should equal "none"
    When I read the settings of the profile ".claude"
    Then the response property "access.kind" should equal "login"

  @CA-REGL-32
  Scenario: A file that cannot hold a token is refused with its reason
    When I declare the file "secrets/empty-token" as the long-lived token of the profile ".claude-ultra"
    Then the response code should be 400
    And the response property "message" should equal "Le fichier du jeton est vide."
    When I declare the file "secrets/missing-token" as the long-lived token of the profile ".claude-ultra"
    Then the response code should be 400
    And the response property "message" should equal "Le fichier du jeton est introuvable."

  @CA-REGL-33
  Scenario: A profile without access is greyed in the new session, then offered once its token is declared
    When I send GET request to "/api/pilot/options"
    Then the response property "profiles.length" should equal "1"
    And the response property "unavailableProfiles.0.label" should equal "ultra"
    When I declare the file "secrets/ultra-token" as the long-lived token of the profile ".claude-ultra"
    And I send GET request to "/api/pilot/options"
    Then the response property "profiles.length" should equal "2"
    And the response property "profiles.1.access" should equal "token"
    And the response property "unavailableProfiles.length" should equal "0"
    When I send PUT request to "/api/isolation/subscription" with the JSON "fixtures/isolation/ultra-profile.json"
    Then the response property "subscription.access" should equal "token"
    And the response should not contain "sk-ant-oat01"

  @CA-REGL-33
  Scenario: Each turn of a session on a long-lived token receives it by its environment
    When I declare the file "secrets/ultra-token" as the long-lived token of the profile ".claude-ultra"
    And I start a session in the project "maison" with the JSON "fixtures/pilot/start-ultra.json"
    Then the response code should be 201
    And "the started session" should end its turn with "Reçu : Lis les catégories du budget · mode acceptEdits · modèle défaut · effort défaut · images 0 · jeton …7f3a"

  @CA-REGL-32
  Scenario: A paired phone reads the access of a profile but cannot declare a token
    Given phone access is enabled
    And a pairing code is shown on the workstation
    When the phone enters the code
    And the phone sends PUT request to "/api/sources/any/token"
    Then the phone gets the code 403
