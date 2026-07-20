# Roadmap

## Completed

1. Foundation
   - FastAPI backend
   - Next.js frontend
   - PostgreSQL staging deployment
   - JWT admin login
   - Alembic migration foundation
   - Render staging Blueprint

2. AI Sourcing
   - Candidate search
   - Rule-based candidate generation
   - Score and margin calculation
   - Candidate save and duplicate protection
   - Saved list persistence
   - Review statuses, notes, and tags

3. Projects
   - Project creation
   - Candidate assignment to projects
   - Project-specific candidate lookup

4. AI Center
   - Deterministic domain AI staff
   - Staff consultation endpoint
   - Staff chat workspace

5. Command Cockpit
   - `/dashboard` unified cockpit
   - Shared module shell
   - Active and planned module navigation

6. Marketplace Adapter Contract
   - `search`
   - `upload`
   - `update_price`
   - `stock`

## Current Next Step

Build Finance v1 so sourcing candidates and projects can be evaluated against cash, budget, loss limits, and margin guardrails.

## Backlog

- Finance v1: budget, unit economics, test-order limit, loss guardrail
- Commerce v1: listing readiness checklist and channel assumptions
- Media Studio v1: content hooks, briefs, and launch copy
- Real model-backed AI Center provider behind environment-managed secrets
- Coupang adapter implementation
- Naver adapter implementation
- Amazon adapter implementation
- Shopee adapter implementation
- Lazada adapter implementation
- Automatic listing workflow after explicit user approval

## Product Rule

AI recommends only. The user must approve before any real marketplace listing, paid service change, or external side effect.
