---
url: "https://platform.claude.com/docs/en/agent-sdk/overview.md"
title: undefined
---

````
# Agent SDK overview

Build production AI agents with Claude Code as a library

---

<Note>
The Claude Code SDK has been renamed to the Claude Agent SDK. If you're migrating from the old SDK, see the [Migration Guide](/docs/en/agent-sdk/migration-guide).
</Note>

Build AI agents that autonomously read files, run commands, search the web, edit code, and more. The Agent SDK gives you the same tools, agent loop, and context management that power Claude Code, programmable in Python and TypeScript.

<CodeGroup>
```python Python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="Find and fix the bug in auth.py",
        options=ClaudeAgentOptions(allowed_tools=["Read", "Edit", "Bash"])
    ):
        print(message)  # Claude reads the file, finds the bug, edits it

asyncio.run(main())
```

```typescript TypeScript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix the bug in auth.py",
  options: { allowedTools: ["Read", "Edit", "Bash"] }
})) {
  console.log(message);  // Claude reads the file, finds the bug, edits it
}
```
</CodeGroup>

The Agent SDK includes built-in tools for reading files, running commands, and editing code, so your agent can start working immediately without you implementing tool execution. Dive into the quickstart or explore real agents built with the SDK:

<CardGroup cols={2}>
  <Card title="Quickstart" icon="play" href="/docs/en/agent-sdk/quickstart">
    Build a bug-fixing agent in minutes
  </Card>
  <Card title="Example agents" icon="star" href="https://github.com/anthropics/claude-agent-sdk-demos">
    Email assistant, research agent, and more
  </Card>
</CardGroup>

## Capabilities

Everything that makes Claude Code powerful is available in the SDK:

