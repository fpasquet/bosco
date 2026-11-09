@RF-SESS-08
Feature: Notifications
  As the developer, I want Bosco to notify me only when a question waits for me or a piece of work is done, so that
  a quick back and forth with an agent does not interrupt me.

  Background:
    Given the Claude Code profile ".claude-perso" has the settings "fixtures/settings-perso.json"
    And the Claude Code profile ".claude-perso" has the transcript "session-labo-ia-bosco.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude" has the transcript "session-labo-ia-rag.jsonl" for the session "5e0a91c3"
    And Bosco watches the profiles ".claude" and ".claude-perso"
    And I install live tracking for the profile ".claude-perso"

  @CA-SESS-84
  Scenario: A quick turn without a question does not notify, unless every turn is wanted
    When Claude Code sends the hook "fixtures/hooks/user-prompt-submit.json" of the profile ".claude-perso"
    And Claude Code sends the hook "fixtures/hooks/stop-done.json" of the profile ".claude-perso"
    Then the desktop notifications should be:
      | title | body |
    When I send PUT request to "/api/settings" with the JSON "fixtures/notifications-every-turn.json"
    And Claude Code sends the hook "fixtures/hooks/user-prompt-submit.json" of the profile ".claude-perso"
    And Claude Code sends the hook "fixtures/hooks/stop-done.json" of the profile ".claude-perso"
    Then the desktop notifications should be:
      | title                         | body                                                                             |
      | Fin de tour · 0 min · labo-ia | <b>Specs du tableau de bord Bosco</b>\nLe digest est généré et les tests passent. |

  @CA-SESS-83
  @CA-SESS-87
  @CA-SESS-88
  Scenario: A question and a permission wait in the notifications, until they are answered or read
    When Claude Code sends the hook "fixtures/hooks/stop.json" of the profile ".claude-perso"
    And Claude Code sends the hook "fixtures/hooks/permission-request.json" of the profile ".claude-perso" without waiting
    And I send GET request to "/api/notifications"
    Then the response property "unread" should equal "2"
    And the response property "notifications.0.kind" should equal "permission"
    And the response property "notifications.0.excerpt" should equal "Bash · npm run db:migrate"
    And the response property "notifications.1.kind" should equal "turn-question"
    When I answer the permission of the session "c41e9a07" with the JSON "fixtures/allow.json"
    And I send GET request to "/api/notifications"
    Then the response property "notifications.0.settled" should equal "Autorisé dans Bosco"
    When I send POST request to "/api/notifications/read" with the JSON "fixtures/read-all.json"
    And I send GET request to "/api/notifications"
    Then the response property "unread" should equal "0"
    And the response property "notifications.length" should equal "2"

  @CA-SESS-86
  Scenario: With Bosco in front, the notification stays in Bosco instead of the desktop
    When I send POST request to "/api/presence" with the JSON "fixtures/foreground.json"
    And Claude Code sends the hook "fixtures/hooks/stop.json" of the profile ".claude-perso"
    Then the desktop notifications should be:
      | title | body |
    And the event stream receives "notification.created" with:
      | inApp | true |

  @CA-SESS-83
  Scenario: A worker task to review notifies, and leaves the work to do once validated
    When I send POST request to "/api/tasks" with the JSON "fixtures/tasks/worker-task.json"
    Then the task 1 should become "to_review"
    When I send GET request to "/api/notifications"
    Then the response property "notifications.0.kind" should equal "review"
    And the response property "notifications.0.taskId" should equal "1"
    When I send POST request to "/api/tasks/1/validate" with the JSON "fixtures/review/without-pull-request.json"
    And I send GET request to "/api/notifications"
    Then the response property "notifications.0.settled" should equal "Validée"
