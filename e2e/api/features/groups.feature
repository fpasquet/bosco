@RF-CONT-19
@RF-CONT-20
@RF-CONT-21
Feature: Groups of projects
  As the developer, I want to gather my projects in groups, ordered with a principal one, and to write instructions
  that reach the agents of each of their projects, so that what holds for several projects is written once.

  Background:
    Given the folders "api-tarifs,creneaux,site-clubs" are projects

  @CA-CONT-113
  @CA-CONT-146
  @CA-CONT-147
  Scenario: A new group gathers the checked projects, the first as principal, without instructions and in the sidebar
    When I send POST request to "/api/groups" with the JSON "fixtures/groups/clubs.json"
    Then the response code should be 201
    And the response property "projects" should match the names "api-tarifs,creneaux,site-clubs"
    And the response property "instructions" should equal ""
    And the response property "sidebar" should equal "true"
    When I send POST request to "/api/groups" with the JSON "fixtures/groups/node-tarifs.json"
    And I send GET request to "/api/groups"
    Then the response should match snapshot

  @CA-CONT-145
  Scenario: A group name is unique, whatever its case, « Tous les projets » included
    Given I send POST request to "/api/groups" with the JSON "fixtures/groups/clubs.json"
    When I send POST request to "/api/groups" with the JSON "fixtures/groups/clubs-again.json"
    Then the response code should be 409
    And the response property "code" should equal "groupNameTaken"
    When I send POST request to "/api/groups" with the JSON "fixtures/groups/all-projects-name.json"
    Then the response code should be 409

  @CA-CONT-134
  Scenario: The order of the projects changes, the first becoming the principal
    Given I send POST request to "/api/groups" with the JSON "fixtures/groups/clubs.json"
    When I send PUT request to "/api/groups/2/projects" with the JSON "fixtures/groups/site-clubs-first.json"
    Then the response property "projects" should match the names "site-clubs,api-tarifs,creneaux"

  @CA-CONT-131
  Scenario: A removed project leaves its groups, and the next one becomes the principal
    Given I send POST request to "/api/groups" with the JSON "fixtures/groups/clubs.json"
    When I send DELETE request to "/api/projects/1"
    And I send GET request to "/api/groups/2"
    Then the response property "projects" should match the names "creneaux,site-clubs"

  @CA-CONT-138
  Scenario: A deleted group removes none of its projects
    Given I send POST request to "/api/groups" with the JSON "fixtures/groups/clubs.json"
    When I send DELETE request to "/api/groups/2"
    Then the response code should be 204
    When I send GET request to "/api/projects"
    Then the response property "projects.length" should equal "3"
    When I send GET request to "/api/groups/2"
    Then the response code should be 404

  @CA-CONT-137
  Scenario: A group hidden from the sidebar stays a group, with its default profile
    Given I send POST request to "/api/groups" with the JSON "fixtures/groups/clubs.json"
    When I send PATCH request to "/api/groups/2" with the JSON "fixtures/groups/hidden-pro.json"
    And I send GET request to "/api/groups"
    Then the response property "groups.0.sidebar" should equal "false"
    And the response property "groups.0.defaults.profile" should contain ".claude"

  @CA-CONT-140
  Scenario: The instructions keep one line per instruction, without the blank lines around them
    Given I send POST request to "/api/groups" with the JSON "fixtures/groups/clubs.json"
    When I send PUT request to "/api/groups/2/instructions" with the JSON "fixtures/groups/clubs-instructions.json"
    Then the response should match snapshot

  @CA-CONT-143
  Scenario: « Tous les projets » always holds every project and only has instructions
    When I send GET request to "/api/groups/1"
    Then the response property "projects" should match the names "api-tarifs,creneaux,site-clubs"
    And the response property "system" should equal "true"
    When I send PATCH request to "/api/groups/1" with the JSON "fixtures/groups/shown.json"
    Then the response code should be 400
    And the response property "code" should equal "allProjectsFixed"
    When I send DELETE request to "/api/groups/1"
    Then the response code should be 400

  @RF-CONT-24
  Scenario: The phone reads the groups, but changes none
    Given phone access is enabled
    And a pairing code is shown on the workstation
    When the phone enters the code
    And the phone opens "/api/groups"
    Then the phone gets the code 200
    When the phone sends POST request to "/api/groups"
    Then the phone gets the code 403
