# Local query plan notes

Measured on 2026-11-17 against the local PostgreSQL development database only. The project uses a local PostgreSQL 18 service. The throwaway loader added 500 temporary users, 200 projects, 2,000 `user_skills`, 500 learning goals, and 600 applications, ran the queries below, and deleted the temporary rows before exiting. It was not run against the hosted API or production database.

## Project list filter

Query: open projects in one category that require a selected skill, ordered newest first with a 12-row limit.

- Planning: 0.168 ms. Execution: 0.293 ms. Shared buffers: 463 hits.
- PostgreSQL used `projects_status_category_id_idx` for `(status, category_id)`, returning 200 projects to the next step.
- It used an index-only scan on `project_skills_pkey` for the project and skill pair (200 index searches, 50 heap fetches); the top-N sort returned 12 rows.

## Matching candidate prefilters

Both queries filtered for four required skill ids and excluded six team users.

| Query | Index | Planning | Execution | Rows returned | Shared buffers |
|---|---|---:|---:|---:|---:|
| Known skills (`user_skills`) | `user_skills_skill_id_idx` bitmap index scan | 0.063 ms | 0.337 ms | 1,976 | 26 hits |
| Learning goals (`user_learning_goals`) | `user_learning_goals_skill_id_idx` bitmap index scan | 0.031 ms | 0.087 ms | 494 | 6 hits |

The known-skill query removed 24 rows for the six excluded users; the goals query removed 6.

## `skill_demand_supply` view

These are the actual rows for the four loaded skills, read before the temporary data was deleted:

| id | skill | open projects needing it | students who know it | students who want it |
|---:|---|---:|---:|---:|
| 1 | JavaScript | 50 | 500 | 125 |
| 3 | Python | 50 | 500 | 125 |
| 16 | React | 50 | 500 | 125 |
| 23 | Node.js | 50 | 500 | 125 |

These timings describe this local dataset and machine only; they are not production latency estimates.
