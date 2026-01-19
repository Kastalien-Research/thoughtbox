---
url: "https://platform.claude.com/docs/en/api/beta/files/list"
title: "List Files - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Fbeta%2Ffiles%2Flist)

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

[Upload File](https://platform.claude.com/docs/en/api/beta/files/upload) [List Files](https://platform.claude.com/docs/en/api/beta/files/list) [Download File](https://platform.claude.com/docs/en/api/beta/files/download) [Get File Metadata](https://platform.claude.com/docs/en/api/beta/files/retrieve_metadata) [Delete File](https://platform.claude.com/docs/en/api/beta/files/delete)

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

Files

List

Copy page

cURL

# List Files

get/v1/files

List Files

##### Query ParametersExpand Collapse

after\_id: optional string

ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.

before\_id: optional string

ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.

limit: optional number

Number of items to return per page.

Defaults to `20`. Ranges from `1` to `1000`.

maximum1000

minimum1

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

##### ReturnsExpand Collapse

data: array of [FileMetadata](https://platform.claude.com/docs/en/api/beta#file_metadata) { id, created\_at, filename, 4 more }

List of file metadata objects.

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

downloadable: optional boolean

Whether the file can be downloaded.

first\_id: optional string

ID of the first file in this page of results.

has\_more: optional boolean

Whether there are more results available.

last\_id: optional string

ID of the last file in this page of results.

List Files

cURL

```
curl https://api.anthropic.com/v1/files \
    -H 'anthropic-version: 2023-06-01' \
    -H 'anthropic-beta: files-api-2025-04-14' \
    -H "X-Api-Key: $ANTHROPIC_API_KEY"
```

Response 200

```
{
  "data": [\
    {\
      "id": "id",\
      "created_at": "2019-12-27T18:11:19.117Z",\
      "filename": "x",\
      "mime_type": "x",\
      "size_bytes": 0,\
      "type": "file",\
      "downloadable": true\
    }\
  ],
  "first_id": "first_id",
  "has_more": true,
  "last_id": "last_id"
}
```

##### Returns Examples

Response 200

```
{
  "data": [\
    {\
      "id": "id",\
      "created_at": "2019-12-27T18:11:19.117Z",\
      "filename": "x",\
      "mime_type": "x",\
      "size_bytes": 0,\
      "type": "file",\
      "downloadable": true\
    }\
  ],
  "first_id": "first_id",
  "has_more": true,
  "last_id": "last_id"
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