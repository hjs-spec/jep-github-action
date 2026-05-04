import crypto from "node:crypto";

export const JEP_WIRE_VERSION = "1";
export const JEP_CORE_PROFILE = "jep-core-0.6";
export const JAC_CHAIN_EXT = "https://jac.org/chain";

export type JEPVerb = "J" | "D" | "T" | "V";

export interface JEPEvent {
  jep: string;
  verb: JEPVerb;
  who: string;
  when: number;
  what: unknown;
  nonce: string;
  aud: string;
  ref: string | null;
  ext?: Record<string, unknown>;
  ext_crit?: string[];
  sig: string;
}

export interface ValidationResult {
  valid: boolean;
  level: number;
  mode: string;
  profile: string;
  scopes: string[];
  event_hash: string;
  warnings: Array<Record<string, unknown>>;
  errors: Array<Record<string, unknown>>;
}

export interface BuildEventOptions {
  verb: JEPVerb;
  actor: string;
  subject: string;
  relation: string;
  audience: string;
  repository?: string;
  workflow?: string;
  runId?: string;
  sha?: string;
  ref?: string;
}

export function canonicalize(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      out[key] = sortJson(obj[key]);
    }
    return out;
  }
  return value;
}

export function sha256Tagged(value: unknown): string {
  const input = typeof value === "string" ? value : canonicalize(value);
  return "sha256:" + crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

export function eventHash(event: JEPEvent): string {
  return sha256Tagged(event);
}

export function buildJepEvent(options: BuildEventOptions): JEPEvent {
  const now = Math.floor(Date.now() / 1000);

  const what = {
    subject: options.subject,
    relation: options.relation,
    repository: options.repository,
    workflow: options.workflow,
    run_id: options.runId,
    sha: options.sha,
    github_ref: options.ref
  };

  const event: JEPEvent = {
    jep: JEP_WIRE_VERSION,
    verb: options.verb,
    who: options.actor,
    when: now,
    what,
    nonce: crypto.randomUUID(),
    aud: options.audience,
    ref: null,
    ext: {
      [JAC_CHAIN_EXT]: {
        based_on: options.sha ? `sha256:${crypto.createHash("sha256").update(options.sha).digest("hex")}` : null,
        based_on_type: options.sha ? "external-digest" : "chain-root",
        relation: options.relation || "workflow-event",
        observed_log_assumption: "partial"
      }
    },
    ext_crit: [JAC_CHAIN_EXT],
    sig: "UNSIGNED-WORKFLOW-ARTIFACT"
  };

  return event;
}

export function validateArtifact(event: JEPEvent): ValidationResult {
  const errors: Array<Record<string, unknown>> = [];
  const warnings: Array<Record<string, unknown>> = [];

  if (event.jep !== JEP_WIRE_VERSION) {
    errors.push({ code: "ERR_UNSUPPORTED_JEP_VERSION", message: "jep must be '1'" });
  }
  if (!["J", "D", "T", "V"].includes(event.verb)) {
    errors.push({ code: "ERR_UNKNOWN_VERB", message: "verb must be J/D/T/V" });
  }
  if (!event.who) {
    errors.push({ code: "ERR_MISSING_REQUIRED_FIELD", message: "who is required" });
  }
  if (!event.nonce) {
    errors.push({ code: "ERR_MISSING_REQUIRED_FIELD", message: "nonce is required" });
  }
  if (event.sig === "UNSIGNED-WORKFLOW-ARTIFACT") {
    warnings.push({
      code: "WARN_UNSIGNED_ARTIFACT",
      message: "This event is an unsigned local workflow artifact. Use api mode for signed JEP events."
    });
  }

  return {
    valid: errors.length === 0,
    level: errors.length === 0 ? 0 : 0,
    mode: "artifact",
    profile: JEP_CORE_PROFILE,
    scopes: ["syntax", "artifact"],
    event_hash: eventHash(event),
    warnings,
    errors
  };
}
