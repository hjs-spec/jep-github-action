# JEP GitHub Action v0.6.0 Release Notes

## Summary

This release upgrades the earlier GitHub Action demo into a JEP v0.6 workflow integration seed.

## Added

- JEP v0.6 event artifact generation.
- JEP wire version `"1"`.
- JEP-style event hash.
- JEP-style validation result output.
- `ext` / `ext_crit` support.
- JAC chain extension under `https://jac.org/chain`.
- `artifact` mode for unsigned local workflow artifacts.
- `api` mode for calling a JEP API signer/verifier.
- GitHub artifact upload.
- TypeScript build and test workflow.

## Changed

- Removed old JEP-04 wording.
- Removed top-level `task_based_on`.
- Removed pseudo-signature language.
- Replaced "accountability receipt" overclaims with "JEP event artifact" language.

## Boundary

This action does not define a new protocol and does not determine legal liability, factual truth, or regulatory compliance.
