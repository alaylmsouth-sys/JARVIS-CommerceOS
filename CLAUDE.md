# CLAUDE.md

Guidance for AI assistants working in this repository. Read this before making changes.

## What this is

**JARVIS-CommerceOS** (v1.3.2) is a modular commerce-operations platform for e-commerce
sourcing, project management, and AI-assisted operations. The UI is Korean-language.
It is a monorepo with a FastAPI backend and a Next.js frontend, wired together with
Docker Compose for local development and a Render Blueprint for staging.

The product philosophy is "stable foundation first": small, reversible, well-tested
increments. See `docs/OPERATING_PLAN.md` and `docs/ROADMAP.md` for the six-stage plan.

## Repository layout

```
backend/          FastAPI + SQLAlchemy + Alembic (Python 3.12)
frontend/         Next.js 15 App Router + React 19 + TypeScript (strict)
docs/             ARCHITECTURE, API_SPEC, ROADMAP, OPERATING_PLAN, DEPLOY_RENDER, SECURITY
docker-compose.yml  Local dev: db (postgres:16) + redis:7 + backend + frontend
render.yaml       Render staging Blueprint (Singapore region, free plans)
.github/workflows/ci.yml  CI: backend pytest, frontend test+build, docker builds
```

## Running locally

```bash
cp .env.example .env
docker compose up --build
```

- Dashboard: http://localhost:3000  ·  API: http://localhost:8001  ·  Swagger: http://localhost:8001/docs  ·  Health: http://localhost:8001/health
- Default login: `admin@jarvis.example.com` / `change-me-now` (seeded on startup by `init_db()` in `backend/app/main.py`).

## Backend architecture (`backend/app`)

Module-first structure. Routers are mounted in `app/main.py` under the `/api/v1` prefix.

- `core/config.py` — `pydantic-settings` `Settings`; reads `.env`. Normalizes `postgres://`
  URLs to `postgresql+psycopg://`. Enforces production guardrails (non-sqlite DB, 32+ char
  `JWT_SECRET`, changed admin password) when `ENVIRONMENT=production`.
- `core/security.py` — bcrypt password hashing, JWT (HS256) create/decode.
- `db/` — canonical persistence layer: `base.py` (`Base`), `session.py` (`engine`,
  `SessionLocal`, `get_db`), `models.py` (ORM), `migrate.py` (startup migration runner).
- `modules/auth` — JWT login (`POST /api/v1/auth/login`).
- `modules/sourcing` — candidate search, deterministic scoring, saved candidates, review
  status/notes/tags. Includes the read-only Coupang adapter (`coupang.py`).
- `modules/projects` — projects and candidate attachment.
- `modules/ai_center` — deterministic AI "staff" directory + chat, with an optional
  OpenAI provider layer (`provider.py`).
- `marketplaces/` — the `MarketplaceAdapter` **contract only** (`search`, `upload`,
  `update_price`, `stock`). Not a live integration.
- `shared/deps.py` — `get_current_user` FastAPI dependency (Bearer auth).

### ⚠️ Canonical vs. legacy modules — read this

The backend contains **duplicate, unused legacy files** left over from earlier refactors.
Nothing in `app/main.py`, the modules, or the tests imports them. **Edit the canonical
paths, not the legacy ones:**

| Concern            | Canonical (use this)          | Legacy (dead code — do not edit) |
|--------------------|-------------------------------|----------------------------------|
| ORM models         | `app/db/models.py`            | `app/models.py`                  |
| DB session / engine| `app/db/session.py`           | `app/db.py`                      |
| Auth dependency    | `app/shared/deps.py`          | `app/deps.py`                    |
| Schemas            | `app/modules/*/schemas.py`    | `app/schemas.py`, `app/schemas/` |
| Routers            | `app/modules/*/router.py`     | `app/routers/`                   |
| Services           | `app/modules/sourcing/…`      | `app/services/`                  |

If you touch models or routing, verify against `app/main.py`'s imports to confirm you're
in the live code path. (Removing the legacy files is a reasonable cleanup, but is out of
scope unless requested.)

### Data model (`app/db/models.py`)

`User`, `SourcingCandidate` (with a `(name, marketplace, country)` uniqueness constraint),
`AuditLog`, `Project`, `ProjectCandidate` (join, unique per `(project_id, candidate_id)`).
Candidate state-changing endpoints write an `AuditLog` row.

### Scoring & search conventions

