---
url: "https://platform.claude.com/docs/en/api/typescript/beta"
title: "Beta - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Ftypescript%2Fbeta)

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

API Reference

Beta

Copy page

TypeScript

# Beta

##### ModelsExpand Collapse

AnthropicBeta = (string & {})\|"message-batches-2024-09-24"\|"prompt-caching-2024-07-31"\|"computer-use-2024-10-22"\|16 more

Accepts one of the following:

(string & {})

"message-batches-2024-09-24"\|"prompt-caching-2024-07-31"\|"computer-use-2024-10-22"\|16 more

"message-batches-2024-09-24"

"prompt-caching-2024-07-31"

"computer-use-2024-10-22"

"computer-use-2025-01-24"

"pdfs-2024-09-25"

"token-counting-2024-11-01"

"token-efficient-tools-2025-02-19"

"output-128k-2025-02-19"

"files-api-2025-04-14"

"mcp-client-2025-04-04"

"mcp-client-2025-11-20"

"dev-full-thinking-2025-05-14"

"interleaved-thinking-2025-05-14"

"code-execution-2025-05-22"

"extended-cache-ttl-2025-04-11"

"context-1m-2025-08-07"

"context-management-2025-06-27"

"model-context-window-exceeded-2025-08-26"

"skills-2025-10-02"

BetaAPIError {message, type}

message: string

type: "api\_error"

Accepts one of the following:

"api\_error"

BetaAuthenticationError {message, type}

message: string

type: "authentication\_error"

Accepts one of the following:

"authentication\_error"

BetaBillingError {message, type}

message: string

type: "billing\_error"

Accepts one of the following:

"billing\_error"

