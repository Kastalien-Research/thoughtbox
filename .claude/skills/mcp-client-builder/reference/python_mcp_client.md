# Python MCP Client Implementation Guide

> **Protocol Version**: 2025-11-25
> **SDK**: `mcp` (PyPI)

## Quick Start

```bash
pip install mcp
# or with uv
uv add mcp
```

```python
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    server_params = StdioServerParameters(
        command="python",
        args=["server.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # List and call tools
            tools = await session.list_tools()
            result = await session.call_tool("example_tool", {"param": "value"})

            print(result.content)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Transport Options

### 1. Stdio Transport (Local Servers)

Best for local development where server runs as subprocess.

```python
from mcp import StdioServerParameters
from mcp.client.stdio import stdio_client

server_params = StdioServerParameters(
    command="python",        # or "node", "npx", etc.
    args=["server.py"],
    env={"API_KEY": "..."}   # Optional environment variables
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()
        # ... use session
```

**Characteristics**:
- Server spawned as child process
- Communication via stdin/stdout
- Newline-delimited JSON-RPC messages
- Automatic process lifecycle management

### 2. Streamable HTTP Transport (Remote Servers)

For production remote servers with bidirectional communication.

```python
from mcp.client.streamablehttp import streamablehttp_client

async with streamablehttp_client("http://localhost:8000/mcp") as (read, write, _):
    async with ClientSession(read, write) as session:
        await session.initialize()

        tools = await session.list_tools()
        print(f"Available tools: {[t.name for t in tools.tools]}")
```

**Key Features**:
- Single MCP endpoint for POST and GET
- Session management via `Mcp-Session-Id` header
- Supports server-initiated requests via SSE

### 3. SSE Transport (Legacy/Deprecated)

For backwards compatibility with 2024-11-05 spec servers.

```python
from mcp.client.sse import sse_client

async with sse_client("http://legacy-server.example.com/sse") as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()
        # ...
```

---

## Client Session Setup

### Basic Session

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

server_params = StdioServerParameters(
    command="uv",
    args=["run", "server.py"],
    env={"API_KEY": "your-key-here"}
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()
        # Session ready for use
```

### With Sampling Callback

Enable server-initiated LLM sampling:

```python
from mcp import ClientSession
from mcp.types import CreateMessageResult, SamplingMessage

async def handle_sampling(
    context,
    messages: list[SamplingMessage],
    model_preferences=None,
    system_prompt=None,
    max_tokens=None
) -> CreateMessageResult:
    """Handle server requests for LLM completions."""

    # Call your LLM provider
    response = await your_llm.complete(
        messages=messages,
        system=system_prompt,
        max_tokens=max_tokens
    )

    return CreateMessageResult(
        role="assistant",
        content={"type": "text", "text": response.text},
        model=response.model,
        stopReason="endTurn"
    )

async with ClientSession(
    read,
    write,
    sampling_callback=handle_sampling
) as session:
    await session.initialize()
```

### With Elicitation Callback

Enable server-initiated user input requests:

```python
from mcp.types import ElicitRequestParams, ElicitResult

async def handle_elicitation(
    context,
    params: ElicitRequestParams
) -> ElicitResult:
    """Handle server requests for user input."""

    if params.mode == "form" or params.mode is None:
        # Display form to user
        print(f"Server asks: {params.message}")
        user_response = await prompt_user_form(params.requestedSchema)

        if user_response is None:
            return ElicitResult(action="cancel")

        return ElicitResult(
            action="accept",
            content=user_response
        )

    elif params.mode == "url":
        # URL mode for sensitive input
        print(f"Please visit: {params.url}")
        user_consent = await confirm_url_navigation(params.url, params.message)

        if not user_consent:
            return ElicitResult(action="decline")

        # Open URL in secure browser
        await open_secure_url(params.url)
        return ElicitResult(action="accept")

async with ClientSession(
    read,
    write,
    elicitation_callback=handle_elicitation
) as session:
    await session.initialize()
```

---

## Working with Server Features

### Tools

```python
from mcp import types

# List available tools
tools_response = await session.list_tools()
for tool in tools_response.tools:
    print(f"Tool: {tool.name}")
    print(f"  Description: {tool.description}")
    print(f"  Schema: {tool.inputSchema}")

# Call a tool
result = await session.call_tool("get_weather", {"city": "Tokyo"})

# Process result content
for content in result.content:
    if isinstance(content, types.TextContent):
        print(f"Text: {content.text}")
    elif isinstance(content, types.ImageContent):
        print(f"Image: {content.mimeType}, {len(content.data)} bytes")

# Access structured content (2025-11-25 spec)
if result.structuredContent:
    print(f"Structured: {result.structuredContent}")
```

### Resources

```python
from pydantic import AnyUrl

# List available resources
resources_response = await session.list_resources()
for resource in resources_response.resources:
    print(f"Resource: {resource.uri} ({resource.name})")

# Read a resource
content = await session.read_resource(AnyUrl("file:///path/to/resource"))

for item in content.contents:
    if isinstance(item, types.TextContent):
        print(f"Content: {item.text}")
    elif isinstance(item, types.BlobContent):
        print(f"Blob: {item.mimeType}, {len(item.blob)} bytes")

# Subscribe to changes (if server supports)
# Note: Requires notification handler setup
```

### Prompts

```python
# List available prompts
prompts_response = await session.list_prompts()
for prompt in prompts_response.prompts:
    print(f"Prompt: {prompt.name}")
    print(f"  Arguments: {prompt.arguments}")

# Get a prompt with arguments
prompt_result = await session.get_prompt(
    "code_review",
    arguments={"language": "python", "code": "def hello(): pass"}
)

# Use prompt messages
for message in prompt_result.messages:
    print(f"[{message.role}]: {message.content}")
```

---

## Client Capabilities Implementation

### Roots (Filesystem Boundaries)

```python
from mcp.types import Root

# Define roots that server can access
roots = [
    Root(uri="file:///home/user/project", name="My Project"),
    Root(uri="file:///home/user/data", name="Data Directory")
]

# Roots are declared during session initialization
# The SDK handles roots/list requests automatically when you provide roots
```

### Sampling Handler (Complete Example)

```python
import anthropic
from mcp.types import (
    CreateMessageResult,
    SamplingMessage,
    ModelPreferences,
    TextContent
)

async def sampling_handler(
    context,
    messages: list[SamplingMessage],
    model_preferences: ModelPreferences | None = None,
    system_prompt: str | None = None,
    max_tokens: int | None = None,
    tools: list | None = None,
    tool_choice: dict | None = None
) -> CreateMessageResult:
    """
    Handle server-initiated LLM sampling requests.

    The server can request completions through this callback,
    allowing agentic behaviors without the server needing API keys.
    """
    client = anthropic.Anthropic()

    # Convert MCP messages to Anthropic format
    anthropic_messages = []
    for msg in messages:
        content = msg.content
        if isinstance(content, TextContent):
            anthropic_messages.append({
                "role": msg.role,
                "content": content.text
            })

    # Select model based on preferences
    model = select_model(model_preferences)

    # Build request
    request_params = {
        "model": model,
        "messages": anthropic_messages,
        "max_tokens": max_tokens or 4096
    }

    if system_prompt:
        request_params["system"] = system_prompt

    if tools:
        request_params["tools"] = tools
        if tool_choice:
            request_params["tool_choice"] = tool_choice

    # Make API call
    response = client.messages.create(**request_params)

    # Map stop reason
    stop_reason_map = {
        "end_turn": "endTurn",
        "tool_use": "toolUse",
        "max_tokens": "maxTokens",
        "stop_sequence": "stopSequence"
    }

    # Return MCP-formatted result
    return CreateMessageResult(
        role="assistant",
        content=response.content[0],  # TextContent or ToolUseContent
        model=response.model,
        stopReason=stop_reason_map.get(response.stop_reason, "endTurn")
    )


def select_model(prefs: ModelPreferences | None) -> str:
    """Select model based on server preferences."""
    if prefs is None:
        return "claude-sonnet-4-20250514"

    # Check hints first
    for hint in prefs.hints or []:
        name = hint.name.lower()
        if "opus" in name:
            return "claude-opus-4-20250514"
        if "sonnet" in name:
            return "claude-sonnet-4-20250514"
        if "haiku" in name:
            return "claude-3-5-haiku-latest"

    # Fall back to priorities
    if (prefs.intelligencePriority or 0) > 0.8:
        return "claude-opus-4-20250514"
    if (prefs.speedPriority or 0) > 0.8:
        return "claude-3-5-haiku-latest"

    return "claude-sonnet-4-20250514"
```

---

## Error Handling

### MCP Error Codes

```python
from enum import IntEnum

class McpErrorCode(IntEnum):
    # Standard JSON-RPC
    PARSE_ERROR = -32700
    INVALID_REQUEST = -32600
    METHOD_NOT_FOUND = -32601
    INVALID_PARAMS = -32602
    INTERNAL_ERROR = -32603

    # MCP-specific
    URL_ELICITATION_REQUIRED = -32042
```

### Exception Handling

```python
from mcp.types import McpError

try:
    result = await session.call_tool("risky_tool", {})
except McpError as e:
    if e.code == McpErrorCode.METHOD_NOT_FOUND:
        print(f"Tool not found: {e.message}")
    elif e.code == McpErrorCode.INVALID_PARAMS:
        print(f"Invalid arguments: {e.data}")
    elif e.code == McpErrorCode.URL_ELICITATION_REQUIRED:
        # Handle URL elicitation requirement
        elicitations = e.data.get("elicitations", [])
        for elicit in elicitations:
            await handle_url_elicitation(elicit)
    else:
        print(f"MCP error {e.code}: {e.message}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

### Retry with Exponential Backoff

```python
import asyncio
from typing import TypeVar, Callable, Awaitable

T = TypeVar("T")

async def call_with_retry(
    fn: Callable[[], Awaitable[T]],
    max_retries: int = 3,
    base_delay: float = 1.0
) -> T:
    """Execute function with exponential backoff retry."""
    transient_codes = {
        McpErrorCode.INTERNAL_ERROR,
        -32001  # Timeout
    }

    for attempt in range(max_retries):
        try:
            return await fn()
        except McpError as e:
            if e.code in transient_codes and attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                await asyncio.sleep(delay)
                continue
            raise

    raise RuntimeError("Max retries exceeded")
```

---

## Multi-Server Host Pattern

```python
from dataclasses import dataclass
from typing import Any

@dataclass
class ServerConfig:
    id: str
    type: str  # "stdio" or "http"
    command: str | None = None
    args: list[str] | None = None
    url: str | None = None
    env: dict[str, str] | None = None


class MCPHost:
    """Host application managing multiple MCP server connections."""

    def __init__(self):
        self.sessions: dict[str, ClientSession] = {}
        self._contexts: dict[str, Any] = {}  # Store context managers

    async def connect_server(self, config: ServerConfig) -> None:
        """Connect to an MCP server."""
        if config.type == "stdio":
            params = StdioServerParameters(
                command=config.command,
                args=config.args or [],
                env=config.env
            )
            ctx = stdio_client(params)
        elif config.type == "http":
            ctx = streamablehttp_client(config.url)
        else:
            raise ValueError(f"Unknown transport: {config.type}")

        # Enter context and store
        read, write = await ctx.__aenter__()
        self._contexts[config.id] = ctx

        session = ClientSession(read, write)
        await session.__aenter__()
        await session.initialize()

        self.sessions[config.id] = session

    async def disconnect_server(self, server_id: str) -> None:
        """Disconnect from an MCP server."""
        if session := self.sessions.pop(server_id, None):
            await session.__aexit__(None, None, None)

        if ctx := self._contexts.pop(server_id, None):
            await ctx.__aexit__(None, None, None)

    async def get_all_tools(self) -> list[dict]:
        """Aggregate tools from all connected servers."""
        all_tools = []

        for server_id, session in self.sessions.items():
            response = await session.list_tools()
            for tool in response.tools:
                all_tools.append({
                    "server_id": server_id,
                    "name": f"{server_id}__{tool.name}",
                    "original_name": tool.name,
                    "description": tool.description,
                    "inputSchema": tool.inputSchema
                })

        return all_tools

    async def call_tool(
        self,
        namespaced_name: str,
        arguments: dict
    ) -> Any:
        """Route tool call to correct server."""
        server_id, tool_name = namespaced_name.split("__", 1)

        if server_id not in self.sessions:
            raise ValueError(f"Server not connected: {server_id}")

        session = self.sessions[server_id]
        return await session.call_tool(tool_name, arguments)

    async def close_all(self) -> None:
        """Disconnect all servers."""
        for server_id in list(self.sessions.keys()):
            await self.disconnect_server(server_id)
```

---

## Integration with LLM (Anthropic Example)

```python
import anthropic
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


class LLMIntegratedClient:
    """MCP client integrated with Anthropic Claude."""

    def __init__(self):
        self.anthropic = anthropic.Anthropic()
        self.session: ClientSession | None = None
        self.tools: list = []

    async def connect(self, server_params: StdioServerParameters):
        """Connect to MCP server."""
        self._transport_ctx = stdio_client(server_params)
        read, write = await self._transport_ctx.__aenter__()

        self._session_ctx = ClientSession(read, write)
        self.session = await self._session_ctx.__aenter__()
        await self.session.initialize()

        # Cache tools
        response = await self.session.list_tools()
        self.tools = response.tools

    async def close(self):
        """Clean up connections."""
        if self._session_ctx:
            await self._session_ctx.__aexit__(None, None, None)
        if self._transport_ctx:
            await self._transport_ctx.__aexit__(None, None, None)

    async def process_query(self, query: str) -> str:
        """Process user query with tool use loop."""
        messages = [{"role": "user", "content": query}]

        # Convert MCP tools to Anthropic format
        anthropic_tools = [
            {
                "name": tool.name,
                "description": tool.description,
                "input_schema": tool.inputSchema
            }
            for tool in self.tools
        ]

        # Initial LLM call
        response = self.anthropic.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=messages,
            tools=anthropic_tools
        )

        # Tool use loop
        while response.stop_reason == "tool_use":
            tool_use_blocks = [
                block for block in response.content
                if block.type == "tool_use"
            ]

            # Execute tool calls
            tool_results = []
            for tool_use in tool_use_blocks:
                result = await self.session.call_tool(
                    tool_use.name,
                    tool_use.input
                )

                # Extract text from result
                result_text = "\n".join(
                    c.text for c in result.content
                    if hasattr(c, "text")
                )

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": result_text
                })

            # Continue conversation
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

            response = self.anthropic.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                messages=messages,
                tools=anthropic_tools
            )

        # Extract final text
        for block in response.content:
            if hasattr(block, "text"):
                return block.text

        return ""


