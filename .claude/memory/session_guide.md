## Session structure

1. User opens with any greeting
2. Claude displays this guide, reads project_state.md, asks "what are we building today?"
3. User picks ONE item from ROADMAP.md
4. Claude confirms scope in 2–3 lines — nothing else
5. Build it
6. User tests → parking lot any bugs/ideas (see below)
7. Claude runs end-of-session checklist, commits, pushes
8. Done

## Parking lot rule

When testing reveals a bug or new idea mid-session:
- User says: "parking lot: [thing]"
- Claude appends it to ROADMAP.md in one line, under the right section
- We do not discuss it. We do not pivot. Session scope does not change.

If something is urgent enough to block the current task, say so explicitly — otherwise it's a parking lot item.

## Behavioral rules (always on)

- Auto-push: after every set of file edits → git add (specific files) → git commit → git push origin main. No exceptions.
- Single commit + single push per session: stage ALL changes together — code files AND doc updates — in one git commit, then one git push. Never split into a code commit and a separate docs commit.
- No trailing summaries, no emoji, no "great question"
- No scope creep: don't fix nearby code, add improvements, or refactor things not asked for
- Confirm before destructive ops: dropping data, force-push, deleting files — always ask first
- Plain language: explain decisions in plain terms before how they work

## End-of-session checklist

Before closing any session with code changes:
1. Check deployment logs — scan for errors
2. ROADMAP.md — mark completed items [x], add parking lot items
3. roadmap.json — sync ALL changes from ROADMAP.md
4. .claude/memory/project_state.md — add session entry (1 paragraph), update active bugs
5. Stage everything in one go — git add all code + all doc files together
6. One git commit, one git push. Done.
