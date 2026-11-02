---
description: Scaffold a backend module in the project's standard shape
---
# New backend module
1. Read the module's section in docs/05 and docs/06.
2. Create `server/src/modules/<name>/` with `<name>.routes.js`, `.schema.js`, `.controller.js`, `.service.js`, `.test.js` following the example in docs/03.
3. Mount the router in `server/src/routes.js` (specific paths before `/:id` paths).
4. Write the service first with its rules, then the schema, controller, routes, then tests (happy, validation, 401, wrong actor, conflict).
5. Run the `verify` workflow.
