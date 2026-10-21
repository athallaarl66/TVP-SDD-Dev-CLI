# Security Policy

## Supported versions

The latest published minor line receives security fixes. The current release is
`1.5.0`, published to npm and tagged `v1.5.0` on 2026-10-21.

| Version | Supported |
| --- | --- |
| 1.5.x (npm `latest`, tag `v1.5.0`) | Yes |
| < 1.5, development snapshots | No |

## Reporting a vulnerability

Do not open a public issue for a security problem.

1. Open a private report through GitHub Security Advisories:
   <https://github.com/athallaarl66/TVP-SDD-Dev-CLI/security/advisories/new>
2. Include the CLI version (`sdd-gen --version`), operating system, Node.js
   version, the exact command you ran, and the smallest input that reproduces
   the problem.
3. Expect an acknowledgement within 7 days and a fix or mitigation plan within
   30 days for confirmed issues.

If GitHub Security Advisories are unavailable to you, open a normal issue that
contains no vulnerability details and ask for a private channel; the maintainer
will reply with one. `package.json` lists `author`, `repository`, and `bugs` but
no private email address, so a public issue is the only fallback contact route —
keep it free of technical detail.

## Scope

In scope:

- path traversal or writes outside the intended output directory
- command injection through feature names, paths, or configuration
- overwriting user files without an explicit `--force`
- generated test or skill files that execute content from untrusted input
- release or packaging defects that publish unintended files

Out of scope:

- behaviour of third-party test runners and AI tools the CLI invokes
- generated placeholder tests that are intentionally skipped
- issues in a project the CLI is run against rather than in the CLI itself

## What the CLI does on your machine

`sdd-dev-cli` writes files inside the current project directory (`docs/`,
`tests/`, and the AI tool folders you select), stores settings in
`sdd.config.json`, and adds a `qa-run:<feature>` entry to the project's
`package.json` when `/qa-test-run` prepares a Node test command. It does not
send project content anywhere.

Project test commands are spawned with an executable plus an argument array
(`shell: false`), never through a shell string, so feature names and paths are
passed as data. The single exception is `mvn` on Windows, which is a `.cmd` shim
and therefore runs through `cmd.exe`; its arguments come from a validated slug
and are quoted individually. The only network access happens when
`/qa-test-run` triggers the Playwright dependency install for a Playwright
project.
