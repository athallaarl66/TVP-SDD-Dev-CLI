# Contributing

Thanks for helping improve `sdd-dev-cli`. This file covers local setup, the
test command, what a change is expected to bring, and how to report a problem
that is not a security issue.

For security reports, follow [SECURITY.md](SECURITY.md) instead of opening an
issue.

## Requirements

- Node.js 20 or newer (CI runs 20, 22, and 24)
- npm (a `package-lock.json` is committed; use `npm ci` for a reproducible tree)

## Local setup

```bash
git clone https://github.com/athallaarl66/TVP-SDD-Dev-CLI.git
cd TVP-SDD-Dev-CLI
npm ci
npm link        # exposes `sdd-gen` for manual runs
```

`npm link` needs no elevated permissions. If it fails with `EACCES`, set a
user-owned prefix instead of using `sudo`:

```bash
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

## Run the test suite

```bash
npm test          # node --test, no external framework required
npm run uat       # manual acceptance run against a packed tarball
```

`npm run uat` prints a pass/fail line per check and exits non-zero if any check
fails; it does **not** write `docs/test-report/uat-report.md`. When a run needs
to be recorded, update that report by hand from the printed output (add
`-- --json <file>` for a machine-readable summary). `npm test` likewise prints
counts without editing `docs/test-report/test-report.md`.

`npm test` must be green before a pull request is reviewed. It covers command
registration, overwrite guards, feature-name validation, generated-source
encoding, and runner exit-code propagation.

## What a good change includes

- **A test that fails without the fix.** New behaviour, a new overwrite path, or
  a new generated file convention needs one test in `tests/cli/`.
- **No new runtime dependency** unless the standard library genuinely cannot
  do the job; explain the trade-off in the pull request.
- **No shell string interpolation.** Command execution passes an executable and
  an argument array (`shell: false`). Feature names and paths are data.
- **Honest generated output.** A placeholder test stays skipped or disabled
  until it carries real acceptance-criteria assertions.
- **English documentation.** All tracked Markdown is English; command names,
  identifiers, and quoted CLI output keep their exact form.
- **One license.** The project is MIT everywhere: `LICENSE`, `package.json`,
  the README header and footer.
- **A changelog entry** in `CHANGELOG.md` when user-visible behaviour changes.

## Supported test frameworks

Generation is supported for Playwright, Jest, PHPUnit, xUnit, NUnit, JUnit 5,
pytest, and Go testing. Adding or changing one means touching four places:

1. `FRAMEWORKS` in `lib/commands/qa-test-script.js` (name and extension)
2. the file-path branch in the same file (generated filename convention)
3. `FRAMEWORK_RUNNERS` in `lib/commands/qa-test-run.js` (runner command + args)
4. the template in `lib/utils/template.js` plus a case in
   `tests/cli/test-generation.test.js`

CI compiles no C#, Java, or Go source. If you add a framework, say in the pull
request whether the generated file is parse-checked or template-only, and keep
the README matrix accurate.

## Documentation changes

- Every command example must be runnable as written, with the same flags the
  CLI accepts (`sdd-gen --help` is the source of truth).
- State what a command writes, whether it overwrites, and how to recover from a
  refusal.
- Do not promise behaviour CI does not verify. Generated test files are
  skeletons; say so.
- Heading style follows the file: `README.md` keeps its lowercase brand
  headings, while `docs/`, `SECURITY.md`, and `CONTRIBUTING.md` use Title Case
  with numbered sections. Match the file you are editing instead of restyling
  it.
- `docs/prd.md` and `docs/technical-design.md` are checked by
  `tests/cli/docs.test.js`: the command list must match `lib/commands/`, and
  referenced source paths must exist.

## Pull request checklist

- [ ] `npm test` passes locally
- [ ] New behaviour has a test; bug fixes have a regression test
- [ ] User-facing wording, `--help` text, and README matrix are updated together
- [ ] `CHANGELOG.md` has an entry for user-visible changes
- [ ] No secrets, credentials, or generated project files committed

## Release process

Releases are cut by the maintainer with `npm run release:patch|minor|major`,
which bumps `package.json`, `package-lock.json`, the README version block and
version-history table, and prepends a `CHANGELOG.md` entry. The release script
refuses to run until the evidence documents and the test suite are in place;
the full manual gate list is [docs/release-checklist.md](docs/release-checklist.md).

## Reporting a non-security bug

Open a GitHub issue with:

- CLI version (`sdd-gen --version`) and Node.js version
- operating system and shell (Git Bash, PowerShell, cmd, zsh, bash)
- the exact command, plus the smallest input that reproduces it
- the full CLI output, including the generated file path when one is involved
