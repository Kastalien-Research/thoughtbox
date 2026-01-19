---
url: "https://platform.claude.com/docs/en/api/typescript/messages/create"
title: "Create a Message - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Ftypescript%2Fmessages%2Fcreate)

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

Messages

Create

Copy page

TypeScript

# Create a Message

client.messages.create(MessageCreateParamsbody, RequestOptionsoptions?): [Message](https://platform.claude.com/docs/en/api/messages#message) {id, content, model, 5 more} \|Stream<[RawMessageStreamEvent](https://platform.claude.com/docs/en/api/messages#raw_message_stream_event)>

post/v1/messages

Send a structured list of input messages with text and/or image content, and the model will generate the next message in the conversation.

The Messages API can be used for either single queries or stateless multi-turn conversations.

Learn more about the Messages API in our [user guide](https://docs.claude.com/en/docs/initial-setup)

##### ParametersExpand Collapse

MessageCreateParams = MessageCreateParamsNonStreaming {stream} \|MessageCreateParamsStreaming {stream}

MessageCreateParamsBase {max\_tokens, messages, model, 11 more}

max\_tokens: number

The maximum number of tokens to generate before stopping.

Note that our models may stop _before_ reaching this maximum. This parameter only specifies the absolute maximum number of tokens to generate.

Different models have different maximum values for this parameter. See [models](https://docs.claude.com/en/docs/models-overview) for details.

minimum1

messages: Array<[MessageParam](https://platform.claude.com/docs/en/api/messages#message_param) {content, role} >

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

content: string\|Array<[ContentBlockParam](https://platform.claude.com/docs/en/api/messages#content_block_param)>

Accepts one of the following:

string

Array<[ContentBlockParam](https://platform.claude.com/docs/en/api/messages#content_block_param)>

TextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

citations?: Array<[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)>\|null

Accepts one of the following:

CitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) {data, media\_type, type} \|[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) {type, url}

Accepts one of the following:

Base64ImageSource {data, media\_type, type}

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

URLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

DocumentBlockParam {source, type, cache\_control, 3 more}

source: [Base64PDFSource](https://platform.claude.com/docs/en/api/messages#base64_pdf_source) {data, media\_type, type} \|[PlainTextSource](https://platform.claude.com/docs/en/api/messages#plain_text_source) {data, media\_type, type} \|[ContentBlockSource](https://platform.claude.com/docs/en/api/messages#content_block_source) {content, type} \|[URLPDFSource](https://platform.claude.com/docs/en/api/messages#url_pdf_source) {type, url}

Accepts one of the following:

Base64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

PlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

ContentBlockSource {content, type}

content: string\|Array<[ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)>

Accepts one of the following:

string

Array<[ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)>

TextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

citations?: Array<[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)>\|null

Accepts one of the following:

CitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) {data, media\_type, type} \|[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) {type, url}

Accepts one of the following:

Base64ImageSource {data, media\_type, type}

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

URLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

URLPDFSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "document"

Accepts one of the following:

"document"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

citations?: [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) {enabled} \|null

enabled?: boolean

context?: string\|null

title?: string\|null

SearchResultBlockParam {content, source, title, 3 more}

content: Array<[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) {text, type, cache\_control, citations} >

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

citations?: Array<[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)>\|null

Accepts one of the following:

CitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

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

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

citations?: [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) {enabled}

enabled?: boolean

ThinkingBlockParam {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlockParam {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlockParam {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

ToolResultBlockParam {tool\_use\_id, type, cache\_control, 2 more}

tool\_use\_id: string

type: "tool\_result"

Accepts one of the following:

"tool\_result"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

content?: string\|Array<[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) {text, type, cache\_control, citations} \|[ImageBlockParam](https://platform.claude.com/docs/en/api/messages#image_block_param) {source, type, cache\_control} \|[SearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#search_result_block_param) {content, source, title, 3 more} \|[DocumentBlockParam](https://platform.claude.com/docs/en/api/messages#document_block_param) {source, type, cache\_control, 3 more} >

Accepts one of the following:

string

Array<[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) {text, type, cache\_control, citations} \|[ImageBlockParam](https://platform.claude.com/docs/en/api/messages#image_block_param) {source, type, cache\_control} \|[SearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#search_result_block_param) {content, source, title, 3 more} \|[DocumentBlockParam](https://platform.claude.com/docs/en/api/messages#document_block_param) {source, type, cache\_control, 3 more} >

TextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

citations?: Array<[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)>\|null

Accepts one of the following:

CitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) {data, media\_type, type} \|[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) {type, url}

Accepts one of the following:

Base64ImageSource {data, media\_type, type}

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

URLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

SearchResultBlockParam {content, source, title, 3 more}

content: Array<[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) {text, type, cache\_control, citations} >

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

citations?: Array<[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)>\|null

Accepts one of the following:

CitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

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

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

citations?: [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) {enabled}

enabled?: boolean

DocumentBlockParam {source, type, cache\_control, 3 more}

source: [Base64PDFSource](https://platform.claude.com/docs/en/api/messages#base64_pdf_source) {data, media\_type, type} \|[PlainTextSource](https://platform.claude.com/docs/en/api/messages#plain_text_source) {data, media\_type, type} \|[ContentBlockSource](https://platform.claude.com/docs/en/api/messages#content_block_source) {content, type} \|[URLPDFSource](https://platform.claude.com/docs/en/api/messages#url_pdf_source) {type, url}

Accepts one of the following:

Base64PDFSource {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

PlainTextSource {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

ContentBlockSource {content, type}

content: string\|Array<[ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)>

Accepts one of the following:

string

Array<[ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)>

TextBlockParam {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

citations?: Array<[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)>\|null

Accepts one of the following:

CitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string\|null

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) {data, media\_type, type} \|[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) {type, url}

Accepts one of the following:

Base64ImageSource {data, media\_type, type}

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

URLImageSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

URLPDFSource {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "document"

Accepts one of the following:

"document"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

citations?: [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) {enabled} \|null

enabled?: boolean

context?: string\|null

title?: string\|null

is\_error?: boolean

ServerToolUseBlockParam {id, input, name, 2 more}

id: string

input: Record<string, unknown>

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

WebSearchToolResultBlockParam {content, tool\_use\_id, type, cache\_control}

content: [WebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_param_content)

Accepts one of the following:

Array<[WebSearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#web_search_result_block_param) {encrypted\_content, title, type, 2 more} >

encrypted\_content: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

page\_age?: string\|null

WebSearchToolRequestError {error\_code, type}

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

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

metadata?: [Metadata](https://platform.claude.com/docs/en/api/messages#metadata) {user\_id}

An object describing metadata about the request.

user\_id?: string\|null

An external identifier for the user who is associated with the request.

This should be a uuid, hash value, or other opaque identifier. Anthropic may use this id to help detect abuse. Do not include any identifying information such as name, email address, or phone number.

maxLength256

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

stream?: false

Whether to incrementally stream the response using server-sent events.

See [streaming](https://docs.claude.com/en/api/messages-streaming) for details.

Accepts one of the following:

false

system?: string\|Array<[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) {text, type, cache\_control, citations} >

System prompt.

A system prompt is a way of providing context and instructions to Claude, such as specifying a particular goal or role. See our [guide to system prompts](https://docs.claude.com/en/docs/system-prompts).

Accepts one of the following:

string

Array<[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) {text, type, cache\_control, citations} >

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

citations?: Array<[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)>\|null

Accepts one of the following:

CitationCharLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string\|null

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string\|null

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam {cited\_text, end\_block\_index, search\_result\_index, 4 more}

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

thinking?: [ThinkingConfigParam](https://platform.claude.com/docs/en/api/messages#thinking_config_param)

Configuration for enabling Claude's extended thinking.

When enabled, responses include `thinking` content blocks showing Claude's thinking process before the final answer. Requires a minimum budget of 1,024 tokens and counts towards your `max_tokens` limit.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

Accepts one of the following:

ThinkingConfigEnabled {budget\_tokens, type}

budget\_tokens: number

Determines how many tokens Claude can use for its internal reasoning process. Larger budgets can enable more thorough analysis for complex problems, improving response quality.

Must be ≥1024 and less than `max_tokens`.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

minimum1024

type: "enabled"

Accepts one of the following:

"enabled"

ThinkingConfigDisabled {type}

type: "disabled"

Accepts one of the following:

"disabled"

tool\_choice?: [ToolChoice](https://platform.claude.com/docs/en/api/messages#tool_choice)

How the model should use the provided tools. The model can use a specific tool, any available tool, decide by itself, or not use tools at all.

Accepts one of the following:

ToolChoiceAuto {type, disable\_parallel\_tool\_use}

The model will automatically decide whether to use tools.

type: "auto"

Accepts one of the following:

"auto"

disable\_parallel\_tool\_use?: boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output at most one tool use.

ToolChoiceAny {type, disable\_parallel\_tool\_use}

The model will use any available tools.

type: "any"

Accepts one of the following:

"any"

disable\_parallel\_tool\_use?: boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

ToolChoiceTool {name, type, disable\_parallel\_tool\_use}

The model will use the specified tool with `tool_choice.name`.

name: string

The name of the tool to use.

type: "tool"

Accepts one of the following:

"tool"

disable\_parallel\_tool\_use?: boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

ToolChoiceNone {type}

The model will not be allowed to use tools.

type: "none"

Accepts one of the following:

"none"

tools?: Array<[ToolUnion](https://platform.claude.com/docs/en/api/messages#tool_union)>

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

Tool {input\_schema, name, cache\_control, 2 more}

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

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

description?: string

Description of what this tool does.

Tool descriptions should be as detailed as possible. The more information that the model has about what the tool is and how to use it, the better it will perform. You can use natural language descriptions to reinforce important aspects of the tool input JSON schema.

type?: "custom"\|null

Accepts one of the following:

"custom"

ToolBash20250124 {name, type, cache\_control}

name: "bash"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: "bash\_20250124"

Accepts one of the following:

"bash\_20250124"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

ToolTextEditor20250124 {name, type, cache\_control}

name: "str\_replace\_editor"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: "text\_editor\_20250124"

Accepts one of the following:

"text\_editor\_20250124"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

ToolTextEditor20250429 {name, type, cache\_control}

name: "str\_replace\_based\_edit\_tool"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: "text\_editor\_20250429"

Accepts one of the following:

"text\_editor\_20250429"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

ToolTextEditor20250728 {name, type, cache\_control, max\_characters}

name: "str\_replace\_based\_edit\_tool"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: "text\_editor\_20250728"

Accepts one of the following:

"text\_editor\_20250728"

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

max\_characters?: number\|null

Maximum number of characters to display when viewing a file. If not specified, defaults to displaying the full file.

minimum1

WebSearchTool20250305 {name, type, allowed\_domains, 4 more}

name: "web\_search"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_search"

type: "web\_search\_20250305"

Accepts one of the following:

"web\_search\_20250305"

allowed\_domains?: Array<string>\|null

If provided, only these domains will be included in results. Cannot be used alongside `blocked_domains`.

blocked\_domains?: Array<string>\|null

If provided, these domains will never appear in results. Cannot be used alongside `allowed_domains`.

cache\_control?: [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) {type, ttl} \|null

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

max\_uses?: number\|null

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

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

MessageCreateParamsNonStreaming extends MessageCreateParamsBase {max\_tokens, messages, model, 11 more}  {stream}

stream?: false

Whether to incrementally stream the response using server-sent events.

See [streaming](https://docs.claude.com/en/api/messages-streaming) for details.

Accepts one of the following:

false

MessageCreateParamsNonStreaming extends MessageCreateParamsBase {max\_tokens, messages, model, 11 more}  {stream}

stream?: false

Whether to incrementally stream the response using server-sent events.

See [streaming](https://docs.claude.com/en/api/messages-streaming) for details.

Accepts one of the following:

false

##### ReturnsExpand Collapse

Message {id, content, model, 5 more}

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

Create a Message

TypeScript

```
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

const message = await client.messages.create({
  max_tokens: 1024,
  messages: [{ content: 'Hello, world', role: 'user' }],
  model: 'claude-sonnet-4-5-20250929',
});

console.log(message.id);
```

Response 200

```
{
  "id": "msg_013Zva2CMHLNnXjNJJKqJ2EF",
  "content": [\
    {\
      "citations": [\
        {\
          "cited_text": "cited_text",\
          "document_index": 0,\
          "document_title": "document_title",\
          "end_char_index": 0,\
          "file_id": "file_id",\
          "start_char_index": 0,\
          "type": "char_location"\
        }\
      ],\
      "text": "Hi! My name is Claude.",\
      "type": "text"\
    }\
  ],
  "model": "claude-sonnet-4-5-20250929",
  "role": "assistant",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "type": "message",
  "usage": {
    "cache_creation": {
      "ephemeral_1h_input_tokens": 0,
      "ephemeral_5m_input_tokens": 0
    },
    "cache_creation_input_tokens": 2051,
    "cache_read_input_tokens": 2051,
    "input_tokens": 2095,
    "output_tokens": 503,
    "server_tool_use": {
      "web_search_requests": 0
    },
    "service_tier": "standard"
  }
}
```

##### Returns Examples

Response 200

```
{
  "id": "msg_013Zva2CMHLNnXjNJJKqJ2EF",
  "content": [\
    {\
      "citations": [\
        {\
          "cited_text": "cited_text",\
          "document_index": 0,\
          "document_title": "document_title",\
          "end_char_index": 0,\
          "file_id": "file_id",\
          "start_char_index": 0,\
          "type": "char_location"\
        }\
      ],\
      "text": "Hi! My name is Claude.",\
      "type": "text"\
    }\
  ],
  "model": "claude-sonnet-4-5-20250929",
  "role": "assistant",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "type": "message",
  "usage": {
    "cache_creation": {
      "ephemeral_1h_input_tokens": 0,
      "ephemeral_5m_input_tokens": 0
    },
    "cache_creation_input_tokens": 2051,
    "cache_read_input_tokens": 2051,
    "input_tokens": 2095,
    "output_tokens": 503,
    "server_tool_use": {
      "web_search_requests": 0
    },
    "service_tier": "standard"
  }
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