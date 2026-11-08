@RF-SESS-07
Feature: Phone access
  As the developer, I want to pair my phone on the local network with a short code, so that I can answer a waiting
  session from my phone, and nobody else can.

  Background:
    Given Bosco watches the profiles ".claude" and ".claude-perso"

  @CA-SESS-60
  Scenario: Phone access is off by default
    When I send GET request to "/api/phone-access"
    Then the response property "enabled" should equal "false"

  @CA-SESS-66
  @CA-SESS-68
  Scenario: A phone paired with the code reaches Bosco until it is removed
    Given phone access is enabled
    And a pairing code is shown on the workstation
    When the phone opens "/api/sessions" without being paired
    Then the phone gets the code 401
    When the phone opens "/" without being paired
    Then the phone gets the code 302
    When the phone enters the code
    Then the phone gets the code 201
    When the phone opens "/api/sessions"
    Then the phone gets the code 200
    When the phone opens "/api/phone-access"
    Then the phone gets the code 403
    When I send GET request to "/api/devices"
    Then the response property "devices.0.name" should equal "Android · Chrome"
    When I remove the paired phone
    And the phone opens "/api/sessions"
    Then the phone gets the code 401

  @CA-SESS-67
  Scenario: A code is refused once used, and a new code replaces the previous one
    Given phone access is enabled
    And a pairing code is shown on the workstation
    When the phone enters the code "000000"
    Then the phone gets the code 400
    When the phone enters the code
    Then the phone gets the code 201
    When the phone enters the code
    Then the phone gets the code 410
