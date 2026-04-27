# Agent Instructions

This repo has local project memory. At the start of meaningful work in this repository, read these files in order:

1. `.claude/memory/MEMORY.md`
2. `.claude/memory/session_guide.md`
3. `.claude/memory/project_state.md`

Follow those working agreements unless the user gives newer instructions in the current session.

Important defaults:

- Do not commit or push unless the user explicitly asks.
- Preserve the currently working backup form flow.
- Keep changes scoped to the requested task.
- After code changes, run focused checks and report what was verified.
- Update repo-local memory/roadmap only when asked or when the user establishes a durable preference.
- If roadmap work changes, keep `ROADMAP.md` and `public/data/roadmap.json` manually in sync.
