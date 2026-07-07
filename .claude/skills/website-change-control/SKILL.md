---
name: website-change-control
description: >
  Change lifecycle, gates, and non-negotiable house rules for the personal-website
  repo (Next.js 16 App Router site deployed to Heroku). Load this skill BEFORE
  making any edit in this repo, and ALWAYS before considering `git add`, `git commit`,
  `git push`, a commit message, a revert, a README update, a UI/visual change, an
  API-route or data-layer change, or any change touching Firebase, Spotify, or ESPN
  integrations. Also load when unsure whether a change needs owner approval first,
  or when deciding if a task is "done". Triggers: "commit this", "push", "make a
  change", "fix the bug and commit", "is this ready", "revert", "undo that
  commit". (For adding a whole new section end-to-end, the process skill is
  website-new-section-campaign — this skill supplies only the gates it imposes.)
---

# Website Change Control

How changes are classified, gated, and reviewed in this repo
(`/Users/abhinavp403/Documents/Website`, GitHub `abhinavp403/personal_website`,
live at https://apwebsite-5c4657230595.herokuapp.com, deployed via `git push heroku main`).

Facts below verified against the repo on **2026-07-06**. Re-verification commands
are at the bottom.

**Definitions used throughout**
- **Owner** — Abhinav Prakash, the repo owner. The human you are working for.
- **Gate** — a step that MUST complete before the next step is allowed.
- **Typecheck** — `npx tsc --noEmit`: compiles TypeScript without emitting files; exit 0 means no type errors.
- **Dev server** — the local Next.js server (`npm run dev`) used for browser verification.

---

## 1. The change lifecycle (follow in order, no skipping)

Every change, no matter how small, walks this ladder. Stopping early is normal;
skipping a rung is not.

1. **Classify the change** using the table in section 3. If the class requires
   pre-approval (integration/provider, Firebase), STOP and ask the owner before
   writing any code.
2. **Read the relevant Next.js doc first.** This repo runs Next.js 16.2.3, which
   differs from model training data. Per `AGENTS.md`: read the relevant guide in
   `node_modules/next/dist/docs/` before writing code.
3. **Edit** the code. Stay inside the existing design system (section 2.3).
4. **Typecheck:**
   ```
   npx tsc --noEmit
   ```
   Must exit 0. (Verified passing on a clean tree, 2026-07-06.)
5. **Browser-verify** — mandatory for anything user-visible. Start the dev server
   using the launch config present at `.claude/launch.json` (currently untracked —
   not in git; recreate it if missing on a fresh clone)
   (config name `personal-website`, runs `npm run dev` on port 3000), then load
   http://localhost:3000 and confirm the change renders and behaves correctly.
   Check the browser console for new errors.
6. **Owner review** — describe what changed and show it (screenshot or have the
   owner look at localhost:3000). A visual change is NOT done until the owner has
   seen it (section 2.2).
7. **STOP. Wait for the owner to explicitly say "commit"** (or equivalent).
   Completing the work and stopping here is the default end state of a task.
8. **Commit** — single-purpose, plain sentence-case message, model trailer
   (section 4). Never bundle unrelated edits.
9. **STOP again. Wait for the owner to explicitly say "push".** "Commit" does not
   imply "push". Pushing to `origin main` publishes to GitHub; pushing to
   `heroku main` deploys to production — treat each as its own gate.
10. **Push** only the remote the owner named (`git push origin main` or
    `git push heroku main`).

---

## 2. House rules (the project constitution)

Confirmed directly by the owner on 2026-07-06. Each rule below has caused real
rework when broken — the incidents are in `git log` and `git reflog`.

### 2.1 Never commit or push without an explicit instruction

**Rule.** Do not run `git add`/`git commit`/`git push` unless the owner has, in
the current conversation, explicitly asked for it. Finish the work, report, stop.

**Why.** The owner reviews everything before it enters history. An unrequested
commit forces the owner to `git reset` it, which is worse than no commit at all —
it pollutes the reflog and risks losing the review step entirely.

**Incident.** `git reflog --date=short` shows `reset: moving to HEAD~1` run
**twice on 2026-06-21**, both times back to `fbb8cf2` (the national-teams
favorites commit) — stripping off two successive FIFA World Cup 26 project
commits (`54b288b`, then `6b901ed`) that had been created on top of it. The
pattern is consistent with unrequested commits being stripped off by hand,
twice, on the same piece of work; the project finally landed as `bbc7036` on
2026-06-23. (Verify: `git reflog --date=short | grep reset`.)

### 2.2 Visual/UI changes require browser verification AND owner review

**Rule.** Any change a visitor could see must be (a) loaded in a real browser on
the dev server and (b) reviewed by the owner before the task counts as done.
Typecheck passing is not verification.

**Why.** TypeScript cannot catch layout shift, animation glitches, broken
responsive behavior, or "technically renders but looks wrong". Both reverts in
this repo's history (section 2.6 incidents) were of changes that compiled fine
but were wrong in the browser or wrong for the owner's taste.

### 2.3 Stay inside the existing design system

**Rule.** Stay inside the established dark-navy design system — the token values
(palette, corner radii, motion idioms) are maintained in `website-design-system`,
which is the source of truth for them. No new visual language (new palettes, new
corner radii, new animation styles) without asking first.

**Why.** The site is a single cohesive page (`src/app/page.tsx` composing section
components). One off-theme section is instantly visible.

**Incident.** `feef5ad` — Revert "Add full 2026 tournament schedule table (excl.
Grand Slams)" (2026-05-08). A 225-line `TournamentTable.tsx` component was added
and reverted **the same day** (`f27cbed` → `feef5ad`): a whole new UI surface
that didn't survive owner review. Big new visual elements need a design
conversation before code. (Verify: `git show --stat feef5ad`.)

