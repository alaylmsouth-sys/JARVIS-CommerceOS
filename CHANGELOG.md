# Changelog

## 1.3.2

- Added a cost-controlled Render staging Blueprint for the API, dashboard and PostgreSQL
- Added production secret and persistent database validation
- Added idempotent database initialization before the API starts
- Added Docker build checks and frontend regression tests to CI
- Added reproducible frontend dependency locking and deployment documentation

## 1.1.0

- Expanded the AI Sourcing input workflow
- Kept the engine free and rule-based
- Prepared score, margin and approval UI upgrades

## 1.2.0
- Added free keyword candidate search
- Added deterministic sample candidate generation
- Added profit, margin and score preview
- Added save-to-analysis workflow

## 1.2.1
- Added persistent saved-candidate loading
- Added search/saved tabs
- Added duplicate protection
- Added persistent approval status display

## 1.3.1

- Integrated AI Sourcing v1.2.1 with Project System v1.3
- Registered the projects API router
- Added the Projects dashboard and candidate assignment workflow
- Isolated the test database so repeated test runs remain deterministic
- Aligned the default admin email across API, Docker and dashboard
- Upgraded Next.js and React to patched versions in the existing release line
- Fixed proxy handling for bodyless HTTP responses such as 204
- Removed obsolete one-time upgrade scripts after their changes were integrated
