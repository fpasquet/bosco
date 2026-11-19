@RF-SESS-04
Feature: Piloted sessions
  As the developer, I want to start a session and write to it from Bosco, on the workstation or the phone, so that I
  can work with an agent without opening a terminal.

  Background:
    Given the Claude Code profile ".claude-perso" has the transcript "session-maison-budget.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude-perso" has an access to the Claude subscription of "camille@exemple.dev"
    And Bosco watches the profiles ".claude-perso"
    And the folder "maison" is a project

  @CA-SESS-92
  @CA-SESS-94
  @CA-SESS-155
  Scenario: A session starts in the project with the settings of the toolbar, then runs a turn per message
    When I start a session in the project "maison" with the JSON "fixtures/pilot/start-maison.json"
    Then the response code should be 201
    And "the started session" should end its turn with "Reçu : Lis les catégories du budget · mode acceptEdits · modèle claude-opus-5-5 · effort high · images 0"
    And "the started session" should be piloted with:
      | permissionMode | acceptEdits     |
      | model          | claude-opus-5-5 |
      | effort         | high            |
      | project        | maison          |
      | profile        | perso           |
    When I write to "the started session" with the JSON "fixtures/pilot/tests-with-image.json"
    Then the response property "status" should equal "sent"
    And "the started session" should end its turn with "Reçu : Et les tests · mode default · modèle défaut · effort défaut · images 1"

  @CA-SESS-93
  Scenario: A message sent during a turn waits for its end, a second one joins it, and Arrêter keeps it
    When I start a session in the project "maison" with the JSON "fixtures/pilot/start-long.json"
    And I write to "the started session" with the JSON "fixtures/pilot/recurring.json"
    Then the response property "status" should equal "queued"
    And "the started session" should be running with the pending message "Pense aux dépenses récurrentes"
    When I write to "the started session" with the JSON "fixtures/pilot/subscriptions.json"
    Then "the started session" should be running with the pending message "Pense aux dépenses récurrentes\n\nEt aux abonnements"
    When I cancel the pending message of "the started session"
    Then the response code should be 204
    And "the started session" should have no pending message
    When I write to "the started session" with the JSON "fixtures/pilot/recurring.json"
    And I stop the turn of "the started session"
    Then the response code should be 204
    And "the started session" should end its turn with "Reçu : Pense aux dépenses récurrentes · mode default · modèle défaut · effort défaut · images 0"

  @CA-SESS-95
  Scenario: A permission of a piloted session is answered in Bosco
    When I start a session in the project "maison" with the JSON "fixtures/pilot/start-permission.json"
    Then "the started session" should wait for the permission "npm run db:migrate"
    When I send GET request to "/api/notifications"
    Then the response property "notifications.0.kind" should equal "permission"
    When I allow the permission of "the started session"
    Then "the started session" should end its turn with "Migration lancée."

  @CA-SESS-191
  Scenario: Switching to full access during a turn allows the waiting permission and the next ones
    When I start a session in the project "maison" with the JSON "fixtures/pilot/start-two-permissions.json"
    Then "the started session" should wait for the permission "npm run db:migrate"
    When I switch "the started session" to the permission mode "bypassPermissions"
    Then "the started session" should end its turn with "Deux commandes lancées · mode bypassPermissions"

  @CA-SESS-96
  Scenario: A question of the agent is answered in Bosco, or skipped
    When I start a session in the project "maison" with the JSON "fixtures/pilot/start-question.json"
    Then "the started session" should ask the question "Quel correctif préfères-tu ?"
    When I answer the question of "the started session" with ""
    Then the response code should be 400
    When I answer the question of "the started session" with "Corriger les grilles de tarifs"
    Then the response code should be 204
    And "the started session" should end its turn with "Réponse reçue : Corriger les grilles de tarifs"
    When I write to "the started session" with the JSON "fixtures/pilot/start-question.json"
    Then "the started session" should ask the question "Quel correctif préfères-tu ?"
    When I skip the question of "the started session"
    Then "the started session" should end its turn with "Question passée."

  @CA-SESS-97
  Scenario: A closed session of a terminal resumes in Bosco by writing to it
    When I write to "c41e9a07" with the JSON "fixtures/pilot/resume.json"
    Then the response property "status" should equal "sent"
    And "c41e9a07" should end its turn with "Reçu : Reprends · mode plan · modèle défaut · effort défaut · images 0"

  @CA-SESS-51
  @CA-SESS-97
  Scenario: A session erased by Claude Code stays readable, but is not resumed
    Given Claude Code erased the transcript of the session "c41e9a07"
    When I write to "c41e9a07" with the JSON "fixtures/pilot/resume.json"
    Then the response code should be 409
    And the response property "code" should equal "sessionErased"
    When I send GET request to "/api/sessions/c41e9a07"
    Then the response code should be 200

  @CA-SESS-98
  Scenario: A session open in a terminal is answered in its terminal
    Given the session "c41e9a07" is open in a terminal of the profile ".claude-perso"
    When I send GET request to "/api/sessions/c41e9a07"
    Then the response property "session.openInTerminal" should equal "true"
    When I write to "c41e9a07" with the JSON "fixtures/pilot/resume.json"
    Then the response code should be 409
    And the response property "code" should equal "sessionOpenInTerminal"

  @CA-SESS-92
  Scenario: An empty message is refused
    When I write to "c41e9a07" with the JSON "fixtures/pilot/empty.json"
    Then the response code should be 400
    And the response property "code" should equal "invalidPilotMessage"

  @CA-SESS-99
  Scenario: The editor suggests the files of the project and the commands of the profile
    Given the folder "maison/packages/budget" has the files:
      | src/categories/categories.ts |
      | src/categories/depenses.ts   |
      | docs/categories.md           |
      | node_modules/x/categories.js |
    And the Claude Code profile ".claude-perso" has the skill "tdd" described as "Développer en commençant par les tests"
    When I send GET request to "/api/pilot/suggestions?kind=file&q=categ&session=c41e9a07"
    Then the suggestions should be "docs/categories.md, src/categories/categories.ts, src/categories/depenses.ts"
    When I send GET request to "/api/pilot/suggestions?kind=command&q=t&session=c41e9a07"
    Then the response property "suggestions.0.value" should equal "tdd"
    And the response property "suggestions.0.origin" should equal "skill · profil perso"

  @CA-CONT-132
  @CA-CONT-127
  @RF-CONT-21
  Scenario: A project is not removed while a session piloted by Bosco runs in it, and keeps where it ran
    When I start a session in the project "maison" with the JSON "fixtures/pilot/start-long.json"
    And I write to "the started session" with the JSON "fixtures/pilot/recurring.json"
    Then "the started session" should be running with the pending message "Pense aux dépenses récurrentes"
    When I send GET request to "/api/projects/1"
    Then the response property "running" should equal "1"
    And the response property "place" should equal "workstation"
    When I send DELETE request to "/api/projects/1"
    Then the response code should be 409
    And the response property "code" should equal "projectHasRunningSession"

  @CA-SESS-195
  @CA-SESS-196
  Scenario: A session on the workstation works on a worktree or another branch, and the project folder keeps its branch
    When I read the branches and worktrees of the project "maison"
    Then the response code should be 200
    And the response property "active" should equal "main"
    And the response property "worktrees.0.branch" should equal "feat/tarifs"
    And the response property "branches.0" should equal "develop"
    When I start a session in the project "maison" on the worktree ".claude/worktrees/tarifs"
    Then "the started session" should end its turn with "Reçu : Lis les catégories du budget · mode acceptEdits · modèle claude-opus-5-5 · effort high · images 0"
    And "the started session" should work in the folder ".claude/worktrees/tarifs" of "maison"
    When I start a session in the project "maison" on the branch "develop"
    Then "the started session" should end its turn with "Reçu : Lis les catégories du budget · mode acceptEdits · modèle claude-opus-5-5 · effort high · images 0"
    And "the started session" should work in the folder ".claude/worktrees/develop" of "maison"

  @CA-SESS-196
  Scenario: A branch the project does not have is refused
    When I start a session in the project "maison" on the branch "nope"
    Then the response code should be 400
    And the response property "code" should equal "invalidCheckout"
