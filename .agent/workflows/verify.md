---
description: Run the quality gate and report honestly
---
# Verify
1. From the repo root run `npm run verify` (lint, tests, build).
2. If anything fails: show the first failing output, find the root cause, fix the code (never weaken or delete tests), rerun until green.
3. Report the exact result: number of tests passed, lint result, build result.
4. Append a line to the "Verification log" in `docs/PROGRESS.md`.
