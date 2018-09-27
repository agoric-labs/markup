# Markup (*Experimental*)

Semi-contextual parsing experiments, which fall somewhere between the scope of regular expressions and the more much more advanced realms of source code parsing.

**Live Demo**

*Markup* — fetches and highlights source from hash
> https://smotaal.github.io/experimental/markup/markup#./lib/markup.js

## Ideas

Markup can be broken down into two main concepts, sequences and groupings.

### Sequences and Groups

Sequences are meaningful symbols in the right context. Groupings provide
the context from which sequences can be infered.

In turn, sequences that become meaningful will continue to affect the meaning of the ones that follow, leading to other sequences indicating the end of their the current grouping or ones before that indicating the start of nested groupings, or ones that are not expected at all, the meaning of which shall still be somehow assumed.

> **Example**: A JavaScript source inhrently starts with that context, the curly
braces sequence in that context determines the grouping nature to follow,
the grouping in turn determines the context… and so on.

Precedence and relevance can affect the significance of certain sequences
in different contexts. Yet, the bulk of sequences used in most popular
languages can in fact be ecompassed in simple efficient expressions.

Grouping on the other hand is where modeling often gets tricky and results
in hard to reason about structures that often lead to inefficiencies.

