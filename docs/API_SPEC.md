# API Spec

Base path: `/api/v1`

## System

- `GET /health`

## Auth

### `POST /api/v1/auth/login`

Returns a bearer access token for the configured administrator account.

## AI Sourcing

### `POST /api/v1/sourcing/search`

Creates rule-based candidate suggestions. This does not call paid AI or external marketplaces.

### `GET /api/v1/sourcing/candidates`

Returns saved candidates, newest first.

### `POST /api/v1/sourcing/candidates`

Saves a candidate. Duplicate candidates by `name`, `marketplace`, and `country` return `409`.

### `PATCH /api/v1/sourcing/candidates/{candidate_id}/status`

Updates candidate status.

### `PATCH /api/v1/sourcing/candidates/{candidate_id}/review`

Updates candidate status, notes, and tags.

## Projects

### `GET /api/v1/projects`

Returns projects, newest first.

### `POST /api/v1/projects`

Creates a project. Duplicate project names return `409`.

### `PATCH /api/v1/projects/{project_id}/status`

Updates project status.

Allowed status values:

- `active`
- `paused`
- `completed`

### `POST /api/v1/projects/{project_id}/candidates`

Attaches a saved sourcing candidate to a project. Duplicate attachments return `409`.

### `GET /api/v1/projects/{project_id}/candidates`

Returns candidates attached to the selected project.

## AI Center

### `GET /api/v1/ai-center/staff`

Returns the available deterministic AI staff personas.

### `POST /api/v1/ai-center/chat`

Returns a deterministic staff response and recommended actions. This endpoint does not call a paid external LLM provider yet.

## Marketplace Adapter

No marketplace HTTP API is exposed yet.

The internal adapter contract is defined in `backend/app/marketplaces/base.py`:

- `search(keyword, country, limit)`
- `upload(product)`
- `update_price(listing_id, price, currency)`
- `stock(listing_id, quantity)`

Live Coupang, Naver, Amazon, Shopee, or Lazada integrations remain backlog items and must require user approval before real listing actions.