- `modules/sourcing/scoring.py` — deterministic, rule-based margin/score computation.
  Recommendation labels are Korean (`강력 추천`, `추천`, `검토`, `보류`, `비추천`).
- `modules/sourcing/search.py` — deterministic sample catalog with a stable
  hash-seeded generator for unknown keywords; for `coupang`+`KR` it tries the real
  read-only Coupang search first and **silently falls back** to the catalog on any error.

## AI & marketplace boundaries (important guardrails)

- **Marketplace layer is a contract, not an integration.** Do not add live calls to
  Naver, Amazon, Shopee, or Lazada. The only live external call today is Coupang
  *read-only* product search (HMAC-signed, credential- and env-gated, with fallback).
- **AI Center recommends, never executes.** The system prompt and deterministic replies
  must never claim to have performed marketplace, payment, posting, pricing, or inventory
  actions. Real side effects require explicit user approval. The OpenAI provider is
  disabled unless `AI_PROVIDER=openai` and an API key is set; it always falls back to the
  deterministic reply on error.
- Finance / Commerce / Media are **frontend-only computed views** over the sourcing
  candidates API — there are no dedicated backend routers for them (yet).

## Database migrations

Alembic-managed. **Every schema change needs a new Alembic revision** in
`backend/alembic/versions/`.

- Runtime: the container entrypoint runs `python -m app.db.migrate` before uvicorn.
  `migrate.py` stamps a pre-existing baseline schema (revision `0001_initial_schema`)
  if `alembic_version` is missing, then upgrades to `head`.
- Tests bypass Alembic and use `Base.metadata.create_all` (see `tests/conftest.py`), so
  keep `app/db/models.py` and the migrations in sync manually.

## Frontend (`frontend/app`, Next.js App Router)

- Pages: `/dashboard` (cockpit), `/sourcing`, `/projects`, `/ai-center`, `/commerce`,
  `/finance`, `/media`. `page.tsx` is the login gate; planned modules (Trading, Settings)
  render inactive in `components/AppShell.tsx`.
- `AppShell` owns the sidebar, active-module state, header, and logout.
- **All API traffic goes through the proxy** at `app/api/backend/[...path]/route.ts`,
  which forwards to `BACKEND_EXTERNAL_HOSTNAME` (Render) or `BACKEND_INTERNAL_URL`
  (compose). Client code calls `NEXT_PUBLIC_API_BASE` (default `/api/backend`), e.g.
  `POST /api/backend/api/v1/auth/login`. The JWT is stored in `localStorage`
  (`jarvis_token`); a 401 clears the session.
- `proxy-response.ts` handles bodyless responses (e.g. 204) — covered by the one
  frontend test.

## Testing & CI

Run the same checks CI runs (`.github/workflows/ci.yml`) before pushing:

```bash
# Backend  (from backend/)
pip install -r requirements.txt
pytest

# Frontend (from frontend/)
npm ci
npm test          # node --test on proxy-response
npm run build
```

- Backend tests use an isolated SQLite DB (`tests/conftest.py` sets `DATABASE_URL` and
  resets tables per test). Add tests under `backend/tests/`.
- CI also builds both Docker images. If you change a Dockerfile or dependency, expect the
  `docker` job to exercise it.

## Coding conventions

- **Match the style of the file you're editing.** Some backend files (`db/models.py`,
  `core/security.py`, `shared/deps.py`, several `router.py`) are written in a compact,
  semicolon-dense one-liner style; newer modules (`projects`, `ai_center`, `marketplaces`,
  `migrate.py`) use conventional multi-line formatting. Don't reformat wholesale.
- Keep UI strings and user-facing recommendation text in Korean, consistent with the
  existing product.
- Never commit secrets. Config comes from `.env` / environment variables; production
  secrets are supplied at deploy time (see `render.yaml` `sync: false` fields).
- Update `CHANGELOG.md` (the `## Unreleased` section) for user-facing changes.

## Deployment

`render.yaml` provisions API, web, and PostgreSQL as a Render Blueprint (staging,
Singapore, free plans — the free Postgres expires after 30 days). Secrets
(`DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`) are entered in the Render UI, not the
repo. Full procedure: `docs/DEPLOY_RENDER.md`.

## Git workflow

- Develop on the assigned feature branch; commit with clear messages; push with
  `git push -u origin <branch>`.
- Do **not** open a pull request unless explicitly asked.