# Usage
async def main():
    client = LLMIntegratedClient()

    try:
        await client.connect(StdioServerParameters(
            command="python",
            args=["server.py"]
        ))

        response = await client.process_query("What's the weather in Tokyo?")
        print(response)

    finally:
        await client.close()
```

---

## Tasks (Experimental)

The Python SDK supports task-augmented tool calls for long-running operations:

```python
from mcp.types import CallToolResult

# Call tool as task (returns immediately with task ID)
result = await session.experimental.call_tool_as_task(
    "long_running_operation",
    {"param": "value"}
)
task_id = result.task.taskId
print(f"Task created: {task_id}")

# Poll for completion
async for status in session.experimental.poll_task(task_id):
    print(f"Status: {status.status}")

    if status.status == "input_required":
        # Handle elicitation request
        final = await session.experimental.get_task_result(
            task_id,
            CallToolResult
        )
        break

    if status.status == "completed":
        final = await session.experimental.get_task_result(
            task_id,
            CallToolResult
        )
        print(f"Result: {final.content}")
        break
```

---

## Testing

### With MCP Inspector

```bash
npx @modelcontextprotocol/inspector python server.py
# Access UI at http://localhost:5173
```

### Unit Testing Pattern

```python
import pytest
from unittest.mock import AsyncMock, MagicMock

@pytest.fixture
def mock_session():
    session = AsyncMock(spec=ClientSession)

    # Mock tool list
    session.list_tools.return_value = MagicMock(
        tools=[
            MagicMock(
                name="test_tool",
                description="A test tool",
                inputSchema={"type": "object"}
            )
        ]
    )

    # Mock tool call
    session.call_tool.return_value = MagicMock(
        content=[MagicMock(type="text", text="result")]
    )

    return session

@pytest.mark.asyncio
async def test_tool_call(mock_session):
    result = await mock_session.call_tool("test_tool", {"arg": "value"})
    assert result.content[0].text == "result"
```

---

## Project Setup

### pyproject.toml

```toml
[project]
name = "my-mcp-client"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "mcp>=1.0.0",
    "anthropic>=0.40.0",
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
]
```

### Environment Variables

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
```

```python
from dotenv import load_dotenv
load_dotenv()
```
