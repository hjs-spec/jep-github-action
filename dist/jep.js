"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JAC_CHAIN_EXT = exports.JEP_CORE_PROFILE = exports.JEP_WIRE_VERSION = void 0;
exports.canonicalize = canonicalize;
exports.sha256Tagged = sha256Tagged;
exports.eventHash = eventHash;
exports.buildJepEvent = buildJepEvent;
exports.validateArtifact = validateArtifact;
const node_crypto_1 = __importDefault(require("node:crypto"));
const _2020_js_1 = require("ajv/dist/2020.js");
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const jep_event_schema_json_1 = __importDefault(require("./jep-event.schema.json"));
const ajv = new _2020_js_1.Ajv2020({ strict: false });
(0, ajv_formats_1.default)(ajv);
const validSchema = ajv.compile(jep_event_schema_json_1.default);
exports.JEP_WIRE_VERSION = "1";
exports.JEP_CORE_PROFILE = "jep-core-0.6";
exports.JAC_CHAIN_EXT = "https://jac.org/chain";
function canonicalize(value) {
    if (value === null)
        return "null";
    if (typeof value === "number") {
        if (!Number.isFinite(value))
            throw new Error("Non-finite JSON number");
        return JSON.stringify(value);
    }
    if (typeof value === "boolean")
        return JSON.stringify(value);
    if (typeof value === "string") {
        if (/[\uD800-\uDFFF]/u.test(value))
            throw new Error("Lone Unicode surrogate");
        return JSON.stringify(value);
    }
    if (Array.isArray(value))
        return "[" + value.map(canonicalize).join(",") + "]";
    if (typeof value === "object") {
        const obj = value;
        return "{" + Object.keys(obj).sort().map(k => canonicalize(k) + ":" + canonicalize(obj[k])).join(",") + "}";
    }
    throw new Error("Unsupported JSON value");
}
function sha256Tagged(value) {
    const input = typeof value === "string" ? value : canonicalize(value);
    return "sha256:" + node_crypto_1.default.createHash("sha256").update(input, "utf8").digest("hex");
}
function eventHash(event) {
    return sha256Tagged(event);
}
function buildJepEvent(options) {
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
    const event = {
        jep: exports.JEP_WIRE_VERSION,
        verb: options.verb,
        who: options.actor,
        when: now,
        what,
        nonce: node_crypto_1.default.randomUUID(),
        aud: options.audience,
        ref: options.eventRef ?? null,
        ext: {
            [exports.JAC_CHAIN_EXT]: {
                based_on: options.sha ? `sha256:${node_crypto_1.default.createHash("sha256").update(options.sha).digest("hex")}` : null,
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
function validateArtifact(event) {
    const errors = [];
    const warnings = [];
    if (!validSchema(event)) {
        errors.push({ code: "ERR_SCHEMA_INVALID", message: ajv.errorsText(validSchema.errors) });
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
        profile: exports.JEP_CORE_PROFILE,
        scopes: ["syntax", "artifact"],
        event_hash: eventHash(event),
        warnings,
        errors
    };
}
