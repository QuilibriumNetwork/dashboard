# Deploy to GitHub Pages

Deploy the current `main` branch to the `gh-pages` branch (production).

## Steps

Follow these steps **exactly**, pausing for user confirmation before any destructive or irreversible action.

### 1. Pre-flight checks

- Verify the current branch is `main`. If not, **stop and tell the user**.
- Run `git status` and check for uncommitted changes. If any exist, **stop and tell the user** — the working tree must be clean before deploying.
- Show the user the last 3 commits on `main` so they know what will be deployed.
- **Ask the user to confirm** they want to deploy these commits before proceeding.

### 2. Build

- Run `npm run build` and show the output.
- If the build fails, **stop and report the error** — do not continue.
- Delete `dist/report.html` if it exists (run `rm -f dist/report.html`).
- Tell the user the build succeeded and show the dist folder size.

### 3. Switch to gh-pages and replace files

- **Ask the user to confirm** before switching branches and replacing files. Explain that the next step will delete the old production assets and replace them with the new build.
- Run `git checkout gh-pages`.
- Delete the old asset folders: `rm -rf assets images signer_keys svg videos`
- Copy the new build: `mv dist/* .`
- Run `git add .`

### 4. Commit

- Ask the user: "What should the deploy commit message describe?" and wait for their answer.
- Use their answer as the commit message: `git commit -m "<their message>"`

### 5. Push

- Show the user the commit that is about to be pushed (`git log -1 --oneline`).
- **Ask the user to confirm** one final time before pushing.
- Run `git push origin gh-pages`.
- After pushing, switch back to `main`: `git checkout main`.
- Report success with the commit hash that was deployed.
