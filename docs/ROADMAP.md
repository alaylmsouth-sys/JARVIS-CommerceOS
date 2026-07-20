# Roadmap

## Completed

1. Foundation
   - Docker
   - PostgreSQL and Redis setup
   - FastAPI backend
   - Next.js frontend
   - JWT admin login
   - Health check

2. AI Sourcing MVP
   - Search
   - Candidate generation
   - Score and margin calculation
   - Candidate save
   - Saved list persistence
   - Duplicate save protection
   - Approve/reject status
   - Project creation
   - Candidate assignment to projects
   - Project-specific candidate lookup
   - Backend tests passing
   - Frontend build passing

3. Marketplace Adapter contract
   - `search`
   - `upload`
   - `update_price`
   - `stock`

## Current Next Step

Prepare and merge the MVP branch into `main`, then run a deploy smoke test.

## Backlog

These are explicitly after MVP merge:

- Coupang adapter implementation
- Naver adapter implementation
- Amazon adapter implementation
- Shopee adapter implementation
- Lazada adapter implementation
- Automatic listing workflow after user approval
- Additional AI modules outside AI Sourcing

## Product Rule

AI recommends only. The user must approve before any real marketplace listing.
