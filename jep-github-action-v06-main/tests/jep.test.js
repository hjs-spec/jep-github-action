const test = require("node:test");
const assert = require("node:assert/strict");
const { buildJepEvent, validateArtifact, eventHash, JAC_CHAIN_EXT } = require("../dist/jep");

test("builds JEP v0.6 event artifact", () => {
  const event = buildJepEvent({
    verb: "J",
    actor: "github:user",
    subject: "pull_request",
    relation: "workflow-event",
    audience: "hjs-spec/example",
    repository: "hjs-spec/example",
    workflow: "ci",
    runId: "123",
    sha: "abc123",
    ref: "refs/heads/main"
  });

  assert.equal(event.jep, "1");
  assert.equal(event.verb, "J");
  assert.equal(event.sig, "UNSIGNED-WORKFLOW-ARTIFACT");
  assert.ok(event.ext[JAC_CHAIN_EXT]);
  assert.ok(event.ext_crit.includes(JAC_CHAIN_EXT));
});

test("produces algorithm-tagged event hash", () => {
  const event = buildJepEvent({
    verb: "J",
    actor: "github:user",
    subject: "workflow_dispatch",
    relation: "workflow-event",
    audience: "hjs-spec/example"
  });
  assert.match(eventHash(event), /^sha256:[a-f0-9]{64}$/);
});

test("validates artifact with unsigned warning", () => {
  const event = buildJepEvent({
    verb: "J",
    actor: "github:user",
    subject: "workflow_dispatch",
    relation: "workflow-event",
    audience: "hjs-spec/example"
  });
  const result = validateArtifact(event);
  assert.equal(result.valid, true);
  assert.equal(result.profile, "jep-core-0.6");
  assert.equal(result.warnings[0].code, "WARN_UNSIGNED_ARTIFACT");
});
