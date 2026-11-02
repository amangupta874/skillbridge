# SkillBridge

Student collaboration platform: find teammates, join projects, trade skills, and get explainable teammate matches.
Capstone project for Advanced Programming (AP) and Data Engineering (DE), AY 2026-27.

**Live demo:** (add after Day 6)  |  **API health:** (add)  |  **Team:** (names)

## Features
Accounts and sessions, profiles with skills and learning goals, project discovery and management, applications and team formation with
concurrency-safe capacity, peer skill exchange, rule-based explainable matching, in-app notifications, skill demand/supply analytics.

## Tech stack
React 18 + Vite + Tailwind CSS 4 + React Router 6 + TanStack Query | Node.js 22 + Express 5 + Prisma 6 + zod | PostgreSQL 16 | Vitest + Supertest | GitHub Actions.

## Architecture
Layered modular monolith: React SPA -> Express REST API (routes, validation, controllers, services) -> Prisma -> PostgreSQL. (Add diagrams from `docs/` on Day 27.)

## Run locally
```
git clone <repo> && cd skillbridge
npm install
cp server/.env.example server/.env && cp server/.env.test.example server/.env.test     # edit database credentials
cd server && npx prisma generate && npx prisma migrate dev && npm run db:seed && cd ..
npm run dev          # API on :4000, client on :5173
npm run verify       # lint + tests + build
```

## Project documents
`docs/` holds the full specification (requirements, database, API, business logic, frontend, security, deployment, daily plan).

## Acknowledgements and AI usage
Libraries: React, Vite, Tailwind CSS, React Router, TanStack Query, axios, react-hook-form, zod, Express, Prisma, PostgreSQL, pino, helmet, cors, cookie-parser,
express-rate-limit, bcryptjs, dotenv, Vitest, Supertest, Testing Library, ESLint, Prettier, Graphviz (diagrams).
AI tools: Claude (Anthropic) was used for design discussion and documentation; Google Antigravity (AI coding agent) assists implementation.
All AI-assisted code is reviewed, tested and understood by the team. (Update this section if more tools are used.)
