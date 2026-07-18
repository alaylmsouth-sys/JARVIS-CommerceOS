# JARVIS-CommerceOS Operating Plan

This plan keeps the product moving fast while each stage remains testable in staging before production.

## 1. Foundation Stabilization

- Keep Alembic as the only schema-change path.
- Confirm deploy health after every main merge.
- Keep secrets out of code, docs and chat.
- Document backup, restore and rollback steps before production.

## 2. AI Sourcing

- Expand candidate review statuses, notes and tags.
- Improve saved-candidate sorting, filtering and duplicate handling.
- Add export and comparison workflows after review data is stable.

## 3. Projects

- Turn saved candidates into project-level decisions.
- Add candidate comparison, milestone tracking and project notes.
- Keep project candidate links persistent after reloads and deploys.

## 4. Commerce Operations

- Add listing-readiness checklists.
- Track channel, target price, margin guardrails and supplier assumptions.
- Add basic inventory and order planning only after sourcing flow is stable.

## 5. Specialist Workspaces

- Media Studio: content hooks, creative briefs and launch copy.
- Finance: cash flow, unit economics and experiment budget controls.
- Trading: watchlist, risk notes and decision logs.
- Telegram remains out of scope until explicitly reintroduced.

## 6. Production Readiness

- Confirm paid Render web and PostgreSQL plans.
- Configure database backups.
- Review private networking.
- Attach production domain.
- Verify rollback procedure and post-deploy smoke tests.

## AI Staff Model

AI Center provides domain-specific AI employees for consultation. The first implementation is a deterministic advisor layer with structured staff personas and action recommendations. It is designed so a future model-backed provider can replace the advisor engine without changing the frontend workflow.
