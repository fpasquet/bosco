@RF-SESS-03
Feature: Live tracking
  As the developer, I want Bosco to follow my sessions through the Claude Code hooks, so that it knows when a session
  waits for me and lets me answer a permission from Bosco or from the terminal, the first answer winning.

  Background:
    Given the Claude Code profile ".claude-perso" has the settings "fixtures/settings-perso.json"
    And the Claude Code profile ".claude-perso" has the transcript "session-labo-ia-bosco.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude" has the transcript "session-labo-ia-rag.jsonl" for the session "5e0a91c3"
    And Bosco watches the profiles ".claude" and ".claude-perso"

  @CA-SESS-62
  @CA-SESS-63
  Scenario: Live tracking is added to the settings of a profile, then removed
    When I install live tracking for the profile ".claude-perso"
    Then the response code should be 200
    And the response property "installed" should equal "true"
    And the settings of the profile ".claude-perso" should call Bosco on 6 events
    When I uninstall live tracking for the profile ".claude-perso"
    Then the response property "installed" should equal "false"
    And the settings of the profile ".claude-perso" should equal "fixtures/settings-perso.json"

  Scenario: A hook without the secret of the installation is refused
    When I install live tracking for the profile ".claude-perso"
    And Claude Code sends the hook "fixtures/hooks/stop.json" of the profile ".claude-perso" without the secret
    Then the response code should be 403

  @CA-SESS-05
  Scenario: A session waits after its turn until the next message
    When I install live tracking for the profile ".claude-perso"
    And Claude Code sends the hook "fixtures/hooks/stop.json" of the profile ".claude-perso"
    Then the response code should be 200
    When I send GET request to "/api/sessions"
    Then the response property "sessions.0.state" should equal "waiting"
    And the response property "sessions.0.waiting.kind" should equal "turn"
    And the response property "sessions.0.waiting.message" should equal "Le digest est généré. Veux-tu que je lance les tests ?"
    When Claude Code sends the hook "fixtures/hooks/user-prompt-submit.json" of the profile ".claude-perso"
    And I send GET request to "/api/sessions"
    Then the response property "sessions.0.state" should equal "running"

  @CA-SESS-06
  @CA-SESS-35
  Scenario: A permission allowed in Bosco answers the hook for this command only
    When I install live tracking for the profile ".claude-perso"
    And Claude Code sends the hook "fixtures/hooks/permission-request.json" of the profile ".claude-perso" without waiting
    And I send GET request to "/api/sessions"
    Then the response property "sessions.0.waiting.tool" should equal "Bash"
    And the response property "sessions.0.waiting.detail" should equal "npm run db:migrate"
    When I answer the permission of the session "c41e9a07" with the JSON "fixtures/allow.json"
    Then the response code should be 204
    And the pending response code should be 200
    And the response property "hookSpecificOutput.decision.behavior" should equal "allow"
    And the event stream receives "permission.settled" with:
      | sessionId | c41e9a07 |
      | outcome   | allowed  |

  @CA-SESS-34
  Scenario: A refusal sends its reason to the agent
    When I install live tracking for the profile ".claude-perso"
    And Claude Code sends the hook "fixtures/hooks/permission-request.json" of the profile ".claude-perso" without waiting
    And I answer the permission of the session "c41e9a07" with the JSON "fixtures/deny-with-reason.json"
    Then the pending response code should be 200
    And the response property "hookSpecificOutput.decision.behavior" should equal "deny"
    And the response property "hookSpecificOutput.decision.message" should equal "La personne a refusé cette commande depuis Bosco. Motif : Pas de migration avant la revue du schéma."

  @CA-SESS-07
  @CA-SESS-33
  Scenario: A permission answered in the terminal first can no longer be answered in Bosco
    When I install live tracking for the profile ".claude-perso"
    And Claude Code sends the hook "fixtures/hooks/permission-request.json" of the profile ".claude-perso" without waiting
    And Claude Code gives up the pending hook
    Then the event stream receives "permission.settled" with:
      | sessionId | c41e9a07  |
      | outcome   | elsewhere |
    When I answer the permission of the session "c41e9a07" with the JSON "fixtures/allow.json"
    Then the response code should be 409
