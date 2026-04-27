# Session Guide

## Working Style

- Inspect the codebase before changing behavior.
- Give short progress updates while working, especially before edits.
- Prefer small, targeted changes that preserve the current working backup form flow.
- Ask before destructive operations, broad refactors, or irreversible git commands.
- When the user reports a production/testing issue, treat logs and screenshots as first-class evidence.
- Keep explanations plain and practical.

## Git Habits

- Do not commit or push unless the user explicitly asks.
- If asked to commit, stage only relevant files and use one clear commit for the completed task.
- Never revert user changes or unrelated work without explicit approval.
- Before any commit, run `git status --short` and mention any unrelated dirty files.

## Testing Habits

- After code edits, run focused syntax or smoke checks that match the risk.
- For backend JS changes, at minimum run `node --check` on touched backend files.
- For PDF-generation changes, smoke-test `buildComponentFormBuffers` when possible.
- For server route changes, verify the route with `Invoke-WebRequest` or equivalent.
- If a test cannot be run because of DB, SMTP, network, or environment constraints, say so clearly.

## Roadmap and Memory Updates

- Update repo-local memory only when the user asks for durable preferences/context to be remembered, or when a completed task materially changes project behavior.
- Roadmap system has two sources that must be kept manually in sync: `ROADMAP.md` for humans and `public/data/roadmap.json` for the admin kanban UI.
- When marking an item complete, update both `- [x]` in `ROADMAP.md` and `"status": "done"` in `public/data/roadmap.json`.
- When adding a parking lot or new roadmap item, add it to the appropriate Markdown section and the appropriate JSON layer.
- The kanban UI never parses `ROADMAP.md`; it only reads `/data/roadmap.json`.
- If the user says "parking lot: ...", record it only if a roadmap or parking-lot file exists or the user asks you to create one. Do not pivot away from the active task unless the issue blocks it.

## End of Work

When handing off after changes:

- Summarize the behavioral change.
- List the main files touched.
- Report checks run and any caveats.
- If roadmap content changed, confirm `ROADMAP.md` and `public/data/roadmap.json` were both updated.
- Remind the user to restart `node server.js` when server code changed.
