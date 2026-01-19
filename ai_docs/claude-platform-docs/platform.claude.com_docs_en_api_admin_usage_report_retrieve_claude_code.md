---
url: "https://platform.claude.com/docs/en/api/admin/usage_report/retrieve_claude_code"
title: "Get Claude Code Usage Report - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Fadmin%2Fusage_report%2Fretrieve_claude_code)

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

[Get Messages Usage Report](https://platform.claude.com/docs/en/api/admin/usage_report/retrieve_messages) [Get Claude Code Usage Report](https://platform.claude.com/docs/en/api/admin/usage_report/retrieve_claude_code)

Cost Report

[Completions](https://platform.claude.com/docs/en/api/completions)

[Create a Text Completion](https://platform.claude.com/docs/en/api/completions/create)

Support & configuration

[Rate limits](https://platform.claude.com/docs/en/api/rate-limits) [Service tiers](https://platform.claude.com/docs/en/api/service-tiers) [Versions](https://platform.claude.com/docs/en/api/versioning) [IP addresses](https://platform.claude.com/docs/en/api/ip-addresses) [Supported regions](https://platform.claude.com/docs/en/api/supported-regions) [OpenAI SDK compatibility](https://platform.claude.com/docs/en/api/openai-sdk)

[Console](https://platform.claude.com/)

[Log in](https://platform.claude.com/login)

Usage report

Retrieve claude code

Copy page

# Get Claude Code Usage Report

get/v1/organizations/usage\_report/claude\_code

Retrieve daily aggregated usage metrics for Claude Code users.
Enables organizations to analyze developer productivity and build custom dashboards.

##### Query ParametersExpand Collapse

starting\_at: string

UTC date in YYYY-MM-DD format. Returns metrics for this single day only.

limit: optional number

Number of records per page (default: 20, max: 1000).

maximum1000

minimum1

page: optional string

Opaque cursor token from previous response's `next_page` field.

##### ReturnsExpand Collapse

ClaudeCodeUsageReport = object {data, has\_more, next\_page}

data: array of object {actor, core\_metrics, customer\_type, 6 more}

List of Claude Code usage records for the requested date.

actor: object {email\_address, type} orobject {api\_key\_name, type}

The user or API key that performed the Claude Code actions.

Accepts one of the following:

UserActor = object {email\_address, type}

email\_address: string

Email address of the user who performed Claude Code actions.

type: "user\_actor"

Accepts one of the following:

"user\_actor"

APIActor = object {api\_key\_name, type}

api\_key\_name: string

Name of the API key used to perform Claude Code actions.

type: "api\_actor"

Accepts one of the following:

"api\_actor"

core\_metrics: object {commits\_by\_claude\_code, lines\_of\_code, num\_sessions, pull\_requests\_by\_claude\_code}

Core productivity metrics measuring Claude Code usage and impact.

commits\_by\_claude\_code: number

Number of git commits created through Claude Code's commit functionality.

lines\_of\_code: object {added, removed}

Statistics on code changes made through Claude Code.

added: number

Total number of lines of code added across all files by Claude Code.

removed: number

Total number of lines of code removed across all files by Claude Code.

num\_sessions: number

Number of distinct Claude Code sessions initiated by this actor.

pull\_requests\_by\_claude\_code: number

Number of pull requests created through Claude Code's PR functionality.

customer\_type: "api"or"subscription"

Type of customer account (api for API customers, subscription for Pro/Team customers).

Accepts one of the following:

"api"

"subscription"

date: string

UTC date for the usage metrics in YYYY-MM-DD format.

formatdate-time

model\_breakdown: array of object {estimated\_cost, model, tokens}

Token usage and cost breakdown by AI model used.

estimated\_cost: object {amount, currency}

Estimated cost for using this model

amount: number

Estimated cost amount in minor currency units (e.g., cents for USD).

currency: string

Currency code for the estimated cost (e.g., 'USD').

model: string

Name of the AI model used for Claude Code interactions.

tokens: object {cache\_creation, cache\_read, input, output}

Token usage breakdown for this model

cache\_creation: number

Number of cache creation tokens consumed by this model.

cache\_read: number

Number of cache read tokens consumed by this model.

input: number

Number of input tokens consumed by this model.

output: number

Number of output tokens generated by this model.

organization\_id: string

ID of the organization that owns the Claude Code usage.

terminal\_type: string

Type of terminal or environment where Claude Code was used.

tool\_actions: map\[object {accepted, rejected} \]

Breakdown of tool action acceptance and rejection rates by tool type.

accepted: number

Number of tool action proposals that the user accepted.

rejected: number

Number of tool action proposals that the user rejected.

subscription\_type: optional "enterprise"or"team"

Subscription tier for subscription customers. Null for API customers.

Accepts one of the following:

"enterprise"

"team"

has\_more: boolean

True if there are more records available beyond the current page.

next\_page: string

Opaque cursor token for fetching the next page of results, or null if no more pages are available.

Get Claude Code Usage Report

```
curl https://api.anthropic.com/v1/organizations/usage_report/claude_code \
    -H "X-Api-Key: $ANTHROPIC_ADMIN_API_KEY"
```

Response 200

```
{
  "data": [\
    {\
      "actor": {\
        "email_address": "[email protected]",\
        "type": "user_actor"\
      },\
      "core_metrics": {\
        "commits_by_claude_code": 8,\
        "lines_of_code": {\
          "added": 342,\
          "removed": 128\
        },\
        "num_sessions": 15,\
        "pull_requests_by_claude_code": 2\
      },\
      "customer_type": "api",\
      "date": "2025-08-08T00:00:00Z",\
      "model_breakdown": [\
        {\
          "estimated_cost": {\
            "amount": 186,\
            "currency": "USD"\
          },\
          "model": "claude-sonnet-4-20250514",\
          "tokens": {\
            "cache_creation": 2340,\
            "cache_read": 8790,\
            "input": 45230,\
            "output": 12450\
          }\
        },\
        {\
          "estimated_cost": {\
            "amount": 42,\
            "currency": "USD"\
          },\
          "model": "claude-3-5-haiku-20241022",\
          "tokens": {\
            "cache_creation": 890,\
            "cache_read": 3420,\
            "input": 23100,\
            "output": 5680\
          }\
        }\
      ],\
      "organization_id": "12345678-1234-5678-1234-567812345678",\
      "terminal_type": "iTerm.app",\
      "tool_actions": {\
        "edit_tool": {\
          "accepted": 25,\
          "rejected": 3\
        },\
        "multi_edit_tool": {\
          "accepted": 12,\
          "rejected": 1\
        },\
        "notebook_edit_tool": {\
          "accepted": 5,\
          "rejected": 2\
        },\
        "write_tool": {\
          "accepted": 8,\
          "rejected": 0\
        }\
      },\
      "subscription_type": "enterprise"\
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
      "actor": {\
        "email_address": "[email protected]",\
        "type": "user_actor"\
      },\
      "core_metrics": {\
        "commits_by_claude_code": 8,\
        "lines_of_code": {\
          "added": 342,\
          "removed": 128\
        },\
        "num_sessions": 15,\
        "pull_requests_by_claude_code": 2\
      },\
      "customer_type": "api",\
      "date": "2025-08-08T00:00:00Z",\
      "model_breakdown": [\
        {\
          "estimated_cost": {\
            "amount": 186,\
            "currency": "USD"\
          },\
          "model": "claude-sonnet-4-20250514",\
          "tokens": {\
            "cache_creation": 2340,\
            "cache_read": 8790,\
            "input": 45230,\
            "output": 12450\
          }\
        },\
        {\
          "estimated_cost": {\
            "amount": 42,\
            "currency": "USD"\
          },\
          "model": "claude-3-5-haiku-20241022",\
          "tokens": {\
            "cache_creation": 890,\
            "cache_read": 3420,\
            "input": 23100,\
            "output": 5680\
          }\
        }\
      ],\
      "organization_id": "12345678-1234-5678-1234-567812345678",\
      "terminal_type": "iTerm.app",\
      "tool_actions": {\
        "edit_tool": {\
          "accepted": 25,\
          "rejected": 3\
        },\
        "multi_edit_tool": {\
          "accepted": 12,\
          "rejected": 1\
        },\
        "notebook_edit_tool": {\
          "accepted": 5,\
          "rejected": 2\
        },\
        "write_tool": {\
          "accepted": 8,\
          "rejected": 0\
        }\
      },\
      "subscription_type": "enterprise"\
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