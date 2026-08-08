# Security Policy

## Supported Versions

tripleF is early in development and released on a rolling basis. We support the
latest release on the `main` branch. Older releases are not actively patched.

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| < latest | :x:               |

## Reporting a Vulnerability

We take security seriously. Please **do not** open a public issue for
security vulnerabilities.

Instead, report them privately by emailing
[eugen.hildt@gmail.com](mailto:eugen.hildt@gmail.com) with the subject line
`[SECURITY] <short description>`.

Please include:

- A description of the vulnerability and its impact.
- Steps to reproduce (or a proof of concept).
- Affected versions and configuration.
- Any suggested remediation, if you have one.

### What to expect

- We will acknowledge your report within **5 business days**.
- We will keep you informed as we investigate and fix the issue.
- We will coordinate disclosure with you and credit you (if you wish) once a
  fix is released.

## Scope

This policy covers the tripleF codebase in this repository. Third-party
dependencies should be reported to their respective maintainers.

## Security best practices

- Never commit secrets, API keys, or `.env` files. See `.gitignore`.
- Keep Ollama and infrastructure services on a trusted network; the workbench
  is designed for local-first use.
