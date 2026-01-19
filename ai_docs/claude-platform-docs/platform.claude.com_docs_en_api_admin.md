---
url: "https://platform.claude.com/docs/en/api/admin"
title: "Admin - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Fadmin)

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

Admin

Copy page

cURL

# Admin

#### AdminOrganizations

##### [Get Current Organization](https://platform.claude.com/docs/en/api/admin/organizations/me)

get/v1/organizations/me

##### ModelsExpand Collapse

Organization = object {id, name, type}

id: string

ID of the Organization.

formatuuid

name: string

Name of the Organization.

type: "organization"

Object type.

For Organizations, this is always `"organization"`.

Accepts one of the following:

"organization"

#### AdminInvites

##### [Create Invite](https://platform.claude.com/docs/en/api/admin/invites/create)

post/v1/organizations/invites

##### [Get Invite](https://platform.claude.com/docs/en/api/admin/invites/retrieve)

get/v1/organizations/invites/{invite\_id}

##### [List Invites](https://platform.claude.com/docs/en/api/admin/invites/list)

get/v1/organizations/invites

##### [Delete Invite](https://platform.claude.com/docs/en/api/admin/invites/delete)

delete/v1/organizations/invites/{invite\_id}

##### ModelsExpand Collapse

Invite = object {id, email, expires\_at, 4 more}

id: string

ID of the Invite.

email: string

Email of the User being invited.

expires\_at: string

RFC 3339 datetime string indicating when the Invite expires.

formatdate-time

invited\_at: string

RFC 3339 datetime string indicating when the Invite was created.

formatdate-time

role: "user" or "developer" or "billing" or 2 more

Organization role of the User.

Accepts one of the following:

"user"

"developer"

"billing"

"admin"

"claude\_code\_user"

status: "accepted" or "expired" or "deleted" or "pending"

Status of the Invite.

Accepts one of the following:

"accepted"

"expired"

"deleted"

"pending"

type: "invite"

Object type.

For Invites, this is always `"invite"`.

Accepts one of the following:

"invite"

#### AdminUsers

##### [Get User](https://platform.claude.com/docs/en/api/admin/users/retrieve)

get/v1/organizations/users/{user\_id}

##### [List Users](https://platform.claude.com/docs/en/api/admin/users/list)

get/v1/organizations/users

##### [Update User](https://platform.claude.com/docs/en/api/admin/users/update)

post/v1/organizations/users/{user\_id}

##### [Remove User](https://platform.claude.com/docs/en/api/admin/users/delete)

delete/v1/organizations/users/{user\_id}

##### ModelsExpand Collapse

User = object {id, added\_at, email, 3 more}

id: string

ID of the User.

added\_at: string

RFC 3339 datetime string indicating when the User joined the Organization.

formatdate-time

email: string

Email of the User.

name: string

Name of the User.

role: "user" or "developer" or "billing" or 2 more

Organization role of the User.

Accepts one of the following:

"user"

"developer"

"billing"

"admin"

"claude\_code\_user"

type: "user"

Object type.

For Users, this is always `"user"`.

Accepts one of the following:

"user"

#### AdminWorkspaces

##### [Create Workspace](https://platform.claude.com/docs/en/api/admin/workspaces/create)

post/v1/organizations/workspaces

##### [Get Workspace](https://platform.claude.com/docs/en/api/admin/workspaces/retrieve)

get/v1/organizations/workspaces/{workspace\_id}

##### [List Workspaces](https://platform.claude.com/docs/en/api/admin/workspaces/list)

get/v1/organizations/workspaces

##### [Update Workspace](https://platform.claude.com/docs/en/api/admin/workspaces/update)

post/v1/organizations/workspaces/{workspace\_id}

##### [Archive Workspace](https://platform.claude.com/docs/en/api/admin/workspaces/archive)

post/v1/organizations/workspaces/{workspace\_id}/archive

#### AdminWorkspacesMembers

##### [Create Workspace Member](https://platform.claude.com/docs/en/api/admin/workspaces/members/create)

post/v1/organizations/workspaces/{workspace\_id}/members

##### [Get Workspace Member](https://platform.claude.com/docs/en/api/admin/workspaces/members/retrieve)

get/v1/organizations/workspaces/{workspace\_id}/members/{user\_id}

##### [List Workspace Members](https://platform.claude.com/docs/en/api/admin/workspaces/members/list)

get/v1/organizations/workspaces/{workspace\_id}/members

##### [Update Workspace Member](https://platform.claude.com/docs/en/api/admin/workspaces/members/update)

post/v1/organizations/workspaces/{workspace\_id}/members/{user\_id}

##### [Delete Workspace Member](https://platform.claude.com/docs/en/api/admin/workspaces/members/delete)

delete/v1/organizations/workspaces/{workspace\_id}/members/{user\_id}

##### ModelsExpand Collapse

WorkspaceMember = object {type, user\_id, workspace\_id, workspace\_role}

type: "workspace\_member"

Object type.

For Workspace Members, this is always `"workspace_member"`.

Accepts one of the following:

"workspace\_member"

user\_id: string

ID of the User.

workspace\_id: string

ID of the Workspace.

workspace\_role: "workspace\_user" or "workspace\_developer" or "workspace\_admin" or "workspace\_billing"

Role of the Workspace Member.

Accepts one of the following:

"workspace\_user"

"workspace\_developer"

"workspace\_admin"

"workspace\_billing"

#### AdminAPI Keys

##### [Get Api Key](https://platform.claude.com/docs/en/api/admin/api_keys/retrieve)

