import * as github from "@actions/github";
import type { JEPEvent } from "./jep";

export async function getPRInfo(
  octokit: ReturnType<typeof github.getOctokit>,
  context: typeof github.context
): Promise<any> {
  const pr = context.payload.pull_request;
  if (!pr) return {};

  return {
    type: "pull_request",
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    head: pr.head?.ref,
    base: pr.base?.ref,
    author: pr.user?.login,
  };
}

export async function postComment(
  octokit: ReturnType<typeof github.getOctokit>,
  context: typeof github.context,
  body: string
): Promise<void> {
  if (context.payload.pull_request) {
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.pull_request.number,
      body,
    });
  } else if (context.payload.issue) {
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.issue.number,
      body,
    });
  }
}

export async function addStatusCheck(
  octokit: ReturnType<typeof github.getOctokit>,
  context: typeof github.context,
  jepEvent: JEPEvent
): Promise<void> {
  if (!context.payload.pull_request) return;

  await octokit.rest.repos.createCommitStatus({
    owner: context.repo.owner,
    repo: context.repo.repo,
    sha: context.payload.pull_request.head.sha,
    state: "success",
    description: `JEP 问责收据: ${jepEvent.nonce}`,
    context: "JEP Accountability",
    target_url: `https://humanjudgment.org/jep/receipt/${jepEvent.nonce}`,
  });
}
