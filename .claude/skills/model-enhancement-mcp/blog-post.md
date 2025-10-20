# MCP 101: Model Enhancement Servers

hello, AI development community. i've been teasing a large set of resources on **Model Context Protocol** for months now, and what i've come up with is in two parts. the first part is a zero-to-hero series on Model Context Protocol that i'm creating for YouTube with my production and audio work on it. the second is a series on Medium for some topics that worked better as "bottle episodes" than they did as incremental steps along a path to the same idea.

the first episode is on a topic i've been fascinated by since mid-February, when I published the **Clear Thought** server on Smithery, inspired by the **sequentialthinking** server from Model Context Protocol themselves: model capability extension through MCP. it's not entirely intuitive, though, how exactly servers like sequentialthinking and memory work. remote procedure calls, WebSockets, and HTTP are decades-tested things: agentic networking as a field, though, is less than six months old, and that puts familiar protocols into a strange context. it makes Model Context Protocol resistant to easy understanding at first, but never fear: we're (mostly, kind of) staying out of the weeds and keeping it high-level today.

let's get at it.

## MCP Wrappers vs Model Enhancement Servers

![holocron visualization](image-placeholder)

*holocron, December 2024. glassBead (photography + editing) and Grok 3.*

let's start with the kind of MCP server that you probably know about already: the **wrapper** that lets a model use an API or another protocol of its own accord when the situation calls for it. to get it out of the way: "wrapper" is not an insult. i love these servers! like everybody else, i wanted to be the first person to make X server and Y server, and i'm genuinely amazed by the implications of what's come out just in April.

MCPs as wrappers are great: when you want Claude Desktop or Roo Code to be able to use a specific service like Supabase, you need a wrapper on Supabase's API to do that. if "wrapper" servers are a key that opens a chest with a specific treasure, **"model enhancement" servers** are like a pen and paper, or a calculator: they are technology, natively designed for use by an LLM, intended to extend the user's (that is, the model's) abilities in a variety of circumstances, not only "i need to update Airtable" or "i need to reply to my business partner through Gmail".

> "model enhancement" servers are…technology, natively designed for use by an LLM, intended to extend the user's (that is, the model's) abilities in a variety of circumstances.

it's helpful to think of many of these servers as a **bullet journal for AI**. a model documents some information with the server, and the server does some basic heuristic processing (i.e. "did that thing i just did have the result i thought it would?") to signal to the model that Step 1 is complete, and what the scope for Step 2 is. because the AI is directed to consider only a small set of concerns while the series of transactions is ongoing, performance in tasks that benefit from memory, additional reasoning ability, and accurate runtime lookup will improve.

the benefit is similar to the **Getting Things Done** system's benefit to humans: when we offload some of our thoughts into a document, we can process them more easily, because we are focused on the thought we have written down versus the hundred thoughts we did not write down. context window management is important to all entities that use attention, a scarce resource.

## How the Process Works

consider the diagram below. to anyone not used to reading process diagrams, it's not as scary as it looks: time moves forward as you go top-to-bottom down the diagram. the horizonal lines represent where our train of thought is coming from and going to at different points in time, and the vertical lines labeled "MCP Client (Host App)" and "LLM (e.g. Claude)", etc. are the different "stations" that our train of thought will pull into along the way.

![process diagram](image-placeholder)

*process diagram: an AI application uses the sequentialthinking server.*

