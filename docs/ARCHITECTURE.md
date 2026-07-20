# Architecture

JARVIS-CommerceOS keeps a stable module-first structure.

## Backend

Primary folders:

- `app/core`: configuration and security
- `app/db`: database base, session, and models
- `app/modules/auth`: JWT login
- `app/modules/sourcing`: AI Sourcing search, scoring, save, review status
- `app/modules/projects`: project management and candidate assignment
- `app/marketplaces`: marketplace adapter contract only
- `app/shared`: reusable dependencies

Current API assembly happens in `app/main.py` through FastAPI routers under `/api/v1`.

## Frontend

Primary pages:

- `/sourcing`: login, search, candidate save, saved list, approve/reject
- `/projects`: project creation, candidate assignment, project-specific candidate lookup

The left navigation can show planned modules, but only AI Sourcing and Projects are active in this MVP.

## Marketplace Boundary

The marketplace layer is intentionally a contract, not an integration. MVP code may depend on the adapter interface, but must not call live Coupang, Naver, Amazon, Shopee, or Lazada APIs yet.

Required adapter methods:

- `search`
- `upload`
- `update_price`
- `stock`

## Development Rule

Do not add new modules or large abstractions until the AI Sourcing MVP is merged and deploy-smoked. Stabilize existing flows first.
