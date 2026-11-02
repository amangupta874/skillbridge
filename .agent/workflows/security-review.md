---
description: Review the current diff for security and rule violations
---
# Security and rules review
Review `git diff main...HEAD` against AGENTS.md, docs/05, docs/06, docs/08. Report only real problems with file and line:
1. Missing or wrong authorisation (owner, applicant, participant checks) and wrong status codes (404/403/409 order).
2. Fields leaking (passwordHash, emails, session ids); missing zod validation; unbounded page sizes.
3. Stored derived data, missing transactions, accept logic without the row lock.
4. Queries inside loops (N+1), missing `select`, missing indexes for new filters.
5. Missing tests for new endpoints (happy, validation, 401, wrong actor, conflict).
6. New dependencies not listed in docs/02, console.log, secrets, commented-out code.
