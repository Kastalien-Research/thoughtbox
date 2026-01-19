---
url: "https://platform.claude.com/docs/en/api/python/beta/messages"
title: "Messages - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Fpython%2Fbeta%2Fmessages)

Search...

⌘K

Using the API

[Features overview](https://platform.claude.com/docs/en/api/overview) [Client SDKs](https://platform.claude.com/docs/en/api/client-sdks) [Beta headers](https://platform.claude.com/docs/en/api/beta-headers) [Errors](https://platform.claude.com/docs/en/api/errors)

[Messages](https://platform.claude.com/docs/en/api/messages)

[Create a Message](https://platform.claude.com/docs/en/api/messages/create) [Count tokens in a Message](https://platform.claude.com/docs/en/api/messages/count_tokens)

Batches

[Models](https://platform.claude.com/docs/en/api/models)

[List Models](https://platform.claude.com/docs/en/api/models/list) [Get a Model](https://platform.claude.com/docs/en/api/models/retrieve)

[Beta](https://platform.claude.com/docs/en/api/beta)

Models

Messages

[Create a Message](https://platform.claude.com/docs/en/api/beta/messages/create) [Count tokens in a Message](https://platform.claude.com/docs/en/api/beta/messages/count_tokens)

Batches

Files

Skills

[Admin](https://platform.claude.com/docs/en/api/admin)

Organizations

Invites

Users

Workspaces

API Keys

Usage Report

Cost Report

[Completions](https://platform.claude.com/docs/en/api/completions)

[Create a Text Completion](https://platform.claude.com/docs/en/api/completions/create)

Support & configuration

[Rate limits](https://platform.claude.com/docs/en/api/rate-limits) [Service tiers](https://platform.claude.com/docs/en/api/service-tiers) [Versions](https://platform.claude.com/docs/en/api/versioning) [IP addresses](https://platform.claude.com/docs/en/api/ip-addresses) [Supported regions](https://platform.claude.com/docs/en/api/supported-regions) [OpenAI SDK compatibility](https://platform.claude.com/docs/en/api/openai-sdk)

[Console](https://platform.claude.com/)

[Log in](https://platform.claude.com/login)

Beta

Messages

Copy page

Python

# Messages

##### [Create a Message](https://platform.claude.com/docs/en/api/beta/messages/create)

beta.messages.create(MessageCreateParams\*\*kwargs) -\> [BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message)

post/v1/messages

##### [Count tokens in a Message](https://platform.claude.com/docs/en/api/beta/messages/count_tokens)

beta.messages.count\_tokens(MessageCountTokensParams\*\*kwargs) -\> [BetaMessageTokensCount](https://platform.claude.com/docs/en/api/beta#beta_message_tokens_count)

post/v1/messages/count\_tokens

##### ModelsExpand Collapse

class BetaAllThinkingTurns: …

type: Literal\["all"\]

Accepts one of the following:

"all"

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaBashCodeExecutionOutputBlock: …

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

class BetaBashCodeExecutionOutputBlockParam: …

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

class BetaBashCodeExecutionResultBlock: …

content: List\[[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

class BetaBashCodeExecutionResultBlockParam: …

content: List\[[BetaBashCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block_param)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

class BetaBashCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaBashCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaBashCodeExecutionResultBlock: …

content: List\[[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: str

type: Literal\["bash\_code\_execution\_tool\_result"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

class BetaBashCodeExecutionToolResultBlockParam: …

content: Content

Accepts one of the following:

class BetaBashCodeExecutionToolResultErrorParam: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaBashCodeExecutionResultBlockParam: …

content: List\[[BetaBashCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block_param)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: str

type: Literal\["bash\_code\_execution\_tool\_result"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaBashCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaBashCodeExecutionToolResultErrorParam: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaCacheControlEphemeral: …

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaCacheCreation: …

ephemeral\_1h\_input\_tokens: int

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: int

The number of input tokens used to create the 5 minute cache entry.

minimum0

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationConfig: …

enabled: bool

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationsConfigParam: …

enabled: Optional\[bool\]

class BetaCitationsDelta: …

citation: Citation

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

type: Literal\["citations\_delta"\]

Accepts one of the following:

"citations\_delta"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaClearThinking20251015Edit: …

type: Literal\["clear\_thinking\_20251015"\]

Accepts one of the following:

"clear\_thinking\_20251015"

keep: Optional\[Keep\]

Number of most recent assistant turns to keep thinking blocks for. Older turns will have their thinking blocks removed.

Accepts one of the following:

class BetaThinkingTurns: …

type: Literal\["thinking\_turns"\]

Accepts one of the following:

"thinking\_turns"

value: int

class BetaAllThinkingTurns: …

type: Literal\["all"\]

Accepts one of the following:

"all"

KeepUnionMember2 = Literal\["all"\]

Accepts one of the following:

"all"

class BetaClearThinking20251015EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: int

Number of thinking turns that were cleared.

minimum0

type: Literal\["clear\_thinking\_20251015"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

class BetaClearToolUses20250919Edit: …

type: Literal\["clear\_tool\_uses\_20250919"\]

Accepts one of the following:

"clear\_tool\_uses\_20250919"

clear\_at\_least: Optional\[BetaInputTokensClearAtLeast\]

Minimum number of tokens that must be cleared when triggered. Context will only be modified if at least this many tokens can be removed.

type: Literal\["input\_tokens"\]

Accepts one of the following:

"input\_tokens"

value: int

clear\_tool\_inputs: Optional\[Union\[bool, List\[str\], null\]\]

Whether to clear all tool inputs (bool) or specific tool inputs to clear (list)

Accepts one of the following:

ClearToolInputsUnionMember0 = bool

ClearToolInputsUnionMember1 = List\[str\]

exclude\_tools: Optional\[List\[str\]\]

Tool names whose uses are preserved from clearing

keep: Optional\[BetaToolUsesKeep\]

Number of tool uses to retain in the conversation

type: Literal\["tool\_uses"\]

Accepts one of the following:

"tool\_uses"

value: int

trigger: Optional\[Trigger\]

Condition that triggers the context management strategy

Accepts one of the following:

class BetaInputTokensTrigger: …

type: Literal\["input\_tokens"\]

Accepts one of the following:

"input\_tokens"

value: int

class BetaToolUsesTrigger: …

type: Literal\["tool\_uses"\]

Accepts one of the following:

"tool\_uses"

value: int

class BetaClearToolUses20250919EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: int

Number of tool uses that were cleared.

minimum0

type: Literal\["clear\_tool\_uses\_20250919"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

class BetaCodeExecutionOutputBlock: …

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

class BetaCodeExecutionOutputBlockParam: …

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

class BetaCodeExecutionResultBlock: …

content: List\[[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

class BetaCodeExecutionResultBlockParam: …

content: List\[[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

class BetaCodeExecutionTool20250522: …

name: Literal\["code\_execution"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"code\_execution"

type: Literal\["code\_execution\_20250522"\]

Accepts one of the following:

"code\_execution\_20250522"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict: Optional\[bool\]

class BetaCodeExecutionTool20250825: …

name: Literal\["code\_execution"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"code\_execution"

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict: Optional\[bool\]

class BetaCodeExecutionToolResultBlock: …

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

class BetaCodeExecutionToolResultError: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlock: …

content: List\[[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: str

type: Literal\["code\_execution\_tool\_result"\]

Accepts one of the following:

"code\_execution\_tool\_result"

BetaCodeExecutionToolResultBlockContent = [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

class BetaCodeExecutionToolResultError: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlock: …

content: List\[[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

class BetaCodeExecutionToolResultBlockParam: …

content: [BetaCodeExecutionToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_param_content)

Accepts one of the following:

class BetaCodeExecutionToolResultErrorParam: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlockParam: …

content: List\[[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: str

type: Literal\["code\_execution\_tool\_result"\]

Accepts one of the following:

"code\_execution\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaCodeExecutionToolResultBlockParamContent = [BetaCodeExecutionToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_param_content)

Accepts one of the following:

class BetaCodeExecutionToolResultErrorParam: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlockParam: …

content: List\[[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

class BetaCodeExecutionToolResultError: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionToolResultErrorCode = Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

class BetaCodeExecutionToolResultErrorParam: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaContainer: …

Information about the container used in the request (for the code execution tool)

id: str

Identifier for the container used in this request

expires\_at: datetime

The time at which the container will expire.

formatdate-time

skills: Optional\[List\[[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)\]\]

Skills loaded in the container

skill\_id: str

Skill ID

maxLength64

minLength1

type: Literal\["anthropic", "custom"\]

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: str

Skill version or 'latest' for most recent version

maxLength64

minLength1

class BetaContainerParams: …

Container parameters with skills to be loaded.

id: Optional\[str\]

Container id

skills: Optional\[List\[[BetaSkillParams](https://platform.claude.com/docs/en/api/beta#beta_skill_params)\]\]

List of skills to load in the container

skill\_id: str

Skill ID

maxLength64

minLength1

type: Literal\["anthropic", "custom"\]

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: Optional\[str\]

Skill version or 'latest' for most recent version

maxLength64

minLength1

class BetaContainerUploadBlock: …

Response model for a file uploaded to the container.

file\_id: str

type: Literal\["container\_upload"\]

Accepts one of the following:

"container\_upload"

class BetaContainerUploadBlockParam: …

A content block that represents a file to be uploaded to the container
Files uploaded via this block will be available in the container's input directory.

file\_id: str

type: Literal\["container\_upload"\]

Accepts one of the following:

"container\_upload"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaContentBlock = [BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)

Response model for a file uploaded to the container.

Accepts one of the following:

class BetaTextBlock: …

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaThinkingBlock: …

signature: str

thinking: str

type: Literal\["thinking"\]

Accepts one of the following:

"thinking"

class BetaRedactedThinkingBlock: …

data: str

type: Literal\["redacted\_thinking"\]

Accepts one of the following:

"redacted\_thinking"

class BetaToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

type: Literal\["tool\_use"\]

Accepts one of the following:

"tool\_use"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaServerToolUseBlock: …

id: str

caller: Caller

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

input: Dict\[str, object\]

name: Literal\["web\_search", "web\_fetch", "code\_execution", 4 more\]

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: Literal\["server\_tool\_use"\]

Accepts one of the following:

"server\_tool\_use"

class BetaWebSearchToolResultBlock: …

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

class BetaWebSearchToolResultError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = List\[[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)\]

encrypted\_content: str

page\_age: Optional\[str\]

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

tool\_use\_id: str

type: Literal\["web\_search\_tool\_result"\]

Accepts one of the following:

"web\_search\_tool\_result"

class BetaWebFetchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaWebFetchToolResultErrorBlock: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

class BetaWebFetchBlock: …

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)

citations: Optional\[BetaCitationConfig\]

Citation configuration for the document

enabled: bool

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

title: Optional\[str\]

The title of the document

type: Literal\["document"\]

Accepts one of the following:

"document"

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

tool\_use\_id: str

type: Literal\["web\_fetch\_tool\_result"\]

Accepts one of the following:

"web\_fetch\_tool\_result"

class BetaCodeExecutionToolResultBlock: …

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

class BetaCodeExecutionToolResultError: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlock: …

content: List\[[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: str

type: Literal\["code\_execution\_tool\_result"\]

Accepts one of the following:

"code\_execution\_tool\_result"

class BetaBashCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaBashCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaBashCodeExecutionResultBlock: …

content: List\[[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: str

type: Literal\["bash\_code\_execution\_tool\_result"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

class BetaTextEditorCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaTextEditorCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: Optional\[str\]

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

class BetaTextEditorCodeExecutionViewResultBlock: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

class BetaTextEditorCodeExecutionCreateResultBlock: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlock: …

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: str

type: Literal\["text\_editor\_code\_execution\_tool\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

class BetaToolSearchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaToolSearchToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: Optional\[str\]

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolSearchResultBlock: …

tool\_references: List\[[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: str

type: Literal\["tool\_search\_tool\_result"\]

Accepts one of the following:

"tool\_search\_tool\_result"

class BetaMCPToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

The name of the MCP tool

server\_name: str

The name of the MCP server

type: Literal\["mcp\_tool\_use"\]

Accepts one of the following:

"mcp\_tool\_use"

class BetaMCPToolResultBlock: …

content: Union\[str, List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaMCPToolResultBlockContent = List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

is\_error: bool

tool\_use\_id: str

type: Literal\["mcp\_tool\_result"\]

Accepts one of the following:

"mcp\_tool\_result"

class BetaContainerUploadBlock: …

Response model for a file uploaded to the container.

file\_id: str

type: Literal\["container\_upload"\]

Accepts one of the following:

"container\_upload"

BetaContentBlockParam = [BetaContentBlockParam](https://platform.claude.com/docs/en/api/beta#beta_content_block_param)

Regular text content.

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaRequestDocumentBlock: …

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaContentBlockSource: …

content: Union\[str, List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaContentBlockSourceContent = List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["content"\]

Accepts one of the following:

"content"

class BetaURLPDFSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileDocumentSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["document"\]

Accepts one of the following:

"document"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

context: Optional\[str\]

title: Optional\[str\]

class BetaSearchResultBlockParam: …

content: List\[[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)\]

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

source: str

title: str

type: Literal\["search\_result"\]

Accepts one of the following:

"search\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

class BetaThinkingBlockParam: …

signature: str

thinking: str

type: Literal\["thinking"\]

Accepts one of the following:

"thinking"

class BetaRedactedThinkingBlockParam: …

data: str

type: Literal\["redacted\_thinking"\]

Accepts one of the following:

"redacted\_thinking"

class BetaToolUseBlockParam: …

id: str

input: Dict\[str, object\]

name: str

type: Literal\["tool\_use"\]

Accepts one of the following:

"tool\_use"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaToolResultBlockParam: …

tool\_use\_id: str

type: Literal\["tool\_result"\]

Accepts one of the following:

"tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

content: Optional\[Union\[str, List\[Content\], null\]\]

Accepts one of the following:

ContentUnionMember0 = str

Content = List\[Content\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaSearchResultBlockParam: …

content: List\[[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)\]

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

source: str

title: str

type: Literal\["search\_result"\]

Accepts one of the following:

"search\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

class BetaRequestDocumentBlock: …

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaContentBlockSource: …

content: Union\[str, List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaContentBlockSourceContent = List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["content"\]

Accepts one of the following:

"content"

class BetaURLPDFSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileDocumentSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["document"\]

Accepts one of the following:

"document"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

context: Optional\[str\]

title: Optional\[str\]

class BetaToolReferenceBlockParam: …

Tool reference block that can be included in tool\_result content.

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

is\_error: Optional\[bool\]

class BetaServerToolUseBlockParam: …

id: str

input: Dict\[str, object\]

name: Literal\["web\_search", "web\_fetch", "code\_execution", 4 more\]

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: Literal\["server\_tool\_use"\]

Accepts one of the following:

"server\_tool\_use"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaWebSearchToolResultBlockParam: …

content: [BetaWebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_param_content)

Accepts one of the following:

ResultBlock = List\[[BetaWebSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block_param)\]

encrypted\_content: str

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

page\_age: Optional\[str\]

class BetaWebSearchToolRequestError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

tool\_use\_id: str

type: Literal\["web\_search\_tool\_result"\]

Accepts one of the following:

"web\_search\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaWebFetchToolResultBlockParam: …

content: Content

Accepts one of the following:

class BetaWebFetchToolResultErrorBlockParam: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

class BetaWebFetchBlockParam: …

content: [BetaRequestDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_request_document_block)

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaContentBlockSource: …

content: Union\[str, List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaContentBlockSourceContent = List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["content"\]

Accepts one of the following:

"content"

class BetaURLPDFSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileDocumentSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["document"\]

Accepts one of the following:

"document"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

context: Optional\[str\]

title: Optional\[str\]

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

tool\_use\_id: str

type: Literal\["web\_fetch\_tool\_result"\]

Accepts one of the following:

"web\_fetch\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaCodeExecutionToolResultBlockParam: …

content: [BetaCodeExecutionToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_param_content)

Accepts one of the following:

class BetaCodeExecutionToolResultErrorParam: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlockParam: …

content: List\[[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: str

type: Literal\["code\_execution\_tool\_result"\]

Accepts one of the following:

"code\_execution\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaBashCodeExecutionToolResultBlockParam: …

content: Content

Accepts one of the following:

class BetaBashCodeExecutionToolResultErrorParam: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaBashCodeExecutionResultBlockParam: …

content: List\[[BetaBashCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block_param)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: str

type: Literal\["bash\_code\_execution\_tool\_result"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaTextEditorCodeExecutionToolResultBlockParam: …

content: Content

Accepts one of the following:

class BetaTextEditorCodeExecutionToolResultErrorParam: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

error\_message: Optional\[str\]

class BetaTextEditorCodeExecutionViewResultBlockParam: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

class BetaTextEditorCodeExecutionCreateResultBlockParam: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlockParam: …

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

tool\_use\_id: str

type: Literal\["text\_editor\_code\_execution\_tool\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaToolSearchToolResultBlockParam: …

content: Content

Accepts one of the following:

class BetaToolSearchToolResultErrorParam: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolSearchResultBlockParam: …

tool\_references: List\[[BetaToolReferenceBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block_param)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: str

type: Literal\["tool\_search\_tool\_result"\]

Accepts one of the following:

"tool\_search\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaMCPToolUseBlockParam: …

id: str

input: Dict\[str, object\]

name: str

server\_name: str

The name of the MCP server

type: Literal\["mcp\_tool\_use"\]

Accepts one of the following:

"mcp\_tool\_use"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaRequestMCPToolResultBlockParam: …

tool\_use\_id: str

type: Literal\["mcp\_tool\_result"\]

Accepts one of the following:

"mcp\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

content: Optional\[Union\[str, List\[[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)\], null\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaMCPToolResultBlockParamContent = List\[[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)\]

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

is\_error: Optional\[bool\]

class BetaContainerUploadBlockParam: …

A content block that represents a file to be uploaded to the container
Files uploaded via this block will be available in the container's input directory.

file\_id: str

type: Literal\["container\_upload"\]

Accepts one of the following:

"container\_upload"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaContentBlockSource: …

content: Union\[str, List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaContentBlockSourceContent = List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["content"\]

Accepts one of the following:

"content"

BetaContentBlockSourceContent = [BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaContextManagementConfig: …

edits: Optional\[List\[Edit\]\]

List of context management edits to apply

Accepts one of the following:

class BetaClearToolUses20250919Edit: …

type: Literal\["clear\_tool\_uses\_20250919"\]

Accepts one of the following:

"clear\_tool\_uses\_20250919"

clear\_at\_least: Optional\[BetaInputTokensClearAtLeast\]

Minimum number of tokens that must be cleared when triggered. Context will only be modified if at least this many tokens can be removed.

type: Literal\["input\_tokens"\]

Accepts one of the following:

"input\_tokens"

value: int

clear\_tool\_inputs: Optional\[Union\[bool, List\[str\], null\]\]

Whether to clear all tool inputs (bool) or specific tool inputs to clear (list)

Accepts one of the following:

ClearToolInputsUnionMember0 = bool

ClearToolInputsUnionMember1 = List\[str\]

exclude\_tools: Optional\[List\[str\]\]

Tool names whose uses are preserved from clearing

keep: Optional\[BetaToolUsesKeep\]

Number of tool uses to retain in the conversation

type: Literal\["tool\_uses"\]

Accepts one of the following:

"tool\_uses"

value: int

trigger: Optional\[Trigger\]

Condition that triggers the context management strategy

Accepts one of the following:

class BetaInputTokensTrigger: …

type: Literal\["input\_tokens"\]

Accepts one of the following:

"input\_tokens"

value: int

class BetaToolUsesTrigger: …

type: Literal\["tool\_uses"\]

Accepts one of the following:

"tool\_uses"

value: int

class BetaClearThinking20251015Edit: …

type: Literal\["clear\_thinking\_20251015"\]

Accepts one of the following:

"clear\_thinking\_20251015"

keep: Optional\[Keep\]

Number of most recent assistant turns to keep thinking blocks for. Older turns will have their thinking blocks removed.

Accepts one of the following:

class BetaThinkingTurns: …

type: Literal\["thinking\_turns"\]

Accepts one of the following:

"thinking\_turns"

value: int

class BetaAllThinkingTurns: …

type: Literal\["all"\]

Accepts one of the following:

"all"

KeepUnionMember2 = Literal\["all"\]

Accepts one of the following:

"all"

class BetaContextManagementResponse: …

applied\_edits: List\[AppliedEdit\]

List of context management edits that were applied.

Accepts one of the following:

class BetaClearToolUses20250919EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: int

Number of tool uses that were cleared.

minimum0

type: Literal\["clear\_tool\_uses\_20250919"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

class BetaClearThinking20251015EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: int

Number of thinking turns that were cleared.

minimum0

type: Literal\["clear\_thinking\_20251015"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

class BetaCountTokensContextManagementResponse: …

original\_input\_tokens: int

The original token count before context management was applied

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaDocumentBlock: …

citations: Optional\[BetaCitationConfig\]

Citation configuration for the document

enabled: bool

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

title: Optional\[str\]

The title of the document

type: Literal\["document"\]

Accepts one of the following:

"document"

class BetaFileDocumentSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaInputJSONDelta: …

partial\_json: str

type: Literal\["input\_json\_delta"\]

Accepts one of the following:

"input\_json\_delta"

class BetaInputTokensClearAtLeast: …

type: Literal\["input\_tokens"\]

Accepts one of the following:

"input\_tokens"

value: int

class BetaInputTokensTrigger: …

type: Literal\["input\_tokens"\]

Accepts one of the following:

"input\_tokens"

value: int

class BetaJSONOutputFormat: …

schema: Dict\[str, object\]

The JSON schema of the format

type: Literal\["json\_schema"\]

Accepts one of the following:

"json\_schema"

class BetaMCPToolConfig: …

Configuration for a specific tool in an MCP toolset.

defer\_loading: Optional\[bool\]

enabled: Optional\[bool\]

class BetaMCPToolDefaultConfig: …

Default configuration for tools in an MCP toolset.

defer\_loading: Optional\[bool\]

enabled: Optional\[bool\]

class BetaMCPToolResultBlock: …

content: Union\[str, List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaMCPToolResultBlockContent = List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

is\_error: bool

tool\_use\_id: str

type: Literal\["mcp\_tool\_result"\]

Accepts one of the following:

"mcp\_tool\_result"

class BetaMCPToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

The name of the MCP tool

server\_name: str

The name of the MCP server

type: Literal\["mcp\_tool\_use"\]

Accepts one of the following:

"mcp\_tool\_use"

class BetaMCPToolUseBlockParam: …

id: str

input: Dict\[str, object\]

name: str

server\_name: str

The name of the MCP server

type: Literal\["mcp\_tool\_use"\]

Accepts one of the following:

"mcp\_tool\_use"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaMCPToolset: …

Configuration for a group of tools from an MCP server.

Allows configuring enabled status and defer\_loading for all tools
from an MCP server, with optional per-tool overrides.

mcp\_server\_name: str

Name of the MCP server to configure tools for

maxLength255

minLength1

type: Literal\["mcp\_toolset"\]

Accepts one of the following:

"mcp\_toolset"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

configs: Optional\[Dict\[str, [BetaMCPToolConfig](https://platform.claude.com/docs/en/api/beta#beta_mcp_tool_config)\]\]

Configuration overrides for specific tools, keyed by tool name

defer\_loading: Optional\[bool\]

enabled: Optional\[bool\]

default\_config: Optional\[BetaMCPToolDefaultConfig\]

Default configuration applied to all tools from this server

defer\_loading: Optional\[bool\]

enabled: Optional\[bool\]

class BetaMemoryTool20250818: …

name: Literal\["memory"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"memory"

type: Literal\["memory\_20250818"\]

Accepts one of the following:

"memory\_20250818"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

BetaMemoryTool20250818Command = [BetaMemoryTool20250818Command](https://platform.claude.com/docs/en/api/beta#beta_memory_tool_20250818_command)

Accepts one of the following:

class BetaMemoryTool20250818ViewCommand: …

command: Literal\["view"\]

Command type identifier

Accepts one of the following:

"view"

path: str

Path to directory or file to view

view\_range: Optional\[List\[int\]\]

Optional line range for viewing specific lines

class BetaMemoryTool20250818CreateCommand: …

command: Literal\["create"\]

Command type identifier

Accepts one of the following:

"create"

file\_text: str

Content to write to the file

path: str

Path where the file should be created

class BetaMemoryTool20250818StrReplaceCommand: …

command: Literal\["str\_replace"\]

Command type identifier

Accepts one of the following:

"str\_replace"

new\_str: str

Text to replace with

old\_str: str

Text to search for and replace

path: str

Path to the file where text should be replaced

class BetaMemoryTool20250818InsertCommand: …

command: Literal\["insert"\]

Command type identifier

Accepts one of the following:

"insert"

insert\_line: int

Line number where text should be inserted

minimum1

insert\_text: str

Text to insert at the specified line

path: str

Path to the file where text should be inserted

class BetaMemoryTool20250818DeleteCommand: …

command: Literal\["delete"\]

Command type identifier

Accepts one of the following:

"delete"

path: str

Path to the file or directory to delete

class BetaMemoryTool20250818RenameCommand: …

command: Literal\["rename"\]

Command type identifier

Accepts one of the following:

"rename"

new\_path: str

New path for the file or directory

old\_path: str

Current path of the file or directory

class BetaMemoryTool20250818CreateCommand: …

command: Literal\["create"\]

Command type identifier

Accepts one of the following:

"create"

file\_text: str

Content to write to the file

path: str

Path where the file should be created

class BetaMemoryTool20250818DeleteCommand: …

command: Literal\["delete"\]

Command type identifier

Accepts one of the following:

"delete"

path: str

Path to the file or directory to delete

class BetaMemoryTool20250818InsertCommand: …

command: Literal\["insert"\]

Command type identifier

Accepts one of the following:

"insert"

insert\_line: int

Line number where text should be inserted

minimum1

insert\_text: str

Text to insert at the specified line

path: str

Path to the file where text should be inserted

class BetaMemoryTool20250818RenameCommand: …

command: Literal\["rename"\]

Command type identifier

Accepts one of the following:

"rename"

new\_path: str

New path for the file or directory

old\_path: str

Current path of the file or directory

class BetaMemoryTool20250818StrReplaceCommand: …

command: Literal\["str\_replace"\]

Command type identifier

Accepts one of the following:

"str\_replace"

new\_str: str

Text to replace with

old\_str: str

Text to search for and replace

path: str

Path to the file where text should be replaced

class BetaMemoryTool20250818ViewCommand: …

command: Literal\["view"\]

Command type identifier

Accepts one of the following:

"view"

path: str

Path to directory or file to view

view\_range: Optional\[List\[int\]\]

Optional line range for viewing specific lines

class BetaMessage: …

id: str

Unique object identifier.

The format and length of IDs may change over time.

container: Optional\[BetaContainer\]

Information about the container used in the request (for the code execution tool)

id: str

Identifier for the container used in this request

expires\_at: datetime

The time at which the container will expire.

formatdate-time

skills: Optional\[List\[[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)\]\]

Skills loaded in the container

skill\_id: str

Skill ID

maxLength64

minLength1

type: Literal\["anthropic", "custom"\]

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: str

Skill version or 'latest' for most recent version

maxLength64

minLength1

content: List\[[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)\]

Content generated by the model.

This is an array of content blocks, each of which has a `type` that determines its shape.

Example:

```
[{"type": "text", "text": "Hi, I'm Claude."}]
```

If the request input `messages` ended with an `assistant` turn, then the response `content` will continue directly from that last turn. You can use this to constrain the model's output.

For example, if the input `messages` were:

```
[\
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},\
  {"role": "assistant", "content": "The best answer is ("}\
]
```

Then the response `content` might be:

```
[{"type": "text", "text": "B)"}]
```

Accepts one of the following:

class BetaTextBlock: …

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaThinkingBlock: …

signature: str

thinking: str

type: Literal\["thinking"\]

Accepts one of the following:

"thinking"

class BetaRedactedThinkingBlock: …

data: str

type: Literal\["redacted\_thinking"\]

Accepts one of the following:

"redacted\_thinking"

class BetaToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

type: Literal\["tool\_use"\]

Accepts one of the following:

"tool\_use"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaServerToolUseBlock: …

id: str

caller: Caller

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

input: Dict\[str, object\]

name: Literal\["web\_search", "web\_fetch", "code\_execution", 4 more\]

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: Literal\["server\_tool\_use"\]

Accepts one of the following:

"server\_tool\_use"

class BetaWebSearchToolResultBlock: …

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

class BetaWebSearchToolResultError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = List\[[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)\]

encrypted\_content: str

page\_age: Optional\[str\]

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

tool\_use\_id: str

type: Literal\["web\_search\_tool\_result"\]

Accepts one of the following:

"web\_search\_tool\_result"

class BetaWebFetchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaWebFetchToolResultErrorBlock: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

class BetaWebFetchBlock: …

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)

citations: Optional\[BetaCitationConfig\]

Citation configuration for the document

enabled: bool

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

title: Optional\[str\]

The title of the document

type: Literal\["document"\]

Accepts one of the following:

"document"

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

tool\_use\_id: str

type: Literal\["web\_fetch\_tool\_result"\]

Accepts one of the following:

"web\_fetch\_tool\_result"

class BetaCodeExecutionToolResultBlock: …

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

class BetaCodeExecutionToolResultError: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlock: …

content: List\[[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: str

type: Literal\["code\_execution\_tool\_result"\]

Accepts one of the following:

"code\_execution\_tool\_result"

class BetaBashCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaBashCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaBashCodeExecutionResultBlock: …

content: List\[[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: str

type: Literal\["bash\_code\_execution\_tool\_result"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

class BetaTextEditorCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaTextEditorCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: Optional\[str\]

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

class BetaTextEditorCodeExecutionViewResultBlock: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

class BetaTextEditorCodeExecutionCreateResultBlock: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlock: …

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: str

type: Literal\["text\_editor\_code\_execution\_tool\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

class BetaToolSearchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaToolSearchToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: Optional\[str\]

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolSearchResultBlock: …

tool\_references: List\[[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: str

type: Literal\["tool\_search\_tool\_result"\]

Accepts one of the following:

"tool\_search\_tool\_result"

class BetaMCPToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

The name of the MCP tool

server\_name: str

The name of the MCP server

type: Literal\["mcp\_tool\_use"\]

Accepts one of the following:

"mcp\_tool\_use"

class BetaMCPToolResultBlock: …

content: Union\[str, List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaMCPToolResultBlockContent = List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

is\_error: bool

tool\_use\_id: str

type: Literal\["mcp\_tool\_result"\]

Accepts one of the following:

"mcp\_tool\_result"

class BetaContainerUploadBlock: …

Response model for a file uploaded to the container.

file\_id: str

type: Literal\["container\_upload"\]

Accepts one of the following:

"container\_upload"

context\_management: Optional\[BetaContextManagementResponse\]

Context management response.

Information about context management strategies applied during the request.

applied\_edits: List\[AppliedEdit\]

List of context management edits that were applied.

Accepts one of the following:

class BetaClearToolUses20250919EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: int

Number of tool uses that were cleared.

minimum0

type: Literal\["clear\_tool\_uses\_20250919"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

class BetaClearThinking20251015EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: int

Number of thinking turns that were cleared.

minimum0

type: Literal\["clear\_thinking\_20251015"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

model: [Model](https://platform.claude.com/docs/en/api/messages#model)

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

UnionMember0 = Literal\["claude-opus-4-5-20251101", "claude-opus-4-5", "claude-3-7-sonnet-latest", 17 more\]

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

- `claude-opus-4-5-20251101` \- Premium model combining maximum intelligence with practical performance
- `claude-opus-4-5` \- Premium model combining maximum intelligence with practical performance
- `claude-3-7-sonnet-latest` \- Deprecated: Will reach end-of-life on February 19th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-7-sonnet-20250219` \- Deprecated: Will reach end-of-life on February 19th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-5-haiku-latest` \- Fastest and most compact model for near-instant responsiveness
- `claude-3-5-haiku-20241022` \- Our fastest model
- `claude-haiku-4-5` \- Hybrid model, capable of near-instant responses and extended thinking
- `claude-haiku-4-5-20251001` \- Hybrid model, capable of near-instant responses and extended thinking
- `claude-sonnet-4-20250514` \- High-performance model with extended thinking
- `claude-sonnet-4-0` \- High-performance model with extended thinking
- `claude-4-sonnet-20250514` \- High-performance model with extended thinking
- `claude-sonnet-4-5` \- Our best model for real-world agents and coding
- `claude-sonnet-4-5-20250929` \- Our best model for real-world agents and coding
- `claude-opus-4-0` \- Our most capable model
- `claude-opus-4-20250514` \- Our most capable model
- `claude-4-opus-20250514` \- Our most capable model
- `claude-opus-4-1-20250805` \- Our most capable model
- `claude-3-opus-latest` \- Deprecated: Will reach end-of-life on January 5th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-opus-20240229` \- Deprecated: Will reach end-of-life on January 5th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-haiku-20240307` \- Our previous most fast and cost-effective

Accepts one of the following:

"claude-opus-4-5-20251101"

Premium model combining maximum intelligence with practical performance

"claude-opus-4-5"

Premium model combining maximum intelligence with practical performance

"claude-3-7-sonnet-latest"

High-performance model with early extended thinking

"claude-3-7-sonnet-20250219"

High-performance model with early extended thinking

"claude-3-5-haiku-latest"

Fastest and most compact model for near-instant responsiveness

"claude-3-5-haiku-20241022"

Our fastest model

"claude-haiku-4-5"

Hybrid model, capable of near-instant responses and extended thinking

"claude-haiku-4-5-20251001"

Hybrid model, capable of near-instant responses and extended thinking

"claude-sonnet-4-20250514"

High-performance model with extended thinking

"claude-sonnet-4-0"

High-performance model with extended thinking

"claude-4-sonnet-20250514"

High-performance model with extended thinking

"claude-sonnet-4-5"

Our best model for real-world agents and coding

"claude-sonnet-4-5-20250929"

Our best model for real-world agents and coding

"claude-opus-4-0"

Our most capable model

"claude-opus-4-20250514"

Our most capable model

"claude-4-opus-20250514"

Our most capable model

"claude-opus-4-1-20250805"

Our most capable model

"claude-3-opus-latest"

Excels at writing and complex tasks

"claude-3-opus-20240229"

Excels at writing and complex tasks

"claude-3-haiku-20240307"

Our previous most fast and cost-effective

UnionMember1 = str

role: Literal\["assistant"\]

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: Optional\[BetaStopReason\]

The reason that we stopped.

This may be one the following values:

- `"end_turn"`: the model reached a natural stopping point
- `"max_tokens"`: we exceeded the requested `max_tokens` or the model's maximum
- `"stop_sequence"`: one of your provided custom `stop_sequences` was generated
- `"tool_use"`: the model invoked one or more tools
- `"pause_turn"`: we paused a long-running turn. You may provide the response back as-is in a subsequent request to let the model continue.
- `"refusal"`: when streaming classifiers intervene to handle potential policy violations

In non-streaming mode this value is always non-null. In streaming mode, it is null in the `message_start` event and non-null otherwise.

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

"model\_context\_window\_exceeded"

stop\_sequence: Optional\[str\]

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: Literal\["message"\]

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage)

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: Optional\[BetaCacheCreation\]

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: int

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: int

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: Optional\[int\]

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: Optional\[int\]

The number of input tokens read from the cache.

minimum0

input\_tokens: int

The number of input tokens which were used.

minimum0

output\_tokens: int

The number of output tokens which were used.

minimum0

server\_tool\_use: Optional\[BetaServerToolUsage\]

The number of server tool requests.

web\_fetch\_requests: int

The number of web fetch tool requests.

minimum0

web\_search\_requests: int

The number of web search tool requests.

minimum0

service\_tier: Optional\[Literal\["standard", "priority", "batch"\]\]

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

class BetaMessageDeltaUsage: …

cache\_creation\_input\_tokens: Optional\[int\]

The cumulative number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: Optional\[int\]

The cumulative number of input tokens read from the cache.

minimum0

input\_tokens: Optional\[int\]

The cumulative number of input tokens which were used.

minimum0

output\_tokens: int

The cumulative number of output tokens which were used.

server\_tool\_use: Optional\[BetaServerToolUsage\]

The number of server tool requests.

web\_fetch\_requests: int

The number of web fetch tool requests.

minimum0

web\_search\_requests: int

The number of web search tool requests.

minimum0

class BetaMessageParam: …

content: Union\[str, List\[[BetaContentBlockParam](https://platform.claude.com/docs/en/api/beta#beta_content_block_param)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentUnionMember1 = List\[[BetaContentBlockParam](https://platform.claude.com/docs/en/api/beta#beta_content_block_param)\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaRequestDocumentBlock: …

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaContentBlockSource: …

content: Union\[str, List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaContentBlockSourceContent = List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["content"\]

Accepts one of the following:

"content"

class BetaURLPDFSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileDocumentSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["document"\]

Accepts one of the following:

"document"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

context: Optional\[str\]

title: Optional\[str\]

class BetaSearchResultBlockParam: …

content: List\[[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)\]

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

source: str

title: str

type: Literal\["search\_result"\]

Accepts one of the following:

"search\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

class BetaThinkingBlockParam: …

signature: str

thinking: str

type: Literal\["thinking"\]

Accepts one of the following:

"thinking"

class BetaRedactedThinkingBlockParam: …

data: str

type: Literal\["redacted\_thinking"\]

Accepts one of the following:

"redacted\_thinking"

class BetaToolUseBlockParam: …

id: str

input: Dict\[str, object\]

name: str

type: Literal\["tool\_use"\]

Accepts one of the following:

"tool\_use"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaToolResultBlockParam: …

tool\_use\_id: str

type: Literal\["tool\_result"\]

Accepts one of the following:

"tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

content: Optional\[Union\[str, List\[Content\], null\]\]

Accepts one of the following:

ContentUnionMember0 = str

Content = List\[Content\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaSearchResultBlockParam: …

content: List\[[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)\]

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

source: str

title: str

type: Literal\["search\_result"\]

Accepts one of the following:

"search\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

class BetaRequestDocumentBlock: …

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaContentBlockSource: …

content: Union\[str, List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaContentBlockSourceContent = List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["content"\]

Accepts one of the following:

"content"

class BetaURLPDFSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileDocumentSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["document"\]

Accepts one of the following:

"document"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

context: Optional\[str\]

title: Optional\[str\]

class BetaToolReferenceBlockParam: …

Tool reference block that can be included in tool\_result content.

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

is\_error: Optional\[bool\]

class BetaServerToolUseBlockParam: …

id: str

input: Dict\[str, object\]

name: Literal\["web\_search", "web\_fetch", "code\_execution", 4 more\]

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: Literal\["server\_tool\_use"\]

Accepts one of the following:

"server\_tool\_use"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaWebSearchToolResultBlockParam: …

content: [BetaWebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_param_content)

Accepts one of the following:

ResultBlock = List\[[BetaWebSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block_param)\]

encrypted\_content: str

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

page\_age: Optional\[str\]

class BetaWebSearchToolRequestError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

tool\_use\_id: str

type: Literal\["web\_search\_tool\_result"\]

Accepts one of the following:

"web\_search\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaWebFetchToolResultBlockParam: …

content: Content

Accepts one of the following:

class BetaWebFetchToolResultErrorBlockParam: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

class BetaWebFetchBlockParam: …

content: [BetaRequestDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_request_document_block)

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaContentBlockSource: …

content: Union\[str, List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaContentBlockSourceContent = List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["content"\]

Accepts one of the following:

"content"

class BetaURLPDFSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileDocumentSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["document"\]

Accepts one of the following:

"document"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

context: Optional\[str\]

title: Optional\[str\]

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

tool\_use\_id: str

type: Literal\["web\_fetch\_tool\_result"\]

Accepts one of the following:

"web\_fetch\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaCodeExecutionToolResultBlockParam: …

content: [BetaCodeExecutionToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_param_content)

Accepts one of the following:

class BetaCodeExecutionToolResultErrorParam: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlockParam: …

content: List\[[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: str

type: Literal\["code\_execution\_tool\_result"\]

Accepts one of the following:

"code\_execution\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaBashCodeExecutionToolResultBlockParam: …

content: Content

Accepts one of the following:

class BetaBashCodeExecutionToolResultErrorParam: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaBashCodeExecutionResultBlockParam: …

content: List\[[BetaBashCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block_param)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: str

type: Literal\["bash\_code\_execution\_tool\_result"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaTextEditorCodeExecutionToolResultBlockParam: …

content: Content

Accepts one of the following:

class BetaTextEditorCodeExecutionToolResultErrorParam: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

error\_message: Optional\[str\]

class BetaTextEditorCodeExecutionViewResultBlockParam: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

class BetaTextEditorCodeExecutionCreateResultBlockParam: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlockParam: …

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

tool\_use\_id: str

type: Literal\["text\_editor\_code\_execution\_tool\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaToolSearchToolResultBlockParam: …

content: Content

Accepts one of the following:

class BetaToolSearchToolResultErrorParam: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolSearchResultBlockParam: …

tool\_references: List\[[BetaToolReferenceBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block_param)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: str

type: Literal\["tool\_search\_tool\_result"\]

Accepts one of the following:

"tool\_search\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaMCPToolUseBlockParam: …

id: str

input: Dict\[str, object\]

name: str

server\_name: str

The name of the MCP server

type: Literal\["mcp\_tool\_use"\]

Accepts one of the following:

"mcp\_tool\_use"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaRequestMCPToolResultBlockParam: …

tool\_use\_id: str

type: Literal\["mcp\_tool\_result"\]

Accepts one of the following:

"mcp\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

content: Optional\[Union\[str, List\[[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)\], null\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaMCPToolResultBlockParamContent = List\[[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)\]

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

is\_error: Optional\[bool\]

class BetaContainerUploadBlockParam: …

A content block that represents a file to be uploaded to the container
Files uploaded via this block will be available in the container's input directory.

file\_id: str

type: Literal\["container\_upload"\]

Accepts one of the following:

"container\_upload"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

role: Literal\["user", "assistant"\]

Accepts one of the following:

"user"

"assistant"

class BetaMessageTokensCount: …

context\_management: Optional\[BetaCountTokensContextManagementResponse\]

Information about context management applied to the message.

original\_input\_tokens: int

The original token count before context management was applied

input\_tokens: int

The total number of tokens across the provided list of messages, system prompt, and tools.

class BetaMetadata: …

user\_id: Optional\[str\]

An external identifier for the user who is associated with the request.

This should be a uuid, hash value, or other opaque identifier. Anthropic may use this id to help detect abuse. Do not include any identifying information such as name, email address, or phone number.

maxLength256

class BetaOutputConfig: …

effort: Optional\[Literal\["low", "medium", "high"\]\]

All possible effort levels.

Accepts one of the following:

"low"

"medium"

"high"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

BetaRawContentBlockDelta = [BetaRawContentBlockDelta](https://platform.claude.com/docs/en/api/beta#beta_raw_content_block_delta)

Accepts one of the following:

class BetaTextDelta: …

text: str

type: Literal\["text\_delta"\]

Accepts one of the following:

"text\_delta"

class BetaInputJSONDelta: …

partial\_json: str

type: Literal\["input\_json\_delta"\]

Accepts one of the following:

"input\_json\_delta"

class BetaCitationsDelta: …

citation: Citation

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

type: Literal\["citations\_delta"\]

Accepts one of the following:

"citations\_delta"

class BetaThinkingDelta: …

thinking: str

type: Literal\["thinking\_delta"\]

Accepts one of the following:

"thinking\_delta"

class BetaSignatureDelta: …

signature: str

type: Literal\["signature\_delta"\]

Accepts one of the following:

"signature\_delta"

class BetaRawContentBlockDeltaEvent: …

delta: [BetaRawContentBlockDelta](https://platform.claude.com/docs/en/api/beta#beta_raw_content_block_delta)

Accepts one of the following:

class BetaTextDelta: …

text: str

type: Literal\["text\_delta"\]

Accepts one of the following:

"text\_delta"

class BetaInputJSONDelta: …

partial\_json: str

type: Literal\["input\_json\_delta"\]

Accepts one of the following:

"input\_json\_delta"

class BetaCitationsDelta: …

citation: Citation

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

type: Literal\["citations\_delta"\]

Accepts one of the following:

"citations\_delta"

class BetaThinkingDelta: …

thinking: str

type: Literal\["thinking\_delta"\]

Accepts one of the following:

"thinking\_delta"

class BetaSignatureDelta: …

signature: str

type: Literal\["signature\_delta"\]

Accepts one of the following:

"signature\_delta"

index: int

type: Literal\["content\_block\_delta"\]

Accepts one of the following:

"content\_block\_delta"

class BetaRawContentBlockStartEvent: …

content\_block: ContentBlock

Response model for a file uploaded to the container.

Accepts one of the following:

class BetaTextBlock: …

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaThinkingBlock: …

signature: str

thinking: str

type: Literal\["thinking"\]

Accepts one of the following:

"thinking"

class BetaRedactedThinkingBlock: …

data: str

type: Literal\["redacted\_thinking"\]

Accepts one of the following:

"redacted\_thinking"

class BetaToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

type: Literal\["tool\_use"\]

Accepts one of the following:

"tool\_use"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaServerToolUseBlock: …

id: str

caller: Caller

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

input: Dict\[str, object\]

name: Literal\["web\_search", "web\_fetch", "code\_execution", 4 more\]

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: Literal\["server\_tool\_use"\]

Accepts one of the following:

"server\_tool\_use"

class BetaWebSearchToolResultBlock: …

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

class BetaWebSearchToolResultError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = List\[[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)\]

encrypted\_content: str

page\_age: Optional\[str\]

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

tool\_use\_id: str

type: Literal\["web\_search\_tool\_result"\]

Accepts one of the following:

"web\_search\_tool\_result"

class BetaWebFetchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaWebFetchToolResultErrorBlock: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

class BetaWebFetchBlock: …

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)

citations: Optional\[BetaCitationConfig\]

Citation configuration for the document

enabled: bool

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

title: Optional\[str\]

The title of the document

type: Literal\["document"\]

Accepts one of the following:

"document"

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

tool\_use\_id: str

type: Literal\["web\_fetch\_tool\_result"\]

Accepts one of the following:

"web\_fetch\_tool\_result"

class BetaCodeExecutionToolResultBlock: …

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

class BetaCodeExecutionToolResultError: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlock: …

content: List\[[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: str

type: Literal\["code\_execution\_tool\_result"\]

Accepts one of the following:

"code\_execution\_tool\_result"

class BetaBashCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaBashCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaBashCodeExecutionResultBlock: …

content: List\[[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: str

type: Literal\["bash\_code\_execution\_tool\_result"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

class BetaTextEditorCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaTextEditorCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: Optional\[str\]

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

class BetaTextEditorCodeExecutionViewResultBlock: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

class BetaTextEditorCodeExecutionCreateResultBlock: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlock: …

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: str

type: Literal\["text\_editor\_code\_execution\_tool\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

class BetaToolSearchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaToolSearchToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: Optional\[str\]

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolSearchResultBlock: …

tool\_references: List\[[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: str

type: Literal\["tool\_search\_tool\_result"\]

Accepts one of the following:

"tool\_search\_tool\_result"

class BetaMCPToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

The name of the MCP tool

server\_name: str

The name of the MCP server

type: Literal\["mcp\_tool\_use"\]

Accepts one of the following:

"mcp\_tool\_use"

class BetaMCPToolResultBlock: …

content: Union\[str, List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaMCPToolResultBlockContent = List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

is\_error: bool

tool\_use\_id: str

type: Literal\["mcp\_tool\_result"\]

Accepts one of the following:

"mcp\_tool\_result"

class BetaContainerUploadBlock: …

Response model for a file uploaded to the container.

file\_id: str

type: Literal\["container\_upload"\]

Accepts one of the following:

"container\_upload"

index: int

type: Literal\["content\_block\_start"\]

Accepts one of the following:

"content\_block\_start"

class BetaRawContentBlockStopEvent: …

index: int

type: Literal\["content\_block\_stop"\]

Accepts one of the following:

"content\_block\_stop"

class BetaRawMessageDeltaEvent: …

context\_management: Optional\[BetaContextManagementResponse\]

Information about context management strategies applied during the request

applied\_edits: List\[AppliedEdit\]

List of context management edits that were applied.

Accepts one of the following:

class BetaClearToolUses20250919EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: int

Number of tool uses that were cleared.

minimum0

type: Literal\["clear\_tool\_uses\_20250919"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

class BetaClearThinking20251015EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: int

Number of thinking turns that were cleared.

minimum0

type: Literal\["clear\_thinking\_20251015"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

delta: Delta

container: Optional\[BetaContainer\]

Information about the container used in the request (for the code execution tool)

id: str

Identifier for the container used in this request

expires\_at: datetime

The time at which the container will expire.

formatdate-time

skills: Optional\[List\[[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)\]\]

Skills loaded in the container

skill\_id: str

Skill ID

maxLength64

minLength1

type: Literal\["anthropic", "custom"\]

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: str

Skill version or 'latest' for most recent version

maxLength64

minLength1

stop\_reason: Optional\[BetaStopReason\]

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

"model\_context\_window\_exceeded"

stop\_sequence: Optional\[str\]

type: Literal\["message\_delta"\]

Accepts one of the following:

"message\_delta"

usage: [BetaMessageDeltaUsage](https://platform.claude.com/docs/en/api/beta#beta_message_delta_usage)

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation\_input\_tokens: Optional\[int\]

The cumulative number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: Optional\[int\]

The cumulative number of input tokens read from the cache.

minimum0

input\_tokens: Optional\[int\]

The cumulative number of input tokens which were used.

minimum0

output\_tokens: int

The cumulative number of output tokens which were used.

server\_tool\_use: Optional\[BetaServerToolUsage\]

The number of server tool requests.

web\_fetch\_requests: int

The number of web fetch tool requests.

minimum0

web\_search\_requests: int

The number of web search tool requests.

minimum0

class BetaRawMessageStartEvent: …

message: [BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message)

id: str

Unique object identifier.

The format and length of IDs may change over time.

container: Optional\[BetaContainer\]

Information about the container used in the request (for the code execution tool)

id: str

Identifier for the container used in this request

expires\_at: datetime

The time at which the container will expire.

formatdate-time

skills: Optional\[List\[[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)\]\]

Skills loaded in the container

skill\_id: str

Skill ID

maxLength64

minLength1

type: Literal\["anthropic", "custom"\]

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: str

Skill version or 'latest' for most recent version

maxLength64

minLength1

content: List\[[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)\]

Content generated by the model.

This is an array of content blocks, each of which has a `type` that determines its shape.

Example:

```
[{"type": "text", "text": "Hi, I'm Claude."}]
```

If the request input `messages` ended with an `assistant` turn, then the response `content` will continue directly from that last turn. You can use this to constrain the model's output.

For example, if the input `messages` were:

```
[\
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},\
  {"role": "assistant", "content": "The best answer is ("}\
]
```

Then the response `content` might be:

```
[{"type": "text", "text": "B)"}]
```

Accepts one of the following:

class BetaTextBlock: …

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaThinkingBlock: …

signature: str

thinking: str

type: Literal\["thinking"\]

Accepts one of the following:

"thinking"

class BetaRedactedThinkingBlock: …

data: str

type: Literal\["redacted\_thinking"\]

Accepts one of the following:

"redacted\_thinking"

class BetaToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

type: Literal\["tool\_use"\]

Accepts one of the following:

"tool\_use"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaServerToolUseBlock: …

id: str

caller: Caller

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

input: Dict\[str, object\]

name: Literal\["web\_search", "web\_fetch", "code\_execution", 4 more\]

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: Literal\["server\_tool\_use"\]

Accepts one of the following:

"server\_tool\_use"

class BetaWebSearchToolResultBlock: …

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

class BetaWebSearchToolResultError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = List\[[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)\]

encrypted\_content: str

page\_age: Optional\[str\]

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

tool\_use\_id: str

type: Literal\["web\_search\_tool\_result"\]

Accepts one of the following:

"web\_search\_tool\_result"

class BetaWebFetchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaWebFetchToolResultErrorBlock: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

class BetaWebFetchBlock: …

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)

citations: Optional\[BetaCitationConfig\]

Citation configuration for the document

enabled: bool

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

title: Optional\[str\]

The title of the document

type: Literal\["document"\]

Accepts one of the following:

"document"

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

tool\_use\_id: str

type: Literal\["web\_fetch\_tool\_result"\]

Accepts one of the following:

"web\_fetch\_tool\_result"

class BetaCodeExecutionToolResultBlock: …

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

class BetaCodeExecutionToolResultError: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlock: …

content: List\[[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: str

type: Literal\["code\_execution\_tool\_result"\]

Accepts one of the following:

"code\_execution\_tool\_result"

class BetaBashCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaBashCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaBashCodeExecutionResultBlock: …

content: List\[[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: str

type: Literal\["bash\_code\_execution\_tool\_result"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

class BetaTextEditorCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaTextEditorCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: Optional\[str\]

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

class BetaTextEditorCodeExecutionViewResultBlock: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

class BetaTextEditorCodeExecutionCreateResultBlock: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlock: …

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: str

type: Literal\["text\_editor\_code\_execution\_tool\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

class BetaToolSearchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaToolSearchToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: Optional\[str\]

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolSearchResultBlock: …

tool\_references: List\[[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: str

type: Literal\["tool\_search\_tool\_result"\]

Accepts one of the following:

"tool\_search\_tool\_result"

class BetaMCPToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

The name of the MCP tool

server\_name: str

The name of the MCP server

type: Literal\["mcp\_tool\_use"\]

Accepts one of the following:

"mcp\_tool\_use"

class BetaMCPToolResultBlock: …

content: Union\[str, List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaMCPToolResultBlockContent = List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

is\_error: bool

tool\_use\_id: str

type: Literal\["mcp\_tool\_result"\]

Accepts one of the following:

"mcp\_tool\_result"

class BetaContainerUploadBlock: …

Response model for a file uploaded to the container.

file\_id: str

type: Literal\["container\_upload"\]

Accepts one of the following:

"container\_upload"

context\_management: Optional\[BetaContextManagementResponse\]

Context management response.

Information about context management strategies applied during the request.

applied\_edits: List\[AppliedEdit\]

List of context management edits that were applied.

Accepts one of the following:

class BetaClearToolUses20250919EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: int

Number of tool uses that were cleared.

minimum0

type: Literal\["clear\_tool\_uses\_20250919"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

class BetaClearThinking20251015EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: int

Number of thinking turns that were cleared.

minimum0

type: Literal\["clear\_thinking\_20251015"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

model: [Model](https://platform.claude.com/docs/en/api/messages#model)

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

UnionMember0 = Literal\["claude-opus-4-5-20251101", "claude-opus-4-5", "claude-3-7-sonnet-latest", 17 more\]

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

- `claude-opus-4-5-20251101` \- Premium model combining maximum intelligence with practical performance
- `claude-opus-4-5` \- Premium model combining maximum intelligence with practical performance
- `claude-3-7-sonnet-latest` \- Deprecated: Will reach end-of-life on February 19th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-7-sonnet-20250219` \- Deprecated: Will reach end-of-life on February 19th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-5-haiku-latest` \- Fastest and most compact model for near-instant responsiveness
- `claude-3-5-haiku-20241022` \- Our fastest model
- `claude-haiku-4-5` \- Hybrid model, capable of near-instant responses and extended thinking
- `claude-haiku-4-5-20251001` \- Hybrid model, capable of near-instant responses and extended thinking
- `claude-sonnet-4-20250514` \- High-performance model with extended thinking
- `claude-sonnet-4-0` \- High-performance model with extended thinking
- `claude-4-sonnet-20250514` \- High-performance model with extended thinking
- `claude-sonnet-4-5` \- Our best model for real-world agents and coding
- `claude-sonnet-4-5-20250929` \- Our best model for real-world agents and coding
- `claude-opus-4-0` \- Our most capable model
- `claude-opus-4-20250514` \- Our most capable model
- `claude-4-opus-20250514` \- Our most capable model
- `claude-opus-4-1-20250805` \- Our most capable model
- `claude-3-opus-latest` \- Deprecated: Will reach end-of-life on January 5th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-opus-20240229` \- Deprecated: Will reach end-of-life on January 5th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-haiku-20240307` \- Our previous most fast and cost-effective

Accepts one of the following:

"claude-opus-4-5-20251101"

Premium model combining maximum intelligence with practical performance

"claude-opus-4-5"

Premium model combining maximum intelligence with practical performance

"claude-3-7-sonnet-latest"

High-performance model with early extended thinking

"claude-3-7-sonnet-20250219"

High-performance model with early extended thinking

"claude-3-5-haiku-latest"

Fastest and most compact model for near-instant responsiveness

"claude-3-5-haiku-20241022"

Our fastest model

"claude-haiku-4-5"

Hybrid model, capable of near-instant responses and extended thinking

"claude-haiku-4-5-20251001"

Hybrid model, capable of near-instant responses and extended thinking

"claude-sonnet-4-20250514"

High-performance model with extended thinking

"claude-sonnet-4-0"

High-performance model with extended thinking

"claude-4-sonnet-20250514"

High-performance model with extended thinking

"claude-sonnet-4-5"

Our best model for real-world agents and coding

"claude-sonnet-4-5-20250929"

Our best model for real-world agents and coding

"claude-opus-4-0"

Our most capable model

"claude-opus-4-20250514"

Our most capable model

"claude-4-opus-20250514"

Our most capable model

"claude-opus-4-1-20250805"

Our most capable model

"claude-3-opus-latest"

Excels at writing and complex tasks

"claude-3-opus-20240229"

Excels at writing and complex tasks

"claude-3-haiku-20240307"

Our previous most fast and cost-effective

UnionMember1 = str

role: Literal\["assistant"\]

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: Optional\[BetaStopReason\]

The reason that we stopped.

This may be one the following values:

- `"end_turn"`: the model reached a natural stopping point
- `"max_tokens"`: we exceeded the requested `max_tokens` or the model's maximum
- `"stop_sequence"`: one of your provided custom `stop_sequences` was generated
- `"tool_use"`: the model invoked one or more tools
- `"pause_turn"`: we paused a long-running turn. You may provide the response back as-is in a subsequent request to let the model continue.
- `"refusal"`: when streaming classifiers intervene to handle potential policy violations

In non-streaming mode this value is always non-null. In streaming mode, it is null in the `message_start` event and non-null otherwise.

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

"model\_context\_window\_exceeded"

stop\_sequence: Optional\[str\]

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: Literal\["message"\]

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage)

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: Optional\[BetaCacheCreation\]

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: int

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: int

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: Optional\[int\]

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: Optional\[int\]

The number of input tokens read from the cache.

minimum0

input\_tokens: int

The number of input tokens which were used.

minimum0

output\_tokens: int

The number of output tokens which were used.

minimum0

server\_tool\_use: Optional\[BetaServerToolUsage\]

The number of server tool requests.

web\_fetch\_requests: int

The number of web fetch tool requests.

minimum0

web\_search\_requests: int

The number of web search tool requests.

minimum0

service\_tier: Optional\[Literal\["standard", "priority", "batch"\]\]

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

type: Literal\["message\_start"\]

Accepts one of the following:

"message\_start"

class BetaRawMessageStopEvent: …

type: Literal\["message\_stop"\]

Accepts one of the following:

"message\_stop"

BetaRawMessageStreamEvent = [BetaRawMessageStreamEvent](https://platform.claude.com/docs/en/api/beta#beta_raw_message_stream_event)

Accepts one of the following:

class BetaRawMessageStartEvent: …

message: [BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message)

id: str

Unique object identifier.

The format and length of IDs may change over time.

container: Optional\[BetaContainer\]

Information about the container used in the request (for the code execution tool)

id: str

Identifier for the container used in this request

expires\_at: datetime

The time at which the container will expire.

formatdate-time

skills: Optional\[List\[[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)\]\]

Skills loaded in the container

skill\_id: str

Skill ID

maxLength64

minLength1

type: Literal\["anthropic", "custom"\]

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: str

Skill version or 'latest' for most recent version

maxLength64

minLength1

content: List\[[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)\]

Content generated by the model.

This is an array of content blocks, each of which has a `type` that determines its shape.

Example:

```
[{"type": "text", "text": "Hi, I'm Claude."}]
```

If the request input `messages` ended with an `assistant` turn, then the response `content` will continue directly from that last turn. You can use this to constrain the model's output.

For example, if the input `messages` were:

```
[\
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},\
  {"role": "assistant", "content": "The best answer is ("}\
]
```

Then the response `content` might be:

```
[{"type": "text", "text": "B)"}]
```

Accepts one of the following:

class BetaTextBlock: …

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaThinkingBlock: …

signature: str

thinking: str

type: Literal\["thinking"\]

Accepts one of the following:

"thinking"

class BetaRedactedThinkingBlock: …

data: str

type: Literal\["redacted\_thinking"\]

Accepts one of the following:

"redacted\_thinking"

class BetaToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

type: Literal\["tool\_use"\]

Accepts one of the following:

"tool\_use"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaServerToolUseBlock: …

id: str

caller: Caller

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

input: Dict\[str, object\]

name: Literal\["web\_search", "web\_fetch", "code\_execution", 4 more\]

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: Literal\["server\_tool\_use"\]

Accepts one of the following:

"server\_tool\_use"

class BetaWebSearchToolResultBlock: …

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

class BetaWebSearchToolResultError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = List\[[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)\]

encrypted\_content: str

page\_age: Optional\[str\]

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

tool\_use\_id: str

type: Literal\["web\_search\_tool\_result"\]

Accepts one of the following:

"web\_search\_tool\_result"

class BetaWebFetchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaWebFetchToolResultErrorBlock: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

class BetaWebFetchBlock: …

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)

citations: Optional\[BetaCitationConfig\]

Citation configuration for the document

enabled: bool

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

title: Optional\[str\]

The title of the document

type: Literal\["document"\]

Accepts one of the following:

"document"

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

tool\_use\_id: str

type: Literal\["web\_fetch\_tool\_result"\]

Accepts one of the following:

"web\_fetch\_tool\_result"

class BetaCodeExecutionToolResultBlock: …

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

class BetaCodeExecutionToolResultError: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlock: …

content: List\[[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: str

type: Literal\["code\_execution\_tool\_result"\]

Accepts one of the following:

"code\_execution\_tool\_result"

class BetaBashCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaBashCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaBashCodeExecutionResultBlock: …

content: List\[[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: str

type: Literal\["bash\_code\_execution\_tool\_result"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

class BetaTextEditorCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaTextEditorCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: Optional\[str\]

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

class BetaTextEditorCodeExecutionViewResultBlock: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

class BetaTextEditorCodeExecutionCreateResultBlock: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlock: …

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: str

type: Literal\["text\_editor\_code\_execution\_tool\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

class BetaToolSearchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaToolSearchToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: Optional\[str\]

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolSearchResultBlock: …

tool\_references: List\[[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: str

type: Literal\["tool\_search\_tool\_result"\]

Accepts one of the following:

"tool\_search\_tool\_result"

class BetaMCPToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

The name of the MCP tool

server\_name: str

The name of the MCP server

type: Literal\["mcp\_tool\_use"\]

Accepts one of the following:

"mcp\_tool\_use"

class BetaMCPToolResultBlock: …

content: Union\[str, List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaMCPToolResultBlockContent = List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

is\_error: bool

tool\_use\_id: str

type: Literal\["mcp\_tool\_result"\]

Accepts one of the following:

"mcp\_tool\_result"

class BetaContainerUploadBlock: …

Response model for a file uploaded to the container.

file\_id: str

type: Literal\["container\_upload"\]

Accepts one of the following:

"container\_upload"

context\_management: Optional\[BetaContextManagementResponse\]

Context management response.

Information about context management strategies applied during the request.

applied\_edits: List\[AppliedEdit\]

List of context management edits that were applied.

Accepts one of the following:

class BetaClearToolUses20250919EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: int

Number of tool uses that were cleared.

minimum0

type: Literal\["clear\_tool\_uses\_20250919"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

class BetaClearThinking20251015EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: int

Number of thinking turns that were cleared.

minimum0

type: Literal\["clear\_thinking\_20251015"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

model: [Model](https://platform.claude.com/docs/en/api/messages#model)

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

UnionMember0 = Literal\["claude-opus-4-5-20251101", "claude-opus-4-5", "claude-3-7-sonnet-latest", 17 more\]

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

- `claude-opus-4-5-20251101` \- Premium model combining maximum intelligence with practical performance
- `claude-opus-4-5` \- Premium model combining maximum intelligence with practical performance
- `claude-3-7-sonnet-latest` \- Deprecated: Will reach end-of-life on February 19th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-7-sonnet-20250219` \- Deprecated: Will reach end-of-life on February 19th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-5-haiku-latest` \- Fastest and most compact model for near-instant responsiveness
- `claude-3-5-haiku-20241022` \- Our fastest model
- `claude-haiku-4-5` \- Hybrid model, capable of near-instant responses and extended thinking
- `claude-haiku-4-5-20251001` \- Hybrid model, capable of near-instant responses and extended thinking
- `claude-sonnet-4-20250514` \- High-performance model with extended thinking
- `claude-sonnet-4-0` \- High-performance model with extended thinking
- `claude-4-sonnet-20250514` \- High-performance model with extended thinking
- `claude-sonnet-4-5` \- Our best model for real-world agents and coding
- `claude-sonnet-4-5-20250929` \- Our best model for real-world agents and coding
- `claude-opus-4-0` \- Our most capable model
- `claude-opus-4-20250514` \- Our most capable model
- `claude-4-opus-20250514` \- Our most capable model
- `claude-opus-4-1-20250805` \- Our most capable model
- `claude-3-opus-latest` \- Deprecated: Will reach end-of-life on January 5th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-opus-20240229` \- Deprecated: Will reach end-of-life on January 5th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-haiku-20240307` \- Our previous most fast and cost-effective

Accepts one of the following:

"claude-opus-4-5-20251101"

Premium model combining maximum intelligence with practical performance

"claude-opus-4-5"

Premium model combining maximum intelligence with practical performance

"claude-3-7-sonnet-latest"

High-performance model with early extended thinking

"claude-3-7-sonnet-20250219"

High-performance model with early extended thinking

"claude-3-5-haiku-latest"

Fastest and most compact model for near-instant responsiveness

"claude-3-5-haiku-20241022"

Our fastest model

"claude-haiku-4-5"

Hybrid model, capable of near-instant responses and extended thinking

"claude-haiku-4-5-20251001"

Hybrid model, capable of near-instant responses and extended thinking

"claude-sonnet-4-20250514"

High-performance model with extended thinking

"claude-sonnet-4-0"

High-performance model with extended thinking

"claude-4-sonnet-20250514"

High-performance model with extended thinking

"claude-sonnet-4-5"

Our best model for real-world agents and coding

"claude-sonnet-4-5-20250929"

Our best model for real-world agents and coding

"claude-opus-4-0"

Our most capable model

"claude-opus-4-20250514"

Our most capable model

"claude-4-opus-20250514"

Our most capable model

"claude-opus-4-1-20250805"

Our most capable model

"claude-3-opus-latest"

Excels at writing and complex tasks

"claude-3-opus-20240229"

Excels at writing and complex tasks

"claude-3-haiku-20240307"

Our previous most fast and cost-effective

UnionMember1 = str

role: Literal\["assistant"\]

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: Optional\[BetaStopReason\]

The reason that we stopped.

This may be one the following values:

- `"end_turn"`: the model reached a natural stopping point
- `"max_tokens"`: we exceeded the requested `max_tokens` or the model's maximum
- `"stop_sequence"`: one of your provided custom `stop_sequences` was generated
- `"tool_use"`: the model invoked one or more tools
- `"pause_turn"`: we paused a long-running turn. You may provide the response back as-is in a subsequent request to let the model continue.
- `"refusal"`: when streaming classifiers intervene to handle potential policy violations

In non-streaming mode this value is always non-null. In streaming mode, it is null in the `message_start` event and non-null otherwise.

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

"model\_context\_window\_exceeded"

stop\_sequence: Optional\[str\]

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: Literal\["message"\]

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage)

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: Optional\[BetaCacheCreation\]

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: int

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: int

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: Optional\[int\]

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: Optional\[int\]

The number of input tokens read from the cache.

minimum0

input\_tokens: int

The number of input tokens which were used.

minimum0

output\_tokens: int

The number of output tokens which were used.

minimum0

server\_tool\_use: Optional\[BetaServerToolUsage\]

The number of server tool requests.

web\_fetch\_requests: int

The number of web fetch tool requests.

minimum0

web\_search\_requests: int

The number of web search tool requests.

minimum0

service\_tier: Optional\[Literal\["standard", "priority", "batch"\]\]

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

type: Literal\["message\_start"\]

Accepts one of the following:

"message\_start"

class BetaRawMessageDeltaEvent: …

context\_management: Optional\[BetaContextManagementResponse\]

Information about context management strategies applied during the request

applied\_edits: List\[AppliedEdit\]

List of context management edits that were applied.

Accepts one of the following:

class BetaClearToolUses20250919EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: int

Number of tool uses that were cleared.

minimum0

type: Literal\["clear\_tool\_uses\_20250919"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

class BetaClearThinking20251015EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: int

Number of thinking turns that were cleared.

minimum0

type: Literal\["clear\_thinking\_20251015"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

delta: Delta

container: Optional\[BetaContainer\]

Information about the container used in the request (for the code execution tool)

id: str

Identifier for the container used in this request

expires\_at: datetime

The time at which the container will expire.

formatdate-time

skills: Optional\[List\[[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)\]\]

Skills loaded in the container

skill\_id: str

Skill ID

maxLength64

minLength1

type: Literal\["anthropic", "custom"\]

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: str

Skill version or 'latest' for most recent version

maxLength64

minLength1

stop\_reason: Optional\[BetaStopReason\]

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

"model\_context\_window\_exceeded"

stop\_sequence: Optional\[str\]

type: Literal\["message\_delta"\]

Accepts one of the following:

"message\_delta"

usage: [BetaMessageDeltaUsage](https://platform.claude.com/docs/en/api/beta#beta_message_delta_usage)

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation\_input\_tokens: Optional\[int\]

The cumulative number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: Optional\[int\]

The cumulative number of input tokens read from the cache.

minimum0

input\_tokens: Optional\[int\]

The cumulative number of input tokens which were used.

minimum0

output\_tokens: int

The cumulative number of output tokens which were used.

server\_tool\_use: Optional\[BetaServerToolUsage\]

The number of server tool requests.

web\_fetch\_requests: int

The number of web fetch tool requests.

minimum0

web\_search\_requests: int

The number of web search tool requests.

minimum0

class BetaRawMessageStopEvent: …

type: Literal\["message\_stop"\]

Accepts one of the following:

"message\_stop"

class BetaRawContentBlockStartEvent: …

content\_block: ContentBlock

Response model for a file uploaded to the container.

Accepts one of the following:

class BetaTextBlock: …

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaThinkingBlock: …

signature: str

thinking: str

type: Literal\["thinking"\]

Accepts one of the following:

"thinking"

class BetaRedactedThinkingBlock: …

data: str

type: Literal\["redacted\_thinking"\]

Accepts one of the following:

"redacted\_thinking"

class BetaToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

type: Literal\["tool\_use"\]

Accepts one of the following:

"tool\_use"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaServerToolUseBlock: …

id: str

caller: Caller

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

input: Dict\[str, object\]

name: Literal\["web\_search", "web\_fetch", "code\_execution", 4 more\]

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: Literal\["server\_tool\_use"\]

Accepts one of the following:

"server\_tool\_use"

class BetaWebSearchToolResultBlock: …

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

class BetaWebSearchToolResultError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = List\[[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)\]

encrypted\_content: str

page\_age: Optional\[str\]

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

tool\_use\_id: str

type: Literal\["web\_search\_tool\_result"\]

Accepts one of the following:

"web\_search\_tool\_result"

class BetaWebFetchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaWebFetchToolResultErrorBlock: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

class BetaWebFetchBlock: …

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)

citations: Optional\[BetaCitationConfig\]

Citation configuration for the document

enabled: bool

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

title: Optional\[str\]

The title of the document

type: Literal\["document"\]

Accepts one of the following:

"document"

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

tool\_use\_id: str

type: Literal\["web\_fetch\_tool\_result"\]

Accepts one of the following:

"web\_fetch\_tool\_result"

class BetaCodeExecutionToolResultBlock: …

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

class BetaCodeExecutionToolResultError: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlock: …

content: List\[[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: str

type: Literal\["code\_execution\_tool\_result"\]

Accepts one of the following:

"code\_execution\_tool\_result"

class BetaBashCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaBashCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaBashCodeExecutionResultBlock: …

content: List\[[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: str

type: Literal\["bash\_code\_execution\_tool\_result"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

class BetaTextEditorCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaTextEditorCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: Optional\[str\]

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

class BetaTextEditorCodeExecutionViewResultBlock: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

class BetaTextEditorCodeExecutionCreateResultBlock: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlock: …

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: str

type: Literal\["text\_editor\_code\_execution\_tool\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

class BetaToolSearchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaToolSearchToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: Optional\[str\]

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolSearchResultBlock: …

tool\_references: List\[[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: str

type: Literal\["tool\_search\_tool\_result"\]

Accepts one of the following:

"tool\_search\_tool\_result"

class BetaMCPToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

The name of the MCP tool

server\_name: str

The name of the MCP server

type: Literal\["mcp\_tool\_use"\]

Accepts one of the following:

"mcp\_tool\_use"

class BetaMCPToolResultBlock: …

content: Union\[str, List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaMCPToolResultBlockContent = List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

is\_error: bool

tool\_use\_id: str

type: Literal\["mcp\_tool\_result"\]

Accepts one of the following:

"mcp\_tool\_result"

class BetaContainerUploadBlock: …

Response model for a file uploaded to the container.

file\_id: str

type: Literal\["container\_upload"\]

Accepts one of the following:

"container\_upload"

index: int

type: Literal\["content\_block\_start"\]

Accepts one of the following:

"content\_block\_start"

class BetaRawContentBlockDeltaEvent: …

delta: [BetaRawContentBlockDelta](https://platform.claude.com/docs/en/api/beta#beta_raw_content_block_delta)

Accepts one of the following:

class BetaTextDelta: …

text: str

type: Literal\["text\_delta"\]

Accepts one of the following:

"text\_delta"

class BetaInputJSONDelta: …

partial\_json: str

type: Literal\["input\_json\_delta"\]

Accepts one of the following:

"input\_json\_delta"

class BetaCitationsDelta: …

citation: Citation

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

type: Literal\["citations\_delta"\]

Accepts one of the following:

"citations\_delta"

class BetaThinkingDelta: …

thinking: str

type: Literal\["thinking\_delta"\]

Accepts one of the following:

"thinking\_delta"

class BetaSignatureDelta: …

signature: str

type: Literal\["signature\_delta"\]

Accepts one of the following:

"signature\_delta"

index: int

type: Literal\["content\_block\_delta"\]

Accepts one of the following:

"content\_block\_delta"

class BetaRawContentBlockStopEvent: …

index: int

type: Literal\["content\_block\_stop"\]

Accepts one of the following:

"content\_block\_stop"

class BetaRedactedThinkingBlock: …

data: str

type: Literal\["redacted\_thinking"\]

Accepts one of the following:

"redacted\_thinking"

class BetaRedactedThinkingBlockParam: …

data: str

type: Literal\["redacted\_thinking"\]

Accepts one of the following:

"redacted\_thinking"

class BetaRequestDocumentBlock: …

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaContentBlockSource: …

content: Union\[str, List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaContentBlockSourceContent = List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["content"\]

Accepts one of the following:

"content"

class BetaURLPDFSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileDocumentSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["document"\]

Accepts one of the following:

"document"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

context: Optional\[str\]

title: Optional\[str\]

class BetaRequestMCPServerToolConfiguration: …

allowed\_tools: Optional\[List\[str\]\]

enabled: Optional\[bool\]

class BetaRequestMCPServerURLDefinition: …

name: str

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

authorization\_token: Optional\[str\]

tool\_configuration: Optional\[BetaRequestMCPServerToolConfiguration\]

allowed\_tools: Optional\[List\[str\]\]

enabled: Optional\[bool\]

class BetaRequestMCPToolResultBlockParam: …

tool\_use\_id: str

type: Literal\["mcp\_tool\_result"\]

Accepts one of the following:

"mcp\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

content: Optional\[Union\[str, List\[[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)\], null\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaMCPToolResultBlockParamContent = List\[[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)\]

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

is\_error: Optional\[bool\]

class BetaSearchResultBlockParam: …

content: List\[[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)\]

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

source: str

title: str

type: Literal\["search\_result"\]

Accepts one of the following:

"search\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaServerToolUsage: …

web\_fetch\_requests: int

The number of web fetch tool requests.

minimum0

web\_search\_requests: int

The number of web search tool requests.

minimum0

class BetaServerToolUseBlock: …

id: str

caller: Caller

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

input: Dict\[str, object\]

name: Literal\["web\_search", "web\_fetch", "code\_execution", 4 more\]

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: Literal\["server\_tool\_use"\]

Accepts one of the following:

"server\_tool\_use"

class BetaServerToolUseBlockParam: …

id: str

input: Dict\[str, object\]

name: Literal\["web\_search", "web\_fetch", "code\_execution", 4 more\]

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: Literal\["server\_tool\_use"\]

Accepts one of the following:

"server\_tool\_use"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaSignatureDelta: …

signature: str

type: Literal\["signature\_delta"\]

Accepts one of the following:

"signature\_delta"

class BetaSkill: …

A skill that was loaded in a container (response model).

skill\_id: str

Skill ID

maxLength64

minLength1

type: Literal\["anthropic", "custom"\]

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: str

Skill version or 'latest' for most recent version

maxLength64

minLength1

class BetaSkillParams: …

Specification for a skill to be loaded in a container (request model).

skill\_id: str

Skill ID

maxLength64

minLength1

type: Literal\["anthropic", "custom"\]

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: Optional\[str\]

Skill version or 'latest' for most recent version

maxLength64

minLength1

BetaStopReason = Literal\["end\_turn", "max\_tokens", "stop\_sequence", 4 more\]

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

"model\_context\_window\_exceeded"

class BetaTextBlock: …

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

BetaTextCitation = [BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

BetaTextCitationParam = [BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaTextDelta: …

text: str

type: Literal\["text\_delta"\]

Accepts one of the following:

"text\_delta"

class BetaTextEditorCodeExecutionCreateResultBlock: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionCreateResultBlockParam: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlock: …

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlockParam: …

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

class BetaTextEditorCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaTextEditorCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: Optional\[str\]

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

class BetaTextEditorCodeExecutionViewResultBlock: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

class BetaTextEditorCodeExecutionCreateResultBlock: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlock: …

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: str

type: Literal\["text\_editor\_code\_execution\_tool\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

class BetaTextEditorCodeExecutionToolResultBlockParam: …

content: Content

Accepts one of the following:

class BetaTextEditorCodeExecutionToolResultErrorParam: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

error\_message: Optional\[str\]

class BetaTextEditorCodeExecutionViewResultBlockParam: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

class BetaTextEditorCodeExecutionCreateResultBlockParam: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlockParam: …

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

tool\_use\_id: str

type: Literal\["text\_editor\_code\_execution\_tool\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaTextEditorCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: Optional\[str\]

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

class BetaTextEditorCodeExecutionToolResultErrorParam: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

error\_message: Optional\[str\]

class BetaTextEditorCodeExecutionViewResultBlock: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

class BetaTextEditorCodeExecutionViewResultBlockParam: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

class BetaThinkingBlock: …

signature: str

thinking: str

type: Literal\["thinking"\]

Accepts one of the following:

"thinking"

class BetaThinkingBlockParam: …

signature: str

thinking: str

type: Literal\["thinking"\]

Accepts one of the following:

"thinking"

class BetaThinkingConfigDisabled: …

type: Literal\["disabled"\]

Accepts one of the following:

"disabled"

class BetaThinkingConfigEnabled: …

budget\_tokens: int

Determines how many tokens Claude can use for its internal reasoning process. Larger budgets can enable more thorough analysis for complex problems, improving response quality.

Must be ≥1024 and less than `max_tokens`.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

minimum1024

type: Literal\["enabled"\]

Accepts one of the following:

"enabled"

BetaThinkingConfigParam = [BetaThinkingConfigParam](https://platform.claude.com/docs/en/api/beta#beta_thinking_config_param)

Configuration for enabling Claude's extended thinking.

When enabled, responses include `thinking` content blocks showing Claude's thinking process before the final answer. Requires a minimum budget of 1,024 tokens and counts towards your `max_tokens` limit.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

Accepts one of the following:

class BetaThinkingConfigEnabled: …

budget\_tokens: int

Determines how many tokens Claude can use for its internal reasoning process. Larger budgets can enable more thorough analysis for complex problems, improving response quality.

Must be ≥1024 and less than `max_tokens`.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

minimum1024

type: Literal\["enabled"\]

Accepts one of the following:

"enabled"

class BetaThinkingConfigDisabled: …

type: Literal\["disabled"\]

Accepts one of the following:

"disabled"

class BetaThinkingDelta: …

thinking: str

type: Literal\["thinking\_delta"\]

Accepts one of the following:

"thinking\_delta"

class BetaThinkingTurns: …

type: Literal\["thinking\_turns"\]

Accepts one of the following:

"thinking\_turns"

value: int

class BetaTool: …

input\_schema: InputSchema

[JSON schema](https://json-schema.org/draft/2020-12) for this tool's input.

This defines the shape of the `input` that your tool accepts and that the model will produce.

type: Literal\["object"\]

Accepts one of the following:

"object"

properties: Optional\[Dict\[str, object\]\]

required: Optional\[List\[str\]\]

name: str

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

maxLength128

minLength1

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

description: Optional\[str\]

Description of what this tool does.

Tool descriptions should be as detailed as possible. The more information that the model has about what the tool is and how to use it, the better it will perform. You can use natural language descriptions to reinforce important aspects of the tool input JSON schema.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

type: Optional\[Literal\["custom"\]\]

Accepts one of the following:

"custom"

class BetaToolBash20241022: …

name: Literal\["bash"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: Literal\["bash\_20241022"\]

Accepts one of the following:

"bash\_20241022"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaToolBash20250124: …

name: Literal\["bash"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: Literal\["bash\_20250124"\]

Accepts one of the following:

"bash\_20250124"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

BetaToolChoice = [BetaToolChoice](https://platform.claude.com/docs/en/api/beta#beta_tool_choice)

How the model should use the provided tools. The model can use a specific tool, any available tool, decide by itself, or not use tools at all.

Accepts one of the following:

class BetaToolChoiceAuto: …

The model will automatically decide whether to use tools.

type: Literal\["auto"\]

Accepts one of the following:

"auto"

disable\_parallel\_tool\_use: Optional\[bool\]

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output at most one tool use.

class BetaToolChoiceAny: …

The model will use any available tools.

type: Literal\["any"\]

Accepts one of the following:

"any"

disable\_parallel\_tool\_use: Optional\[bool\]

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

class BetaToolChoiceTool: …

The model will use the specified tool with `tool_choice.name`.

name: str

The name of the tool to use.

type: Literal\["tool"\]

Accepts one of the following:

"tool"

disable\_parallel\_tool\_use: Optional\[bool\]

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

class BetaToolChoiceNone: …

The model will not be allowed to use tools.

type: Literal\["none"\]

Accepts one of the following:

"none"

class BetaToolChoiceAny: …

The model will use any available tools.

type: Literal\["any"\]

Accepts one of the following:

"any"

disable\_parallel\_tool\_use: Optional\[bool\]

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

class BetaToolChoiceAuto: …

The model will automatically decide whether to use tools.

type: Literal\["auto"\]

Accepts one of the following:

"auto"

disable\_parallel\_tool\_use: Optional\[bool\]

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output at most one tool use.

class BetaToolChoiceNone: …

The model will not be allowed to use tools.

type: Literal\["none"\]

Accepts one of the following:

"none"

class BetaToolChoiceTool: …

The model will use the specified tool with `tool_choice.name`.

name: str

The name of the tool to use.

type: Literal\["tool"\]

Accepts one of the following:

"tool"

disable\_parallel\_tool\_use: Optional\[bool\]

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

class BetaToolComputerUse20241022: …

display\_height\_px: int

The height of the display in pixels.

minimum1

display\_width\_px: int

The width of the display in pixels.

minimum1

name: Literal\["computer"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"computer"

type: Literal\["computer\_20241022"\]

Accepts one of the following:

"computer\_20241022"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number: Optional\[int\]

The X11 display number (e.g. 0, 1) for the display.

minimum0

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaToolComputerUse20250124: …

display\_height\_px: int

The height of the display in pixels.

minimum1

display\_width\_px: int

The width of the display in pixels.

minimum1

name: Literal\["computer"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"computer"

type: Literal\["computer\_20250124"\]

Accepts one of the following:

"computer\_20250124"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number: Optional\[int\]

The X11 display number (e.g. 0, 1) for the display.

minimum0

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaToolComputerUse20251124: …

display\_height\_px: int

The height of the display in pixels.

minimum1

display\_width\_px: int

The width of the display in pixels.

minimum1

name: Literal\["computer"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"computer"

type: Literal\["computer\_20251124"\]

Accepts one of the following:

"computer\_20251124"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number: Optional\[int\]

The X11 display number (e.g. 0, 1) for the display.

minimum0

enable\_zoom: Optional\[bool\]

Whether to enable an action to take a zoomed-in screenshot of the screen.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaToolReferenceBlock: …

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

class BetaToolReferenceBlockParam: …

Tool reference block that can be included in tool\_result content.

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaToolResultBlockParam: …

tool\_use\_id: str

type: Literal\["tool\_result"\]

Accepts one of the following:

"tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

content: Optional\[Union\[str, List\[Content\], null\]\]

Accepts one of the following:

ContentUnionMember0 = str

Content = List\[Content\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaSearchResultBlockParam: …

content: List\[[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)\]

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

source: str

title: str

type: Literal\["search\_result"\]

Accepts one of the following:

"search\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

class BetaRequestDocumentBlock: …

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaContentBlockSource: …

content: Union\[str, List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaContentBlockSourceContent = List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["content"\]

Accepts one of the following:

"content"

class BetaURLPDFSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileDocumentSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["document"\]

Accepts one of the following:

"document"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

context: Optional\[str\]

title: Optional\[str\]

class BetaToolReferenceBlockParam: …

Tool reference block that can be included in tool\_result content.

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

is\_error: Optional\[bool\]

class BetaToolSearchToolBm25\_20251119: …

name: Literal\["tool\_search\_tool\_bm25"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"tool\_search\_tool\_bm25"

type: Literal\["tool\_search\_tool\_bm25\_20251119", "tool\_search\_tool\_bm25"\]

Accepts one of the following:

"tool\_search\_tool\_bm25\_20251119"

"tool\_search\_tool\_bm25"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict: Optional\[bool\]

class BetaToolSearchToolRegex20251119: …

name: Literal\["tool\_search\_tool\_regex"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"tool\_search\_tool\_regex"

type: Literal\["tool\_search\_tool\_regex\_20251119", "tool\_search\_tool\_regex"\]

Accepts one of the following:

"tool\_search\_tool\_regex\_20251119"

"tool\_search\_tool\_regex"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict: Optional\[bool\]

class BetaToolSearchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaToolSearchToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: Optional\[str\]

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolSearchResultBlock: …

tool\_references: List\[[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: str

type: Literal\["tool\_search\_tool\_result"\]

Accepts one of the following:

"tool\_search\_tool\_result"

class BetaToolSearchToolResultBlockParam: …

content: Content

Accepts one of the following:

class BetaToolSearchToolResultErrorParam: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolSearchResultBlockParam: …

tool\_references: List\[[BetaToolReferenceBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block_param)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: str

type: Literal\["tool\_search\_tool\_result"\]

Accepts one of the following:

"tool\_search\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaToolSearchToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: Optional\[str\]

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolResultErrorParam: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolSearchResultBlock: …

tool\_references: List\[[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

class BetaToolSearchToolSearchResultBlockParam: …

tool\_references: List\[[BetaToolReferenceBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block_param)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

class BetaToolTextEditor20241022: …

name: Literal\["str\_replace\_editor"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: Literal\["text\_editor\_20241022"\]

Accepts one of the following:

"text\_editor\_20241022"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaToolTextEditor20250124: …

name: Literal\["str\_replace\_editor"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: Literal\["text\_editor\_20250124"\]

Accepts one of the following:

"text\_editor\_20250124"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaToolTextEditor20250429: …

name: Literal\["str\_replace\_based\_edit\_tool"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: Literal\["text\_editor\_20250429"\]

Accepts one of the following:

"text\_editor\_20250429"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaToolTextEditor20250728: …

name: Literal\["str\_replace\_based\_edit\_tool"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: Literal\["text\_editor\_20250728"\]

Accepts one of the following:

"text\_editor\_20250728"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

max\_characters: Optional\[int\]

Maximum number of characters to display when viewing a file. If not specified, defaults to displaying the full file.

minimum1

strict: Optional\[bool\]

BetaToolUnion = [BetaToolUnion](https://platform.claude.com/docs/en/api/beta#beta_tool_union)

Configuration for a group of tools from an MCP server.

Allows configuring enabled status and defer\_loading for all tools
from an MCP server, with optional per-tool overrides.

Accepts one of the following:

class BetaTool: …

input\_schema: InputSchema

[JSON schema](https://json-schema.org/draft/2020-12) for this tool's input.

This defines the shape of the `input` that your tool accepts and that the model will produce.

type: Literal\["object"\]

Accepts one of the following:

"object"

properties: Optional\[Dict\[str, object\]\]

required: Optional\[List\[str\]\]

name: str

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

maxLength128

minLength1

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

description: Optional\[str\]

Description of what this tool does.

Tool descriptions should be as detailed as possible. The more information that the model has about what the tool is and how to use it, the better it will perform. You can use natural language descriptions to reinforce important aspects of the tool input JSON schema.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

type: Optional\[Literal\["custom"\]\]

Accepts one of the following:

"custom"

class BetaToolBash20241022: …

name: Literal\["bash"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: Literal\["bash\_20241022"\]

Accepts one of the following:

"bash\_20241022"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaToolBash20250124: …

name: Literal\["bash"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: Literal\["bash\_20250124"\]

Accepts one of the following:

"bash\_20250124"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaCodeExecutionTool20250522: …

name: Literal\["code\_execution"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"code\_execution"

type: Literal\["code\_execution\_20250522"\]

Accepts one of the following:

"code\_execution\_20250522"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict: Optional\[bool\]

class BetaCodeExecutionTool20250825: …

name: Literal\["code\_execution"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"code\_execution"

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict: Optional\[bool\]

class BetaToolComputerUse20241022: …

display\_height\_px: int

The height of the display in pixels.

minimum1

display\_width\_px: int

The width of the display in pixels.

minimum1

name: Literal\["computer"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"computer"

type: Literal\["computer\_20241022"\]

Accepts one of the following:

"computer\_20241022"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number: Optional\[int\]

The X11 display number (e.g. 0, 1) for the display.

minimum0

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaMemoryTool20250818: …

name: Literal\["memory"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"memory"

type: Literal\["memory\_20250818"\]

Accepts one of the following:

"memory\_20250818"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaToolComputerUse20250124: …

display\_height\_px: int

The height of the display in pixels.

minimum1

display\_width\_px: int

The width of the display in pixels.

minimum1

name: Literal\["computer"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"computer"

type: Literal\["computer\_20250124"\]

Accepts one of the following:

"computer\_20250124"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number: Optional\[int\]

The X11 display number (e.g. 0, 1) for the display.

minimum0

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaToolTextEditor20241022: …

name: Literal\["str\_replace\_editor"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: Literal\["text\_editor\_20241022"\]

Accepts one of the following:

"text\_editor\_20241022"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaToolComputerUse20251124: …

display\_height\_px: int

The height of the display in pixels.

minimum1

display\_width\_px: int

The width of the display in pixels.

minimum1

name: Literal\["computer"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"computer"

type: Literal\["computer\_20251124"\]

Accepts one of the following:

"computer\_20251124"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number: Optional\[int\]

The X11 display number (e.g. 0, 1) for the display.

minimum0

enable\_zoom: Optional\[bool\]

Whether to enable an action to take a zoomed-in screenshot of the screen.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaToolTextEditor20250124: …

name: Literal\["str\_replace\_editor"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: Literal\["text\_editor\_20250124"\]

Accepts one of the following:

"text\_editor\_20250124"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaToolTextEditor20250429: …

name: Literal\["str\_replace\_based\_edit\_tool"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: Literal\["text\_editor\_20250429"\]

Accepts one of the following:

"text\_editor\_20250429"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

strict: Optional\[bool\]

class BetaToolTextEditor20250728: …

name: Literal\["str\_replace\_based\_edit\_tool"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: Literal\["text\_editor\_20250728"\]

Accepts one of the following:

"text\_editor\_20250728"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: Optional\[List\[Dict\[str, object\]\]\]

max\_characters: Optional\[int\]

Maximum number of characters to display when viewing a file. If not specified, defaults to displaying the full file.

minimum1

strict: Optional\[bool\]

class BetaWebSearchTool20250305: …

name: Literal\["web\_search"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_search"

type: Literal\["web\_search\_20250305"\]

Accepts one of the following:

"web\_search\_20250305"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

allowed\_domains: Optional\[List\[str\]\]

If provided, only these domains will be included in results. Cannot be used alongside `blocked_domains`.

blocked\_domains: Optional\[List\[str\]\]

If provided, these domains will never appear in results. Cannot be used alongside `allowed_domains`.

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

max\_uses: Optional\[int\]

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

strict: Optional\[bool\]

user\_location: Optional\[UserLocation\]

Parameters for the user's location. Used to provide more relevant search results.

type: Literal\["approximate"\]

Accepts one of the following:

"approximate"

city: Optional\[str\]

The city of the user.

maxLength255

minLength1

country: Optional\[str\]

The two letter [ISO country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) of the user.

maxLength2

minLength2

region: Optional\[str\]

The region of the user.

maxLength255

minLength1

timezone: Optional\[str\]

The [IANA timezone](https://nodatime.org/TimeZones) of the user.

maxLength255

minLength1

class BetaWebFetchTool20250910: …

name: Literal\["web\_fetch"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_fetch"

type: Literal\["web\_fetch\_20250910"\]

Accepts one of the following:

"web\_fetch\_20250910"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

allowed\_domains: Optional\[List\[str\]\]

List of domains to allow fetching from

blocked\_domains: Optional\[List\[str\]\]

List of domains to block fetching from

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

Citations configuration for fetched documents. Citations are disabled by default.

enabled: Optional\[bool\]

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

max\_content\_tokens: Optional\[int\]

Maximum number of tokens used by including web page text content in the context. The limit is approximate and does not apply to binary content such as PDFs.

exclusiveMinimum0

max\_uses: Optional\[int\]

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

strict: Optional\[bool\]

class BetaToolSearchToolBm25\_20251119: …

name: Literal\["tool\_search\_tool\_bm25"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"tool\_search\_tool\_bm25"

type: Literal\["tool\_search\_tool\_bm25\_20251119", "tool\_search\_tool\_bm25"\]

Accepts one of the following:

"tool\_search\_tool\_bm25\_20251119"

"tool\_search\_tool\_bm25"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict: Optional\[bool\]

class BetaToolSearchToolRegex20251119: …

name: Literal\["tool\_search\_tool\_regex"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"tool\_search\_tool\_regex"

type: Literal\["tool\_search\_tool\_regex\_20251119", "tool\_search\_tool\_regex"\]

Accepts one of the following:

"tool\_search\_tool\_regex\_20251119"

"tool\_search\_tool\_regex"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict: Optional\[bool\]

class BetaMCPToolset: …

Configuration for a group of tools from an MCP server.

Allows configuring enabled status and defer\_loading for all tools
from an MCP server, with optional per-tool overrides.

mcp\_server\_name: str

Name of the MCP server to configure tools for

maxLength255

minLength1

type: Literal\["mcp\_toolset"\]

Accepts one of the following:

"mcp\_toolset"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

configs: Optional\[Dict\[str, [BetaMCPToolConfig](https://platform.claude.com/docs/en/api/beta#beta_mcp_tool_config)\]\]

Configuration overrides for specific tools, keyed by tool name

defer\_loading: Optional\[bool\]

enabled: Optional\[bool\]

default\_config: Optional\[BetaMCPToolDefaultConfig\]

Default configuration applied to all tools from this server

defer\_loading: Optional\[bool\]

enabled: Optional\[bool\]

class BetaToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

type: Literal\["tool\_use"\]

Accepts one of the following:

"tool\_use"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaToolUseBlockParam: …

id: str

input: Dict\[str, object\]

name: str

type: Literal\["tool\_use"\]

Accepts one of the following:

"tool\_use"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaToolUsesKeep: …

type: Literal\["tool\_uses"\]

Accepts one of the following:

"tool\_uses"

value: int

class BetaToolUsesTrigger: …

type: Literal\["tool\_uses"\]

Accepts one of the following:

"tool\_uses"

value: int

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaURLPDFSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaUsage: …

cache\_creation: Optional\[BetaCacheCreation\]

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: int

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: int

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: Optional\[int\]

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: Optional\[int\]

The number of input tokens read from the cache.

minimum0

input\_tokens: int

The number of input tokens which were used.

minimum0

output\_tokens: int

The number of output tokens which were used.

minimum0

server\_tool\_use: Optional\[BetaServerToolUsage\]

The number of server tool requests.

web\_fetch\_requests: int

The number of web fetch tool requests.

minimum0

web\_search\_requests: int

The number of web search tool requests.

minimum0

service\_tier: Optional\[Literal\["standard", "priority", "batch"\]\]

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

class BetaWebFetchBlock: …

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)

citations: Optional\[BetaCitationConfig\]

Citation configuration for the document

enabled: bool

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

title: Optional\[str\]

The title of the document

type: Literal\["document"\]

Accepts one of the following:

"document"

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

class BetaWebFetchBlockParam: …

content: [BetaRequestDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_request_document_block)

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaContentBlockSource: …

content: Union\[str, List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaContentBlockSourceContent = List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["content"\]

Accepts one of the following:

"content"

class BetaURLPDFSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileDocumentSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["document"\]

Accepts one of the following:

"document"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

context: Optional\[str\]

title: Optional\[str\]

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

class BetaWebFetchTool20250910: …

name: Literal\["web\_fetch"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_fetch"

type: Literal\["web\_fetch\_20250910"\]

Accepts one of the following:

"web\_fetch\_20250910"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

allowed\_domains: Optional\[List\[str\]\]

List of domains to allow fetching from

blocked\_domains: Optional\[List\[str\]\]

List of domains to block fetching from

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

Citations configuration for fetched documents. Citations are disabled by default.

enabled: Optional\[bool\]

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

max\_content\_tokens: Optional\[int\]

Maximum number of tokens used by including web page text content in the context. The limit is approximate and does not apply to binary content such as PDFs.

exclusiveMinimum0

max\_uses: Optional\[int\]

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

strict: Optional\[bool\]

class BetaWebFetchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaWebFetchToolResultErrorBlock: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

class BetaWebFetchBlock: …

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)

citations: Optional\[BetaCitationConfig\]

Citation configuration for the document

enabled: bool

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

title: Optional\[str\]

The title of the document

type: Literal\["document"\]

Accepts one of the following:

"document"

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

tool\_use\_id: str

type: Literal\["web\_fetch\_tool\_result"\]

Accepts one of the following:

"web\_fetch\_tool\_result"

class BetaWebFetchToolResultBlockParam: …

content: Content

Accepts one of the following:

class BetaWebFetchToolResultErrorBlockParam: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

class BetaWebFetchBlockParam: …

content: [BetaRequestDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_request_document_block)

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaContentBlockSource: …

content: Union\[str, List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaContentBlockSourceContent = List\[[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)\]

Accepts one of the following:

class BetaTextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[List\[[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)\]\]

Accepts one of the following:

class BetaCitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class BetaImageBlockParam: …

source: Source

Accepts one of the following:

class BetaBase64ImageSource: …

data: str

media\_type: Literal\["image/jpeg", "image/png", "image/gif", "image/webp"\]

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaURLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileImageSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: Literal\["content"\]

Accepts one of the following:

"content"

class BetaURLPDFSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

class BetaFileDocumentSource: …

file\_id: str

type: Literal\["file"\]

Accepts one of the following:

"file"

type: Literal\["document"\]

Accepts one of the following:

"document"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: Optional\[BetaCitationsConfigParam\]

enabled: Optional\[bool\]

context: Optional\[str\]

title: Optional\[str\]

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

tool\_use\_id: str

type: Literal\["web\_fetch\_tool\_result"\]

Accepts one of the following:

"web\_fetch\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

class BetaWebFetchToolResultErrorBlock: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

class BetaWebFetchToolResultErrorBlockParam: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchToolResultErrorCode = Literal\["invalid\_tool\_input", "url\_too\_long", "url\_not\_allowed", 5 more\]

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

class BetaWebSearchResultBlock: …

encrypted\_content: str

page\_age: Optional\[str\]

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

class BetaWebSearchResultBlockParam: …

encrypted\_content: str

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

page\_age: Optional\[str\]

class BetaWebSearchTool20250305: …

name: Literal\["web\_search"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_search"

type: Literal\["web\_search\_20250305"\]

Accepts one of the following:

"web\_search\_20250305"

allowed\_callers: Optional\[List\[Literal\["direct", "code\_execution\_20250825"\]\]\]

Accepts one of the following:

"direct"

"code\_execution\_20250825"

allowed\_domains: Optional\[List\[str\]\]

If provided, only these domains will be included in results. Cannot be used alongside `blocked_domains`.

blocked\_domains: Optional\[List\[str\]\]

If provided, these domains will never appear in results. Cannot be used alongside `allowed_domains`.

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: Optional\[bool\]

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

max\_uses: Optional\[int\]

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

strict: Optional\[bool\]

user\_location: Optional\[UserLocation\]

Parameters for the user's location. Used to provide more relevant search results.

type: Literal\["approximate"\]

Accepts one of the following:

"approximate"

city: Optional\[str\]

The city of the user.

maxLength255

minLength1

country: Optional\[str\]

The two letter [ISO country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) of the user.

maxLength2

minLength2

region: Optional\[str\]

The region of the user.

maxLength255

minLength1

timezone: Optional\[str\]

The [IANA timezone](https://nodatime.org/TimeZones) of the user.

maxLength255

minLength1

class BetaWebSearchToolRequestError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

class BetaWebSearchToolResultBlock: …

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

class BetaWebSearchToolResultError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = List\[[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)\]

encrypted\_content: str

page\_age: Optional\[str\]

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

tool\_use\_id: str

type: Literal\["web\_search\_tool\_result"\]

Accepts one of the following:

"web\_search\_tool\_result"

BetaWebSearchToolResultBlockContent = [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

class BetaWebSearchToolResultError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = List\[[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)\]

encrypted\_content: str

page\_age: Optional\[str\]

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

class BetaWebSearchToolResultBlockParam: …

content: [BetaWebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_param_content)

Accepts one of the following:

ResultBlock = List\[[BetaWebSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block_param)\]

encrypted\_content: str

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

page\_age: Optional\[str\]

class BetaWebSearchToolRequestError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

tool\_use\_id: str

type: Literal\["web\_search\_tool\_result"\]

Accepts one of the following:

"web\_search\_tool\_result"

cache\_control: Optional\[BetaCacheControlEphemeral\]

Create a cache control breakpoint at this content block.

type: Literal\["ephemeral"\]

Accepts one of the following:

"ephemeral"

ttl: Optional\[Literal\["5m", "1h"\]\]

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaWebSearchToolResultBlockParamContent = [BetaWebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_param_content)

Accepts one of the following:

ResultBlock = List\[[BetaWebSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block_param)\]

encrypted\_content: str

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

page\_age: Optional\[str\]

class BetaWebSearchToolRequestError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

class BetaWebSearchToolResultError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

BetaWebSearchToolResultErrorCode = Literal\["invalid\_tool\_input", "unavailable", "max\_uses\_exceeded", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

#### MessagesBatches

##### [Create a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/create)

beta.messages.batches.create(BatchCreateParams\*\*kwargs) -\> [BetaMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_message_batch)

post/v1/messages/batches

##### [Retrieve a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/retrieve)

beta.messages.batches.retrieve(strmessage\_batch\_id, BatchRetrieveParams\*\*kwargs) -\> [BetaMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_message_batch)

get/v1/messages/batches/{message\_batch\_id}

##### [List Message Batches](https://platform.claude.com/docs/en/api/beta/messages/batches/list)

beta.messages.batches.list(BatchListParams\*\*kwargs) -\> SyncPage\[[BetaMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_message_batch)\]

get/v1/messages/batches

##### [Cancel a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/cancel)

beta.messages.batches.cancel(strmessage\_batch\_id, BatchCancelParams\*\*kwargs) -\> [BetaMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_message_batch)

post/v1/messages/batches/{message\_batch\_id}/cancel

##### [Delete a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/delete)

beta.messages.batches.delete(strmessage\_batch\_id, BatchDeleteParams\*\*kwargs) -\> [BetaDeletedMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_deleted_message_batch)

delete/v1/messages/batches/{message\_batch\_id}

##### [Retrieve Message Batch results](https://platform.claude.com/docs/en/api/beta/messages/batches/results)

beta.messages.batches.results(strmessage\_batch\_id, BatchResultsParams\*\*kwargs) -\> [BetaMessageBatchIndividualResponse](https://platform.claude.com/docs/en/api/beta#beta_message_batch_individual_response)

get/v1/messages/batches/{message\_batch\_id}/results

##### ModelsExpand Collapse

class BetaDeletedMessageBatch: …

id: str

ID of the Message Batch.

type: Literal\["message\_batch\_deleted"\]

Deleted object type.

For Message Batches, this is always `"message_batch_deleted"`.

Accepts one of the following:

"message\_batch\_deleted"

class BetaMessageBatch: …

id: str

Unique object identifier.

The format and length of IDs may change over time.

archived\_at: Optional\[datetime\]

RFC 3339 datetime string representing the time at which the Message Batch was archived and its results became unavailable.

formatdate-time

cancel\_initiated\_at: Optional\[datetime\]

RFC 3339 datetime string representing the time at which cancellation was initiated for the Message Batch. Specified only if cancellation was initiated.

formatdate-time

created\_at: datetime

RFC 3339 datetime string representing the time at which the Message Batch was created.

formatdate-time

ended\_at: Optional\[datetime\]

RFC 3339 datetime string representing the time at which processing for the Message Batch ended. Specified only once processing ends.

Processing ends when every request in a Message Batch has either succeeded, errored, canceled, or expired.

formatdate-time

expires\_at: datetime

RFC 3339 datetime string representing the time at which the Message Batch will expire and end processing, which is 24 hours after creation.

formatdate-time

processing\_status: Literal\["in\_progress", "canceling", "ended"\]

Processing status of the Message Batch.

Accepts one of the following:

"in\_progress"

"canceling"

"ended"

request\_counts: [BetaMessageBatchRequestCounts](https://platform.claude.com/docs/en/api/beta#beta_message_batch_request_counts)

Tallies requests within the Message Batch, categorized by their status.

Requests start as `processing` and move to one of the other statuses only once processing of the entire batch ends. The sum of all values always matches the total number of requests in the batch.

canceled: int

Number of requests in the Message Batch that have been canceled.

This is zero until processing of the entire Message Batch has ended.

errored: int

Number of requests in the Message Batch that encountered an error.

This is zero until processing of the entire Message Batch has ended.

expired: int

Number of requests in the Message Batch that have expired.

This is zero until processing of the entire Message Batch has ended.

processing: int

Number of requests in the Message Batch that are processing.

succeeded: int

Number of requests in the Message Batch that have completed successfully.

This is zero until processing of the entire Message Batch has ended.

results\_url: Optional\[str\]

URL to a `.jsonl` file containing the results of the Message Batch requests. Specified only once processing ends.

Results in the file are not guaranteed to be in the same order as requests. Use the `custom_id` field to match results to requests.

type: Literal\["message\_batch"\]

Object type.

For Message Batches, this is always `"message_batch"`.

Accepts one of the following:

"message\_batch"

class BetaMessageBatchCanceledResult: …

type: Literal\["canceled"\]

Accepts one of the following:

"canceled"

class BetaMessageBatchErroredResult: …

error: [BetaErrorResponse](https://platform.claude.com/docs/en/api/beta#beta_error_response)

error: [BetaError](https://platform.claude.com/docs/en/api/beta#beta_error)

Accepts one of the following:

class BetaInvalidRequestError: …

message: str

type: Literal\["invalid\_request\_error"\]

Accepts one of the following:

"invalid\_request\_error"

class BetaAuthenticationError: …

message: str

type: Literal\["authentication\_error"\]

Accepts one of the following:

"authentication\_error"

class BetaBillingError: …

message: str

type: Literal\["billing\_error"\]

Accepts one of the following:

"billing\_error"

class BetaPermissionError: …

message: str

type: Literal\["permission\_error"\]

Accepts one of the following:

"permission\_error"

class BetaNotFoundError: …

message: str

type: Literal\["not\_found\_error"\]

Accepts one of the following:

"not\_found\_error"

class BetaRateLimitError: …

message: str

type: Literal\["rate\_limit\_error"\]

Accepts one of the following:

"rate\_limit\_error"

class BetaGatewayTimeoutError: …

message: str

type: Literal\["timeout\_error"\]

Accepts one of the following:

"timeout\_error"

class BetaAPIError: …

message: str

type: Literal\["api\_error"\]

Accepts one of the following:

"api\_error"

class BetaOverloadedError: …

message: str

type: Literal\["overloaded\_error"\]

Accepts one of the following:

"overloaded\_error"

request\_id: Optional\[str\]

type: Literal\["error"\]

Accepts one of the following:

"error"

type: Literal\["errored"\]

Accepts one of the following:

"errored"

class BetaMessageBatchExpiredResult: …

type: Literal\["expired"\]

Accepts one of the following:

"expired"

class BetaMessageBatchIndividualResponse: …

This is a single line in the response `.jsonl` file and does not represent the response as a whole.

custom\_id: str

Developer-provided ID created for each request in a Message Batch. Useful for matching results to requests, as results may be given out of request order.

Must be unique for each request within the Message Batch.

result: [BetaMessageBatchResult](https://platform.claude.com/docs/en/api/beta#beta_message_batch_result)

Processing result for this request.

Contains a Message output if processing was successful, an error response if processing failed, or the reason why processing was not attempted, such as cancellation or expiration.

Accepts one of the following:

class BetaMessageBatchSucceededResult: …

message: [BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message)

id: str

Unique object identifier.

The format and length of IDs may change over time.

container: Optional\[BetaContainer\]

Information about the container used in the request (for the code execution tool)

id: str

Identifier for the container used in this request

expires\_at: datetime

The time at which the container will expire.

formatdate-time

skills: Optional\[List\[[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)\]\]

Skills loaded in the container

skill\_id: str

Skill ID

maxLength64

minLength1

type: Literal\["anthropic", "custom"\]

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: str

Skill version or 'latest' for most recent version

maxLength64

minLength1

content: List\[[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)\]

Content generated by the model.

This is an array of content blocks, each of which has a `type` that determines its shape.

Example:

```
[{"type": "text", "text": "Hi, I'm Claude."}]
```

If the request input `messages` ended with an `assistant` turn, then the response `content` will continue directly from that last turn. You can use this to constrain the model's output.

For example, if the input `messages` were:

```
[\
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},\
  {"role": "assistant", "content": "The best answer is ("}\
]
```

Then the response `content` might be:

```
[{"type": "text", "text": "B)"}]
```

Accepts one of the following:

class BetaTextBlock: …

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaThinkingBlock: …

signature: str

thinking: str

type: Literal\["thinking"\]

Accepts one of the following:

"thinking"

class BetaRedactedThinkingBlock: …

data: str

type: Literal\["redacted\_thinking"\]

Accepts one of the following:

"redacted\_thinking"

class BetaToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

type: Literal\["tool\_use"\]

Accepts one of the following:

"tool\_use"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaServerToolUseBlock: …

id: str

caller: Caller

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

input: Dict\[str, object\]

name: Literal\["web\_search", "web\_fetch", "code\_execution", 4 more\]

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: Literal\["server\_tool\_use"\]

Accepts one of the following:

"server\_tool\_use"

class BetaWebSearchToolResultBlock: …

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

class BetaWebSearchToolResultError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = List\[[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)\]

encrypted\_content: str

page\_age: Optional\[str\]

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

tool\_use\_id: str

type: Literal\["web\_search\_tool\_result"\]

Accepts one of the following:

"web\_search\_tool\_result"

class BetaWebFetchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaWebFetchToolResultErrorBlock: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

class BetaWebFetchBlock: …

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)

citations: Optional\[BetaCitationConfig\]

Citation configuration for the document

enabled: bool

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

title: Optional\[str\]

The title of the document

type: Literal\["document"\]

Accepts one of the following:

"document"

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

tool\_use\_id: str

type: Literal\["web\_fetch\_tool\_result"\]

Accepts one of the following:

"web\_fetch\_tool\_result"

class BetaCodeExecutionToolResultBlock: …

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

class BetaCodeExecutionToolResultError: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlock: …

content: List\[[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: str

type: Literal\["code\_execution\_tool\_result"\]

Accepts one of the following:

"code\_execution\_tool\_result"

class BetaBashCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaBashCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaBashCodeExecutionResultBlock: …

content: List\[[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: str

type: Literal\["bash\_code\_execution\_tool\_result"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

class BetaTextEditorCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaTextEditorCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: Optional\[str\]

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

class BetaTextEditorCodeExecutionViewResultBlock: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

class BetaTextEditorCodeExecutionCreateResultBlock: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlock: …

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: str

type: Literal\["text\_editor\_code\_execution\_tool\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

class BetaToolSearchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaToolSearchToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: Optional\[str\]

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolSearchResultBlock: …

tool\_references: List\[[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: str

type: Literal\["tool\_search\_tool\_result"\]

Accepts one of the following:

"tool\_search\_tool\_result"

class BetaMCPToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

The name of the MCP tool

server\_name: str

The name of the MCP server

type: Literal\["mcp\_tool\_use"\]

Accepts one of the following:

"mcp\_tool\_use"

class BetaMCPToolResultBlock: …

content: Union\[str, List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaMCPToolResultBlockContent = List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

is\_error: bool

tool\_use\_id: str

type: Literal\["mcp\_tool\_result"\]

Accepts one of the following:

"mcp\_tool\_result"

class BetaContainerUploadBlock: …

Response model for a file uploaded to the container.

file\_id: str

type: Literal\["container\_upload"\]

Accepts one of the following:

"container\_upload"

context\_management: Optional\[BetaContextManagementResponse\]

Context management response.

Information about context management strategies applied during the request.

applied\_edits: List\[AppliedEdit\]

List of context management edits that were applied.

Accepts one of the following:

class BetaClearToolUses20250919EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: int

Number of tool uses that were cleared.

minimum0

type: Literal\["clear\_tool\_uses\_20250919"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

class BetaClearThinking20251015EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: int

Number of thinking turns that were cleared.

minimum0

type: Literal\["clear\_thinking\_20251015"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

model: [Model](https://platform.claude.com/docs/en/api/messages#model)

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

UnionMember0 = Literal\["claude-opus-4-5-20251101", "claude-opus-4-5", "claude-3-7-sonnet-latest", 17 more\]

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

- `claude-opus-4-5-20251101` \- Premium model combining maximum intelligence with practical performance
- `claude-opus-4-5` \- Premium model combining maximum intelligence with practical performance
- `claude-3-7-sonnet-latest` \- Deprecated: Will reach end-of-life on February 19th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-7-sonnet-20250219` \- Deprecated: Will reach end-of-life on February 19th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-5-haiku-latest` \- Fastest and most compact model for near-instant responsiveness
- `claude-3-5-haiku-20241022` \- Our fastest model
- `claude-haiku-4-5` \- Hybrid model, capable of near-instant responses and extended thinking
- `claude-haiku-4-5-20251001` \- Hybrid model, capable of near-instant responses and extended thinking
- `claude-sonnet-4-20250514` \- High-performance model with extended thinking
- `claude-sonnet-4-0` \- High-performance model with extended thinking
- `claude-4-sonnet-20250514` \- High-performance model with extended thinking
- `claude-sonnet-4-5` \- Our best model for real-world agents and coding
- `claude-sonnet-4-5-20250929` \- Our best model for real-world agents and coding
- `claude-opus-4-0` \- Our most capable model
- `claude-opus-4-20250514` \- Our most capable model
- `claude-4-opus-20250514` \- Our most capable model
- `claude-opus-4-1-20250805` \- Our most capable model
- `claude-3-opus-latest` \- Deprecated: Will reach end-of-life on January 5th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-opus-20240229` \- Deprecated: Will reach end-of-life on January 5th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-haiku-20240307` \- Our previous most fast and cost-effective

Accepts one of the following:

"claude-opus-4-5-20251101"

Premium model combining maximum intelligence with practical performance

"claude-opus-4-5"

Premium model combining maximum intelligence with practical performance

"claude-3-7-sonnet-latest"

High-performance model with early extended thinking

"claude-3-7-sonnet-20250219"

High-performance model with early extended thinking

"claude-3-5-haiku-latest"

Fastest and most compact model for near-instant responsiveness

"claude-3-5-haiku-20241022"

Our fastest model

"claude-haiku-4-5"

Hybrid model, capable of near-instant responses and extended thinking

"claude-haiku-4-5-20251001"

Hybrid model, capable of near-instant responses and extended thinking

"claude-sonnet-4-20250514"

High-performance model with extended thinking

"claude-sonnet-4-0"

High-performance model with extended thinking

"claude-4-sonnet-20250514"

High-performance model with extended thinking

"claude-sonnet-4-5"

Our best model for real-world agents and coding

"claude-sonnet-4-5-20250929"

Our best model for real-world agents and coding

"claude-opus-4-0"

Our most capable model

"claude-opus-4-20250514"

Our most capable model

"claude-4-opus-20250514"

Our most capable model

"claude-opus-4-1-20250805"

Our most capable model

"claude-3-opus-latest"

Excels at writing and complex tasks

"claude-3-opus-20240229"

Excels at writing and complex tasks

"claude-3-haiku-20240307"

Our previous most fast and cost-effective

UnionMember1 = str

role: Literal\["assistant"\]

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: Optional\[BetaStopReason\]

The reason that we stopped.

This may be one the following values:

- `"end_turn"`: the model reached a natural stopping point
- `"max_tokens"`: we exceeded the requested `max_tokens` or the model's maximum
- `"stop_sequence"`: one of your provided custom `stop_sequences` was generated
- `"tool_use"`: the model invoked one or more tools
- `"pause_turn"`: we paused a long-running turn. You may provide the response back as-is in a subsequent request to let the model continue.
- `"refusal"`: when streaming classifiers intervene to handle potential policy violations

In non-streaming mode this value is always non-null. In streaming mode, it is null in the `message_start` event and non-null otherwise.

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

"model\_context\_window\_exceeded"

stop\_sequence: Optional\[str\]

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: Literal\["message"\]

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage)

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: Optional\[BetaCacheCreation\]

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: int

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: int

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: Optional\[int\]

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: Optional\[int\]

The number of input tokens read from the cache.

minimum0

input\_tokens: int

The number of input tokens which were used.

minimum0

output\_tokens: int

The number of output tokens which were used.

minimum0

server\_tool\_use: Optional\[BetaServerToolUsage\]

The number of server tool requests.

web\_fetch\_requests: int

The number of web fetch tool requests.

minimum0

web\_search\_requests: int

The number of web search tool requests.

minimum0

service\_tier: Optional\[Literal\["standard", "priority", "batch"\]\]

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

type: Literal\["succeeded"\]

Accepts one of the following:

"succeeded"

class BetaMessageBatchErroredResult: …

error: [BetaErrorResponse](https://platform.claude.com/docs/en/api/beta#beta_error_response)

error: [BetaError](https://platform.claude.com/docs/en/api/beta#beta_error)

Accepts one of the following:

class BetaInvalidRequestError: …

message: str

type: Literal\["invalid\_request\_error"\]

Accepts one of the following:

"invalid\_request\_error"

class BetaAuthenticationError: …

message: str

type: Literal\["authentication\_error"\]

Accepts one of the following:

"authentication\_error"

class BetaBillingError: …

message: str

type: Literal\["billing\_error"\]

Accepts one of the following:

"billing\_error"

class BetaPermissionError: …

message: str

type: Literal\["permission\_error"\]

Accepts one of the following:

"permission\_error"

class BetaNotFoundError: …

message: str

type: Literal\["not\_found\_error"\]

Accepts one of the following:

"not\_found\_error"

class BetaRateLimitError: …

message: str

type: Literal\["rate\_limit\_error"\]

Accepts one of the following:

"rate\_limit\_error"

class BetaGatewayTimeoutError: …

message: str

type: Literal\["timeout\_error"\]

Accepts one of the following:

"timeout\_error"

class BetaAPIError: …

message: str

type: Literal\["api\_error"\]

Accepts one of the following:

"api\_error"

class BetaOverloadedError: …

message: str

type: Literal\["overloaded\_error"\]

Accepts one of the following:

"overloaded\_error"

request\_id: Optional\[str\]

type: Literal\["error"\]

Accepts one of the following:

"error"

type: Literal\["errored"\]

Accepts one of the following:

"errored"

class BetaMessageBatchCanceledResult: …

type: Literal\["canceled"\]

Accepts one of the following:

"canceled"

class BetaMessageBatchExpiredResult: …

type: Literal\["expired"\]

Accepts one of the following:

"expired"

class BetaMessageBatchRequestCounts: …

canceled: int

Number of requests in the Message Batch that have been canceled.

This is zero until processing of the entire Message Batch has ended.

errored: int

Number of requests in the Message Batch that encountered an error.

This is zero until processing of the entire Message Batch has ended.

expired: int

Number of requests in the Message Batch that have expired.

This is zero until processing of the entire Message Batch has ended.

processing: int

Number of requests in the Message Batch that are processing.

succeeded: int

Number of requests in the Message Batch that have completed successfully.

This is zero until processing of the entire Message Batch has ended.

BetaMessageBatchResult = [BetaMessageBatchResult](https://platform.claude.com/docs/en/api/beta#beta_message_batch_result)

Processing result for this request.

Contains a Message output if processing was successful, an error response if processing failed, or the reason why processing was not attempted, such as cancellation or expiration.

Accepts one of the following:

class BetaMessageBatchSucceededResult: …

message: [BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message)

id: str

Unique object identifier.

The format and length of IDs may change over time.

container: Optional\[BetaContainer\]

Information about the container used in the request (for the code execution tool)

id: str

Identifier for the container used in this request

expires\_at: datetime

The time at which the container will expire.

formatdate-time

skills: Optional\[List\[[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)\]\]

Skills loaded in the container

skill\_id: str

Skill ID

maxLength64

minLength1

type: Literal\["anthropic", "custom"\]

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: str

Skill version or 'latest' for most recent version

maxLength64

minLength1

content: List\[[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)\]

Content generated by the model.

This is an array of content blocks, each of which has a `type` that determines its shape.

Example:

```
[{"type": "text", "text": "Hi, I'm Claude."}]
```

If the request input `messages` ended with an `assistant` turn, then the response `content` will continue directly from that last turn. You can use this to constrain the model's output.

For example, if the input `messages` were:

```
[\
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},\
  {"role": "assistant", "content": "The best answer is ("}\
]
```

Then the response `content` might be:

```
[{"type": "text", "text": "B)"}]
```

Accepts one of the following:

class BetaTextBlock: …

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaThinkingBlock: …

signature: str

thinking: str

type: Literal\["thinking"\]

Accepts one of the following:

"thinking"

class BetaRedactedThinkingBlock: …

data: str

type: Literal\["redacted\_thinking"\]

Accepts one of the following:

"redacted\_thinking"

class BetaToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

type: Literal\["tool\_use"\]

Accepts one of the following:

"tool\_use"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaServerToolUseBlock: …

id: str

caller: Caller

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

input: Dict\[str, object\]

name: Literal\["web\_search", "web\_fetch", "code\_execution", 4 more\]

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: Literal\["server\_tool\_use"\]

Accepts one of the following:

"server\_tool\_use"

class BetaWebSearchToolResultBlock: …

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

class BetaWebSearchToolResultError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = List\[[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)\]

encrypted\_content: str

page\_age: Optional\[str\]

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

tool\_use\_id: str

type: Literal\["web\_search\_tool\_result"\]

Accepts one of the following:

"web\_search\_tool\_result"

class BetaWebFetchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaWebFetchToolResultErrorBlock: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

class BetaWebFetchBlock: …

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)

citations: Optional\[BetaCitationConfig\]

Citation configuration for the document

enabled: bool

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

title: Optional\[str\]

The title of the document

type: Literal\["document"\]

Accepts one of the following:

"document"

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

tool\_use\_id: str

type: Literal\["web\_fetch\_tool\_result"\]

Accepts one of the following:

"web\_fetch\_tool\_result"

class BetaCodeExecutionToolResultBlock: …

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

class BetaCodeExecutionToolResultError: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlock: …

content: List\[[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: str

type: Literal\["code\_execution\_tool\_result"\]

Accepts one of the following:

"code\_execution\_tool\_result"

class BetaBashCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaBashCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaBashCodeExecutionResultBlock: …

content: List\[[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: str

type: Literal\["bash\_code\_execution\_tool\_result"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

class BetaTextEditorCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaTextEditorCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: Optional\[str\]

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

class BetaTextEditorCodeExecutionViewResultBlock: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

class BetaTextEditorCodeExecutionCreateResultBlock: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlock: …

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: str

type: Literal\["text\_editor\_code\_execution\_tool\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

class BetaToolSearchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaToolSearchToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: Optional\[str\]

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolSearchResultBlock: …

tool\_references: List\[[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: str

type: Literal\["tool\_search\_tool\_result"\]

Accepts one of the following:

"tool\_search\_tool\_result"

class BetaMCPToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

The name of the MCP tool

server\_name: str

The name of the MCP server

type: Literal\["mcp\_tool\_use"\]

Accepts one of the following:

"mcp\_tool\_use"

class BetaMCPToolResultBlock: …

content: Union\[str, List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaMCPToolResultBlockContent = List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

is\_error: bool

tool\_use\_id: str

type: Literal\["mcp\_tool\_result"\]

Accepts one of the following:

"mcp\_tool\_result"

class BetaContainerUploadBlock: …

Response model for a file uploaded to the container.

file\_id: str

type: Literal\["container\_upload"\]

Accepts one of the following:

"container\_upload"

context\_management: Optional\[BetaContextManagementResponse\]

Context management response.

Information about context management strategies applied during the request.

applied\_edits: List\[AppliedEdit\]

List of context management edits that were applied.

Accepts one of the following:

class BetaClearToolUses20250919EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: int

Number of tool uses that were cleared.

minimum0

type: Literal\["clear\_tool\_uses\_20250919"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

class BetaClearThinking20251015EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: int

Number of thinking turns that were cleared.

minimum0

type: Literal\["clear\_thinking\_20251015"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

model: [Model](https://platform.claude.com/docs/en/api/messages#model)

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

UnionMember0 = Literal\["claude-opus-4-5-20251101", "claude-opus-4-5", "claude-3-7-sonnet-latest", 17 more\]

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

- `claude-opus-4-5-20251101` \- Premium model combining maximum intelligence with practical performance
- `claude-opus-4-5` \- Premium model combining maximum intelligence with practical performance
- `claude-3-7-sonnet-latest` \- Deprecated: Will reach end-of-life on February 19th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-7-sonnet-20250219` \- Deprecated: Will reach end-of-life on February 19th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-5-haiku-latest` \- Fastest and most compact model for near-instant responsiveness
- `claude-3-5-haiku-20241022` \- Our fastest model
- `claude-haiku-4-5` \- Hybrid model, capable of near-instant responses and extended thinking
- `claude-haiku-4-5-20251001` \- Hybrid model, capable of near-instant responses and extended thinking
- `claude-sonnet-4-20250514` \- High-performance model with extended thinking
- `claude-sonnet-4-0` \- High-performance model with extended thinking
- `claude-4-sonnet-20250514` \- High-performance model with extended thinking
- `claude-sonnet-4-5` \- Our best model for real-world agents and coding
- `claude-sonnet-4-5-20250929` \- Our best model for real-world agents and coding
- `claude-opus-4-0` \- Our most capable model
- `claude-opus-4-20250514` \- Our most capable model
- `claude-4-opus-20250514` \- Our most capable model
- `claude-opus-4-1-20250805` \- Our most capable model
- `claude-3-opus-latest` \- Deprecated: Will reach end-of-life on January 5th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-opus-20240229` \- Deprecated: Will reach end-of-life on January 5th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-haiku-20240307` \- Our previous most fast and cost-effective

Accepts one of the following:

"claude-opus-4-5-20251101"

Premium model combining maximum intelligence with practical performance

"claude-opus-4-5"

Premium model combining maximum intelligence with practical performance

"claude-3-7-sonnet-latest"

High-performance model with early extended thinking

"claude-3-7-sonnet-20250219"

High-performance model with early extended thinking

"claude-3-5-haiku-latest"

Fastest and most compact model for near-instant responsiveness

"claude-3-5-haiku-20241022"

Our fastest model

"claude-haiku-4-5"

Hybrid model, capable of near-instant responses and extended thinking

"claude-haiku-4-5-20251001"

Hybrid model, capable of near-instant responses and extended thinking

"claude-sonnet-4-20250514"

High-performance model with extended thinking

"claude-sonnet-4-0"

High-performance model with extended thinking

"claude-4-sonnet-20250514"

High-performance model with extended thinking

"claude-sonnet-4-5"

Our best model for real-world agents and coding

"claude-sonnet-4-5-20250929"

Our best model for real-world agents and coding

"claude-opus-4-0"

Our most capable model

"claude-opus-4-20250514"

Our most capable model

"claude-4-opus-20250514"

Our most capable model

"claude-opus-4-1-20250805"

Our most capable model

"claude-3-opus-latest"

Excels at writing and complex tasks

"claude-3-opus-20240229"

Excels at writing and complex tasks

"claude-3-haiku-20240307"

Our previous most fast and cost-effective

UnionMember1 = str

role: Literal\["assistant"\]

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: Optional\[BetaStopReason\]

The reason that we stopped.

This may be one the following values:

- `"end_turn"`: the model reached a natural stopping point
- `"max_tokens"`: we exceeded the requested `max_tokens` or the model's maximum
- `"stop_sequence"`: one of your provided custom `stop_sequences` was generated
- `"tool_use"`: the model invoked one or more tools
- `"pause_turn"`: we paused a long-running turn. You may provide the response back as-is in a subsequent request to let the model continue.
- `"refusal"`: when streaming classifiers intervene to handle potential policy violations

In non-streaming mode this value is always non-null. In streaming mode, it is null in the `message_start` event and non-null otherwise.

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

"model\_context\_window\_exceeded"

stop\_sequence: Optional\[str\]

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: Literal\["message"\]

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage)

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: Optional\[BetaCacheCreation\]

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: int

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: int

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: Optional\[int\]

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: Optional\[int\]

The number of input tokens read from the cache.

minimum0

input\_tokens: int

The number of input tokens which were used.

minimum0

output\_tokens: int

The number of output tokens which were used.

minimum0

server\_tool\_use: Optional\[BetaServerToolUsage\]

The number of server tool requests.

web\_fetch\_requests: int

The number of web fetch tool requests.

minimum0

web\_search\_requests: int

The number of web search tool requests.

minimum0

service\_tier: Optional\[Literal\["standard", "priority", "batch"\]\]

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

type: Literal\["succeeded"\]

Accepts one of the following:

"succeeded"

class BetaMessageBatchErroredResult: …

error: [BetaErrorResponse](https://platform.claude.com/docs/en/api/beta#beta_error_response)

error: [BetaError](https://platform.claude.com/docs/en/api/beta#beta_error)

Accepts one of the following:

class BetaInvalidRequestError: …

message: str

type: Literal\["invalid\_request\_error"\]

Accepts one of the following:

"invalid\_request\_error"

class BetaAuthenticationError: …

message: str

type: Literal\["authentication\_error"\]

Accepts one of the following:

"authentication\_error"

class BetaBillingError: …

message: str

type: Literal\["billing\_error"\]

Accepts one of the following:

"billing\_error"

class BetaPermissionError: …

message: str

type: Literal\["permission\_error"\]

Accepts one of the following:

"permission\_error"

class BetaNotFoundError: …

message: str

type: Literal\["not\_found\_error"\]

Accepts one of the following:

"not\_found\_error"

class BetaRateLimitError: …

message: str

type: Literal\["rate\_limit\_error"\]

Accepts one of the following:

"rate\_limit\_error"

class BetaGatewayTimeoutError: …

message: str

type: Literal\["timeout\_error"\]

Accepts one of the following:

"timeout\_error"

class BetaAPIError: …

message: str

type: Literal\["api\_error"\]

Accepts one of the following:

"api\_error"

class BetaOverloadedError: …

message: str

type: Literal\["overloaded\_error"\]

Accepts one of the following:

"overloaded\_error"

request\_id: Optional\[str\]

type: Literal\["error"\]

Accepts one of the following:

"error"

type: Literal\["errored"\]

Accepts one of the following:

"errored"

class BetaMessageBatchCanceledResult: …

type: Literal\["canceled"\]

Accepts one of the following:

"canceled"

class BetaMessageBatchExpiredResult: …

type: Literal\["expired"\]

Accepts one of the following:

"expired"

class BetaMessageBatchSucceededResult: …

message: [BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message)

id: str

Unique object identifier.

The format and length of IDs may change over time.

container: Optional\[BetaContainer\]

Information about the container used in the request (for the code execution tool)

id: str

Identifier for the container used in this request

expires\_at: datetime

The time at which the container will expire.

formatdate-time

skills: Optional\[List\[[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)\]\]

Skills loaded in the container

skill\_id: str

Skill ID

maxLength64

minLength1

type: Literal\["anthropic", "custom"\]

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: str

Skill version or 'latest' for most recent version

maxLength64

minLength1

content: List\[[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)\]

Content generated by the model.

This is an array of content blocks, each of which has a `type` that determines its shape.

Example:

```
[{"type": "text", "text": "Hi, I'm Claude."}]
```

If the request input `messages` ended with an `assistant` turn, then the response `content` will continue directly from that last turn. You can use this to constrain the model's output.

For example, if the input `messages` were:

```
[\
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},\
  {"role": "assistant", "content": "The best answer is ("}\
]
```

Then the response `content` might be:

```
[{"type": "text", "text": "B)"}]
```

Accepts one of the following:

class BetaTextBlock: …

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

class BetaThinkingBlock: …

signature: str

thinking: str

type: Literal\["thinking"\]

Accepts one of the following:

"thinking"

class BetaRedactedThinkingBlock: …

data: str

type: Literal\["redacted\_thinking"\]

Accepts one of the following:

"redacted\_thinking"

class BetaToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

type: Literal\["tool\_use"\]

Accepts one of the following:

"tool\_use"

caller: Optional\[Caller\]

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

class BetaServerToolUseBlock: …

id: str

caller: Caller

Tool invocation directly from the model.

Accepts one of the following:

class BetaDirectCaller: …

Tool invocation directly from the model.

type: Literal\["direct"\]

Accepts one of the following:

"direct"

class BetaServerToolCaller: …

Tool invocation generated by a server-side tool.

tool\_id: str

type: Literal\["code\_execution\_20250825"\]

Accepts one of the following:

"code\_execution\_20250825"

input: Dict\[str, object\]

name: Literal\["web\_search", "web\_fetch", "code\_execution", 4 more\]

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: Literal\["server\_tool\_use"\]

Accepts one of the following:

"server\_tool\_use"

class BetaWebSearchToolResultBlock: …

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

class BetaWebSearchToolResultError: …

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: Literal\["web\_search\_tool\_result\_error"\]

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = List\[[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)\]

encrypted\_content: str

page\_age: Optional\[str\]

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

tool\_use\_id: str

type: Literal\["web\_search\_tool\_result"\]

Accepts one of the following:

"web\_search\_tool\_result"

class BetaWebFetchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaWebFetchToolResultErrorBlock: …

error\_code: [BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

type: Literal\["web\_fetch\_tool\_result\_error"\]

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

class BetaWebFetchBlock: …

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)

citations: Optional\[BetaCitationConfig\]

Citation configuration for the document

enabled: bool

source: Source

Accepts one of the following:

class BetaBase64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class BetaPlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

title: Optional\[str\]

The title of the document

type: Literal\["document"\]

Accepts one of the following:

"document"

retrieved\_at: Optional\[str\]

ISO 8601 timestamp when the content was retrieved

type: Literal\["web\_fetch\_result"\]

Accepts one of the following:

"web\_fetch\_result"

url: str

Fetched content URL

tool\_use\_id: str

type: Literal\["web\_fetch\_tool\_result"\]

Accepts one of the following:

"web\_fetch\_tool\_result"

class BetaCodeExecutionToolResultBlock: …

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

class BetaCodeExecutionToolResultError: …

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: Literal\["code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"code\_execution\_tool\_result\_error"

class BetaCodeExecutionResultBlock: …

content: List\[[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)\]

file\_id: str

type: Literal\["code\_execution\_output"\]

Accepts one of the following:

"code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["code\_execution\_result"\]

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: str

type: Literal\["code\_execution\_tool\_result"\]

Accepts one of the following:

"code\_execution\_tool\_result"

class BetaBashCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaBashCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: Literal\["bash\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

class BetaBashCodeExecutionResultBlock: …

content: List\[[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)\]

file\_id: str

type: Literal\["bash\_code\_execution\_output"\]

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: int

stderr: str

stdout: str

type: Literal\["bash\_code\_execution\_result"\]

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: str

type: Literal\["bash\_code\_execution\_tool\_result"\]

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

class BetaTextEditorCodeExecutionToolResultBlock: …

content: Content

Accepts one of the following:

class BetaTextEditorCodeExecutionToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", 2 more\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: Optional\[str\]

type: Literal\["text\_editor\_code\_execution\_tool\_result\_error"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

class BetaTextEditorCodeExecutionViewResultBlock: …

content: str

file\_type: Literal\["text", "image", "pdf"\]

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: Optional\[int\]

start\_line: Optional\[int\]

total\_lines: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_view\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

class BetaTextEditorCodeExecutionCreateResultBlock: …

is\_file\_update: bool

type: Literal\["text\_editor\_code\_execution\_create\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

class BetaTextEditorCodeExecutionStrReplaceResultBlock: …

lines: Optional\[List\[str\]\]

new\_lines: Optional\[int\]

new\_start: Optional\[int\]

old\_lines: Optional\[int\]

old\_start: Optional\[int\]

type: Literal\["text\_editor\_code\_execution\_str\_replace\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: str

type: Literal\["text\_editor\_code\_execution\_tool\_result"\]

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

class BetaToolSearchToolResultBlock: …

content: Content

Accepts one of the following:

class BetaToolSearchToolResultError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "too\_many\_requests", "execution\_time\_exceeded"\]

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: Optional\[str\]

type: Literal\["tool\_search\_tool\_result\_error"\]

Accepts one of the following:

"tool\_search\_tool\_result\_error"

class BetaToolSearchToolSearchResultBlock: …

tool\_references: List\[[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)\]

tool\_name: str

type: Literal\["tool\_reference"\]

Accepts one of the following:

"tool\_reference"

type: Literal\["tool\_search\_tool\_search\_result"\]

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: str

type: Literal\["tool\_search\_tool\_result"\]

Accepts one of the following:

"tool\_search\_tool\_result"

class BetaMCPToolUseBlock: …

id: str

input: Dict\[str, object\]

name: str

The name of the MCP tool

server\_name: str

The name of the MCP server

type: Literal\["mcp\_tool\_use"\]

Accepts one of the following:

"mcp\_tool\_use"

class BetaMCPToolResultBlock: …

content: Union\[str, List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentBetaMCPToolResultBlockContent = List\[[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)\]

citations: Optional\[List\[[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)\]\]

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

class BetaCitationCharLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

file\_id: Optional\[str\]

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class BetaCitationPageLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

file\_id: Optional\[str\]

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class BetaCitationContentBlockLocation: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

file\_id: Optional\[str\]

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class BetaCitationsWebSearchResultLocation: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class BetaCitationSearchResultLocation: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

is\_error: bool

tool\_use\_id: str

type: Literal\["mcp\_tool\_result"\]

Accepts one of the following:

"mcp\_tool\_result"

class BetaContainerUploadBlock: …

Response model for a file uploaded to the container.

file\_id: str

type: Literal\["container\_upload"\]

Accepts one of the following:

"container\_upload"

context\_management: Optional\[BetaContextManagementResponse\]

Context management response.

Information about context management strategies applied during the request.

applied\_edits: List\[AppliedEdit\]

List of context management edits that were applied.

Accepts one of the following:

class BetaClearToolUses20250919EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: int

Number of tool uses that were cleared.

minimum0

type: Literal\["clear\_tool\_uses\_20250919"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

class BetaClearThinking20251015EditResponse: …

cleared\_input\_tokens: int

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: int

Number of thinking turns that were cleared.

minimum0

type: Literal\["clear\_thinking\_20251015"\]

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

model: [Model](https://platform.claude.com/docs/en/api/messages#model)

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

UnionMember0 = Literal\["claude-opus-4-5-20251101", "claude-opus-4-5", "claude-3-7-sonnet-latest", 17 more\]

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

- `claude-opus-4-5-20251101` \- Premium model combining maximum intelligence with practical performance
- `claude-opus-4-5` \- Premium model combining maximum intelligence with practical performance
- `claude-3-7-sonnet-latest` \- Deprecated: Will reach end-of-life on February 19th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-7-sonnet-20250219` \- Deprecated: Will reach end-of-life on February 19th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-5-haiku-latest` \- Fastest and most compact model for near-instant responsiveness
- `claude-3-5-haiku-20241022` \- Our fastest model
- `claude-haiku-4-5` \- Hybrid model, capable of near-instant responses and extended thinking
- `claude-haiku-4-5-20251001` \- Hybrid model, capable of near-instant responses and extended thinking
- `claude-sonnet-4-20250514` \- High-performance model with extended thinking
- `claude-sonnet-4-0` \- High-performance model with extended thinking
- `claude-4-sonnet-20250514` \- High-performance model with extended thinking
- `claude-sonnet-4-5` \- Our best model for real-world agents and coding
- `claude-sonnet-4-5-20250929` \- Our best model for real-world agents and coding
- `claude-opus-4-0` \- Our most capable model
- `claude-opus-4-20250514` \- Our most capable model
- `claude-4-opus-20250514` \- Our most capable model
- `claude-opus-4-1-20250805` \- Our most capable model
- `claude-3-opus-latest` \- Deprecated: Will reach end-of-life on January 5th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-opus-20240229` \- Deprecated: Will reach end-of-life on January 5th, 2026. Please migrate to a newer model. Visit [https://docs.anthropic.com/en/docs/resources/model-deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations) for more information.
- `claude-3-haiku-20240307` \- Our previous most fast and cost-effective

Accepts one of the following:

"claude-opus-4-5-20251101"

Premium model combining maximum intelligence with practical performance

"claude-opus-4-5"

Premium model combining maximum intelligence with practical performance

"claude-3-7-sonnet-latest"

High-performance model with early extended thinking

"claude-3-7-sonnet-20250219"

High-performance model with early extended thinking

"claude-3-5-haiku-latest"

Fastest and most compact model for near-instant responsiveness

"claude-3-5-haiku-20241022"

Our fastest model

"claude-haiku-4-5"

Hybrid model, capable of near-instant responses and extended thinking

"claude-haiku-4-5-20251001"

Hybrid model, capable of near-instant responses and extended thinking

"claude-sonnet-4-20250514"

High-performance model with extended thinking

"claude-sonnet-4-0"

High-performance model with extended thinking

"claude-4-sonnet-20250514"

High-performance model with extended thinking

"claude-sonnet-4-5"

Our best model for real-world agents and coding

"claude-sonnet-4-5-20250929"

Our best model for real-world agents and coding

"claude-opus-4-0"

Our most capable model

"claude-opus-4-20250514"

Our most capable model

"claude-4-opus-20250514"

Our most capable model

"claude-opus-4-1-20250805"

Our most capable model

"claude-3-opus-latest"

Excels at writing and complex tasks

"claude-3-opus-20240229"

Excels at writing and complex tasks

"claude-3-haiku-20240307"

Our previous most fast and cost-effective

UnionMember1 = str

role: Literal\["assistant"\]

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: Optional\[BetaStopReason\]

The reason that we stopped.

This may be one the following values:

- `"end_turn"`: the model reached a natural stopping point
- `"max_tokens"`: we exceeded the requested `max_tokens` or the model's maximum
- `"stop_sequence"`: one of your provided custom `stop_sequences` was generated
- `"tool_use"`: the model invoked one or more tools
- `"pause_turn"`: we paused a long-running turn. You may provide the response back as-is in a subsequent request to let the model continue.
- `"refusal"`: when streaming classifiers intervene to handle potential policy violations

In non-streaming mode this value is always non-null. In streaming mode, it is null in the `message_start` event and non-null otherwise.

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

"model\_context\_window\_exceeded"

stop\_sequence: Optional\[str\]

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: Literal\["message"\]

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage)

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: Optional\[BetaCacheCreation\]

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: int

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: int

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: Optional\[int\]

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: Optional\[int\]

The number of input tokens read from the cache.

minimum0

input\_tokens: int

The number of input tokens which were used.

minimum0

output\_tokens: int

The number of output tokens which were used.

minimum0

server\_tool\_use: Optional\[BetaServerToolUsage\]

The number of server tool requests.

web\_fetch\_requests: int

The number of web fetch tool requests.

minimum0

web\_search\_requests: int

The number of web search tool requests.

minimum0

service\_tier: Optional\[Literal\["standard", "priority", "batch"\]\]

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

type: Literal\["succeeded"\]

Accepts one of the following:

"succeeded"

[Claude Docs home page](https://platform.claude.com/docs)

[X (Twitter)](https://x.com/claudeai)[LinkedIn](https://www.linkedin.com/showcase/claude)[Instagram](https://instagram.com/claudeai)

### Solutions

- [AI agents](https://claude.com/solutions/agents)
- [Code modernization](https://claude.com/solutions/code-modernization)
- [Coding](https://claude.com/solutions/coding)
- [Customer support](https://claude.com/solutions/customer-support)
- [Education](https://claude.com/solutions/education)
- [Financial services](https://claude.com/solutions/financial-services)
- [Government](https://claude.com/solutions/government)
- [Life sciences](https://claude.com/solutions/life-sciences)

### Partners

- [Amazon Bedrock](https://claude.com/partners/amazon-bedrock)
- [Google Cloud's Vertex AI](https://claude.com/partners/google-cloud-vertex-ai)

### Learn

- [Blog](https://claude.com/blog)
- [Catalog](https://claude.ai/catalog/artifacts)
- [Courses](https://www.anthropic.com/learn)
- [Use cases](https://claude.com/resources/use-cases)
- [Connectors](https://claude.com/partners/mcp)
- [Customer stories](https://claude.com/customers)
- [Engineering at Anthropic](https://www.anthropic.com/engineering)
- [Events](https://www.anthropic.com/events)
- [Powered by Claude](https://claude.com/partners/powered-by-claude)
- [Service partners](https://claude.com/partners/services)
- [Startups program](https://claude.com/programs/startups)

### Company

- [Anthropic](https://www.anthropic.com/company)
- [Careers](https://www.anthropic.com/careers)
- [Economic Futures](https://www.anthropic.com/economic-futures)
- [Research](https://www.anthropic.com/research)
- [News](https://www.anthropic.com/news)
- [Responsible Scaling Policy](https://www.anthropic.com/news/announcing-our-updated-responsible-scaling-policy)
- [Security and compliance](https://trust.anthropic.com/)
- [Transparency](https://www.anthropic.com/transparency)

### Learn

- [Blog](https://claude.com/blog)
- [Catalog](https://claude.ai/catalog/artifacts)
- [Courses](https://www.anthropic.com/learn)
- [Use cases](https://claude.com/resources/use-cases)
- [Connectors](https://claude.com/partners/mcp)
- [Customer stories](https://claude.com/customers)
- [Engineering at Anthropic](https://www.anthropic.com/engineering)
- [Events](https://www.anthropic.com/events)
- [Powered by Claude](https://claude.com/partners/powered-by-claude)
- [Service partners](https://claude.com/partners/services)
- [Startups program](https://claude.com/programs/startups)

### Help and security

- [Availability](https://www.anthropic.com/supported-countries)
- [Status](https://status.anthropic.com/)
- [Support](https://support.claude.com/)
- [Discord](https://www.anthropic.com/discord)

### Terms and policies

- [Privacy policy](https://www.anthropic.com/legal/privacy)
- [Responsible disclosure policy](https://www.anthropic.com/responsible-disclosure-policy)
- [Terms of service: Commercial](https://www.anthropic.com/legal/commercial-terms)
- [Terms of service: Consumer](https://www.anthropic.com/legal/consumer-terms)
- [Usage policy](https://www.anthropic.com/legal/aup)

Ask Docs
![Chat avatar](https://platform.claude.com/docs/images/book-icon-light.svg)

a.claude.ai

# a.claude.ai is blocked

**a.claude.ai** refused to connect.

ERR\_BLOCKED\_BY\_RESPONSE

**a.claude.ai** refused to connect.

![](<Base64-Image-Removed>)![](<Base64-Image-Removed>)