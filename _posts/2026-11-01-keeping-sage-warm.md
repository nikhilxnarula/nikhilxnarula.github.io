---
title: Keeping Sage Warm
date: 2026-11-01 11:00:00 +0530
kicker: Building · MCP
description: A cold SageMath start takes seconds, and an agent may call a tool many times for one question. So my MCP server keeps one Sage process alive. Most of the interesting problems came from that one decision.
---

I wrote [sagemath-mcp](https://github.com/nikhilxnarula/sagemath-mcp) so that an LLM agent can answer graph theory questions by calling a tool instead of guessing. The catch is that the tool, SageMath, is slow to start. This is what that one fact did to the design.

The questions come from my research on perfect matchings: is this graph a brick, and which of its edges are quasi-b-invariant? An LLM will answer both with confidence, whether or not it is right. Sage can actually work them out.

## The numbers that decided the design

Here is one run on my machine, with Sage 10.6 inside WSL2:

| Step | Time |
| --- | --- |
| First call, starting the worker from cold | about 5 s |
| `ping` on a warm worker, which only crosses the protocol | under 1 ms |
| `is_brick` on the Petersen graph | about 7 ms |
| `is_efec` on the 12-vertex cubeplex | about 17 ms |
| `classify_edges` on the Petersen graph | about 150 ms |
| `classify_edges` on an 18-vertex snark | about 650 ms |

If every tool call started a new Sage, each one would pay those five seconds before doing any maths, and an agent often makes several calls to answer one question. So the server starts Sage once, on the first call, and keeps it.

That is the whole idea. The rest of this post is what it costs.

## Three layers and one boundary

```text
server.py   host Python 3.10+    FastMCP tools; no graph theory
bridge.py   host Python 3.10+    finding Sage, process lifecycle, JSON-line RPC
   |  subprocess boundary (on Windows this also crosses into WSL)
worker.py   Sage's Python        all graph theory; runs under `sage -python`
```

The boundary exists because Sage brings its own Python. `worker.py` runs under that interpreter, so it can only use the standard library and `sage.all`. The host side knows MCP and knows nothing about graphs. They talk in JSON, one message per line:

```text
-> {"id": 1, "fn": "is_efec", "args": {"g6": "Ks?GOgSOpDL?"}}
<- {"id": 1, "ok": true, "result": {...}}
```

On Windows the same pipe goes through `wsl`, and file paths go through `wslpath` on the way.

## stdout belongs to the protocol

A long-lived process that replies on stdout has a new way to fail: anything else that prints. This was not hypothetical, because the notebook code I ported did print. `is_near_bipartite` printed its witness pair, right into the channel carrying the JSON.

So every handler runs with stdout pointed at stderr:

```python
# stdout is the protocol channel: keep stray prints from Sage or from
# the ported notebook code away from it.
with contextlib.redirect_stdout(sys.stderr):
    result = handle(request)
```

That moves the problem. If nobody reads the worker's stderr, its pipe eventually fills and the next print blocks the worker for good. So the bridge runs a thread that keeps draining stderr into a small rolling buffer:

```python
_stderr: deque = field(default_factory=lambda: deque(maxlen=200), init=False)
```

The buffer earns its place a second time when something goes wrong, because the last lines of it go into the error message.

The one tool that runs arbitrary code, `run_sage`, stays out of all this. It gets a fresh subprocess every time and pays the cold start, because user code must not be able to corrupt the worker or write to its protocol channel.

## When the worker hangs or dies

Replies are read by a second thread that feeds a queue, so every call can wait with a plain `queue.get(timeout)`. Three rules cover the rest:

- **Too slow:** on a timeout the worker is closed, and the error tells the caller to retry with a longer timeout or a smaller graph.
- **Dead:** `call` starts a new worker and retries once. If that one dies too, it raises with the tail of stderr attached.
- **Concurrent:** a single lock serialises requests. One worker answers one question at a time, which is simple and has been enough.

## Agents read what you write

The next three lessons have nothing to do with processes. They are about who is reading.

**Docstrings are the interface.** FastMCP publishes a tool's docstring as its description, and that is how an agent chooses a tool. It is easy to write `"""...""" % SOMETHING` to fill in a constant, but that is an expression and not a docstring. `__doc__` becomes `None`, and the tool is published with no description. Nothing fails. The agent just gets worse at its job.

**An error is a prompt.** graph6 encodes a graph using the printable characters from `?` to `~`, and that range includes every lowercase letter. A character check therefore accepts a mistyped name as a graph and sends it to Sage. Checking that the length of the string matches the vertex count it declares fixes that, and turns the typo into something the agent can act on:

```text
'petrsen' is neither a well-formed graph6 string nor a known graph name.
Did you mean: petersen, petersengraph, tietze, doublestarsnark, flowersnark?
Call list_named_graphs to see every name.
```

**Answers carry a witness.** If a graph is not essentially 4-edge-connected, `is_efec` returns the `disconnecting_triple`. `is_near_bipartite` returns the `removable_edge_pair`. `is_efec_cubic_brick` names the `failed_check`. The agent can show its work, and a person can check it.

## Why I trust the answers

A server that promises real answers had better give them. So the test suite pins values printed by the original research notebooks:

- The cubeplex is a near-bipartite, essentially 4-edge-connected cubic brick with quasi-b-invariant edges.
- The cyclic edge connectivity of the twinplex is 5.
- An 18-vertex snark has exactly four quasi-b-invariant edges: (2,4), (3,8), (10,15) and (13,17).
- All 15 edges of the Petersen graph are quasi-b-invariant.

If a change moves any of these, the change is wrong. On every push, CI runs the full suite inside the official SageMath container, and separately runs the tests that need no Sage.

## Try it

You need [SageMath](https://www.sagemath.org/) 10.x installed separately. Then:

```bash
pip install git+https://github.com/nikhilxnarula/sagemath-mcp
claude mcp add sagemath -- sagemath-mcp
```

Ask your agent whether the Petersen graph is a brick. If you want to know why anyone would ask that, I wrote about [the smallest snark](/writing/the-smallest-snark/).
