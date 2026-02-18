# Contributing to Global Workforce ERP

## Dependency Management Rules

> **Critical:** When you `import` a new external npm package in any file, you **must** also install it:

```bash
# For runtime dependencies
npm install <package-name>

# For type definitions and dev-only tools
npm install -D @types/<package-name>
```

**Why:** If a package is imported in code but not listed in `package.json`, the project will break on any fresh `npm install` (new clones, CI pipelines, or after clearing `node_modules`).

### Checklist before committing

- [ ] Every `import` from an external package has a matching entry in `package.json`
- [ ] `@types/*` packages are in `devDependencies`, not `dependencies`
- [ ] Run `npm run dev` (frontend) and `npm run dev:server` (backend) to verify both start

## Starting the Development Environment

```bash
# Terminal 1 — Frontend (Vite, port 3000)
npm run dev

# Terminal 2 — Backend Chat Server (Express, port 3001)
npm run dev:server
```

## Code Quality

```bash
npm run lint        # ESLint
npm run test        # Unit tests (Vitest)
npm run test:e2e    # E2E tests (Playwright)
```
