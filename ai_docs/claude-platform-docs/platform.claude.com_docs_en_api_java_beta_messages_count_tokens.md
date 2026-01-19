---
url: "https://platform.claude.com/docs/en/api/java/beta/messages/count_tokens"
title: "Count tokens in a Message - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Fjava%2Fbeta%2Fmessages%2Fcount_tokens)

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

Java

# Count tokens in a Message

[BetaMessageTokensCount](https://platform.claude.com/docs/en/api/beta#beta_message_tokens_count)beta().messages().countTokens(MessageCountTokensParamsparams, RequestOptionsrequestOptions=RequestOptions.none())

post/v1/messages/count\_tokens

Count the number of tokens in a Message.

The Token Count API can be used to count the number of tokens in a Message, including tools, images, and documents, without creating it.

Learn more about token counting in our [user guide](https://docs.claude.com/en/docs/build-with-claude/token-counting)

##### ParametersExpand Collapse

MessageCountTokensParamsparams

Optional<List<AnthropicBeta>>betas

Optional header to specify the beta version(s) you want to use.

MESSAGE\_BATCHES\_2024\_09\_24("message-batches-2024-09-24")

PROMPT\_CACHING\_2024\_07\_31("prompt-caching-2024-07-31")

COMPUTER\_USE\_2024\_10\_22("computer-use-2024-10-22")

COMPUTER\_USE\_2025\_01\_24("computer-use-2025-01-24")

PDFS\_2024\_09\_25("pdfs-2024-09-25")

TOKEN\_COUNTING\_2024\_11\_01("token-counting-2024-11-01")

TOKEN\_EFFICIENT\_TOOLS\_2025\_02\_19("token-efficient-tools-2025-02-19")

OUTPUT\_128K\_2025\_02\_19("output-128k-2025-02-19")

FILES\_API\_2025\_04\_14("files-api-2025-04-14")

MCP\_CLIENT\_2025\_04\_04("mcp-client-2025-04-04")

MCP\_CLIENT\_2025\_11\_20("mcp-client-2025-11-20")

DEV\_FULL\_THINKING\_2025\_05\_14("dev-full-thinking-2025-05-14")

INTERLEAVED\_THINKING\_2025\_05\_14("interleaved-thinking-2025-05-14")

CODE\_EXECUTION\_2025\_05\_22("code-execution-2025-05-22")

EXTENDED\_CACHE\_TTL\_2025\_04\_11("extended-cache-ttl-2025-04-11")

CONTEXT\_1M\_2025\_08\_07("context-1m-2025-08-07")

CONTEXT\_MANAGEMENT\_2025\_06\_27("context-management-2025-06-27")

MODEL\_CONTEXT\_WINDOW\_EXCEEDED\_2025\_08\_26("model-context-window-exceeded-2025-08-26")

SKILLS\_2025\_10\_02("skills-2025-10-02")

List<[BetaMessageParam](https://platform.claude.com/docs/en/api/beta#beta_message_param)>messages

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

Modelmodel

The model that will complete your prompt.

See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options.

Optional<[BetaContextManagementConfig](https://platform.claude.com/docs/en/api/beta#beta_context_management_config)>contextManagement

Context management configuration.

This allows you to control how Claude manages context across multiple requests, such as whether to clear function results or not.

Optional<List<[BetaRequestMcpServerUrlDefinition](https://platform.claude.com/docs/en/api/beta#beta_request_mcp_server_url_definition)>>mcpServers

MCP servers to be utilized in this request

Stringname

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

Optional<String>authorizationToken

Optional<[BetaRequestMcpServerToolConfiguration](https://platform.claude.com/docs/en/api/beta#beta_request_mcp_server_tool_configuration)>toolConfiguration

Optional<List<String>>allowedTools

Optional<Boolean>enabled

Optional<[BetaOutputConfig](https://platform.claude.com/docs/en/api/beta#beta_output_config)>outputConfig

Configuration options for the model's output. Controls aspects like how much effort the model puts into its response.

Optional<[BetaJsonOutputFormat](https://platform.claude.com/docs/en/api/beta#beta_json_output_format)>outputFormat

A schema to specify Claude's output format in responses.

Optional<System>system

System prompt.

A system prompt is a way of providing context and instructions to Claude, such as specifying a particular goal or role. See our [guide to system prompts](https://docs.claude.com/en/docs/system-prompts).

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

Optional<[BetaThinkingConfigParam](https://platform.claude.com/docs/en/api/beta#beta_thinking_config_param)>thinking

Configuration for enabling Claude's extended thinking.

When enabled, responses include `thinking` content blocks showing Claude's thinking process before the final answer. Requires a minimum budget of 1,024 tokens and counts towards your `max_tokens` limit.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

Optional<[BetaToolChoice](https://platform.claude.com/docs/en/api/beta#beta_tool_choice)>toolChoice

How the model should use the provided tools. The model can use a specific tool, any available tool, decide by itself, or not use tools at all.

Optional<List<Tool>>tools

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

##### ReturnsExpand Collapse

classBetaMessageTokensCount:

Optional<[BetaCountTokensContextManagementResponse](https://platform.claude.com/docs/en/api/beta#beta_count_tokens_context_management_response)>contextManagement

Information about context management applied to the message.

longoriginalInputTokens

The original token count before context management was applied

longinputTokens

The total number of tokens across the provided list of messages, system prompt, and tools.

Count tokens in a Message

Java

```
package com.anthropic.example;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.beta.messages.BetaMessageTokensCount;
import com.anthropic.models.beta.messages.MessageCountTokensParams;
import com.anthropic.models.messages.Model;

public final class Main {
    private Main() {}

    public static void main(String[] args) {
        AnthropicClient client = AnthropicOkHttpClient.fromEnv();

        MessageCountTokensParams params = MessageCountTokensParams.builder()
            .addUserMessage("Hello, world")
            .model(Model.CLAUDE_OPUS_4_5_20251101)
            .build();
        BetaMessageTokensCount betaMessageTokensCount = client.beta().messages().countTokens(params);
    }
}
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