get/v1/organizations/api\_keys/{api\_key\_id}

##### [List Api Keys](https://platform.claude.com/docs/en/api/admin/api_keys/list)

get/v1/organizations/api\_keys

##### [Update Api Key](https://platform.claude.com/docs/en/api/admin/api_keys/update)

post/v1/organizations/api\_keys/{api\_key\_id}

#### AdminUsage Report

##### [Get Messages Usage Report](https://platform.claude.com/docs/en/api/admin/usage_report/retrieve_messages)

get/v1/organizations/usage\_report/messages

##### [Get Claude Code Usage Report](https://platform.claude.com/docs/en/api/admin/usage_report/retrieve_claude_code)

get/v1/organizations/usage\_report/claude\_code

##### ModelsExpand Collapse

ClaudeCodeUsageReport = object {data, has\_more, next\_page}

data: array of object {actor, core\_metrics, customer\_type, 6 more}

List of Claude Code usage records for the requested date.

actor: object {email\_address, type}  or object {api\_key\_name, type}

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

customer\_type: "api" or "subscription"

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

subscription\_type: optional "enterprise" or "team"

Subscription tier for subscription customers. Null for API customers.

Accepts one of the following:

"enterprise"

"team"

has\_more: boolean

True if there are more records available beyond the current page.

next\_page: string

Opaque cursor token for fetching the next page of results, or null if no more pages are available.

MessagesUsageReport = object {data, has\_more, next\_page}

data: array of object {ending\_at, results, starting\_at}

ending\_at: string

End of the time bucket (exclusive) in RFC 3339 format.

formatdate-time

results: array of object {api\_key\_id, cache\_creation, cache\_read\_input\_tokens, 7 more}

List of usage items for this time bucket. There may be multiple items if one or more `group_by[]` parameters are specified.

api\_key\_id: string

ID of the API key used. Null if not grouping by API key or for usage in the Anthropic Console.

cache\_creation: object {ephemeral\_1h\_input\_tokens, ephemeral\_5m\_input\_tokens}

The number of input tokens for cache creation.

ephemeral\_1h\_input\_tokens: number

The number of input tokens used to create the 1 hour cache entry.

ephemeral\_5m\_input\_tokens: number

The number of input tokens used to create the 5 minute cache entry.

cache\_read\_input\_tokens: number

The number of input tokens read from the cache.

context\_window: "0-200k" or "200k-1M"

Context window used. Null if not grouping by context window.

Accepts one of the following:

"0-200k"

"200k-1M"

model: string

Model used. Null if not grouping by model.

output\_tokens: number

The number of output tokens generated.

server\_tool\_use: object {web\_search\_requests}

Server-side tool usage metrics.

web\_search\_requests: number

The number of web search requests made.

service\_tier: "standard" or "batch" or "priority" or 3 more

Service tier used. Null if not grouping by service tier.

Accepts one of the following:

"standard"

"batch"

"priority"

"priority\_on\_demand"

"flex"

"flex\_discount"

uncached\_input\_tokens: number

The number of uncached input tokens processed.

workspace\_id: string

ID of the Workspace used. Null if not grouping by workspace or for the default workspace.

starting\_at: string

Start of the time bucket (inclusive) in RFC 3339 format.

formatdate-time

has\_more: boolean

Indicates if there are more results.

next\_page: string

Token to provide in as `page` in the subsequent request to retrieve the next page of data.

formatdate-time

#### AdminCost Report

##### [Get Cost Report](https://platform.claude.com/docs/en/api/admin/cost_report/retrieve)

get/v1/organizations/cost\_report

##### ModelsExpand Collapse

CostReport = object {data, has\_more, next\_page}

data: array of object {ending\_at, results, starting\_at}

ending\_at: string

End of the time bucket (exclusive) in RFC 3339 format.

results: array of object {amount, context\_window, cost\_type, 6 more}

List of cost items for this time bucket. There may be multiple items if one or more `group_by[]` parameters are specified.

amount: string

Cost amount in lowest currency units (e.g. cents) as a decimal string. For example, `"123.45"` in `"USD"` represents `$1.23`.

context\_window: "0-200k" or "200k-1M"

Input context window used. Null if not grouping by description or for non-token costs.

Accepts one of the following:

"0-200k"

"200k-1M"

cost\_type: "tokens" or "web\_search" or "code\_execution"

Type of cost. Null if not grouping by description.

Accepts one of the following:

"tokens"

"web\_search"

"code\_execution"

currency: string

Currency code for the cost amount. Currently always `"USD"`.

description: string

Description of the cost item. Null if not grouping by description.

model: string

Model name used. Null if not grouping by description or for non-token costs.

service\_tier: "standard" or "batch"

Service tier used. Null if not grouping by description or for non-token costs.

Accepts one of the following:

"standard"

"batch"

token\_type: "uncached\_input\_tokens" or "output\_tokens" or "cache\_read\_input\_tokens" or 2 more

Type of token. Null if not grouping by description or for non-token costs.

Accepts one of the following:

"uncached\_input\_tokens"

"output\_tokens"

"cache\_read\_input\_tokens"

"cache\_creation.ephemeral\_1h\_input\_tokens"

"cache\_creation.ephemeral\_5m\_input\_tokens"

workspace\_id: string

ID of the Workspace this cost is associated with. Null if not grouping by workspace or for the default workspace.

starting\_at: string

Start of the time bucket (inclusive) in RFC 3339 format.

has\_more: boolean

Indicates if there are more results.

next\_page: string

Token to provide in as `page` in the subsequent request to retrieve the next page of data.

formatdate-time

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