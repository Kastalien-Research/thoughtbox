---
url: "https://platform.claude.com/docs/en/api/beta/messages/count_tokens"
title: "Count tokens in a Message - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Fbeta%2Fmessages%2Fcount_tokens)

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

Messages

Count tokens

Copy page

cURL

# Count tokens in a Message

post/v1/messages/count\_tokens

Count the number of tokens in a Message.

The Token Count API can be used to count the number of tokens in a Message, including tools, images, and documents, without creating it.

Learn more about token counting in our [user guide](https://docs.claude.com/en/docs/build-with-claude/token-counting)

##### Header ParametersExpand Collapse

"anthropic-beta": optional array of [AnthropicBeta](https://platform.claude.com/docs/en/api/beta#anthropic_beta)

Optional header to specify the beta version(s) you want to use.

Accepts one of the following:

UnionMember0 = string

UnionMember1 = "message-batches-2024-09-24"or"prompt-caching-2024-07-31"or"computer-use-2024-10-22"or16 more

Accepts one of the following:

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

##### Body ParametersExpand Collapse

messages: array of [BetaMessageParam](https://platform.claude.com/docs/en/api/beta#beta_message_param) { content, role }

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

content: stringorarray of [BetaContentBlockParam](https://platform.claude.com/docs/en/api/beta#beta_content_block_param)

Accepts one of the following:

UnionMember0 = string

UnionMember1 = array of [BetaContentBlockParam](https://platform.claude.com/docs/en/api/beta#beta_content_block_param)

Accepts one of the following:

BetaTextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional array of [BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)

Accepts one of the following:

BetaCitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam = object {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) { data, media\_type, type } or[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) { type, url } or[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) { file\_id, type }

Accepts one of the following:

BetaBase64ImageSource = object {data, media\_type, type}

data: string

media\_type: "image/jpeg"or"image/png"or"image/gif"or"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource = object {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaRequestDocumentBlock = object {source, type, cache\_control, 3 more}

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) { data, media\_type, type } or[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) { data, media\_type, type } or[BetaContentBlockSource](https://platform.claude.com/docs/en/api/beta#beta_content_block_source) { content, type } or2 more

Accepts one of the following:

BetaBase64PDFSource = object {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource = object {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

BetaContentBlockSource = object {content, type}

content: stringorarray of [BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)

Accepts one of the following:

UnionMember0 = string

BetaContentBlockSourceContent = array of [BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)

Accepts one of the following:

BetaTextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional array of [BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)

Accepts one of the following:

BetaCitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam = object {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) { data, media\_type, type } or[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) { type, url } or[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) { file\_id, type }

Accepts one of the following:

BetaBase64ImageSource = object {data, media\_type, type}

data: string

media\_type: "image/jpeg"or"image/png"or"image/gif"or"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource = object {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

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

BetaURLPDFSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileDocumentSource = object {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "document"

Accepts one of the following:

"document"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) { enabled }

enabled: optional boolean

context: optional string

title: optional string

BetaSearchResultBlockParam = object {content, source, title, 3 more}

content: array of [BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) { text, type, cache\_control, citations }

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional array of [BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)

Accepts one of the following:

BetaCitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

source: string

title: string

type: "search\_result"

Accepts one of the following:

"search\_result"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) { enabled }

enabled: optional boolean

BetaThinkingBlockParam = object {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

BetaRedactedThinkingBlockParam = object {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

BetaToolUseBlockParam = object {id, input, name, 3 more}

id: string

input: map\[unknown\]

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

caller: optional [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) { type } or[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) { tool\_id, type }

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller = object {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller = object {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaToolResultBlockParam = object {tool\_use\_id, type, cache\_control, 2 more}

tool\_use\_id: string

type: "tool\_result"

Accepts one of the following:

"tool\_result"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

content: optional stringorarray of [BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) { text, type, cache\_control, citations } or[BetaImageBlockParam](https://platform.claude.com/docs/en/api/beta#beta_image_block_param) { source, type, cache\_control } or[BetaSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_search_result_block_param) { content, source, title, 3 more } or2 more

Accepts one of the following:

UnionMember0 = string

UnionMember1 = array of [BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) { text, type, cache\_control, citations } or[BetaImageBlockParam](https://platform.claude.com/docs/en/api/beta#beta_image_block_param) { source, type, cache\_control } or[BetaSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_search_result_block_param) { content, source, title, 3 more } or2 more

Accepts one of the following:

BetaTextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional array of [BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)

Accepts one of the following:

BetaCitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam = object {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) { data, media\_type, type } or[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) { type, url } or[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) { file\_id, type }

Accepts one of the following:

BetaBase64ImageSource = object {data, media\_type, type}

data: string

media\_type: "image/jpeg"or"image/png"or"image/gif"or"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource = object {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaSearchResultBlockParam = object {content, source, title, 3 more}

content: array of [BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) { text, type, cache\_control, citations }

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional array of [BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)

Accepts one of the following:

BetaCitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

source: string

title: string

type: "search\_result"

Accepts one of the following:

"search\_result"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) { enabled }

enabled: optional boolean

BetaRequestDocumentBlock = object {source, type, cache\_control, 3 more}

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) { data, media\_type, type } or[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) { data, media\_type, type } or[BetaContentBlockSource](https://platform.claude.com/docs/en/api/beta#beta_content_block_source) { content, type } or2 more

Accepts one of the following:

BetaBase64PDFSource = object {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource = object {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

BetaContentBlockSource = object {content, type}

content: stringorarray of [BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)

Accepts one of the following:

UnionMember0 = string

BetaContentBlockSourceContent = array of [BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)

Accepts one of the following:

BetaTextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional array of [BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)

Accepts one of the following:

BetaCitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam = object {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) { data, media\_type, type } or[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) { type, url } or[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) { file\_id, type }

Accepts one of the following:

BetaBase64ImageSource = object {data, media\_type, type}

data: string

media\_type: "image/jpeg"or"image/png"or"image/gif"or"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource = object {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

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

BetaURLPDFSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileDocumentSource = object {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "document"

Accepts one of the following:

"document"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) { enabled }

enabled: optional boolean

context: optional string

title: optional string

BetaToolReferenceBlockParam = object {tool\_name, type, cache\_control}

Tool reference block that can be included in tool\_result content.

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

is\_error: optional boolean

BetaServerToolUseBlockParam = object {id, input, name, 3 more}

id: string

input: map\[unknown\]

name: "web\_search"or"web\_fetch"or"code\_execution"or4 more

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

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

caller: optional [BetaDirectCaller](https://platform.claude.com/docs/en/api/beta#beta_direct_caller) { type } or[BetaServerToolCaller](https://platform.claude.com/docs/en/api/beta#beta_server_tool_caller) { tool\_id, type }

Tool invocation directly from the model.

Accepts one of the following:

BetaDirectCaller = object {type}

Tool invocation directly from the model.

type: "direct"

Accepts one of the following:

"direct"

BetaServerToolCaller = object {tool\_id, type}

Tool invocation generated by a server-side tool.

tool\_id: string

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

BetaWebSearchToolResultBlockParam = object {content, tool\_use\_id, type, cache\_control}

content: [BetaWebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_web_search_tool_result_block_param_content)

Accepts one of the following:

ResultBlock = array of [BetaWebSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_search_result_block_param) { encrypted\_content, title, type, 2 more }

encrypted\_content: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

page\_age: optional string

BetaWebSearchToolRequestError = object {error\_code, type}

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

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaWebFetchToolResultBlockParam = object {content, tool\_use\_id, type, cache\_control}

content: [BetaWebFetchToolResultErrorBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_tool_result_error_block_param) { error\_code, type } or[BetaWebFetchBlockParam](https://platform.claude.com/docs/en/api/beta#beta_web_fetch_block_param) { content, type, url, retrieved\_at }

Accepts one of the following:

BetaWebFetchToolResultErrorBlockParam = object {error\_code, type}

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

BetaWebFetchBlockParam = object {content, type, url, retrieved\_at}

content: [BetaRequestDocumentBlock](https://platform.claude.com/docs/en/api/beta#beta_request_document_block) { source, type, cache\_control, 3 more }

source: [BetaBase64PDFSource](https://platform.claude.com/docs/en/api/beta#beta_base64_pdf_source) { data, media\_type, type } or[BetaPlainTextSource](https://platform.claude.com/docs/en/api/beta#beta_plain_text_source) { data, media\_type, type } or[BetaContentBlockSource](https://platform.claude.com/docs/en/api/beta#beta_content_block_source) { content, type } or2 more

Accepts one of the following:

BetaBase64PDFSource = object {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

BetaPlainTextSource = object {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

BetaContentBlockSource = object {content, type}

content: stringorarray of [BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)

Accepts one of the following:

UnionMember0 = string

BetaContentBlockSourceContent = array of [BetaContentBlockSourceContent](https://platform.claude.com/docs/en/api/beta#beta_content_block_source_content)

Accepts one of the following:

BetaTextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional array of [BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)

Accepts one of the following:

BetaCitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

BetaImageBlockParam = object {source, type, cache\_control}

source: [BetaBase64ImageSource](https://platform.claude.com/docs/en/api/beta#beta_base64_image_source) { data, media\_type, type } or[BetaURLImageSource](https://platform.claude.com/docs/en/api/beta#beta_url_image_source) { type, url } or[BetaFileImageSource](https://platform.claude.com/docs/en/api/beta#beta_file_image_source) { file\_id, type }

Accepts one of the following:

BetaBase64ImageSource = object {data, media\_type, type}

data: string

media\_type: "image/jpeg"or"image/png"or"image/gif"or"image/webp"

Accepts one of the following:

"image/jpeg"

"image/png"

"image/gif"

"image/webp"

type: "base64"

Accepts one of the following:

"base64"

BetaURLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileImageSource = object {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

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

BetaURLPDFSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

BetaFileDocumentSource = object {file\_id, type}

file\_id: string

type: "file"

Accepts one of the following:

"file"

type: "document"

Accepts one of the following:

"document"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) { enabled }

enabled: optional boolean

context: optional string

title: optional string

type: "web\_fetch\_result"

Accepts one of the following:

"web\_fetch\_result"

url: string

Fetched content URL

retrieved\_at: optional string

ISO 8601 timestamp when the content was retrieved

tool\_use\_id: string

type: "web\_fetch\_tool\_result"

Accepts one of the following:

"web\_fetch\_tool\_result"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaCodeExecutionToolResultBlockParam = object {content, tool\_use\_id, type, cache\_control}

content: [BetaCodeExecutionToolResultBlockParamContent](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_block_param_content)

Accepts one of the following:

BetaCodeExecutionToolResultErrorParam = object {error\_code, type}

error\_code: [BetaCodeExecutionToolResultErrorCode](https://platform.claude.com/docs/en/api/beta#beta_code_execution_tool_result_error_code)

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "code\_execution\_tool\_result\_error"

Accepts one of the following:

"code\_execution\_tool\_result\_error"

BetaCodeExecutionResultBlockParam = object {content, return\_code, stderr, 2 more}

content: array of [BetaCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_code_execution_output_block_param) { file\_id, type }

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

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaBashCodeExecutionToolResultBlockParam = object {content, tool\_use\_id, type, cache\_control}

content: [BetaBashCodeExecutionToolResultErrorParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_tool_result_error_param) { error\_code, type } or[BetaBashCodeExecutionResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_result_block_param) { content, return\_code, stderr, 2 more }

Accepts one of the following:

BetaBashCodeExecutionToolResultErrorParam = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"too\_many\_requests"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"output\_file\_too\_large"

type: "bash\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"bash\_code\_execution\_tool\_result\_error"

BetaBashCodeExecutionResultBlockParam = object {content, return\_code, stderr, 2 more}

content: array of [BetaBashCodeExecutionOutputBlockParam](https://platform.claude.com/docs/en/api/beta#beta_bash_code_execution_output_block_param) { file\_id, type }

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

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaTextEditorCodeExecutionToolResultBlockParam = object {content, tool\_use\_id, type, cache\_control}

content: [BetaTextEditorCodeExecutionToolResultErrorParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_tool_result_error_param) { error\_code, type, error\_message } or[BetaTextEditorCodeExecutionViewResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_view_result_block_param) { content, file\_type, type, 3 more } or[BetaTextEditorCodeExecutionCreateResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_create_result_block_param) { is\_file\_update, type } or[BetaTextEditorCodeExecutionStrReplaceResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_editor_code_execution_str_replace_result_block_param) { type, lines, new\_lines, 3 more }

Accepts one of the following:

BetaTextEditorCodeExecutionToolResultErrorParam = object {error\_code, type, error\_message}

error\_code: "invalid\_tool\_input"or"unavailable"or"too\_many\_requests"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

"file\_not\_found"

type: "text\_editor\_code\_execution\_tool\_result\_error"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result\_error"

error\_message: optional string

BetaTextEditorCodeExecutionViewResultBlockParam = object {content, file\_type, type, 3 more}

content: string

file\_type: "text"or"image"or"pdf"

Accepts one of the following:

"text"

"image"

"pdf"

type: "text\_editor\_code\_execution\_view\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_view\_result"

num\_lines: optional number

start\_line: optional number

total\_lines: optional number

BetaTextEditorCodeExecutionCreateResultBlockParam = object {is\_file\_update, type}

is\_file\_update: boolean

type: "text\_editor\_code\_execution\_create\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_create\_result"

BetaTextEditorCodeExecutionStrReplaceResultBlockParam = object {type, lines, new\_lines, 3 more}

type: "text\_editor\_code\_execution\_str\_replace\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_str\_replace\_result"

lines: optional array of string

new\_lines: optional number

new\_start: optional number

old\_lines: optional number

old\_start: optional number

tool\_use\_id: string

type: "text\_editor\_code\_execution\_tool\_result"

Accepts one of the following:

"text\_editor\_code\_execution\_tool\_result"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaToolSearchToolResultBlockParam = object {content, tool\_use\_id, type, cache\_control}

content: [BetaToolSearchToolResultErrorParam](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_result_error_param) { error\_code, type } or[BetaToolSearchToolSearchResultBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_search_tool_search_result_block_param) { tool\_references, type }

Accepts one of the following:

BetaToolSearchToolResultErrorParam = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"too\_many\_requests"or"execution\_time\_exceeded"

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"too\_many\_requests"

"execution\_time\_exceeded"

type: "tool\_search\_tool\_result\_error"

Accepts one of the following:

"tool\_search\_tool\_result\_error"

BetaToolSearchToolSearchResultBlockParam = object {tool\_references, type}

tool\_references: array of [BetaToolReferenceBlockParam](https://platform.claude.com/docs/en/api/beta#beta_tool_reference_block_param) { tool\_name, type, cache\_control }

tool\_name: string

type: "tool\_reference"

Accepts one of the following:

"tool\_reference"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

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

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaMCPToolUseBlockParam = object {id, input, name, 3 more}

id: string

input: map\[unknown\]

name: string

server\_name: string

The name of the MCP server

type: "mcp\_tool\_use"

Accepts one of the following:

"mcp\_tool\_use"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

BetaRequestMCPToolResultBlockParam = object {tool\_use\_id, type, cache\_control, 2 more}

tool\_use\_id: string

type: "mcp\_tool\_result"

Accepts one of the following:

"mcp\_tool\_result"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

content: optional stringorarray of [BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) { text, type, cache\_control, citations }

Accepts one of the following:

UnionMember0 = string

BetaMCPToolResultBlockParamContent = array of [BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) { text, type, cache\_control, citations }

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional array of [BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)

Accepts one of the following:

BetaCitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

is\_error: optional boolean

BetaContainerUploadBlockParam = object {file\_id, type, cache\_control}

A content block that represents a file to be uploaded to the container
Files uploaded via this block will be available in the container's input directory.

file\_id: string

type: "container\_upload"

Accepts one of the following:

"container\_upload"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

role: "user"or"assistant"

Accepts one of the following:

"user"

"assistant"

model: [Model](https://platform.claude.com/docs/en/api/messages#model)

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Accepts one of the following:

UnionMember0 = "claude-opus-4-5-20251101"or"claude-opus-4-5"or"claude-3-7-sonnet-latest"or17 more

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

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

UnionMember1 = string

context\_management: optional [BetaContextManagementConfig](https://platform.claude.com/docs/en/api/beta#beta_context_management_config) { edits }

Context management configuration.

This allows you to control how Claude manages context across multiple requests, such as whether to clear function results or not.

edits: optional array of [BetaClearToolUses20250919Edit](https://platform.claude.com/docs/en/api/beta#beta_clear_tool_uses_20250919_edit) { type, clear\_at\_least, clear\_tool\_inputs, 3 more } or[BetaClearThinking20251015Edit](https://platform.claude.com/docs/en/api/beta#beta_clear_thinking_20251015_edit) { type, keep }

List of context management edits to apply

Accepts one of the following:

BetaClearToolUses20250919Edit = object {type, clear\_at\_least, clear\_tool\_inputs, 3 more}

type: "clear\_tool\_uses\_20250919"

Accepts one of the following:

"clear\_tool\_uses\_20250919"

clear\_at\_least: optional [BetaInputTokensClearAtLeast](https://platform.claude.com/docs/en/api/beta#beta_input_tokens_clear_at_least) { type, value }

Minimum number of tokens that must be cleared when triggered. Context will only be modified if at least this many tokens can be removed.

type: "input\_tokens"

Accepts one of the following:

"input\_tokens"

value: number

clear\_tool\_inputs: optional booleanorarray of string

Whether to clear all tool inputs (bool) or specific tool inputs to clear (list)

Accepts one of the following:

UnionMember0 = boolean

UnionMember1 = array of string

exclude\_tools: optional array of string

Tool names whose uses are preserved from clearing

keep: optional [BetaToolUsesKeep](https://platform.claude.com/docs/en/api/beta#beta_tool_uses_keep) { type, value }

Number of tool uses to retain in the conversation

type: "tool\_uses"

Accepts one of the following:

"tool\_uses"

value: number

trigger: optional [BetaInputTokensTrigger](https://platform.claude.com/docs/en/api/beta#beta_input_tokens_trigger) { type, value } or[BetaToolUsesTrigger](https://platform.claude.com/docs/en/api/beta#beta_tool_uses_trigger) { type, value }

Condition that triggers the context management strategy

Accepts one of the following:

BetaInputTokensTrigger = object {type, value}

type: "input\_tokens"

Accepts one of the following:

"input\_tokens"

value: number

BetaToolUsesTrigger = object {type, value}

type: "tool\_uses"

Accepts one of the following:

"tool\_uses"

value: number

BetaClearThinking20251015Edit = object {type, keep}

type: "clear\_thinking\_20251015"

Accepts one of the following:

"clear\_thinking\_20251015"

keep: optional [BetaThinkingTurns](https://platform.claude.com/docs/en/api/beta#beta_thinking_turns) { type, value } or[BetaAllThinkingTurns](https://platform.claude.com/docs/en/api/beta#beta_all_thinking_turns) { type } or"all"

Number of most recent assistant turns to keep thinking blocks for. Older turns will have their thinking blocks removed.

Accepts one of the following:

BetaThinkingTurns = object {type, value}

type: "thinking\_turns"

Accepts one of the following:

"thinking\_turns"

value: number

BetaAllThinkingTurns = object {type}

type: "all"

Accepts one of the following:

"all"

UnionMember2 = "all"

Accepts one of the following:

"all"

mcp\_servers: optional array of [BetaRequestMCPServerURLDefinition](https://platform.claude.com/docs/en/api/beta#beta_request_mcp_server_url_definition) { name, type, url, 2 more }

MCP servers to be utilized in this request

name: string

type: "url"

Accepts one of the following:

"url"

url: string

authorization\_token: optional string

tool\_configuration: optional [BetaRequestMCPServerToolConfiguration](https://platform.claude.com/docs/en/api/beta#beta_request_mcp_server_tool_configuration) { allowed\_tools, enabled }

allowed\_tools: optional array of string

enabled: optional boolean

output\_config: optional [BetaOutputConfig](https://platform.claude.com/docs/en/api/beta#beta_output_config) { effort }

Configuration options for the model's output. Controls aspects like how much effort the model puts into its response.

effort: optional "low"or"medium"or"high"

All possible effort levels.

Accepts one of the following:

"low"

"medium"

"high"

output\_format: optional [BetaJSONOutputFormat](https://platform.claude.com/docs/en/api/beta#beta_json_output_format) { schema, type }

A schema to specify Claude's output format in responses.

schema: map\[unknown\]

The JSON schema of the format

type: "json\_schema"

Accepts one of the following:

"json\_schema"

system: optional stringorarray of [BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) { text, type, cache\_control, citations }

System prompt.

A system prompt is a way of providing context and instructions to Claude, such as specifying a particular goal or role. See our [guide to system prompts](https://docs.claude.com/en/docs/system-prompts).

Accepts one of the following:

UnionMember0 = string

UnionMember1 = array of [BetaTextBlockParam](https://platform.claude.com/docs/en/api/beta#beta_text_block_param) { text, type, cache\_control, citations }

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional array of [BetaTextCitationParam](https://platform.claude.com/docs/en/api/beta#beta_text_citation_param)

Accepts one of the following:

BetaCitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

BetaCitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

BetaCitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

BetaCitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

BetaCitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

thinking: optional [BetaThinkingConfigParam](https://platform.claude.com/docs/en/api/beta#beta_thinking_config_param)

Configuration for enabling Claude's extended thinking.

When enabled, responses include `thinking` content blocks showing Claude's thinking process before the final answer. Requires a minimum budget of 1,024 tokens and counts towards your `max_tokens` limit.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

Accepts one of the following:

BetaThinkingConfigEnabled = object {budget\_tokens, type}

budget\_tokens: number

Determines how many tokens Claude can use for its internal reasoning process. Larger budgets can enable more thorough analysis for complex problems, improving response quality.

Must be ≥1024 and less than `max_tokens`.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

minimum1024

type: "enabled"

Accepts one of the following:

"enabled"

BetaThinkingConfigDisabled = object {type}

type: "disabled"

Accepts one of the following:

"disabled"

tool\_choice: optional [BetaToolChoice](https://platform.claude.com/docs/en/api/beta#beta_tool_choice)

How the model should use the provided tools. The model can use a specific tool, any available tool, decide by itself, or not use tools at all.

Accepts one of the following:

BetaToolChoiceAuto = object {type, disable\_parallel\_tool\_use}

The model will automatically decide whether to use tools.

type: "auto"

Accepts one of the following:

"auto"

disable\_parallel\_tool\_use: optional boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output at most one tool use.

BetaToolChoiceAny = object {type, disable\_parallel\_tool\_use}

The model will use any available tools.

type: "any"

Accepts one of the following:

"any"

disable\_parallel\_tool\_use: optional boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

BetaToolChoiceTool = object {name, type, disable\_parallel\_tool\_use}

The model will use the specified tool with `tool_choice.name`.

name: string

The name of the tool to use.

type: "tool"

Accepts one of the following:

"tool"

disable\_parallel\_tool\_use: optional boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

BetaToolChoiceNone = object {type}

The model will not be allowed to use tools.

type: "none"

Accepts one of the following:

"none"

tools: optional array of [BetaTool](https://platform.claude.com/docs/en/api/beta#beta_tool) { input\_schema, name, allowed\_callers, 6 more } or[BetaToolBash20241022](https://platform.claude.com/docs/en/api/beta#beta_tool_bash_20241022) { name, type, allowed\_callers, 4 more } or[BetaToolBash20250124](https://platform.claude.com/docs/en/api/beta#beta_tool_bash_20250124) { name, type, allowed\_callers, 4 more } or15 more

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

BetaTool = object {input\_schema, name, allowed\_callers, 6 more}

input\_schema: object {type, properties, required}

[JSON schema](https://json-schema.org/draft/2020-12) for this tool's input.

This defines the shape of the `input` that your tool accepts and that the model will produce.

type: "object"

Accepts one of the following:

"object"

properties: optional map\[unknown\]

required: optional array of string

name: string

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

maxLength128

minLength1

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

description: optional string

Description of what this tool does.

Tool descriptions should be as detailed as possible. The more information that the model has about what the tool is and how to use it, the better it will perform. You can use natural language descriptions to reinforce important aspects of the tool input JSON schema.

input\_examples: optional array of map\[unknown\]

strict: optional boolean

type: optional "custom"

Accepts one of the following:

"custom"

BetaToolBash20241022 = object {name, type, allowed\_callers, 4 more}

name: "bash"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: "bash\_20241022"

Accepts one of the following:

"bash\_20241022"

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: optional array of map\[unknown\]

strict: optional boolean

BetaToolBash20250124 = object {name, type, allowed\_callers, 4 more}

name: "bash"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: "bash\_20250124"

Accepts one of the following:

"bash\_20250124"

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: optional array of map\[unknown\]

strict: optional boolean

BetaCodeExecutionTool20250522 = object {name, type, allowed\_callers, 3 more}

name: "code\_execution"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"code\_execution"

type: "code\_execution\_20250522"

Accepts one of the following:

"code\_execution\_20250522"

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict: optional boolean

BetaCodeExecutionTool20250825 = object {name, type, allowed\_callers, 3 more}

name: "code\_execution"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"code\_execution"

type: "code\_execution\_20250825"

Accepts one of the following:

"code\_execution\_20250825"

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict: optional boolean

BetaToolComputerUse20241022 = object {display\_height\_px, display\_width\_px, name, 7 more}

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

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number: optional number

The X11 display number (e.g. 0, 1) for the display.

minimum0

input\_examples: optional array of map\[unknown\]

strict: optional boolean

BetaMemoryTool20250818 = object {name, type, allowed\_callers, 4 more}

name: "memory"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"memory"

type: "memory\_20250818"

Accepts one of the following:

"memory\_20250818"

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: optional array of map\[unknown\]

strict: optional boolean

BetaToolComputerUse20250124 = object {display\_height\_px, display\_width\_px, name, 7 more}

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

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number: optional number

The X11 display number (e.g. 0, 1) for the display.

minimum0

input\_examples: optional array of map\[unknown\]

strict: optional boolean

BetaToolTextEditor20241022 = object {name, type, allowed\_callers, 4 more}

name: "str\_replace\_editor"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: "text\_editor\_20241022"

Accepts one of the following:

"text\_editor\_20241022"

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: optional array of map\[unknown\]

strict: optional boolean

BetaToolComputerUse20251124 = object {display\_height\_px, display\_width\_px, name, 8 more}

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

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

display\_number: optional number

The X11 display number (e.g. 0, 1) for the display.

minimum0

enable\_zoom: optional boolean

Whether to enable an action to take a zoomed-in screenshot of the screen.

input\_examples: optional array of map\[unknown\]

strict: optional boolean

BetaToolTextEditor20250124 = object {name, type, allowed\_callers, 4 more}

name: "str\_replace\_editor"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: "text\_editor\_20250124"

Accepts one of the following:

"text\_editor\_20250124"

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: optional array of map\[unknown\]

strict: optional boolean

BetaToolTextEditor20250429 = object {name, type, allowed\_callers, 4 more}

name: "str\_replace\_based\_edit\_tool"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: "text\_editor\_20250429"

Accepts one of the following:

"text\_editor\_20250429"

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: optional array of map\[unknown\]

strict: optional boolean

BetaToolTextEditor20250728 = object {name, type, allowed\_callers, 5 more}

name: "str\_replace\_based\_edit\_tool"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: "text\_editor\_20250728"

Accepts one of the following:

"text\_editor\_20250728"

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

input\_examples: optional array of map\[unknown\]

max\_characters: optional number

Maximum number of characters to display when viewing a file. If not specified, defaults to displaying the full file.

minimum1

strict: optional boolean

BetaWebSearchTool20250305 = object {name, type, allowed\_callers, 7 more}

name: "web\_search"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_search"

type: "web\_search\_20250305"

Accepts one of the following:

"web\_search\_20250305"

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

allowed\_domains: optional array of string

If provided, only these domains will be included in results. Cannot be used alongside `blocked_domains`.

blocked\_domains: optional array of string

If provided, these domains will never appear in results. Cannot be used alongside `allowed_domains`.

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

max\_uses: optional number

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

strict: optional boolean

user\_location: optional object {type, city, country, 2 more}

Parameters for the user's location. Used to provide more relevant search results.

type: "approximate"

Accepts one of the following:

"approximate"

city: optional string

The city of the user.

maxLength255

minLength1

country: optional string

The two letter [ISO country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) of the user.

maxLength2

minLength2

region: optional string

The region of the user.

maxLength255

minLength1

timezone: optional string

The [IANA timezone](https://nodatime.org/TimeZones) of the user.

maxLength255

minLength1

BetaWebFetchTool20250910 = object {name, type, allowed\_callers, 8 more}

name: "web\_fetch"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_fetch"

type: "web\_fetch\_20250910"

Accepts one of the following:

"web\_fetch\_20250910"

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

allowed\_domains: optional array of string

List of domains to allow fetching from

blocked\_domains: optional array of string

List of domains to block fetching from

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

citations: optional [BetaCitationsConfigParam](https://platform.claude.com/docs/en/api/beta#beta_citations_config_param) { enabled }

Citations configuration for fetched documents. Citations are disabled by default.

enabled: optional boolean

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

max\_content\_tokens: optional number

Maximum number of tokens used by including web page text content in the context. The limit is approximate and does not apply to binary content such as PDFs.

exclusiveMinimum0

max\_uses: optional number

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

strict: optional boolean

BetaToolSearchToolBm25\_20251119 = object {name, type, allowed\_callers, 3 more}

name: "tool\_search\_tool\_bm25"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"tool\_search\_tool\_bm25"

type: "tool\_search\_tool\_bm25\_20251119"or"tool\_search\_tool\_bm25"

Accepts one of the following:

"tool\_search\_tool\_bm25\_20251119"

"tool\_search\_tool\_bm25"

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict: optional boolean

BetaToolSearchToolRegex20251119 = object {name, type, allowed\_callers, 3 more}

name: "tool\_search\_tool\_regex"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"tool\_search\_tool\_regex"

type: "tool\_search\_tool\_regex\_20251119"or"tool\_search\_tool\_regex"

Accepts one of the following:

"tool\_search\_tool\_regex\_20251119"

"tool\_search\_tool\_regex"

allowed\_callers: optional array of "direct"or"code\_execution\_20250825"

Accepts one of the following:

"direct"

"code\_execution\_20250825"

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

defer\_loading: optional boolean

If true, tool will not be included in initial system prompt. Only loaded when returned via tool\_reference from tool search.

strict: optional boolean

BetaMCPToolset = object {mcp\_server\_name, type, cache\_control, 2 more}

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

cache\_control: optional [BetaCacheControlEphemeral](https://platform.claude.com/docs/en/api/beta#beta_cache_control_ephemeral) { type, ttl }

Create a cache control breakpoint at this content block.

type: "ephemeral"

Accepts one of the following:

"ephemeral"

ttl: optional "5m"or"1h"

The time-to-live for the cache control breakpoint.

This may be one the following values:

- `5m`: 5 minutes
- `1h`: 1 hour

Defaults to `5m`.

Accepts one of the following:

"5m"

"1h"

configs: optional map\[[BetaMCPToolConfig](https://platform.claude.com/docs/en/api/beta#beta_mcp_tool_config) { defer\_loading, enabled } \]

Configuration overrides for specific tools, keyed by tool name

defer\_loading: optional boolean

enabled: optional boolean

default\_config: optional [BetaMCPToolDefaultConfig](https://platform.claude.com/docs/en/api/beta#beta_mcp_tool_default_config) { defer\_loading, enabled }

Default configuration applied to all tools from this server

defer\_loading: optional boolean

enabled: optional boolean

##### ReturnsExpand Collapse

BetaMessageTokensCount = object {context\_management, input\_tokens}

context\_management: [BetaCountTokensContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_count_tokens_context_management_response) { original\_input\_tokens }

Information about context management applied to the message.

original\_input\_tokens: number

The original token count before context management was applied

input\_tokens: number

The total number of tokens across the provided list of messages, system prompt, and tools.

Count tokens in a Message

cURL

```
curl https://api.anthropic.com/v1/messages/count_tokens \
    -H 'Content-Type: application/json' \
    -H 'anthropic-version: 2023-06-01' \
    -H "X-Api-Key: $ANTHROPIC_API_KEY" \
    -d '{
          "messages": [\
            {\
              "content": "string",\
              "role": "user"\
            }\
          ],
          "model": "claude-opus-4-5-20251101"
        }'
```

Response 200

```
{
  "context_management": {
    "original_input_tokens": 0
  },
  "input_tokens": 2095
}
```

##### Returns Examples

Response 200

```
{
  "context_management": {
    "original_input_tokens": 0
  },
  "input_tokens": 2095
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