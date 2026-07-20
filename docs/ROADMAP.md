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

7. Finance v1
   - Candidate budget guardrails
   - Loss limit and minimum margin controls
   - Test-order cash planning
   - Finance module in the shared cockpit shell

8. Commerce v1
   - Listing readiness checklist
   - Channel assumptions for prepared candidates
   - Explicit approval gate before marketplace side effects
   - Commerce module in the shared cockpit shell

9. Media Studio v1
   - Product brief generation from saved candidates
   - Content hooks and launch copy drafts
   - Tone and channel controls
   - Publishing approval gate before external side effects

## Current Next Step

Build the real AI provider layer for AI Center behind environment-managed secrets, so domain staff can move from deterministic advice to model-backed consultation without exposing keys.

## Backlog

- Real model-backed AI Center provider behind environment-managed secrets
- Coupang adapter implementation
- Naver adapter implementation
- Amazon adapter implementation
- Shopee adapter implementation
- Lazada adapter implementation
- Automatic listing workflow after explicit user approval

## Product Rule

AI recommends only. The user must approve before any real marketplace listing, paid service change, or external side effect.
