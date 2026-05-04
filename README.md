# JEP GitHub Action v0.6

GitHub Action seed for generating **JEP v0.6 event artifacts** from GitHub workflow activity.

This repository replaces the earlier JEP-04 / accountability-receipt demo language with a JEP v0.6 workflow integration seed.

## Positioning

This action generates JEP-style event artifacts for GitHub workflows.

It is intended for:

- pull request review traces;
- issue triage events;
- workflow approval events;
- release or deployment decision records;
- CI/CD audit artifacts.

It does **not** determine:

- legal liability;
- factual truth;
- regulatory compliance;
- authorization validity;
- complete-log availability;
- moral responsibility.

A generated event artifact is a structured protocol object. It is not a legal conclusion.

## Alignment

Aligned with:

- JEP-Core: `draft-wang-jep-judgment-event-protocol-06`
- JEP-Profiles: `draft-wang-jep-profiles-00`
- JEP-Conformance: `draft-wang-jep-conformance-00`

Public draft:

https://datatracker.ietf.org/doc/draft-wang-jep-judgment-event-protocol/

## What this Action emits

The action emits:

- a JEP v0.6-style event JSON object;
- an algorithm-tagged event hash;
- a JEP-style validation result;
- optional artifact upload.

The action can run in two modes:

| Mode | Meaning |
|---|---|
| `artifact` | Generate unsigned local JEP event artifacts |
| `api` | Send the event draft to a JEP API signer/verifier |

In `artifact` mode, the action intentionally uses:

```text
sig: "UNSIGNED-WORKFLOW-ARTIFACT"
```

It does not pretend that a local hash is a signature.

For signed events, configure `mode: api` and provide a JEP API endpoint.

## Usage

```yaml
name: JEP Event Artifact

on:
  pull_request:
  workflow_dispatch:

jobs:
  jep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: hjs-spec/jep-github-action@v0.6.0
        id: jep
        with:
          mode: artifact
          verb: J
          actor: ${{ github.actor }}
          subject: ${{ github.event_name }}
          relation: workflow-event
          upload_artifact: true

      - run: echo "${{ steps.jep.outputs.jep_event_hash }}"
```

## Inputs

| Input | Default | Description |
|---|---|---|
| `mode` | `artifact` | `artifact` or `api` |
| `verb` | `J` | JEP verb: `J`, `D`, `T`, or `V` |
| `actor` | `${{ github.actor }}` | Actor identifier |
| `subject` | `${{ github.event_name }}` | Event subject |
| `relation` | `workflow-event` | Workflow relation note |
| `audience` | `${{ github.repository }}` | Intended audience/context |
| `jep_api_url` | empty | Optional JEP API endpoint for `api` mode |
| `upload_artifact` | `true` | Upload generated JSON artifact |

## Outputs

| Output | Description |
|---|---|
| `jep_event_hash` | Algorithm-tagged event hash |
| `jep_event_json` | Generated JEP event JSON |
| `validation_result_json` | JEP-style validation result |
| `artifact_path` | Local artifact path |

## Boundary

This action does not define a new JEP protocol.

It does not replace:

- JEP-Core;
- JEP-Profiles;
- JEP-Conformance;
- HJS;
- JAC;
- legal or regulatory systems.

## Related resources

- JEP v0.6 Repository: https://github.com/hjs-spec/jep-v06
- JEP API v0.6 Repository: https://github.com/hjs-spec/jep-api
- HJS v0.5 Repository: https://github.com/hjs-spec/hjs-05
- JAC v0.5 Repository: https://github.com/hjs-spec/jac-agent-02
- JEP v0.6 Spec Demo: https://huggingface.co/spaces/yuqiangJEP/jep-v06-spec-demo/tree/main
- JEP v0.6 Conformance Suite: https://huggingface.co/datasets/yuqiangJEP/jep-v06-conformance-suite
