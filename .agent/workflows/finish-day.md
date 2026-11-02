---
description: Close out a plan day (progress, commit, review hints)
---
# Finish day
1. Run the `verify` workflow; it must be green.
2. Tick the day in `docs/PROGRESS.md`, list files created/changed, tests added, deviations (with reasons), known issues.
3. Update any doc whose behaviour or API changed (05, 06, 07).
4. Commit with Conventional Commits (one logical change per commit). Do not push unless the human asks.
5. Report: what was built, what was verified (commands and results), what is next, and the manual checks the human should run now.