### 2.4 Small single-purpose commits, plain messages, model trailer

**Rule.** One logical change per commit. Message style in section 4.

**Why.** The revert workflow (section 2.6) only works if each commit is
independently revertable. `feef5ad` and `8851f2a` were clean one-command reverts
precisely because the original commits were single-purpose.

### 2.5 Never swap providers, Firebase rules/schema, or Spotify/ESPN approach without approval

**Rule.** The data layer (`src/lib/sports.ts`, `src/lib/firebase.ts`) and the
seven API route groups under `src/app/api/` (`atp-schedule`, `cricket`, `fact`,
`games`, `spotify` + `spotify/callback`, `tennis`, `wordofday`) each embody
deliberate choices — including deliberately different caching strategies per
route. Do not switch an API provider (e.g., ESPN → something else), change
Firebase security rules or the Firestore schema, or restructure the Spotify OAuth
flow without explicit owner approval BEFORE writing code.

**Why.** These integrations have external state (Spotify refresh tokens in Heroku
Config Vars, Firestore documents, undocumented ESPN endpoints) that code diffs
don't capture. A "cleaner" client-side rewrite can silently break production
because the env vars or data shapes no longer match.

### 2.6 Bugs get fixed by understanding, not by iteration in main

**Rule.** If a fix might be wrong, prove it locally before committing — do not
use `main` as a test bed.

**Incident.** The cricket timezone saga (all on 2026-04-16): `51251db`
"fix: show cricket times in device local timezone instead of IST" was committed,
found wrong, and reverted the same day in `8851f2a`; the correct fix landed later
as `9beccdc` "fix: cricket times now parse as UTC and display in device
timezone". One properly-verified commit would have replaced three.
(Verify: `git show --stat 8851f2a`.)

---

## 3. Change classification and required gates

| Class | Examples | Gates required before commit |
|---|---|---|
| **Cosmetic copy/link** | Fix a typo, update a download link version, edit README wording | Typecheck; quick browser sanity check if rendered; owner "commit" |
| **Component/UI** | New card layout, animation tweak, resize videos, nav change | Typecheck; full browser verification on port 3000; **owner reviews visually**; owner "commit" |
| **Data-layer / API route** | Edit `src/lib/sports.ts`, change filtering in `src/app/api/games`, adjust a route's caching | Typecheck; browser verification of the affected section **and** direct check of the route response (e.g., `curl http://localhost:3000/api/games`); owner "commit" |
| **Integration/provider** | Swap ESPN for another API, change Spotify auth flow, add a new external API | **Explicit owner approval BEFORE writing code**, then all data-layer gates |
| **Firebase / security** | Firestore schema change, security rules, new collection | **Explicit owner approval BEFORE writing code**; verify reads/writes locally; owner "commit" |
| **New section** | Whole new section on the page | Owner approval of the concept first; design-system compliance; README update (section 5); all UI gates. The `f27cbed`/`feef5ad` same-day revert is what happens when this order is inverted. |

When a change spans classes, apply the strictest applicable row.

---

## 4. Commit message house style

Derived from the actual `git log` (verify: `git log --oneline -30`).

