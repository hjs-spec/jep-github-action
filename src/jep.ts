import { randomUUID, createHash } from "node:crypto";

export interface JEPEvent {
  jep: string;
  verb: "J" | "D" | "T" | "V";
  who: string;
  when: number;
  what: string | null;
  nonce: string;
  ref: string | null;
  task_based_on: string | null;
  sig: string;
}

export function signEvent(event: Omit<JEPEvent, "sig">): string {
  const keys = Object.keys(event).sort();
  const payload = JSON.stringify(event, keys);
  return createHash("sha256").update(payload).digest("base64");
}

export function createJEPEvent(params: {
  verb: "J" | "D" | "T" | "V";
  who: string;
  what?: string;
  ref?: string;
  task_based_on?: string;
  context?: Record<string, any>;
}): JEPEvent {
  let whatHash: string | null = null;
  if (params.what) {
    whatHash = `sha256:${createHash("sha256").update(params.what).digest("hex")}`;
  }

  const event: Omit<JEPEvent, "sig"> = {
    jep: "1",
    verb: params.verb,
    who: params.who,
    when: Math.floor(Date.now() / 1000),
    what: whatHash,
    nonce: randomUUID(),
    ref: params.ref || null,
    task_based_on: params.task_based_on || null,
  };

  return { ...event, sig: signEvent(event) };
}
