import * as core from "@actions/core";
import * as github from "@actions/github";
import { createJEPEvent } from "./jep";
import { postComment, addStatusCheck, getPRInfo } from "./github";

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput("github_token", { required: true });
    const operation = core.getInput("operation", { required: true });
    const actor = core.getInput("actor", { required: true });
    const reason = core.getInput("reason", { required: true });
    const jepApiUrl = core.getInput("jep_api_url");
    const dryRun = core.getInput("dry_run") === "true";

    const octokit = github.getOctokit(githubToken);
    const context = github.context;

    core.info(`🚀 JEP Accountability for GitHub`);
    core.info(`操作: ${operation}`);
    core.info(`操作者: ${actor}`);
    core.info(`理由: ${reason}`);

    // 获取上下文信息
    let contextInfo: any = {};
    if (context.payload.pull_request) {
      contextInfo = await getPRInfo(octokit, context);
    } else if (context.payload.issue) {
      contextInfo = {
        type: "issue",
        number: context.payload.issue.number,
        title: context.payload.issue.title,
        url: context.payload.issue.html_url,
      };
    }

    // 创建 JEP 问责事件
    const jepEvent = createJEPEvent({
      verb: "J",
      who: actor,
      what: `${operation}: ${reason}`,
      context: {
        github: {
          repository: context.repo.repo,
          owner: context.repo.owner,
          event: context.eventName,
          ...contextInfo,
        },
      },
    });

    core.info(`📋 JEP 收据 ID: ${jepEvent.nonce}`);

    if (!dryRun) {
      // 可选: 将 JEP 事件发送到 JEP API
      if (jepApiUrl) {
        try {
          await fetch(`${jepApiUrl}/api/jep/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(jepEvent),
          });
          core.info(`✅ JEP 事件已发送至 ${jepApiUrl}`);
        } catch (err) {
          core.warning(`⚠️ 发送到 JEP API 失败: ${err}`);
        }
      }

      // 在 PR/Issue 上添加评论
      if (context.payload.pull_request) {
        await postComment(
          octokit,
          context,
          `## 📋 JEP 问责收据

| 字段 | 值 |
|:---|:---|
| 操作 | ${operation} |
| 操作者 | ${actor} |
| 理由 | ${reason} |
| 收据 ID | \`${jepEvent.nonce}\` |
| 时间 | ${new Date(jepEvent.when * 1000).toISOString()} |

<details>
<summary>完整 JEP 事件 JSON</summary>

\`\`\`json
${JSON.stringify(jepEvent, null, 2)}
\`\`\`
</details>`
        );
      }

      // 可选: 添加状态检查
      if (context.payload.pull_request) {
        await addStatusCheck(octokit, context, jepEvent);
      }
    }

    // 设置输出
    core.setOutput("jep_receipt_id", jepEvent.nonce);
    core.setOutput("jep_event_json", JSON.stringify(jepEvent));

    core.info(`✅ JEP 问责流程完成`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
