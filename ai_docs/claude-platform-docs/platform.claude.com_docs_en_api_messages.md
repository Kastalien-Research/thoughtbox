---
url: "https://platform.claude.com/docs/en/api/messages"
title: "Messages - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Fmessages)

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

Messages

Copy page

cURL

# Messages

##### [Create a Message](https://platform.claude.com/docs/en/api/messages/create)

post/v1/messages

##### [Count tokens in a Message](https://platform.claude.com/docs/en/api/messages/count_tokens)

post/v1/messages/count\_tokens

##### ModelsExpand Collapse

Base64ImageSource = object {data, media\_type, type}

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

Base64PDFSource = object {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

CacheControlEphemeral = object {type, ttl}

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

CacheCreation = object {ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens}

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsConfigParam = object {enabled}

enabled: optional boolean

CitationsDelta = object {citation, type}

citation: [CitationCharLocation](https://platform.claude.com/docs/en/api/messages#citation_char_location) { cited\_text, document\_index, document\_title, 4 more } or[CitationPageLocation](https://platform.claude.com/docs/en/api/messages#citation_page_location) { cited\_text, document\_index, document\_title, 4 more } or[CitationContentBlockLocation](https://platform.claude.com/docs/en/api/messages#citation_content_block_location) { cited\_text, document\_index, document\_title, 4 more } or2 more

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

type: "citations\_delta"

Accepts one of the following:

"citations\_delta"

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

ContentBlock = [TextBlock](https://platform.claude.com/docs/en/api/messages#text_block) { citations, text, type } or[ThinkingBlock](https://platform.claude.com/docs/en/api/messages#thinking_block) { signature, thinking, type } or[RedactedThinkingBlock](https://platform.claude.com/docs/en/api/messages#redacted_thinking_block) { data, type } or3 more

Accepts one of the following:

TextBlock = object {citations, text, type}

citations: array of [TextCitation](https://platform.claude.com/docs/en/api/messages#text_citation)

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

ThinkingBlock = object {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlock = object {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

ServerToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

WebSearchToolResultBlock = object {content, tool\_use\_id, type}

content: [WebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_content)

Accepts one of the following:

WebSearchToolResultError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = array of [WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) { encrypted\_content, page\_age, title, 2 more }

encrypted\_content: string

page\_age: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

ContentBlockParam = [TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) { text, type, cache\_control, citations } or[ImageBlockParam](https://platform.claude.com/docs/en/api/messages#image_block_param) { source, type, cache\_control } or[DocumentBlockParam](https://platform.claude.com/docs/en/api/messages#document_block_param) { source, type, cache\_control, 3 more } or7 more

Regular text content.

Accepts one of the following:

TextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam = object {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) { data, media\_type, type } or[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) { type, url }

Accepts one of the following:

Base64ImageSource = object {data, media\_type, type}

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

DocumentBlockParam = object {source, type, cache\_control, 3 more}

source: [Base64PDFSource](https://platform.claude.com/docs/en/api/messages#base64_pdf_source) { data, media\_type, type } or[PlainTextSource](https://platform.claude.com/docs/en/api/messages#plain_text_source) { data, media\_type, type } or[ContentBlockSource](https://platform.claude.com/docs/en/api/messages#content_block_source) { content, type } or[URLPDFSource](https://platform.claude.com/docs/en/api/messages#url_pdf_source) { type, url }

Accepts one of the following:

Base64PDFSource = object {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

PlainTextSource = object {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

ContentBlockSource = object {content, type}

content: stringorarray of [ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)

Accepts one of the following:

UnionMember0 = string

ContentBlockSourceContent = array of [ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)

Accepts one of the following:

TextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam = object {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) { data, media\_type, type } or[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) { type, url }

Accepts one of the following:

Base64ImageSource = object {data, media\_type, type}

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

URLPDFSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "document"

Accepts one of the following:

"document"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) { enabled }

enabled: optional boolean

context: optional string

title: optional string

SearchResultBlockParam = object {content, source, title, 3 more}

content: array of [TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) { text, type, cache\_control, citations }

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

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

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) { enabled }

enabled: optional boolean

ThinkingBlockParam = object {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlockParam = object {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlockParam = object {id, input, name, 2 more}

id: string

input: map\[unknown\]

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

ToolResultBlockParam = object {tool\_use\_id, type, cache\_control, 2 more}

tool\_use\_id: string

type: "tool\_result"

Accepts one of the following:

"tool\_result"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

content: optional stringorarray of [TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) { text, type, cache\_control, citations } or[ImageBlockParam](https://platform.claude.com/docs/en/api/messages#image_block_param) { source, type, cache\_control } or[SearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#search_result_block_param) { content, source, title, 3 more } or[DocumentBlockParam](https://platform.claude.com/docs/en/api/messages#document_block_param) { source, type, cache\_control, 3 more }

Accepts one of the following:

UnionMember0 = string

UnionMember1 = array of [TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) { text, type, cache\_control, citations } or[ImageBlockParam](https://platform.claude.com/docs/en/api/messages#image_block_param) { source, type, cache\_control } or[SearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#search_result_block_param) { content, source, title, 3 more } or[DocumentBlockParam](https://platform.claude.com/docs/en/api/messages#document_block_param) { source, type, cache\_control, 3 more }

Accepts one of the following:

TextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam = object {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) { data, media\_type, type } or[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) { type, url }

Accepts one of the following:

Base64ImageSource = object {data, media\_type, type}

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

SearchResultBlockParam = object {content, source, title, 3 more}

content: array of [TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) { text, type, cache\_control, citations }

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

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

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) { enabled }

enabled: optional boolean

DocumentBlockParam = object {source, type, cache\_control, 3 more}

source: [Base64PDFSource](https://platform.claude.com/docs/en/api/messages#base64_pdf_source) { data, media\_type, type } or[PlainTextSource](https://platform.claude.com/docs/en/api/messages#plain_text_source) { data, media\_type, type } or[ContentBlockSource](https://platform.claude.com/docs/en/api/messages#content_block_source) { content, type } or[URLPDFSource](https://platform.claude.com/docs/en/api/messages#url_pdf_source) { type, url }

Accepts one of the following:

Base64PDFSource = object {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

PlainTextSource = object {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

ContentBlockSource = object {content, type}

content: stringorarray of [ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)

Accepts one of the following:

UnionMember0 = string

ContentBlockSourceContent = array of [ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)

Accepts one of the following:

TextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam = object {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) { data, media\_type, type } or[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) { type, url }

Accepts one of the following:

Base64ImageSource = object {data, media\_type, type}

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

URLPDFSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "document"

Accepts one of the following:

"document"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) { enabled }

enabled: optional boolean

context: optional string

title: optional string

is\_error: optional boolean

ServerToolUseBlockParam = object {id, input, name, 2 more}

id: string

input: map\[unknown\]

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

WebSearchToolResultBlockParam = object {content, tool\_use\_id, type, cache\_control}

content: [WebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_param_content)

Accepts one of the following:

WebSearchToolResultBlockItem = array of [WebSearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#web_search_result_block_param) { encrypted\_content, title, type, 2 more }

encrypted\_content: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

page\_age: optional string

WebSearchToolRequestError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

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

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

ContentBlockSource = object {content, type}

content: stringorarray of [ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)

Accepts one of the following:

UnionMember0 = string

ContentBlockSourceContent = array of [ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)

Accepts one of the following:

TextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam = object {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) { data, media\_type, type } or[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) { type, url }

Accepts one of the following:

Base64ImageSource = object {data, media\_type, type}

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

ContentBlockSourceContent = [TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) { text, type, cache\_control, citations } or[ImageBlockParam](https://platform.claude.com/docs/en/api/messages#image_block_param) { source, type, cache\_control }

Accepts one of the following:

TextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam = object {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) { data, media\_type, type } or[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) { type, url }

Accepts one of the following:

Base64ImageSource = object {data, media\_type, type}

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

DocumentBlockParam = object {source, type, cache\_control, 3 more}

source: [Base64PDFSource](https://platform.claude.com/docs/en/api/messages#base64_pdf_source) { data, media\_type, type } or[PlainTextSource](https://platform.claude.com/docs/en/api/messages#plain_text_source) { data, media\_type, type } or[ContentBlockSource](https://platform.claude.com/docs/en/api/messages#content_block_source) { content, type } or[URLPDFSource](https://platform.claude.com/docs/en/api/messages#url_pdf_source) { type, url }

Accepts one of the following:

Base64PDFSource = object {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

PlainTextSource = object {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

ContentBlockSource = object {content, type}

content: stringorarray of [ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)

Accepts one of the following:

UnionMember0 = string

ContentBlockSourceContent = array of [ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)

Accepts one of the following:

TextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam = object {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) { data, media\_type, type } or[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) { type, url }

Accepts one of the following:

Base64ImageSource = object {data, media\_type, type}

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

URLPDFSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "document"

Accepts one of the following:

"document"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) { enabled }

enabled: optional boolean

context: optional string

title: optional string

ImageBlockParam = object {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) { data, media\_type, type } or[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) { type, url }

Accepts one of the following:

Base64ImageSource = object {data, media\_type, type}

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

InputJSONDelta = object {partial\_json, type}

partial\_json: string

type: "input\_json\_delta"

Accepts one of the following:

"input\_json\_delta"

Message = object {id, content, model, 5 more}

id: string

Unique object identifier.

The format and length of IDs may change over time.

content: array of [ContentBlock](https://platform.claude.com/docs/en/api/messages#content_block)

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

TextBlock = object {citations, text, type}

citations: array of [TextCitation](https://platform.claude.com/docs/en/api/messages#text_citation)

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

ThinkingBlock = object {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlock = object {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

ServerToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

WebSearchToolResultBlock = object {content, tool\_use\_id, type}

content: [WebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_content)

Accepts one of the following:

WebSearchToolResultError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = array of [WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) { encrypted\_content, page\_age, title, 2 more }

encrypted\_content: string

page\_age: string

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

role: "assistant"

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: [StopReason](https://platform.claude.com/docs/en/api/messages#stop_reason)

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

stop\_sequence: string

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [Usage](https://platform.claude.com/docs/en/api/messages#usage) { cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more }

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [CacheCreation](https://platform.claude.com/docs/en/api/messages#cache_creation) { ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens }

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: number

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number

The number of input tokens read from the cache.

minimum0

input\_tokens: number

The number of input tokens which were used.

minimum0

output\_tokens: number

The number of output tokens which were used.

minimum0

server\_tool\_use: [ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage) { web\_search\_requests }

The number of server tool requests.

web\_search\_requests: number

The number of web search tool requests.

minimum0

service\_tier: "standard"or"priority"or"batch"

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

MessageCountTokensTool = [Tool](https://platform.claude.com/docs/en/api/messages#tool) { input\_schema, name, cache\_control, 2 more } or[ToolBash20250124](https://platform.claude.com/docs/en/api/messages#tool_bash_20250124) { name, type, cache\_control } or[ToolTextEditor20250124](https://platform.claude.com/docs/en/api/messages#tool_text_editor_20250124) { name, type, cache\_control } or3 more

Accepts one of the following:

Tool = object {input\_schema, name, cache\_control, 2 more}

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

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

description: optional string

Description of what this tool does.

Tool descriptions should be as detailed as possible. The more information that the model has about what the tool is and how to use it, the better it will perform. You can use natural language descriptions to reinforce important aspects of the tool input JSON schema.

type: optional "custom"

Accepts one of the following:

"custom"

ToolBash20250124 = object {name, type, cache\_control}

name: "bash"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: "bash\_20250124"

Accepts one of the following:

"bash\_20250124"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

ToolTextEditor20250124 = object {name, type, cache\_control}

name: "str\_replace\_editor"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: "text\_editor\_20250124"

Accepts one of the following:

"text\_editor\_20250124"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

ToolTextEditor20250429 = object {name, type, cache\_control}

name: "str\_replace\_based\_edit\_tool"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: "text\_editor\_20250429"

Accepts one of the following:

"text\_editor\_20250429"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

ToolTextEditor20250728 = object {name, type, cache\_control, max\_characters}

name: "str\_replace\_based\_edit\_tool"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: "text\_editor\_20250728"

Accepts one of the following:

"text\_editor\_20250728"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

max\_characters: optional number

Maximum number of characters to display when viewing a file. If not specified, defaults to displaying the full file.

minimum1

WebSearchTool20250305 = object {name, type, allowed\_domains, 4 more}

name: "web\_search"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_search"

type: "web\_search\_20250305"

Accepts one of the following:

"web\_search\_20250305"

allowed\_domains: optional array of string

If provided, only these domains will be included in results. Cannot be used alongside `blocked_domains`.

blocked\_domains: optional array of string

If provided, these domains will never appear in results. Cannot be used alongside `allowed_domains`.

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

max\_uses: optional number

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

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

MessageDeltaUsage = object {cache\_creation\_input\_tokens, cache\_read\_input\_tokens, input\_tokens, 2 more}

cache\_creation\_input\_tokens: number

The cumulative number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number

The cumulative number of input tokens read from the cache.

minimum0

input\_tokens: number

The cumulative number of input tokens which were used.

minimum0

output\_tokens: number

The cumulative number of output tokens which were used.

server\_tool\_use: [ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage) { web\_search\_requests }

The number of server tool requests.

web\_search\_requests: number

The number of web search tool requests.

minimum0

MessageParam = object {content, role}

content: stringorarray of [ContentBlockParam](https://platform.claude.com/docs/en/api/messages#content_block_param)

Accepts one of the following:

UnionMember0 = string

UnionMember1 = array of [ContentBlockParam](https://platform.claude.com/docs/en/api/messages#content_block_param)

Accepts one of the following:

TextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam = object {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) { data, media\_type, type } or[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) { type, url }

Accepts one of the following:

Base64ImageSource = object {data, media\_type, type}

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

DocumentBlockParam = object {source, type, cache\_control, 3 more}

source: [Base64PDFSource](https://platform.claude.com/docs/en/api/messages#base64_pdf_source) { data, media\_type, type } or[PlainTextSource](https://platform.claude.com/docs/en/api/messages#plain_text_source) { data, media\_type, type } or[ContentBlockSource](https://platform.claude.com/docs/en/api/messages#content_block_source) { content, type } or[URLPDFSource](https://platform.claude.com/docs/en/api/messages#url_pdf_source) { type, url }

Accepts one of the following:

Base64PDFSource = object {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

PlainTextSource = object {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

ContentBlockSource = object {content, type}

content: stringorarray of [ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)

Accepts one of the following:

UnionMember0 = string

ContentBlockSourceContent = array of [ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)

Accepts one of the following:

TextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam = object {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) { data, media\_type, type } or[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) { type, url }

Accepts one of the following:

Base64ImageSource = object {data, media\_type, type}

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

URLPDFSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "document"

Accepts one of the following:

"document"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) { enabled }

enabled: optional boolean

context: optional string

title: optional string

SearchResultBlockParam = object {content, source, title, 3 more}

content: array of [TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) { text, type, cache\_control, citations }

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

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

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) { enabled }

enabled: optional boolean

ThinkingBlockParam = object {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlockParam = object {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlockParam = object {id, input, name, 2 more}

id: string

input: map\[unknown\]

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

ToolResultBlockParam = object {tool\_use\_id, type, cache\_control, 2 more}

tool\_use\_id: string

type: "tool\_result"

Accepts one of the following:

"tool\_result"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

content: optional stringorarray of [TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) { text, type, cache\_control, citations } or[ImageBlockParam](https://platform.claude.com/docs/en/api/messages#image_block_param) { source, type, cache\_control } or[SearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#search_result_block_param) { content, source, title, 3 more } or[DocumentBlockParam](https://platform.claude.com/docs/en/api/messages#document_block_param) { source, type, cache\_control, 3 more }

Accepts one of the following:

UnionMember0 = string

UnionMember1 = array of [TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) { text, type, cache\_control, citations } or[ImageBlockParam](https://platform.claude.com/docs/en/api/messages#image_block_param) { source, type, cache\_control } or[SearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#search_result_block_param) { content, source, title, 3 more } or[DocumentBlockParam](https://platform.claude.com/docs/en/api/messages#document_block_param) { source, type, cache\_control, 3 more }

Accepts one of the following:

TextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam = object {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) { data, media\_type, type } or[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) { type, url }

Accepts one of the following:

Base64ImageSource = object {data, media\_type, type}

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

SearchResultBlockParam = object {content, source, title, 3 more}

content: array of [TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) { text, type, cache\_control, citations }

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

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

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) { enabled }

enabled: optional boolean

DocumentBlockParam = object {source, type, cache\_control, 3 more}

source: [Base64PDFSource](https://platform.claude.com/docs/en/api/messages#base64_pdf_source) { data, media\_type, type } or[PlainTextSource](https://platform.claude.com/docs/en/api/messages#plain_text_source) { data, media\_type, type } or[ContentBlockSource](https://platform.claude.com/docs/en/api/messages#content_block_source) { content, type } or[URLPDFSource](https://platform.claude.com/docs/en/api/messages#url_pdf_source) { type, url }

Accepts one of the following:

Base64PDFSource = object {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

PlainTextSource = object {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

ContentBlockSource = object {content, type}

content: stringorarray of [ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)

Accepts one of the following:

UnionMember0 = string

ContentBlockSourceContent = array of [ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)

Accepts one of the following:

TextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam = object {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) { data, media\_type, type } or[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) { type, url }

Accepts one of the following:

Base64ImageSource = object {data, media\_type, type}

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

URLPDFSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "document"

Accepts one of the following:

"document"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) { enabled }

enabled: optional boolean

context: optional string

title: optional string

is\_error: optional boolean

ServerToolUseBlockParam = object {id, input, name, 2 more}

id: string

input: map\[unknown\]

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

WebSearchToolResultBlockParam = object {content, tool\_use\_id, type, cache\_control}

content: [WebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_param_content)

Accepts one of the following:

WebSearchToolResultBlockItem = array of [WebSearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#web_search_result_block_param) { encrypted\_content, title, type, 2 more }

encrypted\_content: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

page\_age: optional string

WebSearchToolRequestError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

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

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

MessageTokensCount = object {input\_tokens}

input\_tokens: number

The total number of tokens across the provided list of messages, system prompt, and tools.

Metadata = object {user\_id}

user\_id: optional string

An external identifier for the user who is associated with the request.

This should be a uuid, hash value, or other opaque identifier. Anthropic may use this id to help detect abuse. Do not include any identifying information such as name, email address, or phone number.

maxLength256

Model = "claude-opus-4-5-20251101"or"claude-opus-4-5"or"claude-3-7-sonnet-latest"or17 moreorstring

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

PlainTextSource = object {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

RawContentBlockDelta = [TextDelta](https://platform.claude.com/docs/en/api/messages#text_delta) { text, type } or[InputJSONDelta](https://platform.claude.com/docs/en/api/messages#input_json_delta) { partial\_json, type } or[CitationsDelta](https://platform.claude.com/docs/en/api/messages#citations_delta) { citation, type } or2 more

Accepts one of the following:

TextDelta = object {text, type}

text: string

type: "text\_delta"

Accepts one of the following:

"text\_delta"

InputJSONDelta = object {partial\_json, type}

partial\_json: string

type: "input\_json\_delta"

Accepts one of the following:

"input\_json\_delta"

CitationsDelta = object {citation, type}

citation: [CitationCharLocation](https://platform.claude.com/docs/en/api/messages#citation_char_location) { cited\_text, document\_index, document\_title, 4 more } or[CitationPageLocation](https://platform.claude.com/docs/en/api/messages#citation_page_location) { cited\_text, document\_index, document\_title, 4 more } or[CitationContentBlockLocation](https://platform.claude.com/docs/en/api/messages#citation_content_block_location) { cited\_text, document\_index, document\_title, 4 more } or2 more

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

type: "citations\_delta"

Accepts one of the following:

"citations\_delta"

ThinkingDelta = object {thinking, type}

thinking: string

type: "thinking\_delta"

Accepts one of the following:

"thinking\_delta"

SignatureDelta = object {signature, type}

signature: string

type: "signature\_delta"

Accepts one of the following:

"signature\_delta"

RawContentBlockDeltaEvent = object {delta, index, type}

delta: [RawContentBlockDelta](https://platform.claude.com/docs/en/api/messages#raw_content_block_delta)

Accepts one of the following:

TextDelta = object {text, type}

text: string

type: "text\_delta"

Accepts one of the following:

"text\_delta"

InputJSONDelta = object {partial\_json, type}

partial\_json: string

type: "input\_json\_delta"

Accepts one of the following:

"input\_json\_delta"

CitationsDelta = object {citation, type}

citation: [CitationCharLocation](https://platform.claude.com/docs/en/api/messages#citation_char_location) { cited\_text, document\_index, document\_title, 4 more } or[CitationPageLocation](https://platform.claude.com/docs/en/api/messages#citation_page_location) { cited\_text, document\_index, document\_title, 4 more } or[CitationContentBlockLocation](https://platform.claude.com/docs/en/api/messages#citation_content_block_location) { cited\_text, document\_index, document\_title, 4 more } or2 more

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

type: "citations\_delta"

Accepts one of the following:

"citations\_delta"

ThinkingDelta = object {thinking, type}

thinking: string

type: "thinking\_delta"

Accepts one of the following:

"thinking\_delta"

SignatureDelta = object {signature, type}

signature: string

type: "signature\_delta"

Accepts one of the following:

"signature\_delta"

index: number

type: "content\_block\_delta"

Accepts one of the following:

"content\_block\_delta"

RawContentBlockStartEvent = object {content\_block, index, type}

content\_block: [TextBlock](https://platform.claude.com/docs/en/api/messages#text_block) { citations, text, type } or[ThinkingBlock](https://platform.claude.com/docs/en/api/messages#thinking_block) { signature, thinking, type } or[RedactedThinkingBlock](https://platform.claude.com/docs/en/api/messages#redacted_thinking_block) { data, type } or3 more

Accepts one of the following:

TextBlock = object {citations, text, type}

citations: array of [TextCitation](https://platform.claude.com/docs/en/api/messages#text_citation)

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

ThinkingBlock = object {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlock = object {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

ServerToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

WebSearchToolResultBlock = object {content, tool\_use\_id, type}

content: [WebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_content)

Accepts one of the following:

WebSearchToolResultError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = array of [WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) { encrypted\_content, page\_age, title, 2 more }

encrypted\_content: string

page\_age: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

index: number

type: "content\_block\_start"

Accepts one of the following:

"content\_block\_start"

RawContentBlockStopEvent = object {index, type}

index: number

type: "content\_block\_stop"

Accepts one of the following:

"content\_block\_stop"

RawMessageDeltaEvent = object {delta, type, usage}

delta: object {stop\_reason, stop\_sequence}

stop\_reason: [StopReason](https://platform.claude.com/docs/en/api/messages#stop_reason)

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

stop\_sequence: string

type: "message\_delta"

Accepts one of the following:

"message\_delta"

usage: [MessageDeltaUsage](https://platform.claude.com/docs/en/api/messages#message_delta_usage) { cache\_creation\_input\_tokens, cache\_read\_input\_tokens, input\_tokens, 2 more }

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation\_input\_tokens: number

The cumulative number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number

The cumulative number of input tokens read from the cache.

minimum0

input\_tokens: number

The cumulative number of input tokens which were used.

minimum0

output\_tokens: number

The cumulative number of output tokens which were used.

server\_tool\_use: [ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage) { web\_search\_requests }

The number of server tool requests.

web\_search\_requests: number

The number of web search tool requests.

minimum0

RawMessageStartEvent = object {message, type}

message: [Message](https://platform.claude.com/docs/en/api/messages#message) { id, content, model, 5 more }

id: string

Unique object identifier.

The format and length of IDs may change over time.

content: array of [ContentBlock](https://platform.claude.com/docs/en/api/messages#content_block)

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

TextBlock = object {citations, text, type}

citations: array of [TextCitation](https://platform.claude.com/docs/en/api/messages#text_citation)

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

ThinkingBlock = object {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlock = object {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

ServerToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

WebSearchToolResultBlock = object {content, tool\_use\_id, type}

content: [WebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_content)

Accepts one of the following:

WebSearchToolResultError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = array of [WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) { encrypted\_content, page\_age, title, 2 more }

encrypted\_content: string

page\_age: string

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

role: "assistant"

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: [StopReason](https://platform.claude.com/docs/en/api/messages#stop_reason)

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

stop\_sequence: string

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [Usage](https://platform.claude.com/docs/en/api/messages#usage) { cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more }

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [CacheCreation](https://platform.claude.com/docs/en/api/messages#cache_creation) { ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens }

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: number

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number

The number of input tokens read from the cache.

minimum0

input\_tokens: number

The number of input tokens which were used.

minimum0

output\_tokens: number

The number of output tokens which were used.

minimum0

server\_tool\_use: [ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage) { web\_search\_requests }

The number of server tool requests.

web\_search\_requests: number

The number of web search tool requests.

minimum0

service\_tier: "standard"or"priority"or"batch"

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

type: "message\_start"

Accepts one of the following:

"message\_start"

RawMessageStopEvent = object {type}

type: "message\_stop"

Accepts one of the following:

"message\_stop"

RawMessageStreamEvent = [RawMessageStartEvent](https://platform.claude.com/docs/en/api/messages#raw_message_start_event) { message, type } or[RawMessageDeltaEvent](https://platform.claude.com/docs/en/api/messages#raw_message_delta_event) { delta, type, usage } or[RawMessageStopEvent](https://platform.claude.com/docs/en/api/messages#raw_message_stop_event) { type } or3 more

Accepts one of the following:

RawMessageStartEvent = object {message, type}

message: [Message](https://platform.claude.com/docs/en/api/messages#message) { id, content, model, 5 more }

id: string

Unique object identifier.

The format and length of IDs may change over time.

content: array of [ContentBlock](https://platform.claude.com/docs/en/api/messages#content_block)

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

TextBlock = object {citations, text, type}

citations: array of [TextCitation](https://platform.claude.com/docs/en/api/messages#text_citation)

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

ThinkingBlock = object {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlock = object {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

ServerToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

WebSearchToolResultBlock = object {content, tool\_use\_id, type}

content: [WebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_content)

Accepts one of the following:

WebSearchToolResultError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = array of [WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) { encrypted\_content, page\_age, title, 2 more }

encrypted\_content: string

page\_age: string

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

role: "assistant"

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: [StopReason](https://platform.claude.com/docs/en/api/messages#stop_reason)

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

stop\_sequence: string

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [Usage](https://platform.claude.com/docs/en/api/messages#usage) { cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more }

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [CacheCreation](https://platform.claude.com/docs/en/api/messages#cache_creation) { ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens }

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: number

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number

The number of input tokens read from the cache.

minimum0

input\_tokens: number

The number of input tokens which were used.

minimum0

output\_tokens: number

The number of output tokens which were used.

minimum0

server\_tool\_use: [ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage) { web\_search\_requests }

The number of server tool requests.

web\_search\_requests: number

The number of web search tool requests.

minimum0

service\_tier: "standard"or"priority"or"batch"

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

type: "message\_start"

Accepts one of the following:

"message\_start"

RawMessageDeltaEvent = object {delta, type, usage}

delta: object {stop\_reason, stop\_sequence}

stop\_reason: [StopReason](https://platform.claude.com/docs/en/api/messages#stop_reason)

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

stop\_sequence: string

type: "message\_delta"

Accepts one of the following:

"message\_delta"

usage: [MessageDeltaUsage](https://platform.claude.com/docs/en/api/messages#message_delta_usage) { cache\_creation\_input\_tokens, cache\_read\_input\_tokens, input\_tokens, 2 more }

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation\_input\_tokens: number

The cumulative number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number

The cumulative number of input tokens read from the cache.

minimum0

input\_tokens: number

The cumulative number of input tokens which were used.

minimum0

output\_tokens: number

The cumulative number of output tokens which were used.

server\_tool\_use: [ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage) { web\_search\_requests }

The number of server tool requests.

web\_search\_requests: number

The number of web search tool requests.

minimum0

RawMessageStopEvent = object {type}

type: "message\_stop"

Accepts one of the following:

"message\_stop"

RawContentBlockStartEvent = object {content\_block, index, type}

content\_block: [TextBlock](https://platform.claude.com/docs/en/api/messages#text_block) { citations, text, type } or[ThinkingBlock](https://platform.claude.com/docs/en/api/messages#thinking_block) { signature, thinking, type } or[RedactedThinkingBlock](https://platform.claude.com/docs/en/api/messages#redacted_thinking_block) { data, type } or3 more

Accepts one of the following:

TextBlock = object {citations, text, type}

citations: array of [TextCitation](https://platform.claude.com/docs/en/api/messages#text_citation)

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

ThinkingBlock = object {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlock = object {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

ServerToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

WebSearchToolResultBlock = object {content, tool\_use\_id, type}

content: [WebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_content)

Accepts one of the following:

WebSearchToolResultError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = array of [WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) { encrypted\_content, page\_age, title, 2 more }

encrypted\_content: string

page\_age: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

index: number

type: "content\_block\_start"

Accepts one of the following:

"content\_block\_start"

RawContentBlockDeltaEvent = object {delta, index, type}

delta: [RawContentBlockDelta](https://platform.claude.com/docs/en/api/messages#raw_content_block_delta)

Accepts one of the following:

TextDelta = object {text, type}

text: string

type: "text\_delta"

Accepts one of the following:

"text\_delta"

InputJSONDelta = object {partial\_json, type}

partial\_json: string

type: "input\_json\_delta"

Accepts one of the following:

"input\_json\_delta"

CitationsDelta = object {citation, type}

citation: [CitationCharLocation](https://platform.claude.com/docs/en/api/messages#citation_char_location) { cited\_text, document\_index, document\_title, 4 more } or[CitationPageLocation](https://platform.claude.com/docs/en/api/messages#citation_page_location) { cited\_text, document\_index, document\_title, 4 more } or[CitationContentBlockLocation](https://platform.claude.com/docs/en/api/messages#citation_content_block_location) { cited\_text, document\_index, document\_title, 4 more } or2 more

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

type: "citations\_delta"

Accepts one of the following:

"citations\_delta"

ThinkingDelta = object {thinking, type}

thinking: string

type: "thinking\_delta"

Accepts one of the following:

"thinking\_delta"

SignatureDelta = object {signature, type}

signature: string

type: "signature\_delta"

Accepts one of the following:

"signature\_delta"

index: number

type: "content\_block\_delta"

Accepts one of the following:

"content\_block\_delta"

RawContentBlockStopEvent = object {index, type}

index: number

type: "content\_block\_stop"

Accepts one of the following:

"content\_block\_stop"

RedactedThinkingBlock = object {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

RedactedThinkingBlockParam = object {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

SearchResultBlockParam = object {content, source, title, 3 more}

content: array of [TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) { text, type, cache\_control, citations }

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

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

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) { enabled }

enabled: optional boolean

ServerToolUsage = object {web\_search\_requests}

web\_search\_requests: number

The number of web search tool requests.

minimum0

ServerToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

ServerToolUseBlockParam = object {id, input, name, 2 more}

id: string

input: map\[unknown\]

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

SignatureDelta = object {signature, type}

signature: string

type: "signature\_delta"

Accepts one of the following:

"signature\_delta"

StopReason = "end\_turn"or"max\_tokens"or"stop\_sequence"or3 more

Accepts one of the following:

"end\_turn"

"max\_tokens"

"stop\_sequence"

"tool\_use"

"pause\_turn"

"refusal"

TextBlock = object {citations, text, type}

citations: array of [TextCitation](https://platform.claude.com/docs/en/api/messages#text_citation)

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

TextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

TextCitation = [CitationCharLocation](https://platform.claude.com/docs/en/api/messages#citation_char_location) { cited\_text, document\_index, document\_title, 4 more } or[CitationPageLocation](https://platform.claude.com/docs/en/api/messages#citation_page_location) { cited\_text, document\_index, document\_title, 4 more } or[CitationContentBlockLocation](https://platform.claude.com/docs/en/api/messages#citation_content_block_location) { cited\_text, document\_index, document\_title, 4 more } or2 more

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

TextCitationParam = [CitationCharLocationParam](https://platform.claude.com/docs/en/api/messages#citation_char_location_param) { cited\_text, document\_index, document\_title, 3 more } or[CitationPageLocationParam](https://platform.claude.com/docs/en/api/messages#citation_page_location_param) { cited\_text, document\_index, document\_title, 3 more } or[CitationContentBlockLocationParam](https://platform.claude.com/docs/en/api/messages#citation_content_block_location_param) { cited\_text, document\_index, document\_title, 3 more } or2 more

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

TextDelta = object {text, type}

text: string

type: "text\_delta"

Accepts one of the following:

"text\_delta"

ThinkingBlock = object {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

ThinkingBlockParam = object {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

ThinkingConfigDisabled = object {type}

type: "disabled"

Accepts one of the following:

"disabled"

ThinkingConfigEnabled = object {budget\_tokens, type}

budget\_tokens: number

Determines how many tokens Claude can use for its internal reasoning process. Larger budgets can enable more thorough analysis for complex problems, improving response quality.

Must be ≥1024 and less than `max_tokens`.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

minimum1024

type: "enabled"

Accepts one of the following:

"enabled"

ThinkingConfigParam = [ThinkingConfigEnabled](https://platform.claude.com/docs/en/api/messages#thinking_config_enabled) { budget\_tokens, type } or[ThinkingConfigDisabled](https://platform.claude.com/docs/en/api/messages#thinking_config_disabled) { type }

Configuration for enabling Claude's extended thinking.

When enabled, responses include `thinking` content blocks showing Claude's thinking process before the final answer. Requires a minimum budget of 1,024 tokens and counts towards your `max_tokens` limit.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

Accepts one of the following:

ThinkingConfigEnabled = object {budget\_tokens, type}

budget\_tokens: number

Determines how many tokens Claude can use for its internal reasoning process. Larger budgets can enable more thorough analysis for complex problems, improving response quality.

Must be ≥1024 and less than `max_tokens`.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

minimum1024

type: "enabled"

Accepts one of the following:

"enabled"

ThinkingConfigDisabled = object {type}

type: "disabled"

Accepts one of the following:

"disabled"

ThinkingDelta = object {thinking, type}

thinking: string

type: "thinking\_delta"

Accepts one of the following:

"thinking\_delta"

Tool = object {input\_schema, name, cache\_control, 2 more}

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

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

description: optional string

Description of what this tool does.

Tool descriptions should be as detailed as possible. The more information that the model has about what the tool is and how to use it, the better it will perform. You can use natural language descriptions to reinforce important aspects of the tool input JSON schema.

type: optional "custom"

Accepts one of the following:

"custom"

ToolBash20250124 = object {name, type, cache\_control}

name: "bash"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: "bash\_20250124"

Accepts one of the following:

"bash\_20250124"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

ToolChoice = [ToolChoiceAuto](https://platform.claude.com/docs/en/api/messages#tool_choice_auto) { type, disable\_parallel\_tool\_use } or[ToolChoiceAny](https://platform.claude.com/docs/en/api/messages#tool_choice_any) { type, disable\_parallel\_tool\_use } or[ToolChoiceTool](https://platform.claude.com/docs/en/api/messages#tool_choice_tool) { name, type, disable\_parallel\_tool\_use } or[ToolChoiceNone](https://platform.claude.com/docs/en/api/messages#tool_choice_none) { type }

How the model should use the provided tools. The model can use a specific tool, any available tool, decide by itself, or not use tools at all.

Accepts one of the following:

ToolChoiceAuto = object {type, disable\_parallel\_tool\_use}

The model will automatically decide whether to use tools.

type: "auto"

Accepts one of the following:

"auto"

disable\_parallel\_tool\_use: optional boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output at most one tool use.

ToolChoiceAny = object {type, disable\_parallel\_tool\_use}

The model will use any available tools.

type: "any"

Accepts one of the following:

"any"

disable\_parallel\_tool\_use: optional boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

ToolChoiceTool = object {name, type, disable\_parallel\_tool\_use}

The model will use the specified tool with `tool_choice.name`.

name: string

The name of the tool to use.

type: "tool"

Accepts one of the following:

"tool"

disable\_parallel\_tool\_use: optional boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

ToolChoiceNone = object {type}

The model will not be allowed to use tools.

type: "none"

Accepts one of the following:

"none"

ToolChoiceAny = object {type, disable\_parallel\_tool\_use}

The model will use any available tools.

type: "any"

Accepts one of the following:

"any"

disable\_parallel\_tool\_use: optional boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

ToolChoiceAuto = object {type, disable\_parallel\_tool\_use}

The model will automatically decide whether to use tools.

type: "auto"

Accepts one of the following:

"auto"

disable\_parallel\_tool\_use: optional boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output at most one tool use.

ToolChoiceNone = object {type}

The model will not be allowed to use tools.

type: "none"

Accepts one of the following:

"none"

ToolChoiceTool = object {name, type, disable\_parallel\_tool\_use}

The model will use the specified tool with `tool_choice.name`.

name: string

The name of the tool to use.

type: "tool"

Accepts one of the following:

"tool"

disable\_parallel\_tool\_use: optional boolean

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

ToolResultBlockParam = object {tool\_use\_id, type, cache\_control, 2 more}

tool\_use\_id: string

type: "tool\_result"

Accepts one of the following:

"tool\_result"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

content: optional stringorarray of [TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) { text, type, cache\_control, citations } or[ImageBlockParam](https://platform.claude.com/docs/en/api/messages#image_block_param) { source, type, cache\_control } or[SearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#search_result_block_param) { content, source, title, 3 more } or[DocumentBlockParam](https://platform.claude.com/docs/en/api/messages#document_block_param) { source, type, cache\_control, 3 more }

Accepts one of the following:

UnionMember0 = string

UnionMember1 = array of [TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) { text, type, cache\_control, citations } or[ImageBlockParam](https://platform.claude.com/docs/en/api/messages#image_block_param) { source, type, cache\_control } or[SearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#search_result_block_param) { content, source, title, 3 more } or[DocumentBlockParam](https://platform.claude.com/docs/en/api/messages#document_block_param) { source, type, cache\_control, 3 more }

Accepts one of the following:

TextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam = object {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) { data, media\_type, type } or[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) { type, url }

Accepts one of the following:

Base64ImageSource = object {data, media\_type, type}

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

SearchResultBlockParam = object {content, source, title, 3 more}

content: array of [TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param) { text, type, cache\_control, citations }

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

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

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) { enabled }

enabled: optional boolean

DocumentBlockParam = object {source, type, cache\_control, 3 more}

source: [Base64PDFSource](https://platform.claude.com/docs/en/api/messages#base64_pdf_source) { data, media\_type, type } or[PlainTextSource](https://platform.claude.com/docs/en/api/messages#plain_text_source) { data, media\_type, type } or[ContentBlockSource](https://platform.claude.com/docs/en/api/messages#content_block_source) { content, type } or[URLPDFSource](https://platform.claude.com/docs/en/api/messages#url_pdf_source) { type, url }

Accepts one of the following:

Base64PDFSource = object {data, media\_type, type}

data: string

media\_type: "application/pdf"

Accepts one of the following:

"application/pdf"

type: "base64"

Accepts one of the following:

"base64"

PlainTextSource = object {data, media\_type, type}

data: string

media\_type: "text/plain"

Accepts one of the following:

"text/plain"

type: "text"

Accepts one of the following:

"text"

ContentBlockSource = object {content, type}

content: stringorarray of [ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)

Accepts one of the following:

UnionMember0 = string

ContentBlockSourceContent = array of [ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)

Accepts one of the following:

TextBlockParam = object {text, type, cache\_control, citations}

text: string

type: "text"

Accepts one of the following:

"text"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional array of [TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)

Accepts one of the following:

CitationCharLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocationParam = object {cited\_text, document\_index, document\_title, 3 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationWebSearchResultLocationParam = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationSearchResultLocationParam = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

ImageBlockParam = object {source, type, cache\_control}

source: [Base64ImageSource](https://platform.claude.com/docs/en/api/messages#base64_image_source) { data, media\_type, type } or[URLImageSource](https://platform.claude.com/docs/en/api/messages#url_image_source) { type, url }

Accepts one of the following:

Base64ImageSource = object {data, media\_type, type}

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "image"

Accepts one of the following:

"image"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

URLPDFSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

type: "document"

Accepts one of the following:

"document"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

citations: optional [CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param) { enabled }

enabled: optional boolean

context: optional string

title: optional string

is\_error: optional boolean

ToolTextEditor20250124 = object {name, type, cache\_control}

name: "str\_replace\_editor"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: "text\_editor\_20250124"

Accepts one of the following:

"text\_editor\_20250124"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

ToolTextEditor20250429 = object {name, type, cache\_control}

name: "str\_replace\_based\_edit\_tool"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: "text\_editor\_20250429"

Accepts one of the following:

"text\_editor\_20250429"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

ToolTextEditor20250728 = object {name, type, cache\_control, max\_characters}

name: "str\_replace\_based\_edit\_tool"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: "text\_editor\_20250728"

Accepts one of the following:

"text\_editor\_20250728"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

max\_characters: optional number

Maximum number of characters to display when viewing a file. If not specified, defaults to displaying the full file.

minimum1

ToolUnion = [Tool](https://platform.claude.com/docs/en/api/messages#tool) { input\_schema, name, cache\_control, 2 more } or[ToolBash20250124](https://platform.claude.com/docs/en/api/messages#tool_bash_20250124) { name, type, cache\_control } or[ToolTextEditor20250124](https://platform.claude.com/docs/en/api/messages#tool_text_editor_20250124) { name, type, cache\_control } or3 more

Accepts one of the following:

Tool = object {input\_schema, name, cache\_control, 2 more}

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

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

description: optional string

Description of what this tool does.

Tool descriptions should be as detailed as possible. The more information that the model has about what the tool is and how to use it, the better it will perform. You can use natural language descriptions to reinforce important aspects of the tool input JSON schema.

type: optional "custom"

Accepts one of the following:

"custom"

ToolBash20250124 = object {name, type, cache\_control}

name: "bash"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"bash"

type: "bash\_20250124"

Accepts one of the following:

"bash\_20250124"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

ToolTextEditor20250124 = object {name, type, cache\_control}

name: "str\_replace\_editor"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_editor"

type: "text\_editor\_20250124"

Accepts one of the following:

"text\_editor\_20250124"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

ToolTextEditor20250429 = object {name, type, cache\_control}

name: "str\_replace\_based\_edit\_tool"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: "text\_editor\_20250429"

Accepts one of the following:

"text\_editor\_20250429"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

ToolTextEditor20250728 = object {name, type, cache\_control, max\_characters}

name: "str\_replace\_based\_edit\_tool"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"str\_replace\_based\_edit\_tool"

type: "text\_editor\_20250728"

Accepts one of the following:

"text\_editor\_20250728"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

max\_characters: optional number

Maximum number of characters to display when viewing a file. If not specified, defaults to displaying the full file.

minimum1

WebSearchTool20250305 = object {name, type, allowed\_domains, 4 more}

name: "web\_search"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_search"

type: "web\_search\_20250305"

Accepts one of the following:

"web\_search\_20250305"

allowed\_domains: optional array of string

If provided, only these domains will be included in results. Cannot be used alongside `blocked_domains`.

blocked\_domains: optional array of string

If provided, these domains will never appear in results. Cannot be used alongside `allowed_domains`.

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

max\_uses: optional number

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

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

ToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

ToolUseBlockParam = object {id, input, name, 2 more}

id: string

input: map\[unknown\]

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

URLImageSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

URLPDFSource = object {type, url}

type: "url"

Accepts one of the following:

"url"

url: string

Usage = object {cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more}

cache\_creation: [CacheCreation](https://platform.claude.com/docs/en/api/messages#cache_creation) { ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens }

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: number

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number

The number of input tokens read from the cache.

minimum0

input\_tokens: number

The number of input tokens which were used.

minimum0

output\_tokens: number

The number of output tokens which were used.

minimum0

server\_tool\_use: [ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage) { web\_search\_requests }

The number of server tool requests.

web\_search\_requests: number

The number of web search tool requests.

minimum0

service\_tier: "standard"or"priority"or"batch"

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

WebSearchResultBlock = object {encrypted\_content, page\_age, title, 2 more}

encrypted\_content: string

page\_age: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

WebSearchResultBlockParam = object {encrypted\_content, title, type, 2 more}

encrypted\_content: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

page\_age: optional string

WebSearchTool20250305 = object {name, type, allowed\_domains, 4 more}

name: "web\_search"

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

"web\_search"

type: "web\_search\_20250305"

Accepts one of the following:

"web\_search\_20250305"

allowed\_domains: optional array of string

If provided, only these domains will be included in results. Cannot be used alongside `blocked_domains`.

blocked\_domains: optional array of string

If provided, these domains will never appear in results. Cannot be used alongside `allowed_domains`.

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

max\_uses: optional number

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

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

WebSearchToolRequestError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

WebSearchToolResultBlock = object {content, tool\_use\_id, type}

content: [WebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_content)

Accepts one of the following:

WebSearchToolResultError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = array of [WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) { encrypted\_content, page\_age, title, 2 more }

encrypted\_content: string

page\_age: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

tool\_use\_id: string

type: "web\_search\_tool\_result"

Accepts one of the following:

"web\_search\_tool\_result"

WebSearchToolResultBlockContent = [WebSearchToolResultError](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_error) { error\_code, type } orarray of [WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) { encrypted\_content, page\_age, title, 2 more }

Accepts one of the following:

WebSearchToolResultError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = array of [WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) { encrypted\_content, page\_age, title, 2 more }

encrypted\_content: string

page\_age: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

WebSearchToolResultBlockParam = object {content, tool\_use\_id, type, cache\_control}

content: [WebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_param_content)

Accepts one of the following:

WebSearchToolResultBlockItem = array of [WebSearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#web_search_result_block_param) { encrypted\_content, title, type, 2 more }

encrypted\_content: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

page\_age: optional string

WebSearchToolRequestError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

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

cache\_control: optional [CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral) { type, ttl }

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

WebSearchToolResultBlockParamContent = array of [WebSearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#web_search_result_block_param) { encrypted\_content, title, type, 2 more } or[WebSearchToolRequestError](https://platform.claude.com/docs/en/api/messages#web_search_tool_request_error) { error\_code, type }

Accepts one of the following:

WebSearchToolResultBlockItem = array of [WebSearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#web_search_result_block_param) { encrypted\_content, title, type, 2 more }

encrypted\_content: string

title: string

type: "web\_search\_result"

Accepts one of the following:

"web\_search\_result"

url: string

page\_age: optional string

WebSearchToolRequestError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

WebSearchToolResultError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

#### MessagesBatches

##### [Create a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/create)

post/v1/messages/batches

##### [Retrieve a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/retrieve)

get/v1/messages/batches/{message\_batch\_id}

##### [List Message Batches](https://platform.claude.com/docs/en/api/messages/batches/list)

get/v1/messages/batches

##### [Cancel a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/cancel)

post/v1/messages/batches/{message\_batch\_id}/cancel

##### [Delete a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/delete)

delete/v1/messages/batches/{message\_batch\_id}

##### [Retrieve Message Batch results](https://platform.claude.com/docs/en/api/messages/batches/results)

get/v1/messages/batches/{message\_batch\_id}/results

##### ModelsExpand Collapse

DeletedMessageBatch = object {id, type}

id: string

ID of the Message Batch.

type: "message\_batch\_deleted"

Deleted object type.

For Message Batches, this is always `"message_batch_deleted"`.

Accepts one of the following:

"message\_batch\_deleted"

MessageBatch = object {id, archived\_at, cancel\_initiated\_at, 7 more}

id: string

Unique object identifier.

The format and length of IDs may change over time.

archived\_at: string

RFC 3339 datetime string representing the time at which the Message Batch was archived and its results became unavailable.

formatdate-time

cancel\_initiated\_at: string

RFC 3339 datetime string representing the time at which cancellation was initiated for the Message Batch. Specified only if cancellation was initiated.

formatdate-time

created\_at: string

RFC 3339 datetime string representing the time at which the Message Batch was created.

formatdate-time

ended\_at: string

RFC 3339 datetime string representing the time at which processing for the Message Batch ended. Specified only once processing ends.

Processing ends when every request in a Message Batch has either succeeded, errored, canceled, or expired.

formatdate-time

expires\_at: string

RFC 3339 datetime string representing the time at which the Message Batch will expire and end processing, which is 24 hours after creation.

formatdate-time

processing\_status: "in\_progress"or"canceling"or"ended"

Processing status of the Message Batch.

Accepts one of the following:

"in\_progress"

"canceling"

"ended"

request\_counts: [MessageBatchRequestCounts](https://platform.claude.com/docs/en/api/messages#message_batch_request_counts) { canceled, errored, expired, 2 more }

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

results\_url: string

URL to a `.jsonl` file containing the results of the Message Batch requests. Specified only once processing ends.

Results in the file are not guaranteed to be in the same order as requests. Use the `custom_id` field to match results to requests.

type: "message\_batch"

Object type.

For Message Batches, this is always `"message_batch"`.

Accepts one of the following:

"message\_batch"

MessageBatchCanceledResult = object {type}

type: "canceled"

Accepts one of the following:

"canceled"

MessageBatchErroredResult = object {error, type}

error: [ErrorResponse](https://platform.claude.com/docs/en/api/$shared#error_response) { error, request\_id, type }

error: [ErrorObject](https://platform.claude.com/docs/en/api/$shared#error_object)

Accepts one of the following:

InvalidRequestError = object {message, type}

message: string

type: "invalid\_request\_error"

Accepts one of the following:

"invalid\_request\_error"

AuthenticationError = object {message, type}

message: string

type: "authentication\_error"

Accepts one of the following:

"authentication\_error"

BillingError = object {message, type}

message: string

type: "billing\_error"

Accepts one of the following:

"billing\_error"

PermissionError = object {message, type}

message: string

type: "permission\_error"

Accepts one of the following:

"permission\_error"

NotFoundError = object {message, type}

message: string

type: "not\_found\_error"

Accepts one of the following:

"not\_found\_error"

RateLimitError = object {message, type}

message: string

type: "rate\_limit\_error"

Accepts one of the following:

"rate\_limit\_error"

GatewayTimeoutError = object {message, type}

message: string

type: "timeout\_error"

Accepts one of the following:

"timeout\_error"

APIErrorObject = object {message, type}

message: string

type: "api\_error"

Accepts one of the following:

"api\_error"

OverloadedError = object {message, type}

message: string

type: "overloaded\_error"

Accepts one of the following:

"overloaded\_error"

request\_id: string

type: "error"

Accepts one of the following:

"error"

type: "errored"

Accepts one of the following:

"errored"

MessageBatchExpiredResult = object {type}

type: "expired"

Accepts one of the following:

"expired"

MessageBatchIndividualResponse = object {custom\_id, result}

This is a single line in the response `.jsonl` file and does not represent the response as a whole.

custom\_id: string

Developer-provided ID created for each request in a Message Batch. Useful for matching results to requests, as results may be given out of request order.

Must be unique for each request within the Message Batch.

result: [MessageBatchResult](https://platform.claude.com/docs/en/api/messages#message_batch_result)

Processing result for this request.

Contains a Message output if processing was successful, an error response if processing failed, or the reason why processing was not attempted, such as cancellation or expiration.

Accepts one of the following:

MessageBatchSucceededResult = object {message, type}

message: [Message](https://platform.claude.com/docs/en/api/messages#message) { id, content, model, 5 more }

id: string

Unique object identifier.

The format and length of IDs may change over time.

content: array of [ContentBlock](https://platform.claude.com/docs/en/api/messages#content_block)

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

TextBlock = object {citations, text, type}

citations: array of [TextCitation](https://platform.claude.com/docs/en/api/messages#text_citation)

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

ThinkingBlock = object {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlock = object {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

ServerToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

WebSearchToolResultBlock = object {content, tool\_use\_id, type}

content: [WebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_content)

Accepts one of the following:

WebSearchToolResultError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = array of [WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) { encrypted\_content, page\_age, title, 2 more }

encrypted\_content: string

page\_age: string

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

role: "assistant"

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: [StopReason](https://platform.claude.com/docs/en/api/messages#stop_reason)

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

stop\_sequence: string

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [Usage](https://platform.claude.com/docs/en/api/messages#usage) { cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more }

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [CacheCreation](https://platform.claude.com/docs/en/api/messages#cache_creation) { ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens }

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: number

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number

The number of input tokens read from the cache.

minimum0

input\_tokens: number

The number of input tokens which were used.

minimum0

output\_tokens: number

The number of output tokens which were used.

minimum0

server\_tool\_use: [ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage) { web\_search\_requests }

The number of server tool requests.

web\_search\_requests: number

The number of web search tool requests.

minimum0

service\_tier: "standard"or"priority"or"batch"

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

type: "succeeded"

Accepts one of the following:

"succeeded"

MessageBatchErroredResult = object {error, type}

error: [ErrorResponse](https://platform.claude.com/docs/en/api/$shared#error_response) { error, request\_id, type }

error: [ErrorObject](https://platform.claude.com/docs/en/api/$shared#error_object)

Accepts one of the following:

InvalidRequestError = object {message, type}

message: string

type: "invalid\_request\_error"

Accepts one of the following:

"invalid\_request\_error"

AuthenticationError = object {message, type}

message: string

type: "authentication\_error"

Accepts one of the following:

"authentication\_error"

BillingError = object {message, type}

message: string

type: "billing\_error"

Accepts one of the following:

"billing\_error"

PermissionError = object {message, type}

message: string

type: "permission\_error"

Accepts one of the following:

"permission\_error"

NotFoundError = object {message, type}

message: string

type: "not\_found\_error"

Accepts one of the following:

"not\_found\_error"

RateLimitError = object {message, type}

message: string

type: "rate\_limit\_error"

Accepts one of the following:

"rate\_limit\_error"

GatewayTimeoutError = object {message, type}

message: string

type: "timeout\_error"

Accepts one of the following:

"timeout\_error"

APIErrorObject = object {message, type}

message: string

type: "api\_error"

Accepts one of the following:

"api\_error"

OverloadedError = object {message, type}

message: string

type: "overloaded\_error"

Accepts one of the following:

"overloaded\_error"

request\_id: string

type: "error"

Accepts one of the following:

"error"

type: "errored"

Accepts one of the following:

"errored"

MessageBatchCanceledResult = object {type}

type: "canceled"

Accepts one of the following:

"canceled"

MessageBatchExpiredResult = object {type}

type: "expired"

Accepts one of the following:

"expired"

MessageBatchRequestCounts = object {canceled, errored, expired, 2 more}

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

MessageBatchResult = [MessageBatchSucceededResult](https://platform.claude.com/docs/en/api/messages#message_batch_succeeded_result) { message, type } or[MessageBatchErroredResult](https://platform.claude.com/docs/en/api/messages#message_batch_errored_result) { error, type } or[MessageBatchCanceledResult](https://platform.claude.com/docs/en/api/messages#message_batch_canceled_result) { type } or[MessageBatchExpiredResult](https://platform.claude.com/docs/en/api/messages#message_batch_expired_result) { type }

Processing result for this request.

Contains a Message output if processing was successful, an error response if processing failed, or the reason why processing was not attempted, such as cancellation or expiration.

Accepts one of the following:

MessageBatchSucceededResult = object {message, type}

message: [Message](https://platform.claude.com/docs/en/api/messages#message) { id, content, model, 5 more }

id: string

Unique object identifier.

The format and length of IDs may change over time.

content: array of [ContentBlock](https://platform.claude.com/docs/en/api/messages#content_block)

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

TextBlock = object {citations, text, type}

citations: array of [TextCitation](https://platform.claude.com/docs/en/api/messages#text_citation)

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

ThinkingBlock = object {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlock = object {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

ServerToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

WebSearchToolResultBlock = object {content, tool\_use\_id, type}

content: [WebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_content)

Accepts one of the following:

WebSearchToolResultError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = array of [WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) { encrypted\_content, page\_age, title, 2 more }

encrypted\_content: string

page\_age: string

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

role: "assistant"

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: [StopReason](https://platform.claude.com/docs/en/api/messages#stop_reason)

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

stop\_sequence: string

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [Usage](https://platform.claude.com/docs/en/api/messages#usage) { cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more }

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [CacheCreation](https://platform.claude.com/docs/en/api/messages#cache_creation) { ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens }

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: number

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number

The number of input tokens read from the cache.

minimum0

input\_tokens: number

The number of input tokens which were used.

minimum0

output\_tokens: number

The number of output tokens which were used.

minimum0

server\_tool\_use: [ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage) { web\_search\_requests }

The number of server tool requests.

web\_search\_requests: number

The number of web search tool requests.

minimum0

service\_tier: "standard"or"priority"or"batch"

If the request used the priority, standard, or batch tier.

Accepts one of the following:

"standard"

"priority"

"batch"

type: "succeeded"

Accepts one of the following:

"succeeded"

MessageBatchErroredResult = object {error, type}

error: [ErrorResponse](https://platform.claude.com/docs/en/api/$shared#error_response) { error, request\_id, type }

error: [ErrorObject](https://platform.claude.com/docs/en/api/$shared#error_object)

Accepts one of the following:

InvalidRequestError = object {message, type}

message: string

type: "invalid\_request\_error"

Accepts one of the following:

"invalid\_request\_error"

AuthenticationError = object {message, type}

message: string

type: "authentication\_error"

Accepts one of the following:

"authentication\_error"

BillingError = object {message, type}

message: string

type: "billing\_error"

Accepts one of the following:

"billing\_error"

PermissionError = object {message, type}

message: string

type: "permission\_error"

Accepts one of the following:

"permission\_error"

NotFoundError = object {message, type}

message: string

type: "not\_found\_error"

Accepts one of the following:

"not\_found\_error"

RateLimitError = object {message, type}

message: string

type: "rate\_limit\_error"

Accepts one of the following:

"rate\_limit\_error"

GatewayTimeoutError = object {message, type}

message: string

type: "timeout\_error"

Accepts one of the following:

"timeout\_error"

APIErrorObject = object {message, type}

message: string

type: "api\_error"

Accepts one of the following:

"api\_error"

OverloadedError = object {message, type}

message: string

type: "overloaded\_error"

Accepts one of the following:

"overloaded\_error"

request\_id: string

type: "error"

Accepts one of the following:

"error"

type: "errored"

Accepts one of the following:

"errored"

MessageBatchCanceledResult = object {type}

type: "canceled"

Accepts one of the following:

"canceled"

MessageBatchExpiredResult = object {type}

type: "expired"

Accepts one of the following:

"expired"

MessageBatchSucceededResult = object {message, type}

message: [Message](https://platform.claude.com/docs/en/api/messages#message) { id, content, model, 5 more }

id: string

Unique object identifier.

The format and length of IDs may change over time.

content: array of [ContentBlock](https://platform.claude.com/docs/en/api/messages#content_block)

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

TextBlock = object {citations, text, type}

citations: array of [TextCitation](https://platform.claude.com/docs/en/api/messages#text_citation)

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

CitationCharLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_char\_index: number

file\_id: string

start\_char\_index: number

type: "char\_location"

Accepts one of the following:

"char\_location"

CitationPageLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_page\_number: number

file\_id: string

start\_page\_number: number

type: "page\_location"

Accepts one of the following:

"page\_location"

CitationContentBlockLocation = object {cited\_text, document\_index, document\_title, 4 more}

cited\_text: string

document\_index: number

document\_title: string

end\_block\_index: number

file\_id: string

start\_block\_index: number

type: "content\_block\_location"

Accepts one of the following:

"content\_block\_location"

CitationsWebSearchResultLocation = object {cited\_text, encrypted\_index, title, 2 more}

cited\_text: string

encrypted\_index: string

title: string

type: "web\_search\_result\_location"

Accepts one of the following:

"web\_search\_result\_location"

url: string

CitationsSearchResultLocation = object {cited\_text, end\_block\_index, search\_result\_index, 4 more}

cited\_text: string

end\_block\_index: number

search\_result\_index: number

source: string

start\_block\_index: number

title: string

type: "search\_result\_location"

Accepts one of the following:

"search\_result\_location"

text: string

type: "text"

Accepts one of the following:

"text"

ThinkingBlock = object {signature, thinking, type}

signature: string

thinking: string

type: "thinking"

Accepts one of the following:

"thinking"

RedactedThinkingBlock = object {data, type}

data: string

type: "redacted\_thinking"

Accepts one of the following:

"redacted\_thinking"

ToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: string

type: "tool\_use"

Accepts one of the following:

"tool\_use"

ServerToolUseBlock = object {id, input, name, type}

id: string

input: map\[unknown\]

name: "web\_search"

Accepts one of the following:

"web\_search"

type: "server\_tool\_use"

Accepts one of the following:

"server\_tool\_use"

WebSearchToolResultBlock = object {content, tool\_use\_id, type}

content: [WebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_content)

Accepts one of the following:

WebSearchToolResultError = object {error\_code, type}

error\_code: "invalid\_tool\_input"or"unavailable"or"max\_uses\_exceeded"or2 more

Accepts one of the following:

"invalid\_tool\_input"

"unavailable"

"max\_uses\_exceeded"

"too\_many\_requests"

"query\_too\_long"

type: "web\_search\_tool\_result\_error"

Accepts one of the following:

"web\_search\_tool\_result\_error"

UnionMember1 = array of [WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block) { encrypted\_content, page\_age, title, 2 more }

encrypted\_content: string

page\_age: string

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

role: "assistant"

Conversational role of the generated message.

This will always be `"assistant"`.

Accepts one of the following:

"assistant"

stop\_reason: [StopReason](https://platform.claude.com/docs/en/api/messages#stop_reason)

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

stop\_sequence: string

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

type: "message"

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

"message"

usage: [Usage](https://platform.claude.com/docs/en/api/messages#usage) { cache\_creation, cache\_creation\_input\_tokens, cache\_read\_input\_tokens, 4 more }

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

cache\_creation: [CacheCreation](https://platform.claude.com/docs/en/api/messages#cache_creation) { ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens }

Breakdown of cached tokens by TTL

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

minimum0

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

minimum0

cache\_creation\_input\_tokens: number

The number of input tokens used to create the cache entry.

minimum0

cache\_read\_input\_tokens: number

The number of input tokens read from the cache.

minimum0

input\_tokens: number

The number of input tokens which were used.

minimum0

output\_tokens: number

The number of output tokens which were used.

minimum0

server\_tool\_use: [ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage) { web\_search\_requests }

The number of server tool requests.

web\_search\_requests: number

The number of web search tool requests.

minimum0

service\_tier: "standard"or"priority"or"batch"

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