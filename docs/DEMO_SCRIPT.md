# SkillBridge demo script

The six seeded accounts are:

- `owner@demo.skillbridge.test`
- `maya@demo.skillbridge.test`
- `leo@demo.skillbridge.test`
- `sam@demo.skillbridge.test`
- `ivy@demo.skillbridge.test`
- `noah@demo.skillbridge.test`

the password is in my password manager. Set it in `DEMO_PASSWORD` when seeding; never put it in this file or a command transcript.

## Seven steps

1. Register two new accounts from the login page, then sign in as the seeded owner and one seeded student in a second browser profile.
2. Build both profiles: add a short bio, known skills with levels, learning goals, college, and interests.
3. As the owner, create a project, add the skills the team needs, and publish it.
4. As the second account, apply to the project. Return to the owner account, open the project matches, and discuss the scores and reasons.
5. Review the application as the owner and accept it. Show the updated project team, then open a profile and send a skill exchange request.
6. Accept the exchange from the other account and open Notifications to show the application and exchange alerts. Reset the demo dataset with `DEMO_PASSWORD` set, then run `API_URL=... DEMO_PASSWORD=... node scripts/concurrency-demo.mjs` to demonstrate two simultaneous accepts competing for the last seat.
7. Open the merged pull request checks in GitHub Actions and show the `verify` job passing; explain that CI runs lint, tests, and the production client build.

The seeded last-seat project is `Demo: Last Seat Challenge`. The concurrency script logs in as `owner@demo.skillbridge.test`; the demo seed resets it to two pending applications and one available seat before each run.
