.PHONY: help install dev build preview check test test-e2e test-all clean

help:
	@echo "LocalMind Makefile Commands:"
	@echo "  make install    - Install dependencies using bun"
	@echo "  make dev        - Start the development server"
	@echo "  make build      - Build the production application"
	@echo "  make preview    - Preview the production build locally"
	@echo "  make check      - Run Svelte and TypeScript checks"
	@echo "  make test       - Run unit tests (Vitest)"
	@echo "  make test-e2e   - Run end-to-end tests (Playwright)"
	@echo "  make test-e2e-phase1 - Run only Phase 1 E2E tests"
	@echo "  make test-e2e-phase2 - Run only Phase 2 E2E tests"
	@echo "  make test-e2e-phase3 - Run only Phase 3 E2E tests"
	@echo "  make test-e2e-phase6 - Run only Phase 6 E2E tests"
	@echo "  make test-e2e-phase9 - Run only Phase 9 E2E tests"
	@echo "  make test-e2e-phase13 - Run only Phase 13 E2E tests"
	@echo "  make test-all   - Run both unit and E2E tests"
	@echo "  make clean      - Remove build artifacts and node_modules"
install:
	bun install

dev:
	bun run dev

build:
	bun run build

preview:
	bun run preview

check:
	bun run check

test:
	bunx vitest run

test-e2e:
	bunx playwright test

test-e2e-phase1:
	bunx playwright test tests/phase-1/

test-e2e-phase2:
	bunx playwright test tests/phase-2/

test-e2e-phase3:
	bunx playwright test tests/phase-3/

test-e2e-phase6:
	bunx playwright test tests/phase-6/

test-e2e-phase9:
	bunx playwright test tests/phase-9/

test-e2e-phase13:
	bunx playwright test tests/phase-13/

test-all: test test-e2e

clean:
	rm -rf node_modules .svelte-kit dist playwright-report test-results
