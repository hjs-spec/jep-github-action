import * as core from "@actions/core";
import * as github from "@actions/github";
import { DefaultArtifactClient } from "@actions/artifact";
import fs from "node:fs/promises";
import path from "node:path";
import { buildJepEvent, validateArtifact, JEPVerb } from "./jep";

async function run(): Promise<void> {
  try {
    const mode = core.getInput("mode") || "artifact";
    const verb = (core.getInput("verb") || "J") as JEPVerb;
    const actor = core.getInput("actor") || github.context.actor || "github-actions";
    const subject = core.getInput("subject") || github.context.eventName;
    const relation = core.getInput("relation") || "workflow-event";
    const audience = core.getInput("audience") || github.context.repo.owner + "/" + github.context.repo.repo;
    const uploadArtifact = (core.getInput("upload_artifact") || "true").toLowerCase() === "true";
    const apiUrl = core.getInput("jep_api_url");

    let event = buildJepEvent({
      verb,
      actor,
      subject,
      relation,
      audience,
      repository: `${github.context.repo.owner}/${github.context.repo.repo}`,
      workflow: github.context.workflow,
      runId: String(github.context.runId),
      sha: github.context.sha,
      ref: github.context.ref
    });

    let validation = validateArtifact(event);

    if (mode === "api") {
      if (!apiUrl) {
        throw new Error("mode=api requires jep_api_url");
      }
      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/events/create`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          verb: event.verb,
          who: event.who,
          what: event.what,
          aud: event.aud,
          ext: event.ext,
          ext_crit: event.ext_crit
        })
      });
      if (!response.ok) {
        throw new Error(`JEP API returned ${response.status}`);
      }
      const data = await response.json() as { event: typeof event; validation: typeof validation };
      event = data.event;
      validation = data.validation;
    }

    const artifactPath = path.join(process.cwd(), "jep-event-artifact.json");
    const artifact = {
      event,
      validation
    };
    await fs.writeFile(artifactPath, JSON.stringify(artifact, null, 2));

    core.setOutput("jep_event_hash", validation.event_hash);
    core.setOutput("jep_event_json", JSON.stringify(event));
    core.setOutput("validation_result_json", JSON.stringify(validation));
    core.setOutput("artifact_path", artifactPath);

    if (uploadArtifact) {
      const client = new DefaultArtifactClient();
      await client.uploadArtifact("jep-event-artifact", [artifactPath], process.cwd());
    }
  } catch (err) {
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
}

run();
