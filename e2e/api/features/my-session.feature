@RF-TACH-01
Feature: Tasks for my session
  As the developer, I want an interactive Claude Code session to take the next task of its repository, so that I can
  follow the work under my eyes and still review it in Bosco.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-labo-ia-rag.jsonl" for the session "5e0a91c3"
    And Bosco watches the profiles ".claude" and ".claude-perso"

  Scenario: A session takes the next task of its repository, reports a step and finishes it
    When I send POST request to "/api/tasks" with the JSON "fixtures/tasks/session-task.json"
    Then the task 1 should become "awaiting_session"
    When a Claude Code session in "labo-ia/packages/rag" calls the Bosco tool "bosco_next_task"
    Then the Bosco tool answers "Tâche T-1 : Relis le découpage des tableaux et note ce qui manque"
    And the task 1 should become "running"
    When the session calls the Bosco tool "bosco_report_step" with:
      | task_id | 1                              |
      | step    | Lecture du découpage terminée. |
    And the session calls the Bosco tool "bosco_finish_task" with:
      | task_id | 1                                           |
      | report  | Il manque le cas d'un tableau sans en-tête. |
    Then the task 1 should become "to_review"
    When I send GET request to "/api/tasks/1"
    Then the response property "outcome.report" should equal "Il manque le cas d'un tableau sans en-tête."

  Scenario: A session elsewhere finds no task, and a session can prepare one
    When I send POST request to "/api/tasks" with the JSON "fixtures/tasks/session-task.json"
    And a Claude Code session in "ailleurs" calls the Bosco tool "bosco_next_task"
    Then the Bosco tool answers "Aucune tâche « Ma session » n’attend dans ce dépôt."
    When the session calls the Bosco tool "bosco_create_task" with:
      | path        | labo-ia                      |
      | instruction | Ajoute un test du découpage. |
    Then the Bosco tool answers "T-2 créée dans labo-ia"
    When I send GET request to "/api/tasks/2"
    Then the response property "createdBy" should equal "session"

  Scenario: The MCP server of Bosco requires the secret of the installation
    When a program without the secret calls the Bosco tool "bosco_next_task"
    Then the Bosco tool is refused with the code 401
