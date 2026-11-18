@RF-CONT-16
@RF-CONT-18
@RF-CONT-25
Feature: Projects
  As the developer, I want each git repository where a session ran to become a project by itself, and my other folders
  proposed to me, so that I see all my work by project without Bosco making up a project out of my home folder.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-maison-budget.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude" has the transcript "session-site-perso-dependances.jsonl" for the session "a41f07c2"
    And the Claude Code profile ".claude" has the transcript "session-maison-worktree.jsonl" for the session "9b3c51f0"
    And the Claude Code profile ".claude" has the transcript "session-home-notes.jsonl" for the session "e7d2b410"
    And the Claude Code profile ".claude" has the transcript "session-notes-clubs.jsonl" for the session "b52e18d3"
    And Bosco watches the profiles ".claude"

  @CA-CONT-177
  @CA-CONT-180
  @CA-CONT-122
  Scenario: Each git repository where a session ran is a project by itself, a worktree with its origin
    When I send GET request to "/api/projects"
    Then the response property "projects" should match the names "maison,site-perso"
    And the response property "projects.0.sessions" should equal "2"
    And the response property "projects.0.pinned" should equal "false"
    And the response property "outside" should equal "2"

  @CA-CONT-178
  @CA-CONT-122
  Scenario: A folder without git is proposed, not adopted, and the home folder is neither
    When I send GET request to "/api/projects"
    Then the response property "suggestions" should match the names "notes-clubs"
    And the response property "suggestions.0.sessions" should equal "1"
    And the response property "suggestions.0.git" should equal "false"
    When I send GET request to "/api/sessions/e7d2b410"
    Then the response property "session.project" should equal "null"

  @CA-CONT-110
  @CA-CONT-119
  Scenario: Folders added at once become projects, without git too, and their sessions leave the outside
    Given the home folder has the folders:
      | folder   | git |
      | archives | no  |
    When I send POST request to "/api/projects" with the JSON "fixtures/projects/add-notes-clubs-and-archives.json"
    Then the response code should be 201
    When I send GET request to "/api/projects"
    Then the response property "projects" should match the names "maison,notes-clubs,site-perso,archives"
    And the response property "projects.1.git" should equal "false"
    And the response property "outside" should equal "1"
    When I send GET request to "/api/sessions/c41e9a07"
    Then the response property "session.project.name" should equal "maison"
    And the response property "session.project.folder" should equal "packages/budget"

  @CA-CONT-111
  Scenario: A worktree goes with its project, a session outside of every project has none
    Given the folder "maison" is a project
    When I send GET request to "/api/sessions/9b3c51f0"
    Then the response property "session.project.name" should equal "maison"
    And the response property "session.branch" should equal "worktree-fix-ui"
    When I send GET request to "/api/sessions/e7d2b410"
    Then the response property "session.project" should equal "null"

  @CA-CONT-116
  Scenario: A folder inside a project becomes a project too, and its sessions go to the deepest
    Given the folder "maison" is a project
    When I send POST request to "/api/projects" with the JSON "fixtures/projects/add-maison-budget.json"
    And I send GET request to "/api/sessions/c41e9a07"
    Then the response property "session.project.name" should equal "budget"
    And the response property "session.project.folder" should equal ""
    When I send GET request to "/api/sessions/9b3c51f0"
    Then the response property "session.project.name" should equal "maison"

  @CA-CONT-112
  Scenario: An ignored suggestion is no longer proposed and is found again among the ignored ones
    When I send POST request to "/api/projects/suggestions/ignore" with the JSON "fixtures/projects/notes-clubs.json"
    And I send GET request to "/api/projects"
    Then the response property "suggestions.length" should equal "0"
    And the response property "ignored" should match the names "notes-clubs"
    When I send POST request to "/api/projects/suggestions/restore" with the JSON "fixtures/projects/notes-clubs.json"
    And I send GET request to "/api/projects"
    Then the response property "ignored.length" should equal "0"
    And the response property "suggestions" should match the names "notes-clubs"

  @CA-CONT-112
  Scenario: A suggestion added becomes a project, and its sessions join it
    When I send POST request to "/api/projects" with the JSON "fixtures/projects/add-notes-clubs.json"
    And I send GET request to "/api/sessions/b52e18d3"
    Then the response property "session.project.name" should equal "notes-clubs"

  @RF-CONT-21
  @CA-CONT-179
  Scenario: A removed project leaves its sessions outside and its folder ignored, until it is no longer ignored
    When I send DELETE request to "/api/projects/{{project:maison}}"
    Then the response code should be 204
    When I send GET request to "/api/sessions/c41e9a07"
    Then the response property "session.project" should equal "null"
    When I send GET request to "/api/projects"
    Then the response property "projects" should match the names "site-perso"
    And the response property "ignored" should match the names "maison"
    When I send POST request to "/api/projects/suggestions/restore" with the JSON "fixtures/projects/maison.json"
    And I send GET request to "/api/projects"
    Then the response property "projects" should match the names "maison,site-perso"
    And the response property "ignored.length" should equal "0"

  Scenario: A folder already added, a relative path and a missing folder are refused
    Given the folder "maison" is a project
    When I send POST request to "/api/projects" with the JSON "fixtures/projects/add-maison.json"
    Then the response code should be 409
    When I send POST request to "/api/projects" with the JSON "fixtures/projects/add-relative.json"
    Then the response code should be 400
    When I send POST request to "/api/projects" with the JSON "fixtures/projects/add-missing.json"
    Then the response code should be 404

  @CA-CONT-153
  @CA-CONT-125
  Scenario: A project gives its page, and is pinned to the sidebar then unpinned without being removed
    When I send GET request to "/api/projects/{{project:maison}}"
    Then the response property "name" should equal "maison"
    And the response property "pinned" should equal "false"
    And the response property "running" should equal "0"
    When I send PATCH request to "/api/projects/{{project:maison}}" with the JSON "fixtures/projects/pin.json"
    Then the response property "pinned" should equal "true"
    When I send PATCH request to "/api/projects/{{project:maison}}" with the JSON "fixtures/projects/unpin.json"
    And I send GET request to "/api/projects"
    Then the response property "projects" should match the names "maison,site-perso"
    And the response property "projects.0.pinned" should equal "false"

  @CA-CONT-127
  Scenario: A project keeps where its sessions run and their start branch, never a sandbox without git
    Given the home folder has the folders:
      | folder     | git |
      | api-tarifs | yes |
    And the folders "api-tarifs,notes-clubs" are projects
    When I send PATCH request to "/api/projects/{{project:api-tarifs}}" with the JSON "fixtures/projects/sandbox-from-release.json"
    Then the response property "place" should equal "sandbox"
    And the response property "startBranch" should equal "release/2026.11"
    When I send PATCH request to "/api/projects/{{project:notes-clubs}}" with the JSON "fixtures/projects/sandbox-from-release.json"
    Then the response property "place" should equal "workstation"
    When I send GET request to "/api/pilot/options"
    Then the response property "projects.2.place" should equal "sandbox"
    And the response property "projects.2.startBranch" should equal "release/2026.11"
    When I send PATCH request to "/api/projects/{{project:api-tarifs}}" with the JSON "fixtures/projects/bad-branch.json"
    Then the response code should be 400
    And the response property "code" should equal "invalidStartBranch"

  @RF-CONT-16
  Scenario: A monorepo is a single project, marked as such
    Given the folder "maison" has the file "turbo.json"
    And the folders "maison,site-perso" are projects
    When I send GET request to "/api/projects"
    Then the response property "projects" should match the names "maison,site-perso"
    And the response property "projects.0.monorepo" should equal "true"
    And the response property "projects.1.monorepo" should equal "false"
