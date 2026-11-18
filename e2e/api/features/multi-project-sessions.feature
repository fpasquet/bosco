@RF-SESS-14
@RF-CONT-01
Feature: Sessions over several projects
  As the developer, I want a piloted session to run in a principal project and see other projects, on the workstation
  or in a sandbox, so that one agent can change an API and the sites that call it, with the context of each project.

  Background:
    Given the Claude Code profile ".claude-perso" has the transcript "session-labo-ia-bosco.jsonl" for the session "c41e9a07"
    And the Claude Code profile ".claude-perso" has an access to the Claude subscription of "camille@exemple.dev"
    And Bosco watches the profiles ".claude-perso"
    And the home folder has the folders:
      | folder      | git |
      | api-tarifs  | yes |
      | site-clubs  | yes |
      | creneaux    | yes |
      | notes-clubs | no  |
    And the folders "api-tarifs,site-clubs,creneaux,notes-clubs" are projects

  @CA-SESS-133
  @CA-SESS-163
  Scenario: A session runs in its principal project and sees the other projects, with their instructions, on each turn
    When I start a session in the project "api-tarifs" with the JSON "fixtures/pilot/start-three-projects.json"
    Then the response code should be 201
    And "the started session" should end its turn with "Reçu : Affiche les tarifs sur chaque page de club · mode acceptEdits · modèle défaut · effort défaut · images 0 · dossiers ajoutés site-clubs, creneaux avec leurs instructions"
    And "the started session" should see the other projects "site-clubs, creneaux"
    When I write to "the started session" with the JSON "fixtures/pilot/tarifs.json"
    Then "the started session" should end its turn with "Reçu : Et les heures creuses · mode acceptEdits · modèle défaut · effort défaut · images 0 · dossiers ajoutés site-clubs, creneaux avec leurs instructions"

  @CA-SESS-131
  Scenario: A project without git keeps the session out of the sandbox, naming the project
    When I start a session in the project "api-tarifs" with the JSON "fixtures/pilot/start-with-notes-sandbox.json"
    Then the response code should be 409
    And the response property "code" should equal "projectWithoutGit"
    And the response property "message" should contain "notes-clubs"

  @CA-SESS-136
  @CA-SESS-141
  Scenario: A sandbox copies each project on the same branch, and retrieves only the branches with work
    When I start a session in the project "api-tarifs" with the JSON "fixtures/pilot/start-three-projects-sandbox.json"
    And "the started session" should end its turn with "Reçu : Affiche les tarifs sur chaque page de club · mode acceptEdits · modèle défaut · effort défaut · images 0 · dossiers ajoutés site-clubs, creneaux avec leurs instructions"
    And I read the branches of "the started session"
    Then the response property "branches.length" should equal "3"
    And the response property "branches.2.project" should contain "creneaux"
    And the response property "branches.0.from" should equal "develop"
    And the response property "branches.1.from" should equal "main"
    And the response property "branches.1.files" should equal "0"
    When I retrieve the branch of "the started session"
    Then the response property "branches.length" should equal "1"
    And the response property "branches.0.project" should contain "api-tarifs"
    When I retrieve the branch of the project "creneaux" of "the started session"
    Then the response property "branches.0.branch" should equal "bosco/s-bloc-tarifs"

  @CA-SESS-128
  @CA-SESS-137
  @CA-CONT-128
  Scenario: The form gives each project its domains and the files a sandbox copy leaves on the workstation
    When I send POST request to "/api/projects/2/domains" with the JSON "fixtures/projects/domain.json"
    Then the response code should be 200
    And the response property "domains.0" should equal "paiement.exemple.dev"
    When I send GET request to "/api/pilot/options"
    Then the response property "projects.1.domains.0" should equal "paiement.exemple.dev"
    And the response property "projects.1.changes" should equal "3"

  @CA-CONT-108
  Scenario: A domain of a project is a name alone, kept once
    When I send POST request to "/api/projects/2/domains" with the JSON "fixtures/projects/domain-url.json"
    Then the response code should be 400
    And the response property "code" should equal "invalidProjectDomain"
    When I send POST request to "/api/projects/2/domains" with the JSON "fixtures/projects/domain.json"
    And I send POST request to "/api/projects/2/domains" with the JSON "fixtures/projects/domain.json"
    Then the response code should be 409
    And the response property "code" should equal "projectDomainTaken"
    When I send DELETE request to "/api/projects/2/domains/paiement.exemple.dev"
    Then the response property "domains.length" should equal "0"

  @CA-SESS-142
  @CA-CONT-105
  Scenario: A session over several projects reads the context of each, the principal first
    Given the folders "labo-ia,api-voix" are projects
    When I send POST request to "/api/decisions" with the JSON "fixtures/context/project-decision.json"
    And I send POST request to "/api/decisions" with the JSON "fixtures/context/api-voix-decision.json"
    And the session calls the Bosco tool "bosco_context" with:
      | path  | labo-ia/packages/bosco |
      | paths | api-voix, labo-ia      |
    Then the Bosco tool answers "Session sur 2 projets : labo-ia (projet principal, dossier de travail), puis api-voix."
    And the Bosco tool answers "DEC-2 Valider chaque requête par un schéma"