<Tabs>
  <Tab title="Built-in tools">
    Your agent can read files, run commands, and search codebases out of the box. Key tools include:

    | Tool | What it does |
    |------|--------------|
    | **Read** | Read any file in the working directory |
    | **Write** | Create new files |
    | **Edit** | Make precise edits to existing files |
    | **Bash** | Run terminal commands, scripts, git operations |
    | **Glob** | Find files by pattern (`**/*.ts`, `src/**/*.py`) |
    | **Grep** | Search file contents with regex |
    | **WebSearch** | Search the web for current information |
    | **WebFetch** | Fetch and parse web page content |

    This example creates an agent that searches your codebase for TODO comments:

    <CodeGroup>
    ```python Python
    import asyncio
    from claude_agent_sdk import query, ClaudeAgentOptions

    async def main():
        async for message in query(
            prompt="Find all TODO comments and create a summary",
            options=ClaudeAgentOptions(allowed_tools=["Read", "Glob", "Grep"])
        ):
            print(message)

    asyncio.run(main())
    ```

    ```typescript TypeScript
    import { query } from "@anthropic-ai/claude-agent-sdk";

    for await (const message of query({
      prompt: "Find all TODO comments and create a summary",
      options: { allowedTools: ["Read", "Glob", "Grep"] }
    })) {
      console.log(message);
    }
    ```
    </CodeGroup>

    [View full tool reference →](https://docs.anthropic.com/en/docs/claude-code/cli-reference#tools-available-to-claude)
  </Tab>
  <Tab title="Hooks">
    Run custom code at key points in the agent lifecycle. Hooks can execute shell commands or custom scripts to validate, log, block, or transform agent behavior.

    **Available hooks:** `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, `SessionEnd`, `UserPromptSubmit`, and more.

    This example logs all file changes to an audit file:

    <CodeGroup>
    ```python Python
    import asyncio
    from claude_agent_sdk import query, ClaudeAgentOptions

    async def main():
        async for message in query(
            prompt="Suggest improvements to utils.py",
            options=ClaudeAgentOptions(
                permission_mode="acceptEdits",
                hooks={
                    "PostToolUse": [{\
                        "matcher": "Edit|Write",\
                        "hooks": [{"type": "command", "command": "echo \"$(date): file modified\" >> ./audit.log"}]\
                    }]
                }
            )
        ):
            print(message)

    asyncio.run(main())
    ```

    ```typescript TypeScript
    import { query } from "@anthropic-ai/claude-agent-sdk";

    for await (const message of query({
      prompt: "Suggest improvements to utils.py",
      options: {
        permissionMode: "acceptEdits",
        hooks: {
          PostToolUse: [{\
            matcher: "Edit|Write",\
            hooks: [{ type: "command", command: "echo \"$(date): file modified\" >> ./audit.log" }]\
          }]
        }
      }
    })) {
      console.log(message);
    }
    ```
    </CodeGroup>

    [Learn more about hooks →](https://docs.anthropic.com/en/docs/claude-code/hooks)
  </Tab>
  <Tab title="Subagents">
    Spawn specialized agents to handle focused subtasks. Your main agent delegates work, and subagents report back with results.

    Enable the `Task` tool to let Claude spawn subagents when it decides a task is complex enough to benefit from delegation. Claude automatically determines when to use subagents based on task complexity.

    <CodeGroup>
    ```python Python
    import asyncio
    from claude_agent_sdk import query, ClaudeAgentOptions

    async def main():
        async for message in query(
            prompt="Analyze this codebase for security vulnerabilities",
            options=ClaudeAgentOptions(allowed_tools=["Read", "Glob", "Grep", "Task"])
        ):
            print(message)

    asyncio.run(main())
    ```

    ```typescript TypeScript
    import { query } from "@anthropic-ai/claude-agent-sdk";

    for await (const message of query({
      prompt: "Analyze this codebase for security vulnerabilities",
      options: {
        allowedTools: ["Read", "Glob", "Grep", "Task"]
      }
    })) {
      console.log(message);
    }
    ```
    </CodeGroup>

    You can also define custom agent types with the `agents` option for more specialized delegation patterns.

    [Learn more about subagents →](/docs/en/agent-sdk/subagents)
  </Tab>
  <Tab title="MCP">
    Connect to external systems via the Model Context Protocol: databases, browsers, APIs, and [hundreds more](https://github.com/modelcontextprotocol/servers).

    This example connects the [Playwright MCP server](https://github.com/microsoft/playwright-mcp) to give your agent browser automation capabilities:

    <CodeGroup>
    ```python Python
    import asyncio
    from claude_agent_sdk import query, ClaudeAgentOptions

    async def main():
        async for message in query(
            prompt="Open example.com and describe what you see",
            options=ClaudeAgentOptions(
                mcp_servers={
                    "playwright": {"command": "npx", "args": ["@playwright/mcp@latest"]}
                }
            )
        ):
            print(message)

    asyncio.run(main())
    ```

    ```typescript TypeScript
    import { query } from "@anthropic-ai/claude-agent-sdk";

    for await (const message of query({
      prompt: "Open example.com and describe what you see",
      options: {
        mcpServers: {
          playwright: { command: "npx", args: ["@playwright/mcp@latest"] }
        }
      }
    })) {
      console.log(message);
    }
    ```
    </CodeGroup>

    [Learn more about MCP →](/docs/en/agent-sdk/mcp)
  </Tab>
  <Tab title="Permissions">
    Control exactly which tools your agent can use. Allow safe operations, block dangerous ones, or require approval for sensitive actions.

    This example creates a read-only agent that can analyze but not modify code:

    <CodeGroup>
    ```python Python
    import asyncio
    from claude_agent_sdk import query, ClaudeAgentOptions

    async def main():
        async for message in query(
            prompt="Review this code for best practices",
            options=ClaudeAgentOptions(
                allowed_tools=["Read", "Glob", "Grep"],
                permission_mode="bypassPermissions"
            )
        ):
            print(message)

    asyncio.run(main())
    ```

    ```typescript TypeScript
    import { query } from "@anthropic-ai/claude-agent-sdk";

    for await (const message of query({
      prompt: "Review this code for best practices",
      options: {
        allowedTools: ["Read", "Glob", "Grep"],
        permissionMode: "bypassPermissions"
      }
    })) {
      console.log(message);
    }
    ```
    </CodeGroup>

    [Learn more about permissions →](/docs/en/agent-sdk/permissions)
  </Tab>
  <Tab title="Sessions">
    Maintain context across multiple exchanges. Claude remembers files read, analysis done, and conversation history. Resume sessions later, or fork them to explore different approaches.

    This example captures the session ID from the first query, then resumes to continue with full context:

    <CodeGroup>
    ```python Python
    import asyncio
    from claude_agent_sdk import query, ClaudeAgentOptions

    async def main():
        session_id = None

        # First query: capture the session ID
        async for message in query(
            prompt="Read the authentication module",
            options=ClaudeAgentOptions(allowed_tools=["Read", "Glob"])
        ):
            if hasattr(message, 'subtype') and message.subtype == 'init':
                session_id = message.data.get('session_id')

        # Resume with full context from the first query
        async for message in query(
            prompt="Now find all places that call it",  # "it" = auth module
            options=ClaudeAgentOptions(resume=session_id)
        ):
            pass

    asyncio.run(main())
    ```

    ```typescript TypeScript
    import { query } from "@anthropic-ai/claude-agent-sdk";

    let sessionId: string | undefined;

    // First query: capture the session ID
    for await (const message of query({
      prompt: "Read the authentication module",
      options: { allowedTools: ["Read", "Glob"] }
    })) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
    }

    // Resume with full context from the first query
    for await (const message of query({
      prompt: "Now find all places that call it",  // "it" = auth module
      options: { resume: sessionId }
    })) {
      // Process messages...
    }
    ```
    </CodeGroup>

    [Learn more about sessions →](/docs/en/agent-sdk/sessions)
  </Tab>
</Tabs>

### Claude Code features

The SDK also supports Claude Code's filesystem-based configuration. To use these features, set `setting_sources=["project"]` (Python) or `settingSources: ['project']` (TypeScript)  in your options.

| Feature | Description | Location |
|---------|-------------|----------|
| [Skills](/docs/en/agent-sdk/skills) | Specialized capabilities defined in Markdown | `.claude/skills/SKILL.md` |
| [Slash commands](/docs/en/agent-sdk/slash-commands) | Custom commands for common tasks | `.claude/commands/*.md` |
| [Memory](/docs/en/agent-sdk/modifying-system-prompts) | Project context and instructions | `CLAUDE.md` or `.claude/CLAUDE.md` |
| [Plugins](/docs/en/agent-sdk/plugins) | Extend with custom commands, agents, and MCP servers | Programmatic via `plugins` option |

## Get started

<Steps>
  <Step title="Install Claude Code">
    The SDK uses Claude Code as its runtime:

    <Tabs>
      <Tab title="macOS/Linux/WSL">
        ```bash
        curl -fsSL https://claude.ai/install.sh | bash
        ```
      </Tab>
      <Tab title="Homebrew">
        ```bash
        brew install --cask claude-code
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @anthropic-ai/claude-code
        ```
      </Tab>
    </Tabs>

    See [Claude Code setup](https://docs.anthropic.com/en/docs/claude-code/setup) for Windows and other options.
  </Step>
  <Step title="Install the SDK">
    <Tabs>
      <Tab title="TypeScript">
        ```bash
        npm install @anthropic-ai/claude-agent-sdk
        ```
      </Tab>
      <Tab title="Python">
        ```bash
        pip install claude-agent-sdk
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Set your API key">
    ```bash
    export ANTHROPIC_API_KEY=your-api-key
    ```
    Get your key from the [Console](https://console.anthropic.com/).
  </Step>
  <Step title="Run your first agent">
    This example creates an agent that lists files in your current directory using built-in tools.

    <CodeGroup>
    ```python Python
    import asyncio
    from claude_agent_sdk import query, ClaudeAgentOptions

    async def main():
        async for message in query(
            prompt="What files are in this directory?",
            options=ClaudeAgentOptions(allowed_tools=["Bash", "Glob"])
        ):
            print(message)

    asyncio.run(main())
    ```

    ```typescript TypeScript
    import { query } from "@anthropic-ai/claude-agent-sdk";

    for await (const message of query({
      prompt: "What files are in this directory?",
      options: { allowedTools: ["Bash", "Glob"] },
    })) {
      console.log(message);
    }
    ```
    </CodeGroup>
  </Step>
</Steps>

**Ready to build?** Follow the [Quickstart](/docs/en/agent-sdk/quickstart) to create an agent that finds and fixes bugs in minutes.

## Compare the Agent SDK to other Claude tools

The Claude platform offers multiple ways to build with Claude. Here's how the Agent SDK fits in:

<Tabs>
  <Tab title="Agent SDK vs Client SDK">
    The [Anthropic Client SDK](/docs/en/api/client-sdks) gives you direct API access: you send prompts and implement tool execution yourself. The **Agent SDK** gives you Claude with built-in tool execution.

    With the Client SDK, you implement a tool loop. With the Agent SDK, Claude handles it:

    <CodeGroup>
    ```python Python
    # Client SDK: You implement the tool loop
    response = client.messages.create(...)
    while response.stop_reason == "tool_use":
        result = your_tool_executor(response.tool_use)
        response = client.messages.create(tool_result=result, ...)

    # Agent SDK: Claude handles tools autonomously
    async for message in query(prompt="Fix the bug in auth.py"):
        print(message)
    ```

    ```typescript TypeScript
    // Client SDK: You implement the tool loop
    let response = await client.messages.create({...});
    while (response.stop_reason === "tool_use") {
      const result = yourToolExecutor(response.tool_use);
      response = await client.messages.create({ tool_result: result, ... });
    }

    // Agent SDK: Claude handles tools autonomously
    for await (const message of query({ prompt: "Fix the bug in auth.py" })) {
      console.log(message);
    }
    ```
    </CodeGroup>
  </Tab>
  <Tab title="Agent SDK vs Claude Code CLI">
    Same capabilities, different interface:

    | Use case | Best choice |
    |----------|-------------|
    | Interactive development | CLI |
    | CI/CD pipelines | SDK |
    | Custom applications | SDK |
    | One-off tasks | CLI |
    | Production automation | SDK |

    Many teams use both: CLI for daily development, SDK for production. Workflows translate directly between them.
  </Tab>
</Tabs>

## Changelog

View the full changelog for SDK updates, bug fixes, and new features:

- **TypeScript SDK**: [View CHANGELOG.md](https://github.com/anthropics/claude-agent-sdk-typescript/blob/main/CHANGELOG.md)
- **Python SDK**: [View CHANGELOG.md](https://github.com/anthropics/claude-agent-sdk-python/blob/main/CHANGELOG.md)

## Reporting bugs

If you encounter bugs or issues with the Agent SDK:

- **TypeScript SDK**: [Report issues on GitHub](https://github.com/anthropics/claude-agent-sdk-typescript/issues)
- **Python SDK**: [Report issues on GitHub](https://github.com/anthropics/claude-agent-sdk-python/issues)

## Branding guidelines

For partners integrating the Claude Agent SDK, use of Claude branding is optional. When referencing Claude in your product:

**Allowed:**
- "Claude Agent" (preferred for dropdown menus)
- "Claude" (when within a menu already labeled "Agents")
- "{YourAgentName} Powered by Claude" (if you have an existing agent name)

**Not permitted:**
- "Claude Code" or "Claude Code Agent"
- Claude Code-branded ASCII art or visual elements that mimic Claude Code

Your product should maintain its own branding and not appear to be Claude Code or any Anthropic product. For questions about branding compliance, contact our [sales team](https://www.anthropic.com/contact-sales).

## License and terms

Use of the Claude Agent SDK is governed by [Anthropic's Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms), including when you use it to power products and services that you make available to your own customers and end users, except to the extent a specific component or dependency is covered by a different license as indicated in that component's LICENSE file.

## Next steps

<CardGroup cols={2}>
  <Card title="Quickstart" icon="play" href="/docs/en/agent-sdk/quickstart">
    Build an agent that finds and fixes bugs in minutes
  </Card>
  <Card title="Example agents" icon="star" href="https://github.com/anthropics/claude-agent-sdk-demos">
    Email assistant, research agent, and more
  </Card>
  <Card title="TypeScript SDK" icon="code" href="/docs/en/agent-sdk/typescript">
    Full TypeScript API reference and examples
  </Card>
  <Card title="Python SDK" icon="code" href="/docs/en/agent-sdk/python">
    Full Python API reference and examples
  </Card>
</CardGroup>
````