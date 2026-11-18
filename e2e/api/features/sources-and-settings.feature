@RF-SESS-02
@RF-SESS-08
Feature: Sources and settings
  As the developer, I want to stop reading a profile, set the inactivity threshold and choose whether Bosco notifies
  me, so that Bosco follows what I want and no more.

  Background:
    Given the Claude Code profile ".claude-perso" has the transcript "session-maison-budget.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude" has the transcript "session-site-perso-fastify.jsonl" for the session "a41f07c2"
    And Bosco watches the profiles ".claude" and ".claude-perso"

  @CA-SESS-59
  @CA-SESS-61
  Scenario: The settings start at 15 minutes with the desktop notification on, and accept 5 to 60 minutes
    When I send GET request to "/api/settings"
    Then the response property "inactivityMinutes" should equal "15"
    And the response property "desktopNotifications" should equal "true"
    When I send PUT request to "/api/settings" with the JSON "fixtures/settings-30-minutes.json"
    Then the response code should be 200
    And the response property "inactivityMinutes" should equal "30"
    When I send PUT request to "/api/settings" with the JSON "fixtures/settings-4-minutes.json"
    Then the response code should be 400

  @CA-SESS-56
  Scenario: A source switched off is no longer read, and nothing is erased
    When I switch off the source of the profile ".claude"
    Then the response property "watched" should equal "false"
    Given the Claude Code profile ".claude" has the transcript "session-maison-rag.jsonl" for the session "5e0a91c3"
    When I send GET request to "/api/sessions"
    Then the response property "sessions.length" should equal "2"
    When I switch on the source of the profile ".claude"
    And I send GET request to "/api/sessions"
    Then the response property "sessions.length" should equal "3"

  @CA-SESS-61
  Scenario: A new wait sends a desktop notification, unless it is switched off
    Given the Claude Code profile ".claude-perso" has the settings "fixtures/settings-perso.json"
    When I install live tracking for the profile ".claude-perso"
    And Claude Code sends the hook "fixtures/hooks/stop.json" of the profile ".claude-perso"
    Then the desktop notifications should be:
      | title             | body                                                                                         |
      | Question · maison | <b>Specs du tableau de bord Bosco</b>\nLe digest est généré. Veux-tu que je lance les tests ? |
    When I send PUT request to "/api/settings" with the JSON "fixtures/settings-no-notifications.json"
    And Claude Code sends the hook "fixtures/hooks/permission-request.json" of the profile ".claude-perso" without waiting
    Then the desktop notifications should be:
      | title             | body                                                                                         |
      | Question · maison | <b>Specs du tableau de bord Bosco</b>\nLe digest est généré. Veux-tu que je lance les tests ? |

  @RF-SESS-01
  Scenario: Another configuration folder of Claude Code is added as a source, and read
    Given the Claude Code profile ".claude-pro" has the transcript "session-maison-rag.jsonl" for the session "5e0a91c3"
    When I send POST request to "/api/sources/folder" with the JSON "fixtures/add-pro-folder.json"
    Then the response code should be 201
    And the response property "label" should equal "pro"
    And the response property "watched" should equal "true"
    When I send GET request to "/api/sessions"
    Then the response property "sessions.length" should equal "3"
    When I send POST request to "/api/sources/folder" with the JSON "fixtures/add-pro-folder.json"
    Then the response code should be 409
    And the response property "code" should equal "sourceAlreadyKnown"

  @RF-SESS-01
  Scenario: A folder that is not a configuration folder of Claude Code is refused
    Given the folder "maison" is a project
    When I send POST request to "/api/sources/folder" with the JSON "fixtures/add-maison-folder.json"
    Then the response code should be 400
    And the response property "code" should equal "notAProfile"
