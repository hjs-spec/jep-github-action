# Implementation hardening — September 2026

Ship the executable dependencies required by action.yml.

## Changes

The build emits a committed ncc bundle and third-party licenses, with a lockfile. RFC 8785 key ordering handles numeric-looking property names. Artifacts are schema checked. D/T/V require explicit what_json; event_ref is separate from the Git ref. Unknown modes and unsuccessful API validation fail the action. Informational JAC metadata is not marked critical without a handler.

## Validation

```sh
npm ci --ignore-scripts
npm run build
npm test
```

## Compatibility and remaining limits

Artifact mode remains explicitly unsigned and level 0. README examples use main because the advertised v0.6.0 tag does not exist; after merge, pin a reviewed commit or release. No release tag or package publication is performed. The schema copy is synchronized with the accompanying jep-v06 conformance repair.

## Follow-up hardening

The schema matches the companion conformance repair. API requests have a 30-second timeout; returned events must satisfy the structural schema and match the reported hash. The integration harness executes a copied standalone bundle outside node_modules. Action results in artifact mode remain explicitly unsigned Level 0.

Shared event schema SHA-256: `5d0527c1649bd49f0de632e660eff46096522ea76a49eb7104ac83522614059f`.

## Reproducible and patched Action dependencies

Build from a real local node_modules directory with npm ci, rather than a symlink to a different checkout: webpack module identifiers must remain reproducible. The Action uses Node 24 and pins current patched @actions/core, @actions/github, and @actions/artifact dependencies to remove the audit-reported Octokit and undici dependency vulnerabilities. Custom runners must support JavaScript actions using node24.

The pinned Actions packages now use ESM exports. The build keeps CommonJS unit-test output and feeds separately emitted ES modules to ncc for the standalone runtime bundle. CI checks a clean rebuild and exercises artifact upload with the packaged Action. npm audit --omit=dev reports zero dependency vulnerabilities for this lockfile.
