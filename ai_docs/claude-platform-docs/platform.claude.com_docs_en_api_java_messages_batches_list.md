---
url: "https://platform.claude.com/docs/en/api/java/messages/batches/list"
title: "List Message Batches - Claude API Reference"
---

[Claude Documentation Home](https://platform.claude.com/docs/en/home)

- [Developer Guide](https://platform.claude.com/docs/en/intro)
- [API Reference](https://platform.claude.com/docs/en/api/overview)
- [MCP](https://modelcontextprotocol.io/)
- [Resources](https://platform.claude.com/docs/en/resources/overview)
- [Release Notes](https://platform.claude.com/docs/en/release-notes/overview)

English

[Log in](https://platform.claude.com/login?returnTo=%2Fdocs%2Fen%2Fapi%2Fjava%2Fmessages%2Fbatches%2Flist)

Search...

⌘K

Using the API

[Features overview](https://platform.claude.com/docs/en/api/overview) [Client SDKs](https://platform.claude.com/docs/en/api/client-sdks) [Beta headers](https://platform.claude.com/docs/en/api/beta-headers) [Errors](https://platform.claude.com/docs/en/api/errors)

[Messages](https://platform.claude.com/docs/en/api/messages)

[Create a Message](https://platform.claude.com/docs/en/api/messages/create) [Count tokens in a Message](https://platform.claude.com/docs/en/api/messages/count_tokens)

Batches

[Create a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/create) [Retrieve a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/retrieve) [List Message Batches](https://platform.claude.com/docs/en/api/messages/batches/list) [Cancel a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/cancel) [Delete a Message Batch](https://platform.claude.com/docs/en/api/messages/batches/delete) [Retrieve Message Batch results](https://platform.claude.com/docs/en/api/messages/batches/results)

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

Batches

List

Copy page

Java

# List Message Batches

BatchListPagemessages().batches().list(BatchListParamsparams=BatchListParams.none(), RequestOptionsrequestOptions=RequestOptions.none())

get/v1/messages/batches

List all Message Batches within a Workspace. Most recently created batches are returned first.

Learn more about the Message Batches API in our [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)

##### ParametersExpand Collapse

BatchListParamsparams

Optional<String>afterId

ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.

Optional<String>beforeId

ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.

Optional<Long>limit

Number of items to return per page.

Defaults to `20`. Ranges from `1` to `1000`.

maximum1000

minimum1

##### ReturnsExpand Collapse

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

List Message Batches

Java

```
package com.anthropic.example;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.batches.BatchListPage;
import com.anthropic.models.messages.batches.BatchListParams;

public final class Main {
    private Main() {}

    public static void main(String[] args) {
        AnthropicClient client = AnthropicOkHttpClient.fromEnv();

        BatchListPage page = client.messages().batches().list();
    }
}
```

Response 200

```
{
  "data": [\
    {\
      "id": "msgbatch_013Zva2CMHLNnXjNJJKqJ2EF",\
      "archived_at": "2024-08-20T18:37:24.100435Z",\
      "cancel_initiated_at": "2024-08-20T18:37:24.100435Z",\
      "created_at": "2024-08-20T18:37:24.100435Z",\
      "ended_at": "2024-08-20T18:37:24.100435Z",\
      "expires_at": "2024-08-20T18:37:24.100435Z",\
      "processing_status": "in_progress",\
      "request_counts": {\
        "canceled": 10,\
        "errored": 30,\
        "expired": 10,\
        "processing": 100,\
        "succeeded": 50\
      },\
      "results_url": "https://api.anthropic.com/v1/messages/batches/msgbatch_013Zva2CMHLNnXjNJJKqJ2EF/results",\
      "type": "message_batch"\
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
      "id": "msgbatch_013Zva2CMHLNnXjNJJKqJ2EF",\
      "archived_at": "2024-08-20T18:37:24.100435Z",\
      "cancel_initiated_at": "2024-08-20T18:37:24.100435Z",\
      "created_at": "2024-08-20T18:37:24.100435Z",\
      "ended_at": "2024-08-20T18:37:24.100435Z",\
      "expires_at": "2024-08-20T18:37:24.100435Z",\
      "processing_status": "in_progress",\
      "request_counts": {\
        "canceled": 10,\
        "errored": 30,\
        "expired": 10,\
        "processing": 100,\
        "succeeded": 50\
      },\
      "results_url": "https://api.anthropic.com/v1/messages/batches/msgbatch_013Zva2CMHLNnXjNJJKqJ2EF/results",\
      "type": "message_batch"\
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