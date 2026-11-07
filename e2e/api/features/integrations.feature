@RF-CONT-04
@RF-CONT-05
Feature: Integrations and task links
  As the developer, I want to paste the links of a task and have Bosco read their title and state, so that the agent
  knows them without ever receiving the accesses to the services.

  Background:
    Given the Claude Code profile ".claude" has the transcript "session-labo-ia-rag.jsonl" for the session "5e0a91c3"
    And Bosco watches the profiles ".claude" and ".claude-perso"
    And Docker does not answer
    And I send POST request to "/api/tasks" with the JSON "fixtures/tasks/worker-task.json"

  @CA-CONT-34
  @CA-CONT-36
  Scenario: A GitHub pull request is recognized, read, and sent to the agent with its address
    When I send GET request to "/api/links/recognize?url=https://github.com/groupe/labo-ia/pull/42"
    Then the response property "kind" should equal "Pull request"
    When I send POST request to "/api/tasks/1/links" with the JSON "fixtures/links/github-pr.json"
    Then the response property "service" should equal "github"
    And the response property "state" should equal "Ouverte"
    When I send GET request to "/api/context/preview?repository=labo-ia&task=1"
    Then the response property "text" should contain "Pull request · Ouverte · https://github.com/groupe/labo-ia/pull/42"

  @CA-CONT-30
  @CA-CONT-37
  Scenario: A link of an integration in error stays, not refreshed, and the integration says why
    When I send PUT request to "/api/integrations/jira" with the JSON "fixtures/links/jira-access.json"
    And I send POST request to "/api/tasks/1/links" with the JSON "fixtures/links/jira-ticket.json"
    Then the response property "title" should equal "TTS-142 · Prononciation des sigles"
    When I send PUT request to "/api/integrations/jira" with the JSON "fixtures/links/jira-expired.json"
    And I send POST request to "/api/integrations/refresh"
    And I send GET request to "/api/tasks/1/links"
    Then the response property "links.0.title" should equal "TTS-142 · Prononciation des sigles"
    And the response property "links.0.error" should equal "Jeton refusé ou expiré"
    When I send GET request to "/api/integrations"
    Then the response property "integrations.1.state" should equal "error"
    And the response property "integrations.1.links" should equal "1"

  @CA-CONT-35
  @CA-CONT-38
  Scenario: Any address is accepted with its page title, a text is not, and a link leaves this task only
    When I send POST request to "/api/tasks/1/links" with the JSON "fixtures/links/not-an-address.json"
    Then the response code should be 400
    When I send POST request to "/api/tasks/1/links" with the JSON "fixtures/links/github-pr.json"
    And I send DELETE request to "/api/tasks/1/links/1"
    And I send GET request to "/api/tasks/1/links"
    Then the response property "links.length" should equal "0"
