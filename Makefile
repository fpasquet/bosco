# Commandes courantes de Bosco : make help les liste. Chaque cible passe par pnpm et Turborepo.
SPECS ?= ../specs
SKILLS := .claude/skills
PROFILE ?= $(HOME)/.claude

.DEFAULT_GOAL := help
.PHONY: help install dev start desktop desktop-install desktop-package desktop-update android build check lint typecheck test format format-check e2e e2e-api e2e-web e2e-record e2e-clean storybook claude-compat db-migration service-install mcp-install mcp-install-dev mcp-remove skills tokens tokens-check requirements requirements-check

help: ## List the commands
	@grep -E '^[a-z0-9-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN { FS = ":.*## " } { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }'

install: ## Install the dependencies and the pinned skills
	pnpm install
	pnpm skills:install

dev: ## Start the service in development mode on http://127.0.0.1:4880 (web hot reload, data in .data/)
	pnpm dev

start: build ## Build, then start the service on http://127.0.0.1:4870 and open the overview
	node apps/api/dist/cli/main.js start

desktop: build ## Build, then open the desktop application (Linux, optional: the browser still works)
	pnpm --filter @bosco/desktop start

desktop-install: build ## Add Bosco to the applications menu, opening the desktop application of this repository
	pnpm --filter @bosco/desktop install-launcher

desktop-package: build ## Build the .deb package of the desktop application (service, interface and Node 26 included)
	pnpm --filter @bosco/desktop package

desktop-update: ## Pull the repository, rebuild the .deb package and install it over the running one (sudo)
	git pull --ff-only
	pnpm install --frozen-lockfile
	$(MAKE) desktop-package
	sudo apt install --reinstall ./apps/desktop/out/bosco-desktop_*_amd64.deb

# Outils Android dans le dossier personnel (JDK 17, SDK), comme les a installés le lot 4
JAVA_HOME ?= $(HOME)/.local/jdk-17
ANDROID_HOME ?= $(HOME)/Android/Sdk

android: ## Build the Android application (APK in apps/mobile/android/app/build/outputs/apk/release)
	cd apps/mobile && CI=1 npx expo prebuild --platform android --clean --no-install
	cd apps/mobile/android && JAVA_HOME=$(JAVA_HOME) ANDROID_HOME=$(ANDROID_HOME) ./gradlew assembleRelease

build: ## Build every package
	pnpm build

check: ## Lint, typecheck, test and build every package
	pnpm check

lint: ## Lint every package (code, Gherkin scenarios, recordings)
	pnpm lint

typecheck: ## Typecheck every package
	pnpm typecheck

test: ## Run the Vitest tests and the Storybook stories
	pnpm test

format: ## Format the repository with Prettier
	pnpm format

format-check: ## Check the formatting
	pnpm format:check

e2e: e2e-api e2e-web ## Run both end-to-end suites

e2e-api: ## Run the API scenarios (replayed recordings)
	pnpm e2e:api

e2e-web: ## Run the web scenarios, desktop and mobile
	pnpm e2e:web

e2e-record: ## Record the missing outgoing calls of both suites, with the real accesses
	pnpm e2e:api:record
	pnpm e2e:web:record

e2e-clean: ## Remove the recordings no scenario uses
	pnpm e2e:clean

storybook: ## Start Storybook on http://localhost:6006
	pnpm storybook

claude-compat: build ## Check the permission hook against the installed Claude Code (NF-09; two short sessions on the Claude subscription)
	node e2e/compat/claude-code.ts

db-migration: ## Write the migration that brings the database to the entity schemas
	pnpm --filter @bosco/api db:migration

service-install: build ## Install Bosco as a systemd user service
	node apps/api/dist/cli/main.js service install

mcp-install: build ## Add the MCP server of Bosco (Ma session) to a Claude Code profile (PROFILE=~/.claude by default)
	node apps/api/dist/cli/main.js mcp install --profile $(PROFILE)

mcp-install-dev: ## Same, pointed at the development service (make dev: port 4880, data in .data/)
	BOSCO_PORT=4880 BOSCO_DATA_DIR=$(CURDIR)/.data node apps/api/dist/cli/main.js mcp install --profile $(PROFILE)

mcp-remove: ## Remove the MCP server of Bosco from a Claude Code profile (PROFILE=~/.claude by default)
	node apps/api/dist/cli/main.js mcp remove --profile $(PROFILE)

skills: ## Install the skills pinned by skills-lock.json
	pnpm skills:install

tokens: ## Copy the tokens of the specs (../specs/bosco/ui) into the web app
	node $(SKILLS)/design-system/scripts/tokens.mjs apps/web --from $(SPECS)/bosco/ui

tokens-check: ## Check that the tokens copy is up to date with the specs
	node $(SKILLS)/design-system/scripts/tokens.mjs apps/web --check --from $(SPECS)/bosco/ui

requirements: ## Export the requirements of the specs into docs/requirements
	cd $(SPECS) && node .claude/skills/requirements-doc/scripts/export.mjs bosco/requirements

requirements-check: ## Check that docs/requirements is up to date with the specs
	cd $(SPECS) && node .claude/skills/requirements-doc/scripts/export.mjs bosco/requirements --check
