import crypto from "node:crypto";
import { Ajv2020 } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import schema from "./jep-event.schema.json";
const ajv = new Ajv2020({strict: false});
addFormats(ajv);
const validSchema = ajv.compile(schema);

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
  ref: string | Record<string, unknown> | null;
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
  what?: unknown;
  eventRef?: string | Record<string, unknown> | null;
}

export function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite JSON number");
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "string") {
    if (/[\uD800-\uDFFF]/u.test(value)) throw new Error("Lone Unicode surrogate");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return "{" + Object.keys(obj).sort().map(k => canonicalize(k) + ":" + canonicalize(obj[k])).join(",") + "}";
  }
  throw new Error("Unsupported JSON value");
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

  if (options.verb !== "J" && options.what === undefined) {
    throw new Error("D/T/V require what_json with the verb-specific claim fields");
  }
  const what = options.what === undefined ? Object.fromEntries(Object.entries({
    subject: options.subject,
    relation: options.relation,
    repository: options.repository,
    workflow: options.workflow,
    run_id: options.runId,
    sha: options.sha,
    github_ref: options.ref
  }).filter(([, value]) => value !== undefined)) : options.what;

  const event: JEPEvent = {
    jep: JEP_WIRE_VERSION,
    verb: options.verb,
    who: options.actor,
    when: now,
    what,
    nonce: crypto.randomUUID(),
    aud: options.audience,
    ref: options.eventRef ?? null,
    ext: {
      [JAC_CHAIN_EXT]: {
        based_on: options.sha ? `sha256:${crypto.createHash("sha256").update(options.sha).digest("hex")}` : null,
        based_on_type: options.sha ? "external-digest" : "chain-root",
        relation: options.relation || "workflow-event",
        observed_log_assumption: "partial"
      }
    },
    ext_crit: [],
    sig: "UNSIGNED-WORKFLOW-ARTIFACT"
  };

  return event;
}

export function validateArtifact(event: JEPEvent): ValidationResult {
  const errors: Array<Record<string, unknown>> = [];
  const warnings: Array<Record<string, unknown>> = [];

  if (!validSchema(event)) {
    errors.push({code: "ERR_SCHEMA_INVALID", message: ajv.errorsText(validSchema.errors)});
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
