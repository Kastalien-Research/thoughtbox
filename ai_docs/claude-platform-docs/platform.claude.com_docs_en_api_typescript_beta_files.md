---
url: "https://platform.claude.com/docs/en/api/typescript/beta/files"
title: "Files - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Ftypescript%2Fbeta%2Ffiles)

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

Beta

Files

Copy page

TypeScript

# Files

##### [Upload File](https://platform.claude.com/docs/en/api/beta/files/upload)

client.beta.files.upload(FileUploadParams {file, betas} params, RequestOptionsoptions?): [FileMetadata](https://platform.claude.com/docs/en/api/beta#file_metadata) {id, created\_at, filename, 4 more}

post/v1/files

##### [List Files](https://platform.claude.com/docs/en/api/beta/files/list)

client.beta.files.list(FileListParams {after\_id, before\_id, limit, betas} params?, RequestOptionsoptions?): Page<[FileMetadata](https://platform.claude.com/docs/en/api/beta#file_metadata) {id, created\_at, filename, 4 more} >

get/v1/files

##### [Download File](https://platform.claude.com/docs/en/api/beta/files/download)

client.beta.files.download(stringfileID, FileDownloadParams {betas} params?, RequestOptionsoptions?): Response

get/v1/files/{file\_id}/content

##### [Get File Metadata](https://platform.claude.com/docs/en/api/beta/files/retrieve_metadata)

client.beta.files.retrieveMetadata(stringfileID, FileRetrieveMetadataParams {betas} params?, RequestOptionsoptions?): [FileMetadata](https://platform.claude.com/docs/en/api/beta#file_metadata) {id, created\_at, filename, 4 more}

get/v1/files/{file\_id}

##### [Delete File](https://platform.claude.com/docs/en/api/beta/files/delete)

client.beta.files.delete(stringfileID, FileDeleteParams {betas} params?, RequestOptionsoptions?): [DeletedFile](https://platform.claude.com/docs/en/api/beta#deleted_file) {id, type}

delete/v1/files/{file\_id}

##### ModelsExpand Collapse

DeletedFile {id, type}

id: string

ID of the deleted file.

type?: "file\_deleted"

Deleted object type.

For file deletion, this is always `"file_deleted"`.

Accepts one of the following:

"file\_deleted"

FileMetadata {id, created\_at, filename, 4 more}

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

downloadable?: boolean

Whether the file can be downloaded.

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