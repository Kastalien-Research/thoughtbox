---
url: "https://platform.claude.com/docs/en/api/java/messages"
title: "Messages - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Fjava%2Fmessages)

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

Java

# Messages

##### [Create a Message](https://platform.claude.com/docs/en/api/messages/create)

[Message](https://platform.claude.com/docs/en/api/messages#message)messages().create(MessageCreateParamsparams, RequestOptionsrequestOptions=RequestOptions.none())

post/v1/messages

##### [Count tokens in a Message](https://platform.claude.com/docs/en/api/messages/count_tokens)

[MessageTokensCount](https://platform.claude.com/docs/en/api/messages#message_tokens_count)messages().countTokens(MessageCountTokensParamsparams, RequestOptionsrequestOptions=RequestOptions.none())

post/v1/messages/count\_tokens

##### ModelsExpand Collapse

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

classBase64PdfSource:

Stringdata

JsonValue;mediaType"application/pdf"constant"application/pdf"constant

Accepts one of the following:

APPLICATION\_PDF("application/pdf")

JsonValue;type"base64"constant"base64"constant

Accepts one of the following:

BASE64("base64")

classCacheControlEphemeral:

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

classCacheCreation:

longephemeral1hInputTokens

The number of input tokens used to create the 1 hour cache entry.

minimum0

longephemeral5mInputTokens

The number of input tokens used to create the 5 minute cache entry.

minimum0

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

classCitationCharLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendCharIndex

longstartCharIndex

JsonValue;type"char\_location"constant"char\_location"constant

Accepts one of the following:

CHAR\_LOCATION("char\_location")

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

classCitationContentBlockLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendBlockIndex

longstartBlockIndex

JsonValue;type"content\_block\_location"constant"content\_block\_location"constant

Accepts one of the following:

CONTENT\_BLOCK\_LOCATION("content\_block\_location")

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

classCitationPageLocationParam:

StringcitedText

longdocumentIndex

Optional<String>documentTitle

longendPageNumber

longstartPageNumber

JsonValue;type"page\_location"constant"page\_location"constant

Accepts one of the following:

PAGE\_LOCATION("page\_location")

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

classCitationWebSearchResultLocationParam:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classCitationsConfigParam:

Optional<Boolean>enabled

classCitationsDelta:

Citationcitation

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

JsonValue;type"citations\_delta"constant"citations\_delta"constant

Accepts one of the following:

CITATIONS\_DELTA("citations\_delta")

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

classCitationsWebSearchResultLocation:

StringcitedText

StringencryptedIndex

Optional<String>title

JsonValue;type"web\_search\_result\_location"constant"web\_search\_result\_location"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT\_LOCATION("web\_search\_result\_location")

Stringurl

classContentBlock:A class that can be one of several variants.union

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

classContentBlockParam:A class that can be one of several variants.union

Regular text content.

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

classContentBlockSourceContent:A class that can be one of several variants.union

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

classInputJsonDelta:

StringpartialJson

JsonValue;type"input\_json\_delta"constant"input\_json\_delta"constant

Accepts one of the following:

INPUT\_JSON\_DELTA("input\_json\_delta")

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

classMessageCountTokensTool:A class that can be one of several variants.union

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

classMessageDeltaUsage:

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

Optional<[ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage)>serverToolUse

The number of server tool requests.

longwebSearchRequests

The number of web search tool requests.

minimum0

classMessageParam:

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

classMessageTokensCount:

longinputTokens

The total number of tokens across the provided list of messages, system prompt, and tools.

classMetadata:

Optional<String>userId

An external identifier for the user who is associated with the request.

This should be a uuid, hash value, or other opaque identifier. Anthropic may use this id to help detect abuse. Do not include any identifying information such as name, email address, or phone number.

maxLength256

classPlainTextSource:

Stringdata

JsonValue;mediaType"text/plain"constant"text/plain"constant

Accepts one of the following:

TEXT\_PLAIN("text/plain")

JsonValue;type"text"constant"text"constant

Accepts one of the following:

TEXT("text")

classRawContentBlockDelta:A class that can be one of several variants.union

classTextDelta:

Stringtext

JsonValue;type"text\_delta"constant"text\_delta"constant

Accepts one of the following:

TEXT\_DELTA("text\_delta")

classInputJsonDelta:

StringpartialJson

JsonValue;type"input\_json\_delta"constant"input\_json\_delta"constant

Accepts one of the following:

INPUT\_JSON\_DELTA("input\_json\_delta")

classCitationsDelta:

Citationcitation

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

JsonValue;type"citations\_delta"constant"citations\_delta"constant

Accepts one of the following:

CITATIONS\_DELTA("citations\_delta")

classThinkingDelta:

Stringthinking

JsonValue;type"thinking\_delta"constant"thinking\_delta"constant

Accepts one of the following:

THINKING\_DELTA("thinking\_delta")

classSignatureDelta:

Stringsignature

JsonValue;type"signature\_delta"constant"signature\_delta"constant

Accepts one of the following:

SIGNATURE\_DELTA("signature\_delta")

classRawContentBlockDeltaEvent:

[RawContentBlockDelta](https://platform.claude.com/docs/en/api/messages#raw_content_block_delta)delta

Accepts one of the following:

classTextDelta:

Stringtext

JsonValue;type"text\_delta"constant"text\_delta"constant

Accepts one of the following:

TEXT\_DELTA("text\_delta")

classInputJsonDelta:

StringpartialJson

JsonValue;type"input\_json\_delta"constant"input\_json\_delta"constant

Accepts one of the following:

INPUT\_JSON\_DELTA("input\_json\_delta")

classCitationsDelta:

Citationcitation

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

JsonValue;type"citations\_delta"constant"citations\_delta"constant

Accepts one of the following:

CITATIONS\_DELTA("citations\_delta")

classThinkingDelta:

Stringthinking

JsonValue;type"thinking\_delta"constant"thinking\_delta"constant

Accepts one of the following:

THINKING\_DELTA("thinking\_delta")

classSignatureDelta:

Stringsignature

JsonValue;type"signature\_delta"constant"signature\_delta"constant

Accepts one of the following:

SIGNATURE\_DELTA("signature\_delta")

longindex

JsonValue;type"content\_block\_delta"constant"content\_block\_delta"constant

Accepts one of the following:

CONTENT\_BLOCK\_DELTA("content\_block\_delta")

classRawContentBlockStartEvent:

ContentBlockcontentBlock

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

longindex

JsonValue;type"content\_block\_start"constant"content\_block\_start"constant

Accepts one of the following:

CONTENT\_BLOCK\_START("content\_block\_start")

classRawContentBlockStopEvent:

longindex

JsonValue;type"content\_block\_stop"constant"content\_block\_stop"constant

Accepts one of the following:

CONTENT\_BLOCK\_STOP("content\_block\_stop")

classRawMessageDeltaEvent:

Deltadelta

Optional<[StopReason](https://platform.claude.com/docs/en/api/messages#stop_reason)>stopReason

Accepts one of the following:

END\_TURN("end\_turn")

MAX\_TOKENS("max\_tokens")

STOP\_SEQUENCE("stop\_sequence")

TOOL\_USE("tool\_use")

PAUSE\_TURN("pause\_turn")

REFUSAL("refusal")

Optional<String>stopSequence

JsonValue;type"message\_delta"constant"message\_delta"constant

Accepts one of the following:

MESSAGE\_DELTA("message\_delta")

[MessageDeltaUsage](https://platform.claude.com/docs/en/api/messages#message_delta_usage)usage

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

Optional<[ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage)>serverToolUse

The number of server tool requests.

longwebSearchRequests

The number of web search tool requests.

minimum0

classRawMessageStartEvent:

[Message](https://platform.claude.com/docs/en/api/messages#message)message

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

JsonValue;type"message\_start"constant"message\_start"constant

Accepts one of the following:

MESSAGE\_START("message\_start")

classRawMessageStopEvent:

JsonValue;type"message\_stop"constant"message\_stop"constant

Accepts one of the following:

MESSAGE\_STOP("message\_stop")

classRawMessageStreamEvent:A class that can be one of several variants.union

classRawMessageStartEvent:

[Message](https://platform.claude.com/docs/en/api/messages#message)message

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

JsonValue;type"message\_start"constant"message\_start"constant

Accepts one of the following:

MESSAGE\_START("message\_start")

classRawMessageDeltaEvent:

Deltadelta

Optional<[StopReason](https://platform.claude.com/docs/en/api/messages#stop_reason)>stopReason

Accepts one of the following:

END\_TURN("end\_turn")

MAX\_TOKENS("max\_tokens")

STOP\_SEQUENCE("stop\_sequence")

TOOL\_USE("tool\_use")

PAUSE\_TURN("pause\_turn")

REFUSAL("refusal")

Optional<String>stopSequence

JsonValue;type"message\_delta"constant"message\_delta"constant

Accepts one of the following:

MESSAGE\_DELTA("message\_delta")

[MessageDeltaUsage](https://platform.claude.com/docs/en/api/messages#message_delta_usage)usage

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

Optional<[ServerToolUsage](https://platform.claude.com/docs/en/api/messages#server_tool_usage)>serverToolUse

The number of server tool requests.

longwebSearchRequests

The number of web search tool requests.

minimum0

classRawMessageStopEvent:

JsonValue;type"message\_stop"constant"message\_stop"constant

Accepts one of the following:

MESSAGE\_STOP("message\_stop")

classRawContentBlockStartEvent:

ContentBlockcontentBlock

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

longindex

JsonValue;type"content\_block\_start"constant"content\_block\_start"constant

Accepts one of the following:

CONTENT\_BLOCK\_START("content\_block\_start")

classRawContentBlockDeltaEvent:

[RawContentBlockDelta](https://platform.claude.com/docs/en/api/messages#raw_content_block_delta)delta

Accepts one of the following:

classTextDelta:

Stringtext

JsonValue;type"text\_delta"constant"text\_delta"constant

Accepts one of the following:

TEXT\_DELTA("text\_delta")

classInputJsonDelta:

StringpartialJson

JsonValue;type"input\_json\_delta"constant"input\_json\_delta"constant

Accepts one of the following:

INPUT\_JSON\_DELTA("input\_json\_delta")

classCitationsDelta:

Citationcitation

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

JsonValue;type"citations\_delta"constant"citations\_delta"constant

Accepts one of the following:

CITATIONS\_DELTA("citations\_delta")

classThinkingDelta:

Stringthinking

JsonValue;type"thinking\_delta"constant"thinking\_delta"constant

Accepts one of the following:

THINKING\_DELTA("thinking\_delta")

classSignatureDelta:

Stringsignature

JsonValue;type"signature\_delta"constant"signature\_delta"constant

Accepts one of the following:

SIGNATURE\_DELTA("signature\_delta")

longindex

JsonValue;type"content\_block\_delta"constant"content\_block\_delta"constant

Accepts one of the following:

CONTENT\_BLOCK\_DELTA("content\_block\_delta")

classRawContentBlockStopEvent:

longindex

JsonValue;type"content\_block\_stop"constant"content\_block\_stop"constant

Accepts one of the following:

CONTENT\_BLOCK\_STOP("content\_block\_stop")

classRedactedThinkingBlock:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

classRedactedThinkingBlockParam:

Stringdata

JsonValue;type"redacted\_thinking"constant"redacted\_thinking"constant

Accepts one of the following:

REDACTED\_THINKING("redacted\_thinking")

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

classServerToolUsage:

longwebSearchRequests

The number of web search tool requests.

minimum0

classServerToolUseBlock:

Stringid

Inputinput

JsonValue;name"web\_search"constant"web\_search"constant

Accepts one of the following:

WEB\_SEARCH("web\_search")

JsonValue;type"server\_tool\_use"constant"server\_tool\_use"constant

Accepts one of the following:

SERVER\_TOOL\_USE("server\_tool\_use")

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

classSignatureDelta:

Stringsignature

JsonValue;type"signature\_delta"constant"signature\_delta"constant

Accepts one of the following:

SIGNATURE\_DELTA("signature\_delta")

enumStopReason:

END\_TURN("end\_turn")

MAX\_TOKENS("max\_tokens")

STOP\_SEQUENCE("stop\_sequence")

TOOL\_USE("tool\_use")

PAUSE\_TURN("pause\_turn")

REFUSAL("refusal")

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

classTextCitation:A class that can be one of several variants.union

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

classTextCitationParam:A class that can be one of several variants.union

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

classTextDelta:

Stringtext

JsonValue;type"text\_delta"constant"text\_delta"constant

Accepts one of the following:

TEXT\_DELTA("text\_delta")

classThinkingBlock:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classThinkingBlockParam:

Stringsignature

Stringthinking

JsonValue;type"thinking"constant"thinking"constant

Accepts one of the following:

THINKING("thinking")

classThinkingConfigDisabled:

JsonValue;type"disabled"constant"disabled"constant

Accepts one of the following:

DISABLED("disabled")

classThinkingConfigEnabled:

longbudgetTokens

Determines how many tokens Claude can use for its internal reasoning process. Larger budgets can enable more thorough analysis for complex problems, improving response quality.

Must be ≥1024 and less than `max_tokens`.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

minimum1024

JsonValue;type"enabled"constant"enabled"constant

Accepts one of the following:

ENABLED("enabled")

classThinkingConfigParam:A class that can be one of several variants.union

Configuration for enabling Claude's extended thinking.

When enabled, responses include `thinking` content blocks showing Claude's thinking process before the final answer. Requires a minimum budget of 1,024 tokens and counts towards your `max_tokens` limit.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

classThinkingConfigEnabled:

longbudgetTokens

Determines how many tokens Claude can use for its internal reasoning process. Larger budgets can enable more thorough analysis for complex problems, improving response quality.

Must be ≥1024 and less than `max_tokens`.

See [extended thinking](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) for details.

minimum1024

JsonValue;type"enabled"constant"enabled"constant

Accepts one of the following:

ENABLED("enabled")

classThinkingConfigDisabled:

JsonValue;type"disabled"constant"disabled"constant

Accepts one of the following:

DISABLED("disabled")

classThinkingDelta:

Stringthinking

JsonValue;type"thinking\_delta"constant"thinking\_delta"constant

Accepts one of the following:

THINKING\_DELTA("thinking\_delta")

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

classToolChoice:A class that can be one of several variants.union

How the model should use the provided tools. The model can use a specific tool, any available tool, decide by itself, or not use tools at all.

classToolChoiceAuto:

The model will automatically decide whether to use tools.

JsonValue;type"auto"constant"auto"constant

Accepts one of the following:

AUTO("auto")

Optional<Boolean>disableParallelToolUse

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output at most one tool use.

classToolChoiceAny:

The model will use any available tools.

JsonValue;type"any"constant"any"constant

Accepts one of the following:

ANY("any")

Optional<Boolean>disableParallelToolUse

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

classToolChoiceTool:

The model will use the specified tool with `tool_choice.name`.

Stringname

The name of the tool to use.

JsonValue;type"tool"constant"tool"constant

Accepts one of the following:

TOOL("tool")

Optional<Boolean>disableParallelToolUse

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

classToolChoiceNone:

The model will not be allowed to use tools.

JsonValue;type"none"constant"none"constant

Accepts one of the following:

NONE("none")

classToolChoiceAny:

The model will use any available tools.

JsonValue;type"any"constant"any"constant

Accepts one of the following:

ANY("any")

Optional<Boolean>disableParallelToolUse

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

classToolChoiceAuto:

The model will automatically decide whether to use tools.

JsonValue;type"auto"constant"auto"constant

Accepts one of the following:

AUTO("auto")

Optional<Boolean>disableParallelToolUse

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output at most one tool use.

classToolChoiceNone:

The model will not be allowed to use tools.

JsonValue;type"none"constant"none"constant

Accepts one of the following:

NONE("none")

classToolChoiceTool:

The model will use the specified tool with `tool_choice.name`.

Stringname

The name of the tool to use.

JsonValue;type"tool"constant"tool"constant

Accepts one of the following:

TOOL("tool")

Optional<Boolean>disableParallelToolUse

Whether to disable parallel tool use.

Defaults to `false`. If set to `true`, the model will output exactly one tool use.

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

classToolUnion:A class that can be one of several variants.union

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

classToolUseBlock:

Stringid

Inputinput

Stringname

JsonValue;type"tool\_use"constant"tool\_use"constant

Accepts one of the following:

TOOL\_USE("tool\_use")

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

classUrlImageSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classUrlPdfSource:

JsonValue;type"url"constant"url"constant

Accepts one of the following:

URL("url")

Stringurl

classUsage:

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

classWebSearchResultBlock:

StringencryptedContent

Optional<String>pageAge

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

classWebSearchResultBlockParam:

StringencryptedContent

Stringtitle

JsonValue;type"web\_search\_result"constant"web\_search\_result"constant

Accepts one of the following:

WEB\_SEARCH\_RESULT("web\_search\_result")

Stringurl

Optional<String>pageAge

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

classWebSearchToolResultBlockContent:A class that can be one of several variants.union

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

classWebSearchToolResultBlockParamContent:A class that can be one of several variants.union

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

#### MessagesBatches

##### [Create a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/create)

[MessageBatch](https://platform.claude.com/docs/en/api/messages#message_batch)messages().batches().create(BatchCreateParamsparams, RequestOptionsrequestOptions=RequestOptions.none())

post/v1/messages/batches

##### [Retrieve a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/retrieve)

[MessageBatch](https://platform.claude.com/docs/en/api/messages#message_batch)messages().batches().retrieve(BatchRetrieveParamsparams=BatchRetrieveParams.none(), RequestOptionsrequestOptions=RequestOptions.none())

get/v1/messages/batches/{message\_batch\_id}

##### [List Message Batches](https://platform.claude.com/docs/en/api/messages/batches/list)

BatchListPagemessages().batches().list(BatchListParamsparams=BatchListParams.none(), RequestOptionsrequestOptions=RequestOptions.none())

get/v1/messages/batches

##### [Cancel a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/cancel)

[MessageBatch](https://platform.claude.com/docs/en/api/messages#message_batch)messages().batches().cancel(BatchCancelParamsparams=BatchCancelParams.none(), RequestOptionsrequestOptions=RequestOptions.none())

post/v1/messages/batches/{message\_batch\_id}/cancel

##### [Delete a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/delete)

[DeletedMessageBatch](https://platform.claude.com/docs/en/api/messages#deleted_message_batch)messages().batches().delete(BatchDeleteParamsparams=BatchDeleteParams.none(), RequestOptionsrequestOptions=RequestOptions.none())

delete/v1/messages/batches/{message\_batch\_id}

##### [Retrieve Message Batch results](https://platform.claude.com/docs/en/api/messages/batches/results)

[MessageBatchIndividualResponse](https://platform.claude.com/docs/en/api/messages#message_batch_individual_response)messages().batches().resultsStreaming(BatchResultsParamsparams=BatchResultsParams.none(), RequestOptionsrequestOptions=RequestOptions.none())

get/v1/messages/batches/{message\_batch\_id}/results

##### ModelsExpand Collapse

classDeletedMessageBatch:

Stringid

ID of the Message Batch.

JsonValue;type"message\_batch\_deleted"constant"message\_batch\_deleted"constant

Deleted object type.

For Message Batches, this is always `"message_batch_deleted"`.

Accepts one of the following:

MESSAGE\_BATCH\_DELETED("message\_batch\_deleted")

classMessageBatch:

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

[MessageBatchRequestCounts](https://platform.claude.com/docs/en/api/messages#message_batch_request_counts)requestCounts

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

classMessageBatchCanceledResult:

JsonValue;type"canceled"constant"canceled"constant

Accepts one of the following:

CANCELED("canceled")

classMessageBatchErroredResult:

[ErrorResponse](https://platform.claude.com/docs/en/api/$shared#error_response)error

[ErrorObject](https://platform.claude.com/docs/en/api/$shared#error_object)error

Accepts one of the following:

classInvalidRequestError:

Stringmessage

JsonValue;type"invalid\_request\_error"constant"invalid\_request\_error"constant

Accepts one of the following:

INVALID\_REQUEST\_ERROR("invalid\_request\_error")

classAuthenticationError:

Stringmessage

JsonValue;type"authentication\_error"constant"authentication\_error"constant

Accepts one of the following:

AUTHENTICATION\_ERROR("authentication\_error")

classBillingError:

Stringmessage

JsonValue;type"billing\_error"constant"billing\_error"constant

Accepts one of the following:

BILLING\_ERROR("billing\_error")

classPermissionError:

Stringmessage

JsonValue;type"permission\_error"constant"permission\_error"constant

Accepts one of the following:

PERMISSION\_ERROR("permission\_error")

classNotFoundError:

Stringmessage

JsonValue;type"not\_found\_error"constant"not\_found\_error"constant

Accepts one of the following:

NOT\_FOUND\_ERROR("not\_found\_error")

classRateLimitError:

Stringmessage

JsonValue;type"rate\_limit\_error"constant"rate\_limit\_error"constant

Accepts one of the following:

RATE\_LIMIT\_ERROR("rate\_limit\_error")

classGatewayTimeoutError:

Stringmessage

JsonValue;type"timeout\_error"constant"timeout\_error"constant

Accepts one of the following:

TIMEOUT\_ERROR("timeout\_error")

classApiErrorObject:

Stringmessage

JsonValue;type"api\_error"constant"api\_error"constant

Accepts one of the following:

API\_ERROR("api\_error")

classOverloadedError:

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

classMessageBatchExpiredResult:

JsonValue;type"expired"constant"expired"constant

Accepts one of the following:

EXPIRED("expired")

classMessageBatchIndividualResponse:

This is a single line in the response `.jsonl` file and does not represent the response as a whole.

StringcustomId

Developer-provided ID created for each request in a Message Batch. Useful for matching results to requests, as results may be given out of request order.

Must be unique for each request within the Message Batch.

[MessageBatchResult](https://platform.claude.com/docs/en/api/messages#message_batch_result)result

Processing result for this request.

Contains a Message output if processing was successful, an error response if processing failed, or the reason why processing was not attempted, such as cancellation or expiration.

Accepts one of the following:

classMessageBatchSucceededResult:

[Message](https://platform.claude.com/docs/en/api/messages#message)message

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

JsonValue;type"succeeded"constant"succeeded"constant

Accepts one of the following:

SUCCEEDED("succeeded")

classMessageBatchErroredResult:

[ErrorResponse](https://platform.claude.com/docs/en/api/$shared#error_response)error

[ErrorObject](https://platform.claude.com/docs/en/api/$shared#error_object)error

Accepts one of the following:

classInvalidRequestError:

Stringmessage

JsonValue;type"invalid\_request\_error"constant"invalid\_request\_error"constant

Accepts one of the following:

INVALID\_REQUEST\_ERROR("invalid\_request\_error")

classAuthenticationError:

Stringmessage

JsonValue;type"authentication\_error"constant"authentication\_error"constant

Accepts one of the following:

AUTHENTICATION\_ERROR("authentication\_error")

classBillingError:

Stringmessage

JsonValue;type"billing\_error"constant"billing\_error"constant

Accepts one of the following:

BILLING\_ERROR("billing\_error")

classPermissionError:

Stringmessage

JsonValue;type"permission\_error"constant"permission\_error"constant

Accepts one of the following:

PERMISSION\_ERROR("permission\_error")

classNotFoundError:

Stringmessage

JsonValue;type"not\_found\_error"constant"not\_found\_error"constant

Accepts one of the following:

NOT\_FOUND\_ERROR("not\_found\_error")

classRateLimitError:

Stringmessage

JsonValue;type"rate\_limit\_error"constant"rate\_limit\_error"constant

Accepts one of the following:

RATE\_LIMIT\_ERROR("rate\_limit\_error")

classGatewayTimeoutError:

Stringmessage

JsonValue;type"timeout\_error"constant"timeout\_error"constant

Accepts one of the following:

TIMEOUT\_ERROR("timeout\_error")

classApiErrorObject:

Stringmessage

JsonValue;type"api\_error"constant"api\_error"constant

Accepts one of the following:

API\_ERROR("api\_error")

classOverloadedError:

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

classMessageBatchCanceledResult:

JsonValue;type"canceled"constant"canceled"constant

Accepts one of the following:

CANCELED("canceled")

classMessageBatchExpiredResult:

JsonValue;type"expired"constant"expired"constant

Accepts one of the following:

EXPIRED("expired")

classMessageBatchRequestCounts:

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

classMessageBatchResult:A class that can be one of several variants.union

Processing result for this request.

Contains a Message output if processing was successful, an error response if processing failed, or the reason why processing was not attempted, such as cancellation or expiration.

classMessageBatchSucceededResult:

[Message](https://platform.claude.com/docs/en/api/messages#message)message

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

JsonValue;type"succeeded"constant"succeeded"constant

Accepts one of the following:

SUCCEEDED("succeeded")

classMessageBatchErroredResult:

[ErrorResponse](https://platform.claude.com/docs/en/api/$shared#error_response)error

[ErrorObject](https://platform.claude.com/docs/en/api/$shared#error_object)error

Accepts one of the following:

classInvalidRequestError:

Stringmessage

JsonValue;type"invalid\_request\_error"constant"invalid\_request\_error"constant

Accepts one of the following:

INVALID\_REQUEST\_ERROR("invalid\_request\_error")

classAuthenticationError:

Stringmessage

JsonValue;type"authentication\_error"constant"authentication\_error"constant

Accepts one of the following:

AUTHENTICATION\_ERROR("authentication\_error")

classBillingError:

Stringmessage

JsonValue;type"billing\_error"constant"billing\_error"constant

Accepts one of the following:

BILLING\_ERROR("billing\_error")

classPermissionError:

Stringmessage

JsonValue;type"permission\_error"constant"permission\_error"constant

Accepts one of the following:

PERMISSION\_ERROR("permission\_error")

classNotFoundError:

Stringmessage

JsonValue;type"not\_found\_error"constant"not\_found\_error"constant

Accepts one of the following:

NOT\_FOUND\_ERROR("not\_found\_error")

classRateLimitError:

Stringmessage

JsonValue;type"rate\_limit\_error"constant"rate\_limit\_error"constant

Accepts one of the following:

RATE\_LIMIT\_ERROR("rate\_limit\_error")

classGatewayTimeoutError:

Stringmessage

JsonValue;type"timeout\_error"constant"timeout\_error"constant

Accepts one of the following:

TIMEOUT\_ERROR("timeout\_error")

classApiErrorObject:

Stringmessage

JsonValue;type"api\_error"constant"api\_error"constant

Accepts one of the following:

API\_ERROR("api\_error")

classOverloadedError:

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

classMessageBatchCanceledResult:

JsonValue;type"canceled"constant"canceled"constant

Accepts one of the following:

CANCELED("canceled")

classMessageBatchExpiredResult:

JsonValue;type"expired"constant"expired"constant

Accepts one of the following:

EXPIRED("expired")

classMessageBatchSucceededResult:

[Message](https://platform.claude.com/docs/en/api/messages#message)message

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