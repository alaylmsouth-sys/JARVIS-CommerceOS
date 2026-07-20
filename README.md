# JARVIS-CommerceOS

JARVIS-CommerceOS is a personal AI operating system for commerce workflows. The current release focus is the AI Sourcing MVP. Other modules remain planned and should not be expanded in this phase.

## MVP Scope

Completed in this branch:

- JWT admin login
- AI Sourcing search
- Candidate scoring and margin calculation
- Candidate save and duplicate protection
- Saved candidate list persistence
- Candidate approve/reject status flow
- Project creation
- Candidate assignment to projects
- Project-specific candidate lookup
- Marketplace Adapter contract only

Not included in this MVP:

- Live Coupang, Naver, Amazon, Shopee, or Lazada integrations
- Automatic marketplace listing
- Paid AI model workflow
- New modules outside AI Sourcing and Projects

## Local Run

```bash
cp .env.example .env
docker compose up --build
```

Default app URLs:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8001`
- Swagger: `http://localhost:8001/docs`
- Health: `http://localhost:8001/health`

Default local login:

- Email: `admin@jarvis.local`
- Password: `change-me-now`

## Validation

Backend:

```bash
cd backend
python -m pytest -q
```

Frontend:

```bash
cd frontend
npm install
npm run build
```

Latest MVP validation:

- Backend tests: `8 passed`
- Frontend Next build: passed
- API smoke: login, search, save, duplicate rejection, approve, reject, project create, attach, and project lookup passed

## Current Rule

No new feature expansion until the AI Sourcing MVP is merged and deploy-smoked. New ideas should go to backlog.
