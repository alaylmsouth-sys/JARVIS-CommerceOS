# Architecture

JARVIS-CommerceOS keeps a module-first structure so new operating areas can be added without changing the foundation.

## Backend

Primary folders:

- `app/core`: configuration and security
- `app/db`: SQLAlchemy base, session, models, and Alembic migration runner
- `app/modules/auth`: JWT login
- `app/modules/sourcing`: AI Sourcing search, scoring, saved candidates, review status, notes, and tags
- `app/modules/projects`: project management and candidate assignment
- `app/modules/ai_center`: deterministic AI staff directory and consultation endpoint
- `app/marketplaces`: marketplace adapter contract only
- `app/shared`: reusable dependencies

FastAPI routers are mounted in `app/main.py` under `/api/v1`.

## Frontend

Primary pages:

- `/dashboard`: unified command cockpit
- `/sourcing`: candidate search, save, and review board
- `/projects`: project creation and candidate assignment
- `/ai-center`: domain AI staff consultation workspace

The shared `AppShell` owns the sidebar, active module state, header, and logout controls. Planned modules appear inactive until they have real workflows.

## Marketplace Boundary

The marketplace layer is intentionally a contract, not an integration. Current code may depend on the adapter interface, but must not call live Coupang, Naver, Amazon, Shopee, or Lazada APIs yet.

Required adapter methods:

- `search`
- `upload`
- `update_price`
- `stock`

## Data Changes

Schema changes must go through Alembic revisions. Runtime table creation is not the migration path.

## Product Rule

AI recommends. The user must approve before any real marketplace listing, paid plan change, or external side effect.
