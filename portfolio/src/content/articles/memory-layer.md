---
id: memory-layer
slug: i-failed-a-memory-layer-system-design-round-so-i-built-one
title: I Failed a Memory-layer System Design Round. So I built one!
date: 2026-09-23
readingTime: 5 min read
summary: How studying Mem0-style architecture led me to CogLayer — a hands-on lab for the read/write memory loop behind modern AI agents.
mediumHref: https://pub.towardsai.net/i-failed-a-memory-layer-system-design-round-so-i-built-one-bdae11583560
---

A few weeks ago I sat in a system-design conversation with a NYC-based startup.

They asked about to build a system design for a memory layer for their sales agent: not just a basic RAG, but how an agent should remember, update, and forget facts about a user and their conversation with the system over time — without blocking the chat reply, without stuffing the entire history into every prompt, and without treating every similar embedding as the same fact.

I knew the buzzwords. I did not have a crisp mental model.

Well I did build a complete RAG with strong redis cache and cache TTL and invalidation as well, unfortunately didn’t clear that round, so I decided to fill my knowledge gap by building one and currently one of the best memory layer architectures for conversational agents out there is owned by mem0. I read how Mem0-style pipelines are described in the wild — hybrid retrieval + LLM judgment — and implemented a small but complete version: CogLayer. Here’s the research paper by them which I referred— [https://arxiv.org/pdf/2504.19413](https://arxiv.org/pdf/2504.19413)

This article is the write-up I wish I’d had before that interview: the _why_, the _architecture_, and a path you can click through yourself.

In chatbots, people often mix three different things:

1. Context window — whatever fits in the current prompt
2. Conversation history — raw turns (“User said… Assistant said…”)
3. Durable memory — atomic facts you want to keep across sessions (“Alex prefers dark roast coffee,” “User adopted a dog named Scout”)

Mem0-style systems focus on (3), while still using (2) as fuel for extraction.

The hard part is not storing text. The hard part is:

- Finding _candidate_ related memories cheaply
- Deciding whether a new fact is about the _candidate_ **new**, a **refinement**, a **contradiction**, or **already known**.
- Updating storage without making the user wait on that judgment.

That last point is why the architecture splits into two paths.

## The core idea: hybrid recall + judgment

Vector search is excellent at cheap recall:

“Given this sentence, what are the top-s similar memories for this user?”

It is terrible at semantic judgment on its own.

“Likes X” and “hates X” can sit next to each other in embedding space. Similarity will happily retrieve both. Only a model (or careful rules) can say: _update_, _delete_, or _noop_.

So the hybrid loop is:

- **Embeddings / Qdrant** — Narrow the world to a few relevant memories
- **LLM EXTRACT** — Pull durable candidate facts from a message pair + recent context
- **LLM DECIDE** — Pick exactly one tool: `ADD` / `UPDATE` / `DELETE` / `NOOP`
- **Async worker** — Apply the tool to the store so chat stays snappy

Mem0 popularized this style of thinking for production agents. CogLayer is a learning implementation of that loop — not a clone of Mem0 Cloud, and not a claim to replace it. The goal is understanding you can demo and explain.

## Two paths: Read (sync) and Write (async)

### Read path

Every `/chat` request:

1. User sends a query
2. Embed the query → Qdrant top-k , filtered by `user_id`
3. Load recent conversation turns
4. Build a prompt (instructions + memories + history + query)
5. LLM generates a reply
6. Return the reply immediately
7. Fire a background job (Celery / RabbitMQ) — do not block the HTTP response.

### Write path

The worker receives the **message pair** (user query + assistant reply):

1. Save the pair to the conversation store
2. Build extraction prompt P: rolling summary **S** + last ~10 turns + new pair
3. LLM #1 — EXTRACT→ candidate facts
4. For each candidate: embed → **top-s similar** memories for that user
5. LLM #2 — DECIDE → one tool call
6. Apply ops to **JSON memory store/or you own storage** and **Qdrant**(re-embed on ADD/UPDATE)

Summary S in CogLayer is computed when the write path runs(on each new pair). Some production designs cache summary with a _periodic_ summarizer to save LLM cost at scale. For learning and for short demos, on-write summarization is the honest default.

## Why system design interviews care about this?

If you only say “we’ll use a vector database/RAG,” you miss:

- **Isolation** — every search scoped by user (and often agent/session)
- **Non-blocking writes**— queue the maintenance job
- **Idempotent identity** — stable memory IDs, not random duplicates every turn
- **Contradiction handling** — DELETE / UPDATE, not infinite ADDs
- **Dual stores**— searchable vectors _and_ a source of truth for text/metadata

Mem0-style design is a clean story for all of the above. Building even a thin version forces you to confront the failure modes: stale vectors after JSON updates, eager .**delay()** with no worker, EXTRACT inventing facts, DECIDE ADDing near-duplicates.

Those scars are better interview fuel than a perfect diagram.

## Learning it by seeing it

![CogLayer Architecture](https://miro.medium.com/v2/resize:fit:1400/format:webp/0*_-X-2RbIyvjtBrPe.png)

CogLayer includes an animated lab (Excalidraw-ish whiteboard UI) that steps through Read and Write:

- Play / Pause / Prev / Next
- Nodes light up; arrows stay visible and highlight on the active hop
- Each step has a short **“what”** and **“why”**.

**Repo —** [**https://github.com/Swaraj07082/CogLayer**](https://github.com/Swaraj07082/CogLayer)

I didn’t build CogLayer to compete with Mem0.

I built it because I couldn’t _explain_ a memory layer under pressure — and explanation without implementation is fragile.

If you’re learning agent memory, preparing for AI system design, or teaching the difference between RAG-for-documents and memory-for-users, walk the **/learn** on my repo once. Then break it on purpose: kill the worker, skip Qdrant sync, force a contradictory fact. Watch what fails.

That’s how the diagram becomes intuition.

## Further reading

- Mem0 docs and papers (product inspiration for the hybrid loop) — [https://arxiv.org/pdf/2504.19413](https://arxiv.org/pdf/2504.19413)

Peace Out! ✌️

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*HQqYBMIddaef1QVz9cDAsg.png)
