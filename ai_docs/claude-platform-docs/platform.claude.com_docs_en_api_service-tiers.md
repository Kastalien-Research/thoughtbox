---
url: "https://platform.claude.com/docs/en/api/service-tiers"
title: "Service tiers - Claude Docs"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Fservice-tiers)

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

Support & configuration

Service tiers

Support & configuration

# Service tiers

Copy page

Different tiers of service allow you to balance availability, performance, and predictable costs based on your application's needs.

Copy page

We offer three service tiers:

- **Priority Tier:** Best for workflows deployed in production where time, availability, and predictable pricing are important
- **Standard:** Default tier for both piloting and scaling everyday use cases
- **Batch:** Best for asynchronous workflows which can wait or benefit from being outside your normal capacity

## Standard Tier

The standard tier is the default service tier for all API requests. Requests in this tier are prioritized alongside all other requests and observe best-effort availability.

## Priority Tier

Requests in this tier are prioritized over all other requests to Anthropic. This prioritization helps minimize ["server overloaded" errors](https://platform.claude.com/docs/en/api/errors#http-errors), even during peak times.

For more information, see [Get started with Priority Tier](https://platform.claude.com/docs/en/api/service-tiers#get-started-with-priority-tier)

## How requests get assigned tiers

When handling a request, Anthropic decides to assign a request to Priority Tier in the following scenarios:

- Your organization has sufficient priority tier capacity **input** tokens per minute
- Your organization has sufficient priority tier capacity **output** tokens per minute

Anthropic counts usage against Priority Tier capacity as follows:

**Input Tokens**

- Cache reads as 0.1 tokens per token read from the cache
- Cache writes as 1.25 tokens per token written to the cache with a 5 minute TTL
- Cache writes as 2.00 tokens per token written to the cache with a 1 hour TTL
- For [long-context](https://platform.claude.com/docs/en/build-with-claude/context-windows) (>200k input tokens) requests, input tokens are 2 tokens per token
- All other input tokens are 1 token per token

**Output Tokens**

- For [long-context](https://platform.claude.com/docs/en/build-with-claude/context-windows) (>200k input tokens) requests, output tokens are 1.5 tokens per token
- All other output tokens are 1 token per token

Otherwise, requests proceed at standard tier.

Requests assigned Priority Tier pull from both the Priority Tier capacity and the regular rate limits.
If servicing the request would exceed the rate limits, the request is declined.

## Using service tiers

You can control which service tiers can be used for a request by setting the `service_tier` parameter:

```
message = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello, Claude!"}],
    service_tier="auto"  # Automatically use Priority Tier when available, fallback to standard
)
```

The `service_tier` parameter accepts the following values:

- `"auto"` (default) - Uses the Priority Tier capacity if available, falling back to your other capacity if not
- `"standard_only"` \- Only use standard tier capacity, useful if you don't want to use your Priority Tier capacity

The response `usage` object also includes the service tier assigned to the request:

```
{
  "usage": {
    "input_tokens": 410,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0,
    "output_tokens": 585,
    "service_tier": "priority"
  }
}
```

This allows you to determine which service tier was assigned to the request.

When requesting `service_tier="auto"` with a model with a Priority Tier commitment, these response headers provide insights:

```
anthropic-priority-input-tokens-limit: 10000
anthropic-priority-input-tokens-remaining: 9618
anthropic-priority-input-tokens-reset: 2025-01-12T23:11:59Z
anthropic-priority-output-tokens-limit: 10000
anthropic-priority-output-tokens-remaining: 6000
anthropic-priority-output-tokens-reset: 2025-01-12T23:12:21Z
```

You can use the presence of these headers to detect if your request was eligible for Priority Tier, even if it was over the limit.

## Get started with Priority Tier

You may want to commit to Priority Tier capacity if you are interested in:

- **Higher availability**: Target 99.5% uptime with prioritized computational resources
- **Cost Control**: Predictable spend and discounts for longer commitments
- **Flexible overflow**: Automatically falls back to standard tier when you exceed your committed capacity

Committing to Priority Tier will involve deciding:

- A number of input tokens per minute
- A number of output tokens per minute
- A commitment duration (1, 3, 6, or 12 months)
- A specific model version

The ratio of input to output tokens you purchase matters. Sizing your Priority Tier capacity to align with your actual traffic patterns helps you maximize utilization of your purchased tokens.

### Supported models

Priority Tier is supported by:

- Claude Opus 4.5
- Claude Sonnet 4.5
- Claude Haiku 4.5
- Claude Opus 4.1
- Claude Opus 4
- Claude Sonnet 4
- Claude Sonnet 3.7 ( [deprecated](https://platform.claude.com/docs/en/about-claude/model-deprecations))
- Claude Haiku 3.5 ( [deprecated](https://platform.claude.com/docs/en/about-claude/model-deprecations))

Check the [model overview page](https://platform.claude.com/docs/en/about-claude/models/overview) for more details on our models.

### How to access Priority Tier

To begin using Priority Tier:

1. [Contact sales](https://claude.com/contact-sales/priority-tier) to complete provisioning
2. (Optional) Update your API requests to optionally set the `service_tier` parameter to `auto`
3. Monitor your usage through response headers and the Claude Console

- [Standard Tier](https://platform.claude.com/docs/en/api/service-tiers#standard-tier)
- [Priority Tier](https://platform.claude.com/docs/en/api/service-tiers#priority-tier)
- [How requests get assigned tiers](https://platform.claude.com/docs/en/api/service-tiers#how-requests-get-assigned-tiers)
- [Using service tiers](https://platform.claude.com/docs/en/api/service-tiers#using-service-tiers)
- [Get started with Priority Tier](https://platform.claude.com/docs/en/api/service-tiers#get-started-with-priority-tier)
- [Supported models](https://platform.claude.com/docs/en/api/service-tiers#supported-models)
- [How to access Priority Tier](https://platform.claude.com/docs/en/api/service-tiers#how-to-access-priority-tier)

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