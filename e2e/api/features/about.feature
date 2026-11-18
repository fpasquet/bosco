@RF-REGL-08
@RF-REGL-09
@RF-REGL-10
@RF-REGL-11
@NF-20
Feature: Version and updates
  As the developer, I want to know which version of Bosco runs and to hear of a newer one on the channel I follow, so
  that I update Bosco when I choose, without it calling GitHub more than once a day.

  @CA-REGL-34
  Scenario: The about tab gives the running version, how Bosco is installed and the updates
    When I send GET request to "/api/about"
    Then the response code should be 200
    And the response should match snapshot

  @CA-REGL-34
  Scenario: A version built outside a release gives its commit
    Given Bosco runs the version "0.2.0" built from the commit "3118cb5"
    When I send GET request to "/api/about"
    Then the response property "commit" should equal "3118cb5"
    And the response property "release" should equal "false"

  @CA-REGL-35
  Scenario: The stable channel offers the newest stable release with its notes and its files, not the beta
    Given GitHub publishes the releases 0.2.0, 0.3.0 and 0.4.0-beta.1
    When I send POST request to "/api/about/check"
    Then the response code should be 200
    And the response should match snapshot except for "updates.checkedAt"

  @CA-REGL-35
  Scenario: The beta channel offers the newest beta
    Given GitHub publishes the releases 0.2.0, 0.3.0 and 0.4.0-beta.1
    When I send PUT request to "/api/about/updates" with the JSON "fixtures/about/beta-channel.json"
    Then the response property "updates.channel" should equal "beta"
    And the response property "updates.available.version" should equal "0.4.0-beta.1"

  @CA-REGL-36
  Scenario: A failed check keeps its error and offers nothing
    Given GitHub does not answer
    When I send POST request to "/api/about/check"
    Then the response property "updates.error" should equal "GitHub answered 503"
    And the response property "updates.available" should equal "null"

  @CA-REGL-36
  Scenario: The updates can be turned off
    When I send PUT request to "/api/about/updates" with the JSON "fixtures/about/turned-off.json"
    Then the response property "updates.enabled" should equal "false"

  @CA-REGL-36
  Scenario: An unknown channel is refused
    When I send PUT request to "/api/about/updates" with the JSON "fixtures/about/unknown-channel.json"
    Then the response code should be 400

  @CA-REGL-37
  Scenario: After an update, the installed version is announced until the banner is closed
    Given Bosco was updated from "0.1.0" to "0.2.0"
    When I send POST request to "/api/about/dismiss" with the JSON "fixtures/about/dismiss-installed.json"
    Then the response property "installed" should equal "null"

  @CA-REGL-38
  Scenario: The notice of an available version stays dismissed
    Given GitHub publishes the releases 0.2.0, 0.3.0 and 0.4.0-beta.1
    And I send POST request to "/api/about/check"
    When I send POST request to "/api/about/dismiss" with the JSON "fixtures/about/dismiss-available.json"
    Then the response property "updates.dismissed" should equal "true"
    And the response property "updates.available.version" should equal "0.3.0"

  @CA-REGL-39
  Scenario: The changelog shipped with the running version is given in Markdown
    When I send GET request to "/api/about/changelog"
    Then the response code should be 200
    And the response property "markdown" should contain "# Journal des versions"
