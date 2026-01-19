---
url: "https://platform.claude.com/docs/en/api/java/messages/create"
title: "Create a Message - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Fjava%2Fmessages%2Fcreate)

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

Java

# Create a Message

[Message](https://platform.claude.com/docs/en/api/messages#message)messages().create(MessageCreateParamsparams, RequestOptionsrequestOptions=RequestOptions.none())

post/v1/messages

Send a structured list of input messages with text and/or image content, and the model will generate the next message in the conversation.

The Messages API can be used for either single queries or stateless multi-turn conversations.

Learn more about the Messages API in our [user guide](https://docs.claude.com/en/docs/initial-setup)

##### ParametersExpand Collapse

MessageCreateParamsparams

longmaxTokens

The maximum number of tokens to generate before stopping.

Note that our models may stop _before_ reaching this maximum. This parameter only specifies the absolute maximum number of tokens to generate.

Different models have different maximum values for this parameter. See [models](https://docs.claude.com/en/docs/models-overview) for details.

minimum1

List<[MessageParam](https://platform.claude.com/docs/en/api/messages#message_param)>messages

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

Contentcontent

Accepts one of the following:

String

List<[ContentBlockParam](https://platform.claude.com/docs/en/api/messages#content_block_param)>

Accepts one of the following:

classTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Optional<List<[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)>>citations

Accepts one of the following:

classCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classImageBlockParam:

Sourcesource

Accepts one of the following:

classBase64ImageSource:

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

classUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

classDocumentBlockParam:

Sourcesource

Accepts one of the following:

classBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classContentBlockSource:

Contentcontent

Accepts one of the following:

String

List<[ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)>

Accepts one of the following:

classTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Optional<List<[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)>>citations

Accepts one of the following:

classCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classImageBlockParam:

Sourcesource

Accepts one of the following:

classBase64ImageSource:

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

classUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

classUrlPdfSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Optional<[CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param)>citations

Optional<Boolean>enabled

Optional<String>context

Optional<String>title

classSearchResultBlockParam:

List<[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param)>content

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Optional<List<[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)>>citations

Accepts one of the following:

classCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classCitationSearchResultLocationParam:

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

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Optional<[CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param)>citations

Optional<Boolean>enabled

classThinkingBlockParam:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classRedactedThinkingBlockParam:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classToolUseBlockParam:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

classToolResultBlockParam:

StringtoolUseId

JsonValue;type"tool\_result"constant"tool\_result"constant

Accepts one of the following:

TOOL\_RESULT("tool\_result")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

classTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Optional<List<[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)>>citations

Accepts one of the following:

classCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classImageBlockParam:

Sourcesource

Accepts one of the following:

classBase64ImageSource:

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

classUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

classSearchResultBlockParam:

List<[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param)>content

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Optional<List<[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)>>citations

Accepts one of the following:

classCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classCitationSearchResultLocationParam:

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

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Optional<[CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param)>citations

Optional<Boolean>enabled

classDocumentBlockParam:

Sourcesource

Accepts one of the following:

classBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classContentBlockSource:

Contentcontent

Accepts one of the following:

String

List<[ContentBlockSourceContent](https://platform.claude.com/docs/en/api/messages#content_block_source_content)>

Accepts one of the following:

classTextBlockParam:

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Optional<List<[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)>>citations

Accepts one of the following:

classCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

classImageBlockParam:

Sourcesource

Accepts one of the following:

classBase64ImageSource:

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

classUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

JsonValue;type"image"constant"image"constant

Accepts one of the following:

IMAGE("image")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

classUrlPdfSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

JsonValue;type"document"constant"document"constant

Accepts one of the following:

DOCUMENT("document")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Optional<[CitationsConfigParam](https://platform.claude.com/docs/en/api/messages#citations_config_param)>citations

Optional<Boolean>enabled

Optional<String>context

Optional<String>title

Optional<Boolean>isError

classServerToolUseBlockParam:

Stringid

Inputinput

JsonValue;name"web\_search"constant"web\_search"constant

Accepts one of the following:

WEB\_SEARCH("web\_search")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

classWebSearchToolResultBlockParam:

[WebSearchToolResultBlockParamContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_param_content)content

Accepts one of the following:

List<[WebSearchResultBlockParam](https://platform.claude.com/docs/en/api/messages#web_search_result_block_param)>

StringencryptedContent

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

Optional<String>pageAge

classWebSearchToolRequestError:

ErrorCodeerrorCode

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

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Modelmodel

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Optional<[Metadata](https://platform.claude.com/docs/en/api/messages#metadata)>metadata

An object describing metadata about the request.

Optional<ServiceTier>serviceTier

Determines whether to use priority capacity (if available) or standard capacity for this request.

Anthropic offers different levels of service for your API requests. See [service-tiers](https://docs.claude.com/en/api/service-tiers) for details.

AUTO("auto")

STANDARD\_ONLY("standard\_only")

Optional<List<String>>stopSequences

Custom text sequences that will cause the model to stop generating.

Our models will normally stop when they have naturally completed their turn, which will result in a response `stop_reason` of `"end_turn"`.

If you want the model to stop generating when it encounters custom strings of text, you can use the `stop_sequences` parameter. If the model encounters one of the custom sequences, the response `stop_reason` value will be `"stop_sequence"` and the response `stop_sequence` value will contain the matched stop sequence.

Optional<System>system

System prompt.

A system prompt is a way of providing context and instructions to Claude, such as specifying a particular goal or role. See our [guide to system prompts](https://docs.claude.com/en/docs/system-prompts).

String

List<[TextBlockParam](https://platform.claude.com/docs/en/api/messages#text_block_param)>

Stringtext

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Optional<List<[TextCitationParam](https://platform.claude.com/docs/en/api/messages#text_citation_param)>>citations

Accepts one of the following:

classCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classCitationSearchResultLocationParam:

StringcitedText

longendBlockIndex

longsearchResultIndex

Stringsource

longstartBlockIndex

Optional<String>title

JsonValue;type"search\_result\_location"constant"search\_result\_location"constant

Accepts one of the following:

SEARCH\_RESULT\_LOCATION("search\_result\_location")

Optional<Double>temperature

Amount of randomness injected into the response.

Defaults to `1.0`. Ranges from `0.0` to `1.0`. Use `temperature` closer to `0.0` for analytical / multiple choice, and closer to `1.0` for creative and generative tasks.

Note that even with `temperature` of `0.0`, the results will not be fully deterministic.

maximum1

minimum0

Optional<[ThinkingConfigParam](https://platform.claude.com/docs/en/api/messages#thinking_config_param)>thinking

Configuration for enabling Claude's extended thinking.

When enabled, responses include `thinking` content blocks showing Claude's thinking process before the final answer. Requires a minimum budget of 1,024 tokens and counts towards your `max_tokens` limit.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

Optional<[ToolChoice](https://platform.claude.com/docs/en/api/messages#tool_choice)>toolChoice

How the model should use the provided tools. The model can use a specific tool, any available tool, decide by itself, or not use tools at all.

Optional<List<[ToolUnion](https://platform.claude.com/docs/en/api/messages#tool_union)>>tools

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

classTool:

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

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Optional<String>description

Description of what this tool does.

Tool descriptions should be as detailed as possible. The more information that the model has about what the tool is and how to use it, the better it will perform. You can use natural language descriptions to reinforce important aspects of the tool input JSON schema.

Optional<Type>type

Accepts one of the following:

CUSTOM("custom")

classToolBash20250124:

JsonValue;name"bash"constant"bash"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

BASH("bash")

JsonValue;type"bash\_20250124"constant"bash\_20250124"constant

Accepts one of the following:

BASH\_20250124("bash\_20250124")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

classToolTextEditor20250124:

JsonValue;name"str\_replace\_editor"constant"str\_replace\_editor"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

STR\_REPLACE\_EDITOR("str\_replace\_editor")

JsonValue;type"text\_editor\_20250124"constant"text\_editor\_20250124"constant

Accepts one of the following:

TEXT\_EDITOR\_20250124("text\_editor\_20250124")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

classToolTextEditor20250429:

JsonValue;name"str\_replace\_based\_edit\_tool"constant"str\_replace\_based\_edit\_tool"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

STR\_REPLACE\_BASED\_EDIT\_TOOL("str\_replace\_based\_edit\_tool")

JsonValue;type"text\_editor\_20250429"constant"text\_editor\_20250429"constant

Accepts one of the following:

TEXT\_EDITOR\_20250429("text\_editor\_20250429")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

classToolTextEditor20250728:

JsonValue;name"str\_replace\_based\_edit\_tool"constant"str\_replace\_based\_edit\_tool"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

STR\_REPLACE\_BASED\_EDIT\_TOOL("str\_replace\_based\_edit\_tool")

JsonValue;type"text\_editor\_20250728"constant"text\_editor\_20250728"constant

Accepts one of the following:

TEXT\_EDITOR\_20250728("text\_editor\_20250728")

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Optional<Long>maxCharacters

Maximum number of characters to display when viewing a file. If not specified, defaults to displaying the full file.

minimum1

classWebSearchTool20250305:

JsonValue;name"web\_search"constant"web\_search"constant

Name of the tool.

This is how the tool will be called by the model and in `tool_use` blocks.

Accepts one of the following:

WEB\_SEARCH("web\_search")

JsonValue;type"web\_search\_20250305"constant"web\_search\_20250305"constant

Accepts one of the following:

WEB\_SEARCH\_20250305("web\_search\_20250305")

Optional<List<String>>allowedDomains

If provided, only these domains will be included in results. Cannot be used alongside `blocked_domains`.

Optional<List<String>>blockedDomains

If provided, these domains will never appear in results. Cannot be used alongside `allowed_domains`.

Optional<[CacheControlEphemeral](https://platform.claude.com/docs/en/api/messages#cache_control_ephemeral)>cacheControl

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

Optional<Long>maxUses

Maximum number of times the tool can be used in the API request.

exclusiveMinimum0

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

Optional<Long>topK

Only sample from the top K options for each subsequent token.

Used to remove "long tail" low probability responses. [Learn more technical details here](https://towardsdatascience.com/how-to-sample-from-language-models-682bceb97277).

Recommended for advanced use cases only. You usually only need to use `temperature`.

minimum0

Optional<Double>topP

Use nucleus sampling.

In nucleus sampling, we compute the cumulative distribution over all the options for each subsequent token in decreasing probability order and cut it off once it reaches a particular probability specified by `top_p`. You should either alter `temperature` or `top_p`, but not both.

Recommended for advanced use cases only. You usually only need to use `temperature`.

maximum1

minimum0

##### ReturnsExpand Collapse

classMessage:

Stringid

Unique object identifier.

The format and length of IDs may change over time.

List<[ContentBlock](https://platform.claude.com/docs/en/api/messages#content_block)>content

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

classTextBlock:

Optional<List<[TextCitation](https://platform.claude.com/docs/en/api/messages#text_citation)>>citations

Citations supporting the text block.

The type of citation returned will depend on the type of document being cited. Citing a PDF results in `page_location`, plain text results in `char_location`, and content document results in `content_block_location`.

Accepts one of the following:

classCitationCharLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

Optional<String>fileId

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

classCitationPageLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

Optional<String>fileId

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

classCitationContentBlockLocation:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

Optional<String>fileId

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

classCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classCitationsSearchResultLocation:

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

classThinkingBlock:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classRedactedThinkingBlock:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classToolUseBlock:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

classServerToolUseBlock:

Stringid

Inputinput

JsonValue;name"web\_search"constant"web\_search"constant

Accepts one of the following:

WEB\_SEARCH("web\_search")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

classWebSearchToolResultBlock:

[WebSearchToolResultBlockContent](https://platform.claude.com/docs/en/api/messages#web_search_tool_result_block_content)content

Accepts one of the following:

classWebSearchToolResultError:

ErrorCodeerrorCode

Accepts one of the following:

INVALID\_TOOL\_INPUT("invalid\_tool\_input")

UNAVAILABLE("unavailable")

MAX\_USES\_EXCEEDED("max\_uses\_exceeded")

TOO\_MANY\_REQUESTS("too\_many\_requests")

QUERY\_TOO\_LONG("query\_too\_long")

JsonValue;type"web\_search\_tool\_result\_error"constant"web\_search\_tool\_result\_error"constant

Accepts one of the following:

WEB\_SEARCH\_TOOL\_RESULT\_ERROR("web\_search\_tool\_result\_error")

List<[WebSearchResultBlock](https://platform.claude.com/docs/en/api/messages#web_search_result_block)>

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

Optional<[StopReason](https://platform.claude.com/docs/en/api/messages#stop_reason)>stopReason

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

Optional<String>stopSequence

Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

JsonValue;type"message"constant"message"constant

Object type.

For Messages, this is always `"message"`.

Accepts one of the following:

MESSAGE("message")

[Usage](https://platform.claude.com/docs/en/api/messages#usage)usage

Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in `usage` will not match one-to-one with the exact visible content of an API request or response.

For example, `output_tokens` will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.

Optional<[CacheCreation](https://platform.claude.com/docs/en/api/messages#cache_creation)>cacheCreation

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

Optional<[ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage)>serverToolUse

The number of server tool requests.

longwebSearchRequests

The number of web search tool requests.

minimum0

Optional<ServiceTier>serviceTier

If the request used the priority, standard, or batch tier.

Accepts one of the following:

STANDARD("standard")

PRIORITY("priority")

BATCH("batch")

Create a Message

Java

```
package com.anthropic.example;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.Model;

public final class Main {
    private Main() {}

    public static void main(String[] args) {
        AnthropicClient client = AnthropicOkHttpClient.fromEnv();

        MessageCreateParams params = MessageCreateParams.builder()
            .maxTokens(1024L)
            .addUserMessage("Hello, world")
            .model(Model.CLAUDE_OPUS_4_5_20251101)
            .build();
        Message message = client.messages().create(params);
    }
}
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