---
url: "https://platform.claude.com/docs/en/api/typescript/messages/batches"
title: "Batches - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Ftypescript%2Fmessages%2Fbatches)

Search...

⌘K

Using the API

[Features overview](https://platform.claude.com/docs/en/api/overview) [Client SDKs](https://platform.claude.com/docs/en/api/client-sdks) [Beta headers](https://platform.claude.com/docs/en/api/beta-headers) [Errors](https://platform.claude.com/docs/en/api/errors)

[Messages](https://platform.claude.com/docs/en/api/messages)

[Create a Message](https://platform.claude.com/docs/en/api/messages/create) [Count tokens in a Message](https://platform.claude.com/docs/en/api/messages/count_tokens)

Batches

[Create a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/create) [Retrieve a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/retrieve) [List Message Batches](https://platform.claude.com/docs/en/api/messages/batches/list) [Cancel a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/cancel) [Delete a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/delete) [Retrieve Message Batch results](https://platform.claude.com/docs/en/api/messages/batches/results)

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

Messages

Batches

Copy page

TypeScript

# Batches

##### [Create a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/create)

client.messages.batches.create(BatchCreateParams {requests} body, RequestOptionsoptions?): [MessageBatch](https://platform.claude.com/docs/en/api/messages#message_batch) {id, archived\_at, cancel\_initiated\_at, 7 more}

post/v1/messages/batches

##### [Retrieve a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/retrieve)

client.messages.batches.retrieve(stringmessageBatchID, RequestOptionsoptions?): [MessageBatch](https://platform.claude.com/docs/en/api/messages#message_batch) {id, archived\_at, cancel\_initiated\_at, 7 more}

get/v1/messages/batches/{message\_batch\_id}

##### [List Message Batches](https://platform.claude.com/docs/en/api/messages/batches/list)

client.messages.batches.list(BatchListParams {after\_id, before\_id, limit} query?, RequestOptionsoptions?): Page<[MessageBatch](https://platform.claude.com/docs/en/api/messages#message_batch) {id, archived\_at, cancel\_initiated\_at, 7 more} >

get/v1/messages/batches

##### [Cancel a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/cancel)

client.messages.batches.cancel(stringmessageBatchID, RequestOptionsoptions?): [MessageBatch](https://platform.claude.com/docs/en/api/messages#message_batch) {id, archived\_at, cancel\_initiated\_at, 7 more}

post/v1/messages/batches/{message\_batch\_id}/cancel

##### [Delete a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/delete)

client.messages.batches.delete(stringmessageBatchID, RequestOptionsoptions?): [DeletedMessageBatch](https://platform.claude.com/docs/en/api/messages#deleted_message_batch) {id, type}

delete/v1/messages/batches/{message\_batch\_id}

##### [Retrieve Message Batch results](https://platform.claude.com/docs/en/api/messages/batches/results)

client.messages.batches.results(stringmessageBatchID, RequestOptionsoptions?): [MessageBatchIndividualResponse](https://platform.claude.com/docs/en/api/messages#message_batch_individual_response) {custom\_id, result} \|Stream<[MessageBatchIndividualResponse](https://platform.claude.com/docs/en/api/messages#message_batch_individual_response) {custom\_id, result} >

get/v1/messages/batches/{message\_batch\_id}/results

##### ModelsExpand Collapse

DeletedMessageBatch {id, type}

id: string

ID of the Message Batch.

type: "message\_batch\_deleted"

Deleted object type.

For Message Batches, this is always `"message_batch_deleted"`.

Accepts one of the following:

"message\_batch\_deleted"

MessageBatch {id, archived\_at, cancel\_initiated\_at, 7 more}

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

request\_counts: [MessageBatchRequestCounts](https://platform.claude.com/docs/en/api/messages#message_batch_request_counts) {canceled, errored, expired, 2 more}

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

MessageBatchCanceledResult {type}

type: "canceled"

Accepts one of the following:

"canceled"

MessageBatchErroredResult {error, type}

error: [ErrorResponse](https://platform.claude.com/docs/en/api/$shared#error_response) {error, request\_id, type}

error: [ErrorObject](https://platform.claude.com/docs/en/api/$shared#error_object)

Accepts one of the following:

InvalidRequestError {message, type}

message: string

type: "invalid\_request\_error"

Accepts one of the following:

"invalid\_request\_error"

AuthenticationError {message, type}

message: string

type: "authentication\_error"

Accepts one of the following:

"authentication\_error"

BillingError {message, type}

message: string

type: "billing\_error"

Accepts one of the following:

"billing\_error"

PermissionError {message, type}

message: string

type: "permission\_error"

Accepts one of the following:

"permission\_error"

NotFoundError {message, type}

message: string

type: "not\_found\_error"

Accepts one of the following:

"not\_found\_error"

RateLimitError {message, type}

message: string

type: "rate\_limit\_error"

Accepts one of the following:

"rate\_limit\_error"

GatewayTimeoutError {message, type}

message: string

type: "timeout\_error"

Accepts one of the following:

"timeout\_error"

APIErrorObject {message, type}

message: string

type: "api\_error"

Accepts one of the following:

"api\_error"

OverloadedError {message, type}

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

MessageBatchExpiredResult {type}

type: "expired"

Accepts one of the following:

"expired"

MessageBatchIndividualResponse {custom\_id, result}

This is a single line in the response `.jsonl` file and does not represent the response as a whole.

custom\_id: string

Developer-provided ID created for each request in a Message Batch. Useful for matching results to requests, as results may be given out of request order.

Must be unique for each request within the Message Batch.

result: [MessageBatchResult](https://platform.claude.com/docs/en/api/messages#message_batch_result)

Processing result for this request.

Contains a Message output if processing was successful, an error response if processing failed, or the reason why processing was not attempted, such as cancellation or expiration.

Accepts one of the following:

MessageBatchSucceededResult {message, type}

message: [Message](https://platform.claude.com/docs/en/api/messages#message) {id, content, model, 5 more}

id: string

Unique object identifier.

The format and length of IDs may change over time.

content: Array<[ContentBlock](https://platform.claude.com/docs/en/api/messages#content_block)>

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

TextBlock {citations, text, type}

citations: Array<[TextCitation](https://platform.claude.com/docs/en/api/messages#text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

CitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

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

ThinkingBlock {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlock {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlock {id, input, name, type}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

ServerToolUseBlock {id, input, name, type}

id: string

input: Record<string, unknown>

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

WebSearchToolResultBlock {content, tool\_use\_id, type}

content: [WebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_content)

Accepts one of the following:

WebSearchToolResultError {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"max\_uses\_exceeded"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

Array<[WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

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

stop\_reason: [StopReason](https://platform.claude.com/docs/en/api/messages#stop_reason)\|null

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

stop\_sequence: string\|null

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [Usage](https://platform.claude.com/docs/en/api/messages#usage) {cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more}

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [CacheCreation](https://platform.claude.com/docs/en/api/messages#cache_creation) {ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens} \|null

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

server\_tool\_use: [ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage) {web\_search\_requests} \|null

The number of server tool requests.

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

MessageBatchErroredResult {error, type}

error: [ErrorResponse](https://platform.claude.com/docs/en/api/$shared#error_response) {error, request\_id, type}

error: [ErrorObject](https://platform.claude.com/docs/en/api/$shared#error_object)

Accepts one of the following:

InvalidRequestError {message, type}

message: string

type: "invalid\_request\_error"

Accepts one of the following:

"invalid\_request\_error"

AuthenticationError {message, type}

message: string

type: "authentication\_error"

Accepts one of the following:

"authentication\_error"

BillingError {message, type}

message: string

type: "billing\_error"

Accepts one of the following:

"billing\_error"

PermissionError {message, type}

message: string

type: "permission\_error"

Accepts one of the following:

"permission\_error"

NotFoundError {message, type}

message: string

type: "not\_found\_error"

Accepts one of the following:

"not\_found\_error"

RateLimitError {message, type}

message: string

type: "rate\_limit\_error"

Accepts one of the following:

"rate\_limit\_error"

GatewayTimeoutError {message, type}

message: string

type: "timeout\_error"

Accepts one of the following:

"timeout\_error"

APIErrorObject {message, type}

message: string

type: "api\_error"

Accepts one of the following:

"api\_error"

OverloadedError {message, type}

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

MessageBatchCanceledResult {type}

type: "canceled"

Accepts one of the following:

"canceled"

MessageBatchExpiredResult {type}

type: "expired"

Accepts one of the following:

"expired"

MessageBatchRequestCounts {canceled, errored, expired, 2 more}

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

MessageBatchResult = [MessageBatchSucceededResult](https://platform.claude.com/docs/en/api/messages#message_batch_succeeded_result) {message, type} \|[MessageBatchErroredResult](https://platform.claude.com/docs/en/api/messages#message_batch_errored_result) {error, type} \|[MessageBatchCanceledResult](https://platform.claude.com/docs/en/api/messages#message_batch_canceled_result) {type} \|[MessageBatchExpiredResult](https://platform.claude.com/docs/en/api/messages#message_batch_expired_result) {type}

Processing result for this request.

Contains a Message output if processing was successful, an error response if processing failed, or the reason why processing was not attempted, such as cancellation or expiration.

Accepts one of the following:

MessageBatchSucceededResult {message, type}

message: [Message](https://platform.claude.com/docs/en/api/messages#message) {id, content, model, 5 more}

id: string

Unique object identifier.

The format and length of IDs may change over time.

content: Array<[ContentBlock](https://platform.claude.com/docs/en/api/messages#content_block)>

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

TextBlock {citations, text, type}

citations: Array<[TextCitation](https://platform.claude.com/docs/en/api/messages#text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

CitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

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

ThinkingBlock {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlock {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlock {id, input, name, type}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

ServerToolUseBlock {id, input, name, type}

id: string

input: Record<string, unknown>

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

WebSearchToolResultBlock {content, tool\_use\_id, type}

content: [WebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_content)

Accepts one of the following:

WebSearchToolResultError {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"max\_uses\_exceeded"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

Array<[WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

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

stop\_reason: [StopReason](https://platform.claude.com/docs/en/api/messages#stop_reason)\|null

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

stop\_sequence: string\|null

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [Usage](https://platform.claude.com/docs/en/api/messages#usage) {cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more}

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [CacheCreation](https://platform.claude.com/docs/en/api/messages#cache_creation) {ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens} \|null

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

server\_tool\_use: [ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage) {web\_search\_requests} \|null

The number of server tool requests.

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

MessageBatchErroredResult {error, type}

error: [ErrorResponse](https://platform.claude.com/docs/en/api/$shared#error_response) {error, request\_id, type}

error: [ErrorObject](https://platform.claude.com/docs/en/api/$shared#error_object)

Accepts one of the following:

InvalidRequestError {message, type}

message: string

type: "invalid\_request\_error"

Accepts one of the following:

"invalid\_request\_error"

AuthenticationError {message, type}

message: string

type: "authentication\_error"

Accepts one of the following:

"authentication\_error"

BillingError {message, type}

message: string

type: "billing\_error"

Accepts one of the following:

"billing\_error"

PermissionError {message, type}

message: string

type: "permission\_error"

Accepts one of the following:

"permission\_error"

NotFoundError {message, type}

message: string

type: "not\_found\_error"

Accepts one of the following:

"not\_found\_error"

RateLimitError {message, type}

message: string

type: "rate\_limit\_error"

Accepts one of the following:

"rate\_limit\_error"

GatewayTimeoutError {message, type}

message: string

type: "timeout\_error"

Accepts one of the following:

"timeout\_error"

APIErrorObject {message, type}

message: string

type: "api\_error"

Accepts one of the following:

"api\_error"

OverloadedError {message, type}

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

MessageBatchCanceledResult {type}

type: "canceled"

Accepts one of the following:

"canceled"

MessageBatchExpiredResult {type}

type: "expired"

Accepts one of the following:

"expired"

MessageBatchSucceededResult {message, type}

message: [Message](https://platform.claude.com/docs/en/api/messages#message) {id, content, model, 5 more}

id: string

Unique object identifier.

The format and length of IDs may change over time.

content: Array<[ContentBlock](https://platform.claude.com/docs/en/api/messages#content_block)>

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

TextBlock {citations, text, type}

citations: Array<[TextCitation](https://platform.claude.com/docs/en/api/messages#text_citation)>\|null

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

CitationCharLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

file\_id: string\|null

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

file\_id: string\|null

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

file\_id: string\|null

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation {cited\_text, end\_block\_index, search\_result\_index, 4 more}

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

ThinkingBlock {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlock {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlock {id, input, name, type}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

ServerToolUseBlock {id, input, name, type}

id: string

input: Record<string, unknown>

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

WebSearchToolResultBlock {content, tool\_use\_id, type}

content: [WebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_content)

Accepts one of the following:

WebSearchToolResultError {error\_code, type}

error\_code: "invalid\_tool\_input"\|"unavailable"\|"max\_uses\_exceeded"\|2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

Array<[WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) {encrypted\_content, page\_age, title, 2 more} >

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

stop\_reason: [StopReason](https://platform.claude.com/docs/en/api/messages#stop_reason)\|null

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

stop\_sequence: string\|null

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [Usage](https://platform.claude.com/docs/en/api/messages#usage) {cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more}

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [CacheCreation](https://platform.claude.com/docs/en/api/messages#cache_creation) {ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens} \|null

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

server\_tool\_use: [ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage) {web\_search\_requests} \|null

The number of server tool requests.

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