@RF-CONT-16
@RF-CONT-18
Feature: Chosen projects
  As the developer, I want my sessions filed under the folders I chose as projects, and the other folders where a
  session ran proposed to me, so that Bosco never makes up a project out of my home folder or a throwaway folder.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-labo-ia-bosco.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude" has the transcript "session-api-voix-fastify.jsonl" for the session "a41f07c2"
    And the Claude Code profile ".claude" has the transcript "session-labo-ia-worktree.jsonl" for the session "9b3c51f0"
    And the Claude Code profile ".claude" has the transcript "session-home-notes.jsonl" for the session "e7d2b410"
    And the home folder has the folders:
      | folder | git |
      | notes  | no  |
    And Bosco watches the profiles ".claude"

  @CA-CONT-109
  @CA-CONT-120
  @CA-CONT-121
  @CA-CONT-122
  Scenario: Without a project, nothing is discovered: every session is outside and its folder proposed
    When I send GET request to "/api/projects"
    Then the response property "projects.length" should equal "0"
    And the response property "outside" should equal "4"
    And the response property "suggestions.length" should equal "3"
    And the response property "suggestions.0.name" should equal "labo-ia"
    And the response property "suggestions.0.sessions" should equal "2"
    And the response property "suggestions.0.git" should equal "true"

  @CA-CONT-110
  @CA-CONT-119
  Scenario: Folders added at once become projects, without git too, and their sessions leave the outside
    When I send POST request to "/api/projects" with the JSON "fixtures/projects/add-labo-ia-and-notes.json"
    Then the response code should be 201
    When I send GET request to "/api/projects"
    Then the response property "projects" should match the names "labo-ia,notes"
    And the response property "projects.0.sessions" should equal "2"
    And the response property "projects.1.git" should equal "false"
    And the response property "outside" should equal "2"
    When I send GET request to "/api/sessions/c41e9a07"
    Then the response property "session.project.name" should equal "labo-ia"
    And the response property "session.project.folder" should equal "packages/bosco"

  @CA-CONT-111
  Scenario: A worktree goes with its project, a session outside of every project has none
    Given the folder "labo-ia" is a project
    When I send GET request to "/api/sessions/9b3c51f0"
    Then the response property "session.project.name" should equal "labo-ia"
    And the response property "session.branch" should equal "worktree-fix-ui"
    When I send GET request to "/api/sessions/e7d2b410"
    Then the response property "session.project" should equal "null"

  @CA-CONT-116
  Scenario: A folder inside a project becomes a project too, and its sessions go to the deepest
    Given the folder "labo-ia" is a project
    When I send POST request to "/api/projects" with the JSON "fixtures/projects/add-labo-ia-bosco.json"
    And I send GET request to "/api/sessions/c41e9a07"
    Then the response property "session.project.name" should equal "bosco"
    And the response property "session.project.folder" should equal ""
    When I send GET request to "/api/sessions/9b3c51f0"
    Then the response property "session.project.name" should equal "labo-ia"

  @CA-CONT-112
  Scenario: An ignored suggestion is no longer proposed and is found again among the ignored ones
    When I send POST request to "/api/projects/suggestions/ignore" with the JSON "fixtures/projects/api-voix.json"
    And I send GET request to "/api/projects"
    Then the response property "suggestions.length" should equal "2"
    And the response property "suggestions.1.name" should not contain "api-voix"
    And the response property "ignored" should match the names "api-voix"
    When I send POST request to "/api/projects/suggestions/restore" with the JSON "fixtures/projects/api-voix.json"
    And I send GET request to "/api/projects"
    Then the response property "ignored.length" should equal "0"

  @CA-CONT-112
  Scenario: A suggestion added becomes a project, and its sessions join it
    When I send POST request to "/api/projects" with the JSON "fixtures/projects/add-api-voix.json"
    And I send GET request to "/api/sessions/a41f07c2"
    Then the response property "session.project.name" should equal "api-voix"

  @RF-CONT-21
  @CA-CONT-133
  Scenario: A removed project leaves its sessions outside, its folder proposed again, and the workstation untouched
    Given the folder "labo-ia" is a project
    When I send DELETE request to "/api/projects/1"
    Then the response code should be 204
    When I send GET request to "/api/sessions/c41e9a07"
    Then the response property "session.project" should equal "null"
    When I send GET request to "/api/projects"
    Then the response property "suggestions.0.name" should equal "labo-ia"
    When I send DELETE request to "/api/projects/1"
    Then the response code should be 404

  Scenario: A folder already added, a relative path and a missing folder are refused
    Given the folder "labo-ia" is a project
    When I send POST request to "/api/projects" with the JSON "fixtures/projects/add-labo-ia.json"
    Then the response code should be 409
    When I send POST request to "/api/projects" with the JSON "fixtures/projects/add-relative.json"
    Then the response code should be 400
    When I send POST request to "/api/projects" with the JSON "fixtures/projects/add-missing.json"
    Then the response code should be 404
