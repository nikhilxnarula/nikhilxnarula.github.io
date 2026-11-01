---
title: The Smallest Snark
date: 2026-11-01 10:00:00 +0530
kicker: Research · Graph theory
description: The Petersen graph has ten vertices, fifteen edges and exactly six perfect matchings. That small fact makes it a snark, and it makes it the one exception in a result I helped prove.
---

The Petersen graph is a small drawing of ten dots and fifteen lines, and it is the one exception in a result I helped prove. Here is why. You don't need any background to follow it.

## Perfect matchings

A **matching** is a set of edges in which no two share a vertex. It is **perfect** if it touches every vertex, so that each vertex gets exactly one partner.

The Petersen graph has exactly six perfect matchings. The thick edges below show one at a time, so step through them:

{% include figure.html %}

Two things are worth noticing as you step. Any two of the six share exactly one edge. And whichever one you pick, the edges left over form two separate 5-cycles.

## Why that makes it a snark

The Petersen graph is **cubic**, which means every vertex has three edges. Now try to colour the edges with three colours, so that edges meeting at a vertex always differ.

At each vertex, all three colours must appear exactly once. So the edges of one colour touch every vertex exactly once, which makes them a perfect matching. A colouring is really just three perfect matchings with no edge in common.

The Petersen graph can't do that, because any two of its perfect matchings share an edge. You can see the same thing from the leftovers. Use up one colour on a matching, and two 5-cycles remain. An odd cycle can't alternate between the two colours you have left.

A cubic graph that can't be coloured this way is a **snark**. Most modern definitions also ask for some connectivity, which rules out cheap examples. Martin Gardner named them in 1976 after the elusive creature in Lewis Carroll's *The Hunting of the Snark*, and the Petersen graph is the smallest.

They matter well beyond this puzzle. Tait showed in 1880 that the Four Colour Theorem is equivalent to saying that no planar snark exists. The Cycle Double Cover Conjecture and Tutte's 5-flow Conjecture also reduce to snarks.

## Bricks, and the edges that keep them whole

A graph is **matching covered** if it is connected and every edge lies in some perfect matching. These graphs break down into building blocks called bricks and braces, a result of Lovász from 1987, and every snark is a brick.

Now delete one edge *e* from a brick *G*:

- If *G − e* is matching covered with exactly one brick inside it, *e* is **b-invariant**.
- If *G − e* is matching covered with exactly two bricks, *e* is **quasi-b-invariant**.

Lovász conjectured that every brick has a b-invariant edge, apart from three exceptions: K<sub>4</sub>, the triangular prism and the Petersen graph. [Carvalho, Lucchesi and Murty proved it](https://doi.org/10.1006/jctb.2001.2092).

Later, [Kothari, Carvalho, Lucchesi and Little showed](https://www.combinatorics.org/ojs/index.php/eljc/article/view/v27i1p22) that in a snark every edge is one or the other. In the Petersen graph, every edge is quasi-b-invariant. My [MCP server](/writing/keeping-sage-warm/) reproduces that:

```text
has_qbinv_edges(graph="petersen")
{"order": 10, "size": 15, "has_quasi_binvariant_edges": true,
 "quasi_binvariant_count": 15, ...}
```

Every other snark on *n* vertices has at most *n*/2 of them.

## The result

At the workshop *Snarks and their generalizations* at Paderborn University in November 2025, Nishad Kothari and Santhosh Raghul announced a sharper conjecture. In joint work, Prof. Kothari and I proved it:

> In any snark other than the Petersen graph, the quasi-b-invariant edges form a matching.

So no two of them touch. A matching on *n* vertices has at most *n*/2 edges, which means this also implies the older bound.

Here is what it looks like on a real example, an 18-vertex snark from the server's registry:

```text
has_qbinv_edges(graph="snark_18_four_quasi")
{"order": 18, "size": 27, "has_quasi_binvariant_edges": true,
 "quasi_binvariant_count": 4,
 "quasi_binvariant_edges": [[2, 4], [3, 8], [10, 15], [13, 17]]}
```

That is eight different vertices across four edges, with none repeated. In the Petersen graph, the edges at any vertex are all quasi-b-invariant, so they do touch. That is why it has to be the exception.

## So what?

The work was presented at the ADMA International Conference on Discrete Mathematics and Applications at IIT Madras in June 2026. [Prof. Kothari's abstract](https://admaicdm.github.io/2026/speakers/Nishad%20Kothari.pdf) ends by asking the obvious question, and answering it better than I could:

> Of course, the natural question arises: so what? Well, we don't know, and we hope to find out someday.
