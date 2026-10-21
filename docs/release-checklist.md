# Release Checklist

Cut a release only when every box below is checked for the version being
published.

## 1. Quality gates

- [ ] `npm ci` completes from `package-lock.json`
- [ ] `npm test` passes (record the counts in `docs/test-report.md`)
- [ ] CI is green on Node.js 20, 22, and 24
- [ ] `npm pack --dry-run --json` lists only runtime files, templates, license, and docs entry points
- [ ] No `tests/`, `scripts/`, `docs/`, `openspec/`, or `.github/` files in the package

## 2. Evidence

- [ ] `docs/uat-plan.md` matches the current command list in `index.js`
- [ ] `npm run uat` passes, or every skip is justified in the report
- [ ] `docs/uat-report.md` records CLI version, OS, Node.js version, and date
- [ ] `docs/test-report.md` counts match the last `npm test` output
- [ ] `docs/prd.md` and `docs/technical-design.md` match the code being shipped

## 3. Policy and metadata

- [ ] `SECURITY.md` exists and its reporting link works
- [ ] `package.json` has `name`, `version`, `license: MIT`, `repository`, `bugs`, `homepage`, `files`, `engines`
- [ ] `LICENSE` (MIT) is present and README states the same license
- [ ] `CHANGELOG.md` has an entry describing the actual changes, not a generic line

## 4. Versioning and tagging

- [ ] Working tree is clean
- [ ] `npm run release:patch|minor|major` updates `package.json`, `README.md`, and `CHANGELOG.md`
- [ ] Review the diff of the three updated files
- [ ] Commit the release commit
- [ ] `git tag v<version>` on that commit
- [ ] `git push --follow-tags`
- [ ] Create the GitHub release from the changelog entry and attach the `npm pack` tarball

## 5. After publishing

- [ ] `npm install -g sdd-dev-cli@<version>` then `sdd-gen --version` reports the new version
- [ ] Run `npm run uat` against the published version if the registry build differs from the local tarball
- [ ] Close the milestone and update the README version history if the tool did not

## Blockers

Any unchecked item in sections 1–4 blocks the release. `scripts/release.js`
enforces the documented-file, metadata, clean-tree, and test gates before it
touches any file; the remaining steps are manual.