BetaError = [BetaInvalidRequestError](https://platform.claude.com/docs/en/api/beta#beta_invalid_request_error) {message, type} \|[BetaAuthenticationError](https://platform.claude.com/docs/en/api/beta#beta_authentication_error) {message, type} \|[BetaBillingError](https://platform.claude.com/docs/en/api/beta#beta_billing_error) {message, type} \|6 more

Accepts one of the following:

BetaInvalidRequestError {message, type}

message: string

type: "invalid\_request\_error"

Accepts one of the following:

"invalid\_request\_error"

BetaAuthenticationError {message, type}

message: string

type: "authentication\_error"

Accepts one of the following:

"authentication\_error"

BetaBillingError {message, type}

message: string

type: "billing\_error"

Accepts one of the following:

"billing\_error"

BetaPermissionError {message, type}

message: string

type: "permission\_error"

Accepts one of the following:

"permission\_error"

BetaNotFoundError {message, type}

message: string

type: "not\_found\_error"

Accepts one of the following:

"not\_found\_error"

BetaRateLimitError {message, type}

message: string

type: "rate\_limit\_error"

Accepts one of the following:

"rate\_limit\_error"

BetaGatewayTimeoutError {message, type}

message: string

type: "timeout\_error"

Accepts one of the following:

"timeout\_error"

BetaAPIError {message, type}

message: string

type: "api\_error"

Accepts one of the following:

"api\_error"

BetaOverloadedError {message, type}

message: string

type: "overloaded\_error"

Accepts one of the following:

"overloaded\_error"

BetaErrorResponse {error, request\_id, type}

error: [BetaError](https://platform.claude.com/docs/en/api/beta#beta_error)

Accepts one of the following:

BetaInvalidRequestError {message, type}

message: string

type: "invalid\_request\_error"

Accepts one of the following:

"invalid\_request\_error"

BetaAuthenticationError {message, type}

message: string

type: "authentication\_error"

Accepts one of the following:

"authentication\_error"

BetaBillingError {message, type}

message: string

type: "billing\_error"

Accepts one of the following:

"billing\_error"

BetaPermissionError {message, type}

message: string

type: "permission\_error"

Accepts one of the following:

"permission\_error"

BetaNotFoundError {message, type}

message: string

type: "not\_found\_error"

Accepts one of the following:

"not\_found\_error"

BetaRateLimitError {message, type}

message: string

type: "rate\_limit\_error"

Accepts one of the following:

"rate\_limit\_error"

BetaGatewayTimeoutError {message, type}

message: string

type: "timeout\_error"

Accepts one of the following:

"timeout\_error"

BetaAPIError {message, type}

message: string

type: "api\_error"

Accepts one of the following:

"api\_error"

BetaOverloadedError {message, type}

message: string

type: "overloaded\_error"

Accepts one of the following:

"overloaded\_error"

request\_id: string\|null

type: "error"

Accepts one of the following:

"error"

BetaGatewayTimeoutError {message, type}

message: string

type: "timeout\_error"

Accepts one of the following:

"timeout\_error"

BetaInvalidRequestError {message, type}

message: string

type: "invalid\_request\_error"

Accepts one of the following:

"invalid\_request\_error"

BetaNotFoundError {message, type}

message: string

type: "not\_found\_error"

Accepts one of the following:

"not\_found\_error"

BetaOverloadedError {message, type}

message: string

type: "overloaded\_error"

Accepts one of the following:

"overloaded\_error"

BetaPermissionError {message, type}

message: string

type: "permission\_error"

Accepts one of the following:

"permission\_error"

BetaRateLimitError {message, type}

message: string

type: "rate\_limit\_error"

Accepts one of the following:

"rate\_limit\_error"

#### BetaModels

##### [List Models](https://platform.claude.com/docs/en/api/beta/models/list)

client.beta.models.list(ModelListParams {after\_id, before\_id, limit, betas} params?, RequestOptionsoptions?): Page<[BetaModelInfo](https://platform.claude.com/docs/en/api/beta#beta_model_info) {id, created\_at, display\_name, type} >

get/v1/models

##### [Get a Model](https://platform.claude.com/docs/en/api/beta/models/retrieve)

client.beta.models.retrieve(stringmodelID, ModelRetrieveParams {betas} params?, RequestOptionsoptions?): [BetaModelInfo](https://platform.claude.com/docs/en/api/beta#beta_model_info) {id, created\_at, display\_name, type}

get/v1/models/{model\_id}

##### ModelsExpand Collapse

BetaModelInfo {id, created\_at, display\_name, type}

id: string

Unique model identifier.

created\_at: string

RFC 3339 datetime string representing the time at which the model was released. May be set to an epoch value if the release date is unknown.

formatdate-time

display\_name: string

A human-readable name for the model.

type: "model"

Object type.

For Models, this is always `"model"`.

Accepts one of the following:

"model"

#### BetaMessages

##### [Create a Message](https://platform.claude.com/docs/en/api/beta/messages/create)

client.beta.messages.create(MessageCreateParamsparams, RequestOptionsoptions?): [BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message) {id, container, content, 7 more} \|Stream<[BetaRawMessageStreamEvent](https://platform.claude.com/docs/en/api/beta#beta_raw_message_stream_event)>

post/v1/messages

##### [Count tokens in a Message](https://platform.claude.com/docs/en/api/beta/messages/count_tokens)

client.beta.messages.countTokens(MessageCountTokensParams {messages, model, context\_management, 8 more} params, RequestOptionsoptions?): [BetaMessageTokensCount](https://platform.claude.com/docs/en/api/beta#beta_message_tokens_count) {context\_management, input\_tokens}

post/v1/messages/count\_tokens

##### ModelsExpand Collapse

BetaAllThinkingTurns {type}

type: "all"

Accepts one of the following:

"all"

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaBashCodeExecutionOutputBlock {file\_id, type}

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

BetaBashCodeExecutionOutputBlockParam {file\_id, type}

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

BetaBashCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

BetaBashCodeExecutionResultBlockParam {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block_param) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

BetaBashCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaBashCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_tool_result_error) {error\_code, type} \|[BetaBashCodeExecutionResultBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_result_block) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaBashCodeExecutionToolResultError {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: string

type: "bash\_code\_execution\_tool\_result"

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

BetaBashCodeExecutionToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaBashCodeExecutionToolResultErrorParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_tool_result_error_param) {error\_code, type} \|[BetaBashCodeExecutionResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_result_block_param) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaBashCodeExecutionToolResultErrorParam {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionResultBlockParam {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block_param) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: string

type: "bash\_code\_execution\_tool\_result"

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaBashCodeExecutionToolResultError {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionToolResultErrorParam {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaCacheControlEphemeral {type, ttl}

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaCacheCreation {ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens}

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationConfig {enabled}

enabled: boolean

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationsConfigParam {enabled}

enabled?: boolean

BetaCitationsDelta {citation, type}

citation: [BetaCitationCharLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_char_location) {cited\_text, document\_index, document\_title, 4 more} \|[BetaCitationPageLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_page_location) {cited\_text, document\_index, document\_title, 4 more} \|[BetaCitationContentBlockLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_content_block_location) {cited\_text, document\_index, document\_title, 4 more} \|2 more

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

type: "citations\_delta"

Accepts one of the following:

"citations\_delta"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaClearThinking20251015Edit {type, keep}

type: "clear\_thinking\_20251015"

Accepts one of the following:

"clear\_thinking\_20251015"

keep?: [BetaThinkingTurns](https://platform.claude.com/docs/en/api/beta#beta_thinking_turns) {type, value} \|[BetaAllThinkingTurns](https://platform.claude.com/docs/en/api/beta#beta_all_thinking_turns) {type} \|"all"

Number of most recent assistant turns to keep thinking blocks for. Older turns will have their thinking blocks removed.

Accepts one of the following:

BetaThinkingTurns {type, value}

type: "thinking\_turns"

Accepts one of the following:

"thinking\_turns"

value: number

BetaAllThinkingTurns {type}

type: "all"

Accepts one of the following:

"all"

"all"

"all"

BetaClearThinking20251015EditResponse {cleared\_input\_tokens, cleared\_thinking\_turns, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: number

Number of thinking turns that were cleared.

minimum0

type: "clear\_thinking\_20251015"

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

BetaClearToolUses20250919Edit {type, clear\_at\_least, clear\_tool\_inputs, 3 more}

type: "clear\_tool\_uses\_20250919"

Accepts one of the following:

"clear\_tool\_uses\_20250919"

clear\_at\_least?: [BetaInputTokensClearAtLeast](https://platform.claude.com/docs/en/api/beta#beta_input_tokens_clear_at_least) {type, value} \|null

Minimum number of tokens that must be cleared when triggered. Context will only be modified if at least this many tokens can be removed.

type: "input\_tokens"

Accepts one of the following:

"input\_tokens"

value: number

clear\_tool\_inputs?: boolean\|Array<string>\|null

Whether to clear all tool inputs (bool) or specific tool inputs to clear (list)

Accepts one of the following:

boolean

Array<string>

exclude\_tools?: Array<string>\|null

Tool names whose uses are preserved from clearing

keep?: [BetaToolUsesKeep](https://platform.claude.com/docs/en/api/beta#beta_tool_uses_keep) {type, value}

Number of tool uses to retain in the conversation

type: "tool\_uses"

Accepts one of the following:

"tool\_uses"

value: number

trigger?: [BetaInputTokensTrigger](https://platform.claude.com/docs/en/api/beta#beta_input_tokens_trigger) {type, value} \|[BetaToolUsesTrigger](https://platform.claude.com/docs/en/api/beta#beta_tool_uses_trigger) {type, value}

Condition that triggers the context management strategy

Accepts one of the following:

BetaInputTokensTrigger {type, value}

type: "input\_tokens"

Accepts one of the following:

"input\_tokens"

value: number

BetaToolUsesTrigger {type, value}

type: "tool\_uses"

Accepts one of the following:

"tool\_uses"

value: number

BetaClearToolUses20250919EditResponse {cleared\_input\_tokens, cleared\_tool\_uses, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: number

Number of tool uses that were cleared.

minimum0

type: "clear\_tool\_uses\_20250919"

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

BetaCodeExecutionOutputBlock {file\_id, type}

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

BetaCodeExecutionOutputBlockParam {file\_id, type}

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

BetaCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

BetaCodeExecutionResultBlockParam {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

BetaCodeExecutionTool20250522 {name, type, allowed\_callers, 3 more}

name: "code\_execution"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"code\_execution"

type: "code\_execution\_20250522"

Accepts one of the following:

"code\_execution\_20250522"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict?: boolean

BetaCodeExecutionTool20250825 {name, type, allowed\_callers, 3 more}

name: "code\_execution"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"code\_execution"

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict?: boolean

BetaCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

BetaCodeExecutionToolResultError {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: string

type: "code\_execution\_tool\_result"

Accepts one of the following:

"code\_execution\_tool\_result"

BetaCodeExecutionToolResultBlockContent = [BetaCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error) {error\_code, type} \|[BetaCodeExecutionResultBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_result_block) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaCodeExecutionToolResultError {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

BetaCodeExecutionToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaCodeExecutionToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_param_content)

Accepts one of the following:

BetaCodeExecutionToolResultErrorParam {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlockParam {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: string

type: "code\_execution\_tool\_result"

Accepts one of the following:

"code\_execution\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaCodeExecutionToolResultBlockParamContent = [BetaCodeExecutionToolResultErrorParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_param) {error\_code, type} \|[BetaCodeExecutionResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_result_block_param) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaCodeExecutionToolResultErrorParam {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlockParam {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

BetaCodeExecutionToolResultError {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionToolResultErrorCode = "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

BetaCodeExecutionToolResultErrorParam {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaContainer {id, expires\_at, skills}

Information about the container used in the request (for the code execution tool)

id: string

Identifier for the container used in this request

expires\_at: string

The time at which the container will expire.

formatdate-time

skills: Array<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill) {skill\_id, type, version} >\|null

Skills loaded in the container

skill\_id: string

Skill ID

maxLength64

minLength1

type: "anthropic"\|"custom"

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: string

Skill version or 'latest' for most recent version

maxLength64

minLength1

BetaContainerParams {id, skills}

Container parameters with skills to be loaded.

id?: string\|null

Container id

skills?: Array<[BetaSkillParams](https://platform.claude.com/docs/en/api/beta#beta_skill_params) {skill\_id, type, version} >\|null

List of skills to load in the container

skill\_id: string

Skill ID

maxLength64

minLength1

type: "anthropic"\|"custom"

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version?: string

Skill version or 'latest' for most recent version

maxLength64

minLength1

BetaContainerUploadBlock {file\_id, type}

Response model for a file uploaded to the container.

file\_id: string

type: "container\_upload"

Accepts one of the following:

"container\_upload"

BetaContainerUploadBlockParam {file\_id, type, cache\_control}

A content block that represents a file to be uploaded to the container
Files uploaded via this block will be available in the container's input directory.

file\_id: string

type: "container\_upload"

Accepts one of the following:

"container\_upload"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaContentBlock = [BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} \|[BetaThinkingBlock](https://platform.claude.com/docs/en/api/beta#beta_thinking_block) {signature, thinking, type} \|[BetaRedactedThinkingBlock](https://platform.claude.com/docs/en/api/beta#beta_redacted_thinking_block) {data, type} \|11 more

Response model for a file uploaded to the container.

Accepts one of the following:

BetaTextBlock {citations, text, type}

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

BetaThinkingBlock {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

BetaRedactedThinkingBlock {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

BetaToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaServerToolUseBlock {id, caller, input, 2 more}

id: string

caller: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

input: Record<string, unknown>

name: "web\_search"\|"web\_fetch"\|"code\_execution"\|4 more

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

BetaWebSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

BetaWebSearchToolResultError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

Array<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

encrypted\_content: string

page\_age: string\|null

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

BetaWebFetchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebFetchToolResultErrorBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_block) {error\_code, type} \|[BetaWebFetchBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_block) {content, retrieved\_at, type, url}

Accepts one of the following:

BetaWebFetchToolResultErrorBlock {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchBlock {content, retrieved\_at, type, url}

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block) {citations, source, title, type}

citations: [BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config) {enabled} \|null

Citation configuration for the document

enabled: boolean

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type}

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

title: string\|null

The title of the document

type: "document"

Accepts one of the following:

"document"

retrieved\_at: string\|null

ISO 8601 timestamp when the content was retrieved

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

tool\_use\_id: string

type: "web\_fetch\_tool\_result"

Accepts one of the following:

"web\_fetch\_tool\_result"

BetaCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

BetaCodeExecutionToolResultError {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: string

type: "code\_execution\_tool\_result"

Accepts one of the following:

"code\_execution\_tool\_result"

BetaBashCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaBashCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_tool_result_error) {error\_code, type} \|[BetaBashCodeExecutionResultBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_result_block) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaBashCodeExecutionToolResultError {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: string

type: "bash\_code\_execution\_tool\_result"

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

BetaTextEditorCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaTextEditorCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_tool_result_error) {error\_code, error\_message, type} \|[BetaTextEditorCodeExecutionViewResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_view_result_block) {content, file\_type, num\_lines, 3 more} \|[BetaTextEditorCodeExecutionCreateResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_create_result_block) {is\_file\_update, type} \|[BetaTextEditorCodeExecutionStrReplaceResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_str_replace_result_block) {lines, new\_lines, new\_start, 3 more}

Accepts one of the following:

BetaTextEditorCodeExecutionToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: string\|null

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

BetaTextEditorCodeExecutionViewResultBlock {content, file\_type, num\_lines, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: number\|null

start\_line: number\|null

total\_lines: number\|null

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

BetaTextEditorCodeExecutionCreateResultBlock {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlock {lines, new\_lines, new\_start, 3 more}

lines: Array<string>\|null

new\_lines: number\|null

new\_start: number\|null

old\_lines: number\|null

old\_start: number\|null

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: string

type: "text\_editor\_code\_execution\_tool\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

BetaToolSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaToolSearchToolResultError](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_result_error) {error\_code, error\_message, type} \|[BetaToolSearchToolSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_search_result_block) {tool\_references, type}

Accepts one of the following:

BetaToolSearchToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: string\|null

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlock {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block) {tool\_name, type} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: string

type: "tool\_search\_tool\_result"

Accepts one of the following:

"tool\_search\_tool\_result"

BetaMCPToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

The name of the MCP tool

server\_name: string

The name of the MCP server

type: "mcp\_tool\_use"

Accepts one of the following:

"mcp\_tool\_use"

BetaMCPToolResultBlock {content, is\_error, tool\_use\_id, type}

content: string\|Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

Accepts one of the following:

string

Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

is\_error: boolean

tool\_use\_id: string

type: "mcp\_tool\_result"

Accepts one of the following:

"mcp\_tool\_result"

BetaContainerUploadBlock {file\_id, type}

Response model for a file uploaded to the container.

file\_id: string

type: "container\_upload"

Accepts one of the following:

"container\_upload"

BetaContentBlockParam = [BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} \|[BetaImageBlockParam](https://platform.claude.com/docs/en/api/beta#beta_image_block_param) {source, type, cache\_control} \|[BetaRequestDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_request_document_block) {source, type, cache\_control, 3 more} \|15 more

Regular text content.

Accepts one of the following:

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaRequestDocumentBlock {source, type, cache\_control, 3 more}

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type} \|[BetaContentBlockSource](https://platform.claude.com/docs/en/api/beta#beta_content_block_source) {content, type} \|2 more

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

BetaContentBlockSource {content, type}

content: string\|Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

string

Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "content"

Accepts one of the following:

"content"

BetaURLPDFSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileDocumentSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "document"

Accepts one of the following:

"document"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled} \|null

enabled?: boolean

context?: string\|null

title?: string\|null

BetaSearchResultBlockParam {content, source, title, 3 more}

content: Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} >

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

source: string

title: string

type: "search\_result"

Accepts one of the following:

"search\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled}

enabled?: boolean

BetaThinkingBlockParam {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

BetaRedactedThinkingBlockParam {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

BetaToolUseBlockParam {id, input, name, 3 more}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaToolResultBlockParam {tool\_use\_id, type, cache\_control, 2 more}

tool\_use\_id: string

type: "tool\_result"

Accepts one of the following:

"tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

content?: string\|Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} \|[BetaImageBlockParam](https://platform.claude.com/docs/en/api/beta#beta_image_block_param) {source, type, cache\_control} \|[BetaSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_search_result_block_param) {content, source, title, 3 more} \|2 more>

Accepts one of the following:

string

Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} \|[BetaImageBlockParam](https://platform.claude.com/docs/en/api/beta#beta_image_block_param) {source, type, cache\_control} \|[BetaSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_search_result_block_param) {content, source, title, 3 more} \|2 more>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaSearchResultBlockParam {content, source, title, 3 more}

content: Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} >

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

source: string

title: string

type: "search\_result"

Accepts one of the following:

"search\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled}

enabled?: boolean

BetaRequestDocumentBlock {source, type, cache\_control, 3 more}

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type} \|[BetaContentBlockSource](https://platform.claude.com/docs/en/api/beta#beta_content_block_source) {content, type} \|2 more

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

BetaContentBlockSource {content, type}

content: string\|Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

string

Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "content"

Accepts one of the following:

"content"

BetaURLPDFSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileDocumentSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "document"

Accepts one of the following:

"document"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled} \|null

enabled?: boolean

context?: string\|null

title?: string\|null

BetaToolReferenceBlockParam {tool\_name, type, cache\_control}

Tool reference block that can be included in tool\_result content.

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

is\_error?: boolean

BetaServerToolUseBlockParam {id, input, name, 3 more}

id: string

input: Record<string, unknown>

name: "web\_search"\|"web\_fetch"\|"code\_execution"\|4 more

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaWebSearchToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaWebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_param_content)

Accepts one of the following:

Array<[BetaWebSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block_param) {encrypted\_content, title, type, 2 more} >

encrypted\_content: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

page\_age?: string\|null

BetaWebSearchToolRequestError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaWebFetchToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaWebFetchToolResultErrorBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_block_param) {error\_code, type} \|[BetaWebFetchBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_block_param) {content, type, url, retrieved\_at}

Accepts one of the following:

BetaWebFetchToolResultErrorBlockParam {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchBlockParam {content, type, url, retrieved\_at}

content: [BetaRequestDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_request_document_block) {source, type, cache\_control, 3 more}

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type} \|[BetaContentBlockSource](https://platform.claude.com/docs/en/api/beta#beta_content_block_source) {content, type} \|2 more

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

BetaContentBlockSource {content, type}

content: string\|Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

string

Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "content"

Accepts one of the following:

"content"

BetaURLPDFSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileDocumentSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "document"

Accepts one of the following:

"document"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled} \|null

enabled?: boolean

context?: string\|null

title?: string\|null

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

retrieved\_at?: string\|null

ISO 8601 timestamp when the content was retrieved

tool\_use\_id: string

type: "web\_fetch\_tool\_result"

Accepts one of the following:

"web\_fetch\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaCodeExecutionToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaCodeExecutionToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_param_content)

Accepts one of the following:

BetaCodeExecutionToolResultErrorParam {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlockParam {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: string

type: "code\_execution\_tool\_result"

Accepts one of the following:

"code\_execution\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaBashCodeExecutionToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaBashCodeExecutionToolResultErrorParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_tool_result_error_param) {error\_code, type} \|[BetaBashCodeExecutionResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_result_block_param) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaBashCodeExecutionToolResultErrorParam {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionResultBlockParam {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block_param) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: string

type: "bash\_code\_execution\_tool\_result"

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaTextEditorCodeExecutionToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaTextEditorCodeExecutionToolResultErrorParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_tool_result_error_param) {error\_code, type, error\_message} \|[BetaTextEditorCodeExecutionViewResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_view_result_block_param) {content, file\_type, type, 3 more} \|[BetaTextEditorCodeExecutionCreateResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_create_result_block_param) {is\_file\_update, type} \|[BetaTextEditorCodeExecutionStrReplaceResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_str_replace_result_block_param) {type, lines, new\_lines, 3 more}

Accepts one of the following:

BetaTextEditorCodeExecutionToolResultErrorParam {error\_code, type, error\_message}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

error\_message?: string\|null

BetaTextEditorCodeExecutionViewResultBlockParam {content, file\_type, type, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

num\_lines?: number\|null

start\_line?: number\|null

total\_lines?: number\|null

BetaTextEditorCodeExecutionCreateResultBlockParam {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlockParam {type, lines, new\_lines, 3 more}

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

lines?: Array<string>\|null

new\_lines?: number\|null

new\_start?: number\|null

old\_lines?: number\|null

old\_start?: number\|null

tool\_use\_id: string

type: "text\_editor\_code\_execution\_tool\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaToolSearchToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaToolSearchToolResultErrorParam](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_result_error_param) {error\_code, type} \|[BetaToolSearchToolSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_search_result_block_param) {tool\_references, type}

Accepts one of the following:

BetaToolSearchToolResultErrorParam {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlockParam {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block_param) {tool\_name, type, cache\_control} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: string

type: "tool\_search\_tool\_result"

Accepts one of the following:

"tool\_search\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaMCPToolUseBlockParam {id, input, name, 3 more}

id: string

input: Record<string, unknown>

name: string

server\_name: string

The name of the MCP server

type: "mcp\_tool\_use"

Accepts one of the following:

"mcp\_tool\_use"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaRequestMCPToolResultBlockParam {tool\_use\_id, type, cache\_control, 2 more}

tool\_use\_id: string

type: "mcp\_tool\_result"

Accepts one of the following:

"mcp\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

content?: string\|Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} >

Accepts one of the following:

string

Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} >

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

is\_error?: boolean

BetaContainerUploadBlockParam {file\_id, type, cache\_control}

A content block that represents a file to be uploaded to the container
Files uploaded via this block will be available in the container's input directory.

file\_id: string

type: "container\_upload"

Accepts one of the following:

"container\_upload"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaContentBlockSource {content, type}

content: string\|Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

string

Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "content"

Accepts one of the following:

"content"

BetaContentBlockSourceContent = [BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} \|[BetaImageBlockParam](https://platform.claude.com/docs/en/api/beta#beta_image_block_param) {source, type, cache\_control}

Accepts one of the following:

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaContextManagementConfig {edits}

edits?: Array<[BetaClearToolUses20250919Edit](https://platform.claude.com/docs/en/api/beta#beta_clear_tool_uses_20250919_edit) {type, clear\_at\_least, clear\_tool\_inputs, 3 more} \|[BetaClearThinking20251015Edit](https://platform.claude.com/docs/en/api/beta#beta_clear_thinking_20251015_edit) {type, keep} >

List of context management edits to apply

Accepts one of the following:

BetaClearToolUses20250919Edit {type, clear\_at\_least, clear\_tool\_inputs, 3 more}

type: "clear\_tool\_uses\_20250919"

Accepts one of the following:

"clear\_tool\_uses\_20250919"

clear\_at\_least?: [BetaInputTokensClearAtLeast](https://platform.claude.com/docs/en/api/beta#beta_input_tokens_clear_at_least) {type, value} \|null

Minimum number of tokens that must be cleared when triggered. Context will only be modified if at least this many tokens can be removed.

type: "input\_tokens"

Accepts one of the following:

"input\_tokens"

value: number

clear\_tool\_inputs?: boolean\|Array<string>\|null

Whether to clear all tool inputs (bool) or specific tool inputs to clear (list)

Accepts one of the following:

boolean

Array<string>

exclude\_tools?: Array<string>\|null

Tool names whose uses are preserved from clearing

keep?: [BetaToolUsesKeep](https://platform.claude.com/docs/en/api/beta#beta_tool_uses_keep) {type, value}

Number of tool uses to retain in the conversation

type: "tool\_uses"

Accepts one of the following:

"tool\_uses"

value: number

trigger?: [BetaInputTokensTrigger](https://platform.claude.com/docs/en/api/beta#beta_input_tokens_trigger) {type, value} \|[BetaToolUsesTrigger](https://platform.claude.com/docs/en/api/beta#beta_tool_uses_trigger) {type, value}

Condition that triggers the context management strategy

Accepts one of the following:

BetaInputTokensTrigger {type, value}

type: "input\_tokens"

Accepts one of the following:

"input\_tokens"

value: number

BetaToolUsesTrigger {type, value}

type: "tool\_uses"

Accepts one of the following:

"tool\_uses"

value: number

BetaClearThinking20251015Edit {type, keep}

type: "clear\_thinking\_20251015"

Accepts one of the following:

"clear\_thinking\_20251015"

keep?: [BetaThinkingTurns](https://platform.claude.com/docs/en/api/beta#beta_thinking_turns) {type, value} \|[BetaAllThinkingTurns](https://platform.claude.com/docs/en/api/beta#beta_all_thinking_turns) {type} \|"all"

Number of most recent assistant turns to keep thinking blocks for. Older turns will have their thinking blocks removed.

Accepts one of the following:

BetaThinkingTurns {type, value}

type: "thinking\_turns"

Accepts one of the following:

"thinking\_turns"

value: number

BetaAllThinkingTurns {type}

type: "all"

Accepts one of the following:

"all"

"all"

"all"

BetaContextManagementResponse {applied\_edits}

applied\_edits: Array<[BetaClearToolUses20250919EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_tool_uses_20250919_edit_response) {cleared\_input\_tokens, cleared\_tool\_uses, type} \|[BetaClearThinking20251015EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_thinking_20251015_edit_response) {cleared\_input\_tokens, cleared\_thinking\_turns, type} >

List of context management edits that were applied.

Accepts one of the following:

BetaClearToolUses20250919EditResponse {cleared\_input\_tokens, cleared\_tool\_uses, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: number

Number of tool uses that were cleared.

minimum0

type: "clear\_tool\_uses\_20250919"

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

BetaClearThinking20251015EditResponse {cleared\_input\_tokens, cleared\_thinking\_turns, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: number

Number of thinking turns that were cleared.

minimum0

type: "clear\_thinking\_20251015"

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

BetaCountTokensContextManagementResponse {original\_input\_tokens}

original\_input\_tokens: number

The original token count before context management was applied

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaDocumentBlock {citations, source, title, type}

citations: [BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config) {enabled} \|null

Citation configuration for the document

enabled: boolean

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type}

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

title: string\|null

The title of the document

type: "document"

Accepts one of the following:

"document"

BetaFileDocumentSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaInputJSONDelta {partial\_json, type}

partial\_json: string

type: "input\_json\_delta"

Accepts one of the following:

"input\_json\_delta"

BetaInputTokensClearAtLeast {type, value}

type: "input\_tokens"

Accepts one of the following:

"input\_tokens"

value: number

BetaInputTokensTrigger {type, value}

type: "input\_tokens"

Accepts one of the following:

"input\_tokens"

value: number

BetaJSONOutputFormat {schema, type}

schema: Record<string, unknown>

The JSON schema of the format

type: "json\_schema"

Accepts one of the following:

"json\_schema"

BetaMCPToolConfig {defer\_loading, enabled}

Configuration for a specific tool in an MCP toolset.

defer\_loading?: boolean

enabled?: boolean

BetaMCPToolDefaultConfig {defer\_loading, enabled}

Default configuration for tools in an MCP toolset.

defer\_loading?: boolean

enabled?: boolean

BetaMCPToolResultBlock {content, is\_error, tool\_use\_id, type}

content: string\|Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

Accepts one of the following:

string

Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

is\_error: boolean

tool\_use\_id: string

type: "mcp\_tool\_result"

Accepts one of the following:

"mcp\_tool\_result"

BetaMCPToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

The name of the MCP tool

server\_name: string

The name of the MCP server

type: "mcp\_tool\_use"

Accepts one of the following:

"mcp\_tool\_use"

BetaMCPToolUseBlockParam {id, input, name, 3 more}

id: string

input: Record<string, unknown>

name: string

server\_name: string

The name of the MCP server

type: "mcp\_tool\_use"

Accepts one of the following:

"mcp\_tool\_use"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaMCPToolset {mcp\_server\_name, type, cache\_control, 2 more}

Configuration for a group of tools from an MCP server.

Allows configuring enabled status and defer\_loading for all tools
from an MCP server, with optional per-tool overrides.

mcp\_server\_name: string

Name of the MCP server to configure tools for

maxLength255

minLength1

type: "mcp\_toolset"

Accepts one of the following:

"mcp\_toolset"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

configs?: Record<string, [BetaMCPToolConfig](https://platform.claude.com/docs/en/api/beta#beta_mcp_tool_config) {defer\_loading, enabled} >\|null

Configuration overrides for specific tools, keyed by tool name

defer\_loading?: boolean

enabled?: boolean

default\_config?: [BetaMCPToolDefaultConfig](https://platform.claude.com/docs/en/api/beta#beta_mcp_tool_default_config) {defer\_loading, enabled}

Default configuration applied to all tools from this server

defer\_loading?: boolean

enabled?: boolean

BetaMemoryTool20250818 {name, type, allowed\_callers, 4 more}

name: "memory"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"memory"

type: "memory\_20250818"

Accepts one of the following:

"memory\_20250818"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaMemoryTool20250818Command = [BetaMemoryTool20250818ViewCommand](https://platform.claude.com/docs/en/api/beta#beta_memory_tool_20250818_view_command) {command, path, view\_range} \|[BetaMemoryTool20250818CreateCommand](https://platform.claude.com/docs/en/api/beta#beta_memory_tool_20250818_create_command) {command, file\_text, path} \|[BetaMemoryTool20250818StrReplaceCommand](https://platform.claude.com/docs/en/api/beta#beta_memory_tool_20250818_str_replace_command) {command, new\_str, old\_str, path} \|3 more

Accepts one of the following:

BetaMemoryTool20250818ViewCommand {command, path, view\_range}

command: "view"

Command type identifier

Accepts one of the following:

"view"

path: string

Path to directory or file to view

view\_range?: Array<number>

Optional line range for viewing specific lines

BetaMemoryTool20250818CreateCommand {command, file\_text, path}

command: "create"

Command type identifier

Accepts one of the following:

"create"

file\_text: string

Content to write to the file

path: string

Path where the file should be created

BetaMemoryTool20250818StrReplaceCommand {command, new\_str, old\_str, path}

command: "str\_replace"

Command type identifier

Accepts one of the following:

"str\_replace"

new\_str: string

Text to replace with

old\_str: string

Text to search for and replace

path: string

Path to the file where text should be replaced

BetaMemoryTool20250818InsertCommand {command, insert\_line, insert\_text, path}

command: "insert"

Command type identifier

Accepts one of the following:

"insert"

insert\_line: number

Line number where text should be inserted

minimum1

insert\_text: string

Text to insert at the specified line

path: string

Path to the file where text should be inserted

BetaMemoryTool20250818DeleteCommand {command, path}

command: "delete"

Command type identifier

Accepts one of the following:

"delete"

path: string

Path to the file or directory to delete

BetaMemoryTool20250818RenameCommand {command, new\_path, old\_path}

command: "rename"

Command type identifier

Accepts one of the following:

"rename"

new\_path: string

New path for the file or directory

old\_path: string

Current path of the file or directory

BetaMemoryTool20250818CreateCommand {command, file\_text, path}

command: "create"

Command type identifier

Accepts one of the following:

"create"

file\_text: string

Content to write to the file

path: string

Path where the file should be created

BetaMemoryTool20250818DeleteCommand {command, path}

command: "delete"

Command type identifier

Accepts one of the following:

"delete"

path: string

Path to the file or directory to delete

BetaMemoryTool20250818InsertCommand {command, insert\_line, insert\_text, path}

command: "insert"

Command type identifier

Accepts one of the following:

"insert"

insert\_line: number

Line number where text should be inserted

minimum1

insert\_text: string

Text to insert at the specified line

path: string

Path to the file where text should be inserted

BetaMemoryTool20250818RenameCommand {command, new\_path, old\_path}

command: "rename"

Command type identifier

Accepts one of the following:

"rename"

new\_path: string

New path for the file or directory

old\_path: string

Current path of the file or directory

BetaMemoryTool20250818StrReplaceCommand {command, new\_str, old\_str, path}

command: "str\_replace"

Command type identifier

Accepts one of the following:

"str\_replace"

new\_str: string

Text to replace with

old\_str: string

Text to search for and replace

path: string

Path to the file where text should be replaced

BetaMemoryTool20250818ViewCommand {command, path, view\_range}

command: "view"

Command type identifier

Accepts one of the following:

"view"

path: string

Path to directory or file to view

view\_range?: Array<number>

Optional line range for viewing specific lines

BetaMessage {id, container, content, 7 more}

id: string

Unique object identifier.

The format and length of IDs may change over time.

container: [BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container) {id, expires\_at, skills} \|null

Information about the container used in the request (for the code execution tool)

id: string

Identifier for the container used in this request

expires\_at: string

The time at which the container will expire.

formatdate-time

skills: Array<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill) {skill\_id, type, version} >\|null

Skills loaded in the container

skill\_id: string

Skill ID

maxLength64

minLength1

type: "anthropic"\|"custom"

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: string

Skill version or 'latest' for most recent version

maxLength64

minLength1

content: Array<[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)>

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

BetaTextBlock {citations, text, type}

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

BetaThinkingBlock {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

BetaRedactedThinkingBlock {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

BetaToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaServerToolUseBlock {id, caller, input, 2 more}

id: string

caller: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

input: Record<string, unknown>

name: "web\_search"\|"web\_fetch"\|"code\_execution"\|4 more

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

BetaWebSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

BetaWebSearchToolResultError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

Array<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

encrypted\_content: string

page\_age: string\|null

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

BetaWebFetchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebFetchToolResultErrorBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_block) {error\_code, type} \|[BetaWebFetchBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_block) {content, retrieved\_at, type, url}

Accepts one of the following:

BetaWebFetchToolResultErrorBlock {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchBlock {content, retrieved\_at, type, url}

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block) {citations, source, title, type}

citations: [BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config) {enabled} \|null

Citation configuration for the document

enabled: boolean

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type}

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

title: string\|null

The title of the document

type: "document"

Accepts one of the following:

"document"

retrieved\_at: string\|null

ISO 8601 timestamp when the content was retrieved

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

tool\_use\_id: string

type: "web\_fetch\_tool\_result"

Accepts one of the following:

"web\_fetch\_tool\_result"

BetaCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

BetaCodeExecutionToolResultError {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: string

type: "code\_execution\_tool\_result"

Accepts one of the following:

"code\_execution\_tool\_result"

BetaBashCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaBashCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_tool_result_error) {error\_code, type} \|[BetaBashCodeExecutionResultBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_result_block) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaBashCodeExecutionToolResultError {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: string

type: "bash\_code\_execution\_tool\_result"

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

BetaTextEditorCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaTextEditorCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_tool_result_error) {error\_code, error\_message, type} \|[BetaTextEditorCodeExecutionViewResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_view_result_block) {content, file\_type, num\_lines, 3 more} \|[BetaTextEditorCodeExecutionCreateResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_create_result_block) {is\_file\_update, type} \|[BetaTextEditorCodeExecutionStrReplaceResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_str_replace_result_block) {lines, new\_lines, new\_start, 3 more}

Accepts one of the following:

BetaTextEditorCodeExecutionToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: string\|null

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

BetaTextEditorCodeExecutionViewResultBlock {content, file\_type, num\_lines, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: number\|null

start\_line: number\|null

total\_lines: number\|null

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

BetaTextEditorCodeExecutionCreateResultBlock {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlock {lines, new\_lines, new\_start, 3 more}

lines: Array<string>\|null

new\_lines: number\|null

new\_start: number\|null

old\_lines: number\|null

old\_start: number\|null

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: string

type: "text\_editor\_code\_execution\_tool\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

BetaToolSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaToolSearchToolResultError](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_result_error) {error\_code, error\_message, type} \|[BetaToolSearchToolSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_search_result_block) {tool\_references, type}

Accepts one of the following:

BetaToolSearchToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: string\|null

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlock {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block) {tool\_name, type} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: string

type: "tool\_search\_tool\_result"

Accepts one of the following:

"tool\_search\_tool\_result"

BetaMCPToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

The name of the MCP tool

server\_name: string

The name of the MCP server

type: "mcp\_tool\_use"

Accepts one of the following:

"mcp\_tool\_use"

BetaMCPToolResultBlock {content, is\_error, tool\_use\_id, type}

content: string\|Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

Accepts one of the following:

string

Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

is\_error: boolean

tool\_use\_id: string

type: "mcp\_tool\_result"

Accepts one of the following:

"mcp\_tool\_result"

BetaContainerUploadBlock {file\_id, type}

Response model for a file uploaded to the container.

file\_id: string

type: "container\_upload"

Accepts one of the following:

"container\_upload"

context\_management: [BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response) {applied\_edits} \|null

Context management response.

Information about context management strategies applied during the request.

applied\_edits: Array<[BetaClearToolUses20250919EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_tool_uses_20250919_edit_response) {cleared\_input\_tokens, cleared\_tool\_uses, type} \|[BetaClearThinking20251015EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_thinking_20251015_edit_response) {cleared\_input\_tokens, cleared\_thinking\_turns, type} >

List of context management edits that were applied.

Accepts one of the following:

BetaClearToolUses20250919EditResponse {cleared\_input\_tokens, cleared\_tool\_uses, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: number

Number of tool uses that were cleared.

minimum0

type: "clear\_tool\_uses\_20250919"

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

BetaClearThinking20251015EditResponse {cleared\_input\_tokens, cleared\_thinking\_turns, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: number

Number of thinking turns that were cleared.

minimum0

type: "clear\_thinking\_20251015"

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

model: [Model](https://platform.claude.com/docs/en/api/messages#model)

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

"claude-opus-4-5-20251101"\|"claude-opus-4-5"\|"claude-3-7-sonnet-latest"\|17 more

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

(string & {})

role: "assistant"

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: [BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)\|null

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

stop\_sequence: string\|null

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage) {cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more}

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [BetaCacheCreation](https://platform.claude.com/docs/en/api/beta#beta_cache_creation) {ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens} \|null

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: number\|null

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number\|null

The number of input tokens read from the cache.

minimum0

input\_tokens: number

The number of input tokens which were used.

minimum0

output\_tokens: number

The number of output tokens which were used.

minimum0

server\_tool\_use: [BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage) {web\_fetch\_requests, web\_search\_requests} \|null

The number of server tool requests.

web\_fetch\_requests: number

The number of web fetch tool requests.

minimum0

web\_search\_requests: number

The number of web search tool requests.

minimum0

service\_tier: "standard"\|"priority"\|"batch"\|null

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

BetaMessageDeltaUsage {cache\_creation\_input\_tokens, cache\_read\_input\_tokens, input\_tokens, 2 more}

cache\_creation\_input\_tokens: number\|null

The cumulative number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number\|null

The cumulative number of input tokens read from the cache.

minimum0

input\_tokens: number\|null

The cumulative number of input tokens which were used.

minimum0

output\_tokens: number

The cumulative number of output tokens which were used.

server\_tool\_use: [BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage) {web\_fetch\_requests, web\_search\_requests} \|null

The number of server tool requests.

web\_fetch\_requests: number

The number of web fetch tool requests.

minimum0

web\_search\_requests: number

The number of web search tool requests.

minimum0

BetaMessageParam {content, role}

content: string\|Array<[BetaContentBlockParam](https://platform.claude.com/docs/en/api/beta#beta_content_block_param)>

Accepts one of the following:

string

Array<[BetaContentBlockParam](https://platform.claude.com/docs/en/api/beta#beta_content_block_param)>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaRequestDocumentBlock {source, type, cache\_control, 3 more}

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type} \|[BetaContentBlockSource](https://platform.claude.com/docs/en/api/beta#beta_content_block_source) {content, type} \|2 more

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

BetaContentBlockSource {content, type}

content: string\|Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

string

Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "content"

Accepts one of the following:

"content"

BetaURLPDFSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileDocumentSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "document"

Accepts one of the following:

"document"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled} \|null

enabled?: boolean

context?: string\|null

title?: string\|null

BetaSearchResultBlockParam {content, source, title, 3 more}

content: Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} >

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

source: string

title: string

type: "search\_result"

Accepts one of the following:

"search\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled}

enabled?: boolean

BetaThinkingBlockParam {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

BetaRedactedThinkingBlockParam {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

BetaToolUseBlockParam {id, input, name, 3 more}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaToolResultBlockParam {tool\_use\_id, type, cache\_control, 2 more}

tool\_use\_id: string

type: "tool\_result"

Accepts one of the following:

"tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

content?: string\|Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} \|[BetaImageBlockParam](https://platform.claude.com/docs/en/api/beta#beta_image_block_param) {source, type, cache\_control} \|[BetaSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_search_result_block_param) {content, source, title, 3 more} \|2 more>

Accepts one of the following:

string

Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} \|[BetaImageBlockParam](https://platform.claude.com/docs/en/api/beta#beta_image_block_param) {source, type, cache\_control} \|[BetaSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_search_result_block_param) {content, source, title, 3 more} \|2 more>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaSearchResultBlockParam {content, source, title, 3 more}

content: Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} >

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

source: string

title: string

type: "search\_result"

Accepts one of the following:

"search\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled}

enabled?: boolean

BetaRequestDocumentBlock {source, type, cache\_control, 3 more}

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type} \|[BetaContentBlockSource](https://platform.claude.com/docs/en/api/beta#beta_content_block_source) {content, type} \|2 more

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

BetaContentBlockSource {content, type}

content: string\|Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

string

Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "content"

Accepts one of the following:

"content"

BetaURLPDFSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileDocumentSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "document"

Accepts one of the following:

"document"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled} \|null

enabled?: boolean

context?: string\|null

title?: string\|null

BetaToolReferenceBlockParam {tool\_name, type, cache\_control}

Tool reference block that can be included in tool\_result content.

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

is\_error?: boolean

BetaServerToolUseBlockParam {id, input, name, 3 more}

id: string

input: Record<string, unknown>

name: "web\_search"\|"web\_fetch"\|"code\_execution"\|4 more

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaWebSearchToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaWebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_param_content)

Accepts one of the following:

Array<[BetaWebSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block_param) {encrypted\_content, title, type, 2 more} >

encrypted\_content: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

page\_age?: string\|null

BetaWebSearchToolRequestError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaWebFetchToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaWebFetchToolResultErrorBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_block_param) {error\_code, type} \|[BetaWebFetchBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_block_param) {content, type, url, retrieved\_at}

Accepts one of the following:

BetaWebFetchToolResultErrorBlockParam {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchBlockParam {content, type, url, retrieved\_at}

content: [BetaRequestDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_request_document_block) {source, type, cache\_control, 3 more}

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type} \|[BetaContentBlockSource](https://platform.claude.com/docs/en/api/beta#beta_content_block_source) {content, type} \|2 more

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

BetaContentBlockSource {content, type}

content: string\|Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

string

Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "content"

Accepts one of the following:

"content"

BetaURLPDFSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileDocumentSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "document"

Accepts one of the following:

"document"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled} \|null

enabled?: boolean

context?: string\|null

title?: string\|null

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

retrieved\_at?: string\|null

ISO 8601 timestamp when the content was retrieved

tool\_use\_id: string

type: "web\_fetch\_tool\_result"

Accepts one of the following:

"web\_fetch\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaCodeExecutionToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaCodeExecutionToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_param_content)

Accepts one of the following:

BetaCodeExecutionToolResultErrorParam {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlockParam {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: string

type: "code\_execution\_tool\_result"

Accepts one of the following:

"code\_execution\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaBashCodeExecutionToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaBashCodeExecutionToolResultErrorParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_tool_result_error_param) {error\_code, type} \|[BetaBashCodeExecutionResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_result_block_param) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaBashCodeExecutionToolResultErrorParam {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionResultBlockParam {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block_param) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: string

type: "bash\_code\_execution\_tool\_result"

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaTextEditorCodeExecutionToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaTextEditorCodeExecutionToolResultErrorParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_tool_result_error_param) {error\_code, type, error\_message} \|[BetaTextEditorCodeExecutionViewResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_view_result_block_param) {content, file\_type, type, 3 more} \|[BetaTextEditorCodeExecutionCreateResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_create_result_block_param) {is\_file\_update, type} \|[BetaTextEditorCodeExecutionStrReplaceResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_str_replace_result_block_param) {type, lines, new\_lines, 3 more}

Accepts one of the following:

BetaTextEditorCodeExecutionToolResultErrorParam {error\_code, type, error\_message}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

error\_message?: string\|null

BetaTextEditorCodeExecutionViewResultBlockParam {content, file\_type, type, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

num\_lines?: number\|null

start\_line?: number\|null

total\_lines?: number\|null

BetaTextEditorCodeExecutionCreateResultBlockParam {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlockParam {type, lines, new\_lines, 3 more}

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

lines?: Array<string>\|null

new\_lines?: number\|null

new\_start?: number\|null

old\_lines?: number\|null

old\_start?: number\|null

tool\_use\_id: string

type: "text\_editor\_code\_execution\_tool\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaToolSearchToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaToolSearchToolResultErrorParam](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_result_error_param) {error\_code, type} \|[BetaToolSearchToolSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_search_result_block_param) {tool\_references, type}

Accepts one of the following:

BetaToolSearchToolResultErrorParam {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlockParam {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block_param) {tool\_name, type, cache\_control} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: string

type: "tool\_search\_tool\_result"

Accepts one of the following:

"tool\_search\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaMCPToolUseBlockParam {id, input, name, 3 more}

id: string

input: Record<string, unknown>

name: string

server\_name: string

The name of the MCP server

type: "mcp\_tool\_use"

Accepts one of the following:

"mcp\_tool\_use"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaRequestMCPToolResultBlockParam {tool\_use\_id, type, cache\_control, 2 more}

tool\_use\_id: string

type: "mcp\_tool\_result"

Accepts one of the following:

"mcp\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

content?: string\|Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} >

Accepts one of the following:

string

Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} >

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

is\_error?: boolean

BetaContainerUploadBlockParam {file\_id, type, cache\_control}

A content block that represents a file to be uploaded to the container
Files uploaded via this block will be available in the container's input directory.

file\_id: string

type: "container\_upload"

Accepts one of the following:

"container\_upload"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

role: "user"\|"assistant"

Accepts one of the following:

"user"

"assistant"

BetaMessageTokensCount {context\_management, input\_tokens}

context\_management: [BetaCountTokensContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_count_tokens_context_management_response) {original\_input\_tokens} \|null

Information about context management applied to the message.

original\_input\_tokens: number

The original token count before context management was applied

input\_tokens: number

The total number of tokens across the provided list of messages, system prompt, and tools.

BetaMetadata {user\_id}

user\_id?: string\|null

An external identifier for the user who is associated with the request.

This should be a uuid, hash value, or other opaque identifier. Anthropic may use this id to help detect abuse. Do not include any identifying information such as name, email address, or phone number.

maxLength256

BetaOutputConfig {effort}

effort?: "low"\|"medium"\|"high"\|null

All possible effort levels.

Accepts one of the following:

"low"

"medium"

"high"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

BetaRawContentBlockDelta = [BetaTextDelta](https://platform.claude.com/docs/en/api/beta#beta_text_delta) {text, type} \|[BetaInputJSONDelta](https://platform.claude.com/docs/en/api/beta#beta_input_json_delta) {partial\_json, type} \|[BetaCitationsDelta](https://platform.claude.com/docs/en/api/beta#beta_citations_delta) {citation, type} \|2 more

Accepts one of the following:

BetaTextDelta {text, type}

text: string

type: "text\_delta"

Accepts one of the following:

"text\_delta"

BetaInputJSONDelta {partial\_json, type}

partial\_json: string

type: "input\_json\_delta"

Accepts one of the following:

"input\_json\_delta"

BetaCitationsDelta {citation, type}

citation: [BetaCitationCharLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_char_location) {cited\_text, document\_index, document\_title, 4 more} \|[BetaCitationPageLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_page_location) {cited\_text, document\_index, document\_title, 4 more} \|[BetaCitationContentBlockLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_content_block_location) {cited\_text, document\_index, document\_title, 4 more} \|2 more

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

type: "citations\_delta"

Accepts one of the following:

"citations\_delta"

BetaThinkingDelta {thinking, type}

thinking: string

type: "thinking\_delta"

Accepts one of the following:

"thinking\_delta"

BetaSignatureDelta {signature, type}

signature: string

type: "signature\_delta"

Accepts one of the following:

"signature\_delta"

BetaRawContentBlockDeltaEvent {delta, index, type}

delta: [BetaRawContentBlockDelta](https://platform.claude.com/docs/en/api/beta#beta_raw_content_block_delta)

Accepts one of the following:

BetaTextDelta {text, type}

text: string

type: "text\_delta"

Accepts one of the following:

"text\_delta"

BetaInputJSONDelta {partial\_json, type}

partial\_json: string

type: "input\_json\_delta"

Accepts one of the following:

"input\_json\_delta"

BetaCitationsDelta {citation, type}

citation: [BetaCitationCharLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_char_location) {cited\_text, document\_index, document\_title, 4 more} \|[BetaCitationPageLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_page_location) {cited\_text, document\_index, document\_title, 4 more} \|[BetaCitationContentBlockLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_content_block_location) {cited\_text, document\_index, document\_title, 4 more} \|2 more

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

type: "citations\_delta"

Accepts one of the following:

"citations\_delta"

BetaThinkingDelta {thinking, type}

thinking: string

type: "thinking\_delta"

Accepts one of the following:

"thinking\_delta"

BetaSignatureDelta {signature, type}

signature: string

type: "signature\_delta"

Accepts one of the following:

"signature\_delta"

index: number

type: "content\_block\_delta"

Accepts one of the following:

"content\_block\_delta"

BetaRawContentBlockStartEvent {content\_block, index, type}

content\_block: [BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} \|[BetaThinkingBlock](https://platform.claude.com/docs/en/api/beta#beta_thinking_block) {signature, thinking, type} \|[BetaRedactedThinkingBlock](https://platform.claude.com/docs/en/api/beta#beta_redacted_thinking_block) {data, type} \|11 more

Response model for a file uploaded to the container.

Accepts one of the following:

BetaTextBlock {citations, text, type}

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

BetaThinkingBlock {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

BetaRedactedThinkingBlock {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

BetaToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaServerToolUseBlock {id, caller, input, 2 more}

id: string

caller: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

input: Record<string, unknown>

name: "web\_search"\|"web\_fetch"\|"code\_execution"\|4 more

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

BetaWebSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

BetaWebSearchToolResultError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

Array<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

encrypted\_content: string

page\_age: string\|null

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

BetaWebFetchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebFetchToolResultErrorBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_block) {error\_code, type} \|[BetaWebFetchBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_block) {content, retrieved\_at, type, url}

Accepts one of the following:

BetaWebFetchToolResultErrorBlock {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchBlock {content, retrieved\_at, type, url}

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block) {citations, source, title, type}

citations: [BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config) {enabled} \|null

Citation configuration for the document

enabled: boolean

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type}

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

title: string\|null

The title of the document

type: "document"

Accepts one of the following:

"document"

retrieved\_at: string\|null

ISO 8601 timestamp when the content was retrieved

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

tool\_use\_id: string

type: "web\_fetch\_tool\_result"

Accepts one of the following:

"web\_fetch\_tool\_result"

BetaCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

BetaCodeExecutionToolResultError {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: string

type: "code\_execution\_tool\_result"

Accepts one of the following:

"code\_execution\_tool\_result"

BetaBashCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaBashCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_tool_result_error) {error\_code, type} \|[BetaBashCodeExecutionResultBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_result_block) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaBashCodeExecutionToolResultError {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: string

type: "bash\_code\_execution\_tool\_result"

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

BetaTextEditorCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaTextEditorCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_tool_result_error) {error\_code, error\_message, type} \|[BetaTextEditorCodeExecutionViewResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_view_result_block) {content, file\_type, num\_lines, 3 more} \|[BetaTextEditorCodeExecutionCreateResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_create_result_block) {is\_file\_update, type} \|[BetaTextEditorCodeExecutionStrReplaceResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_str_replace_result_block) {lines, new\_lines, new\_start, 3 more}

Accepts one of the following:

BetaTextEditorCodeExecutionToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: string\|null

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

BetaTextEditorCodeExecutionViewResultBlock {content, file\_type, num\_lines, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: number\|null

start\_line: number\|null

total\_lines: number\|null

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

BetaTextEditorCodeExecutionCreateResultBlock {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlock {lines, new\_lines, new\_start, 3 more}

lines: Array<string>\|null

new\_lines: number\|null

new\_start: number\|null

old\_lines: number\|null

old\_start: number\|null

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: string

type: "text\_editor\_code\_execution\_tool\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

BetaToolSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaToolSearchToolResultError](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_result_error) {error\_code, error\_message, type} \|[BetaToolSearchToolSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_search_result_block) {tool\_references, type}

Accepts one of the following:

BetaToolSearchToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: string\|null

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlock {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block) {tool\_name, type} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: string

type: "tool\_search\_tool\_result"

Accepts one of the following:

"tool\_search\_tool\_result"

BetaMCPToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

The name of the MCP tool

server\_name: string

The name of the MCP server

type: "mcp\_tool\_use"

Accepts one of the following:

"mcp\_tool\_use"

BetaMCPToolResultBlock {content, is\_error, tool\_use\_id, type}

content: string\|Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

Accepts one of the following:

string

Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

is\_error: boolean

tool\_use\_id: string

type: "mcp\_tool\_result"

Accepts one of the following:

"mcp\_tool\_result"

BetaContainerUploadBlock {file\_id, type}

Response model for a file uploaded to the container.

file\_id: string

type: "container\_upload"

Accepts one of the following:

"container\_upload"

index: number

type: "content\_block\_start"

Accepts one of the following:

"content\_block\_start"

BetaRawContentBlockStopEvent {index, type}

index: number

type: "content\_block\_stop"

Accepts one of the following:

"content\_block\_stop"

BetaRawMessageDeltaEvent {context\_management, delta, type, usage}

context\_management: [BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response) {applied\_edits} \|null

Information about context management strategies applied during the request

applied\_edits: Array<[BetaClearToolUses20250919EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_tool_uses_20250919_edit_response) {cleared\_input\_tokens, cleared\_tool\_uses, type} \|[BetaClearThinking20251015EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_thinking_20251015_edit_response) {cleared\_input\_tokens, cleared\_thinking\_turns, type} >

List of context management edits that were applied.

Accepts one of the following:

BetaClearToolUses20250919EditResponse {cleared\_input\_tokens, cleared\_tool\_uses, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: number

Number of tool uses that were cleared.

minimum0

type: "clear\_tool\_uses\_20250919"

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

BetaClearThinking20251015EditResponse {cleared\_input\_tokens, cleared\_thinking\_turns, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: number

Number of thinking turns that were cleared.

minimum0

type: "clear\_thinking\_20251015"

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

delta: Delta {container, stop\_reason, stop\_sequence}

container: [BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container) {id, expires\_at, skills} \|null

Information about the container used in the request (for the code execution tool)

id: string

Identifier for the container used in this request

expires\_at: string

The time at which the container will expire.

formatdate-time

skills: Array<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill) {skill\_id, type, version} >\|null

Skills loaded in the container

skill\_id: string

Skill ID

maxLength64

minLength1

type: "anthropic"\|"custom"

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: string

Skill version or 'latest' for most recent version

maxLength64

minLength1

stop\_reason: [BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)\|null

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

"model\_context\_window\_exceeded"

stop\_sequence: string\|null

type: "message\_delta"

Accepts one of the following:

"message\_delta"

usage: [BetaMessageDeltaUsage](https://platform.claude.com/docs/en/api/beta#beta_message_delta_usage) {cache\_creation\_input\_tokens, cache\_read\_input\_tokens, input\_tokens, 2 more}

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation\_input\_tokens: number\|null

The cumulative number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number\|null

The cumulative number of input tokens read from the cache.

minimum0

input\_tokens: number\|null

The cumulative number of input tokens which were used.

minimum0

output\_tokens: number

The cumulative number of output tokens which were used.

server\_tool\_use: [BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage) {web\_fetch\_requests, web\_search\_requests} \|null

The number of server tool requests.

web\_fetch\_requests: number

The number of web fetch tool requests.

minimum0

web\_search\_requests: number

The number of web search tool requests.

minimum0

BetaRawMessageStartEvent {message, type}

message: [BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message) {id, container, content, 7 more}

id: string

Unique object identifier.

The format and length of IDs may change over time.

container: [BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container) {id, expires\_at, skills} \|null

Information about the container used in the request (for the code execution tool)

id: string

Identifier for the container used in this request

expires\_at: string

The time at which the container will expire.

formatdate-time

skills: Array<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill) {skill\_id, type, version} >\|null

Skills loaded in the container

skill\_id: string

Skill ID

maxLength64

minLength1

type: "anthropic"\|"custom"

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: string

Skill version or 'latest' for most recent version

maxLength64

minLength1

content: Array<[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)>

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

BetaTextBlock {citations, text, type}

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

BetaThinkingBlock {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

BetaRedactedThinkingBlock {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

BetaToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaServerToolUseBlock {id, caller, input, 2 more}

id: string

caller: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

input: Record<string, unknown>

name: "web\_search"\|"web\_fetch"\|"code\_execution"\|4 more

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

BetaWebSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

BetaWebSearchToolResultError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

Array<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

encrypted\_content: string

page\_age: string\|null

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

BetaWebFetchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebFetchToolResultErrorBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_block) {error\_code, type} \|[BetaWebFetchBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_block) {content, retrieved\_at, type, url}

Accepts one of the following:

BetaWebFetchToolResultErrorBlock {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchBlock {content, retrieved\_at, type, url}

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block) {citations, source, title, type}

citations: [BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config) {enabled} \|null

Citation configuration for the document

enabled: boolean

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type}

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

title: string\|null

The title of the document

type: "document"

Accepts one of the following:

"document"

retrieved\_at: string\|null

ISO 8601 timestamp when the content was retrieved

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

tool\_use\_id: string

type: "web\_fetch\_tool\_result"

Accepts one of the following:

"web\_fetch\_tool\_result"

BetaCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

BetaCodeExecutionToolResultError {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: string

type: "code\_execution\_tool\_result"

Accepts one of the following:

"code\_execution\_tool\_result"

BetaBashCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaBashCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_tool_result_error) {error\_code, type} \|[BetaBashCodeExecutionResultBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_result_block) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaBashCodeExecutionToolResultError {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: string

type: "bash\_code\_execution\_tool\_result"

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

BetaTextEditorCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaTextEditorCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_tool_result_error) {error\_code, error\_message, type} \|[BetaTextEditorCodeExecutionViewResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_view_result_block) {content, file\_type, num\_lines, 3 more} \|[BetaTextEditorCodeExecutionCreateResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_create_result_block) {is\_file\_update, type} \|[BetaTextEditorCodeExecutionStrReplaceResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_str_replace_result_block) {lines, new\_lines, new\_start, 3 more}

Accepts one of the following:

BetaTextEditorCodeExecutionToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: string\|null

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

BetaTextEditorCodeExecutionViewResultBlock {content, file\_type, num\_lines, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: number\|null

start\_line: number\|null

total\_lines: number\|null

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

BetaTextEditorCodeExecutionCreateResultBlock {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlock {lines, new\_lines, new\_start, 3 more}

lines: Array<string>\|null

new\_lines: number\|null

new\_start: number\|null

old\_lines: number\|null

old\_start: number\|null

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: string

type: "text\_editor\_code\_execution\_tool\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

BetaToolSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaToolSearchToolResultError](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_result_error) {error\_code, error\_message, type} \|[BetaToolSearchToolSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_search_result_block) {tool\_references, type}

Accepts one of the following:

BetaToolSearchToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: string\|null

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlock {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block) {tool\_name, type} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: string

type: "tool\_search\_tool\_result"

Accepts one of the following:

"tool\_search\_tool\_result"

BetaMCPToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

The name of the MCP tool

server\_name: string

The name of the MCP server

type: "mcp\_tool\_use"

Accepts one of the following:

"mcp\_tool\_use"

BetaMCPToolResultBlock {content, is\_error, tool\_use\_id, type}

content: string\|Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

Accepts one of the following:

string

Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

is\_error: boolean

tool\_use\_id: string

type: "mcp\_tool\_result"

Accepts one of the following:

"mcp\_tool\_result"

BetaContainerUploadBlock {file\_id, type}

Response model for a file uploaded to the container.

file\_id: string

type: "container\_upload"

Accepts one of the following:

"container\_upload"

context\_management: [BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response) {applied\_edits} \|null

Context management response.

Information about context management strategies applied during the request.

applied\_edits: Array<[BetaClearToolUses20250919EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_tool_uses_20250919_edit_response) {cleared\_input\_tokens, cleared\_tool\_uses, type} \|[BetaClearThinking20251015EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_thinking_20251015_edit_response) {cleared\_input\_tokens, cleared\_thinking\_turns, type} >

List of context management edits that were applied.

Accepts one of the following:

BetaClearToolUses20250919EditResponse {cleared\_input\_tokens, cleared\_tool\_uses, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: number

Number of tool uses that were cleared.

minimum0

type: "clear\_tool\_uses\_20250919"

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

BetaClearThinking20251015EditResponse {cleared\_input\_tokens, cleared\_thinking\_turns, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: number

Number of thinking turns that were cleared.

minimum0

type: "clear\_thinking\_20251015"

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

model: [Model](https://platform.claude.com/docs/en/api/messages#model)

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

"claude-opus-4-5-20251101"\|"claude-opus-4-5"\|"claude-3-7-sonnet-latest"\|17 more

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

(string & {})

role: "assistant"

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: [BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)\|null

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

stop\_sequence: string\|null

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage) {cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more}

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [BetaCacheCreation](https://platform.claude.com/docs/en/api/beta#beta_cache_creation) {ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens} \|null

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: number\|null

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number\|null

The number of input tokens read from the cache.

minimum0

input\_tokens: number

The number of input tokens which were used.

minimum0

output\_tokens: number

The number of output tokens which were used.

minimum0

server\_tool\_use: [BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage) {web\_fetch\_requests, web\_search\_requests} \|null

The number of server tool requests.

web\_fetch\_requests: number

The number of web fetch tool requests.

minimum0

web\_search\_requests: number

The number of web search tool requests.

minimum0

service\_tier: "standard"\|"priority"\|"batch"\|null

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

type: "message\_start"

Accepts one of the following:

"message\_start"

BetaRawMessageStopEvent {type}

type: "message\_stop"

Accepts one of the following:

"message\_stop"

BetaRawMessageStreamEvent = [BetaRawMessageStartEvent](https://platform.claude.com/docs/en/api/beta#beta_raw_message_start_event) {message, type} \|[BetaRawMessageDeltaEvent](https://platform.claude.com/docs/en/api/beta#beta_raw_message_delta_event) {context\_management, delta, type, usage} \|[BetaRawMessageStopEvent](https://platform.claude.com/docs/en/api/beta#beta_raw_message_stop_event) {type} \|3 more

Accepts one of the following:

BetaRawMessageStartEvent {message, type}

message: [BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message) {id, container, content, 7 more}

id: string

Unique object identifier.

The format and length of IDs may change over time.

container: [BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container) {id, expires\_at, skills} \|null

Information about the container used in the request (for the code execution tool)

id: string

Identifier for the container used in this request

expires\_at: string

The time at which the container will expire.

formatdate-time

skills: Array<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill) {skill\_id, type, version} >\|null

Skills loaded in the container

skill\_id: string

Skill ID

maxLength64

minLength1

type: "anthropic"\|"custom"

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: string

Skill version or 'latest' for most recent version

maxLength64

minLength1

content: Array<[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)>

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

BetaTextBlock {citations, text, type}

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

BetaThinkingBlock {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

BetaRedactedThinkingBlock {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

BetaToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaServerToolUseBlock {id, caller, input, 2 more}

id: string

caller: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

input: Record<string, unknown>

name: "web\_search"\|"web\_fetch"\|"code\_execution"\|4 more

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

BetaWebSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

BetaWebSearchToolResultError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

Array<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

encrypted\_content: string

page\_age: string\|null

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

BetaWebFetchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebFetchToolResultErrorBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_block) {error\_code, type} \|[BetaWebFetchBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_block) {content, retrieved\_at, type, url}

Accepts one of the following:

BetaWebFetchToolResultErrorBlock {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchBlock {content, retrieved\_at, type, url}

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block) {citations, source, title, type}

citations: [BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config) {enabled} \|null

Citation configuration for the document

enabled: boolean

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type}

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

title: string\|null

The title of the document

type: "document"

Accepts one of the following:

"document"

retrieved\_at: string\|null

ISO 8601 timestamp when the content was retrieved

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

tool\_use\_id: string

type: "web\_fetch\_tool\_result"

Accepts one of the following:

"web\_fetch\_tool\_result"

BetaCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

BetaCodeExecutionToolResultError {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: string

type: "code\_execution\_tool\_result"

Accepts one of the following:

"code\_execution\_tool\_result"

BetaBashCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaBashCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_tool_result_error) {error\_code, type} \|[BetaBashCodeExecutionResultBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_result_block) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaBashCodeExecutionToolResultError {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: string

type: "bash\_code\_execution\_tool\_result"

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

BetaTextEditorCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaTextEditorCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_tool_result_error) {error\_code, error\_message, type} \|[BetaTextEditorCodeExecutionViewResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_view_result_block) {content, file\_type, num\_lines, 3 more} \|[BetaTextEditorCodeExecutionCreateResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_create_result_block) {is\_file\_update, type} \|[BetaTextEditorCodeExecutionStrReplaceResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_str_replace_result_block) {lines, new\_lines, new\_start, 3 more}

Accepts one of the following:

BetaTextEditorCodeExecutionToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: string\|null

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

BetaTextEditorCodeExecutionViewResultBlock {content, file\_type, num\_lines, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: number\|null

start\_line: number\|null

total\_lines: number\|null

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

BetaTextEditorCodeExecutionCreateResultBlock {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlock {lines, new\_lines, new\_start, 3 more}

lines: Array<string>\|null

new\_lines: number\|null

new\_start: number\|null

old\_lines: number\|null

old\_start: number\|null

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: string

type: "text\_editor\_code\_execution\_tool\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

BetaToolSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaToolSearchToolResultError](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_result_error) {error\_code, error\_message, type} \|[BetaToolSearchToolSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_search_result_block) {tool\_references, type}

Accepts one of the following:

BetaToolSearchToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: string\|null

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlock {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block) {tool\_name, type} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: string

type: "tool\_search\_tool\_result"

Accepts one of the following:

"tool\_search\_tool\_result"

BetaMCPToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

The name of the MCP tool

server\_name: string

The name of the MCP server

type: "mcp\_tool\_use"

Accepts one of the following:

"mcp\_tool\_use"

BetaMCPToolResultBlock {content, is\_error, tool\_use\_id, type}

content: string\|Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

Accepts one of the following:

string

Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

is\_error: boolean

tool\_use\_id: string

type: "mcp\_tool\_result"

Accepts one of the following:

"mcp\_tool\_result"

BetaContainerUploadBlock {file\_id, type}

Response model for a file uploaded to the container.

file\_id: string

type: "container\_upload"

Accepts one of the following:

"container\_upload"

context\_management: [BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response) {applied\_edits} \|null

Context management response.

Information about context management strategies applied during the request.

applied\_edits: Array<[BetaClearToolUses20250919EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_tool_uses_20250919_edit_response) {cleared\_input\_tokens, cleared\_tool\_uses, type} \|[BetaClearThinking20251015EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_thinking_20251015_edit_response) {cleared\_input\_tokens, cleared\_thinking\_turns, type} >

List of context management edits that were applied.

Accepts one of the following:

BetaClearToolUses20250919EditResponse {cleared\_input\_tokens, cleared\_tool\_uses, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: number

Number of tool uses that were cleared.

minimum0

type: "clear\_tool\_uses\_20250919"

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

BetaClearThinking20251015EditResponse {cleared\_input\_tokens, cleared\_thinking\_turns, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: number

Number of thinking turns that were cleared.

minimum0

type: "clear\_thinking\_20251015"

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

model: [Model](https://platform.claude.com/docs/en/api/messages#model)

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

"claude-opus-4-5-20251101"\|"claude-opus-4-5"\|"claude-3-7-sonnet-latest"\|17 more

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

(string & {})

role: "assistant"

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: [BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)\|null

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

stop\_sequence: string\|null

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage) {cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more}

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [BetaCacheCreation](https://platform.claude.com/docs/en/api/beta#beta_cache_creation) {ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens} \|null

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: number\|null

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number\|null

The number of input tokens read from the cache.

minimum0

input\_tokens: number

The number of input tokens which were used.

minimum0

output\_tokens: number

The number of output tokens which were used.

minimum0

server\_tool\_use: [BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage) {web\_fetch\_requests, web\_search\_requests} \|null

The number of server tool requests.

web\_fetch\_requests: number

The number of web fetch tool requests.

minimum0

web\_search\_requests: number

The number of web search tool requests.

minimum0

service\_tier: "standard"\|"priority"\|"batch"\|null

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

type: "message\_start"

Accepts one of the following:

"message\_start"

BetaRawMessageDeltaEvent {context\_management, delta, type, usage}

context\_management: [BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response) {applied\_edits} \|null

Information about context management strategies applied during the request

applied\_edits: Array<[BetaClearToolUses20250919EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_tool_uses_20250919_edit_response) {cleared\_input\_tokens, cleared\_tool\_uses, type} \|[BetaClearThinking20251015EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_thinking_20251015_edit_response) {cleared\_input\_tokens, cleared\_thinking\_turns, type} >

List of context management edits that were applied.

Accepts one of the following:

BetaClearToolUses20250919EditResponse {cleared\_input\_tokens, cleared\_tool\_uses, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: number

Number of tool uses that were cleared.

minimum0

type: "clear\_tool\_uses\_20250919"

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

BetaClearThinking20251015EditResponse {cleared\_input\_tokens, cleared\_thinking\_turns, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: number

Number of thinking turns that were cleared.

minimum0

type: "clear\_thinking\_20251015"

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

delta: Delta {container, stop\_reason, stop\_sequence}

container: [BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container) {id, expires\_at, skills} \|null

Information about the container used in the request (for the code execution tool)

id: string

Identifier for the container used in this request

expires\_at: string

The time at which the container will expire.

formatdate-time

skills: Array<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill) {skill\_id, type, version} >\|null

Skills loaded in the container

skill\_id: string

Skill ID

maxLength64

minLength1

type: "anthropic"\|"custom"

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: string

Skill version or 'latest' for most recent version

maxLength64

minLength1

stop\_reason: [BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)\|null

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

"model\_context\_window\_exceeded"

stop\_sequence: string\|null

type: "message\_delta"

Accepts one of the following:

"message\_delta"

usage: [BetaMessageDeltaUsage](https://platform.claude.com/docs/en/api/beta#beta_message_delta_usage) {cache\_creation\_input\_tokens, cache\_read\_input\_tokens, input\_tokens, 2 more}

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation\_input\_tokens: number\|null

The cumulative number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number\|null

The cumulative number of input tokens read from the cache.

minimum0

input\_tokens: number\|null

The cumulative number of input tokens which were used.

minimum0

output\_tokens: number

The cumulative number of output tokens which were used.

server\_tool\_use: [BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage) {web\_fetch\_requests, web\_search\_requests} \|null

The number of server tool requests.

web\_fetch\_requests: number

The number of web fetch tool requests.

minimum0

web\_search\_requests: number

The number of web search tool requests.

minimum0

BetaRawMessageStopEvent {type}

type: "message\_stop"

Accepts one of the following:

"message\_stop"

BetaRawContentBlockStartEvent {content\_block, index, type}

content\_block: [BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} \|[BetaThinkingBlock](https://platform.claude.com/docs/en/api/beta#beta_thinking_block) {signature, thinking, type} \|[BetaRedactedThinkingBlock](https://platform.claude.com/docs/en/api/beta#beta_redacted_thinking_block) {data, type} \|11 more

Response model for a file uploaded to the container.

Accepts one of the following:

BetaTextBlock {citations, text, type}

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

BetaThinkingBlock {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

BetaRedactedThinkingBlock {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

BetaToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaServerToolUseBlock {id, caller, input, 2 more}

id: string

caller: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

input: Record<string, unknown>

name: "web\_search"\|"web\_fetch"\|"code\_execution"\|4 more

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

BetaWebSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

BetaWebSearchToolResultError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

Array<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

encrypted\_content: string

page\_age: string\|null

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

BetaWebFetchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebFetchToolResultErrorBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_block) {error\_code, type} \|[BetaWebFetchBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_block) {content, retrieved\_at, type, url}

Accepts one of the following:

BetaWebFetchToolResultErrorBlock {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchBlock {content, retrieved\_at, type, url}

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block) {citations, source, title, type}

citations: [BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config) {enabled} \|null

Citation configuration for the document

enabled: boolean

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type}

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

title: string\|null

The title of the document

type: "document"

Accepts one of the following:

"document"

retrieved\_at: string\|null

ISO 8601 timestamp when the content was retrieved

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

tool\_use\_id: string

type: "web\_fetch\_tool\_result"

Accepts one of the following:

"web\_fetch\_tool\_result"

BetaCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

BetaCodeExecutionToolResultError {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: string

type: "code\_execution\_tool\_result"

Accepts one of the following:

"code\_execution\_tool\_result"

BetaBashCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaBashCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_tool_result_error) {error\_code, type} \|[BetaBashCodeExecutionResultBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_result_block) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaBashCodeExecutionToolResultError {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: string

type: "bash\_code\_execution\_tool\_result"

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

BetaTextEditorCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaTextEditorCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_tool_result_error) {error\_code, error\_message, type} \|[BetaTextEditorCodeExecutionViewResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_view_result_block) {content, file\_type, num\_lines, 3 more} \|[BetaTextEditorCodeExecutionCreateResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_create_result_block) {is\_file\_update, type} \|[BetaTextEditorCodeExecutionStrReplaceResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_str_replace_result_block) {lines, new\_lines, new\_start, 3 more}

Accepts one of the following:

BetaTextEditorCodeExecutionToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: string\|null

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

BetaTextEditorCodeExecutionViewResultBlock {content, file\_type, num\_lines, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: number\|null

start\_line: number\|null

total\_lines: number\|null

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

BetaTextEditorCodeExecutionCreateResultBlock {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlock {lines, new\_lines, new\_start, 3 more}

lines: Array<string>\|null

new\_lines: number\|null

new\_start: number\|null

old\_lines: number\|null

old\_start: number\|null

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: string

type: "text\_editor\_code\_execution\_tool\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

BetaToolSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaToolSearchToolResultError](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_result_error) {error\_code, error\_message, type} \|[BetaToolSearchToolSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_search_result_block) {tool\_references, type}

Accepts one of the following:

BetaToolSearchToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: string\|null

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlock {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block) {tool\_name, type} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: string

type: "tool\_search\_tool\_result"

Accepts one of the following:

"tool\_search\_tool\_result"

BetaMCPToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

The name of the MCP tool

server\_name: string

The name of the MCP server

type: "mcp\_tool\_use"

Accepts one of the following:

"mcp\_tool\_use"

BetaMCPToolResultBlock {content, is\_error, tool\_use\_id, type}

content: string\|Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

Accepts one of the following:

string

Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

is\_error: boolean

tool\_use\_id: string

type: "mcp\_tool\_result"

Accepts one of the following:

"mcp\_tool\_result"

BetaContainerUploadBlock {file\_id, type}

Response model for a file uploaded to the container.

file\_id: string

type: "container\_upload"

Accepts one of the following:

"container\_upload"

index: number

type: "content\_block\_start"

Accepts one of the following:

"content\_block\_start"

BetaRawContentBlockDeltaEvent {delta, index, type}

delta: [BetaRawContentBlockDelta](https://platform.claude.com/docs/en/api/beta#beta_raw_content_block_delta)

Accepts one of the following:

BetaTextDelta {text, type}

text: string

type: "text\_delta"

Accepts one of the following:

"text\_delta"

BetaInputJSONDelta {partial\_json, type}

partial\_json: string

type: "input\_json\_delta"

Accepts one of the following:

"input\_json\_delta"

BetaCitationsDelta {citation, type}

citation: [BetaCitationCharLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_char_location) {cited\_text, document\_index, document\_title, 4 more} \|[BetaCitationPageLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_page_location) {cited\_text, document\_index, document\_title, 4 more} \|[BetaCitationContentBlockLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_content_block_location) {cited\_text, document\_index, document\_title, 4 more} \|2 more

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

type: "citations\_delta"

Accepts one of the following:

"citations\_delta"

BetaThinkingDelta {thinking, type}

thinking: string

type: "thinking\_delta"

Accepts one of the following:

"thinking\_delta"

BetaSignatureDelta {signature, type}

signature: string

type: "signature\_delta"

Accepts one of the following:

"signature\_delta"

index: number

type: "content\_block\_delta"

Accepts one of the following:

"content\_block\_delta"

BetaRawContentBlockStopEvent {index, type}

index: number

type: "content\_block\_stop"

Accepts one of the following:

"content\_block\_stop"

BetaRedactedThinkingBlock {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

BetaRedactedThinkingBlockParam {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

BetaRequestDocumentBlock {source, type, cache\_control, 3 more}

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type} \|[BetaContentBlockSource](https://platform.claude.com/docs/en/api/beta#beta_content_block_source) {content, type} \|2 more

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

BetaContentBlockSource {content, type}

content: string\|Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

string

Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "content"

Accepts one of the following:

"content"

BetaURLPDFSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileDocumentSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "document"

Accepts one of the following:

"document"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled} \|null

enabled?: boolean

context?: string\|null

title?: string\|null

BetaRequestMCPServerToolConfiguration {allowed\_tools, enabled}

allowed\_tools?: Array<string>\|null

enabled?: boolean\|null

BetaRequestMCPServerURLDefinition {name, type, url, 2 more}

name: string

type: "url"

Accepts one of the following:

"url"

url: string

authorization\_token?: string\|null

tool\_configuration?: [BetaRequestMCPServerToolConfiguration](https://platform.claude.com/docs/en/api/beta#beta_request_mcp_server_tool_configuration) {allowed\_tools, enabled} \|null

allowed\_tools?: Array<string>\|null

enabled?: boolean\|null

BetaRequestMCPToolResultBlockParam {tool\_use\_id, type, cache\_control, 2 more}

tool\_use\_id: string

type: "mcp\_tool\_result"

Accepts one of the following:

"mcp\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

content?: string\|Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} >

Accepts one of the following:

string

Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} >

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

is\_error?: boolean

BetaSearchResultBlockParam {content, source, title, 3 more}

content: Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} >

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

source: string

title: string

type: "search\_result"

Accepts one of the following:

"search\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled}

enabled?: boolean

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaServerToolUsage {web\_fetch\_requests, web\_search\_requests}

web\_fetch\_requests: number

The number of web fetch tool requests.

minimum0

web\_search\_requests: number

The number of web search tool requests.

minimum0

BetaServerToolUseBlock {id, caller, input, 2 more}

id: string

caller: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

input: Record<string, unknown>

name: "web\_search"\|"web\_fetch"\|"code\_execution"\|4 more

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

BetaServerToolUseBlockParam {id, input, name, 3 more}

id: string

input: Record<string, unknown>

name: "web\_search"\|"web\_fetch"\|"code\_execution"\|4 more

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaSignatureDelta {signature, type}

signature: string

type: "signature\_delta"

Accepts one of the following:

"signature\_delta"

BetaSkill {skill\_id, type, version}

A skill that was loaded in a container (response model).

skill\_id: string

Skill ID

maxLength64

minLength1

type: "anthropic"\|"custom"

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: string

Skill version or 'latest' for most recent version

maxLength64

minLength1

BetaSkillParams {skill\_id, type, version}

Specification for a skill to be loaded in a container (request model).

skill\_id: string

Skill ID

maxLength64

minLength1

type: "anthropic"\|"custom"

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version?: string

Skill version or 'latest' for most recent version

maxLength64

minLength1

BetaStopReason = "end\_turn"\|"max\_tokens"\|"stop\_sequence"\|4 more

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

"model\_context\_window\_exceeded"

BetaTextBlock {citations, text, type}

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaTextCitation = [BetaCitationCharLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_char_location) {cited\_text, document\_index, document\_title, 4 more} \|[BetaCitationPageLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_page_location) {cited\_text, document\_index, document\_title, 4 more} \|[BetaCitationContentBlockLocation](https://platform.claude.com/docs/en/api/beta#beta_citation_content_block_location) {cited\_text, document\_index, document\_title, 4 more} \|2 more

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaTextCitationParam = [BetaCitationCharLocationParam](https://platform.claude.com/docs/en/api/beta#beta_citation_char_location_param) {cited\_text, document\_index, document\_title, 3 more} \|[BetaCitationPageLocationParam](https://platform.claude.com/docs/en/api/beta#beta_citation_page_location_param) {cited\_text, document\_index, document\_title, 3 more} \|[BetaCitationContentBlockLocationParam](https://platform.claude.com/docs/en/api/beta#beta_citation_content_block_location_param) {cited\_text, document\_index, document\_title, 3 more} \|2 more

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaTextDelta {text, type}

text: string

type: "text\_delta"

Accepts one of the following:

"text\_delta"

BetaTextEditorCodeExecutionCreateResultBlock {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionCreateResultBlockParam {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlock {lines, new\_lines, new\_start, 3 more}

lines: Array<string>\|null

new\_lines: number\|null

new\_start: number\|null

old\_lines: number\|null

old\_start: number\|null

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlockParam {type, lines, new\_lines, 3 more}

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

lines?: Array<string>\|null

new\_lines?: number\|null

new\_start?: number\|null

old\_lines?: number\|null

old\_start?: number\|null

BetaTextEditorCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaTextEditorCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_tool_result_error) {error\_code, error\_message, type} \|[BetaTextEditorCodeExecutionViewResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_view_result_block) {content, file\_type, num\_lines, 3 more} \|[BetaTextEditorCodeExecutionCreateResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_create_result_block) {is\_file\_update, type} \|[BetaTextEditorCodeExecutionStrReplaceResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_str_replace_result_block) {lines, new\_lines, new\_start, 3 more}

Accepts one of the following:

BetaTextEditorCodeExecutionToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: string\|null

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

BetaTextEditorCodeExecutionViewResultBlock {content, file\_type, num\_lines, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: number\|null

start\_line: number\|null

total\_lines: number\|null

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

BetaTextEditorCodeExecutionCreateResultBlock {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlock {lines, new\_lines, new\_start, 3 more}

lines: Array<string>\|null

new\_lines: number\|null

new\_start: number\|null

old\_lines: number\|null

old\_start: number\|null

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: string

type: "text\_editor\_code\_execution\_tool\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

BetaTextEditorCodeExecutionToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaTextEditorCodeExecutionToolResultErrorParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_tool_result_error_param) {error\_code, type, error\_message} \|[BetaTextEditorCodeExecutionViewResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_view_result_block_param) {content, file\_type, type, 3 more} \|[BetaTextEditorCodeExecutionCreateResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_create_result_block_param) {is\_file\_update, type} \|[BetaTextEditorCodeExecutionStrReplaceResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_str_replace_result_block_param) {type, lines, new\_lines, 3 more}

Accepts one of the following:

BetaTextEditorCodeExecutionToolResultErrorParam {error\_code, type, error\_message}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

error\_message?: string\|null

BetaTextEditorCodeExecutionViewResultBlockParam {content, file\_type, type, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

num\_lines?: number\|null

start\_line?: number\|null

total\_lines?: number\|null

BetaTextEditorCodeExecutionCreateResultBlockParam {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlockParam {type, lines, new\_lines, 3 more}

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

lines?: Array<string>\|null

new\_lines?: number\|null

new\_start?: number\|null

old\_lines?: number\|null

old\_start?: number\|null

tool\_use\_id: string

type: "text\_editor\_code\_execution\_tool\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaTextEditorCodeExecutionToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: string\|null

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

BetaTextEditorCodeExecutionToolResultErrorParam {error\_code, type, error\_message}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

error\_message?: string\|null

BetaTextEditorCodeExecutionViewResultBlock {content, file\_type, num\_lines, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: number\|null

start\_line: number\|null

total\_lines: number\|null

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

BetaTextEditorCodeExecutionViewResultBlockParam {content, file\_type, type, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

num\_lines?: number\|null

start\_line?: number\|null

total\_lines?: number\|null

BetaThinkingBlock {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

BetaThinkingBlockParam {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

BetaThinkingConfigDisabled {type}

type: "disabled"

Accepts one of the following:

"disabled"

BetaThinkingConfigEnabled {budget\_tokens, type}

budget\_tokens: number

Determines how many tokens Claude can use for its internal reasoning process. Larger budgets can enable more thorough analysis for complex problems, improving response quality.

Must be ≥1024 and less than `max_tokens`.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

minimum1024

type: "enabled"

Accepts one of the following:

"enabled"

BetaThinkingConfigParam = [BetaThinkingConfigEnabled](https://platform.claude.com/docs/en/api/beta#beta_thinking_config_enabled) {budget\_tokens, type} \|[BetaThinkingConfigDisabled](https://platform.claude.com/docs/en/api/beta#beta_thinking_config_disabled) {type}

Configuration for enabling Claude's extended thinking.

When enabled, responses include `thinking` content blocks showing Claude's thinking process before the final answer. Requires a minimum budget of 1,024 tokens and counts towards your `max_tokens` limit.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

Accepts one of the following:

BetaThinkingConfigEnabled {budget\_tokens, type}

budget\_tokens: number

Determines how many tokens Claude can use for its internal reasoning process. Larger budgets can enable more thorough analysis for complex problems, improving response quality.

Must be ≥1024 and less than `max_tokens`.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

minimum1024

type: "enabled"

Accepts one of the following:

"enabled"

BetaThinkingConfigDisabled {type}

type: "disabled"

Accepts one of the following:

"disabled"

BetaThinkingDelta {thinking, type}

thinking: string

type: "thinking\_delta"

Accepts one of the following:

"thinking\_delta"

BetaThinkingTurns {type, value}

type: "thinking\_turns"

Accepts one of the following:

"thinking\_turns"

value: number

BetaTool {input\_schema, name, allowed\_callers, 6 more}

input\_schema: InputSchema {type, properties, required}

[JSON schema](https://json-schema.org/draft/2020-12) for this tool's input.

This defines the shape of the `input` that your tool accepts and that the model will produce.

type: "object"

Accepts one of the following:

"object"

properties?: Record<string, unknown>\|null

required?: Array<string>\|null

name: string

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

maxLength128

minLength1

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

description?: string

Description of what this tool does.

Tool descriptions should be as detailed as possible. The more information that the model has about what the tool is and how to use it, the better it will perform. You can use natural language descriptions to reinforce important aspects of the tool input JSON schema.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

type?: "custom"\|null

Accepts one of the following:

"custom"

BetaToolBash20241022 {name, type, allowed\_callers, 4 more}

name: "bash"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: "bash\_20241022"

Accepts one of the following:

"bash\_20241022"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolBash20250124 {name, type, allowed\_callers, 4 more}

name: "bash"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: "bash\_20250124"

Accepts one of the following:

"bash\_20250124"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolChoice = [BetaToolChoiceAuto](https://platform.claude.com/docs/en/api/beta#beta_tool_choice_auto) {type, disable\_parallel\_tool\_use} \|[BetaToolChoiceAny](https://platform.claude.com/docs/en/api/beta#beta_tool_choice_any) {type, disable\_parallel\_tool\_use} \|[BetaToolChoiceTool](https://platform.claude.com/docs/en/api/beta#beta_tool_choice_tool) {name, type, disable\_parallel\_tool\_use} \|[BetaToolChoiceNone](https://platform.claude.com/docs/en/api/beta#beta_tool_choice_none) {type}

How the model should use the provided tools. The model can use a specific tool, any available tool, decide by itself, or not use tools at all.

Accepts one of the following:

BetaToolChoiceAuto {type, disable\_parallel\_tool\_use}

The model will automatically decide whether to use tools.

type: "auto"

Accepts one of the following:

"auto"

disable\_parallel\_tool\_use?: boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output at most one tool use.

BetaToolChoiceAny {type, disable\_parallel\_tool\_use}

The model will use any available tools.

type: "any"

Accepts one of the following:

"any"

disable\_parallel\_tool\_use?: boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

BetaToolChoiceTool {name, type, disable\_parallel\_tool\_use}

The model will use the specified tool with `tool_choice.name`.

name: string

The name of the tool to use.

type: "tool"

Accepts one of the following:

"tool"

disable\_parallel\_tool\_use?: boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

BetaToolChoiceNone {type}

The model will not be allowed to use tools.

type: "none"

Accepts one of the following:

"none"

BetaToolChoiceAny {type, disable\_parallel\_tool\_use}

The model will use any available tools.

type: "any"

Accepts one of the following:

"any"

disable\_parallel\_tool\_use?: boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

BetaToolChoiceAuto {type, disable\_parallel\_tool\_use}

The model will automatically decide whether to use tools.

type: "auto"

Accepts one of the following:

"auto"

disable\_parallel\_tool\_use?: boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output at most one tool use.

BetaToolChoiceNone {type}

The model will not be allowed to use tools.

type: "none"

Accepts one of the following:

"none"

BetaToolChoiceTool {name, type, disable\_parallel\_tool\_use}

The model will use the specified tool with `tool_choice.name`.

name: string

The name of the tool to use.

type: "tool"

Accepts one of the following:

"tool"

disable\_parallel\_tool\_use?: boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

BetaToolComputerUse20241022 {display\_height\_px, display\_width\_px, name, 7 more}

display\_height\_px: number

The height of the display in pixels.

minimum1

display\_width\_px: number

The width of the display in pixels.

minimum1

name: "computer"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"computer"

type: "computer\_20241022"

Accepts one of the following:

"computer\_20241022"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number?: number\|null

The X11 display number (e.g. 0, 1) for the display.

minimum0

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolComputerUse20250124 {display\_height\_px, display\_width\_px, name, 7 more}

display\_height\_px: number

The height of the display in pixels.

minimum1

display\_width\_px: number

The width of the display in pixels.

minimum1

name: "computer"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"computer"

type: "computer\_20250124"

Accepts one of the following:

"computer\_20250124"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number?: number\|null

The X11 display number (e.g. 0, 1) for the display.

minimum0

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolComputerUse20251124 {display\_height\_px, display\_width\_px, name, 8 more}

display\_height\_px: number

The height of the display in pixels.

minimum1

display\_width\_px: number

The width of the display in pixels.

minimum1

name: "computer"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"computer"

type: "computer\_20251124"

Accepts one of the following:

"computer\_20251124"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number?: number\|null

The X11 display number (e.g. 0, 1) for the display.

minimum0

enable\_zoom?: boolean

Whether to enable an action to take a zoomed-in screenshot of the screen.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolReferenceBlock {tool\_name, type}

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

BetaToolReferenceBlockParam {tool\_name, type, cache\_control}

Tool reference block that can be included in tool\_result content.

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaToolResultBlockParam {tool\_use\_id, type, cache\_control, 2 more}

tool\_use\_id: string

type: "tool\_result"

Accepts one of the following:

"tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

content?: string\|Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} \|[BetaImageBlockParam](https://platform.claude.com/docs/en/api/beta#beta_image_block_param) {source, type, cache\_control} \|[BetaSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_search_result_block_param) {content, source, title, 3 more} \|2 more>

Accepts one of the following:

string

Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} \|[BetaImageBlockParam](https://platform.claude.com/docs/en/api/beta#beta_image_block_param) {source, type, cache\_control} \|[BetaSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_search_result_block_param) {content, source, title, 3 more} \|2 more>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaSearchResultBlockParam {content, source, title, 3 more}

content: Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} >

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

source: string

title: string

type: "search\_result"

Accepts one of the following:

"search\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled}

enabled?: boolean

BetaRequestDocumentBlock {source, type, cache\_control, 3 more}

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type} \|[BetaContentBlockSource](https://platform.claude.com/docs/en/api/beta#beta_content_block_source) {content, type} \|2 more

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

BetaContentBlockSource {content, type}

content: string\|Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

string

Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "content"

Accepts one of the following:

"content"

BetaURLPDFSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileDocumentSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "document"

Accepts one of the following:

"document"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled} \|null

enabled?: boolean

context?: string\|null

title?: string\|null

BetaToolReferenceBlockParam {tool\_name, type, cache\_control}

Tool reference block that can be included in tool\_result content.

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

is\_error?: boolean

BetaToolSearchToolBm25\_20251119 {name, type, allowed\_callers, 3 more}

name: "tool\_search\_tool\_bm25"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"tool\_search\_tool\_bm25"

type: "tool\_search\_tool\_bm25\_20251119"\|"tool\_search\_tool\_bm25"

Accepts one of the following:

"tool\_search\_tool\_bm25\_20251119"

"tool\_search\_tool\_bm25"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict?: boolean

BetaToolSearchToolRegex20251119 {name, type, allowed\_callers, 3 more}

name: "tool\_search\_tool\_regex"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"tool\_search\_tool\_regex"

type: "tool\_search\_tool\_regex\_20251119"\|"tool\_search\_tool\_regex"

Accepts one of the following:

"tool\_search\_tool\_regex\_20251119"

"tool\_search\_tool\_regex"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict?: boolean

BetaToolSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaToolSearchToolResultError](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_result_error) {error\_code, error\_message, type} \|[BetaToolSearchToolSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_search_result_block) {tool\_references, type}

Accepts one of the following:

BetaToolSearchToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: string\|null

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlock {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block) {tool\_name, type} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: string

type: "tool\_search\_tool\_result"

Accepts one of the following:

"tool\_search\_tool\_result"

BetaToolSearchToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaToolSearchToolResultErrorParam](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_result_error_param) {error\_code, type} \|[BetaToolSearchToolSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_search_result_block_param) {tool\_references, type}

Accepts one of the following:

BetaToolSearchToolResultErrorParam {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlockParam {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block_param) {tool\_name, type, cache\_control} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: string

type: "tool\_search\_tool\_result"

Accepts one of the following:

"tool\_search\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaToolSearchToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: string\|null

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolResultErrorParam {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlock {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block) {tool\_name, type} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

BetaToolSearchToolSearchResultBlockParam {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block_param) {tool\_name, type, cache\_control} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

BetaToolTextEditor20241022 {name, type, allowed\_callers, 4 more}

name: "str\_replace\_editor"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: "text\_editor\_20241022"

Accepts one of the following:

"text\_editor\_20241022"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolTextEditor20250124 {name, type, allowed\_callers, 4 more}

name: "str\_replace\_editor"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: "text\_editor\_20250124"

Accepts one of the following:

"text\_editor\_20250124"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolTextEditor20250429 {name, type, allowed\_callers, 4 more}

name: "str\_replace\_based\_edit\_tool"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: "text\_editor\_20250429"

Accepts one of the following:

"text\_editor\_20250429"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolTextEditor20250728 {name, type, allowed\_callers, 5 more}

name: "str\_replace\_based\_edit\_tool"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: "text\_editor\_20250728"

Accepts one of the following:

"text\_editor\_20250728"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples?: Array<Record<string, unknown>>

max\_characters?: number\|null

Maximum number of characters to display when viewing a file. If not specified, defaults to displaying the full file.

minimum1

strict?: boolean

BetaToolUnion = [BetaTool](https://platform.claude.com/docs/en/api/beta#beta_tool) {input\_schema, name, allowed\_callers, 6 more} \|[BetaToolBash20241022](https://platform.claude.com/docs/en/api/beta#beta_tool_bash_20241022) {name, type, allowed\_callers, 4 more} \|[BetaToolBash20250124](https://platform.claude.com/docs/en/api/beta#beta_tool_bash_20250124) {name, type, allowed\_callers, 4 more} \|15 more

Configuration for a group of tools from an MCP server.

Allows configuring enabled status and defer\_loading for all tools
from an MCP server, with optional per-tool overrides.

Accepts one of the following:

BetaTool {input\_schema, name, allowed\_callers, 6 more}

input\_schema: InputSchema {type, properties, required}

[JSON schema](https://json-schema.org/draft/2020-12) for this tool's input.

This defines the shape of the `input` that your tool accepts and that the model will produce.

type: "object"

Accepts one of the following:

"object"

properties?: Record<string, unknown>\|null

required?: Array<string>\|null

name: string

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

maxLength128

minLength1

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

description?: string

Description of what this tool does.

Tool descriptions should be as detailed as possible. The more information that the model has about what the tool is and how to use it, the better it will perform. You can use natural language descriptions to reinforce important aspects of the tool input JSON schema.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

type?: "custom"\|null

Accepts one of the following:

"custom"

BetaToolBash20241022 {name, type, allowed\_callers, 4 more}

name: "bash"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: "bash\_20241022"

Accepts one of the following:

"bash\_20241022"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolBash20250124 {name, type, allowed\_callers, 4 more}

name: "bash"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: "bash\_20250124"

Accepts one of the following:

"bash\_20250124"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaCodeExecutionTool20250522 {name, type, allowed\_callers, 3 more}

name: "code\_execution"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"code\_execution"

type: "code\_execution\_20250522"

Accepts one of the following:

"code\_execution\_20250522"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict?: boolean

BetaCodeExecutionTool20250825 {name, type, allowed\_callers, 3 more}

name: "code\_execution"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"code\_execution"

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict?: boolean

BetaToolComputerUse20241022 {display\_height\_px, display\_width\_px, name, 7 more}

display\_height\_px: number

The height of the display in pixels.

minimum1

display\_width\_px: number

The width of the display in pixels.

minimum1

name: "computer"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"computer"

type: "computer\_20241022"

Accepts one of the following:

"computer\_20241022"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number?: number\|null

The X11 display number (e.g. 0, 1) for the display.

minimum0

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaMemoryTool20250818 {name, type, allowed\_callers, 4 more}

name: "memory"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"memory"

type: "memory\_20250818"

Accepts one of the following:

"memory\_20250818"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolComputerUse20250124 {display\_height\_px, display\_width\_px, name, 7 more}

display\_height\_px: number

The height of the display in pixels.

minimum1

display\_width\_px: number

The width of the display in pixels.

minimum1

name: "computer"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"computer"

type: "computer\_20250124"

Accepts one of the following:

"computer\_20250124"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number?: number\|null

The X11 display number (e.g. 0, 1) for the display.

minimum0

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolTextEditor20241022 {name, type, allowed\_callers, 4 more}

name: "str\_replace\_editor"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: "text\_editor\_20241022"

Accepts one of the following:

"text\_editor\_20241022"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolComputerUse20251124 {display\_height\_px, display\_width\_px, name, 8 more}

display\_height\_px: number

The height of the display in pixels.

minimum1

display\_width\_px: number

The width of the display in pixels.

minimum1

name: "computer"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"computer"

type: "computer\_20251124"

Accepts one of the following:

"computer\_20251124"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number?: number\|null

The X11 display number (e.g. 0, 1) for the display.

minimum0

enable\_zoom?: boolean

Whether to enable an action to take a zoomed-in screenshot of the screen.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolTextEditor20250124 {name, type, allowed\_callers, 4 more}

name: "str\_replace\_editor"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: "text\_editor\_20250124"

Accepts one of the following:

"text\_editor\_20250124"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolTextEditor20250429 {name, type, allowed\_callers, 4 more}

name: "str\_replace\_based\_edit\_tool"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: "text\_editor\_20250429"

Accepts one of the following:

"text\_editor\_20250429"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples?: Array<Record<string, unknown>>

strict?: boolean

BetaToolTextEditor20250728 {name, type, allowed\_callers, 5 more}

name: "str\_replace\_based\_edit\_tool"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: "text\_editor\_20250728"

Accepts one of the following:

"text\_editor\_20250728"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples?: Array<Record<string, unknown>>

max\_characters?: number\|null

Maximum number of characters to display when viewing a file. If not specified, defaults to displaying the full file.

minimum1

strict?: boolean

BetaWebSearchTool20250305 {name, type, allowed\_callers, 7 more}

name: "web\_search"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_search"

type: "web\_search\_20250305"

Accepts one of the following:

"web\_search\_20250305"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

allowed\_domains?: Array<string>\|null

If provided, only these domains will be included in results. Cannot be used alongside `blocked_domains`.

blocked\_domains?: Array<string>\|null

If provided, these domains will never appear in results. Cannot be used alongside `allowed_domains`.

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

max\_uses?: number\|null

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

strict?: boolean

user\_location?: UserLocation\|null

Parameters for the user's location. Used to provide more relevant search results.

type: "approximate"

Accepts one of the following:

"approximate"

city?: string\|null

The city of the user.

maxLength255

minLength1

country?: string\|null

The two letter [ISO country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) of the user.

maxLength2

minLength2

region?: string\|null

The region of the user.

maxLength255

minLength1

timezone?: string\|null

The [IANA timezone](https://nodatime.org/TimeZones) of the user.

maxLength255

minLength1

BetaWebFetchTool20250910 {name, type, allowed\_callers, 8 more}

name: "web\_fetch"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_fetch"

type: "web\_fetch\_20250910"

Accepts one of the following:

"web\_fetch\_20250910"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

allowed\_domains?: Array<string>\|null

List of domains to allow fetching from

blocked\_domains?: Array<string>\|null

List of domains to block fetching from

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled} \|null

Citations configuration for fetched documents. Citations are disabled by default.

enabled?: boolean

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

max\_content\_tokens?: number\|null

Maximum number of tokens used by including web page text content in the context. The limit is approximate and does not apply to binary content such as PDFs.

exclusiveMinimum0

max\_uses?: number\|null

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

strict?: boolean

BetaToolSearchToolBm25\_20251119 {name, type, allowed\_callers, 3 more}

name: "tool\_search\_tool\_bm25"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"tool\_search\_tool\_bm25"

type: "tool\_search\_tool\_bm25\_20251119"\|"tool\_search\_tool\_bm25"

Accepts one of the following:

"tool\_search\_tool\_bm25\_20251119"

"tool\_search\_tool\_bm25"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict?: boolean

BetaToolSearchToolRegex20251119 {name, type, allowed\_callers, 3 more}

name: "tool\_search\_tool\_regex"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"tool\_search\_tool\_regex"

type: "tool\_search\_tool\_regex\_20251119"\|"tool\_search\_tool\_regex"

Accepts one of the following:

"tool\_search\_tool\_regex\_20251119"

"tool\_search\_tool\_regex"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict?: boolean

BetaMCPToolset {mcp\_server\_name, type, cache\_control, 2 more}

Configuration for a group of tools from an MCP server.

Allows configuring enabled status and defer\_loading for all tools
from an MCP server, with optional per-tool overrides.

mcp\_server\_name: string

Name of the MCP server to configure tools for

maxLength255

minLength1

type: "mcp\_toolset"

Accepts one of the following:

"mcp\_toolset"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

configs?: Record<string, [BetaMCPToolConfig](https://platform.claude.com/docs/en/api/beta#beta_mcp_tool_config) {defer\_loading, enabled} >\|null

Configuration overrides for specific tools, keyed by tool name

defer\_loading?: boolean

enabled?: boolean

default\_config?: [BetaMCPToolDefaultConfig](https://platform.claude.com/docs/en/api/beta#beta_mcp_tool_default_config) {defer\_loading, enabled}

Default configuration applied to all tools from this server

defer\_loading?: boolean

enabled?: boolean

BetaToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaToolUseBlockParam {id, input, name, 3 more}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaToolUsesKeep {type, value}

type: "tool\_uses"

Accepts one of the following:

"tool\_uses"

value: number

BetaToolUsesTrigger {type, value}

type: "tool\_uses"

Accepts one of the following:

"tool\_uses"

value: number

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaURLPDFSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaUsage {cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more}

cache\_creation: [BetaCacheCreation](https://platform.claude.com/docs/en/api/beta#beta_cache_creation) {ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens} \|null

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: number\|null

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number\|null

The number of input tokens read from the cache.

minimum0

input\_tokens: number

The number of input tokens which were used.

minimum0

output\_tokens: number

The number of output tokens which were used.

minimum0

server\_tool\_use: [BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage) {web\_fetch\_requests, web\_search\_requests} \|null

The number of server tool requests.

web\_fetch\_requests: number

The number of web fetch tool requests.

minimum0

web\_search\_requests: number

The number of web search tool requests.

minimum0

service\_tier: "standard"\|"priority"\|"batch"\|null

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

BetaWebFetchBlock {content, retrieved\_at, type, url}

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block) {citations, source, title, type}

citations: [BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config) {enabled} \|null

Citation configuration for the document

enabled: boolean

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type}

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

title: string\|null

The title of the document

type: "document"

Accepts one of the following:

"document"

retrieved\_at: string\|null

ISO 8601 timestamp when the content was retrieved

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

BetaWebFetchBlockParam {content, type, url, retrieved\_at}

content: [BetaRequestDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_request_document_block) {source, type, cache\_control, 3 more}

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type} \|[BetaContentBlockSource](https://platform.claude.com/docs/en/api/beta#beta_content_block_source) {content, type} \|2 more

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

BetaContentBlockSource {content, type}

content: string\|Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

string

Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "content"

Accepts one of the following:

"content"

BetaURLPDFSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileDocumentSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "document"

Accepts one of the following:

"document"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled} \|null

enabled?: boolean

context?: string\|null

title?: string\|null

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

retrieved\_at?: string\|null

ISO 8601 timestamp when the content was retrieved

BetaWebFetchTool20250910 {name, type, allowed\_callers, 8 more}

name: "web\_fetch"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_fetch"

type: "web\_fetch\_20250910"

Accepts one of the following:

"web\_fetch\_20250910"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

allowed\_domains?: Array<string>\|null

List of domains to allow fetching from

blocked\_domains?: Array<string>\|null

List of domains to block fetching from

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled} \|null

Citations configuration for fetched documents. Citations are disabled by default.

enabled?: boolean

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

max\_content\_tokens?: number\|null

Maximum number of tokens used by including web page text content in the context. The limit is approximate and does not apply to binary content such as PDFs.

exclusiveMinimum0

max\_uses?: number\|null

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

strict?: boolean

BetaWebFetchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebFetchToolResultErrorBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_block) {error\_code, type} \|[BetaWebFetchBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_block) {content, retrieved\_at, type, url}

Accepts one of the following:

BetaWebFetchToolResultErrorBlock {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchBlock {content, retrieved\_at, type, url}

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block) {citations, source, title, type}

citations: [BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config) {enabled} \|null

Citation configuration for the document

enabled: boolean

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type}

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

title: string\|null

The title of the document

type: "document"

Accepts one of the following:

"document"

retrieved\_at: string\|null

ISO 8601 timestamp when the content was retrieved

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

tool\_use\_id: string

type: "web\_fetch\_tool\_result"

Accepts one of the following:

"web\_fetch\_tool\_result"

BetaWebFetchToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaWebFetchToolResultErrorBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_block_param) {error\_code, type} \|[BetaWebFetchBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_block_param) {content, type, url, retrieved\_at}

Accepts one of the following:

BetaWebFetchToolResultErrorBlockParam {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchBlockParam {content, type, url, retrieved\_at}

content: [BetaRequestDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_request_document_block) {source, type, cache\_control, 3 more}

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type} \|[BetaContentBlockSource](https://platform.claude.com/docs/en/api/beta#beta_content_block_source) {content, type} \|2 more

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

BetaContentBlockSource {content, type}

content: string\|Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

Accepts one of the following:

string

Array<[BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)>

BetaTextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: Array<[BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)>\|null

Accepts one of the following:

BetaCitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) {data, media\_type, type} \|[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) {type, url} \|[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) {file\_id, type}

Accepts one of the following:

BetaBase64ImageSource {data, media\_type, type}

data: string

media\_type: "image/jpeg"\|"image/png"\|"image/gif"\|"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

type: "content"

Accepts one of the following:

"content"

BetaURLPDFSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileDocumentSource {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "document"

Accepts one of the following:

"document"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations?: [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) {enabled} \|null

enabled?: boolean

context?: string\|null

title?: string\|null

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

retrieved\_at?: string\|null

ISO 8601 timestamp when the content was retrieved

tool\_use\_id: string

type: "web\_fetch\_tool\_result"

Accepts one of the following:

"web\_fetch\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaWebFetchToolResultErrorBlock {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchToolResultErrorBlockParam {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchToolResultErrorCode = "invalid\_tool\_input"\|"url\_too\_long"\|"url\_not\_allowed"\|5 more

Accepts one of the following:

"invalid\_tool\_input"

"url\_too\_long"

"url\_not\_allowed"

"url\_not\_accessible"

"unsupported\_content\_type"

"too\_many\_requests"

"max\_uses\_exceeded"

"unavailable"

BetaWebSearchResultBlock {encrypted\_content, page\_age, title, 2 more}

encrypted\_content: string

page\_age: string\|null

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

BetaWebSearchResultBlockParam {encrypted\_content, title, type, 2 more}

encrypted\_content: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

page\_age?: string\|null

BetaWebSearchTool20250305 {name, type, allowed\_callers, 7 more}

name: "web\_search"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_search"

type: "web\_search\_20250305"

Accepts one of the following:

"web\_search\_20250305"

allowed\_callers?: Array<"direct"\|"code\_execution\_20250825">

Accepts one of the following:

"direct"

"code\_execution\_20250825"

allowed\_domains?: Array<string>\|null

If provided, only these domains will be included in results. Cannot be used alongside `blocked_domains`.

blocked\_domains?: Array<string>\|null

If provided, these domains will never appear in results. Cannot be used alongside `allowed_domains`.

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading?: boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

max\_uses?: number\|null

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

strict?: boolean

user\_location?: UserLocation\|null

Parameters for the user's location. Used to provide more relevant search results.

type: "approximate"

Accepts one of the following:

"approximate"

city?: string\|null

The city of the user.

maxLength255

minLength1

country?: string\|null

The two letter [ISO country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) of the user.

maxLength2

minLength2

region?: string\|null

The region of the user.

maxLength255

minLength1

timezone?: string\|null

The [IANA timezone](https://nodatime.org/TimeZones) of the user.

maxLength255

minLength1

BetaWebSearchToolRequestError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

BetaWebSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

BetaWebSearchToolResultError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

Array<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

encrypted\_content: string

page\_age: string\|null

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

BetaWebSearchToolResultBlockContent = [BetaWebSearchToolResultError](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error) {error\_code, type} \|Array<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

Accepts one of the following:

BetaWebSearchToolResultError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

Array<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

encrypted\_content: string

page\_age: string\|null

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

BetaWebSearchToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [BetaWebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_param_content)

Accepts one of the following:

Array<[BetaWebSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block_param) {encrypted\_content, title, type, 2 more} >

encrypted\_content: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

page\_age?: string\|null

BetaWebSearchToolRequestError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

cache\_control?: [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) {type, ttl} \|null

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl?: "5m"\|"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaWebSearchToolResultBlockParamContent = Array<[BetaWebSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block_param) {encrypted\_content, title, type, 2 more} >\|[BetaWebSearchToolRequestError](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_request_error) {error\_code, type}

Accepts one of the following:

Array<[BetaWebSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block_param) {encrypted\_content, title, type, 2 more} >

encrypted\_content: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

page\_age?: string\|null

BetaWebSearchToolRequestError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

BetaWebSearchToolResultError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

BetaWebSearchToolResultErrorCode = "invalid\_tool\_input"\|"unavailable"\|"max\_uses\_exceeded"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

#### BetaMessagesBatches

##### [Create a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/create)

client.beta.messages.batches.create(BatchCreateParams {requests, betas} params, RequestOptionsoptions?): [BetaMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_message_batch) {id, archived\_at, cancel\_initiated\_at, 7 more}

post/v1/messages/batches

##### [Retrieve a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/retrieve)

client.beta.messages.batches.retrieve(stringmessageBatchID, BatchRetrieveParams {betas} params?, RequestOptionsoptions?): [BetaMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_message_batch) {id, archived\_at, cancel\_initiated\_at, 7 more}

get/v1/messages/batches/{message\_batch\_id}

##### [List Message Batches](https://platform.claude.com/docs/en/api/beta/messages/batches/list)

client.beta.messages.batches.list(BatchListParams {after\_id, before\_id, limit, betas} params?, RequestOptionsoptions?): Page<[BetaMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_message_batch) {id, archived\_at, cancel\_initiated\_at, 7 more} >

get/v1/messages/batches

##### [Cancel a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/cancel)

client.beta.messages.batches.cancel(stringmessageBatchID, BatchCancelParams {betas} params?, RequestOptionsoptions?): [BetaMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_message_batch) {id, archived\_at, cancel\_initiated\_at, 7 more}

post/v1/messages/batches/{message\_batch\_id}/cancel

##### [Delete a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/delete)

client.beta.messages.batches.delete(stringmessageBatchID, BatchDeleteParams {betas} params?, RequestOptionsoptions?): [BetaDeletedMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_deleted_message_batch) {id, type}

delete/v1/messages/batches/{message\_batch\_id}

##### [Retrieve Message Batch results](https://platform.claude.com/docs/en/api/beta/messages/batches/results)

client.beta.messages.batches.results(stringmessageBatchID, BatchResultsParams {betas} params?, RequestOptionsoptions?): [BetaMessageBatchIndividualResponse](https://platform.claude.com/docs/en/api/beta#beta_message_batch_individual_response) {custom\_id, result} \|Stream<[BetaMessageBatchIndividualResponse](https://platform.claude.com/docs/en/api/beta#beta_message_batch_individual_response) {custom\_id, result} >

get/v1/messages/batches/{message\_batch\_id}/results

##### ModelsExpand Collapse

BetaDeletedMessageBatch {id, type}

id: string

ID of the Message Batch.

type: "message\_batch\_deleted"

Deleted object type.

For Message Batches, this is always `"message_batch_deleted"`.

Accepts one of the following:

"message\_batch\_deleted"

BetaMessageBatch {id, archived\_at, cancel\_initiated\_at, 7 more}

id: string

Unique object identifier.

The format and length of IDs may change over time.

archived\_at: string\|null

RFC 3339 datetime string representing the time at which the Message Batch was archived and its results became unavailable.

formatdate-time

cancel\_initiated\_at: string\|null

RFC 3339 datetime string representing the time at which cancellation was initiated for the Message Batch. Specified only if cancellation was initiated.

formatdate-time

created\_at: string

RFC 3339 datetime string representing the time at which the Message Batch was created.

formatdate-time

ended\_at: string\|null

RFC 3339 datetime string representing the time at which processing for the Message Batch ended. Specified only once processing ends.

Processing ends when every request in a Message Batch has either succeeded, errored, canceled, or expired.

formatdate-time

expires\_at: string

RFC 3339 datetime string representing the time at which the Message Batch will expire and end processing, which is 24 hours after creation.

formatdate-time

processing\_status: "in\_progress"\|"canceling"\|"ended"

Processing status of the Message Batch.

Accepts one of the following:

"in\_progress"

"canceling"

"ended"

request\_counts: [BetaMessageBatchRequestCounts](https://platform.claude.com/docs/en/api/beta#beta_message_batch_request_counts) {canceled, errored, expired, 2 more}

Tallies requests within the Message Batch, categorized by their status.

Requests start as `processing` and move to one of the other statuses only once processing of the entire batch ends. The sum of all values always matches the total number of requests in the batch.

canceled: number

Number of requests in the Message Batch that have been canceled.

This is zero until processing of the entire Message Batch has ended.

errored: number

Number of requests in the Message Batch that encountered an error.

This is zero until processing of the entire Message Batch has ended.

expired: number

Number of requests in the Message Batch that have expired.

This is zero until processing of the entire Message Batch has ended.

processing: number

Number of requests in the Message Batch that are processing.

succeeded: number

Number of requests in the Message Batch that have completed successfully.

This is zero until processing of the entire Message Batch has ended.

results\_url: string\|null

URL to a `.jsonl` file containing the results of the Message Batch requests. Specified only once processing ends.

Results in the file are not guaranteed to be in the same order as requests. Use the `custom_id` field to match results to requests.

type: "message\_batch"

Object type.

For Message Batches, this is always `"message_batch"`.

Accepts one of the following:

"message\_batch"

BetaMessageBatchCanceledResult {type}

type: "canceled"

Accepts one of the following:

"canceled"

BetaMessageBatchErroredResult {error, type}

error: [BetaErrorResponse](https://platform.claude.com/docs/en/api/beta#beta_error_response) {error, request\_id, type}

error: [BetaError](https://platform.claude.com/docs/en/api/beta#beta_error)

Accepts one of the following:

BetaInvalidRequestError {message, type}

message: string

type: "invalid\_request\_error"

Accepts one of the following:

"invalid\_request\_error"

BetaAuthenticationError {message, type}

message: string

type: "authentication\_error"

Accepts one of the following:

"authentication\_error"

BetaBillingError {message, type}

message: string

type: "billing\_error"

Accepts one of the following:

"billing\_error"

BetaPermissionError {message, type}

message: string

type: "permission\_error"

Accepts one of the following:

"permission\_error"

BetaNotFoundError {message, type}

message: string

type: "not\_found\_error"

Accepts one of the following:

"not\_found\_error"

BetaRateLimitError {message, type}

message: string

type: "rate\_limit\_error"

Accepts one of the following:

"rate\_limit\_error"

BetaGatewayTimeoutError {message, type}

message: string

type: "timeout\_error"

Accepts one of the following:

"timeout\_error"

BetaAPIError {message, type}

message: string

type: "api\_error"

Accepts one of the following:

"api\_error"

BetaOverloadedError {message, type}

message: string

type: "overloaded\_error"

Accepts one of the following:

"overloaded\_error"

request\_id: string\|null

type: "error"

Accepts one of the following:

"error"

type: "errored"

Accepts one of the following:

"errored"

BetaMessageBatchExpiredResult {type}

type: "expired"

Accepts one of the following:

"expired"

BetaMessageBatchIndividualResponse {custom\_id, result}

This is a single line in the response `.jsonl` file and does not represent the response as a whole.

custom\_id: string

Developer-provided ID created for each request in a Message Batch. Useful for matching results to requests, as results may be given out of request order.

Must be unique for each request within the Message Batch.

result: [BetaMessageBatchResult](https://platform.claude.com/docs/en/api/beta#beta_message_batch_result)

Processing result for this request.

Contains a Message output if processing was successful, an error response if processing failed, or the reason why processing was not attempted, such as cancellation or expiration.

Accepts one of the following:

BetaMessageBatchSucceededResult {message, type}

message: [BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message) {id, container, content, 7 more}

id: string

Unique object identifier.

The format and length of IDs may change over time.

container: [BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container) {id, expires\_at, skills} \|null

Information about the container used in the request (for the code execution tool)

id: string

Identifier for the container used in this request

expires\_at: string

The time at which the container will expire.

formatdate-time

skills: Array<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill) {skill\_id, type, version} >\|null

Skills loaded in the container

skill\_id: string

Skill ID

maxLength64

minLength1

type: "anthropic"\|"custom"

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: string

Skill version or 'latest' for most recent version

maxLength64

minLength1

content: Array<[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)>

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

BetaTextBlock {citations, text, type}

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

BetaThinkingBlock {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

BetaRedactedThinkingBlock {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

BetaToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaServerToolUseBlock {id, caller, input, 2 more}

id: string

caller: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

input: Record<string, unknown>

name: "web\_search"\|"web\_fetch"\|"code\_execution"\|4 more

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

BetaWebSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

BetaWebSearchToolResultError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

Array<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

encrypted\_content: string

page\_age: string\|null

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

BetaWebFetchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebFetchToolResultErrorBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_block) {error\_code, type} \|[BetaWebFetchBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_block) {content, retrieved\_at, type, url}

Accepts one of the following:

BetaWebFetchToolResultErrorBlock {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchBlock {content, retrieved\_at, type, url}

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block) {citations, source, title, type}

citations: [BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config) {enabled} \|null

Citation configuration for the document

enabled: boolean

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type}

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

title: string\|null

The title of the document

type: "document"

Accepts one of the following:

"document"

retrieved\_at: string\|null

ISO 8601 timestamp when the content was retrieved

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

tool\_use\_id: string

type: "web\_fetch\_tool\_result"

Accepts one of the following:

"web\_fetch\_tool\_result"

BetaCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

BetaCodeExecutionToolResultError {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: string

type: "code\_execution\_tool\_result"

Accepts one of the following:

"code\_execution\_tool\_result"

BetaBashCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaBashCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_tool_result_error) {error\_code, type} \|[BetaBashCodeExecutionResultBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_result_block) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaBashCodeExecutionToolResultError {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: string

type: "bash\_code\_execution\_tool\_result"

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

BetaTextEditorCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaTextEditorCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_tool_result_error) {error\_code, error\_message, type} \|[BetaTextEditorCodeExecutionViewResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_view_result_block) {content, file\_type, num\_lines, 3 more} \|[BetaTextEditorCodeExecutionCreateResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_create_result_block) {is\_file\_update, type} \|[BetaTextEditorCodeExecutionStrReplaceResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_str_replace_result_block) {lines, new\_lines, new\_start, 3 more}

Accepts one of the following:

BetaTextEditorCodeExecutionToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: string\|null

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

BetaTextEditorCodeExecutionViewResultBlock {content, file\_type, num\_lines, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: number\|null

start\_line: number\|null

total\_lines: number\|null

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

BetaTextEditorCodeExecutionCreateResultBlock {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlock {lines, new\_lines, new\_start, 3 more}

lines: Array<string>\|null

new\_lines: number\|null

new\_start: number\|null

old\_lines: number\|null

old\_start: number\|null

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: string

type: "text\_editor\_code\_execution\_tool\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

BetaToolSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaToolSearchToolResultError](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_result_error) {error\_code, error\_message, type} \|[BetaToolSearchToolSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_search_result_block) {tool\_references, type}

Accepts one of the following:

BetaToolSearchToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: string\|null

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlock {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block) {tool\_name, type} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: string

type: "tool\_search\_tool\_result"

Accepts one of the following:

"tool\_search\_tool\_result"

BetaMCPToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

The name of the MCP tool

server\_name: string

The name of the MCP server

type: "mcp\_tool\_use"

Accepts one of the following:

"mcp\_tool\_use"

BetaMCPToolResultBlock {content, is\_error, tool\_use\_id, type}

content: string\|Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

Accepts one of the following:

string

Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

is\_error: boolean

tool\_use\_id: string

type: "mcp\_tool\_result"

Accepts one of the following:

"mcp\_tool\_result"

BetaContainerUploadBlock {file\_id, type}

Response model for a file uploaded to the container.

file\_id: string

type: "container\_upload"

Accepts one of the following:

"container\_upload"

context\_management: [BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response) {applied\_edits} \|null

Context management response.

Information about context management strategies applied during the request.

applied\_edits: Array<[BetaClearToolUses20250919EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_tool_uses_20250919_edit_response) {cleared\_input\_tokens, cleared\_tool\_uses, type} \|[BetaClearThinking20251015EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_thinking_20251015_edit_response) {cleared\_input\_tokens, cleared\_thinking\_turns, type} >

List of context management edits that were applied.

Accepts one of the following:

BetaClearToolUses20250919EditResponse {cleared\_input\_tokens, cleared\_tool\_uses, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: number

Number of tool uses that were cleared.

minimum0

type: "clear\_tool\_uses\_20250919"

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

BetaClearThinking20251015EditResponse {cleared\_input\_tokens, cleared\_thinking\_turns, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: number

Number of thinking turns that were cleared.

minimum0

type: "clear\_thinking\_20251015"

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

model: [Model](https://platform.claude.com/docs/en/api/messages#model)

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

"claude-opus-4-5-20251101"\|"claude-opus-4-5"\|"claude-3-7-sonnet-latest"\|17 more

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

(string & {})

role: "assistant"

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: [BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)\|null

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

stop\_sequence: string\|null

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage) {cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more}

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [BetaCacheCreation](https://platform.claude.com/docs/en/api/beta#beta_cache_creation) {ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens} \|null

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: number\|null

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number\|null

The number of input tokens read from the cache.

minimum0

input\_tokens: number

The number of input tokens which were used.

minimum0

output\_tokens: number

The number of output tokens which were used.

minimum0

server\_tool\_use: [BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage) {web\_fetch\_requests, web\_search\_requests} \|null

The number of server tool requests.

web\_fetch\_requests: number

The number of web fetch tool requests.

minimum0

web\_search\_requests: number

The number of web search tool requests.

minimum0

service\_tier: "standard"\|"priority"\|"batch"\|null

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

type: "succeeded"

Accepts one of the following:

"succeeded"

BetaMessageBatchErroredResult {error, type}

error: [BetaErrorResponse](https://platform.claude.com/docs/en/api/beta#beta_error_response) {error, request\_id, type}

error: [BetaError](https://platform.claude.com/docs/en/api/beta#beta_error)

Accepts one of the following:

BetaInvalidRequestError {message, type}

message: string

type: "invalid\_request\_error"

Accepts one of the following:

"invalid\_request\_error"

BetaAuthenticationError {message, type}

message: string

type: "authentication\_error"

Accepts one of the following:

"authentication\_error"

BetaBillingError {message, type}

message: string

type: "billing\_error"

Accepts one of the following:

"billing\_error"

BetaPermissionError {message, type}

message: string

type: "permission\_error"

Accepts one of the following:

"permission\_error"

BetaNotFoundError {message, type}

message: string

type: "not\_found\_error"

Accepts one of the following:

"not\_found\_error"

BetaRateLimitError {message, type}

message: string

type: "rate\_limit\_error"

Accepts one of the following:

"rate\_limit\_error"

BetaGatewayTimeoutError {message, type}

message: string

type: "timeout\_error"

Accepts one of the following:

"timeout\_error"

BetaAPIError {message, type}

message: string

type: "api\_error"

Accepts one of the following:

"api\_error"

BetaOverloadedError {message, type}

message: string

type: "overloaded\_error"

Accepts one of the following:

"overloaded\_error"

request\_id: string\|null

type: "error"

Accepts one of the following:

"error"

type: "errored"

Accepts one of the following:

"errored"

BetaMessageBatchCanceledResult {type}

type: "canceled"

Accepts one of the following:

"canceled"

BetaMessageBatchExpiredResult {type}

type: "expired"

Accepts one of the following:

"expired"

BetaMessageBatchRequestCounts {canceled, errored, expired, 2 more}

canceled: number

Number of requests in the Message Batch that have been canceled.

This is zero until processing of the entire Message Batch has ended.

errored: number

Number of requests in the Message Batch that encountered an error.

This is zero until processing of the entire Message Batch has ended.

expired: number

Number of requests in the Message Batch that have expired.

This is zero until processing of the entire Message Batch has ended.

processing: number

Number of requests in the Message Batch that are processing.

succeeded: number

Number of requests in the Message Batch that have completed successfully.

This is zero until processing of the entire Message Batch has ended.

BetaMessageBatchResult = [BetaMessageBatchSucceededResult](https://platform.claude.com/docs/en/api/beta#beta_message_batch_succeeded_result) {message, type} \|[BetaMessageBatchErroredResult](https://platform.claude.com/docs/en/api/beta#beta_message_batch_errored_result) {error, type} \|[BetaMessageBatchCanceledResult](https://platform.claude.com/docs/en/api/beta#beta_message_batch_canceled_result) {type} \|[BetaMessageBatchExpiredResult](https://platform.claude.com/docs/en/api/beta#beta_message_batch_expired_result) {type}

Processing result for this request.

Contains a Message output if processing was successful, an error response if processing failed, or the reason why processing was not attempted, such as cancellation or expiration.

Accepts one of the following:

BetaMessageBatchSucceededResult {message, type}

message: [BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message) {id, container, content, 7 more}

id: string

Unique object identifier.

The format and length of IDs may change over time.

container: [BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container) {id, expires\_at, skills} \|null

Information about the container used in the request (for the code execution tool)

id: string

Identifier for the container used in this request

expires\_at: string

The time at which the container will expire.

formatdate-time

skills: Array<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill) {skill\_id, type, version} >\|null

Skills loaded in the container

skill\_id: string

Skill ID

maxLength64

minLength1

type: "anthropic"\|"custom"

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: string

Skill version or 'latest' for most recent version

maxLength64

minLength1

content: Array<[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)>

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

BetaTextBlock {citations, text, type}

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

BetaThinkingBlock {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

BetaRedactedThinkingBlock {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

BetaToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaServerToolUseBlock {id, caller, input, 2 more}

id: string

caller: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

input: Record<string, unknown>

name: "web\_search"\|"web\_fetch"\|"code\_execution"\|4 more

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

BetaWebSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

BetaWebSearchToolResultError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

Array<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

encrypted\_content: string

page\_age: string\|null

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

BetaWebFetchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebFetchToolResultErrorBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_block) {error\_code, type} \|[BetaWebFetchBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_block) {content, retrieved\_at, type, url}

Accepts one of the following:

BetaWebFetchToolResultErrorBlock {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchBlock {content, retrieved\_at, type, url}

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block) {citations, source, title, type}

citations: [BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config) {enabled} \|null

Citation configuration for the document

enabled: boolean

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type}

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

title: string\|null

The title of the document

type: "document"

Accepts one of the following:

"document"

retrieved\_at: string\|null

ISO 8601 timestamp when the content was retrieved

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

tool\_use\_id: string

type: "web\_fetch\_tool\_result"

Accepts one of the following:

"web\_fetch\_tool\_result"

BetaCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

BetaCodeExecutionToolResultError {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: string

type: "code\_execution\_tool\_result"

Accepts one of the following:

"code\_execution\_tool\_result"

BetaBashCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaBashCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_tool_result_error) {error\_code, type} \|[BetaBashCodeExecutionResultBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_result_block) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaBashCodeExecutionToolResultError {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: string

type: "bash\_code\_execution\_tool\_result"

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

BetaTextEditorCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaTextEditorCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_tool_result_error) {error\_code, error\_message, type} \|[BetaTextEditorCodeExecutionViewResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_view_result_block) {content, file\_type, num\_lines, 3 more} \|[BetaTextEditorCodeExecutionCreateResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_create_result_block) {is\_file\_update, type} \|[BetaTextEditorCodeExecutionStrReplaceResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_str_replace_result_block) {lines, new\_lines, new\_start, 3 more}

Accepts one of the following:

BetaTextEditorCodeExecutionToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: string\|null

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

BetaTextEditorCodeExecutionViewResultBlock {content, file\_type, num\_lines, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: number\|null

start\_line: number\|null

total\_lines: number\|null

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

BetaTextEditorCodeExecutionCreateResultBlock {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlock {lines, new\_lines, new\_start, 3 more}

lines: Array<string>\|null

new\_lines: number\|null

new\_start: number\|null

old\_lines: number\|null

old\_start: number\|null

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: string

type: "text\_editor\_code\_execution\_tool\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

BetaToolSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaToolSearchToolResultError](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_result_error) {error\_code, error\_message, type} \|[BetaToolSearchToolSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_search_result_block) {tool\_references, type}

Accepts one of the following:

BetaToolSearchToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: string\|null

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlock {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block) {tool\_name, type} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: string

type: "tool\_search\_tool\_result"

Accepts one of the following:

"tool\_search\_tool\_result"

BetaMCPToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

The name of the MCP tool

server\_name: string

The name of the MCP server

type: "mcp\_tool\_use"

Accepts one of the following:

"mcp\_tool\_use"

BetaMCPToolResultBlock {content, is\_error, tool\_use\_id, type}

content: string\|Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

Accepts one of the following:

string

Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

is\_error: boolean

tool\_use\_id: string

type: "mcp\_tool\_result"

Accepts one of the following:

"mcp\_tool\_result"

BetaContainerUploadBlock {file\_id, type}

Response model for a file uploaded to the container.

file\_id: string

type: "container\_upload"

Accepts one of the following:

"container\_upload"

context\_management: [BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response) {applied\_edits} \|null

Context management response.

Information about context management strategies applied during the request.

applied\_edits: Array<[BetaClearToolUses20250919EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_tool_uses_20250919_edit_response) {cleared\_input\_tokens, cleared\_tool\_uses, type} \|[BetaClearThinking20251015EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_thinking_20251015_edit_response) {cleared\_input\_tokens, cleared\_thinking\_turns, type} >

List of context management edits that were applied.

Accepts one of the following:

BetaClearToolUses20250919EditResponse {cleared\_input\_tokens, cleared\_tool\_uses, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: number

Number of tool uses that were cleared.

minimum0

type: "clear\_tool\_uses\_20250919"

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

BetaClearThinking20251015EditResponse {cleared\_input\_tokens, cleared\_thinking\_turns, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: number

Number of thinking turns that were cleared.

minimum0

type: "clear\_thinking\_20251015"

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

model: [Model](https://platform.claude.com/docs/en/api/messages#model)

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

"claude-opus-4-5-20251101"\|"claude-opus-4-5"\|"claude-3-7-sonnet-latest"\|17 more

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

(string & {})

role: "assistant"

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: [BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)\|null

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

stop\_sequence: string\|null

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage) {cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more}

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [BetaCacheCreation](https://platform.claude.com/docs/en/api/beta#beta_cache_creation) {ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens} \|null

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: number\|null

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number\|null

The number of input tokens read from the cache.

minimum0

input\_tokens: number

The number of input tokens which were used.

minimum0

output\_tokens: number

The number of output tokens which were used.

minimum0

server\_tool\_use: [BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage) {web\_fetch\_requests, web\_search\_requests} \|null

The number of server tool requests.

web\_fetch\_requests: number

The number of web fetch tool requests.

minimum0

web\_search\_requests: number

The number of web search tool requests.

minimum0

service\_tier: "standard"\|"priority"\|"batch"\|null

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

type: "succeeded"

Accepts one of the following:

"succeeded"

BetaMessageBatchErroredResult {error, type}

error: [BetaErrorResponse](https://platform.claude.com/docs/en/api/beta#beta_error_response) {error, request\_id, type}

error: [BetaError](https://platform.claude.com/docs/en/api/beta#beta_error)

Accepts one of the following:

BetaInvalidRequestError {message, type}

message: string

type: "invalid\_request\_error"

Accepts one of the following:

"invalid\_request\_error"

BetaAuthenticationError {message, type}

message: string

type: "authentication\_error"

Accepts one of the following:

"authentication\_error"

BetaBillingError {message, type}

message: string

type: "billing\_error"

Accepts one of the following:

"billing\_error"

BetaPermissionError {message, type}

message: string

type: "permission\_error"

Accepts one of the following:

"permission\_error"

BetaNotFoundError {message, type}

message: string

type: "not\_found\_error"

Accepts one of the following:

"not\_found\_error"

BetaRateLimitError {message, type}

message: string

type: "rate\_limit\_error"

Accepts one of the following:

"rate\_limit\_error"

BetaGatewayTimeoutError {message, type}

message: string

type: "timeout\_error"

Accepts one of the following:

"timeout\_error"

BetaAPIError {message, type}

message: string

type: "api\_error"

Accepts one of the following:

"api\_error"

BetaOverloadedError {message, type}

message: string

type: "overloaded\_error"

Accepts one of the following:

"overloaded\_error"

request\_id: string\|null

type: "error"

Accepts one of the following:

"error"

type: "errored"

Accepts one of the following:

"errored"

BetaMessageBatchCanceledResult {type}

type: "canceled"

Accepts one of the following:

"canceled"

BetaMessageBatchExpiredResult {type}

type: "expired"

Accepts one of the following:

"expired"

BetaMessageBatchSucceededResult {message, type}

message: [BetaMessage](https://platform.claude.com/docs/en/api/beta#beta_message) {id, container, content, 7 more}

id: string

Unique object identifier.

The format and length of IDs may change over time.

container: [BetaContainer](https://platform.claude.com/docs/en/api/beta#beta_container) {id, expires\_at, skills} \|null

Information about the container used in the request (for the code execution tool)

id: string

Identifier for the container used in this request

expires\_at: string

The time at which the container will expire.

formatdate-time

skills: Array<[BetaSkill](https://platform.claude.com/docs/en/api/beta#beta_skill) {skill\_id, type, version} >\|null

Skills loaded in the container

skill\_id: string

Skill ID

maxLength64

minLength1

type: "anthropic"\|"custom"

Type of skill - either 'anthropic' (built-in) or 'custom' (user-defined)

Accepts one of the following:

"anthropic"

"custom"

version: string

Skill version or 'latest' for most recent version

maxLength64

minLength1

content: Array<[BetaContentBlock](https://platform.claude.com/docs/en/api/beta#beta_content_block)>

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

BetaTextBlock {citations, text, type}

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

BetaThinkingBlock {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

BetaRedactedThinkingBlock {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

BetaToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

caller?: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaServerToolUseBlock {id, caller, input, 2 more}

id: string

caller: [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) {type} \|[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) {tool\_id, type}

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

input: Record<string, unknown>

name: "web\_search"\|"web\_fetch"\|"code\_execution"\|4 more

Accepts one of the following:

"web\_search"

"web\_fetch"

"code\_execution"

"bash\_code\_execution"

"text\_editor\_code\_execution"

"tool\_search\_tool\_regex"

"tool\_search\_tool\_bm25"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

BetaWebSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_content)

Accepts one of the following:

BetaWebSearchToolResultError {error\_code, type}

error\_code: [BetaWebSearchToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

Array<[BetaWebSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

encrypted\_content: string

page\_age: string\|null

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

BetaWebFetchToolResultBlock {content, tool\_use\_id, type}

content: [BetaWebFetchToolResultErrorBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_block) {error\_code, type} \|[BetaWebFetchBlock](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_block) {content, retrieved\_at, type, url}

Accepts one of the following:

BetaWebFetchToolResultErrorBlock {error\_code, type}

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

type: "web\_fetch\_tool\_result\_error"

Accepts one of the following:

"web\_fetch\_tool\_result\_error"

BetaWebFetchBlock {content, retrieved\_at, type, url}

content: [BetaDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_document_block) {citations, source, title, type}

citations: [BetaCitationConfig](https://platform.claude.com/docs/en/api/beta#beta_citation_config) {enabled} \|null

Citation configuration for the document

enabled: boolean

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) {data, media\_type, type} \|[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) {data, media\_type, type}

Accepts one of the following:

BetaBase64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

title: string\|null

The title of the document

type: "document"

Accepts one of the following:

"document"

retrieved\_at: string\|null

ISO 8601 timestamp when the content was retrieved

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

tool\_use\_id: string

type: "web\_fetch\_tool\_result"

Accepts one of the following:

"web\_fetch\_tool\_result"

BetaCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaCodeExecutionToolResultBlockContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_content)

Accepts one of the following:

BetaCodeExecutionToolResultError {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "code\_execution\_output"

Accepts one of the following:

"code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "code\_execution\_result"

Accepts one of the following:

"code\_execution\_result"

tool\_use\_id: string

type: "code\_execution\_tool\_result"

Accepts one of the following:

"code\_execution\_tool\_result"

BetaBashCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaBashCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_tool_result_error) {error\_code, type} \|[BetaBashCodeExecutionResultBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_result_block) {content, return\_code, stderr, 2 more}

Accepts one of the following:

BetaBashCodeExecutionToolResultError {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionResultBlock {content, return\_code, stderr, 2 more}

content: Array<[BetaBashCodeExecutionOutputBlock](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block) {file\_id, type} >

file\_id: string

type: "bash\_code\_execution\_output"

Accepts one of the following:

"bash\_code\_execution\_output"

return\_code: number

stderr: string

stdout: string

type: "bash\_code\_execution\_result"

Accepts one of the following:

"bash\_code\_execution\_result"

tool\_use\_id: string

type: "bash\_code\_execution\_tool\_result"

Accepts one of the following:

"bash\_code\_execution\_tool\_result"

BetaTextEditorCodeExecutionToolResultBlock {content, tool\_use\_id, type}

content: [BetaTextEditorCodeExecutionToolResultError](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_tool_result_error) {error\_code, error\_message, type} \|[BetaTextEditorCodeExecutionViewResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_view_result_block) {content, file\_type, num\_lines, 3 more} \|[BetaTextEditorCodeExecutionCreateResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_create_result_block) {is\_file\_update, type} \|[BetaTextEditorCodeExecutionStrReplaceResultBlock](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_str_replace_result_block) {lines, new\_lines, new\_start, 3 more}

Accepts one of the following:

BetaTextEditorCodeExecutionToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

error\_message: string\|null

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

BetaTextEditorCodeExecutionViewResultBlock {content, file\_type, num\_lines, 3 more}

content: string

file\_type: "text"\|"image"\|"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

num\_lines: number\|null

start\_line: number\|null

total\_lines: number\|null

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

BetaTextEditorCodeExecutionCreateResultBlock {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlock {lines, new\_lines, new\_start, 3 more}

lines: Array<string>\|null

new\_lines: number\|null

new\_start: number\|null

old\_lines: number\|null

old\_start: number\|null

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

tool\_use\_id: string

type: "text\_editor\_code\_execution\_tool\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

BetaToolSearchToolResultBlock {content, tool\_use\_id, type}

content: [BetaToolSearchToolResultError](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_result_error) {error\_code, error\_message, type} \|[BetaToolSearchToolSearchResultBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_search_result_block) {tool\_references, type}

Accepts one of the following:

BetaToolSearchToolResultError {error\_code, error\_message, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"too\_many\_requests"\|"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

error\_message: string\|null

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlock {tool\_references, type}

tool\_references: Array<[BetaToolReferenceBlock](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block) {tool\_name, type} >

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

type: "tool\_search\_tool\_search\_result"

Accepts one of the following:

"tool\_search\_tool\_search\_result"

tool\_use\_id: string

type: "tool\_search\_tool\_result"

Accepts one of the following:

"tool\_search\_tool\_result"

BetaMCPToolUseBlock {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

The name of the MCP tool

server\_name: string

The name of the MCP server

type: "mcp\_tool\_use"

Accepts one of the following:

"mcp\_tool\_use"

BetaMCPToolResultBlock {content, is\_error, tool\_use\_id, type}

content: string\|Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

Accepts one of the following:

string

Array<[BetaTextBlock](https://platform.claude.com/docs/en/api/beta#beta_text_block) {citations, text, type} >

citations: Array<[BetaTextCitation](https://platform.claude.com/docs/en/api/beta#beta_text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

BetaCitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

is\_error: boolean

tool\_use\_id: string

type: "mcp\_tool\_result"

Accepts one of the following:

"mcp\_tool\_result"

BetaContainerUploadBlock {file\_id, type}

Response model for a file uploaded to the container.

file\_id: string

type: "container\_upload"

Accepts one of the following:

"container\_upload"

context\_management: [BetaContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_context_management_response) {applied\_edits} \|null

Context management response.

Information about context management strategies applied during the request.

applied\_edits: Array<[BetaClearToolUses20250919EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_tool_uses_20250919_edit_response) {cleared\_input\_tokens, cleared\_tool\_uses, type} \|[BetaClearThinking20251015EditResponse](https://platform.claude.com/docs/en/api/beta#beta_clear_thinking_20251015_edit_response) {cleared\_input\_tokens, cleared\_thinking\_turns, type} >

List of context management edits that were applied.

Accepts one of the following:

BetaClearToolUses20250919EditResponse {cleared\_input\_tokens, cleared\_tool\_uses, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_tool\_uses: number

Number of tool uses that were cleared.

minimum0

type: "clear\_tool\_uses\_20250919"

The type of context management edit applied.

Accepts one of the following:

"clear\_tool\_uses\_20250919"

BetaClearThinking20251015EditResponse {cleared\_input\_tokens, cleared\_thinking\_turns, type}

cleared\_input\_tokens: number

Number of input tokens cleared by this edit.

minimum0

cleared\_thinking\_turns: number

Number of thinking turns that were cleared.

minimum0

type: "clear\_thinking\_20251015"

The type of context management edit applied.

Accepts one of the following:

"clear\_thinking\_20251015"

model: [Model](https://platform.claude.com/docs/en/api/messages#model)

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

"claude-opus-4-5-20251101"\|"claude-opus-4-5"\|"claude-3-7-sonnet-latest"\|17 more

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

(string & {})

role: "assistant"

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: [BetaStopReason](https://platform.claude.com/docs/en/api/beta#beta_stop_reason)\|null

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

stop\_sequence: string\|null

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [BetaUsage](https://platform.claude.com/docs/en/api/beta#beta_usage) {cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more}

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [BetaCacheCreation](https://platform.claude.com/docs/en/api/beta#beta_cache_creation) {ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens} \|null

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: number\|null

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number\|null

The number of input tokens read from the cache.

minimum0

input\_tokens: number

The number of input tokens which were used.

minimum0

output\_tokens: number

The number of output tokens which were used.

minimum0

server\_tool\_use: [BetaServerToolUsage](https://platform.claude.com/docs/en/api/beta#beta_server_tool_usage) {web\_fetch\_requests, web\_search\_requests} \|null

The number of server tool requests.

web\_fetch\_requests: number

The number of web fetch tool requests.

minimum0

web\_search\_requests: number

The number of web search tool requests.

minimum0

service\_tier: "standard"\|"priority"\|"batch"\|null

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

type: "succeeded"

Accepts one of the following:

"succeeded"

#### BetaFiles

##### [Upload File](https://platform.claude.com/docs/en/api/beta/files/upload)

client.beta.files.upload(FileUploadParams {file, betas} params, RequestOptionsoptions?): [FileMetadata](https://platform.claude.com/docs/en/api/beta#file_metadata) {id, created\_at, filename, 4 more}

post/v1/files

##### [List Files](https://platform.claude.com/docs/en/api/beta/files/list)

client.beta.files.list(FileListParams {after\_id, before\_id, limit, betas} params?, RequestOptionsoptions?): Page<[FileMetadata](https://platform.claude.com/docs/en/api/beta#file_metadata) {id, created\_at, filename, 4 more} >

get/v1/files

##### [Download File](https://platform.claude.com/docs/en/api/beta/files/download)

client.beta.files.download(stringfileID, FileDownloadParams {betas} params?, RequestOptionsoptions?): Response

get/v1/files/{file\_id}/content

##### [Get File Metadata](https://platform.claude.com/docs/en/api/beta/files/retrieve_metadata)

client.beta.files.retrieveMetadata(stringfileID, FileRetrieveMetadataParams {betas} params?, RequestOptionsoptions?): [FileMetadata](https://platform.claude.com/docs/en/api/beta#file_metadata) {id, created\_at, filename, 4 more}

get/v1/files/{file\_id}

##### [Delete File](https://platform.claude.com/docs/en/api/beta/files/delete)

client.beta.files.delete(stringfileID, FileDeleteParams {betas} params?, RequestOptionsoptions?): [DeletedFile](https://platform.claude.com/docs/en/api/beta#deleted_file) {id, type}

delete/v1/files/{file\_id}

##### ModelsExpand Collapse

DeletedFile {id, type}

id: string

ID of the deleted file.

type?: "file\_deleted"

Deleted object type.

For file deletion, this is always `"file_deleted"`.

Accepts one of the following:

"file\_deleted"

FileMetadata {id, created\_at, filename, 4 more}

id: string

Unique object identifier.

The format and length of IDs may change over time.

created\_at: string

RFC 3339 datetime string representing when the file was created.

formatdate-time

filename: string

Original filename of the uploaded file.

maxLength500

minLength1

mime\_type: string

MIME type of the file.

maxLength255

minLength1

size\_bytes: number

Size of the file in bytes.

minimum0

type: "file"

Object type.

For files, this is always `"file"`.

Accepts one of the following:

"file"

downloadable?: boolean

Whether the file can be downloaded.

#### BetaSkills

##### [Create Skill](https://platform.claude.com/docs/en/api/beta/skills/create)

client.beta.skills.create(SkillCreateParams {display\_title, files, betas} params?, RequestOptionsoptions?): [SkillCreateResponse](https://platform.claude.com/docs/en/api/beta#skill_create_response) {id, created\_at, display\_title, 4 more}

post/v1/skills

##### [List Skills](https://platform.claude.com/docs/en/api/beta/skills/list)

client.beta.skills.list(SkillListParams {limit, page, source, betas} params?, RequestOptionsoptions?): PageCursor<[SkillListResponse](https://platform.claude.com/docs/en/api/beta#skill_list_response) {id, created\_at, display\_title, 4 more} >

get/v1/skills

##### [Get Skill](https://platform.claude.com/docs/en/api/beta/skills/retrieve)

client.beta.skills.retrieve(stringskillID, SkillRetrieveParams {betas} params?, RequestOptionsoptions?): [SkillRetrieveResponse](https://platform.claude.com/docs/en/api/beta#skill_retrieve_response) {id, created\_at, display\_title, 4 more}

get/v1/skills/{skill\_id}

##### [Delete Skill](https://platform.claude.com/docs/en/api/beta/skills/delete)

client.beta.skills.delete(stringskillID, SkillDeleteParams {betas} params?, RequestOptionsoptions?): [SkillDeleteResponse](https://platform.claude.com/docs/en/api/beta#skill_delete_response) {id, type}

delete/v1/skills/{skill\_id}

#### BetaSkillsVersions

##### [Create Skill Version](https://platform.claude.com/docs/en/api/beta/skills/versions/create)

client.beta.skills.versions.create(stringskillID, VersionCreateParams {files, betas} params?, RequestOptionsoptions?): [VersionCreateResponse](https://platform.claude.com/docs/en/api/beta#version_create_response) {id, created\_at, description, 5 more}

post/v1/skills/{skill\_id}/versions

##### [List Skill Versions](https://platform.claude.com/docs/en/api/beta/skills/versions/list)

client.beta.skills.versions.list(stringskillID, VersionListParams {limit, page, betas} params?, RequestOptionsoptions?): PageCursor<[VersionListResponse](https://platform.claude.com/docs/en/api/beta#version_list_response) {id, created\_at, description, 5 more} >

get/v1/skills/{skill\_id}/versions

##### [Get Skill Version](https://platform.claude.com/docs/en/api/beta/skills/versions/retrieve)

client.beta.skills.versions.retrieve(stringversion, VersionRetrieveParams {skill\_id, betas} params, RequestOptionsoptions?): [VersionRetrieveResponse](https://platform.claude.com/docs/en/api/beta#version_retrieve_response) {id, created\_at, description, 5 more}

get/v1/skills/{skill\_id}/versions/{version}

##### [Delete Skill Version](https://platform.claude.com/docs/en/api/beta/skills/versions/delete)

client.beta.skills.versions.delete(stringversion, VersionDeleteParams {skill\_id, betas} params, RequestOptionsoptions?): [VersionDeleteResponse](https://platform.claude.com/docs/en/api/beta#version_delete_response) {id, type}

delete/v1/skills/{skill\_id}/versions/{version}

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