**The convention changed mid-history.** Early commits (from `1c04a2b` "feat:
initial commit" up through `80fc8f4` "feat: add Mac and Windows download pills to
Tennis Calendar") used conventional-commit prefixes (`feat:`, `fix:`, `chore:`).
From `0caa6b7` onward (all subsequent commits — 49 of 71 as of 2026-07-06), prefixes are gone.
**Follow the current convention, not the old one:**

- **Subject:** sentence-case imperative, no prefix, no trailing period.
  Real examples: `Add Tennis Calendar live site link`,
  `Fix Word of the Day showing stale word after midnight`,
  `Update Tennis Calendar download links to v1.0.5`.
- **Scope:** one logical change per commit.
- **Trailer:** last line names the actual model, e.g. (verified on the last 10 commits):
  ```
  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  ```
  Use your own model name in place of `Sonnet 4.6`.
- **Reverts:** use `git revert <hash>` so you get the standard
  `Revert "<original subject>"` message, matching `feef5ad` and `8851f2a`.

---

## 5. Docs of record

- **`README.md`** — the public face of the repo. It enumerates the site's
  sections ("Projects", "Entertainment & Music", "Upcoming Matches", "Tennis
  Schedule", "Word of the Day", "Links"), the tech stack, and deployment.
  **A README update is obligatory when** you add/remove/rename a section, change
  what a section does in a user-visible way, or change the stack/deployment.
  Include it in the same commit as the change it documents. (`95cb393` and
  `1e3631e` show the README is actively maintained, though both were
  README-only commits.)
- **`AGENTS.md` / `CLAUDE.md`** — agent rules, checked into the repo. `CLAUDE.md`
  just includes `AGENTS.md`, whose one rule is: this Next.js version differs from
  training data — read `node_modules/next/dist/docs/` before writing code. Never
  make a change that contradicts these files; if a rule seems wrong, ask the
  owner rather than working around it.

---

## 6. Forbidden outright

- **`git push --force` / `--force-with-lease`** to any remote, ever. History
  repair happens via `git revert` (see `feef5ad`, `8851f2a`) or by the owner
  personally.
- **Committing env files.** `.gitignore` ignores `.env*` (verified). Secrets live
  in `.env.local` locally and in Heroku Config Vars in production. Never
  `git add -f` an env file, and never paste secret values into committed code.
- **Committing files over 50 MB.** GitHub warns at 50 MB and blocks at 100 MB.
  **Incident:** `public/fifa-world-cup-26.mov` (added in `bbc7036`, 2026-06-23)
  is over the 50 MB warning line and triggered GitHub's large-file warning on
  push — full record and the owner's keep decision are in
  `website-failure-archaeology` entry 9. Before committing any media, check its
  size; compress video (the other demo videos are 2–3 MB `.mp4` files) or ask the
  owner how to host it.
- **Mutating history** (`git reset` on pushed commits, `git rebase` on `main`,
  amending pushed commits).
- **Deploying without being asked.** `git push heroku main` is a production
  deploy; it needs its own explicit instruction (section 1, step 9).

---

## When NOT to use this skill

This skill is only about *process* — gates, commits, review. For the actual work, use the sibling skills in `.claude/skills/`:

- Diagnosing a bug → `website-debugging-playbook`
- Why past attempts failed / history of an area → `website-failure-archaeology`
- Component structure, data flow, module boundaries → `website-architecture-contract`
- ESPN/cricket/tennis data shapes and endpoints → `sports-data-reference`
- Building, Heroku deploys, Procfile, env vars → `website-build-and-deploy`
- Per-route caching strategies and staleness → `website-caching-and-freshness`
- How to verify/QA a change (the *how* behind lifecycle steps 4–5) → `website-validation-and-qa`
- Colors, spacing, motion idioms in depth → `website-design-system`
- Adding a whole new section end-to-end → `website-new-section-campaign`
- Keeping sports/word data current → `website-self-maintaining-data-frontier`
- Exploring an external API before integrating → `website-api-probing-toolkit`

Do not load this skill for read-only questions ("what does this component do?") —
nothing is being changed, so no gates apply.

---

## Provenance and maintenance

All claims verified 2026-07-06 against the working tree and git history.
Re-verify anything you plan to state:

- Revert incidents exist: `git show --stat feef5ad && git show --stat 8851f2a`
- Cricket saga ordering: `git log --oneline --format='%h %ad %s' --date=short 51251db~1..9beccdc | grep -i cricket`
- Owner reset pattern: `git reflog | grep reset`
- Current commit style (no prefixes): `git log --oneline -20`
- Old prefixed style existed: `git log --oneline | grep -E '^[a-f0-9]+ (feat|fix|chore):' | head`
- Trailer convention: `git log --format='%(trailers:key=Co-Authored-By)' -10 | sort -u`
- Env files ignored: `grep -n 'env' .gitignore`
- Oversized video: `ls -la public/fifa-world-cup-26.mov`
- Dev-server launch config: `cat .claude/launch.json`
- Deploy entrypoints: `cat Procfile && grep -A5 '"scripts"' package.json`
- Remotes (origin + heroku): `git remote -v`
- Typecheck works: `npx tsc --noEmit; echo $?`
- README section list still matches the site: `head -25 README.md` vs `src/app/page.tsx`

If any command's output contradicts this file, trust the repo and update this file.
