# JEP Accountability for GitHub

![GitHub release (latest by date)](https://img.shields.io/github/v/release/hjs-foundation/jep-github-action)
![GitHub Marketplace](https://img.shields.io/badge/GitHub%20Marketplace-JEP%20Accountability-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A GitHub Action that generates cryptographically signed [JEP (Judgment Event Protocol)](https://humanjudgment.org) accountability receipts for AI agent operations on GitHub.

## Features

- Automatically generate JEP accountability events on PR merges, PR creation, issue closures, and more
- Post JEP receipts as PR comments for full transparency
- Add commit status checks showing accountability verification
- Optionally send events to a JEP API endpoint for centralized storage
- Fully configurable operation types and actor identification

## Usage

### Record accountability on PR merge

```yaml
name: JEP Accountability
on:
  pull_request:
    types: [closed]

jobs:
  jep-audit:
    if: github.event.pull_request.merged == true && github.actor == 'dependabot[bot]'
    runs-on: ubuntu-latest
    steps:
      - name: Generate JEP Receipt
        uses: hjs-foundation/jep-github-action@v0.1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          operation: "pr_merge"
          actor: "dependabot[bot]"
          reason: "Automated dependency update merge"
```

### Record accountability when an AI agent creates a PR

```yaml
name: JEP Accountability for AI PR
on:
  pull_request:
    types: [opened]

jobs:
  jep-audit:
    if: contains(github.actor, '[bot]')
    runs-on: ubuntu-latest
    steps:
      - name: Generate JEP Receipt
        uses: hjs-foundation/jep-github-action@v0.1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          operation: "pr_create"
          actor: ${{ github.actor }}
          reason: "AI agent automatically created PR"
```

### Dry run mode (no side effects)

```yaml
- uses: hjs-foundation/jep-github-action@v0.1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    operation: "pr_merge"
    actor: "test-user"
    reason: "Testing JEP integration"
    dry_run: "true"
```

## Inputs

| Name | Description | Required |
|:-----|:------------|:---------|
| `github_token` | GitHub Token for API access | Yes |
| `operation` | Operation type (e.g., `pr_merge`, `pr_create`, `issue_close`) | Yes |
| `actor` | Actor identifier (DID / email / username) | Yes |
| `reason` | Human-readable reason for the operation | Yes |
| `jep_api_url` | Optional JEP API endpoint URL | No |
| `dry_run` | If `true`, skips posting comments and sending to API | No |

## Outputs

| Name | Description |
|:-----|:------------|
| `jep_receipt_id` | The generated JEP receipt ID (UUID v4) |
| `jep_event_json` | Full JEP event as a JSON string |

## Example JEP Receipt Posted on PR

After the action runs, a comment like the following will appear on the PR:

> ## 📋 JEP Accountability Receipt
>
> | Field | Value |
> |:------|:------|
> | Operation | pr_merge |
> | Actor | dependabot[bot] |
> | Reason | Automated dependency update merge |
> | Receipt ID | `f47ac10b-58cc-4372-a567-0e02b2c3d479` |
> | Timestamp | 2026-04-16T10:30:00.000Z |
>
> <details>
> <summary>Full JEP Event JSON</summary>
>
> ```json
> { ... }
> ```
> </details>

## License

MIT © [HJS Foundation](https://humanjudgment.org)
