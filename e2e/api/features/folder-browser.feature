@RF-CONT-17
Feature: Folder browser
  As the developer, I want to add projects by browsing the folders of my home folder, without typing a path, so that
  I choose them from the workstation while Bosco never shows me a file nor a hidden folder.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-api-voix-fastify.jsonl" for the session "a41f07c2"
    And the home folder has the folders:
      | folder            | git |
      | www/site-clubs    | yes |
      | www/site-tournois | yes |
      | www/archives      | no  |
      | www/.cache        | no  |
    And Bosco watches the profiles ".claude"

  @CA-CONT-114
  @CA-CONT-117
  Scenario: The browser starts at the home folder and shows its visible folders, git ones and suggestions marked
    When I browse the home folder
    Then the response should match snapshot

  @CA-CONT-114
  @CA-CONT-115
  @CA-CONT-117
  Scenario: A folder lists its subfolders only, by name, with the added ones marked and the way back up
    Given the folder "www/site-clubs" is a project
    When I browse the folder "www"
    Then the response should match snapshot

  @CA-CONT-114
  Scenario: A hidden folder and a folder outside of the home folder are not browsed
    When I browse the folder ".claude"
    Then the response code should be 400
    When I browse the folder "/etc"
    Then the response code should be 400
    When I browse the folder "www/nowhere"
    Then the response code should be 404

  @NF-13
  @RF-CONT-24
  Scenario: The phone reads the projects, but neither browses the workstation nor changes the projects
    Given phone access is enabled
    And a pairing code is shown on the workstation
    When the phone enters the code
    And the phone opens "/api/projects"
    Then the phone gets the code 200
    When the phone opens "/api/folders"
    Then the phone gets the code 403
    When the phone sends POST request to "/api/projects"
    Then the phone gets the code 403
