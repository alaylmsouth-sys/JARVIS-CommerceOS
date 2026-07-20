# API Spec

Base path: `/api/v1`

## System

- `GET /health`

## Auth

### `POST /api/v1/auth/login`

Request:

```json
{
  "email": "admin@jarvis.local",
  "password": "change-me-now"
}
```

Response:

```json
{
  "access_token": "...",
  "token_type": "bearer"
}
```

## AI Sourcing

### `POST /api/v1/sourcing/search`

Creates rule-based candidate suggestions. This does not call paid AI or external marketplaces.

Request:

```json
{
  "keyword": "camping fan",
  "marketplace": "coupang",
  "country": "KR"
}
```

Response: list of candidate suggestions with score, cost, profit, margin, recommendation, and explanation.

### `GET /api/v1/sourcing/candidates`

Returns saved candidates, newest first.

### `POST /api/v1/sourcing/candidates`

Saves a candidate. Duplicate candidates by `name`, `marketplace`, and `country` return `409`.

### `PATCH /api/v1/sourcing/candidates/{candidate_id}/status`

Updates review status.

Allowed status values:

- `pending`
- `approved`
- `rejected`

## Projects

### `GET /api/v1/projects`

Returns projects, newest first.

### `POST /api/v1/projects`

Creates a project. Duplicate project names return `409`.

Request:

```json
{
  "name": "Camping",
  "description": "Camping products"
}
```

### `PATCH /api/v1/projects/{project_id}/status`

Updates project status.

Allowed status values:

- `active`
- `paused`
- `completed`

### `POST /api/v1/projects/{project_id}/candidates`

Attaches a saved sourcing candidate to a project. Duplicate attachments return `409`.

Request:

```json
{
  "candidate_id": 1
}
```

### `GET /api/v1/projects/{project_id}/candidates`

Returns candidates attached to the selected project.

## Marketplace Adapter

No marketplace HTTP API is exposed in this MVP.

The internal adapter contract is defined in `backend/app/marketplaces/base.py`:

- `marketplace.search()`
- `marketplace.upload()`
- `marketplace.update_price()`
- `marketplace.stock()`

Live marketplace integrations are backlog items after MVP merge.
