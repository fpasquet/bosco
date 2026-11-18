# Journal des versions

Ce qui change d'une version de Bosco à l'autre, tiré des messages de commit de `main`. Les versions beta paraissent en pre-release sur GitHub ; ici, la dernière beta décrit tout ce qui a changé depuis la dernière version stable.

## [0.1.0-beta.1](https://github.com/fpasquet/bosco/releases/tag/v0.1.0-beta.1) - 2026-11-18

### Nouveautés

- **projects** · Adopt the repositories of the sessions as projects and show every project in the usage ([#66](https://github.com/fpasquet/bosco/pull/66))
- Reach the subscription of a profile with a declared long-lived token ([#65](https://github.com/fpasquet/bosco/pull/65))
- Remove a source, import the whole history and reset Bosco ([#63](https://github.com/fpasquet/bosco/pull/63))
- Finish the sandbox sessions and the sources ([#60](https://github.com/fpasquet/bosco/pull/60))
- Close the gaps found by the review of the specs against the code ([#59](https://github.com/fpasquet/bosco/pull/59))
- **web** · A usage page for the sessions ([#57](https://github.com/fpasquet/bosco/pull/57))
- **sessions** · Session defaults from the group to the profile, five permission modes ([#56](https://github.com/fpasquet/bosco/pull/56))
- **sessions** · Run a piloted session over several projects or a group ([#55](https://github.com/fpasquet/bosco/pull/55))
- **web** · Navigate by place, a page for each project and group ([#54](https://github.com/fpasquet/bosco/pull/54))
- **projects** · Gather the projects in groups that carry their instructions ([#53](https://github.com/fpasquet/bosco/pull/53))
- **projects** · Choose the projects with a folder browser ([#52](https://github.com/fpasquet/bosco/pull/52))
- **sandbox** · Set the tasks aside to focus on sessions and sandboxes ([#47](https://github.com/fpasquet/bosco/pull/47))
- **tasks** · Limit the worker by the quota of the Claude subscription instead of a budget ([#45](https://github.com/fpasquet/bosco/pull/45))
- **sessions** · Run a piloted session in a sandbox isolated from the workstation ([#44](https://github.com/fpasquet/bosco/pull/44))
- **tasks** · Read a task like a session, and resume its agent at review ([#43](https://github.com/fpasquet/bosco/pull/43))
- **tasks** · Show the running containers, what they consume, and the resources of a task ([#38](https://github.com/fpasquet/bosco/pull/38))
- **tasks** · Let the worker agents read Jira and Confluence through the claude.ai connector ([#42](https://github.com/fpasquet/bosco/pull/42))
- **tasks** · Show when a new task will start, with the room left in the worker ([#37](https://github.com/fpasquet/bosco/pull/37))
- **tasks** · Draw the task chain as a graph with arrows, zoom and fit ([#36](https://github.com/fpasquet/bosco/pull/36))
- **apps** · Desktop application for Linux with its .deb package and updates, Android application (lot 4) ([#34](https://github.com/fpasquet/bosco/pull/34))
- **sessions** · Write to a terminal session through the Bosco channel ([#33](https://github.com/fpasquet/bosco/pull/33))
- **sessions** · Start a session and write to it from Bosco ([#32](https://github.com/fpasquet/bosco/pull/32))
- **notifications** · Title desktop notifications with the kind and the repository ([#31](https://github.com/fpasquet/bosco/pull/31))
- **notifications** · Notify only questions and finished work, with a notification centre ([#30](https://github.com/fpasquet/bosco/pull/30))
- **tasks** · Set a Claude subscription and a GitHub account per repository ([#29](https://github.com/fpasquet/bosco/pull/29))
- **tasks** · Give the worker tasks the chosen subscription and the npmrc ([#28](https://github.com/fpasquet/bosco/pull/28))
- **context** · Edit a socle after a confirmation that counts its repositories ([#27](https://github.com/fpasquet/bosco/pull/27))
- **tasks** · Undo a direct cancellation in the seconds that follow ([#26](https://github.com/fpasquet/bosco/pull/26))
- **sessions** · File the sessions under discovered git repositories ([#25](https://github.com/fpasquet/bosco/pull/25))
- **web** · Show skeletons while screens load ([#24](https://github.com/fpasquet/bosco/pull/24))
- **sessions** · Pair a phone by its QR code ([#23](https://github.com/fpasquet/bosco/pull/23))
- **sessions** · Render the full conversation of a session with AI Elements ([#22](https://github.com/fpasquet/bosco/pull/22))
- **context** · Read the links of a task through their integrations ([#21](https://github.com/fpasquet/bosco/pull/21))
- **context** · Keep the decisions and socles sent to every agent ([#20](https://github.com/fpasquet/bosco/pull/20))
- **tasks** · Let an interactive session take its tasks through an MCP server ([#19](https://github.com/fpasquet/bosco/pull/19))
- **sessions** · Follow the sessions of the worker agents with their task ([#18](https://github.com/fpasquet/bosco/pull/18))
- **tasks** · Review a worker task and validate it with a draft PR ([#17](https://github.com/fpasquet/bosco/pull/17))
- **tasks** · Set the agent rights in general and per repository ([#15](https://github.com/fpasquet/bosco/pull/15))
- **tasks** · Start the test services of a repository around the worker agent ([#14](https://github.com/fpasquet/bosco/pull/14))
- **tasks** · Filter the worker egress through a domain allowlist ([#13](https://github.com/fpasquet/bosco/pull/13))
- **tasks** · Run the ready tasks in disposable containers ([#12](https://github.com/fpasquet/bosco/pull/12))
- **tasks** · Prepare tasks with their prerequisites and guardrails ([#11](https://github.com/fpasquet/bosco/pull/11))
- **access** · Pair a phone on the local network and answer from it ([#10](https://github.com/fpasquet/bosco/pull/10))
- **sessions** · Browse the history and see where the budget goes ([#9](https://github.com/fpasquet/bosco/pull/9))
- **web** · Keep the screen when Bosco no longer answers ([#8](https://github.com/fpasquet/bosco/pull/8))
- **sessions** · Set the sources and notify new waits ([#6](https://github.com/fpasquet/bosco/pull/6))
- **sessions** · Show the detail of a session with its live feed ([#5](https://github.com/fpasquet/bosco/pull/5))
- **sessions** · Answer the sessions that wait for you, live ([#4](https://github.com/fpasquet/bosco/pull/4))
- **sessions** · Follow the sessions live in the overview ([#3](https://github.com/fpasquet/bosco/pull/3))
- **sessions** · Discover the sessions of the profiles chosen at first launch ([#2](https://github.com/fpasquet/bosco/pull/2))
- **api** · Add a development mode with hot reload of the web interface
- **web** · Add the Next.js shell on the daisyUI design system
- **cli** · Add the bosco command to start and install the service
- **api** · Add the NestJS service with configuration, health route and SQLite migrations
- **core** · Add the domain package with the sessions context

### Corrections

- **release** · Download the Electron binary when it is missing, and drop the SDK tools package ([#68](https://github.com/fpasquet/bosco/pull/68))
- **sandbox** · Start the data services, apply a mode change to the running turn, align the containers panel ([#67](https://github.com/fpasquet/bosco/pull/67))
- Count the usage of the subagents of a session ([#64](https://github.com/fpasquet/bosco/pull/64))
- **tasks** · Split the end of an agent out of the worker event handler ([#46](https://github.com/fpasquet/bosco/pull/46))
- **context** · Offer only the repositories that have a decision of their own ([#40](https://github.com/fpasquet/bosco/pull/40))
- **sessions** · Stretch the daily cost chart to the card width ([#39](https://github.com/fpasquet/bosco/pull/39))

### Remaniements

- Rename the repositories into projects ([#51](https://github.com/fpasquet/bosco/pull/51))
- **web** · Write every form with React Hook Form ([#16](https://github.com/fpasquet/bosco/pull/16))

### Documentation

- **requirements** · Export the requirements with the sessions-first screens delivered ([#49](https://github.com/fpasquet/bosco/pull/49))
- Add the README
- **requirements** · Export the requirements from the specs repository
- Add the agent instructions and the code rules

### Construction et CI

- Publish versions with a Release workflow, a changelog and in-app updates ([#50](https://github.com/fpasquet/bosco/pull/50))
- **make** · Add a beta target that installs the package of a branch over the running one ([#41](https://github.com/fpasquet/bosco/pull/41))
- Update the GitHub Actions to their Node 24 versions ([#1](https://github.com/fpasquet/bosco/pull/1))
- Add a Makefile for the common commands
- Add a root command to start Storybook
- Run the checks and end-to-end tests on GitHub Actions
- Lock the dependencies
- **configs** · Share the TypeScript, ESLint, Vitest and Prettier configurations
- Set up the pnpm and Turborepo monorepo

