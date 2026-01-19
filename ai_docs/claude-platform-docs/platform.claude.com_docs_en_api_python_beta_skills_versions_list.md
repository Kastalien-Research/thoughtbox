---
url: "https://platform.claude.com/docs/en/api/python/beta/skills/versions/list"
title: "List Skill Versions - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Fpython%2Fbeta%2Fskills%2Fversions%2Flist)

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

[Create Skill](https://platform.claude.com/docs/en/api/beta/skills/create) [List Skills](https://platform.claude.com/docs/en/api/beta/skills/list) [Get Skill](https://platform.claude.com/docs/en/api/beta/skills/retrieve) [Delete Skill](https://platform.claude.com/docs/en/api/beta/skills/delete)

Versions

[Create Skill Version](https://platform.claude.com/docs/en/api/beta/skills/versions/create) [List Skill Versions](https://platform.claude.com/docs/en/api/beta/skills/versions/list) [Get Skill Version](https://platform.claude.com/docs/en/api/beta/skills/versions/retrieve) [Delete Skill Version](https://platform.claude.com/docs/en/api/beta/skills/versions/delete)

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

Versions

List

Copy page

Python

# List Skill Versions

beta.skills.versions.list(strskill\_id, VersionListParams\*\*kwargs)  -\> SyncPageCursor\[[VersionListResponse](https://platform.claude.com/docs/en/api/beta#version_list_response)\]

get/v1/skills/{skill\_id}/versions

List Skill Versions

##### ParametersExpand Collapse

skill\_id: str

Unique identifier for the skill.

The format and length of IDs may change over time.

limit: Optional\[int\]

Number of items to return per page.

Defaults to `20`. Ranges from `1` to `1000`.

page: Optional\[str\]

Optionally set to the `next_page` token from the previous response.

betas: Optional\[List\[[AnthropicBetaParam](https://platform.claude.com/docs/en/api/beta#anthropic_beta)\]\]

Optional header to specify the beta version(s) you want to use.

Accepts one of the following:

UnionMember0 = str

UnionMember1 = Literal\["message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22", 16 more\]

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

class VersionListResponse: …

id: str

Unique identifier for the skill version.

The format and length of IDs may change over time.

created\_at: str

ISO 8601 timestamp of when the skill version was created.

description: str

Description of the skill version.

This is extracted from the SKILL.md file in the skill upload.

directory: str

Directory name of the skill version.

This is the top-level directory name that was extracted from the uploaded files.

name: str

Human-readable name of the skill version.

This is extracted from the SKILL.md file in the skill upload.

skill\_id: str

Identifier for the skill that this version belongs to.

type: str

Object type.

For Skill Versions, this is always `"skill_version"`.

version: str

Version identifier for the skill.

Each version is identified by a Unix epoch timestamp (e.g., "1759178010641129").

List Skill Versions

Python

```
import os
from anthropic import Anthropic

client = Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),  # This is the default and can be omitted
)
page = client.beta.skills.versions.list(
    skill_id="skill_id",
)
page = page.data[0]
print(page.id)
```

Response 200

```
{
  "data": [\
    {\
      "id": "skillver_01JAbcdefghijklmnopqrstuvw",\
      "created_at": "2024-10-30T23:58:27.427722Z",\
      "description": "A custom skill for doing something useful",\
      "directory": "my-skill",\
      "name": "my-skill",\
      "skill_id": "skill_01JAbcdefghijklmnopqrstuvw",\
      "type": "type",\
      "version": "1759178010641129"\
    }\
  ],
  "has_more": true,
  "next_page": "page_MjAyNS0wNS0xNFQwMDowMDowMFo="
}
```

##### Returns Examples

Response 200

```
{
  "data": [\
    {\
      "id": "skillver_01JAbcdefghijklmnopqrstuvw",\
      "created_at": "2024-10-30T23:58:27.427722Z",\
      "description": "A custom skill for doing something useful",\
      "directory": "my-skill",\
      "name": "my-skill",\
      "skill_id": "skill_01JAbcdefghijklmnopqrstuvw",\
      "type": "type",\
      "version": "1759178010641129"\
    }\
  ],
  "has_more": true,
  "next_page": "page_MjAyNS0wNS0xNFQwMDowMDowMFo="
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