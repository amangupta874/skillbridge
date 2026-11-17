# Security review notes

## Dependency audit

Command: `npm audit --omit=dev` from the repository root on 2026-11-17.

Result: 5 reported vulnerabilities (3 high, 2 moderate). The installed versions were Prisma 6.19.3, `deepmerge-ts` 7.1.5, and React Router / `react-router-dom` 6.30.6.

| Finding | Affected packages | Decision |
|---|---|---|
| [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), high: stack exhaustion in recursive deep merges | `deepmerge-ts` -> `@prisma/config` -> `prisma` | Leave unchanged. npm audit offers Prisma 7.10.1, a major update. The project pins Prisma 6 and there is no non-breaking update reported. |
| [GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6), moderate: backslash open redirect in links and navigation | `react-router` -> `react-router-dom` | Leave unchanged. npm audit offers React Router 7.18.5, a major update. The project pins React Router 6 and there is no non-breaking update reported. |
| [GHSA-337j-9hxr-rhxg](https://github.com/advisories/GHSA-337j-9hxr-rhxg), moderate: constructor injection in SSR error deserialization | `react-router` -> `react-router-dom` | Leave unchanged for the same major-version constraint. The application is a client-rendered Vite app and does not use React Router SSR hydration. |

The audit also lists `@prisma/config`, `prisma`, and `react-router-dom` as affected dependency nodes, which account for the total of five package vulnerabilities. No `npm audit fix` command was run and no dependency versions were changed.

## Error responses and logs

The Express error handler returns only the generic `INTERNAL_ERROR` body for unexpected failures. Its test checks that response JSON has no stack field or stack trace. The logger redacts cookie, authorization, set-cookie, and request password fields; `logger.test.js` verifies the configured logger options remove those values from output.