you can see that on the left of the diagram, we have our AI application (equipped w/ an MCP client), which sometimes is using Claude and sometimes is using traditional, deterministic code. moving right, we have our LLM, which here is Claude 3.7 Sonnet (i'll differentiate from Claude Desktop, which is a host app with an MCP client). past that, we have our **sequentialthinking** server, which maintains a history of each of our model's thoughts as it reasons through the process.

tying it all together and breaking it down, all that's happening here is:

1. the host application (Claude Desktop) gives some user input to Claude 3.7 Sonnet.
2. Sonnet infers that this is a complex query, and that it would benefit from using sequentialthinking to answer the query.
3. Claude initiates the initialization handshake with the server, the server responds letting Claude know that it has the sequentialthinking tool, and Claude responds with a request to use it (aka the first thought).
4. from here, a regular, well-defined exchange of messages begins. first, Claude sends the first thought to the sequentialthinking server. then, the server makes a record of the thought and sends back the thought metadata and some information about how the process is going overall. Claude receives the messages, generates a second thought, and sends it to the server. the server makes a note of the second thought, and sends back some metadata and status info, etc.
5. on the final message, the sequentialthinking server sends back status information to Claude that says the conversation is complete, along with the outcome of the reasoning process.
6. Claude passes this information to the host application, which takes some action based on the information it got from the reasoning process.

each time that Claude calls sequentialthinking to move to the next step, you can imagine Claude as a student working on a difficult math problem. Claude works out a step of the problem on a whiteboard, walks away to reflect on what to do next, and when it has a satisfactory next step in mind, it goes back to the whiteboard to complete that step so it can move on to the next one in the process.

## Core Capabilities

so what are the fundamental capabilities that this sort of MCP server tends to enhance? another way of asking this question might be, what tools fit well in a single `index.ts`?

as it turns out, the three canonical capabilities that elevate an "LLM" to an "agent" (**retrieval**, **tool use**, and **memory**) all fit pretty well into this category.

![core capabilities diagram](image-placeholder)

*credit: Anthropic, PBC. "Building Effective Agents"*

to quote Anthropic themselves:

> The basic building block of agentic systems is an LLM enhanced with augmentations such as retrieval, tools, and memory.

of course, these three augmentations are not so easy to separate from one another. it's easy to imagine an LLM using a tool call to access memories, which it then performs retrieval processes on (especially easy when that sentence is essentially a high-level description of sequentialthinking above). in a way, though, that proves the point: it's possible to provide some meaningful level of all three core agentic abilities with a single MCP server.

indeed, Model Context Protocol is often the lowest-overhead way to turn an LLM into an agent: this is where the thrilling possibilities that enhancement via MCP presents for software become more clear.

## Future Possibilities

i won't go into all of these in depth here, but i'd like to leave you with some food for thought:

- **model enhancement**, with its Day One mechanism for maintaining context across long operations, has great potential to become a standard means of extending client-server transactions for highly async processes like batch jobs or Exa's Websets product, where the webset creation process can run for 30 minutes or more if the model decides they need to "Webset" an answer instead of "Googling" it. LLM's are fantastic at taking large volumes of data and transforming the information into something useful: model enhancement may unlock another avenue for LLM's to do what they do best.
- a **model enhancement server** could potentially connect to multiple clients and provide their host applications with information about a process being run by several MCP client applications that may not have any other means of interacting with each other, aside from introducing errors to each other's work and stepping on toes. the server in this case resembles a website: you are reading this message, and if you wanted to, you could leave a comment for me and i could read it and respond. what you cannot do is use your web browser to directly call my web browser and exchange messages: we must each post to the bulletin board of the World Wide Web to communicate through our web browsers. MCP servers as proxies between clients, in my opinion, will become the dominant use case per-server.
- in addition to general-use reasoning strategies, **enhancement servers** can support highly formalized workflows such as the scientific method, thanks to the method's clear definition and widely-accepted standards of practice. **scientific-method** is one of seven enhancement servers i released today, and i encourage you to give it a try and give me feedback on GitHub, here on Medium, or elsewhere.

## Conclusion

in conclusion, the field of agentic networking is a very young one. most of the great innovations made with MCP and other protocols like **ACP** (Agent Context Protocol) from IBM and **A2A** (Agent to Agent Protocol) by Google have yet to be imagined. with a greater ecosystem curiosity about model enhancement, we may find ourselves moving ahead faster than we expect to even today.

---

*glassBead will be at the Interrupt conference by LangChain on May 14–15, 2025.*