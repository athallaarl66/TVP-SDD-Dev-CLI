# Security Policy

## Supported versions

The latest published minor version of `sdd-dev-cli` receives security fixes.

| Version | Supported |
| --- | --- |
| 1.5.x | Yes |
| < 1.5 | No |

## Reporting a vulnerability

Do not open a public issue for a security problem.

1. Open a private report through GitHub Security Advisories:
   <https://github.com/athallaarl66/TVP-SDD-Dev-CLI/security/advisories/new>
2. Include the CLI version (`sdd-gen --version`), operating system, Node.js
   version, the exact command you ran, and the smallest input that reproduces
   the problem.
3. Expect an acknowledgement within 7 days and a fix or mitigation plan within
   30 days for confirmed issues.

If GitHub advisories are unavailable to you, contact the maintainer listed in
`package.json` and mark the message as a security report.

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
`sdd.config.json`, and runs project test commands without a shell. It does not
send project content anywhere.
