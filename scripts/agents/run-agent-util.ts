import fs from "fs/promises";
import path from "path";
import { query } from "@anthropic-ai/claude-agent-sdk";

type ParsedFrontmatter = Record<string, string>;

function parseFrontmatter(raw: string): { fm: ParsedFrontmatter; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { fm: {}, body: raw.trim() };
  const fm: ParsedFrontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { fm, body: raw.slice(match[0].length).trim() };
}

function parseList(value?: string): string[] | undefined {
  if (!value) return undefined;
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseArg(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

function argPrompt(): string {
  const explicit = parseArg("--prompt");
  if (explicit) return explicit;
  return process.argv.slice(2).filter((a) => !a.startsWith("--")).join(" ").trim();
}

export function getCommonArgs() {
  const prompt = argPrompt();
  const budgetRaw = parseArg("--budget");
  const budget = budgetRaw ? Number(budgetRaw) : undefined;
  return { prompt, budget };
}

export async function runAgentFile(opts: {
  agentFile: string;
  prompt: string;
  budget?: number;
}) {
  const raw = await fs.readFile(opts.agentFile, "utf8");
  const { fm, body } = parseFrontmatter(raw);
  const allowed = parseList(fm.tools);
  const disallowed = new Set(parseList(fm.disallowedTools) ?? []);
  const allowedTools = allowed ? allowed.filter((t) => !disallowed.has(t)) : undefined;
  const maxTurns = fm.maxTurns ? Number(fm.maxTurns) : undefined;

  const systemPrompt = {
    type: "preset" as const,
    preset: "claude_code",
    append: body,
  };

  const q = query({
    prompt: opts.prompt,
    options: {
      systemPrompt,
      settingSources: ["project"],
      permissionMode: "bypassPermissions",
      allowedTools,
      model: fm.model,
      maxTurns,
      maxBudgetUsd: opts.budget,
    },
  });

  for await (const msg of q) {
    if (msg.type === "assistant") {
      const blocks = msg.message.content.filter((b: any) => b.type === "text");
      for (const block of blocks) process.stdout.write(`${block.text}\n`);
    } else if (msg.type === "result") {
      process.stdout.write(
        `Result: ${msg.subtype} | cost: ${msg.total_cost_usd ?? "n/a"} | turns: ${msg.num_turns}\n`,
      );
    }
  }
}

export function agentPath(agentName: string): string {
  return path.resolve(process.cwd(), ".claude", "agents", `${agentName}.md`);
}
