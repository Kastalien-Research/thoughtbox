---
url: "https://platform.claude.com/docs/en/api/java/beta/messages"
title: "Messages - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Fjava%2Fbeta%2Fmessages)

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

Java

# Messages

##### [Create a Message](https://platform.claude.com/docs/en/api/beta/messages/create)

[BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message)beta().messages().create(MessageCreateParamsparams, RequestOptionsrequestOptions=RequestOptions.none())

post/v1/messages

##### [Count tokens in a Message](https://platform.claude.com/docs/en/api/beta/messages/count_tokens)

[BetaMessageTokensCount](https://platform.claude.com/docs/en/api/beta#beta_message_tokens_count)beta().messages().countTokens(MessageCountTokensParamsparams, RequestOptionsrequestOptions=RequestOptions.none())

post/v1/messages/count\_tokens

##### ModelsExpand Collapse

classBetaAllThinkingTurns:

JsonValue;type"all"constant"all"constant

Accepts one of the following:

ALL("all")

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaBashCodeExecutionOutputBlock:

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

classBetaBashCodeExecutionOutputBlockParam:

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

classBetaBashCodeExecutionResultBlock:

List<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

classBetaBashCodeExecutionResultBlockParam:

List<[BetaBashCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block_param)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

classBetaBashCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaBashCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaBashCodeExecutionResultBlock:

List<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

StringtoolUseId

JsonValue;type"bash\_code\_execution\_tool\_result"constant"bash\_code\_execution\_tool\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT("bash\_code\_execution\_tool\_result")

classBetaBashCodeExecutionToolResultBlockParam:

Contentcontent

Accepts one of the following:

classBetaBashCodeExecutionToolResultErrorParam:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaBashCodeExecutionResultBlockParam:

List<[BetaBashCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block_param)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

StringtoolUseId

JsonValue;type"bash\_code\_execution\_tool\_result"constant"bash\_code\_execution\_tool\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT("bash\_code\_execution\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaBashCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaBashCodeExecutionToolResultErrorParam:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaCacheControlEphemeral:

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaCacheCreation:

longephemeral1hInputTokens

The number of input tokens used to create the 1 hour cache entry.

minimum0

longephemeral5mInputTokens

The number of input tokens used to create the 5 minute cache entry.

minimum0

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationConfig:

booleanenabled

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationsConfigParam:

Optional<Boolean>enabled

classBetaCitationsDelta:

Citationcitation

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

JsonValue;type"citations\_delta"constant"citations\_delta"constant

Accepts one of the following:

CITATIONS\_DELTA("citations\_delta")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaClearThinking20251015Edit:

JsonValue;type"clear\_thinking\_20251015"constant"clear\_thinking\_20251015"constant

Accepts one of the following:

CLEAR\_THINKING\_20251015("clear\_thinking\_20251015")

Optional<Keep>keep

Number of most recent assistant turns to keep thinking blocks for. Older turns will have their thinking blocks removed.

Accepts one of the following:

classBetaThinkingTurns:

JsonValue;type"thinking\_turns"constant"thinking\_turns"constant

Accepts one of the following:

THINKING\_TURNS("thinking\_turns")

longvalue

classBetaAllThinkingTurns:

JsonValue;type"all"constant"all"constant

Accepts one of the following:

ALL("all")

JsonValue;

Accepts one of the following:

ALL("all")

classBetaClearThinking20251015EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedThinkingTurns

Number of thinking turns that were cleared.

minimum0

JsonValue;type"clear\_thinking\_20251015"constant"clear\_thinking\_20251015"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_THINKING\_20251015("clear\_thinking\_20251015")

classBetaClearToolUses20250919Edit:

JsonValue;type"clear\_tool\_uses\_20250919"constant"clear\_tool\_uses\_20250919"constant

Accepts one of the following:

CLEAR\_TOOL\_USES\_20250919("clear\_tool\_uses\_20250919")

Optional<[BetaInputTokensClearAtLeast](https://platform.claude.com/docs/en/api/beta#beta_input_tokens_clear_at_least)>clearAtLeast

Minimum number of tokens that must be cleared when triggered. Context will only be modified if at least this many tokens can be removed.

JsonValue;type"input\_tokens"constant"input\_tokens"constant

Accepts one of the following:

INPUT\_TOKENS("input\_tokens")

longvalue

Optional<ClearToolInputs>clearToolInputs

Whether to clear all tool inputs (bool) or specific tool inputs to clear (list)

Accepts one of the following:

boolean

List<String>

Optional<List<String>>excludeTools

Tool names whose uses are preserved from clearing

Optional<[BetaToolUsesKeep](https://platform.claude.com/docs/en/api/beta#beta_tool_uses_keep)>keep

Number of tool uses to retain in the conversation

JsonValue;type"tool\_uses"constant"tool\_uses"constant

Accepts one of the following:

TOOL\_USES("tool\_uses")

longvalue

Optional<Trigger>trigger

Condition that triggers the context management strategy

Accepts one of the following:

classBetaInputTokensTrigger:

JsonValue;type"input\_tokens"constant"input\_tokens"constant

Accepts one of the following:

INPUT\_TOKENS("input\_tokens")

longvalue

classBetaToolUsesTrigger:

JsonValue;type"tool\_uses"constant"tool\_uses"constant

Accepts one of the following:

TOOL\_USES("tool\_uses")

longvalue

classBetaClearToolUses20250919EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedToolUses

Number of tool uses that were cleared.

minimum0

JsonValue;type"clear\_tool\_uses\_20250919"constant"clear\_tool\_uses\_20250919"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_TOOL\_USES\_20250919("clear\_tool\_uses\_20250919")

classBetaCodeExecutionOutputBlock:

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

classBetaCodeExecutionOutputBlockParam:

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

classBetaCodeExecutionResultBlock:

List<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

classBetaCodeExecutionResultBlockParam:

List<[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

classBetaCodeExecutionTool20250522:

JsonValue;name"code\_execution"constant"code\_execution"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

CODE\_EXECUTION("code\_execution")

JsonValue;type"code\_execution\_20250522"constant"code\_execution\_20250522"constant

Accepts one of the following:

CODE\_EXECUTION\_20250522("code\_execution\_20250522")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Boolean>strict

classBetaCodeExecutionTool20250825:

JsonValue;name"code\_execution"constant"code\_execution"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

CODE\_EXECUTION("code\_execution")

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Boolean>strict

classBetaCodeExecutionToolResultBlock:

[BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)content

Accepts one of the following:

classBetaCodeExecutionToolResultError:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlock:

List<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

StringtoolUseId

JsonValue;type"code\_execution\_tool\_result"constant"code\_execution\_tool\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT("code\_execution\_tool\_result")

classBetaCodeExecutionToolResultBlockContent:A class that can be one of several variants.union

classBetaCodeExecutionToolResultError:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlock:

List<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

classBetaCodeExecutionToolResultBlockParam:

[BetaCodeExecutionToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_param_content)content

Accepts one of the following:

classBetaCodeExecutionToolResultErrorParam:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlockParam:

List<[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

StringtoolUseId

JsonValue;type"code\_execution\_tool\_result"constant"code\_execution\_tool\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT("code\_execution\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaCodeExecutionToolResultBlockParamContent:A class that can be one of several variants.union

classBetaCodeExecutionToolResultErrorParam:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlockParam:

List<[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

classBetaCodeExecutionToolResultError:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

enumBetaCodeExecutionToolResultErrorCode:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

classBetaCodeExecutionToolResultErrorParam:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaContainer:

Information about the container used in the request (for the code execution tool)

Stringid

Identifier for the container used in this request

LocalDateTimeexpiresAt

The time at which the container will expire.

formatdate-time

Optional<List<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)>>skills

Skills loaded in the container

StringskillId

Skill ID

maxLength64

minLength1

Typetype

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

ANTHROPIC("anthropic")

CUSTOM("custom")

Stringversion

Skill version or 'latest' for most recent version

maxLength64

minLength1

classBetaContainerParams:

Container parameters with skills to be loaded.

Optional<String>id

Container id

Optional<List<[BetaSkillParams](https://platform.claude.com/docs/en/api/beta#beta_skill_params)>>skills

List of skills to load in the container

StringskillId

Skill ID

maxLength64

minLength1

Typetype

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

ANTHROPIC("anthropic")

CUSTOM("custom")

Optional<String>version

Skill version or 'latest' for most recent version

maxLength64

minLength1

classBetaContainerUploadBlock:

Response model for a file uploaded to the container.

StringfileId

JsonValue;type"container\_upload"constant"container\_upload"constant

Accepts one of the following:

CONTAINER\_UPLOAD("container\_upload")

classBetaContainerUploadBlockParam:

A content block that represents a file to be uploaded to the container
Files uploaded via this block will be available in the container's input directory.

StringfileId

JsonValue;type"container\_upload"constant"container\_upload"constant

Accepts one of the following:

CONTAINER\_UPLOAD("container\_upload")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaContentBlock:A class that can be one of several variants.union

Response model for a file uploaded to the container.

classBetaTextBlock:

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaThinkingBlock:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classBetaRedactedThinkingBlock:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classBetaToolUseBlock:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaServerToolUseBlock:

Stringid

Callercaller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Inputinput

Namename

Accepts one of the following:

WEB\_SEARCH("web\_search")

WEB\_FETCH("web\_fetch")

CODE\_EXECUTION("code\_execution")

BASH\_CODE\_EXECUTION("bash\_code\_execution")

TEXT\_EDITOR\_CODE\_EXECUTION("text\_editor\_code\_execution")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

classBetaWebSearchToolResultBlock:

[BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)content

Accepts one of the following:

classBetaWebSearchToolResultError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

List<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)>

StringencryptedContent

Optional<String>pageAge

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

StringtoolUseId

JsonValue;type"web\_search\_tool\_result"constant"web\_search\_tool\_result"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT("web\_search\_tool\_result")

classBetaWebFetchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaWebFetchToolResultErrorBlock:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

classBetaWebFetchBlock:

[BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)content

Optional<[BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config)>citations

Citation configuration for the document

booleanenabled

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<String>title

The title of the document

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

StringtoolUseId

JsonValue;type"web\_fetch\_tool\_result"constant"web\_fetch\_tool\_result"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT("web\_fetch\_tool\_result")

classBetaCodeExecutionToolResultBlock:

[BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)content

Accepts one of the following:

classBetaCodeExecutionToolResultError:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlock:

List<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

StringtoolUseId

JsonValue;type"code\_execution\_tool\_result"constant"code\_execution\_tool\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT("code\_execution\_tool\_result")

classBetaBashCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaBashCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaBashCodeExecutionResultBlock:

List<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

StringtoolUseId

JsonValue;type"bash\_code\_execution\_tool\_result"constant"bash\_code\_execution\_tool\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT("bash\_code\_execution\_tool\_result")

classBetaTextEditorCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaTextEditorCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

Optional<String>errorMessage

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

classBetaTextEditorCodeExecutionViewResultBlock:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

classBetaTextEditorCodeExecutionCreateResultBlock:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlock:

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

StringtoolUseId

JsonValue;type"text\_editor\_code\_execution\_tool\_result"constant"text\_editor\_code\_execution\_tool\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT("text\_editor\_code\_execution\_tool\_result")

classBetaToolSearchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaToolSearchToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

Optional<String>errorMessage

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolSearchResultBlock:

List<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

StringtoolUseId

JsonValue;type"tool\_search\_tool\_result"constant"tool\_search\_tool\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT("tool\_search\_tool\_result")

classBetaMcpToolUseBlock:

Stringid

Inputinput

Stringname

The name of the MCP tool

StringserverName

The name of the MCP server

JsonValue;type"mcp\_tool\_use"constant"mcp\_tool\_use"constant

Accepts one of the following:

MCP\_TOOL\_USE("mcp\_tool\_use")

classBetaMcpToolResultBlock:

Contentcontent

Accepts one of the following:

String

List<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)>

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

booleanisError

StringtoolUseId

JsonValue;type"mcp\_tool\_result"constant"mcp\_tool\_result"constant

Accepts one of the following:

MCP\_TOOL\_RESULT("mcp\_tool\_result")

classBetaContainerUploadBlock:

Response model for a file uploaded to the container.

StringfileId

JsonValue;type"container\_upload"constant"container\_upload"constant

Accepts one of the following:

CONTAINER\_UPLOAD("container\_upload")

classBetaContentBlockParam:A class that can be one of several variants.union

Regular text content.

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaRequestDocumentBlock:

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaContentBlockSource:

Contentcontent

Accepts one of the following:

String

List<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"content"constant"content"constant

Accepts one of the following:

CONTENT("content")

classBetaUrlPdfSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileDocumentSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

Optional<String>context

Optional<String>title

classBetaSearchResultBlockParam:

List<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)>content

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringsource

Stringtitle

JsonValue;type"search\_result"constant"search\_result"constant

Accepts one of the following:

SEARCH\_RESULT("search\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

classBetaThinkingBlockParam:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classBetaRedactedThinkingBlockParam:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classBetaToolUseBlockParam:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaToolResultBlockParam:

StringtoolUseId

JsonValue;type"tool\_result"constant"tool\_result"constant

Accepts one of the following:

TOOL\_RESULT("tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Content>content

Accepts one of the following:

String

List<Block>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaSearchResultBlockParam:

List<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)>content

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringsource

Stringtitle

JsonValue;type"search\_result"constant"search\_result"constant

Accepts one of the following:

SEARCH\_RESULT("search\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

classBetaRequestDocumentBlock:

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaContentBlockSource:

Contentcontent

Accepts one of the following:

String

List<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"content"constant"content"constant

Accepts one of the following:

CONTENT("content")

classBetaUrlPdfSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileDocumentSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

Optional<String>context

Optional<String>title

classBetaToolReferenceBlockParam:

Tool reference block that can be included in tool\_result content.

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>isError

classBetaServerToolUseBlockParam:

Stringid

Inputinput

Namename

Accepts one of the following:

WEB\_SEARCH("web\_search")

WEB\_FETCH("web\_fetch")

CODE\_EXECUTION("code\_execution")

BASH\_CODE\_EXECUTION("bash\_code\_execution")

TEXT\_EDITOR\_CODE\_EXECUTION("text\_editor\_code\_execution")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaWebSearchToolResultBlockParam:

[BetaWebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_param_content)content

Accepts one of the following:

List<[BetaWebSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block_param)>

StringencryptedContent

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

Optional<String>pageAge

classBetaWebSearchToolRequestError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

StringtoolUseId

JsonValue;type"web\_search\_tool\_result"constant"web\_search\_tool\_result"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT("web\_search\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaWebFetchToolResultBlockParam:

Contentcontent

Accepts one of the following:

classBetaWebFetchToolResultErrorBlockParam:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

classBetaWebFetchBlockParam:

[BetaRequestDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_request_document_block)content

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaContentBlockSource:

Contentcontent

Accepts one of the following:

String

List<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"content"constant"content"constant

Accepts one of the following:

CONTENT("content")

classBetaUrlPdfSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileDocumentSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

Optional<String>context

Optional<String>title

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

StringtoolUseId

JsonValue;type"web\_fetch\_tool\_result"constant"web\_fetch\_tool\_result"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT("web\_fetch\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaCodeExecutionToolResultBlockParam:

[BetaCodeExecutionToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_param_content)content

Accepts one of the following:

classBetaCodeExecutionToolResultErrorParam:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlockParam:

List<[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

StringtoolUseId

JsonValue;type"code\_execution\_tool\_result"constant"code\_execution\_tool\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT("code\_execution\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaBashCodeExecutionToolResultBlockParam:

Contentcontent

Accepts one of the following:

classBetaBashCodeExecutionToolResultErrorParam:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaBashCodeExecutionResultBlockParam:

List<[BetaBashCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block_param)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

StringtoolUseId

JsonValue;type"bash\_code\_execution\_tool\_result"constant"bash\_code\_execution\_tool\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT("bash\_code\_execution\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaTextEditorCodeExecutionToolResultBlockParam:

Contentcontent

Accepts one of the following:

classBetaTextEditorCodeExecutionToolResultErrorParam:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

Optional<String>errorMessage

classBetaTextEditorCodeExecutionViewResultBlockParam:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

classBetaTextEditorCodeExecutionCreateResultBlockParam:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlockParam:

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

StringtoolUseId

JsonValue;type"text\_editor\_code\_execution\_tool\_result"constant"text\_editor\_code\_execution\_tool\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT("text\_editor\_code\_execution\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaToolSearchToolResultBlockParam:

Contentcontent

Accepts one of the following:

classBetaToolSearchToolResultErrorParam:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolSearchResultBlockParam:

List<[BetaToolReferenceBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block_param)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

StringtoolUseId

JsonValue;type"tool\_search\_tool\_result"constant"tool\_search\_tool\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT("tool\_search\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaMcpToolUseBlockParam:

Stringid

Inputinput

Stringname

StringserverName

The name of the MCP server

JsonValue;type"mcp\_tool\_use"constant"mcp\_tool\_use"constant

Accepts one of the following:

MCP\_TOOL\_USE("mcp\_tool\_use")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaRequestMcpToolResultBlockParam:

StringtoolUseId

JsonValue;type"mcp\_tool\_result"constant"mcp\_tool\_result"constant

Accepts one of the following:

MCP\_TOOL\_RESULT("mcp\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Content>content

Accepts one of the following:

String

List<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)>

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Optional<Boolean>isError

classBetaContainerUploadBlockParam:

A content block that represents a file to be uploaded to the container
Files uploaded via this block will be available in the container's input directory.

StringfileId

JsonValue;type"container\_upload"constant"container\_upload"constant

Accepts one of the following:

CONTAINER\_UPLOAD("container\_upload")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaContentBlockSource:

Contentcontent

Accepts one of the following:

String

List<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"content"constant"content"constant

Accepts one of the following:

CONTENT("content")

classBetaContentBlockSourceContent:A class that can be one of several variants.union

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaContextManagementConfig:

Optional<List<Edit>>edits

List of context management edits to apply

Accepts one of the following:

classBetaClearToolUses20250919Edit:

JsonValue;type"clear\_tool\_uses\_20250919"constant"clear\_tool\_uses\_20250919"constant

Accepts one of the following:

CLEAR\_TOOL\_USES\_20250919("clear\_tool\_uses\_20250919")

Optional<[BetaInputTokensClearAtLeast](https://platform.claude.com/docs/en/api/beta#beta_input_tokens_clear_at_least)>clearAtLeast

Minimum number of tokens that must be cleared when triggered. Context will only be modified if at least this many tokens can be removed.

JsonValue;type"input\_tokens"constant"input\_tokens"constant

Accepts one of the following:

INPUT\_TOKENS("input\_tokens")

longvalue

Optional<ClearToolInputs>clearToolInputs

Whether to clear all tool inputs (bool) or specific tool inputs to clear (list)

Accepts one of the following:

boolean

List<String>

Optional<List<String>>excludeTools

Tool names whose uses are preserved from clearing

Optional<[BetaToolUsesKeep](https://platform.claude.com/docs/en/api/beta#beta_tool_uses_keep)>keep

Number of tool uses to retain in the conversation

JsonValue;type"tool\_uses"constant"tool\_uses"constant

Accepts one of the following:

TOOL\_USES("tool\_uses")

longvalue

Optional<Trigger>trigger

Condition that triggers the context management strategy

Accepts one of the following:

classBetaInputTokensTrigger:

JsonValue;type"input\_tokens"constant"input\_tokens"constant

Accepts one of the following:

INPUT\_TOKENS("input\_tokens")

longvalue

classBetaToolUsesTrigger:

JsonValue;type"tool\_uses"constant"tool\_uses"constant

Accepts one of the following:

TOOL\_USES("tool\_uses")

longvalue

classBetaClearThinking20251015Edit:

JsonValue;type"clear\_thinking\_20251015"constant"clear\_thinking\_20251015"constant

Accepts one of the following:

CLEAR\_THINKING\_20251015("clear\_thinking\_20251015")

Optional<Keep>keep

Number of most recent assistant turns to keep thinking blocks for. Older turns will have their thinking blocks removed.

Accepts one of the following:

classBetaThinkingTurns:

JsonValue;type"thinking\_turns"constant"thinking\_turns"constant

Accepts one of the following:

THINKING\_TURNS("thinking\_turns")

longvalue

classBetaAllThinkingTurns:

JsonValue;type"all"constant"all"constant

Accepts one of the following:

ALL("all")

JsonValue;

Accepts one of the following:

ALL("all")

classBetaContextManagementResponse:

List<AppliedEdit>appliedEdits

List of context management edits that were applied.

Accepts one of the following:

classBetaClearToolUses20250919EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedToolUses

Number of tool uses that were cleared.

minimum0

JsonValue;type"clear\_tool\_uses\_20250919"constant"clear\_tool\_uses\_20250919"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_TOOL\_USES\_20250919("clear\_tool\_uses\_20250919")

classBetaClearThinking20251015EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedThinkingTurns

Number of thinking turns that were cleared.

minimum0

JsonValue;type"clear\_thinking\_20251015"constant"clear\_thinking\_20251015"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_THINKING\_20251015("clear\_thinking\_20251015")

classBetaCountTokensContextManagementResponse:

longoriginalInputTokens

The original token count before context management was applied

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaDocumentBlock:

Optional<[BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config)>citations

Citation configuration for the document

booleanenabled

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<String>title

The title of the document

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

classBetaFileDocumentSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaInputJsonDelta:

StringpartialJson

JsonValue;type"input\_json\_delta"constant"input\_json\_delta"constant

Accepts one of the following:

INPUT\_JSON\_DELTA("input\_json\_delta")

classBetaInputTokensClearAtLeast:

JsonValue;type"input\_tokens"constant"input\_tokens"constant

Accepts one of the following:

INPUT\_TOKENS("input\_tokens")

longvalue

classBetaInputTokensTrigger:

JsonValue;type"input\_tokens"constant"input\_tokens"constant

Accepts one of the following:

INPUT\_TOKENS("input\_tokens")

longvalue

classBetaJsonOutputFormat:

Schemaschema

The JSON schema of the format

JsonValue;type"json\_schema"constant"json\_schema"constant

Accepts one of the following:

JSON\_SCHEMA("json\_schema")

classBetaMcpToolConfig:

Configuration for a specific tool in an MCP toolset.

Optional<Boolean>deferLoading

Optional<Boolean>enabled

classBetaMcpToolDefaultConfig:

Default configuration for tools in an MCP toolset.

Optional<Boolean>deferLoading

Optional<Boolean>enabled

classBetaMcpToolResultBlock:

Contentcontent

Accepts one of the following:

String

List<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)>

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

booleanisError

StringtoolUseId

JsonValue;type"mcp\_tool\_result"constant"mcp\_tool\_result"constant

Accepts one of the following:

MCP\_TOOL\_RESULT("mcp\_tool\_result")

classBetaMcpToolUseBlock:

Stringid

Inputinput

Stringname

The name of the MCP tool

StringserverName

The name of the MCP server

JsonValue;type"mcp\_tool\_use"constant"mcp\_tool\_use"constant

Accepts one of the following:

MCP\_TOOL\_USE("mcp\_tool\_use")

classBetaMcpToolUseBlockParam:

Stringid

Inputinput

Stringname

StringserverName

The name of the MCP server

JsonValue;type"mcp\_tool\_use"constant"mcp\_tool\_use"constant

Accepts one of the following:

MCP\_TOOL\_USE("mcp\_tool\_use")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaMcpToolset:

Configuration for a group of tools from an MCP server.

Allows configuring enabled status and defer\_loading for all tools
from an MCP server, with optional per-tool overrides.

StringmcpServerName

Name of the MCP server to configure tools for

maxLength255

minLength1

JsonValue;type"mcp\_toolset"constant"mcp\_toolset"constant

Accepts one of the following:

MCP\_TOOLSET("mcp\_toolset")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Configs>configs

Configuration overrides for specific tools, keyed by tool name

Optional<Boolean>deferLoading

Optional<Boolean>enabled

Optional<[BetaMcpToolDefaultConfig](https://platform.claude.com/docs/en/api/beta#beta_mcp_tool_default_config)>defaultConfig

Default configuration applied to all tools from this server

Optional<Boolean>deferLoading

Optional<Boolean>enabled

classBetaMemoryTool20250818:

JsonValue;name"memory"constant"memory"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

MEMORY("memory")

JsonValue;type"memory\_20250818"constant"memory\_20250818"constant

Accepts one of the following:

MEMORY\_20250818("memory\_20250818")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaMemoryTool20250818Command:A class that can be one of several variants.union

classBetaMemoryTool20250818ViewCommand:

JsonValue;command"view"constant"view"constant

Command type identifier

Accepts one of the following:

VIEW("view")

Stringpath

Path to directory or file to view

Optional<List<Long>>viewRange

Optional line range for viewing specific lines

classBetaMemoryTool20250818CreateCommand:

JsonValue;command"create"constant"create"constant

Command type identifier

Accepts one of the following:

CREATE("create")

StringfileText

Content to write to the file

Stringpath

Path where the file should be created

classBetaMemoryTool20250818StrReplaceCommand:

JsonValue;command"str\_replace"constant"str\_replace"constant

Command type identifier

Accepts one of the following:

STR\_REPLACE("str\_replace")

StringnewStr

Text to replace with

StringoldStr

Text to search for and replace

Stringpath

Path to the file where text should be replaced

classBetaMemoryTool20250818InsertCommand:

JsonValue;command"insert"constant"insert"constant

Command type identifier

Accepts one of the following:

INSERT("insert")

longinsertLine

Line number where text should be inserted

minimum1

StringinsertText

Text to insert at the specified line

Stringpath

Path to the file where text should be inserted

classBetaMemoryTool20250818DeleteCommand:

JsonValue;command"delete"constant"delete"constant

Command type identifier

Accepts one of the following:

DELETE("delete")

Stringpath

Path to the file or directory to delete

classBetaMemoryTool20250818RenameCommand:

JsonValue;command"rename"constant"rename"constant

Command type identifier

Accepts one of the following:

RENAME("rename")

StringnewPath

New path for the file or directory

StringoldPath

Current path of the file or directory

classBetaMemoryTool20250818CreateCommand:

JsonValue;command"create"constant"create"constant

Command type identifier

Accepts one of the following:

CREATE("create")

StringfileText

Content to write to the file

Stringpath

Path where the file should be created

classBetaMemoryTool20250818DeleteCommand:

JsonValue;command"delete"constant"delete"constant

Command type identifier

Accepts one of the following:

DELETE("delete")

Stringpath

Path to the file or directory to delete

classBetaMemoryTool20250818InsertCommand:

JsonValue;command"insert"constant"insert"constant

Command type identifier

Accepts one of the following:

INSERT("insert")

longinsertLine

Line number where text should be inserted

minimum1

StringinsertText

Text to insert at the specified line

Stringpath

Path to the file where text should be inserted

classBetaMemoryTool20250818RenameCommand:

JsonValue;command"rename"constant"rename"constant

Command type identifier

Accepts one of the following:

RENAME("rename")

StringnewPath

New path for the file or directory

StringoldPath

Current path of the file or directory

classBetaMemoryTool20250818StrReplaceCommand:

JsonValue;command"str\_replace"constant"str\_replace"constant

Command type identifier

Accepts one of the following:

STR\_REPLACE("str\_replace")

StringnewStr

Text to replace with

StringoldStr

Text to search for and replace

Stringpath

Path to the file where text should be replaced

classBetaMemoryTool20250818ViewCommand:

JsonValue;command"view"constant"view"constant

Command type identifier

Accepts one of the following:

VIEW("view")

Stringpath

Path to directory or file to view

Optional<List<Long>>viewRange

Optional line range for viewing specific lines

classBetaMessage:

Stringid

Unique object identifier.

The format and length of IDs may change over time.

Optional<[BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container)>container

Information about the container used in the request (for the code execution tool)

Stringid

Identifier for the container used in this request

LocalDateTimeexpiresAt

The time at which the container will expire.

formatdate-time

Optional<List<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)>>skills

Skills loaded in the container

StringskillId

Skill ID

maxLength64

minLength1

Typetype

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

ANTHROPIC("anthropic")

CUSTOM("custom")

Stringversion

Skill version or 'latest' for most recent version

maxLength64

minLength1

List<[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)>content

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

classBetaTextBlock:

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaThinkingBlock:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classBetaRedactedThinkingBlock:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classBetaToolUseBlock:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaServerToolUseBlock:

Stringid

Callercaller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Inputinput

Namename

Accepts one of the following:

WEB\_SEARCH("web\_search")

WEB\_FETCH("web\_fetch")

CODE\_EXECUTION("code\_execution")

BASH\_CODE\_EXECUTION("bash\_code\_execution")

TEXT\_EDITOR\_CODE\_EXECUTION("text\_editor\_code\_execution")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

classBetaWebSearchToolResultBlock:

[BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)content

Accepts one of the following:

classBetaWebSearchToolResultError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

List<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)>

StringencryptedContent

Optional<String>pageAge

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

StringtoolUseId

JsonValue;type"web\_search\_tool\_result"constant"web\_search\_tool\_result"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT("web\_search\_tool\_result")

classBetaWebFetchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaWebFetchToolResultErrorBlock:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

classBetaWebFetchBlock:

[BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)content

Optional<[BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config)>citations

Citation configuration for the document

booleanenabled

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<String>title

The title of the document

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

StringtoolUseId

JsonValue;type"web\_fetch\_tool\_result"constant"web\_fetch\_tool\_result"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT("web\_fetch\_tool\_result")

classBetaCodeExecutionToolResultBlock:

[BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)content

Accepts one of the following:

classBetaCodeExecutionToolResultError:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlock:

List<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

StringtoolUseId

JsonValue;type"code\_execution\_tool\_result"constant"code\_execution\_tool\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT("code\_execution\_tool\_result")

classBetaBashCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaBashCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaBashCodeExecutionResultBlock:

List<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

StringtoolUseId

JsonValue;type"bash\_code\_execution\_tool\_result"constant"bash\_code\_execution\_tool\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT("bash\_code\_execution\_tool\_result")

classBetaTextEditorCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaTextEditorCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

Optional<String>errorMessage

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

classBetaTextEditorCodeExecutionViewResultBlock:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

classBetaTextEditorCodeExecutionCreateResultBlock:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlock:

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

StringtoolUseId

JsonValue;type"text\_editor\_code\_execution\_tool\_result"constant"text\_editor\_code\_execution\_tool\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT("text\_editor\_code\_execution\_tool\_result")

classBetaToolSearchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaToolSearchToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

Optional<String>errorMessage

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolSearchResultBlock:

List<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

StringtoolUseId

JsonValue;type"tool\_search\_tool\_result"constant"tool\_search\_tool\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT("tool\_search\_tool\_result")

classBetaMcpToolUseBlock:

Stringid

Inputinput

Stringname

The name of the MCP tool

StringserverName

The name of the MCP server

JsonValue;type"mcp\_tool\_use"constant"mcp\_tool\_use"constant

Accepts one of the following:

MCP\_TOOL\_USE("mcp\_tool\_use")

classBetaMcpToolResultBlock:

Contentcontent

Accepts one of the following:

String

List<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)>

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

booleanisError

StringtoolUseId

JsonValue;type"mcp\_tool\_result"constant"mcp\_tool\_result"constant

Accepts one of the following:

MCP\_TOOL\_RESULT("mcp\_tool\_result")

classBetaContainerUploadBlock:

Response model for a file uploaded to the container.

StringfileId

JsonValue;type"container\_upload"constant"container\_upload"constant

Accepts one of the following:

CONTAINER\_UPLOAD("container\_upload")

Optional<[BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response)>contextManagement

Context management response.

Information about context management strategies applied during the request.

List<AppliedEdit>appliedEdits

List of context management edits that were applied.

Accepts one of the following:

classBetaClearToolUses20250919EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedToolUses

Number of tool uses that were cleared.

minimum0

JsonValue;type"clear\_tool\_uses\_20250919"constant"clear\_tool\_uses\_20250919"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_TOOL\_USES\_20250919("clear\_tool\_uses\_20250919")

classBetaClearThinking20251015EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedThinkingTurns

Number of thinking turns that were cleared.

minimum0

JsonValue;type"clear\_thinking\_20251015"constant"clear\_thinking\_20251015"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_THINKING\_20251015("clear\_thinking\_20251015")

Modelmodel

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

CLAUDE\_OPUS\_4\_5\_20251101("claude-opus-4-5-20251101")

Premium model combining maximum intelligence with practical performance

CLAUDE\_OPUS\_4\_5("claude-opus-4-5")

Premium model combining maximum intelligence with practical performance

CLAUDE\_3\_7\_SONNET\_LATEST("claude-3-7-sonnet-latest")

High-performance model with early extended thinking

CLAUDE\_3\_7\_SONNET\_20250219("claude-3-7-sonnet-20250219")

High-performance model with early extended thinking

CLAUDE\_3\_5\_HAIKU\_LATEST("claude-3-5-haiku-latest")

Fastest and most compact model for near-instant responsiveness

CLAUDE\_3\_5\_HAIKU\_20241022("claude-3-5-haiku-20241022")

Our fastest model

CLAUDE\_HAIKU\_4\_5("claude-haiku-4-5")

Hybrid model, capable of near-instant responses and extended thinking

CLAUDE\_HAIKU\_4\_5\_20251001("claude-haiku-4-5-20251001")

Hybrid model, capable of near-instant responses and extended thinking

CLAUDE\_SONNET\_4\_20250514("claude-sonnet-4-20250514")

High-performance model with extended thinking

CLAUDE\_SONNET\_4\_0("claude-sonnet-4-0")

High-performance model with extended thinking

CLAUDE\_4\_SONNET\_20250514("claude-4-sonnet-20250514")

High-performance model with extended thinking

CLAUDE\_SONNET\_4\_5("claude-sonnet-4-5")

Our best model for real-world agents and coding

CLAUDE\_SONNET\_4\_5\_20250929("claude-sonnet-4-5-20250929")

Our best model for real-world agents and coding

CLAUDE\_OPUS\_4\_0("claude-opus-4-0")

Our most capable model

CLAUDE\_OPUS\_4\_20250514("claude-opus-4-20250514")

Our most capable model

CLAUDE\_4\_OPUS\_20250514("claude-4-opus-20250514")

Our most capable model

CLAUDE\_OPUS\_4\_1\_20250805("claude-opus-4-1-20250805")

Our most capable model

CLAUDE\_3\_OPUS\_LATEST("claude-3-opus-latest")

Excels at writing and complex tasks

CLAUDE\_3\_OPUS\_20240229("claude-3-opus-20240229")

Excels at writing and complex tasks

CLAUDE\_3\_HAIKU\_20240307("claude-3-haiku-20240307")

Our previous most fast and cost-effective

JsonValue;role"assistant"constant"assistant"constant

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

ASSISTANT("assistant")

Optional<[BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)>stopReason

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

END\_TURN("end\_turn")

MAX\_TOKENS("max\_tokens")

STOP\_SEQUENCE("stop\_sequence")

TOOL\_USE("tool\_use")

PAUSE\_TURN("pause\_turn")

REFUSAL("refusal")

MODEL\_CONTEXT\_WINDOW\_EXCEEDED("model\_context\_window\_exceeded")

Optional<String>stopSequence

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

JsonValue;type"message"constant"message"constant

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

MESSAGE("message")

[BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage)usage

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

Optional<[BetaCacheCreation](https://platform.claude.com/docs/en/api/beta#beta_cache_creation)>cacheCreation

Breakdown of cached tokens by TTL

longephemeral1hInputTokens

The number of input tokens used to create the 1 hour cache entry.

minimum0

longephemeral5mInputTokens

The number of input tokens used to create the 5 minute cache entry.

minimum0

Optional<Long>cacheCreationInputTokens

The number of input tokens used to create the cache entry.

minimum0

Optional<Long>cacheReadInputTokens

The number of input tokens read from the cache.

minimum0

longinputTokens

The number of input tokens which were used.

minimum0

longoutputTokens

The number of output tokens which were used.

minimum0

Optional<[BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage)>serverToolUse

The number of server tool requests.

longwebFetchRequests

The number of web fetch tool requests.

minimum0

longwebSearchRequests

The number of web search tool requests.

minimum0

Optional<ServiceTier>serviceTier

If the request used the priority, standard, or batch tier.

Accepts one of the following:

STANDARD("standard")

PRIORITY("priority")

BATCH("batch")

classBetaMessageDeltaUsage:

Optional<Long>cacheCreationInputTokens

The cumulative number of input tokens used to create the cache entry.

minimum0

Optional<Long>cacheReadInputTokens

The cumulative number of input tokens read from the cache.

minimum0

Optional<Long>inputTokens

The cumulative number of input tokens which were used.

minimum0

longoutputTokens

The cumulative number of output tokens which were used.

Optional<[BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage)>serverToolUse

The number of server tool requests.

longwebFetchRequests

The number of web fetch tool requests.

minimum0

longwebSearchRequests

The number of web search tool requests.

minimum0

classBetaMessageParam:

Contentcontent

Accepts one of the following:

String

List<[BetaContentBlockParam](https://platform.claude.com/docs/en/api/beta#beta_content_block_param)>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaRequestDocumentBlock:

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaContentBlockSource:

Contentcontent

Accepts one of the following:

String

List<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"content"constant"content"constant

Accepts one of the following:

CONTENT("content")

classBetaUrlPdfSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileDocumentSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

Optional<String>context

Optional<String>title

classBetaSearchResultBlockParam:

List<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)>content

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringsource

Stringtitle

JsonValue;type"search\_result"constant"search\_result"constant

Accepts one of the following:

SEARCH\_RESULT("search\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

classBetaThinkingBlockParam:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classBetaRedactedThinkingBlockParam:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classBetaToolUseBlockParam:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaToolResultBlockParam:

StringtoolUseId

JsonValue;type"tool\_result"constant"tool\_result"constant

Accepts one of the following:

TOOL\_RESULT("tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Content>content

Accepts one of the following:

String

List<Block>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaSearchResultBlockParam:

List<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)>content

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringsource

Stringtitle

JsonValue;type"search\_result"constant"search\_result"constant

Accepts one of the following:

SEARCH\_RESULT("search\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

classBetaRequestDocumentBlock:

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaContentBlockSource:

Contentcontent

Accepts one of the following:

String

List<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"content"constant"content"constant

Accepts one of the following:

CONTENT("content")

classBetaUrlPdfSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileDocumentSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

Optional<String>context

Optional<String>title

classBetaToolReferenceBlockParam:

Tool reference block that can be included in tool\_result content.

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>isError

classBetaServerToolUseBlockParam:

Stringid

Inputinput

Namename

Accepts one of the following:

WEB\_SEARCH("web\_search")

WEB\_FETCH("web\_fetch")

CODE\_EXECUTION("code\_execution")

BASH\_CODE\_EXECUTION("bash\_code\_execution")

TEXT\_EDITOR\_CODE\_EXECUTION("text\_editor\_code\_execution")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaWebSearchToolResultBlockParam:

[BetaWebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_param_content)content

Accepts one of the following:

List<[BetaWebSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block_param)>

StringencryptedContent

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

Optional<String>pageAge

classBetaWebSearchToolRequestError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

StringtoolUseId

JsonValue;type"web\_search\_tool\_result"constant"web\_search\_tool\_result"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT("web\_search\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaWebFetchToolResultBlockParam:

Contentcontent

Accepts one of the following:

classBetaWebFetchToolResultErrorBlockParam:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

classBetaWebFetchBlockParam:

[BetaRequestDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_request_document_block)content

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaContentBlockSource:

Contentcontent

Accepts one of the following:

String

List<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"content"constant"content"constant

Accepts one of the following:

CONTENT("content")

classBetaUrlPdfSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileDocumentSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

Optional<String>context

Optional<String>title

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

StringtoolUseId

JsonValue;type"web\_fetch\_tool\_result"constant"web\_fetch\_tool\_result"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT("web\_fetch\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaCodeExecutionToolResultBlockParam:

[BetaCodeExecutionToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_param_content)content

Accepts one of the following:

classBetaCodeExecutionToolResultErrorParam:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlockParam:

List<[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

StringtoolUseId

JsonValue;type"code\_execution\_tool\_result"constant"code\_execution\_tool\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT("code\_execution\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaBashCodeExecutionToolResultBlockParam:

Contentcontent

Accepts one of the following:

classBetaBashCodeExecutionToolResultErrorParam:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaBashCodeExecutionResultBlockParam:

List<[BetaBashCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block_param)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

StringtoolUseId

JsonValue;type"bash\_code\_execution\_tool\_result"constant"bash\_code\_execution\_tool\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT("bash\_code\_execution\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaTextEditorCodeExecutionToolResultBlockParam:

Contentcontent

Accepts one of the following:

classBetaTextEditorCodeExecutionToolResultErrorParam:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

Optional<String>errorMessage

classBetaTextEditorCodeExecutionViewResultBlockParam:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

classBetaTextEditorCodeExecutionCreateResultBlockParam:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlockParam:

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

StringtoolUseId

JsonValue;type"text\_editor\_code\_execution\_tool\_result"constant"text\_editor\_code\_execution\_tool\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT("text\_editor\_code\_execution\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaToolSearchToolResultBlockParam:

Contentcontent

Accepts one of the following:

classBetaToolSearchToolResultErrorParam:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolSearchResultBlockParam:

List<[BetaToolReferenceBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block_param)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

StringtoolUseId

JsonValue;type"tool\_search\_tool\_result"constant"tool\_search\_tool\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT("tool\_search\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaMcpToolUseBlockParam:

Stringid

Inputinput

Stringname

StringserverName

The name of the MCP server

JsonValue;type"mcp\_tool\_use"constant"mcp\_tool\_use"constant

Accepts one of the following:

MCP\_TOOL\_USE("mcp\_tool\_use")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaRequestMcpToolResultBlockParam:

StringtoolUseId

JsonValue;type"mcp\_tool\_result"constant"mcp\_tool\_result"constant

Accepts one of the following:

MCP\_TOOL\_RESULT("mcp\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Content>content

Accepts one of the following:

String

List<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)>

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Optional<Boolean>isError

classBetaContainerUploadBlockParam:

A content block that represents a file to be uploaded to the container
Files uploaded via this block will be available in the container's input directory.

StringfileId

JsonValue;type"container\_upload"constant"container\_upload"constant

Accepts one of the following:

CONTAINER\_UPLOAD("container\_upload")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Rolerole

Accepts one of the following:

USER("user")

ASSISTANT("assistant")

classBetaMessageTokensCount:

Optional<[BetaCountTokensContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_count_tokens_context_management_response)>contextManagement

Information about context management applied to the message.

longoriginalInputTokens

The original token count before context management was applied

longinputTokens

The total number of tokens across the provided list of messages, system prompt, and tools.

classBetaMetadata:

Optional<String>userId

An external identifier for the user who is associated with the request.

This should be a uuid, hash value, or other opaque identifier. Anthropic may use this id to help detect abuse. Do not include any identifying information such as name, email address, or phone number.

maxLength256

classBetaOutputConfig:

Optional<Effort>effort

All possible effort levels.

Accepts one of the following:

LOW("low")

MEDIUM("medium")

HIGH("high")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaRawContentBlockDelta:A class that can be one of several variants.union

classBetaTextDelta:

Stringtext

JsonValue;type"text\_delta"constant"text\_delta"constant

Accepts one of the following:

TEXT\_DELTA("text\_delta")

classBetaInputJsonDelta:

StringpartialJson

JsonValue;type"input\_json\_delta"constant"input\_json\_delta"constant

Accepts one of the following:

INPUT\_JSON\_DELTA("input\_json\_delta")

classBetaCitationsDelta:

Citationcitation

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

JsonValue;type"citations\_delta"constant"citations\_delta"constant

Accepts one of the following:

CITATIONS\_DELTA("citations\_delta")

classBetaThinkingDelta:

Stringthinking

JsonValue;type"thinking\_delta"constant"thinking\_delta"constant

Accepts one of the following:

THINKING\_DELTA("thinking\_delta")

classBetaSignatureDelta:

Stringsignature

JsonValue;type"signature\_delta"constant"signature\_delta"constant

Accepts one of the following:

SIGNATURE\_DELTA("signature\_delta")

classBetaRawContentBlockDeltaEvent:

[BetaRawContentBlockDelta](https://platform.claude.com/docs/en/api/beta#beta_raw_content_block_delta)delta

Accepts one of the following:

classBetaTextDelta:

Stringtext

JsonValue;type"text\_delta"constant"text\_delta"constant

Accepts one of the following:

TEXT\_DELTA("text\_delta")

classBetaInputJsonDelta:

StringpartialJson

JsonValue;type"input\_json\_delta"constant"input\_json\_delta"constant

Accepts one of the following:

INPUT\_JSON\_DELTA("input\_json\_delta")

classBetaCitationsDelta:

Citationcitation

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

JsonValue;type"citations\_delta"constant"citations\_delta"constant

Accepts one of the following:

CITATIONS\_DELTA("citations\_delta")

classBetaThinkingDelta:

Stringthinking

JsonValue;type"thinking\_delta"constant"thinking\_delta"constant

Accepts one of the following:

THINKING\_DELTA("thinking\_delta")

classBetaSignatureDelta:

Stringsignature

JsonValue;type"signature\_delta"constant"signature\_delta"constant

Accepts one of the following:

SIGNATURE\_DELTA("signature\_delta")

longindex

JsonValue;type"content\_block\_delta"constant"content\_block\_delta"constant

Accepts one of the following:

CONTENT\_BLOCK\_DELTA("content\_block\_delta")

classBetaRawContentBlockStartEvent:

ContentBlockcontentBlock

Response model for a file uploaded to the container.

Accepts one of the following:

classBetaTextBlock:

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaThinkingBlock:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classBetaRedactedThinkingBlock:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classBetaToolUseBlock:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaServerToolUseBlock:

Stringid

Callercaller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Inputinput

Namename

Accepts one of the following:

WEB\_SEARCH("web\_search")

WEB\_FETCH("web\_fetch")

CODE\_EXECUTION("code\_execution")

BASH\_CODE\_EXECUTION("bash\_code\_execution")

TEXT\_EDITOR\_CODE\_EXECUTION("text\_editor\_code\_execution")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

classBetaWebSearchToolResultBlock:

[BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)content

Accepts one of the following:

classBetaWebSearchToolResultError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

List<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)>

StringencryptedContent

Optional<String>pageAge

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

StringtoolUseId

JsonValue;type"web\_search\_tool\_result"constant"web\_search\_tool\_result"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT("web\_search\_tool\_result")

classBetaWebFetchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaWebFetchToolResultErrorBlock:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

classBetaWebFetchBlock:

[BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)content

Optional<[BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config)>citations

Citation configuration for the document

booleanenabled

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<String>title

The title of the document

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

StringtoolUseId

JsonValue;type"web\_fetch\_tool\_result"constant"web\_fetch\_tool\_result"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT("web\_fetch\_tool\_result")

classBetaCodeExecutionToolResultBlock:

[BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)content

Accepts one of the following:

classBetaCodeExecutionToolResultError:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlock:

List<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

StringtoolUseId

JsonValue;type"code\_execution\_tool\_result"constant"code\_execution\_tool\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT("code\_execution\_tool\_result")

classBetaBashCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaBashCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaBashCodeExecutionResultBlock:

List<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

StringtoolUseId

JsonValue;type"bash\_code\_execution\_tool\_result"constant"bash\_code\_execution\_tool\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT("bash\_code\_execution\_tool\_result")

classBetaTextEditorCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaTextEditorCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

Optional<String>errorMessage

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

classBetaTextEditorCodeExecutionViewResultBlock:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

classBetaTextEditorCodeExecutionCreateResultBlock:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlock:

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

StringtoolUseId

JsonValue;type"text\_editor\_code\_execution\_tool\_result"constant"text\_editor\_code\_execution\_tool\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT("text\_editor\_code\_execution\_tool\_result")

classBetaToolSearchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaToolSearchToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

Optional<String>errorMessage

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolSearchResultBlock:

List<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

StringtoolUseId

JsonValue;type"tool\_search\_tool\_result"constant"tool\_search\_tool\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT("tool\_search\_tool\_result")

classBetaMcpToolUseBlock:

Stringid

Inputinput

Stringname

The name of the MCP tool

StringserverName

The name of the MCP server

JsonValue;type"mcp\_tool\_use"constant"mcp\_tool\_use"constant

Accepts one of the following:

MCP\_TOOL\_USE("mcp\_tool\_use")

classBetaMcpToolResultBlock:

Contentcontent

Accepts one of the following:

String

List<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)>

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

booleanisError

StringtoolUseId

JsonValue;type"mcp\_tool\_result"constant"mcp\_tool\_result"constant

Accepts one of the following:

MCP\_TOOL\_RESULT("mcp\_tool\_result")

classBetaContainerUploadBlock:

Response model for a file uploaded to the container.

StringfileId

JsonValue;type"container\_upload"constant"container\_upload"constant

Accepts one of the following:

CONTAINER\_UPLOAD("container\_upload")

longindex

JsonValue;type"content\_block\_start"constant"content\_block\_start"constant

Accepts one of the following:

CONTENT\_BLOCK\_START("content\_block\_start")

classBetaRawContentBlockStopEvent:

longindex

JsonValue;type"content\_block\_stop"constant"content\_block\_stop"constant

Accepts one of the following:

CONTENT\_BLOCK\_STOP("content\_block\_stop")

classBetaRawMessageDeltaEvent:

Optional<[BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response)>contextManagement

Information about context management strategies applied during the request

List<AppliedEdit>appliedEdits

List of context management edits that were applied.

Accepts one of the following:

classBetaClearToolUses20250919EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedToolUses

Number of tool uses that were cleared.

minimum0

JsonValue;type"clear\_tool\_uses\_20250919"constant"clear\_tool\_uses\_20250919"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_TOOL\_USES\_20250919("clear\_tool\_uses\_20250919")

classBetaClearThinking20251015EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedThinkingTurns

Number of thinking turns that were cleared.

minimum0

JsonValue;type"clear\_thinking\_20251015"constant"clear\_thinking\_20251015"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_THINKING\_20251015("clear\_thinking\_20251015")

Deltadelta

Optional<[BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container)>container

Information about the container used in the request (for the code execution tool)

Stringid

Identifier for the container used in this request

LocalDateTimeexpiresAt

The time at which the container will expire.

formatdate-time

Optional<List<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)>>skills

Skills loaded in the container

StringskillId

Skill ID

maxLength64

minLength1

Typetype

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

ANTHROPIC("anthropic")

CUSTOM("custom")

Stringversion

Skill version or 'latest' for most recent version

maxLength64

minLength1

Optional<[BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)>stopReason

Accepts one of the following:

END\_TURN("end\_turn")

MAX\_TOKENS("max\_tokens")

STOP\_SEQUENCE("stop\_sequence")

TOOL\_USE("tool\_use")

PAUSE\_TURN("pause\_turn")

REFUSAL("refusal")

MODEL\_CONTEXT\_WINDOW\_EXCEEDED("model\_context\_window\_exceeded")

Optional<String>stopSequence

JsonValue;type"message\_delta"constant"message\_delta"constant

Accepts one of the following:

MESSAGE\_DELTA("message\_delta")

[BetaMessageDeltaUsage](https://platform.claude.com/docs/en/api/beta#beta_message_delta_usage)usage

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

Optional<Long>cacheCreationInputTokens

The cumulative number of input tokens used to create the cache entry.

minimum0

Optional<Long>cacheReadInputTokens

The cumulative number of input tokens read from the cache.

minimum0

Optional<Long>inputTokens

The cumulative number of input tokens which were used.

minimum0

longoutputTokens

The cumulative number of output tokens which were used.

Optional<[BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage)>serverToolUse

The number of server tool requests.

longwebFetchRequests

The number of web fetch tool requests.

minimum0

longwebSearchRequests

The number of web search tool requests.

minimum0

classBetaRawMessageStartEvent:

[BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message)message

Stringid

Unique object identifier.

The format and length of IDs may change over time.

Optional<[BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container)>container

Information about the container used in the request (for the code execution tool)

Stringid

Identifier for the container used in this request

LocalDateTimeexpiresAt

The time at which the container will expire.

formatdate-time

Optional<List<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)>>skills

Skills loaded in the container

StringskillId

Skill ID

maxLength64

minLength1

Typetype

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

ANTHROPIC("anthropic")

CUSTOM("custom")

Stringversion

Skill version or 'latest' for most recent version

maxLength64

minLength1

List<[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)>content

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

classBetaTextBlock:

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaThinkingBlock:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classBetaRedactedThinkingBlock:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classBetaToolUseBlock:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaServerToolUseBlock:

Stringid

Callercaller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Inputinput

Namename

Accepts one of the following:

WEB\_SEARCH("web\_search")

WEB\_FETCH("web\_fetch")

CODE\_EXECUTION("code\_execution")

BASH\_CODE\_EXECUTION("bash\_code\_execution")

TEXT\_EDITOR\_CODE\_EXECUTION("text\_editor\_code\_execution")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

classBetaWebSearchToolResultBlock:

[BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)content

Accepts one of the following:

classBetaWebSearchToolResultError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

List<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)>

StringencryptedContent

Optional<String>pageAge

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

StringtoolUseId

JsonValue;type"web\_search\_tool\_result"constant"web\_search\_tool\_result"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT("web\_search\_tool\_result")

classBetaWebFetchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaWebFetchToolResultErrorBlock:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

classBetaWebFetchBlock:

[BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)content

Optional<[BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config)>citations

Citation configuration for the document

booleanenabled

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<String>title

The title of the document

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

StringtoolUseId

JsonValue;type"web\_fetch\_tool\_result"constant"web\_fetch\_tool\_result"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT("web\_fetch\_tool\_result")

classBetaCodeExecutionToolResultBlock:

[BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)content

Accepts one of the following:

classBetaCodeExecutionToolResultError:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlock:

List<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

StringtoolUseId

JsonValue;type"code\_execution\_tool\_result"constant"code\_execution\_tool\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT("code\_execution\_tool\_result")

classBetaBashCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaBashCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaBashCodeExecutionResultBlock:

List<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

StringtoolUseId

JsonValue;type"bash\_code\_execution\_tool\_result"constant"bash\_code\_execution\_tool\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT("bash\_code\_execution\_tool\_result")

classBetaTextEditorCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaTextEditorCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

Optional<String>errorMessage

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

classBetaTextEditorCodeExecutionViewResultBlock:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

classBetaTextEditorCodeExecutionCreateResultBlock:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlock:

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

StringtoolUseId

JsonValue;type"text\_editor\_code\_execution\_tool\_result"constant"text\_editor\_code\_execution\_tool\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT("text\_editor\_code\_execution\_tool\_result")

classBetaToolSearchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaToolSearchToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

Optional<String>errorMessage

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolSearchResultBlock:

List<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

StringtoolUseId

JsonValue;type"tool\_search\_tool\_result"constant"tool\_search\_tool\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT("tool\_search\_tool\_result")

classBetaMcpToolUseBlock:

Stringid

Inputinput

Stringname

The name of the MCP tool

StringserverName

The name of the MCP server

JsonValue;type"mcp\_tool\_use"constant"mcp\_tool\_use"constant

Accepts one of the following:

MCP\_TOOL\_USE("mcp\_tool\_use")

classBetaMcpToolResultBlock:

Contentcontent

Accepts one of the following:

String

List<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)>

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

booleanisError

StringtoolUseId

JsonValue;type"mcp\_tool\_result"constant"mcp\_tool\_result"constant

Accepts one of the following:

MCP\_TOOL\_RESULT("mcp\_tool\_result")

classBetaContainerUploadBlock:

Response model for a file uploaded to the container.

StringfileId

JsonValue;type"container\_upload"constant"container\_upload"constant

Accepts one of the following:

CONTAINER\_UPLOAD("container\_upload")

Optional<[BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response)>contextManagement

Context management response.

Information about context management strategies applied during the request.

List<AppliedEdit>appliedEdits

List of context management edits that were applied.

Accepts one of the following:

classBetaClearToolUses20250919EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedToolUses

Number of tool uses that were cleared.

minimum0

JsonValue;type"clear\_tool\_uses\_20250919"constant"clear\_tool\_uses\_20250919"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_TOOL\_USES\_20250919("clear\_tool\_uses\_20250919")

classBetaClearThinking20251015EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedThinkingTurns

Number of thinking turns that were cleared.

minimum0

JsonValue;type"clear\_thinking\_20251015"constant"clear\_thinking\_20251015"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_THINKING\_20251015("clear\_thinking\_20251015")

Modelmodel

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

CLAUDE\_OPUS\_4\_5\_20251101("claude-opus-4-5-20251101")

Premium model combining maximum intelligence with practical performance

CLAUDE\_OPUS\_4\_5("claude-opus-4-5")

Premium model combining maximum intelligence with practical performance

CLAUDE\_3\_7\_SONNET\_LATEST("claude-3-7-sonnet-latest")

High-performance model with early extended thinking

CLAUDE\_3\_7\_SONNET\_20250219("claude-3-7-sonnet-20250219")

High-performance model with early extended thinking

CLAUDE\_3\_5\_HAIKU\_LATEST("claude-3-5-haiku-latest")

Fastest and most compact model for near-instant responsiveness

CLAUDE\_3\_5\_HAIKU\_20241022("claude-3-5-haiku-20241022")

Our fastest model

CLAUDE\_HAIKU\_4\_5("claude-haiku-4-5")

Hybrid model, capable of near-instant responses and extended thinking

CLAUDE\_HAIKU\_4\_5\_20251001("claude-haiku-4-5-20251001")

Hybrid model, capable of near-instant responses and extended thinking

CLAUDE\_SONNET\_4\_20250514("claude-sonnet-4-20250514")

High-performance model with extended thinking

CLAUDE\_SONNET\_4\_0("claude-sonnet-4-0")

High-performance model with extended thinking

CLAUDE\_4\_SONNET\_20250514("claude-4-sonnet-20250514")

High-performance model with extended thinking

CLAUDE\_SONNET\_4\_5("claude-sonnet-4-5")

Our best model for real-world agents and coding

CLAUDE\_SONNET\_4\_5\_20250929("claude-sonnet-4-5-20250929")

Our best model for real-world agents and coding

CLAUDE\_OPUS\_4\_0("claude-opus-4-0")

Our most capable model

CLAUDE\_OPUS\_4\_20250514("claude-opus-4-20250514")

Our most capable model

CLAUDE\_4\_OPUS\_20250514("claude-4-opus-20250514")

Our most capable model

CLAUDE\_OPUS\_4\_1\_20250805("claude-opus-4-1-20250805")

Our most capable model

CLAUDE\_3\_OPUS\_LATEST("claude-3-opus-latest")

Excels at writing and complex tasks

CLAUDE\_3\_OPUS\_20240229("claude-3-opus-20240229")

Excels at writing and complex tasks

CLAUDE\_3\_HAIKU\_20240307("claude-3-haiku-20240307")

Our previous most fast and cost-effective

JsonValue;role"assistant"constant"assistant"constant

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

ASSISTANT("assistant")

Optional<[BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)>stopReason

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

END\_TURN("end\_turn")

MAX\_TOKENS("max\_tokens")

STOP\_SEQUENCE("stop\_sequence")

TOOL\_USE("tool\_use")

PAUSE\_TURN("pause\_turn")

REFUSAL("refusal")

MODEL\_CONTEXT\_WINDOW\_EXCEEDED("model\_context\_window\_exceeded")

Optional<String>stopSequence

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

JsonValue;type"message"constant"message"constant

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

MESSAGE("message")

[BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage)usage

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

Optional<[BetaCacheCreation](https://platform.claude.com/docs/en/api/beta#beta_cache_creation)>cacheCreation

Breakdown of cached tokens by TTL

longephemeral1hInputTokens

The number of input tokens used to create the 1 hour cache entry.

minimum0

longephemeral5mInputTokens

The number of input tokens used to create the 5 minute cache entry.

minimum0

Optional<Long>cacheCreationInputTokens

The number of input tokens used to create the cache entry.

minimum0

Optional<Long>cacheReadInputTokens

The number of input tokens read from the cache.

minimum0

longinputTokens

The number of input tokens which were used.

minimum0

longoutputTokens

The number of output tokens which were used.

minimum0

Optional<[BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage)>serverToolUse

The number of server tool requests.

longwebFetchRequests

The number of web fetch tool requests.

minimum0

longwebSearchRequests

The number of web search tool requests.

minimum0

Optional<ServiceTier>serviceTier

If the request used the priority, standard, or batch tier.

Accepts one of the following:

STANDARD("standard")

PRIORITY("priority")

BATCH("batch")

JsonValue;type"message\_start"constant"message\_start"constant

Accepts one of the following:

MESSAGE\_START("message\_start")

classBetaRawMessageStopEvent:

JsonValue;type"message\_stop"constant"message\_stop"constant

Accepts one of the following:

MESSAGE\_STOP("message\_stop")

classBetaRawMessageStreamEvent:A class that can be one of several variants.union

classBetaRawMessageStartEvent:

[BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message)message

Stringid

Unique object identifier.

The format and length of IDs may change over time.

Optional<[BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container)>container

Information about the container used in the request (for the code execution tool)

Stringid

Identifier for the container used in this request

LocalDateTimeexpiresAt

The time at which the container will expire.

formatdate-time

Optional<List<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)>>skills

Skills loaded in the container

StringskillId

Skill ID

maxLength64

minLength1

Typetype

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

ANTHROPIC("anthropic")

CUSTOM("custom")

Stringversion

Skill version or 'latest' for most recent version

maxLength64

minLength1

List<[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)>content

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

classBetaTextBlock:

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaThinkingBlock:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classBetaRedactedThinkingBlock:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classBetaToolUseBlock:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaServerToolUseBlock:

Stringid

Callercaller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Inputinput

Namename

Accepts one of the following:

WEB\_SEARCH("web\_search")

WEB\_FETCH("web\_fetch")

CODE\_EXECUTION("code\_execution")

BASH\_CODE\_EXECUTION("bash\_code\_execution")

TEXT\_EDITOR\_CODE\_EXECUTION("text\_editor\_code\_execution")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

classBetaWebSearchToolResultBlock:

[BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)content

Accepts one of the following:

classBetaWebSearchToolResultError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

List<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)>

StringencryptedContent

Optional<String>pageAge

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

StringtoolUseId

JsonValue;type"web\_search\_tool\_result"constant"web\_search\_tool\_result"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT("web\_search\_tool\_result")

classBetaWebFetchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaWebFetchToolResultErrorBlock:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

classBetaWebFetchBlock:

[BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)content

Optional<[BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config)>citations

Citation configuration for the document

booleanenabled

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<String>title

The title of the document

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

StringtoolUseId

JsonValue;type"web\_fetch\_tool\_result"constant"web\_fetch\_tool\_result"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT("web\_fetch\_tool\_result")

classBetaCodeExecutionToolResultBlock:

[BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)content

Accepts one of the following:

classBetaCodeExecutionToolResultError:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlock:

List<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

StringtoolUseId

JsonValue;type"code\_execution\_tool\_result"constant"code\_execution\_tool\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT("code\_execution\_tool\_result")

classBetaBashCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaBashCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaBashCodeExecutionResultBlock:

List<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

StringtoolUseId

JsonValue;type"bash\_code\_execution\_tool\_result"constant"bash\_code\_execution\_tool\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT("bash\_code\_execution\_tool\_result")

classBetaTextEditorCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaTextEditorCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

Optional<String>errorMessage

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

classBetaTextEditorCodeExecutionViewResultBlock:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

classBetaTextEditorCodeExecutionCreateResultBlock:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlock:

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

StringtoolUseId

JsonValue;type"text\_editor\_code\_execution\_tool\_result"constant"text\_editor\_code\_execution\_tool\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT("text\_editor\_code\_execution\_tool\_result")

classBetaToolSearchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaToolSearchToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

Optional<String>errorMessage

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolSearchResultBlock:

List<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

StringtoolUseId

JsonValue;type"tool\_search\_tool\_result"constant"tool\_search\_tool\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT("tool\_search\_tool\_result")

classBetaMcpToolUseBlock:

Stringid

Inputinput

Stringname

The name of the MCP tool

StringserverName

The name of the MCP server

JsonValue;type"mcp\_tool\_use"constant"mcp\_tool\_use"constant

Accepts one of the following:

MCP\_TOOL\_USE("mcp\_tool\_use")

classBetaMcpToolResultBlock:

Contentcontent

Accepts one of the following:

String

List<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)>

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

booleanisError

StringtoolUseId

JsonValue;type"mcp\_tool\_result"constant"mcp\_tool\_result"constant

Accepts one of the following:

MCP\_TOOL\_RESULT("mcp\_tool\_result")

classBetaContainerUploadBlock:

Response model for a file uploaded to the container.

StringfileId

JsonValue;type"container\_upload"constant"container\_upload"constant

Accepts one of the following:

CONTAINER\_UPLOAD("container\_upload")

Optional<[BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response)>contextManagement

Context management response.

Information about context management strategies applied during the request.

List<AppliedEdit>appliedEdits

List of context management edits that were applied.

Accepts one of the following:

classBetaClearToolUses20250919EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedToolUses

Number of tool uses that were cleared.

minimum0

JsonValue;type"clear\_tool\_uses\_20250919"constant"clear\_tool\_uses\_20250919"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_TOOL\_USES\_20250919("clear\_tool\_uses\_20250919")

classBetaClearThinking20251015EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedThinkingTurns

Number of thinking turns that were cleared.

minimum0

JsonValue;type"clear\_thinking\_20251015"constant"clear\_thinking\_20251015"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_THINKING\_20251015("clear\_thinking\_20251015")

Modelmodel

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

CLAUDE\_OPUS\_4\_5\_20251101("claude-opus-4-5-20251101")

Premium model combining maximum intelligence with practical performance

CLAUDE\_OPUS\_4\_5("claude-opus-4-5")

Premium model combining maximum intelligence with practical performance

CLAUDE\_3\_7\_SONNET\_LATEST("claude-3-7-sonnet-latest")

High-performance model with early extended thinking

CLAUDE\_3\_7\_SONNET\_20250219("claude-3-7-sonnet-20250219")

High-performance model with early extended thinking

CLAUDE\_3\_5\_HAIKU\_LATEST("claude-3-5-haiku-latest")

Fastest and most compact model for near-instant responsiveness

CLAUDE\_3\_5\_HAIKU\_20241022("claude-3-5-haiku-20241022")

Our fastest model

CLAUDE\_HAIKU\_4\_5("claude-haiku-4-5")

Hybrid model, capable of near-instant responses and extended thinking

CLAUDE\_HAIKU\_4\_5\_20251001("claude-haiku-4-5-20251001")

Hybrid model, capable of near-instant responses and extended thinking

CLAUDE\_SONNET\_4\_20250514("claude-sonnet-4-20250514")

High-performance model with extended thinking

CLAUDE\_SONNET\_4\_0("claude-sonnet-4-0")

High-performance model with extended thinking

CLAUDE\_4\_SONNET\_20250514("claude-4-sonnet-20250514")

High-performance model with extended thinking

CLAUDE\_SONNET\_4\_5("claude-sonnet-4-5")

Our best model for real-world agents and coding

CLAUDE\_SONNET\_4\_5\_20250929("claude-sonnet-4-5-20250929")

Our best model for real-world agents and coding

CLAUDE\_OPUS\_4\_0("claude-opus-4-0")

Our most capable model

CLAUDE\_OPUS\_4\_20250514("claude-opus-4-20250514")

Our most capable model

CLAUDE\_4\_OPUS\_20250514("claude-4-opus-20250514")

Our most capable model

CLAUDE\_OPUS\_4\_1\_20250805("claude-opus-4-1-20250805")

Our most capable model

CLAUDE\_3\_OPUS\_LATEST("claude-3-opus-latest")

Excels at writing and complex tasks

CLAUDE\_3\_OPUS\_20240229("claude-3-opus-20240229")

Excels at writing and complex tasks

CLAUDE\_3\_HAIKU\_20240307("claude-3-haiku-20240307")

Our previous most fast and cost-effective

JsonValue;role"assistant"constant"assistant"constant

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

ASSISTANT("assistant")

Optional<[BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)>stopReason

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

END\_TURN("end\_turn")

MAX\_TOKENS("max\_tokens")

STOP\_SEQUENCE("stop\_sequence")

TOOL\_USE("tool\_use")

PAUSE\_TURN("pause\_turn")

REFUSAL("refusal")

MODEL\_CONTEXT\_WINDOW\_EXCEEDED("model\_context\_window\_exceeded")

Optional<String>stopSequence

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

JsonValue;type"message"constant"message"constant

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

MESSAGE("message")

[BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage)usage

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

Optional<[BetaCacheCreation](https://platform.claude.com/docs/en/api/beta#beta_cache_creation)>cacheCreation

Breakdown of cached tokens by TTL

longephemeral1hInputTokens

The number of input tokens used to create the 1 hour cache entry.

minimum0

longephemeral5mInputTokens

The number of input tokens used to create the 5 minute cache entry.

minimum0

Optional<Long>cacheCreationInputTokens

The number of input tokens used to create the cache entry.

minimum0

Optional<Long>cacheReadInputTokens

The number of input tokens read from the cache.

minimum0

longinputTokens

The number of input tokens which were used.

minimum0

longoutputTokens

The number of output tokens which were used.

minimum0

Optional<[BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage)>serverToolUse

The number of server tool requests.

longwebFetchRequests

The number of web fetch tool requests.

minimum0

longwebSearchRequests

The number of web search tool requests.

minimum0

Optional<ServiceTier>serviceTier

If the request used the priority, standard, or batch tier.

Accepts one of the following:

STANDARD("standard")

PRIORITY("priority")

BATCH("batch")

JsonValue;type"message\_start"constant"message\_start"constant

Accepts one of the following:

MESSAGE\_START("message\_start")

classBetaRawMessageDeltaEvent:

Optional<[BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response)>contextManagement

Information about context management strategies applied during the request

List<AppliedEdit>appliedEdits

List of context management edits that were applied.

Accepts one of the following:

classBetaClearToolUses20250919EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedToolUses

Number of tool uses that were cleared.

minimum0

JsonValue;type"clear\_tool\_uses\_20250919"constant"clear\_tool\_uses\_20250919"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_TOOL\_USES\_20250919("clear\_tool\_uses\_20250919")

classBetaClearThinking20251015EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedThinkingTurns

Number of thinking turns that were cleared.

minimum0

JsonValue;type"clear\_thinking\_20251015"constant"clear\_thinking\_20251015"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_THINKING\_20251015("clear\_thinking\_20251015")

Deltadelta

Optional<[BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container)>container

Information about the container used in the request (for the code execution tool)

Stringid

Identifier for the container used in this request

LocalDateTimeexpiresAt

The time at which the container will expire.

formatdate-time

Optional<List<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)>>skills

Skills loaded in the container

StringskillId

Skill ID

maxLength64

minLength1

Typetype

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

ANTHROPIC("anthropic")

CUSTOM("custom")

Stringversion

Skill version or 'latest' for most recent version

maxLength64

minLength1

Optional<[BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)>stopReason

Accepts one of the following:

END\_TURN("end\_turn")

MAX\_TOKENS("max\_tokens")

STOP\_SEQUENCE("stop\_sequence")

TOOL\_USE("tool\_use")

PAUSE\_TURN("pause\_turn")

REFUSAL("refusal")

MODEL\_CONTEXT\_WINDOW\_EXCEEDED("model\_context\_window\_exceeded")

Optional<String>stopSequence

JsonValue;type"message\_delta"constant"message\_delta"constant

Accepts one of the following:

MESSAGE\_DELTA("message\_delta")

[BetaMessageDeltaUsage](https://platform.claude.com/docs/en/api/beta#beta_message_delta_usage)usage

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

Optional<Long>cacheCreationInputTokens

The cumulative number of input tokens used to create the cache entry.

minimum0

Optional<Long>cacheReadInputTokens

The cumulative number of input tokens read from the cache.

minimum0

Optional<Long>inputTokens

The cumulative number of input tokens which were used.

minimum0

longoutputTokens

The cumulative number of output tokens which were used.

Optional<[BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage)>serverToolUse

The number of server tool requests.

longwebFetchRequests

The number of web fetch tool requests.

minimum0

longwebSearchRequests

The number of web search tool requests.

minimum0

classBetaRawMessageStopEvent:

JsonValue;type"message\_stop"constant"message\_stop"constant

Accepts one of the following:

MESSAGE\_STOP("message\_stop")

classBetaRawContentBlockStartEvent:

ContentBlockcontentBlock

Response model for a file uploaded to the container.

Accepts one of the following:

classBetaTextBlock:

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaThinkingBlock:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classBetaRedactedThinkingBlock:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classBetaToolUseBlock:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaServerToolUseBlock:

Stringid

Callercaller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Inputinput

Namename

Accepts one of the following:

WEB\_SEARCH("web\_search")

WEB\_FETCH("web\_fetch")

CODE\_EXECUTION("code\_execution")

BASH\_CODE\_EXECUTION("bash\_code\_execution")

TEXT\_EDITOR\_CODE\_EXECUTION("text\_editor\_code\_execution")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

classBetaWebSearchToolResultBlock:

[BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)content

Accepts one of the following:

classBetaWebSearchToolResultError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

List<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)>

StringencryptedContent

Optional<String>pageAge

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

StringtoolUseId

JsonValue;type"web\_search\_tool\_result"constant"web\_search\_tool\_result"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT("web\_search\_tool\_result")

classBetaWebFetchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaWebFetchToolResultErrorBlock:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

classBetaWebFetchBlock:

[BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)content

Optional<[BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config)>citations

Citation configuration for the document

booleanenabled

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<String>title

The title of the document

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

StringtoolUseId

JsonValue;type"web\_fetch\_tool\_result"constant"web\_fetch\_tool\_result"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT("web\_fetch\_tool\_result")

classBetaCodeExecutionToolResultBlock:

[BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)content

Accepts one of the following:

classBetaCodeExecutionToolResultError:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlock:

List<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

StringtoolUseId

JsonValue;type"code\_execution\_tool\_result"constant"code\_execution\_tool\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT("code\_execution\_tool\_result")

classBetaBashCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaBashCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaBashCodeExecutionResultBlock:

List<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

StringtoolUseId

JsonValue;type"bash\_code\_execution\_tool\_result"constant"bash\_code\_execution\_tool\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT("bash\_code\_execution\_tool\_result")

classBetaTextEditorCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaTextEditorCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

Optional<String>errorMessage

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

classBetaTextEditorCodeExecutionViewResultBlock:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

classBetaTextEditorCodeExecutionCreateResultBlock:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlock:

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

StringtoolUseId

JsonValue;type"text\_editor\_code\_execution\_tool\_result"constant"text\_editor\_code\_execution\_tool\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT("text\_editor\_code\_execution\_tool\_result")

classBetaToolSearchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaToolSearchToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

Optional<String>errorMessage

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolSearchResultBlock:

List<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

StringtoolUseId

JsonValue;type"tool\_search\_tool\_result"constant"tool\_search\_tool\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT("tool\_search\_tool\_result")

classBetaMcpToolUseBlock:

Stringid

Inputinput

Stringname

The name of the MCP tool

StringserverName

The name of the MCP server

JsonValue;type"mcp\_tool\_use"constant"mcp\_tool\_use"constant

Accepts one of the following:

MCP\_TOOL\_USE("mcp\_tool\_use")

classBetaMcpToolResultBlock:

Contentcontent

Accepts one of the following:

String

List<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)>

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

booleanisError

StringtoolUseId

JsonValue;type"mcp\_tool\_result"constant"mcp\_tool\_result"constant

Accepts one of the following:

MCP\_TOOL\_RESULT("mcp\_tool\_result")

classBetaContainerUploadBlock:

Response model for a file uploaded to the container.

StringfileId

JsonValue;type"container\_upload"constant"container\_upload"constant

Accepts one of the following:

CONTAINER\_UPLOAD("container\_upload")

longindex

JsonValue;type"content\_block\_start"constant"content\_block\_start"constant

Accepts one of the following:

CONTENT\_BLOCK\_START("content\_block\_start")

classBetaRawContentBlockDeltaEvent:

[BetaRawContentBlockDelta](https://platform.claude.com/docs/en/api/beta#beta_raw_content_block_delta)delta

Accepts one of the following:

classBetaTextDelta:

Stringtext

JsonValue;type"text\_delta"constant"text\_delta"constant

Accepts one of the following:

TEXT\_DELTA("text\_delta")

classBetaInputJsonDelta:

StringpartialJson

JsonValue;type"input\_json\_delta"constant"input\_json\_delta"constant

Accepts one of the following:

INPUT\_JSON\_DELTA("input\_json\_delta")

classBetaCitationsDelta:

Citationcitation

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

JsonValue;type"citations\_delta"constant"citations\_delta"constant

Accepts one of the following:

CITATIONS\_DELTA("citations\_delta")

classBetaThinkingDelta:

Stringthinking

JsonValue;type"thinking\_delta"constant"thinking\_delta"constant

Accepts one of the following:

THINKING\_DELTA("thinking\_delta")

classBetaSignatureDelta:

Stringsignature

JsonValue;type"signature\_delta"constant"signature\_delta"constant

Accepts one of the following:

SIGNATURE\_DELTA("signature\_delta")

longindex

JsonValue;type"content\_block\_delta"constant"content\_block\_delta"constant

Accepts one of the following:

CONTENT\_BLOCK\_DELTA("content\_block\_delta")

classBetaRawContentBlockStopEvent:

longindex

JsonValue;type"content\_block\_stop"constant"content\_block\_stop"constant

Accepts one of the following:

CONTENT\_BLOCK\_STOP("content\_block\_stop")

classBetaRedactedThinkingBlock:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classBetaRedactedThinkingBlockParam:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classBetaRequestDocumentBlock:

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaContentBlockSource:

Contentcontent

Accepts one of the following:

String

List<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"content"constant"content"constant

Accepts one of the following:

CONTENT("content")

classBetaUrlPdfSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileDocumentSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

Optional<String>context

Optional<String>title

classBetaRequestMcpServerToolConfiguration:

Optional<List<String>>allowedTools

Optional<Boolean>enabled

classBetaRequestMcpServerUrlDefinition:

Stringname

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

Optional<String>authorizationToken

Optional<[BetaRequestMcpServerToolConfiguration](https://platform.claude.com/docs/en/api/beta#beta_request_mcp_server_tool_configuration)>toolConfiguration

Optional<List<String>>allowedTools

Optional<Boolean>enabled

classBetaRequestMcpToolResultBlockParam:

StringtoolUseId

JsonValue;type"mcp\_tool\_result"constant"mcp\_tool\_result"constant

Accepts one of the following:

MCP\_TOOL\_RESULT("mcp\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Content>content

Accepts one of the following:

String

List<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)>

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Optional<Boolean>isError

classBetaSearchResultBlockParam:

List<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)>content

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringsource

Stringtitle

JsonValue;type"search\_result"constant"search\_result"constant

Accepts one of the following:

SEARCH\_RESULT("search\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaServerToolUsage:

longwebFetchRequests

The number of web fetch tool requests.

minimum0

longwebSearchRequests

The number of web search tool requests.

minimum0

classBetaServerToolUseBlock:

Stringid

Callercaller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Inputinput

Namename

Accepts one of the following:

WEB\_SEARCH("web\_search")

WEB\_FETCH("web\_fetch")

CODE\_EXECUTION("code\_execution")

BASH\_CODE\_EXECUTION("bash\_code\_execution")

TEXT\_EDITOR\_CODE\_EXECUTION("text\_editor\_code\_execution")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

classBetaServerToolUseBlockParam:

Stringid

Inputinput

Namename

Accepts one of the following:

WEB\_SEARCH("web\_search")

WEB\_FETCH("web\_fetch")

CODE\_EXECUTION("code\_execution")

BASH\_CODE\_EXECUTION("bash\_code\_execution")

TEXT\_EDITOR\_CODE\_EXECUTION("text\_editor\_code\_execution")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaSignatureDelta:

Stringsignature

JsonValue;type"signature\_delta"constant"signature\_delta"constant

Accepts one of the following:

SIGNATURE\_DELTA("signature\_delta")

classBetaSkill:

A skill that was loaded in a container (response model).

StringskillId

Skill ID

maxLength64

minLength1

Typetype

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

ANTHROPIC("anthropic")

CUSTOM("custom")

Stringversion

Skill version or 'latest' for most recent version

maxLength64

minLength1

classBetaSkillParams:

Specification for a skill to be loaded in a container (request model).

StringskillId

Skill ID

maxLength64

minLength1

Typetype

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

ANTHROPIC("anthropic")

CUSTOM("custom")

Optional<String>version

Skill version or 'latest' for most recent version

maxLength64

minLength1

enumBetaStopReason:

END\_TURN("end\_turn")

MAX\_TOKENS("max\_tokens")

STOP\_SEQUENCE("stop\_sequence")

TOOL\_USE("tool\_use")

PAUSE\_TURN("pause\_turn")

REFUSAL("refusal")

MODEL\_CONTEXT\_WINDOW\_EXCEEDED("model\_context\_window\_exceeded")

classBetaTextBlock:

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaTextCitation:A class that can be one of several variants.union

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaTextCitationParam:A class that can be one of several variants.union

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaTextDelta:

Stringtext

JsonValue;type"text\_delta"constant"text\_delta"constant

Accepts one of the following:

TEXT\_DELTA("text\_delta")

classBetaTextEditorCodeExecutionCreateResultBlock:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionCreateResultBlockParam:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlock:

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlockParam:

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

classBetaTextEditorCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaTextEditorCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

Optional<String>errorMessage

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

classBetaTextEditorCodeExecutionViewResultBlock:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

classBetaTextEditorCodeExecutionCreateResultBlock:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlock:

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

StringtoolUseId

JsonValue;type"text\_editor\_code\_execution\_tool\_result"constant"text\_editor\_code\_execution\_tool\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT("text\_editor\_code\_execution\_tool\_result")

classBetaTextEditorCodeExecutionToolResultBlockParam:

Contentcontent

Accepts one of the following:

classBetaTextEditorCodeExecutionToolResultErrorParam:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

Optional<String>errorMessage

classBetaTextEditorCodeExecutionViewResultBlockParam:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

classBetaTextEditorCodeExecutionCreateResultBlockParam:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlockParam:

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

StringtoolUseId

JsonValue;type"text\_editor\_code\_execution\_tool\_result"constant"text\_editor\_code\_execution\_tool\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT("text\_editor\_code\_execution\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaTextEditorCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

Optional<String>errorMessage

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

classBetaTextEditorCodeExecutionToolResultErrorParam:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

Optional<String>errorMessage

classBetaTextEditorCodeExecutionViewResultBlock:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

classBetaTextEditorCodeExecutionViewResultBlockParam:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

classBetaThinkingBlock:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classBetaThinkingBlockParam:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classBetaThinkingConfigDisabled:

JsonValue;type"disabled"constant"disabled"constant

Accepts one of the following:

DISABLED("disabled")

classBetaThinkingConfigEnabled:

longbudgetTokens

Determines how many tokens Claude can use for its internal reasoning process. Larger budgets can enable more thorough analysis for complex problems, improving response quality.

Must be ≥1024 and less than `max_tokens`.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

minimum1024

JsonValue;type"enabled"constant"enabled"constant

Accepts one of the following:

ENABLED("enabled")

classBetaThinkingConfigParam:A class that can be one of several variants.union

Configuration for enabling Claude's extended thinking.

When enabled, responses include `thinking` content blocks showing Claude's thinking process before the final answer. Requires a minimum budget of 1,024 tokens and counts towards your `max_tokens` limit.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

classBetaThinkingConfigEnabled:

longbudgetTokens

Determines how many tokens Claude can use for its internal reasoning process. Larger budgets can enable more thorough analysis for complex problems, improving response quality.

Must be ≥1024 and less than `max_tokens`.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

minimum1024

JsonValue;type"enabled"constant"enabled"constant

Accepts one of the following:

ENABLED("enabled")

classBetaThinkingConfigDisabled:

JsonValue;type"disabled"constant"disabled"constant

Accepts one of the following:

DISABLED("disabled")

classBetaThinkingDelta:

Stringthinking

JsonValue;type"thinking\_delta"constant"thinking\_delta"constant

Accepts one of the following:

THINKING\_DELTA("thinking\_delta")

classBetaThinkingTurns:

JsonValue;type"thinking\_turns"constant"thinking\_turns"constant

Accepts one of the following:

THINKING\_TURNS("thinking\_turns")

longvalue

classBetaTool:

InputSchemainputSchema

[JSON schema](https://json-schema.org/draft/2020-12) for this tool's input.

This defines the shape of the `input` that your tool accepts and that the model will produce.

JsonValue;type"object"constant"object"constant

Accepts one of the following:

OBJECT("object")

Optional<Properties>properties

Optional<List<String>>required

Stringname

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

maxLength128

minLength1

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<String>description

Description of what this tool does.

Tool descriptions should be as detailed as possible. The more information that the model has about what the tool is and how to use it, the better it will perform. You can use natural language descriptions to reinforce important aspects of the tool input JSON schema.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

Optional<Type>type

Accepts one of the following:

CUSTOM("custom")

classBetaToolBash20241022:

JsonValue;name"bash"constant"bash"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

BASH("bash")

JsonValue;type"bash\_20241022"constant"bash\_20241022"constant

Accepts one of the following:

BASH\_20241022("bash\_20241022")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolBash20250124:

JsonValue;name"bash"constant"bash"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

BASH("bash")

JsonValue;type"bash\_20250124"constant"bash\_20250124"constant

Accepts one of the following:

BASH\_20250124("bash\_20250124")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolChoice:A class that can be one of several variants.union

How the model should use the provided tools. The model can use a specific tool, any available tool, decide by itself, or not use tools at all.

classBetaToolChoiceAuto:

The model will automatically decide whether to use tools.

JsonValue;type"auto"constant"auto"constant

Accepts one of the following:

AUTO("auto")

Optional<Boolean>disableParallelToolUse

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output at most one tool use.

classBetaToolChoiceAny:

The model will use any available tools.

JsonValue;type"any"constant"any"constant

Accepts one of the following:

ANY("any")

Optional<Boolean>disableParallelToolUse

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

classBetaToolChoiceTool:

The model will use the specified tool with `tool_choice.name`.

Stringname

The name of the tool to use.

JsonValue;type"tool"constant"tool"constant

Accepts one of the following:

TOOL("tool")

Optional<Boolean>disableParallelToolUse

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

classBetaToolChoiceNone:

The model will not be allowed to use tools.

JsonValue;type"none"constant"none"constant

Accepts one of the following:

NONE("none")

classBetaToolChoiceAny:

The model will use any available tools.

JsonValue;type"any"constant"any"constant

Accepts one of the following:

ANY("any")

Optional<Boolean>disableParallelToolUse

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

classBetaToolChoiceAuto:

The model will automatically decide whether to use tools.

JsonValue;type"auto"constant"auto"constant

Accepts one of the following:

AUTO("auto")

Optional<Boolean>disableParallelToolUse

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output at most one tool use.

classBetaToolChoiceNone:

The model will not be allowed to use tools.

JsonValue;type"none"constant"none"constant

Accepts one of the following:

NONE("none")

classBetaToolChoiceTool:

The model will use the specified tool with `tool_choice.name`.

Stringname

The name of the tool to use.

JsonValue;type"tool"constant"tool"constant

Accepts one of the following:

TOOL("tool")

Optional<Boolean>disableParallelToolUse

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

classBetaToolComputerUse20241022:

longdisplayHeightPx

The height of the display in pixels.

minimum1

longdisplayWidthPx

The width of the display in pixels.

minimum1

JsonValue;name"computer"constant"computer"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

COMPUTER("computer")

JsonValue;type"computer\_20241022"constant"computer\_20241022"constant

Accepts one of the following:

COMPUTER\_20241022("computer\_20241022")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Long>displayNumber

The X11 display number (e.g. 0, 1) for the display.

minimum0

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolComputerUse20250124:

longdisplayHeightPx

The height of the display in pixels.

minimum1

longdisplayWidthPx

The width of the display in pixels.

minimum1

JsonValue;name"computer"constant"computer"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

COMPUTER("computer")

JsonValue;type"computer\_20250124"constant"computer\_20250124"constant

Accepts one of the following:

COMPUTER\_20250124("computer\_20250124")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Long>displayNumber

The X11 display number (e.g. 0, 1) for the display.

minimum0

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolComputerUse20251124:

longdisplayHeightPx

The height of the display in pixels.

minimum1

longdisplayWidthPx

The width of the display in pixels.

minimum1

JsonValue;name"computer"constant"computer"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

COMPUTER("computer")

JsonValue;type"computer\_20251124"constant"computer\_20251124"constant

Accepts one of the following:

COMPUTER\_20251124("computer\_20251124")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Long>displayNumber

The X11 display number (e.g. 0, 1) for the display.

minimum0

Optional<Boolean>enableZoom

Whether to enable an action to take a zoomed-in screenshot of the screen.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolReferenceBlock:

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

classBetaToolReferenceBlockParam:

Tool reference block that can be included in tool\_result content.

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaToolResultBlockParam:

StringtoolUseId

JsonValue;type"tool\_result"constant"tool\_result"constant

Accepts one of the following:

TOOL\_RESULT("tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Content>content

Accepts one of the following:

String

List<Block>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaSearchResultBlockParam:

List<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param)>content

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringsource

Stringtitle

JsonValue;type"search\_result"constant"search\_result"constant

Accepts one of the following:

SEARCH\_RESULT("search\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

classBetaRequestDocumentBlock:

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaContentBlockSource:

Contentcontent

Accepts one of the following:

String

List<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"content"constant"content"constant

Accepts one of the following:

CONTENT("content")

classBetaUrlPdfSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileDocumentSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

Optional<String>context

Optional<String>title

classBetaToolReferenceBlockParam:

Tool reference block that can be included in tool\_result content.

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>isError

classBetaToolSearchToolBm25\_20251119:

JsonValue;name"tool\_search\_tool\_bm25"constant"tool\_search\_tool\_bm25"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

Typetype

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_BM25\_20251119("tool\_search\_tool\_bm25\_20251119")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Boolean>strict

classBetaToolSearchToolRegex20251119:

JsonValue;name"tool\_search\_tool\_regex"constant"tool\_search\_tool\_regex"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

Typetype

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_REGEX\_20251119("tool\_search\_tool\_regex\_20251119")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Boolean>strict

classBetaToolSearchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaToolSearchToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

Optional<String>errorMessage

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolSearchResultBlock:

List<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

StringtoolUseId

JsonValue;type"tool\_search\_tool\_result"constant"tool\_search\_tool\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT("tool\_search\_tool\_result")

classBetaToolSearchToolResultBlockParam:

Contentcontent

Accepts one of the following:

classBetaToolSearchToolResultErrorParam:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolSearchResultBlockParam:

List<[BetaToolReferenceBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block_param)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

StringtoolUseId

JsonValue;type"tool\_search\_tool\_result"constant"tool\_search\_tool\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT("tool\_search\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaToolSearchToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

Optional<String>errorMessage

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolResultErrorParam:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolSearchResultBlock:

List<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

classBetaToolSearchToolSearchResultBlockParam:

List<[BetaToolReferenceBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block_param)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

classBetaToolTextEditor20241022:

JsonValue;name"str\_replace\_editor"constant"str\_replace\_editor"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

STR\_REPLACE\_EDITOR("str\_replace\_editor")

JsonValue;type"text\_editor\_20241022"constant"text\_editor\_20241022"constant

Accepts one of the following:

TEXT\_EDITOR\_20241022("text\_editor\_20241022")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolTextEditor20250124:

JsonValue;name"str\_replace\_editor"constant"str\_replace\_editor"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

STR\_REPLACE\_EDITOR("str\_replace\_editor")

JsonValue;type"text\_editor\_20250124"constant"text\_editor\_20250124"constant

Accepts one of the following:

TEXT\_EDITOR\_20250124("text\_editor\_20250124")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolTextEditor20250429:

JsonValue;name"str\_replace\_based\_edit\_tool"constant"str\_replace\_based\_edit\_tool"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

STR\_REPLACE\_BASED\_EDIT\_TOOL("str\_replace\_based\_edit\_tool")

JsonValue;type"text\_editor\_20250429"constant"text\_editor\_20250429"constant

Accepts one of the following:

TEXT\_EDITOR\_20250429("text\_editor\_20250429")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolTextEditor20250728:

JsonValue;name"str\_replace\_based\_edit\_tool"constant"str\_replace\_based\_edit\_tool"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

STR\_REPLACE\_BASED\_EDIT\_TOOL("str\_replace\_based\_edit\_tool")

JsonValue;type"text\_editor\_20250728"constant"text\_editor\_20250728"constant

Accepts one of the following:

TEXT\_EDITOR\_20250728("text\_editor\_20250728")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<List<InputExample>>inputExamples

Optional<Long>maxCharacters

Maximum number of characters to display when viewing a file. If not specified, defaults to displaying the full file.

minimum1

Optional<Boolean>strict

classBetaToolUnion:A class that can be one of several variants.union

Configuration for a group of tools from an MCP server.

Allows configuring enabled status and defer\_loading for all tools
from an MCP server, with optional per-tool overrides.

classBetaTool:

InputSchemainputSchema

[JSON schema](https://json-schema.org/draft/2020-12) for this tool's input.

This defines the shape of the `input` that your tool accepts and that the model will produce.

JsonValue;type"object"constant"object"constant

Accepts one of the following:

OBJECT("object")

Optional<Properties>properties

Optional<List<String>>required

Stringname

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

maxLength128

minLength1

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<String>description

Description of what this tool does.

Tool descriptions should be as detailed as possible. The more information that the model has about what the tool is and how to use it, the better it will perform. You can use natural language descriptions to reinforce important aspects of the tool input JSON schema.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

Optional<Type>type

Accepts one of the following:

CUSTOM("custom")

classBetaToolBash20241022:

JsonValue;name"bash"constant"bash"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

BASH("bash")

JsonValue;type"bash\_20241022"constant"bash\_20241022"constant

Accepts one of the following:

BASH\_20241022("bash\_20241022")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolBash20250124:

JsonValue;name"bash"constant"bash"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

BASH("bash")

JsonValue;type"bash\_20250124"constant"bash\_20250124"constant

Accepts one of the following:

BASH\_20250124("bash\_20250124")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaCodeExecutionTool20250522:

JsonValue;name"code\_execution"constant"code\_execution"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

CODE\_EXECUTION("code\_execution")

JsonValue;type"code\_execution\_20250522"constant"code\_execution\_20250522"constant

Accepts one of the following:

CODE\_EXECUTION\_20250522("code\_execution\_20250522")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Boolean>strict

classBetaCodeExecutionTool20250825:

JsonValue;name"code\_execution"constant"code\_execution"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

CODE\_EXECUTION("code\_execution")

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Boolean>strict

classBetaToolComputerUse20241022:

longdisplayHeightPx

The height of the display in pixels.

minimum1

longdisplayWidthPx

The width of the display in pixels.

minimum1

JsonValue;name"computer"constant"computer"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

COMPUTER("computer")

JsonValue;type"computer\_20241022"constant"computer\_20241022"constant

Accepts one of the following:

COMPUTER\_20241022("computer\_20241022")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Long>displayNumber

The X11 display number (e.g. 0, 1) for the display.

minimum0

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaMemoryTool20250818:

JsonValue;name"memory"constant"memory"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

MEMORY("memory")

JsonValue;type"memory\_20250818"constant"memory\_20250818"constant

Accepts one of the following:

MEMORY\_20250818("memory\_20250818")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolComputerUse20250124:

longdisplayHeightPx

The height of the display in pixels.

minimum1

longdisplayWidthPx

The width of the display in pixels.

minimum1

JsonValue;name"computer"constant"computer"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

COMPUTER("computer")

JsonValue;type"computer\_20250124"constant"computer\_20250124"constant

Accepts one of the following:

COMPUTER\_20250124("computer\_20250124")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Long>displayNumber

The X11 display number (e.g. 0, 1) for the display.

minimum0

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolTextEditor20241022:

JsonValue;name"str\_replace\_editor"constant"str\_replace\_editor"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

STR\_REPLACE\_EDITOR("str\_replace\_editor")

JsonValue;type"text\_editor\_20241022"constant"text\_editor\_20241022"constant

Accepts one of the following:

TEXT\_EDITOR\_20241022("text\_editor\_20241022")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolComputerUse20251124:

longdisplayHeightPx

The height of the display in pixels.

minimum1

longdisplayWidthPx

The width of the display in pixels.

minimum1

JsonValue;name"computer"constant"computer"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

COMPUTER("computer")

JsonValue;type"computer\_20251124"constant"computer\_20251124"constant

Accepts one of the following:

COMPUTER\_20251124("computer\_20251124")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Long>displayNumber

The X11 display number (e.g. 0, 1) for the display.

minimum0

Optional<Boolean>enableZoom

Whether to enable an action to take a zoomed-in screenshot of the screen.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolTextEditor20250124:

JsonValue;name"str\_replace\_editor"constant"str\_replace\_editor"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

STR\_REPLACE\_EDITOR("str\_replace\_editor")

JsonValue;type"text\_editor\_20250124"constant"text\_editor\_20250124"constant

Accepts one of the following:

TEXT\_EDITOR\_20250124("text\_editor\_20250124")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolTextEditor20250429:

JsonValue;name"str\_replace\_based\_edit\_tool"constant"str\_replace\_based\_edit\_tool"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

STR\_REPLACE\_BASED\_EDIT\_TOOL("str\_replace\_based\_edit\_tool")

JsonValue;type"text\_editor\_20250429"constant"text\_editor\_20250429"constant

Accepts one of the following:

TEXT\_EDITOR\_20250429("text\_editor\_20250429")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<List<InputExample>>inputExamples

Optional<Boolean>strict

classBetaToolTextEditor20250728:

JsonValue;name"str\_replace\_based\_edit\_tool"constant"str\_replace\_based\_edit\_tool"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

STR\_REPLACE\_BASED\_EDIT\_TOOL("str\_replace\_based\_edit\_tool")

JsonValue;type"text\_editor\_20250728"constant"text\_editor\_20250728"constant

Accepts one of the following:

TEXT\_EDITOR\_20250728("text\_editor\_20250728")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<List<InputExample>>inputExamples

Optional<Long>maxCharacters

Maximum number of characters to display when viewing a file. If not specified, defaults to displaying the full file.

minimum1

Optional<Boolean>strict

classBetaWebSearchTool20250305:

JsonValue;name"web\_search"constant"web\_search"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

WEB\_SEARCH("web\_search")

JsonValue;type"web\_search\_20250305"constant"web\_search\_20250305"constant

Accepts one of the following:

WEB\_SEARCH\_20250305("web\_search\_20250305")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<List<String>>allowedDomains

If provided, only these domains will be included in results. Cannot be used alongside `blocked_domains`.

Optional<List<String>>blockedDomains

If provided, these domains will never appear in results. Cannot be used alongside `allowed_domains`.

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Long>maxUses

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

Optional<Boolean>strict

Optional<UserLocation>userLocation

Parameters for the user's location. Used to provide more relevant search results.

JsonValue;type"approximate"constant"approximate"constant

Accepts one of the following:

APPROXIMATE("approximate")

Optional<String>city

The city of the user.

maxLength255

minLength1

Optional<String>country

The two letter [ISO country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) of the user.

maxLength2

minLength2

Optional<String>region

The region of the user.

maxLength255

minLength1

Optional<String>timezone

The [IANA timezone](https://nodatime.org/TimeZones) of the user.

maxLength255

minLength1

classBetaWebFetchTool20250910:

JsonValue;name"web\_fetch"constant"web\_fetch"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

WEB\_FETCH("web\_fetch")

JsonValue;type"web\_fetch\_20250910"constant"web\_fetch\_20250910"constant

Accepts one of the following:

WEB\_FETCH\_20250910("web\_fetch\_20250910")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<List<String>>allowedDomains

List of domains to allow fetching from

Optional<List<String>>blockedDomains

List of domains to block fetching from

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Citations configuration for fetched documents. Citations are disabled by default.

Optional<Boolean>enabled

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Long>maxContentTokens

Maximum number of tokens used by including web page text content in the context. The limit is approximate and does not apply to binary content such as PDFs.

exclusiveMinimum0

Optional<Long>maxUses

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

Optional<Boolean>strict

classBetaToolSearchToolBm25\_20251119:

JsonValue;name"tool\_search\_tool\_bm25"constant"tool\_search\_tool\_bm25"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

Typetype

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_BM25\_20251119("tool\_search\_tool\_bm25\_20251119")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Boolean>strict

classBetaToolSearchToolRegex20251119:

JsonValue;name"tool\_search\_tool\_regex"constant"tool\_search\_tool\_regex"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

Typetype

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_REGEX\_20251119("tool\_search\_tool\_regex\_20251119")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Boolean>strict

classBetaMcpToolset:

Configuration for a group of tools from an MCP server.

Allows configuring enabled status and defer\_loading for all tools
from an MCP server, with optional per-tool overrides.

StringmcpServerName

Name of the MCP server to configure tools for

maxLength255

minLength1

JsonValue;type"mcp\_toolset"constant"mcp\_toolset"constant

Accepts one of the following:

MCP\_TOOLSET("mcp\_toolset")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Configs>configs

Configuration overrides for specific tools, keyed by tool name

Optional<Boolean>deferLoading

Optional<Boolean>enabled

Optional<[BetaMcpToolDefaultConfig](https://platform.claude.com/docs/en/api/beta#beta_mcp_tool_default_config)>defaultConfig

Default configuration applied to all tools from this server

Optional<Boolean>deferLoading

Optional<Boolean>enabled

classBetaToolUseBlock:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaToolUseBlockParam:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaToolUsesKeep:

JsonValue;type"tool\_uses"constant"tool\_uses"constant

Accepts one of the following:

TOOL\_USES("tool\_uses")

longvalue

classBetaToolUsesTrigger:

JsonValue;type"tool\_uses"constant"tool\_uses"constant

Accepts one of the following:

TOOL\_USES("tool\_uses")

longvalue

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaUrlPdfSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaUsage:

Optional<[BetaCacheCreation](https://platform.claude.com/docs/en/api/beta#beta_cache_creation)>cacheCreation

Breakdown of cached tokens by TTL

longephemeral1hInputTokens

The number of input tokens used to create the 1 hour cache entry.

minimum0

longephemeral5mInputTokens

The number of input tokens used to create the 5 minute cache entry.

minimum0

Optional<Long>cacheCreationInputTokens

The number of input tokens used to create the cache entry.

minimum0

Optional<Long>cacheReadInputTokens

The number of input tokens read from the cache.

minimum0

longinputTokens

The number of input tokens which were used.

minimum0

longoutputTokens

The number of output tokens which were used.

minimum0

Optional<[BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage)>serverToolUse

The number of server tool requests.

longwebFetchRequests

The number of web fetch tool requests.

minimum0

longwebSearchRequests

The number of web search tool requests.

minimum0

Optional<ServiceTier>serviceTier

If the request used the priority, standard, or batch tier.

Accepts one of the following:

STANDARD("standard")

PRIORITY("priority")

BATCH("batch")

classBetaWebFetchBlock:

[BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)content

Optional<[BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config)>citations

Citation configuration for the document

booleanenabled

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<String>title

The title of the document

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

classBetaWebFetchBlockParam:

[BetaRequestDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_request_document_block)content

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaContentBlockSource:

Contentcontent

Accepts one of the following:

String

List<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"content"constant"content"constant

Accepts one of the following:

CONTENT("content")

classBetaUrlPdfSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileDocumentSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

Optional<String>context

Optional<String>title

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

classBetaWebFetchTool20250910:

JsonValue;name"web\_fetch"constant"web\_fetch"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

WEB\_FETCH("web\_fetch")

JsonValue;type"web\_fetch\_20250910"constant"web\_fetch\_20250910"constant

Accepts one of the following:

WEB\_FETCH\_20250910("web\_fetch\_20250910")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<List<String>>allowedDomains

List of domains to allow fetching from

Optional<List<String>>blockedDomains

List of domains to block fetching from

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Citations configuration for fetched documents. Citations are disabled by default.

Optional<Boolean>enabled

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Long>maxContentTokens

Maximum number of tokens used by including web page text content in the context. The limit is approximate and does not apply to binary content such as PDFs.

exclusiveMinimum0

Optional<Long>maxUses

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

Optional<Boolean>strict

classBetaWebFetchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaWebFetchToolResultErrorBlock:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

classBetaWebFetchBlock:

[BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)content

Optional<[BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config)>citations

Citation configuration for the document

booleanenabled

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<String>title

The title of the document

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

StringtoolUseId

JsonValue;type"web\_fetch\_tool\_result"constant"web\_fetch\_tool\_result"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT("web\_fetch\_tool\_result")

classBetaWebFetchToolResultBlockParam:

Contentcontent

Accepts one of the following:

classBetaWebFetchToolResultErrorBlockParam:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

classBetaWebFetchBlockParam:

[BetaRequestDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_request_document_block)content

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaContentBlockSource:

Contentcontent

Accepts one of the following:

String

List<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

classBetaTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<List<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>>citations

Accepts one of the following:

classBetaCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classBetaImageBlockParam:

Sourcesource

Accepts one of the following:

classBetaBase64ImageSource:

Stringdata

MediaTypemediaType

Accepts one of the following:

IMAGE\_JPEG("image/jpeg")

IMAGE\_PNG("image/png")

IMAGE\_GIF("image/gif")

IMAGE\_WEBP("image/webp")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileImageSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

JsonValue;type"content"constant"content"constant

Accepts one of the following:

CONTENT("content")

classBetaUrlPdfSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classBetaFileDocumentSource:

StringfileId

JsonValue;type"file"constant"file"constant

Accepts one of the following:

FILE("file")

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<[BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param)>citations

Optional<Boolean>enabled

Optional<String>context

Optional<String>title

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

StringtoolUseId

JsonValue;type"web\_fetch\_tool\_result"constant"web\_fetch\_tool\_result"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT("web\_fetch\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaWebFetchToolResultErrorBlock:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

classBetaWebFetchToolResultErrorBlockParam:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

enumBetaWebFetchToolResultErrorCode:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

classBetaWebSearchResultBlock:

StringencryptedContent

Optional<String>pageAge

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

classBetaWebSearchResultBlockParam:

StringencryptedContent

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

Optional<String>pageAge

classBetaWebSearchTool20250305:

JsonValue;name"web\_search"constant"web\_search"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

WEB\_SEARCH("web\_search")

JsonValue;type"web\_search\_20250305"constant"web\_search\_20250305"constant

Accepts one of the following:

WEB\_SEARCH\_20250305("web\_search\_20250305")

Optional<List<AllowedCaller>>allowedCallers

Accepts one of the following:

DIRECT("direct")

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Optional<List<String>>allowedDomains

If provided, only these domains will be included in results. Cannot be used alongside `blocked_domains`.

Optional<List<String>>blockedDomains

If provided, these domains will never appear in results. Cannot be used alongside `allowed_domains`.

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

Optional<Boolean>deferLoading

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

Optional<Long>maxUses

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

Optional<Boolean>strict

Optional<UserLocation>userLocation

Parameters for the user's location. Used to provide more relevant search results.

JsonValue;type"approximate"constant"approximate"constant

Accepts one of the following:

APPROXIMATE("approximate")

Optional<String>city

The city of the user.

maxLength255

minLength1

Optional<String>country

The two letter [ISO country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) of the user.

maxLength2

minLength2

Optional<String>region

The region of the user.

maxLength255

minLength1

Optional<String>timezone

The [IANA timezone](https://nodatime.org/TimeZones) of the user.

maxLength255

minLength1

classBetaWebSearchToolRequestError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

classBetaWebSearchToolResultBlock:

[BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)content

Accepts one of the following:

classBetaWebSearchToolResultError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

List<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)>

StringencryptedContent

Optional<String>pageAge

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

StringtoolUseId

JsonValue;type"web\_search\_tool\_result"constant"web\_search\_tool\_result"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT("web\_search\_tool\_result")

classBetaWebSearchToolResultBlockContent:A class that can be one of several variants.union

classBetaWebSearchToolResultError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

List<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)>

StringencryptedContent

Optional<String>pageAge

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

classBetaWebSearchToolResultBlockParam:

[BetaWebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_param_content)content

Accepts one of the following:

List<[BetaWebSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block_param)>

StringencryptedContent

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

Optional<String>pageAge

classBetaWebSearchToolRequestError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

StringtoolUseId

JsonValue;type"web\_search\_tool\_result"constant"web\_search\_tool\_result"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT("web\_search\_tool\_result")

Optional<[BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral)>cacheControl

Create a cache control breakpoint at this content block.

JsonValue;type"ephemeral"constant"ephemeral"constant

Accepts one of the following:

EPHEMERAL("ephemeral")

Optional<Ttl>ttl

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

TTL\_5M("5m")

TTL\_1H("1h")

classBetaWebSearchToolResultBlockParamContent:A class that can be one of several variants.union

List<[BetaWebSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block_param)>

StringencryptedContent

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

Optional<String>pageAge

classBetaWebSearchToolRequestError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

classBetaWebSearchToolResultError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

enumBetaWebSearchToolResultErrorCode:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

#### MessagesBatches

##### [Create a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/create)

[BetaMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_message_batch)beta().messages().batches().create(BatchCreateParamsparams, RequestOptionsrequestOptions=RequestOptions.none())

post/v1/messages/batches

##### [Retrieve a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/retrieve)

[BetaMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_message_batch)beta().messages().batches().retrieve(BatchRetrieveParamsparams=BatchRetrieveParams.none(), RequestOptionsrequestOptions=RequestOptions.none())

get/v1/messages/batches/{message\_batch\_id}

##### [List Message Batches](https://platform.claude.com/docs/en/api/beta/messages/batches/list)

BatchListPagebeta().messages().batches().list(BatchListParamsparams=BatchListParams.none(), RequestOptionsrequestOptions=RequestOptions.none())

get/v1/messages/batches

##### [Cancel a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/cancel)

[BetaMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_message_batch)beta().messages().batches().cancel(BatchCancelParamsparams=BatchCancelParams.none(), RequestOptionsrequestOptions=RequestOptions.none())

post/v1/messages/batches/{message\_batch\_id}/cancel

##### [Delete a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/delete)

[BetaDeletedMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_deleted_message_batch)beta().messages().batches().delete(BatchDeleteParamsparams=BatchDeleteParams.none(), RequestOptionsrequestOptions=RequestOptions.none())

delete/v1/messages/batches/{message\_batch\_id}

##### [Retrieve Message Batch results](https://platform.claude.com/docs/en/api/beta/messages/batches/results)

[BetaMessageBatchIndividualResponse](https://platform.claude.com/docs/en/api/beta#beta_message_batch_individual_response)beta().messages().batches().resultsStreaming(BatchResultsParamsparams=BatchResultsParams.none(), RequestOptionsrequestOptions=RequestOptions.none())

get/v1/messages/batches/{message\_batch\_id}/results

##### ModelsExpand Collapse

classBetaDeletedMessageBatch:

Stringid

ID of the Message Batch.

JsonValue;type"message\_batch\_deleted"constant"message\_batch\_deleted"constant

Deleted object type.

For Message Batches, this is always `"message_batch_deleted"`.

Accepts one of the following:

MESSAGE\_BATCH\_DELETED("message\_batch\_deleted")

classBetaMessageBatch:

Stringid

Unique object identifier.

The format and length of IDs may change over time.

Optional<LocalDateTime>archivedAt

RFC 3339 datetime string representing the time at which the Message Batch was archived and its results became unavailable.

formatdate-time

Optional<LocalDateTime>cancelInitiatedAt

RFC 3339 datetime string representing the time at which cancellation was initiated for the Message Batch. Specified only if cancellation was initiated.

formatdate-time

LocalDateTimecreatedAt

RFC 3339 datetime string representing the time at which the Message Batch was created.

formatdate-time

Optional<LocalDateTime>endedAt

RFC 3339 datetime string representing the time at which processing for the Message Batch ended. Specified only once processing ends.

Processing ends when every request in a Message Batch has either succeeded, errored, canceled, or expired.

formatdate-time

LocalDateTimeexpiresAt

RFC 3339 datetime string representing the time at which the Message Batch will expire and end processing, which is 24 hours after creation.

formatdate-time

ProcessingStatusprocessingStatus

Processing status of the Message Batch.

Accepts one of the following:

IN\_PROGRESS("in\_progress")

CANCELING("canceling")

ENDED("ended")

[BetaMessageBatchRequestCounts](https://platform.claude.com/docs/en/api/beta#beta_message_batch_request_counts)requestCounts

Tallies requests within the Message Batch, categorized by their status.

Requests start as `processing` and move to one of the other statuses only once processing of the entire batch ends. The sum of all values always matches the total number of requests in the batch.

longcanceled

Number of requests in the Message Batch that have been canceled.

This is zero until processing of the entire Message Batch has ended.

longerrored

Number of requests in the Message Batch that encountered an error.

This is zero until processing of the entire Message Batch has ended.

longexpired

Number of requests in the Message Batch that have expired.

This is zero until processing of the entire Message Batch has ended.

longprocessing

Number of requests in the Message Batch that are processing.

longsucceeded

Number of requests in the Message Batch that have completed successfully.

This is zero until processing of the entire Message Batch has ended.

Optional<String>resultsUrl

URL to a `.jsonl` file containing the results of the Message Batch requests. Specified only once processing ends.

Results in the file are not guaranteed to be in the same order as requests. Use the `custom_id` field to match results to requests.

JsonValue;type"message\_batch"constant"message\_batch"constant

Object type.

For Message Batches, this is always `"message_batch"`.

Accepts one of the following:

MESSAGE\_BATCH("message\_batch")

classBetaMessageBatchCanceledResult:

JsonValue;type"canceled"constant"canceled"constant

Accepts one of the following:

CANCELED("canceled")

classBetaMessageBatchErroredResult:

[BetaErrorResponse](https://platform.claude.com/docs/en/api/beta#beta_error_response)error

[BetaError](https://platform.claude.com/docs/en/api/beta#beta_error)error

Accepts one of the following:

classBetaInvalidRequestError:

Stringmessage

JsonValue;type"invalid\_request\_error"constant"invalid\_request\_error"constant

Accepts one of the following:

INVALID\_REQUEST\_ERROR("invalid\_request\_error")

classBetaAuthenticationError:

Stringmessage

JsonValue;type"authentication\_error"constant"authentication\_error"constant

Accepts one of the following:

AUTHENTICATION\_ERROR("authentication\_error")

classBetaBillingError:

Stringmessage

JsonValue;type"billing\_error"constant"billing\_error"constant

Accepts one of the following:

BILLING\_ERROR("billing\_error")

classBetaPermissionError:

Stringmessage

JsonValue;type"permission\_error"constant"permission\_error"constant

Accepts one of the following:

PERMISSION\_ERROR("permission\_error")

classBetaNotFoundError:

Stringmessage

JsonValue;type"not\_found\_error"constant"not\_found\_error"constant

Accepts one of the following:

NOT\_FOUND\_ERROR("not\_found\_error")

classBetaRateLimitError:

Stringmessage

JsonValue;type"rate\_limit\_error"constant"rate\_limit\_error"constant

Accepts one of the following:

RATE\_LIMIT\_ERROR("rate\_limit\_error")

classBetaGatewayTimeoutError:

Stringmessage

JsonValue;type"timeout\_error"constant"timeout\_error"constant

Accepts one of the following:

TIMEOUT\_ERROR("timeout\_error")

classBetaApiError:

Stringmessage

JsonValue;type"api\_error"constant"api\_error"constant

Accepts one of the following:

API\_ERROR("api\_error")

classBetaOverloadedError:

Stringmessage

JsonValue;type"overloaded\_error"constant"overloaded\_error"constant

Accepts one of the following:

OVERLOADED\_ERROR("overloaded\_error")

Optional<String>requestId

JsonValue;type"error"constant"error"constant

Accepts one of the following:

ERROR("error")

JsonValue;type"errored"constant"errored"constant

Accepts one of the following:

ERRORED("errored")

classBetaMessageBatchExpiredResult:

JsonValue;type"expired"constant"expired"constant

Accepts one of the following:

EXPIRED("expired")

classBetaMessageBatchIndividualResponse:

This is a single line in the response `.jsonl` file and does not represent the response as a whole.

StringcustomId

Developer-provided ID created for each request in a Message Batch. Useful for matching results to requests, as results may be given out of request order.

Must be unique for each request within the Message Batch.

[BetaMessageBatchResult](https://platform.claude.com/docs/en/api/beta#beta_message_batch_result)result

Processing result for this request.

Contains a Message output if processing was successful, an error response if processing failed, or the reason why processing was not attempted, such as cancellation or expiration.

Accepts one of the following:

classBetaMessageBatchSucceededResult:

[BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message)message

Stringid

Unique object identifier.

The format and length of IDs may change over time.

Optional<[BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container)>container

Information about the container used in the request (for the code execution tool)

Stringid

Identifier for the container used in this request

LocalDateTimeexpiresAt

The time at which the container will expire.

formatdate-time

Optional<List<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)>>skills

Skills loaded in the container

StringskillId

Skill ID

maxLength64

minLength1

Typetype

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

ANTHROPIC("anthropic")

CUSTOM("custom")

Stringversion

Skill version or 'latest' for most recent version

maxLength64

minLength1

List<[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)>content

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

classBetaTextBlock:

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaThinkingBlock:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classBetaRedactedThinkingBlock:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classBetaToolUseBlock:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaServerToolUseBlock:

Stringid

Callercaller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Inputinput

Namename

Accepts one of the following:

WEB\_SEARCH("web\_search")

WEB\_FETCH("web\_fetch")

CODE\_EXECUTION("code\_execution")

BASH\_CODE\_EXECUTION("bash\_code\_execution")

TEXT\_EDITOR\_CODE\_EXECUTION("text\_editor\_code\_execution")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

classBetaWebSearchToolResultBlock:

[BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)content

Accepts one of the following:

classBetaWebSearchToolResultError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

List<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)>

StringencryptedContent

Optional<String>pageAge

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

StringtoolUseId

JsonValue;type"web\_search\_tool\_result"constant"web\_search\_tool\_result"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT("web\_search\_tool\_result")

classBetaWebFetchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaWebFetchToolResultErrorBlock:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

classBetaWebFetchBlock:

[BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)content

Optional<[BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config)>citations

Citation configuration for the document

booleanenabled

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<String>title

The title of the document

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

StringtoolUseId

JsonValue;type"web\_fetch\_tool\_result"constant"web\_fetch\_tool\_result"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT("web\_fetch\_tool\_result")

classBetaCodeExecutionToolResultBlock:

[BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)content

Accepts one of the following:

classBetaCodeExecutionToolResultError:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlock:

List<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

StringtoolUseId

JsonValue;type"code\_execution\_tool\_result"constant"code\_execution\_tool\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT("code\_execution\_tool\_result")

classBetaBashCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaBashCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaBashCodeExecutionResultBlock:

List<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

StringtoolUseId

JsonValue;type"bash\_code\_execution\_tool\_result"constant"bash\_code\_execution\_tool\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT("bash\_code\_execution\_tool\_result")

classBetaTextEditorCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaTextEditorCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

Optional<String>errorMessage

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

classBetaTextEditorCodeExecutionViewResultBlock:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

classBetaTextEditorCodeExecutionCreateResultBlock:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlock:

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

StringtoolUseId

JsonValue;type"text\_editor\_code\_execution\_tool\_result"constant"text\_editor\_code\_execution\_tool\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT("text\_editor\_code\_execution\_tool\_result")

classBetaToolSearchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaToolSearchToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

Optional<String>errorMessage

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolSearchResultBlock:

List<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

StringtoolUseId

JsonValue;type"tool\_search\_tool\_result"constant"tool\_search\_tool\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT("tool\_search\_tool\_result")

classBetaMcpToolUseBlock:

Stringid

Inputinput

Stringname

The name of the MCP tool

StringserverName

The name of the MCP server

JsonValue;type"mcp\_tool\_use"constant"mcp\_tool\_use"constant

Accepts one of the following:

MCP\_TOOL\_USE("mcp\_tool\_use")

classBetaMcpToolResultBlock:

Contentcontent

Accepts one of the following:

String

List<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)>

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

booleanisError

StringtoolUseId

JsonValue;type"mcp\_tool\_result"constant"mcp\_tool\_result"constant

Accepts one of the following:

MCP\_TOOL\_RESULT("mcp\_tool\_result")

classBetaContainerUploadBlock:

Response model for a file uploaded to the container.

StringfileId

JsonValue;type"container\_upload"constant"container\_upload"constant

Accepts one of the following:

CONTAINER\_UPLOAD("container\_upload")

Optional<[BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response)>contextManagement

Context management response.

Information about context management strategies applied during the request.

List<AppliedEdit>appliedEdits

List of context management edits that were applied.

Accepts one of the following:

classBetaClearToolUses20250919EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedToolUses

Number of tool uses that were cleared.

minimum0

JsonValue;type"clear\_tool\_uses\_20250919"constant"clear\_tool\_uses\_20250919"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_TOOL\_USES\_20250919("clear\_tool\_uses\_20250919")

classBetaClearThinking20251015EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedThinkingTurns

Number of thinking turns that were cleared.

minimum0

JsonValue;type"clear\_thinking\_20251015"constant"clear\_thinking\_20251015"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_THINKING\_20251015("clear\_thinking\_20251015")

Modelmodel

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

CLAUDE\_OPUS\_4\_5\_20251101("claude-opus-4-5-20251101")

Premium model combining maximum intelligence with practical performance

CLAUDE\_OPUS\_4\_5("claude-opus-4-5")

Premium model combining maximum intelligence with practical performance

CLAUDE\_3\_7\_SONNET\_LATEST("claude-3-7-sonnet-latest")

High-performance model with early extended thinking

CLAUDE\_3\_7\_SONNET\_20250219("claude-3-7-sonnet-20250219")

High-performance model with early extended thinking

CLAUDE\_3\_5\_HAIKU\_LATEST("claude-3-5-haiku-latest")

Fastest and most compact model for near-instant responsiveness

CLAUDE\_3\_5\_HAIKU\_20241022("claude-3-5-haiku-20241022")

Our fastest model

CLAUDE\_HAIKU\_4\_5("claude-haiku-4-5")

Hybrid model, capable of near-instant responses and extended thinking

CLAUDE\_HAIKU\_4\_5\_20251001("claude-haiku-4-5-20251001")

Hybrid model, capable of near-instant responses and extended thinking

CLAUDE\_SONNET\_4\_20250514("claude-sonnet-4-20250514")

High-performance model with extended thinking

CLAUDE\_SONNET\_4\_0("claude-sonnet-4-0")

High-performance model with extended thinking

CLAUDE\_4\_SONNET\_20250514("claude-4-sonnet-20250514")

High-performance model with extended thinking

CLAUDE\_SONNET\_4\_5("claude-sonnet-4-5")

Our best model for real-world agents and coding

CLAUDE\_SONNET\_4\_5\_20250929("claude-sonnet-4-5-20250929")

Our best model for real-world agents and coding

CLAUDE\_OPUS\_4\_0("claude-opus-4-0")

Our most capable model

CLAUDE\_OPUS\_4\_20250514("claude-opus-4-20250514")

Our most capable model

CLAUDE\_4\_OPUS\_20250514("claude-4-opus-20250514")

Our most capable model

CLAUDE\_OPUS\_4\_1\_20250805("claude-opus-4-1-20250805")

Our most capable model

CLAUDE\_3\_OPUS\_LATEST("claude-3-opus-latest")

Excels at writing and complex tasks

CLAUDE\_3\_OPUS\_20240229("claude-3-opus-20240229")

Excels at writing and complex tasks

CLAUDE\_3\_HAIKU\_20240307("claude-3-haiku-20240307")

Our previous most fast and cost-effective

JsonValue;role"assistant"constant"assistant"constant

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

ASSISTANT("assistant")

Optional<[BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)>stopReason

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

END\_TURN("end\_turn")

MAX\_TOKENS("max\_tokens")

STOP\_SEQUENCE("stop\_sequence")

TOOL\_USE("tool\_use")

PAUSE\_TURN("pause\_turn")

REFUSAL("refusal")

MODEL\_CONTEXT\_WINDOW\_EXCEEDED("model\_context\_window\_exceeded")

Optional<String>stopSequence

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

JsonValue;type"message"constant"message"constant

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

MESSAGE("message")

[BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage)usage

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

Optional<[BetaCacheCreation](https://platform.claude.com/docs/en/api/beta#beta_cache_creation)>cacheCreation

Breakdown of cached tokens by TTL

longephemeral1hInputTokens

The number of input tokens used to create the 1 hour cache entry.

minimum0

longephemeral5mInputTokens

The number of input tokens used to create the 5 minute cache entry.

minimum0

Optional<Long>cacheCreationInputTokens

The number of input tokens used to create the cache entry.

minimum0

Optional<Long>cacheReadInputTokens

The number of input tokens read from the cache.

minimum0

longinputTokens

The number of input tokens which were used.

minimum0

longoutputTokens

The number of output tokens which were used.

minimum0

Optional<[BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage)>serverToolUse

The number of server tool requests.

longwebFetchRequests

The number of web fetch tool requests.

minimum0

longwebSearchRequests

The number of web search tool requests.

minimum0

Optional<ServiceTier>serviceTier

If the request used the priority, standard, or batch tier.

Accepts one of the following:

STANDARD("standard")

PRIORITY("priority")

BATCH("batch")

JsonValue;type"succeeded"constant"succeeded"constant

Accepts one of the following:

SUCCEEDED("succeeded")

classBetaMessageBatchErroredResult:

[BetaErrorResponse](https://platform.claude.com/docs/en/api/beta#beta_error_response)error

[BetaError](https://platform.claude.com/docs/en/api/beta#beta_error)error

Accepts one of the following:

classBetaInvalidRequestError:

Stringmessage

JsonValue;type"invalid\_request\_error"constant"invalid\_request\_error"constant

Accepts one of the following:

INVALID\_REQUEST\_ERROR("invalid\_request\_error")

classBetaAuthenticationError:

Stringmessage

JsonValue;type"authentication\_error"constant"authentication\_error"constant

Accepts one of the following:

AUTHENTICATION\_ERROR("authentication\_error")

classBetaBillingError:

Stringmessage

JsonValue;type"billing\_error"constant"billing\_error"constant

Accepts one of the following:

BILLING\_ERROR("billing\_error")

classBetaPermissionError:

Stringmessage

JsonValue;type"permission\_error"constant"permission\_error"constant

Accepts one of the following:

PERMISSION\_ERROR("permission\_error")

classBetaNotFoundError:

Stringmessage

JsonValue;type"not\_found\_error"constant"not\_found\_error"constant

Accepts one of the following:

NOT\_FOUND\_ERROR("not\_found\_error")

classBetaRateLimitError:

Stringmessage

JsonValue;type"rate\_limit\_error"constant"rate\_limit\_error"constant

Accepts one of the following:

RATE\_LIMIT\_ERROR("rate\_limit\_error")

classBetaGatewayTimeoutError:

Stringmessage

JsonValue;type"timeout\_error"constant"timeout\_error"constant

Accepts one of the following:

TIMEOUT\_ERROR("timeout\_error")

classBetaApiError:

Stringmessage

JsonValue;type"api\_error"constant"api\_error"constant

Accepts one of the following:

API\_ERROR("api\_error")

classBetaOverloadedError:

Stringmessage

JsonValue;type"overloaded\_error"constant"overloaded\_error"constant

Accepts one of the following:

OVERLOADED\_ERROR("overloaded\_error")

Optional<String>requestId

JsonValue;type"error"constant"error"constant

Accepts one of the following:

ERROR("error")

JsonValue;type"errored"constant"errored"constant

Accepts one of the following:

ERRORED("errored")

classBetaMessageBatchCanceledResult:

JsonValue;type"canceled"constant"canceled"constant

Accepts one of the following:

CANCELED("canceled")

classBetaMessageBatchExpiredResult:

JsonValue;type"expired"constant"expired"constant

Accepts one of the following:

EXPIRED("expired")

classBetaMessageBatchRequestCounts:

longcanceled

Number of requests in the Message Batch that have been canceled.

This is zero until processing of the entire Message Batch has ended.

longerrored

Number of requests in the Message Batch that encountered an error.

This is zero until processing of the entire Message Batch has ended.

longexpired

Number of requests in the Message Batch that have expired.

This is zero until processing of the entire Message Batch has ended.

longprocessing

Number of requests in the Message Batch that are processing.

longsucceeded

Number of requests in the Message Batch that have completed successfully.

This is zero until processing of the entire Message Batch has ended.

classBetaMessageBatchResult:A class that can be one of several variants.union

Processing result for this request.

Contains a Message output if processing was successful, an error response if processing failed, or the reason why processing was not attempted, such as cancellation or expiration.

classBetaMessageBatchSucceededResult:

[BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message)message

Stringid

Unique object identifier.

The format and length of IDs may change over time.

Optional<[BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container)>container

Information about the container used in the request (for the code execution tool)

Stringid

Identifier for the container used in this request

LocalDateTimeexpiresAt

The time at which the container will expire.

formatdate-time

Optional<List<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)>>skills

Skills loaded in the container

StringskillId

Skill ID

maxLength64

minLength1

Typetype

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

ANTHROPIC("anthropic")

CUSTOM("custom")

Stringversion

Skill version or 'latest' for most recent version

maxLength64

minLength1

List<[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)>content

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

classBetaTextBlock:

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaThinkingBlock:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classBetaRedactedThinkingBlock:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classBetaToolUseBlock:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaServerToolUseBlock:

Stringid

Callercaller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Inputinput

Namename

Accepts one of the following:

WEB\_SEARCH("web\_search")

WEB\_FETCH("web\_fetch")

CODE\_EXECUTION("code\_execution")

BASH\_CODE\_EXECUTION("bash\_code\_execution")

TEXT\_EDITOR\_CODE\_EXECUTION("text\_editor\_code\_execution")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

classBetaWebSearchToolResultBlock:

[BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)content

Accepts one of the following:

classBetaWebSearchToolResultError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

List<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)>

StringencryptedContent

Optional<String>pageAge

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

StringtoolUseId

JsonValue;type"web\_search\_tool\_result"constant"web\_search\_tool\_result"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT("web\_search\_tool\_result")

classBetaWebFetchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaWebFetchToolResultErrorBlock:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

classBetaWebFetchBlock:

[BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)content

Optional<[BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config)>citations

Citation configuration for the document

booleanenabled

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<String>title

The title of the document

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

StringtoolUseId

JsonValue;type"web\_fetch\_tool\_result"constant"web\_fetch\_tool\_result"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT("web\_fetch\_tool\_result")

classBetaCodeExecutionToolResultBlock:

[BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)content

Accepts one of the following:

classBetaCodeExecutionToolResultError:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlock:

List<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

StringtoolUseId

JsonValue;type"code\_execution\_tool\_result"constant"code\_execution\_tool\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT("code\_execution\_tool\_result")

classBetaBashCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaBashCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaBashCodeExecutionResultBlock:

List<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

StringtoolUseId

JsonValue;type"bash\_code\_execution\_tool\_result"constant"bash\_code\_execution\_tool\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT("bash\_code\_execution\_tool\_result")

classBetaTextEditorCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaTextEditorCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

Optional<String>errorMessage

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

classBetaTextEditorCodeExecutionViewResultBlock:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

classBetaTextEditorCodeExecutionCreateResultBlock:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlock:

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

StringtoolUseId

JsonValue;type"text\_editor\_code\_execution\_tool\_result"constant"text\_editor\_code\_execution\_tool\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT("text\_editor\_code\_execution\_tool\_result")

classBetaToolSearchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaToolSearchToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

Optional<String>errorMessage

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolSearchResultBlock:

List<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

StringtoolUseId

JsonValue;type"tool\_search\_tool\_result"constant"tool\_search\_tool\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT("tool\_search\_tool\_result")

classBetaMcpToolUseBlock:

Stringid

Inputinput

Stringname

The name of the MCP tool

StringserverName

The name of the MCP server

JsonValue;type"mcp\_tool\_use"constant"mcp\_tool\_use"constant

Accepts one of the following:

MCP\_TOOL\_USE("mcp\_tool\_use")

classBetaMcpToolResultBlock:

Contentcontent

Accepts one of the following:

String

List<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)>

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

booleanisError

StringtoolUseId

JsonValue;type"mcp\_tool\_result"constant"mcp\_tool\_result"constant

Accepts one of the following:

MCP\_TOOL\_RESULT("mcp\_tool\_result")

classBetaContainerUploadBlock:

Response model for a file uploaded to the container.

StringfileId

JsonValue;type"container\_upload"constant"container\_upload"constant

Accepts one of the following:

CONTAINER\_UPLOAD("container\_upload")

Optional<[BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response)>contextManagement

Context management response.

Information about context management strategies applied during the request.

List<AppliedEdit>appliedEdits

List of context management edits that were applied.

Accepts one of the following:

classBetaClearToolUses20250919EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedToolUses

Number of tool uses that were cleared.

minimum0

JsonValue;type"clear\_tool\_uses\_20250919"constant"clear\_tool\_uses\_20250919"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_TOOL\_USES\_20250919("clear\_tool\_uses\_20250919")

classBetaClearThinking20251015EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedThinkingTurns

Number of thinking turns that were cleared.

minimum0

JsonValue;type"clear\_thinking\_20251015"constant"clear\_thinking\_20251015"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_THINKING\_20251015("clear\_thinking\_20251015")

Modelmodel

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

CLAUDE\_OPUS\_4\_5\_20251101("claude-opus-4-5-20251101")

Premium model combining maximum intelligence with practical performance

CLAUDE\_OPUS\_4\_5("claude-opus-4-5")

Premium model combining maximum intelligence with practical performance

CLAUDE\_3\_7\_SONNET\_LATEST("claude-3-7-sonnet-latest")

High-performance model with early extended thinking

CLAUDE\_3\_7\_SONNET\_20250219("claude-3-7-sonnet-20250219")

High-performance model with early extended thinking

CLAUDE\_3\_5\_HAIKU\_LATEST("claude-3-5-haiku-latest")

Fastest and most compact model for near-instant responsiveness

CLAUDE\_3\_5\_HAIKU\_20241022("claude-3-5-haiku-20241022")

Our fastest model

CLAUDE\_HAIKU\_4\_5("claude-haiku-4-5")

Hybrid model, capable of near-instant responses and extended thinking

CLAUDE\_HAIKU\_4\_5\_20251001("claude-haiku-4-5-20251001")

Hybrid model, capable of near-instant responses and extended thinking

CLAUDE\_SONNET\_4\_20250514("claude-sonnet-4-20250514")

High-performance model with extended thinking

CLAUDE\_SONNET\_4\_0("claude-sonnet-4-0")

High-performance model with extended thinking

CLAUDE\_4\_SONNET\_20250514("claude-4-sonnet-20250514")

High-performance model with extended thinking

CLAUDE\_SONNET\_4\_5("claude-sonnet-4-5")

Our best model for real-world agents and coding

CLAUDE\_SONNET\_4\_5\_20250929("claude-sonnet-4-5-20250929")

Our best model for real-world agents and coding

CLAUDE\_OPUS\_4\_0("claude-opus-4-0")

Our most capable model

CLAUDE\_OPUS\_4\_20250514("claude-opus-4-20250514")

Our most capable model

CLAUDE\_4\_OPUS\_20250514("claude-4-opus-20250514")

Our most capable model

CLAUDE\_OPUS\_4\_1\_20250805("claude-opus-4-1-20250805")

Our most capable model

CLAUDE\_3\_OPUS\_LATEST("claude-3-opus-latest")

Excels at writing and complex tasks

CLAUDE\_3\_OPUS\_20240229("claude-3-opus-20240229")

Excels at writing and complex tasks

CLAUDE\_3\_HAIKU\_20240307("claude-3-haiku-20240307")

Our previous most fast and cost-effective

JsonValue;role"assistant"constant"assistant"constant

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

ASSISTANT("assistant")

Optional<[BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)>stopReason

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

END\_TURN("end\_turn")

MAX\_TOKENS("max\_tokens")

STOP\_SEQUENCE("stop\_sequence")

TOOL\_USE("tool\_use")

PAUSE\_TURN("pause\_turn")

REFUSAL("refusal")

MODEL\_CONTEXT\_WINDOW\_EXCEEDED("model\_context\_window\_exceeded")

Optional<String>stopSequence

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

JsonValue;type"message"constant"message"constant

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

MESSAGE("message")

[BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage)usage

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

Optional<[BetaCacheCreation](https://platform.claude.com/docs/en/api/beta#beta_cache_creation)>cacheCreation

Breakdown of cached tokens by TTL

longephemeral1hInputTokens

The number of input tokens used to create the 1 hour cache entry.

minimum0

longephemeral5mInputTokens

The number of input tokens used to create the 5 minute cache entry.

minimum0

Optional<Long>cacheCreationInputTokens

The number of input tokens used to create the cache entry.

minimum0

Optional<Long>cacheReadInputTokens

The number of input tokens read from the cache.

minimum0

longinputTokens

The number of input tokens which were used.

minimum0

longoutputTokens

The number of output tokens which were used.

minimum0

Optional<[BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage)>serverToolUse

The number of server tool requests.

longwebFetchRequests

The number of web fetch tool requests.

minimum0

longwebSearchRequests

The number of web search tool requests.

minimum0

Optional<ServiceTier>serviceTier

If the request used the priority, standard, or batch tier.

Accepts one of the following:

STANDARD("standard")

PRIORITY("priority")

BATCH("batch")

JsonValue;type"succeeded"constant"succeeded"constant

Accepts one of the following:

SUCCEEDED("succeeded")

classBetaMessageBatchErroredResult:

[BetaErrorResponse](https://platform.claude.com/docs/en/api/beta#beta_error_response)error

[BetaError](https://platform.claude.com/docs/en/api/beta#beta_error)error

Accepts one of the following:

classBetaInvalidRequestError:

Stringmessage

JsonValue;type"invalid\_request\_error"constant"invalid\_request\_error"constant

Accepts one of the following:

INVALID\_REQUEST\_ERROR("invalid\_request\_error")

classBetaAuthenticationError:

Stringmessage

JsonValue;type"authentication\_error"constant"authentication\_error"constant

Accepts one of the following:

AUTHENTICATION\_ERROR("authentication\_error")

classBetaBillingError:

Stringmessage

JsonValue;type"billing\_error"constant"billing\_error"constant

Accepts one of the following:

BILLING\_ERROR("billing\_error")

classBetaPermissionError:

Stringmessage

JsonValue;type"permission\_error"constant"permission\_error"constant

Accepts one of the following:

PERMISSION\_ERROR("permission\_error")

classBetaNotFoundError:

Stringmessage

JsonValue;type"not\_found\_error"constant"not\_found\_error"constant

Accepts one of the following:

NOT\_FOUND\_ERROR("not\_found\_error")

classBetaRateLimitError:

Stringmessage

JsonValue;type"rate\_limit\_error"constant"rate\_limit\_error"constant

Accepts one of the following:

RATE\_LIMIT\_ERROR("rate\_limit\_error")

classBetaGatewayTimeoutError:

Stringmessage

JsonValue;type"timeout\_error"constant"timeout\_error"constant

Accepts one of the following:

TIMEOUT\_ERROR("timeout\_error")

classBetaApiError:

Stringmessage

JsonValue;type"api\_error"constant"api\_error"constant

Accepts one of the following:

API\_ERROR("api\_error")

classBetaOverloadedError:

Stringmessage

JsonValue;type"overloaded\_error"constant"overloaded\_error"constant

Accepts one of the following:

OVERLOADED\_ERROR("overloaded\_error")

Optional<String>requestId

JsonValue;type"error"constant"error"constant

Accepts one of the following:

ERROR("error")

JsonValue;type"errored"constant"errored"constant

Accepts one of the following:

ERRORED("errored")

classBetaMessageBatchCanceledResult:

JsonValue;type"canceled"constant"canceled"constant

Accepts one of the following:

CANCELED("canceled")

classBetaMessageBatchExpiredResult:

JsonValue;type"expired"constant"expired"constant

Accepts one of the following:

EXPIRED("expired")

classBetaMessageBatchSucceededResult:

[BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message)message

Stringid

Unique object identifier.

The format and length of IDs may change over time.

Optional<[BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container)>container

Information about the container used in the request (for the code execution tool)

Stringid

Identifier for the container used in this request

LocalDateTimeexpiresAt

The time at which the container will expire.

formatdate-time

Optional<List<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill)>>skills

Skills loaded in the container

StringskillId

Skill ID

maxLength64

minLength1

Typetype

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

ANTHROPIC("anthropic")

CUSTOM("custom")

Stringversion

Skill version or 'latest' for most recent version

maxLength64

minLength1

List<[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)>content

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

classBetaTextBlock:

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classBetaThinkingBlock:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classBetaRedactedThinkingBlock:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classBetaToolUseBlock:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

Optional<Caller>caller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

classBetaServerToolUseBlock:

Stringid

Callercaller

Tool invocation directly from the model.

Accepts one of the following:

classBetaDirectCaller:

Tool invocation directly from the model.

JsonValue;type"direct"constant"direct"constant

Accepts one of the following:

DIRECT("direct")

classBetaServerToolCaller:

Tool invocation generated by a server-side tool.

StringtoolId

JsonValue;type"code\_execution\_20250825"constant"code\_execution\_20250825"constant

Accepts one of the following:

CODE\_EXECUTION\_20250825("code\_execution\_20250825")

Inputinput

Namename

Accepts one of the following:

WEB\_SEARCH("web\_search")

WEB\_FETCH("web\_fetch")

CODE\_EXECUTION("code\_execution")

BASH\_CODE\_EXECUTION("bash\_code\_execution")

TEXT\_EDITOR\_CODE\_EXECUTION("text\_editor\_code\_execution")

TOOL\_SEARCH\_TOOL\_REGEX("tool\_search\_tool\_regex")

TOOL\_SEARCH\_TOOL\_BM25("tool\_search\_tool\_bm25")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

classBetaWebSearchToolResultBlock:

[BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)content

Accepts one of the following:

classBetaWebSearchToolResultError:

[BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

List<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block)>

StringencryptedContent

Optional<String>pageAge

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

StringtoolUseId

JsonValue;type"web\_search\_tool\_result"constant"web\_search\_tool\_result"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT("web\_search\_tool\_result")

classBetaWebFetchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaWebFetchToolResultErrorBlock:

[BetaWebFetchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

URL\_TOO\_LONG("url\_too\_long")

URL\_NOT\_ALLOWED("url\_not\_allowed")

URL\_NOT\_ACCESSIBLE("url\_not\_accessible")

UNSUPPORTED\_CONTENT\_TYPE("unsupported\_content\_type")

TOO\_MANY\_REQUESTS("too\_many\_requests")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

UNAVAILABLE("unavailable")

JsonValue;type"web\_fetch\_tool\_result\_error"constant"web\_fetch\_tool\_result\_error"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT\_ERROR("web\_fetch\_tool\_result\_error")

classBetaWebFetchBlock:

[BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block)content

Optional<[BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config)>citations

Citation configuration for the document

booleanenabled

Sourcesource

Accepts one of the following:

classBetaBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classBetaPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<String>title

The title of the document

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<String>retrievedAt

ISO 8601 timestamp when the content was retrieved

JsonValue;type"web\_fetch\_result"constant"web\_fetch\_result"constant

Accepts one of the following:

WEB\_FETCH\_RESULT("web\_fetch\_result")

Stringurl

Fetched content URL

StringtoolUseId

JsonValue;type"web\_fetch\_tool\_result"constant"web\_fetch\_tool\_result"constant

Accepts one of the following:

WEB\_FETCH\_TOOL\_RESULT("web\_fetch\_tool\_result")

classBetaCodeExecutionToolResultBlock:

[BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)content

Accepts one of the following:

classBetaCodeExecutionToolResultError:

[BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)errorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

JsonValue;type"code\_execution\_tool\_result\_error"constant"code\_execution\_tool\_result\_error"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("code\_execution\_tool\_result\_error")

classBetaCodeExecutionResultBlock:

List<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block)>content

StringfileId

JsonValue;type"code\_execution\_output"constant"code\_execution\_output"constant

Accepts one of the following:

CODE\_EXECUTION\_OUTPUT("code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"code\_execution\_result"constant"code\_execution\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_RESULT("code\_execution\_result")

StringtoolUseId

JsonValue;type"code\_execution\_tool\_result"constant"code\_execution\_tool\_result"constant

Accepts one of the following:

CODE\_EXECUTION\_TOOL\_RESULT("code\_execution\_tool\_result")

classBetaBashCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaBashCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

OUTPUT\_FILE\_TOO\_LARGE("output\_file\_too\_large")

JsonValue;type"bash\_code\_execution\_tool\_result\_error"constant"bash\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("bash\_code\_execution\_tool\_result\_error")

classBetaBashCodeExecutionResultBlock:

List<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block)>content

StringfileId

JsonValue;type"bash\_code\_execution\_output"constant"bash\_code\_execution\_output"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_OUTPUT("bash\_code\_execution\_output")

longreturnCode

Stringstderr

Stringstdout

JsonValue;type"bash\_code\_execution\_result"constant"bash\_code\_execution\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_RESULT("bash\_code\_execution\_result")

StringtoolUseId

JsonValue;type"bash\_code\_execution\_tool\_result"constant"bash\_code\_execution\_tool\_result"constant

Accepts one of the following:

BASH\_CODE\_EXECUTION\_TOOL\_RESULT("bash\_code\_execution\_tool\_result")

classBetaTextEditorCodeExecutionToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaTextEditorCodeExecutionToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

FILE\_NOT\_FOUND("file\_not\_found")

Optional<String>errorMessage

JsonValue;type"text\_editor\_code\_execution\_tool\_result\_error"constant"text\_editor\_code\_execution\_tool\_result\_error"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT\_ERROR("text\_editor\_code\_execution\_tool\_result\_error")

classBetaTextEditorCodeExecutionViewResultBlock:

Stringcontent

FileTypefileType

Accepts one of the following:

TEXT("text")

IMAGE("image")

PDF("pdf")

Optional<Long>numLines

Optional<Long>startLine

Optional<Long>totalLines

JsonValue;type"text\_editor\_code\_execution\_view\_result"constant"text\_editor\_code\_execution\_view\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_VIEW\_RESULT("text\_editor\_code\_execution\_view\_result")

classBetaTextEditorCodeExecutionCreateResultBlock:

booleanisFileUpdate

JsonValue;type"text\_editor\_code\_execution\_create\_result"constant"text\_editor\_code\_execution\_create\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_CREATE\_RESULT("text\_editor\_code\_execution\_create\_result")

classBetaTextEditorCodeExecutionStrReplaceResultBlock:

Optional<List<String>>lines

Optional<Long>newLines

Optional<Long>newStart

Optional<Long>oldLines

Optional<Long>oldStart

JsonValue;type"text\_editor\_code\_execution\_str\_replace\_result"constant"text\_editor\_code\_execution\_str\_replace\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_STR\_REPLACE\_RESULT("text\_editor\_code\_execution\_str\_replace\_result")

StringtoolUseId

JsonValue;type"text\_editor\_code\_execution\_tool\_result"constant"text\_editor\_code\_execution\_tool\_result"constant

Accepts one of the following:

TEXT\_EDITOR\_CODE\_EXECUTION\_TOOL\_RESULT("text\_editor\_code\_execution\_tool\_result")

classBetaToolSearchToolResultBlock:

Contentcontent

Accepts one of the following:

classBetaToolSearchToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

TOO\_MANY\_REQUESTS("too\_many\_requests")

EXECUTION\_TIME\_EXCEEDED("execution\_time\_exceeded")

Optional<String>errorMessage

JsonValue;type"tool\_search\_tool\_result\_error"constant"tool\_search\_tool\_result\_error"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT\_ERROR("tool\_search\_tool\_result\_error")

classBetaToolSearchToolSearchResultBlock:

List<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block)>toolReferences

StringtoolName

JsonValue;type"tool\_reference"constant"tool\_reference"constant

Accepts one of the following:

TOOL\_REFERENCE("tool\_reference")

JsonValue;type"tool\_search\_tool\_search\_result"constant"tool\_search\_tool\_search\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_SEARCH\_RESULT("tool\_search\_tool\_search\_result")

StringtoolUseId

JsonValue;type"tool\_search\_tool\_result"constant"tool\_search\_tool\_result"constant

Accepts one of the following:

TOOL\_SEARCH\_TOOL\_RESULT("tool\_search\_tool\_result")

classBetaMcpToolUseBlock:

Stringid

Inputinput

Stringname

The name of the MCP tool

StringserverName

The name of the MCP server

JsonValue;type"mcp\_tool\_use"constant"mcp\_tool\_use"constant

Accepts one of the following:

MCP\_TOOL\_USE("mcp\_tool\_use")

classBetaMcpToolResultBlock:

Contentcontent

Accepts one of the following:

String

List<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block)>

Optional<List<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classBetaCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classBetaCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classBetaCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classBetaCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classBetaCitationSearchResultLocation:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

booleanisError

StringtoolUseId

JsonValue;type"mcp\_tool\_result"constant"mcp\_tool\_result"constant

Accepts one of the following:

MCP\_TOOL\_RESULT("mcp\_tool\_result")

classBetaContainerUploadBlock:

Response model for a file uploaded to the container.

StringfileId

JsonValue;type"container\_upload"constant"container\_upload"constant

Accepts one of the following:

CONTAINER\_UPLOAD("container\_upload")

Optional<[BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response)>contextManagement

Context management response.

Information about context management strategies applied during the request.

List<AppliedEdit>appliedEdits

List of context management edits that were applied.

Accepts one of the following:

classBetaClearToolUses20250919EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedToolUses

Number of tool uses that were cleared.

minimum0

JsonValue;type"clear\_tool\_uses\_20250919"constant"clear\_tool\_uses\_20250919"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_TOOL\_USES\_20250919("clear\_tool\_uses\_20250919")

classBetaClearThinking20251015EditResponse:

longclearedInputTokens

Number of input tokens cleared by this edit.

minimum0

longclearedThinkingTurns

Number of thinking turns that were cleared.

minimum0

JsonValue;type"clear\_thinking\_20251015"constant"clear\_thinking\_20251015"constant

The type of context management edit applied.

Accepts one of the following:

CLEAR\_THINKING\_20251015("clear\_thinking\_20251015")

Modelmodel

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

CLAUDE\_OPUS\_4\_5\_20251101("claude-opus-4-5-20251101")

Premium model combining maximum intelligence with practical performance

CLAUDE\_OPUS\_4\_5("claude-opus-4-5")

Premium model combining maximum intelligence with practical performance

CLAUDE\_3\_7\_SONNET\_LATEST("claude-3-7-sonnet-latest")

High-performance model with early extended thinking

CLAUDE\_3\_7\_SONNET\_20250219("claude-3-7-sonnet-20250219")

High-performance model with early extended thinking

CLAUDE\_3\_5\_HAIKU\_LATEST("claude-3-5-haiku-latest")

Fastest and most compact model for near-instant responsiveness

CLAUDE\_3\_5\_HAIKU\_20241022("claude-3-5-haiku-20241022")

Our fastest model

CLAUDE\_HAIKU\_4\_5("claude-haiku-4-5")

Hybrid model, capable of near-instant responses and extended thinking

CLAUDE\_HAIKU\_4\_5\_20251001("claude-haiku-4-5-20251001")

Hybrid model, capable of near-instant responses and extended thinking

CLAUDE\_SONNET\_4\_20250514("claude-sonnet-4-20250514")

High-performance model with extended thinking

CLAUDE\_SONNET\_4\_0("claude-sonnet-4-0")

High-performance model with extended thinking

CLAUDE\_4\_SONNET\_20250514("claude-4-sonnet-20250514")

High-performance model with extended thinking

CLAUDE\_SONNET\_4\_5("claude-sonnet-4-5")

Our best model for real-world agents and coding

CLAUDE\_SONNET\_4\_5\_20250929("claude-sonnet-4-5-20250929")

Our best model for real-world agents and coding

CLAUDE\_OPUS\_4\_0("claude-opus-4-0")

Our most capable model

CLAUDE\_OPUS\_4\_20250514("claude-opus-4-20250514")

Our most capable model

CLAUDE\_4\_OPUS\_20250514("claude-4-opus-20250514")

Our most capable model

CLAUDE\_OPUS\_4\_1\_20250805("claude-opus-4-1-20250805")

Our most capable model

CLAUDE\_3\_OPUS\_LATEST("claude-3-opus-latest")

Excels at writing and complex tasks

CLAUDE\_3\_OPUS\_20240229("claude-3-opus-20240229")

Excels at writing and complex tasks

CLAUDE\_3\_HAIKU\_20240307("claude-3-haiku-20240307")

Our previous most fast and cost-effective

JsonValue;role"assistant"constant"assistant"constant

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

ASSISTANT("assistant")

Optional<[BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)>stopReason

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

END\_TURN("end\_turn")

MAX\_TOKENS("max\_tokens")

STOP\_SEQUENCE("stop\_sequence")

TOOL\_USE("tool\_use")

PAUSE\_TURN("pause\_turn")

REFUSAL("refusal")

MODEL\_CONTEXT\_WINDOW\_EXCEEDED("model\_context\_window\_exceeded")

Optional<String>stopSequence

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

JsonValue;type"message"constant"message"constant

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

MESSAGE("message")

[BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage)usage

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

Optional<[BetaCacheCreation](https://platform.claude.com/docs/en/api/beta#beta_cache_creation)>cacheCreation

Breakdown of cached tokens by TTL

longephemeral1hInputTokens

The number of input tokens used to create the 1 hour cache entry.

minimum0

longephemeral5mInputTokens

The number of input tokens used to create the 5 minute cache entry.

minimum0

Optional<Long>cacheCreationInputTokens

The number of input tokens used to create the cache entry.

minimum0

Optional<Long>cacheReadInputTokens

The number of input tokens read from the cache.

minimum0

longinputTokens

The number of input tokens which were used.

minimum0

longoutputTokens

The number of output tokens which were used.

minimum0

Optional<[BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage)>serverToolUse

The number of server tool requests.

longwebFetchRequests

The number of web fetch tool requests.

minimum0

longwebSearchRequests

The number of web search tool requests.

minimum0

Optional<ServiceTier>serviceTier

If the request used the priority, standard, or batch tier.

Accepts one of the following:

STANDARD("standard")

PRIORITY("priority")

BATCH("batch")

JsonValue;type"succeeded"constant"succeeded"constant

Accepts one of the following:

SUCCEEDED("succeeded")

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