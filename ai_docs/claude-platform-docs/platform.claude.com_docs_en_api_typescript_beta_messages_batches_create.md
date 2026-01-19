---
url: "https://platform.claude.com/docs/en/api/typescript/beta/messages/batches/create"
title: "Create a Message Batch - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Ftypescript%2Fbeta%2Fmessages%2Fbatches%2Fcreate)

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

[Create a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/create) [Retrieve a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/retrieve) [List Message Batches](https://platform.claude.com/docs/en/api/beta/messages/batches/list) [Cancel a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/cancel) [Delete a Message Batch](https://platform.claude.com/docs/en/api/beta/messages/batches/delete) [Retrieve Message Batch results](https://platform.claude.com/docs/en/api/beta/messages/batches/results)

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

Batches

Create

Copy page

TypeScript

# Create a Message Batch

client.beta.messages.batches.create(BatchCreateParams {requests, betas} params, RequestOptionsoptions?): [BetaMessageBatch](https://platform.claude.com/docs/en/api/beta#beta_message_batch) {id, archived\_at, cancel\_initiated\_at, 7 more}

post/v1/messages/batches

Send a batch of Message creation requests.

The Message Batches API can be used to process multiple Messages API requests at once. Once a Message Batch is created, it begins processing immediately. Batches can take up to 24 hours to complete.

Learn more about the Message Batches API in our [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)

##### ParametersExpand Collapse

params: BatchCreateParams {requests, betas}

requests: Array<Request>

Body param: List of requests for prompt completion. Each is an individual request to create a Message.

custom\_id: string

Developer-provided ID created for each request in a Message Batch. Useful for matching results to requests, as results may be given out of request order.

Must be unique for each request within the Message Batch.

maxLength64

minLength1

params: Params {max\_tokens, messages, model, 16 more}

Messages API creation parameters for the individual request.

See the [Messages API reference](https://docs.claude.com/en/api/messages) for full documentation on available parameters.

max\_tokens: number

The maximum number of tokens to generate before stopping.

Note that our models may stop _before_ reaching this maximum. This parameter only specifies the absolute maximum number of tokens to generate.

Different models have different maximum values for this parameter. See [models](https://docs.claude.com/en/docs/models-overview) for details.

minimum1

messages: Array<[BetaMessageParam](https://platform.claude.com/docs/en/api/beta#beta_message_param) {content, role} >

Input messages.

Our models are trained to operate on alternating `user` and `assistant` conversational turns. When creating a new `Message`, you specify the prior conversational turns with the `messages` parameter, and the model then generates the next `Message` in the conversation. Consecutive `user` or `assistant` turns in your request will be combined into a single turn.

Each input message must be an object with a `role` and `content`. You can specify a single `user`-role message, or you can include multiple `user` and `assistant` messages.

If the final message uses the `assistant` role, the response content will continue immediately from the content in that message. This can be used to constrain part of the model's response.

Example with a single `user` message:

```
[{"role": "user", "content": "Hello, Claude"}]
```

Example with multiple conversational turns:

```
[\
  {"role": "user", "content": "Hello there."},\
  {"role": "assistant", "content": "Hi, I'm Claude. How can I help you?"},\
  {"role": "user", "content": "Can you explain LLMs in plain English?"},\
]
```

Example with a partially-filled response from Claude:

```
[\
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},\
  {"role": "assistant", "content": "The best answer is ("},\
]
```

Each input message `content` may be either a single `string` or an array of content blocks, where each block has a specific `type`. Using a `string` for `content` is shorthand for an array of one content block of type `"text"`. The following input messages are equivalent:

```
{"role": "user", "content": "Hello, Claude"}
```

```
{"role": "user", "content": [{"type": "text", "text": "Hello, Claude"}]}
```

See [input examples](https://docs.claude.com/en/api/messages-examples).

Note that if you want to include a [system prompt](https://docs.claude.com/en/docs/system-prompts), you can use the top-level `system` parameter — there is no `"system"` role for input messages in the Messages API.

There is a limit of 100,000 messages in a single request.

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

container?: [BetaContainerParams](https://platform.claude.com/docs/en/api/beta#beta_container_params) {id, skills} \|string\|null

Container identifier for reuse across requests.

Accepts one of the following:

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

string

context\_management?: [BetaContextManagementConfig](https://platform.claude.com/docs/en/api/beta#beta_context_management_config) {edits} \|null

Context management configuration.

This allows you to control how Claude manages context across multiple requests, such as whether to clear function results or not.

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

mcp\_servers?: Array<[BetaRequestMCPServerURLDefinition](https://platform.claude.com/docs/en/api/beta#beta_request_mcp_server_url_definition) {name, type, url, 2 more} >

MCP servers to be utilized in this request

name: string

type: "url"

Accepts one of the following:

"url"

url: string

authorization\_token?: string\|null

tool\_configuration?: [BetaRequestMCPServerToolConfiguration](https://platform.claude.com/docs/en/api/beta#beta_request_mcp_server_tool_configuration) {allowed\_tools, enabled} \|null

allowed\_tools?: Array<string>\|null

enabled?: boolean\|null

metadata?: [BetaMetadata](https://platform.claude.com/docs/en/api/beta#beta_metadata) {user\_id}

An object describing metadata about the request.

user\_id?: string\|null

An external identifier for the user who is associated with the request.

This should be a uuid, hash value, or other opaque identifier. Anthropic may use this id to help detect abuse. Do not include any identifying information such as name, email address, or phone number.

maxLength256

output\_config?: [BetaOutputConfig](https://platform.claude.com/docs/en/api/beta#beta_output_config) {effort}

Configuration options for the model's output. Controls aspects like how much effort the model puts into its response.

effort?: "low"\|"medium"\|"high"\|null

All possible effort levels.

Accepts one of the following:

"low"

"medium"

"high"

output\_format?: [BetaJSONOutputFormat](https://platform.claude.com/docs/en/api/beta#beta_json_output_format) {schema, type} \|null

A schema to specify Claude's output format in responses.

schema: Record<string, unknown>

The JSON schema of the format

type: "json\_schema"

Accepts one of the following:

"json\_schema"

service\_tier?: "auto"\|"standard\_only"

Determines whether to use priority capacity (if available) or standard capacity for this request.

Anthropic offers different levels of service for your API requests. See [service-tiers](https://docs.claude.com/en/api/service-tiers) for details.

Accepts one of the following:

"auto"

"standard\_only"

stop\_sequences?: Array<string>

Custom text sequences that will cause the model to stop generating.

Our models will normally stop when they have naturally completed their turn, which will result in a response `stop_reason` of `"end_turn"`.

If you want the model to stop generating when it encounters custom strings of text, you can use the `stop_sequences` parameter. If the model encounters one of the custom sequences, the response `stop_reason` value will be `"stop_sequence"` and the response `stop_sequence` value will contain the matched stop sequence.

stream?: boolean

Whether to incrementally stream the response using server-sent events.

See [streaming](https://docs.claude.com/en/api/messages-streaming) for details.

system?: string\|Array<[BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) {text, type, cache\_control, citations} >

System prompt.

A system prompt is a way of providing context and instructions to Claude, such as specifying a particular goal or role. See our [guide to system prompts](https://docs.claude.com/en/docs/system-prompts).

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

temperature?: number

Amount of randomness injected into the response.

Defaults to `1.0`. Ranges from `0.0` to `1.0`. Use `temperature` closer to `0.0` for analytical / multiple choice, and closer to `1.0` for creative and generative tasks.

Note that even with `temperature` of `0.0`, the results will not be fully deterministic.

maximum1

minimum0

thinking?: [BetaThinkingConfigParam](https://platform.claude.com/docs/en/api/beta#beta_thinking_config_param)

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

tool\_choice?: [BetaToolChoice](https://platform.claude.com/docs/en/api/beta#beta_tool_choice)

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

tools?: Array<[BetaToolUnion](https://platform.claude.com/docs/en/api/beta#beta_tool_union)>

Definitions of tools that the model may use.

If you include `tools` in your API request, the model may return `tool_use` content blocks that represent the model's use of those tools. You can then run those tools using the tool input generated by the model and then optionally return results back to the model using `tool_result` content blocks.

There are two types of tools: **client tools** and **server tools**. The behavior described below applies to client tools. For [server tools](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview#server-tools), see their individual documentation as each has its own behavior (e.g., the [web search tool](https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool)).

Each tool definition includes:

- `name`: Name of the tool.
- `description`: Optional, but strongly-recommended description of the tool.
- `input_schema`: [JSON schema](https://json-schema.org/draft/2020-12) for the tool `input` shape that the model will produce in `tool_use` output content blocks.

For example, if you defined `tools` as:

```
[\
  {\
    "name": "get_stock_price",\
    "description": "Get the current stock price for a given ticker symbol.",\
    "input_schema": {\
      "type": "object",\
      "properties": {\
        "ticker": {\
          "type": "string",\
          "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."\
        }\
      },\
      "required": ["ticker"]\
    }\
  }\
]
```

And then asked the model "What's the S&P 500 at today?", the model might produce `tool_use` content blocks in the response like this:

```
[\
  {\
    "type": "tool_use",\
    "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",\
    "name": "get_stock_price",\
    "input": { "ticker": "^GSPC" }\
  }\
]
```

You might then run your `get_stock_price` tool with `{"ticker": "^GSPC"}` as an input, and return the following back to the model in a subsequent `user` message:

```
[\
  {\
    "type": "tool_result",\
    "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",\
    "content": "259.75 USD"\
  }\
]
```

Tools can be used for workflows that include running client-side tools and functions, or more generally whenever you want the model to produce a particular JSON structure of output.

See our [guide](https://docs.claude.com/en/docs/tool-use) for more details.

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

top\_k?: number

Only sample from the top K options for each subsequent token.

Used to remove "long tail" low probability responses. [Learn more technical details here](https://towardsdatascience.com/how-to-sample-from-language-models-682bceb97277).

Recommended for advanced use cases only. You usually only need to use `temperature`.

minimum0

top\_p?: number

Use nucleus sampling.

In nucleus sampling, we compute the cumulative distribution over all the options for each subsequent token in decreasing probability order and cut it off once it reaches a particular probability specified by `top_p`. You should either alter `temperature` or `top_p`, but not both.

Recommended for advanced use cases only. You usually only need to use `temperature`.

maximum1

minimum0

betas?: Array<[AnthropicBeta](https://platform.claude.com/docs/en/api/beta#anthropic_beta)>

Header param: Optional header to specify the beta version(s) you want to use.

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

##### ReturnsExpand Collapse

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

Create a Message Batch

TypeScript

```
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

const betaMessageBatch = await client.beta.messages.batches.create({
  requests: [\
    {\
      custom_id: 'my-custom-id-1',\
      params: {\
        max_tokens: 1024,\
        messages: [{ content: 'Hello, world', role: 'user' }],\
        model: 'claude-sonnet-4-5-20250929',\
      },\
    },\
  ],
});

console.log(betaMessageBatch.id);
```

Response 200

```
{
  "id": "msgbatch_013Zva2CMHLNnXjNJJKqJ2EF",
  "archived_at": "2024-08-20T18:37:24.100435Z",
  "cancel_initiated_at": "2024-08-20T18:37:24.100435Z",
  "created_at": "2024-08-20T18:37:24.100435Z",
  "ended_at": "2024-08-20T18:37:24.100435Z",
  "expires_at": "2024-08-20T18:37:24.100435Z",
  "processing_status": "in_progress",
  "request_counts": {
    "canceled": 10,
    "errored": 30,
    "expired": 10,
    "processing": 100,
    "succeeded": 50
  },
  "results_url": "https://api.anthropic.com/v1/messages/batches/msgbatch_013Zva2CMHLNnXjNJJKqJ2EF/results",
  "type": "message_batch"
}
```

##### Returns Examples

Response 200

```
{
  "id": "msgbatch_013Zva2CMHLNnXjNJJKqJ2EF",
  "archived_at": "2024-08-20T18:37:24.100435Z",
  "cancel_initiated_at": "2024-08-20T18:37:24.100435Z",
  "created_at": "2024-08-20T18:37:24.100435Z",
  "ended_at": "2024-08-20T18:37:24.100435Z",
  "expires_at": "2024-08-20T18:37:24.100435Z",
  "processing_status": "in_progress",
  "request_counts": {
    "canceled": 10,
    "errored": 30,
    "expired": 10,
    "processing": 100,
    "succeeded": 50
  },
  "results_url": "https://api.anthropic.com/v1/messages/batches/msgbatch_013Zva2CMHLNnXjNJJKqJ2EF/results",
  "type": "message_batch"
}
```

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