---
url: "https://platform.claude.com/docs/en/api/python/messages/batches/create"
title: "Create a Message Batch - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Fpython%2Fmessages%2Fbatches%2Fcreate)

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

Batches

Create

Copy page

Python

# Create a Message Batch

messages.batches.create(BatchCreateParams\*\*kwargs)  -\> [MessageBatch](https://platform.claude.com/docs/en/api/messages#message_batch)

post/v1/messages/batches

Send a batch of Message creation requests.

The Message Batches API can be used to process multiple Messages API requests at once. Once a Message Batch is created, it begins processing immediately. Batches can take up to 24 hours to complete.

Learn more about the Message Batches API in our [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)

##### ParametersExpand Collapse

requests: [Iterable](https://platform.claude.com/docs/en/api/messages/batches/create)\[Request\]

List of requests for prompt completion. Each is an individual request to create a Message.

custom\_id: str

Developer-provided ID created for each request in a Message Batch. Useful for matching results to requests, as results may be given out of request order.

Must be unique for each request within the Message Batch.

maxLength64

minLength1

params: RequestParams

Messages API creation parameters for the individual request.

See the [Messages API reference](https://docs.claude.com/en/api/messages) for full documentation on available parameters.

max\_tokens: int

The maximum number of tokens to generate before stopping.

Note that our models may stop _before_ reaching this maximum. This parameter only specifies the absolute maximum number of tokens to generate.

Different models have different maximum values for this parameter. See [models](https://docs.claude.com/en/docs/models-overview) for details.

minimum1

messages: Iterable\[[MessageParam](https://platform.claude.com/docs/en/api/messages#message_param)\]

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

content: Union\[str, List\[Union\[[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param), [ImageBlockParam](https://platform.claude.com/docs/en/api/messages#image_block_param), [DocumentBlockParam](https://platform.claude.com/docs/en/api/messages#document_block_param), 8 more\]\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentUnionMember1 = List\[Union\[[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param), [ImageBlockParam](https://platform.claude.com/docs/en/api/messages#image_block_param), [DocumentBlockParam](https://platform.claude.com/docs/en/api/messages#document_block_param), 8 more\]\]

Accepts one of the following:

class TextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[CacheControlEphemeral\]

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

citations: Optional\[List\[[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)\]\]

Accepts one of the following:

class CitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class CitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class CitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class CitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class CitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class ImageBlockParam: …

source: Source

Accepts one of the following:

class Base64ImageSource: …

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

class URLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[CacheControlEphemeral\]

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

class DocumentBlockParam: …

source: Source

Accepts one of the following:

class Base64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class PlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

class ContentBlockSource: …

content: Union\[str, List\[[ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentContentBlockSourceContent = List\[[ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)\]

Accepts one of the following:

class TextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[CacheControlEphemeral\]

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

citations: Optional\[List\[[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)\]\]

Accepts one of the following:

class CitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class CitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class CitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class CitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class CitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class ImageBlockParam: …

source: Source

Accepts one of the following:

class Base64ImageSource: …

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

class URLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[CacheControlEphemeral\]

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

class URLPDFSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

type: Literal\["document"\]

Accepts one of the following:

"document"

cache\_control: Optional\[CacheControlEphemeral\]

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

citations: Optional\[CitationsConfigParam\]

enabled: Optional\[bool\]

context: Optional\[str\]

title: Optional\[str\]

class SearchResultBlockParam: …

content: List\[[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param)\]

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[CacheControlEphemeral\]

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

citations: Optional\[List\[[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)\]\]

Accepts one of the following:

class CitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class CitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class CitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class CitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class CitationSearchResultLocationParam: …

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

cache\_control: Optional\[CacheControlEphemeral\]

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

citations: Optional\[CitationsConfigParam\]

enabled: Optional\[bool\]

class ThinkingBlockParam: …

signature: str

thinking: str

type: Literal\["thinking"\]

Accepts one of the following:

"thinking"

class RedactedThinkingBlockParam: …

data: str

type: Literal\["redacted\_thinking"\]

Accepts one of the following:

"redacted\_thinking"

class ToolUseBlockParam: …

id: str

input: Dict\[str, object\]

name: str

type: Literal\["tool\_use"\]

Accepts one of the following:

"tool\_use"

cache\_control: Optional\[CacheControlEphemeral\]

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

class ToolResultBlockParam: …

tool\_use\_id: str

type: Literal\["tool\_result"\]

Accepts one of the following:

"tool\_result"

cache\_control: Optional\[CacheControlEphemeral\]

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

class TextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[CacheControlEphemeral\]

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

citations: Optional\[List\[[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)\]\]

Accepts one of the following:

class CitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class CitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class CitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class CitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class CitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class ImageBlockParam: …

source: Source

Accepts one of the following:

class Base64ImageSource: …

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

class URLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[CacheControlEphemeral\]

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

class SearchResultBlockParam: …

content: List\[[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param)\]

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[CacheControlEphemeral\]

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

citations: Optional\[List\[[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)\]\]

Accepts one of the following:

class CitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class CitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class CitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class CitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class CitationSearchResultLocationParam: …

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

cache\_control: Optional\[CacheControlEphemeral\]

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

citations: Optional\[CitationsConfigParam\]

enabled: Optional\[bool\]

class DocumentBlockParam: …

source: Source

Accepts one of the following:

class Base64PDFSource: …

data: str

media\_type: Literal\["application/pdf"\]

Accepts one of the following:

"application/pdf"

type: Literal\["base64"\]

Accepts one of the following:

"base64"

class PlainTextSource: …

data: str

media\_type: Literal\["text/plain"\]

Accepts one of the following:

"text/plain"

type: Literal\["text"\]

Accepts one of the following:

"text"

class ContentBlockSource: …

content: Union\[str, List\[[ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)\]\]

Accepts one of the following:

ContentUnionMember0 = str

ContentContentBlockSourceContent = List\[[ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)\]

Accepts one of the following:

class TextBlockParam: …

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[CacheControlEphemeral\]

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

citations: Optional\[List\[[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)\]\]

Accepts one of the following:

class CitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class CitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class CitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class CitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class CitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

class ImageBlockParam: …

source: Source

Accepts one of the following:

class Base64ImageSource: …

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

class URLImageSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

type: Literal\["image"\]

Accepts one of the following:

"image"

cache\_control: Optional\[CacheControlEphemeral\]

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

class URLPDFSource: …

type: Literal\["url"\]

Accepts one of the following:

"url"

url: str

type: Literal\["document"\]

Accepts one of the following:

"document"

cache\_control: Optional\[CacheControlEphemeral\]

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

citations: Optional\[CitationsConfigParam\]

enabled: Optional\[bool\]

context: Optional\[str\]

title: Optional\[str\]

is\_error: Optional\[bool\]

class ServerToolUseBlockParam: …

id: str

input: Dict\[str, object\]

name: Literal\["web\_search"\]

Accepts one of the following:

"web\_search"

type: Literal\["server\_tool\_use"\]

Accepts one of the following:

"server\_tool\_use"

cache\_control: Optional\[CacheControlEphemeral\]

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

class WebSearchToolResultBlockParam: …

content: [WebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_param_content)

Accepts one of the following:

WebSearchToolResultBlockItem = List\[[WebSearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#web_search_result_block_param)\]

encrypted\_content: str

title: str

type: Literal\["web\_search\_result"\]

Accepts one of the following:

"web\_search\_result"

url: str

page\_age: Optional\[str\]

class WebSearchToolRequestError: …

error\_code: Literal\["invalid\_tool\_input", "unavailable", "max\_uses\_exceeded", 2 more\]

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

cache\_control: Optional\[CacheControlEphemeral\]

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

model: [ModelParam](https://platform.claude.com/docs/en/api/messages#model)

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

metadata: Optional\[[MetadataParam](https://platform.claude.com/docs/en/api/messages#metadata)\]

An object describing metadata about the request.

user\_id: Optional\[str\]

An external identifier for the user who is associated with the request.

This should be a uuid, hash value, or other opaque identifier. Anthropic may use this id to help detect abuse. Do not include any identifying information such as name, email address, or phone number.

maxLength256

service\_tier: Optional\[Literal\["auto", "standard\_only"\]\]

Determines whether to use priority capacity (if available) or standard capacity for this request.

Anthropic offers different levels of service for your API requests. See [service-tiers](https://docs.claude.com/en/api/service-tiers) for details.

Accepts one of the following:

"auto"

"standard\_only"

stop\_sequences: Optional\[SequenceNotStr\[str\]\]

Custom text sequences that will cause the model to stop generating.

Our models will normally stop when they have naturally completed their turn, which will result in a response `stop_reason` of `"end_turn"`.

If you want the model to stop generating when it encounters custom strings of text, you can use the `stop_sequences` parameter. If the model encounters one of the custom sequences, the response `stop_reason` value will be `"stop_sequence"` and the response `stop_sequence` value will contain the matched stop sequence.

stream: Optional\[bool\]

Whether to incrementally stream the response using server-sent events.

See [streaming](https://docs.claude.com/en/api/messages-streaming) for details.

system: Optional\[Union\[str, Iterable\[[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param)\]\]\]

System prompt.

A system prompt is a way of providing context and instructions to Claude, such as specifying a particular goal or role. See our [guide to system prompts](https://docs.claude.com/en/docs/system-prompts).

Accepts one of the following:

RequestParamsSystemUnionMember0 = str

RequestParamsSystemUnionMember1 = Iterable\[[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param)\]

text: str

type: Literal\["text"\]

Accepts one of the following:

"text"

cache\_control: Optional\[CacheControlEphemeral\]

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

citations: Optional\[List\[[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)\]\]

Accepts one of the following:

class CitationCharLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_char\_index: int

start\_char\_index: int

type: Literal\["char\_location"\]

Accepts one of the following:

"char\_location"

class CitationPageLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_page\_number: int

start\_page\_number: int

type: Literal\["page\_location"\]

Accepts one of the following:

"page\_location"

class CitationContentBlockLocationParam: …

cited\_text: str

document\_index: int

document\_title: Optional\[str\]

end\_block\_index: int

start\_block\_index: int

type: Literal\["content\_block\_location"\]

Accepts one of the following:

"content\_block\_location"

class CitationWebSearchResultLocationParam: …

cited\_text: str

encrypted\_index: str

title: Optional\[str\]

type: Literal\["web\_search\_result\_location"\]

Accepts one of the following:

"web\_search\_result\_location"

url: str

class CitationSearchResultLocationParam: …

cited\_text: str

end\_block\_index: int

search\_result\_index: int

source: str

start\_block\_index: int

title: Optional\[str\]

type: Literal\["search\_result\_location"\]

Accepts one of the following:

"search\_result\_location"

temperature: Optional\[float\]

Amount of randomness injected into the response.

Defaults to `1.0`. Ranges from `0.0` to `1.0`. Use `temperature` closer to `0.0` for analytical / multiple choice, and closer to `1.0` for creative and generative tasks.

Note that even with `temperature` of `0.0`, the results will not be fully deterministic.

maximum1

minimum0

thinking: Optional\[[ThinkingConfigParam](https://platform.claude.com/docs/en/api/messages#thinking_config_param)\]

Configuration for enabling Claude's extended thinking.

When enabled, responses include `thinking` content blocks showing Claude's thinking process before the final answer. Requires a minimum budget of 1,024 tokens and counts towards your `max_tokens` limit.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

Accepts one of the following:

class ThinkingConfigEnabled: …

budget\_tokens: int

Determines how many tokens Claude can use for its internal reasoning process. Larger budgets can enable more thorough analysis for complex problems, improving response quality.

Must be ≥1024 and less than `max_tokens`.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

minimum1024

type: Literal\["enabled"\]

Accepts one of the following:

"enabled"

class ThinkingConfigDisabled: …

type: Literal\["disabled"\]

Accepts one of the following:

"disabled"

tool\_choice: Optional\[[ToolChoiceParam](https://platform.claude.com/docs/en/api/messages#tool_choice)\]

How the model should use the provided tools. The model can use a specific tool, any available tool, decide by itself, or not use tools at all.

Accepts one of the following:

class ToolChoiceAuto: …

The model will automatically decide whether to use tools.

type: Literal\["auto"\]

Accepts one of the following:

"auto"

disable\_parallel\_tool\_use: Optional\[bool\]

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output at most one tool use.

class ToolChoiceAny: …

The model will use any available tools.

type: Literal\["any"\]

Accepts one of the following:

"any"

disable\_parallel\_tool\_use: Optional\[bool\]

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

class ToolChoiceTool: …

The model will use the specified tool with `tool_choice.name`.

name: str

The name of the tool to use.

type: Literal\["tool"\]

Accepts one of the following:

"tool"

disable\_parallel\_tool\_use: Optional\[bool\]

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

class ToolChoiceNone: …

The model will not be allowed to use tools.

type: Literal\["none"\]

Accepts one of the following:

"none"

tools: Optional\[Iterable\[[ToolUnionParam](https://platform.claude.com/docs/en/api/messages#tool_union)\]\]

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

class Tool: …

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

cache\_control: Optional\[CacheControlEphemeral\]

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

description: Optional\[str\]

Description of what this tool does.

Tool descriptions should be as detailed as possible. The more information that the model has about what the tool is and how to use it, the better it will perform. You can use natural language descriptions to reinforce important aspects of the tool input JSON schema.

type: Optional\[Literal\["custom"\]\]

Accepts one of the following:

"custom"

class ToolBash20250124: …

name: Literal\["bash"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: Literal\["bash\_20250124"\]

Accepts one of the following:

"bash\_20250124"

cache\_control: Optional\[CacheControlEphemeral\]

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

class ToolTextEditor20250124: …

name: Literal\["str\_replace\_editor"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: Literal\["text\_editor\_20250124"\]

Accepts one of the following:

"text\_editor\_20250124"

cache\_control: Optional\[CacheControlEphemeral\]

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

class ToolTextEditor20250429: …

name: Literal\["str\_replace\_based\_edit\_tool"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: Literal\["text\_editor\_20250429"\]

Accepts one of the following:

"text\_editor\_20250429"

cache\_control: Optional\[CacheControlEphemeral\]

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

class ToolTextEditor20250728: …

name: Literal\["str\_replace\_based\_edit\_tool"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: Literal\["text\_editor\_20250728"\]

Accepts one of the following:

"text\_editor\_20250728"

cache\_control: Optional\[CacheControlEphemeral\]

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

max\_characters: Optional\[int\]

Maximum number of characters to display when viewing a file. If not specified, defaults to displaying the full file.

minimum1

class WebSearchTool20250305: …

name: Literal\["web\_search"\]

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_search"

type: Literal\["web\_search\_20250305"\]

Accepts one of the following:

"web\_search\_20250305"

allowed\_domains: Optional\[List\[str\]\]

If provided, only these domains will be included in results. Cannot be used alongside `blocked_domains`.

blocked\_domains: Optional\[List\[str\]\]

If provided, these domains will never appear in results. Cannot be used alongside `allowed_domains`.

cache\_control: Optional\[CacheControlEphemeral\]

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

max\_uses: Optional\[int\]

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

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

top\_k: Optional\[int\]

Only sample from the top K options for each subsequent token.

Used to remove "long tail" low probability responses. [Learn more technical details here](https://towardsdatascience.com/how-to-sample-from-language-models-682bceb97277).

Recommended for advanced use cases only. You usually only need to use `temperature`.

minimum0

top\_p: Optional\[float\]

Use nucleus sampling.

In nucleus sampling, we compute the cumulative distribution over all the options for each subsequent token in decreasing probability order and cut it off once it reaches a particular probability specified by `top_p`. You should either alter `temperature` or `top_p`, but not both.

Recommended for advanced use cases only. You usually only need to use `temperature`.

maximum1

minimum0

##### ReturnsExpand Collapse

class MessageBatch: …

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

request\_counts: [MessageBatchRequestCounts](https://platform.claude.com/docs/en/api/messages#message_batch_request_counts)

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

Create a Message Batch

Python

```
import os
from anthropic import Anthropic

client = Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),  # This is the default and can be omitted
)
message_batch = client.messages.batches.create(
    requests=[{\
        "custom_id": "my-custom-id-1",\
        "params": {\
            "max_tokens": 1024,\
            "messages": [{\
                "content": "Hello, world",\
                "role": "user",\
            }],\
            "model": "claude-sonnet-4-5-20250929",\
        },\
    }],
)
print(message_batch.id)
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