---
description: Scan for secrets, then push the site to GitHub, refresh the README and About section, and publish to GitHub Pages
argument-hint: "[optional commit message]"
allowed-tools: Read, Write, Edit, Glob, Grep, PowerShell, Bash, TodoWrite
---

# Ship this repo to GitHub

Publish the current working tree to GitHub, keep the docs and repo metadata truthful, and make
sure the live GitHub Pages site is reachable and linked.

`$ARGUMENTS` — if the user supplied text, use it as the commit message subject. Otherwise write
one yourself describing what actually changed.

**Never skip step 2.** Everything after it publishes to the public internet, and a push cannot be
taken back — a secret pushed to a public repo must be treated as compromised even if you force-push
it away seconds later, because GitHub's API serves orphaned commits and crawlers index fast.

---

## 0. Ground yourself in the current state

Do not assume anything below is unset — in this repo most of it is already configured.

```powershell
git status
git remote -v
git log --oneline -10
```

Read `README.md` and `.github/workflows/deploy.yml` if they exist. Note the remote's
`owner/repo` — this repo's name ends in a literal hyphen (`Barbell-Brigade-`), so copy it from
`git remote -v` rather than retyping it.

If there is no remote, or the working tree is already clean and in sync, say so plainly instead of
inventing work. A no-op is a valid outcome, and reporting "already done" is more useful than
manufacturing a cosmetic commit.

## 1. Stage the real changes

Review `git diff` and `git status` for **untracked files you did not intend to publish** — editor
backups, `.env` files, exports, scratch notes, anything under a personal folder.

If the repo has no `.gitignore` and the tree contains such files, create one before staging.

## 2. Security scan — GATE, must pass before any push

Scan every file that would be published. The deploy workflow ships the whole repo root minus its
exclusion list, so **anything you commit here is served publicly**, not just the HTML.

Grep the staged content for, at minimum:

- API keys and tokens — `api[_-]?key`, `secret`, `token`, `bearer`, `authorization`
- Provider key shapes — `sk-`, `ghp_`, `github_pat_`, `AKIA`, `AIza`, `xox[baprs]-`, `-----BEGIN.*PRIVATE KEY-----`
- Credentials — `password`, `passwd`, `credential`, connection strings (`://user:pass@`)
- Personal data that does not belong on a public site — real home addresses, personal phone
  numbers, personal email addresses, ID numbers
- `.env`, `.pem`, `.key`, `.p12`, `.pfx`, `credentials.json`, `*.sqlite` files

Judge each hit rather than pattern-matching blindly. This is a marketing site: a `<label>` reading
"Password" or a form field named `email` is normal markup, not a leak. What matters is whether a
**real secret value** or **real personal data** is present.

Also check what history would carry — `git log -p` on unpushed commits, since a secret removed from
the working tree may still sit in an earlier commit that this push would upload.

**If you find a real secret:**

1. Stop. Do not push.
2. Tell the user exactly which file and line, and what kind of secret it is. Do not print the
   secret value itself.
3. If it was ever committed, tell them it must be **rotated**, not just deleted — removing it from
   a future commit does not unpublish it.
4. Wait for their decision. Do not proceed on your own judgement.

Only continue when the scan is clean, and state in your final report that it ran and what it
covered.

## 3. Commit and push

```powershell
git add <specific paths>
git commit -m "<subject>"
git push origin main
```

Use a message that explains *why*, not just *what*. If the branch is not `main`, push that branch
and say so; do not silently switch branches.

## 4. Create or update the README

If `README.md` is missing, write one covering: what the project is, how to run it locally, a file
map, the brand/design tokens, what is interactive, accessibility notes, and which parts are
placeholders needing real wiring before launch.

If it already exists, **do not rewrite it wholesale.** Read it, find what is now stale or missing,
and patch those parts in the file's existing voice. Preserving a good README beats replacing it.

Always confirm it documents the live URL and the push-to-deploy behaviour.

## 5. Ensure GitHub Pages deploys via Actions

Check for `.github/workflows/deploy.yml`. If it exists and already deploys to Pages, leave it
alone. If not, create it:

- Trigger on `push` to the default branch, plus `workflow_dispatch` for manual redeploys
- Permissions: `contents: read`, `pages: write`, `id-token: write`
- `concurrency: {group: pages, cancel-in-progress: false}` — a cancelled deploy leaves the site stale
- `actions/configure-pages@v5` with `enablement: true` so no manual Settings toggle is needed
- Stage the site into `_site`, **excluding** `.git`, `.github`, `_site`, `README.md`, `CLAUDE.md`.
  Use exclusions, not an allow-list, so new site files ship without anyone updating the workflow.
- `actions/upload-pages-artifact@v3` then `actions/deploy-pages@v4`

There is no build step in this project — do not add npm, bundlers, or a framework.

After pushing, confirm the workflow run succeeded before claiming the site is live.

## 6. Update the repo About section and link the Pages site

This is **repo metadata on GitHub's servers, not a file** — it needs the API, and there is nothing
to commit for it.

`gh` (GitHub CLI) is **not installed on this machine**. Do not try to install it. Git Credential
Manager already holds a working token (`repo` scope) from the user's pushes — retrieve it via
`git credential fill` and call the REST API directly.

```powershell
$cred = "protocol=https`nhost=github.com`n`n" | git credential fill 2>$null
$tok = ($cred | Select-String '^password=').ToString() -replace '^password=',''
$h = @{Authorization="Bearer $tok"; "User-Agent"="claude-code"; Accept="application/vnd.github+json"}
```

**Never print the token, write it to a file, or embed it in a commit.** Keep it in a variable
inside a single command invocation.

Read the current metadata first — if a field is already sensible, leave it:

```powershell
$repo = (Invoke-WebRequest -Uri "https://api.github.com/repos/OWNER/REPO" -Headers $h -UseBasicParsing).Content | ConvertFrom-Json
$repo.description; $repo.homepage; $repo.topics
```

Get the real Pages URL from the API rather than guessing it:

```powershell
(Invoke-WebRequest -Uri "https://api.github.com/repos/OWNER/REPO/pages" -Headers $h -UseBasicParsing).Content | ConvertFrom-Json | Select-Object html_url, status
```

Then set description + homepage (`PATCH /repos/OWNER/REPO`) and topics
(`PUT /repos/OWNER/REPO/topics`, body `{"names": [...]}`).

- **Description** — one or two sentences on what it is and what it is built with.
- **Homepage** — the Pages URL from the API. This is the "add the GitHub Page link" step.
- **Topics** — lowercase, hyphenated, roughly 10–15. Describe what the repo *actually is*, not
  aspirational keywords. Architecture facts earn their place; padding does not.

## 7. Verify, then report

Do not claim success from a 200 alone. Actually check:

- `git status` is clean and the branch is in sync
- The Actions run for this push finished successfully
- The Pages URL returns HTTP 200 and the expected `<title>`
- Re-read the repo metadata and confirm description, homepage and topics all took

Then report what changed, what was already correct and left alone, and — explicitly — that the
security scan ran and found nothing. If any step was skipped or blocked, say which and why. Do not
describe a step as done if it was not.
