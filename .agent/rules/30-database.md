# Database rules (applies to server/prisma and any query)
- `server/prisma/schema.prisma` is the source of truth. Do not add, rename or remove tables or columns without asking the human.
- Prisma 6 only (never upgrade to 7). After schema changes: `npx prisma migrate dev --name <change>` then `npx prisma generate`. Never edit an applied migration.
- Raw SQL rules (CHECKs, partial unique index, view) are in `server/prisma/extra-constraints.sql` and appended to the init migration.
- Keep the 5NF design: no stored derived data, no arrays or comma lists, lookups by foreign key.
- `$queryRaw` only as a tagged template. `$queryRawUnsafe` / `$executeRawUnsafe` never take user input (only the constant TRUNCATE in test helpers).
- Lists: `select` needed fields only, paginate with skip/take plus a `count` using the same `where`, stable sort with a tiebreaker. No query inside a loop (no N+1).
- Test database is `skillbridge_test`; tests may truncate it. Never run tests against `skillbridge_dev`.
