# Render staging deployment

JARVIS-CommerceOS deploys a cost-controlled staging environment as two Docker
web services and one managed PostgreSQL database through `render.yaml`.

## Before creating the Blueprint

1. Confirm the `main` branch CI checks are green.
2. Confirm the Render GitHub app can access `alaylmsouth-sys/JARVIS-CommerceOS`.
3. Choose a staging administrator email.
4. Generate a unique administrator password with at least 12 characters.

Never reuse the local `change-me-now` password in Render.

## Create the services

1. Open the Render Dashboard and choose **New > Blueprint**.
2. Select `alaylmsouth-sys/JARVIS-CommerceOS` and the root `render.yaml`.
3. Review the three resources:
   - `jarvis-commerceos-staging-api`
   - `jarvis-commerceos-staging-web`
   - `jarvis-commerceos-staging-db`
4. Enter `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` when prompted.
5. Apply the Blueprint and wait for both health checks to pass.

The Blueprint starts on Render's free plans to avoid an unexpected charge. Free
web services can spin down when idle, and a free Render PostgreSQL database
expires after 30 days. Treat this environment as staging only.

Before production use, move the database to at least `basic-256mb`, select paid
web service plans, replace the public backend connection with Render private
networking, and configure backups. Review the displayed monthly cost in Render
before applying those changes.

## AI Center provider

AI Center uses deterministic staff replies by default. To enable model-backed
staff consultation on Render, set the following API service environment values:

- `AI_PROVIDER=openai`
- `OPENAI_API_KEY` as a Render secret value
- `OPENAI_MODEL` to the approved model for the account

Do not paste `OPENAI_API_KEY` into GitHub, source code, documentation, issue
comments, deployment logs, or chat. If `AI_PROVIDER=openai` is set without
`OPENAI_API_KEY`, the API fails fast during settings validation. If the OpenAI
request fails at runtime, AI Center falls back to the deterministic staff reply
so the authenticated workflow remains usable.

## Coupang read-only search

AI Sourcing uses internal deterministic candidates by default. To let Coupang
search call the read-only seller product query, set the following API service
environment values:

- `COUPANG_ACCESS_KEY` as a Render secret value
- `COUPANG_SECRET_KEY` as a Render secret value
- `COUPANG_VENDOR_ID`

Do not paste Coupang keys into GitHub, source code, documentation, issue
comments, deployment logs, or chat. This integration only attempts read-only
search. Upload, price update and stock actions remain unavailable until an
explicit approval-gated implementation exists. If Coupang credentials are
missing or the request fails, AI Sourcing falls back to deterministic candidate
search.

## Database migrations

The API image runs `python -m app.db.migrate` before starting Uvicorn. That
command applies Alembic migrations from `backend/alembic`.

For a fresh database, Alembic creates the full schema with revision
`0001_initial_schema`. For an existing v1.3.2 staging database that was created
by SQLAlchemy `create_all`, the migration runner detects the existing baseline
schema, stamps `0001_initial_schema`, and then applies any newer revisions.

Before adding future schema-changing revisions:

1. Back up the target database.
2. Add a new Alembic revision under `backend/alembic/versions`.
3. Run backend tests locally or in CI.
4. Deploy to staging and verify the application flow before production.

## Verify the deployment

1. Open the API service URL with `/health` and confirm version `1.3.2`.
2. Open the web service URL and sign in with the production administrator.
3. Search for a sourcing candidate and save it.
4. Create a project, attach the candidate, and reload the project page.
5. Confirm the candidate remains attached after the reload.
6. Open AI Center and confirm staff chat works with deterministic or model-backed replies depending on `AI_PROVIDER`.

## Deploy and rollback

Render waits for GitHub checks to pass before automatically deploying a `main`
commit. If a release fails, open the affected service in Render and roll back to
the previous successful deploy. The PostgreSQL database is not rolled back with
application code; take a database backup before future schema changes.
