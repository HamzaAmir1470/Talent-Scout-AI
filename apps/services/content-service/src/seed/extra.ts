import { SeedTopic } from './types';

/** Additional topics, merged into each subject by data.ts so every technology has complete docs coverage. */
export const EXTRA: Record<string, SeedTopic[]> = {
  'software-engineering': [
    {
      slug: 'design-patterns', title: 'Design Patterns in Practice', minutes: 6,
      summary: 'Named solutions to problems that keep coming back, and when to reach for them.',
      doc: `
## Overview

A design pattern is a proven, named way to solve a common design problem. Patterns give teams a shared vocabulary. Saying "use a strategy here" saves ten minutes of explanation.

## Core concepts

| Family | Goal | Examples |
|---|---|---|
| Creational | Control how objects are made | Factory, Builder, Singleton |
| Structural | Compose objects into larger shapes | Adapter, Decorator, Facade |
| Behavioral | Organise how objects talk | Observer, Strategy, Command |

## Example: Strategy

The Strategy pattern swaps an algorithm at runtime without changing the caller.

~~~typescript
interface Discount { apply(total: number): number; }

const none: Discount = { apply: (t) => t };
const seasonal: Discount = { apply: (t) => t * 0.9 };

function checkout(total: number, discount: Discount) {
  return discount.apply(total);
}

checkout(200, seasonal); // 180
~~~

## Best practices

- Start with the simplest code. Introduce a pattern when the pain shows up, not before.
- Name the pattern in code and comments so teammates recognise it.

> **Tip:** Many patterns are built into modern languages. Closures replace many Strategy classes and event emitters replace hand-written Observers.
`,
      questions: [
        { d: 'beginner', q: `What is a design pattern and why should you learn them?`,
          a: `A design pattern is a reusable, named solution to a recurring design problem. Learning them gives you ready-made options, helps you read other people's code faster and lets a team discuss design with a shared vocabulary.`,
          t: `Patterns are a shared vocabulary, not a checklist.` },
        { d: 'intermediate', q: `Explain the Observer pattern and name places you see it in real code.`,
          a: `A subject keeps a list of observers and notifies them when its state changes, so the two stay loosely coupled. You see it in DOM event listeners, Node's EventEmitter, Redux store subscriptions and RxJS streams.`,
          code: `class Subject {
  private listeners: Array<(v: number) => void> = [];
  subscribe(fn: (v: number) => void) { this.listeners.push(fn); }
  emit(v: number) { this.listeners.forEach((fn) => fn(v)); }
}`, lang: 'typescript',
          t: `Observer decouples who changes from who reacts.` },
        { d: 'senior', q: `Why is Singleton often called an anti-pattern, and what do you use instead?`,
          a: `A singleton is global state in disguise. It hides dependencies, makes tests share state and is hard to replace with a fake. Prefer creating one instance at the application root and passing it in with dependency injection, so the lifetime is controlled by a container and not by the class itself.`,
          t: `Share one instance through injection, not through a global.` },
      ],
    },
    {
      slug: 'git-version-control', title: 'Git & Branching Workflows', minutes: 6,
      summary: 'How Git stores history, when to merge or rebase, and how to recover from mistakes.',
      doc: `
## Overview

Git stores your project as a chain of snapshots called commits. A branch is just a movable label that points at a commit, which is why branching is cheap.

## Core concepts

- **Working tree, staging area, repository**: edit, then stage, then commit.
- **Merge** joins two histories with a merge commit.
- **Rebase** replays your commits on top of another branch for a straight history.
- **Remote**: a shared copy such as GitHub. Fetch downloads, pull is fetch plus merge.

## Example: everyday commands

~~~bash
git switch -c feature/login
git add -p
git commit -m 'Add login form'
git fetch origin
git rebase origin/main
git push -u origin feature/login
~~~

## Common workflows

- **Trunk-based**: short branches merged to main many times a day, backed by feature flags.
- **GitFlow**: long-lived develop and release branches. Heavier, suited to versioned releases.

> **Warning:** Never rebase commits that other people already pulled. Rewriting shared history forces everyone to repair their branches.
`,
      questions: [
        { d: 'beginner', q: `What is the difference between git fetch and git pull?`,
          a: `Fetch downloads new commits and updates remote tracking branches without touching your working files. Pull runs fetch and then merges (or rebases) the result into your current branch.`,
          t: `Pull equals fetch plus merge.` },
        { d: 'intermediate', q: `When would you merge and when would you rebase?`,
          a: `Rebase your own local feature branch onto main to keep a clean, linear history before opening a pull request. Merge when the branch is shared or when you want to preserve the exact history of how work came together. Never rebase public history.`,
          t: `Rebase private branches, merge shared ones.` },
        { d: 'senior', q: `A bad commit is already pushed to main. How do you undo it, and how do you recover a commit you think you lost?`,
          a: `On a shared branch use git revert, which adds a new commit that cancels the bad one and keeps history intact. For a lost commit, git reflog lists where HEAD has been, so you can find the hash and create a branch from it.`,
          cmd: `git revert abc1234
git reflog
git branch rescue abc1234`,
          t: `Revert on shared branches and use reflog to find lost work.` },
      ],
    },
    {
      slug: 'system-design-basics', title: 'System Design Basics', minutes: 7,
      summary: 'Scaling, caching, databases and the trade-offs behind every large system.',
      doc: `
## Overview

System design is choosing components and trade-offs so a system stays fast, available and affordable as it grows. Start every design by asking about requirements and scale.

## Core concepts

- **Vertical scaling** adds power to one machine. **Horizontal scaling** adds machines behind a load balancer.
- **Caching** keeps hot data close. Common patterns: cache-aside, write-through and TTL expiry.
- **Databases**: use SQL for relations and transactions, NoSQL for flexible schemas or huge write volume. Scale reads with replicas and writes with sharding.
- **Queues** decouple slow work from the request, for example sending email.
- **CAP theorem**: during a network partition you choose between consistency and availability.

## Example: request path

~~~text
Client -> CDN -> Load balancer -> App servers -> Cache -> Database
                                       |
                                       +-> Queue -> Workers
~~~

## Best practices

- Estimate load first: requests per second, data size, read to write ratio.
- Remove single points of failure and add health checks.
- Make operations idempotent so retries are safe.
`,
      questions: [
        { d: 'beginner', q: `What is the difference between horizontal and vertical scaling?`,
          a: `Vertical scaling makes one server bigger with more CPU or memory. It is simple but has a ceiling and a single point of failure. Horizontal scaling adds more servers and spreads traffic with a load balancer. It scales further but needs stateless services or shared state.`,
          t: `Scale up is simple, scale out is durable.` },
        { d: 'intermediate', q: `Describe common caching strategies and the hard part of caching.`,
          a: `Cache-aside loads data into the cache on a miss. Write-through updates cache and database together. Write-back writes to the cache first and flushes later. The hard part is invalidation: keeping cached data fresh. TTLs, explicit deletes on writes and versioned keys are the usual tools.`,
          t: `Cache invalidation is the real problem.` },
        { d: 'senior', q: `Design a URL shortener. What are the key decisions?`,
          a: `Generate a short unique ID, for example a base62 encoding of an auto-increment counter or a random 7 character key, and store it in a key-value store. Reads vastly outnumber writes, so put a cache in front and serve redirects with a 301 or 302. Plan for ID collisions, expiry, abuse protection and click analytics sent through a queue.`,
          t: `Unique IDs, read-heavy caching and async analytics.` },
      ],
    },
  ],
  automata: [
    {
      slug: 'context-free-languages', title: 'Context-Free Grammars & Pushdown Automata', minutes: 6,
      summary: 'The step beyond regular languages: nested structure, stacks and parsing.',
      doc: `
## Overview

Regular languages cannot count or match nested brackets. **Context-free grammars (CFGs)** can, and they describe the syntax of most programming languages.

## Core concepts

- A CFG has variables, terminals, rules and a start symbol. Example for balanced a and b: S gives aSb or empty.
- A **pushdown automaton (PDA)** is an NFA with a stack. It recognises exactly the context-free languages.
- A **parse tree** shows how a string is derived. A grammar is **ambiguous** if one string has two trees.

## The Chomsky hierarchy

| Type | Language class | Machine |
|---|---|---|
| 3 | Regular | Finite automaton |
| 2 | Context-free | Pushdown automaton |
| 1 | Context-sensitive | Linear bounded automaton |
| 0 | Recursively enumerable | Turing machine |

## Example

~~~text
S -> a S b | (empty)

S => aSb => aaSbb => aabb
~~~

> **Note:** Compilers use context-free grammars for parsing, which is why tools like yacc and ANTLR exist.
`,
      questions: [
        { d: 'beginner', q: `What is a context-free grammar?`,
          a: `A set of rules that rewrite one variable into a string of variables and terminals. Starting from the start symbol, repeated rewriting generates every string in the language. It can describe nested structure such as balanced parentheses.`,
          t: `CFGs generate languages with nested structure.` },
        { d: 'intermediate', q: `Why can a PDA recognise a^n b^n but a DFA cannot?`,
          a: `A DFA has finite memory, so it cannot remember an unbounded count of a's. A PDA pushes a symbol for every a and pops one for every b, so the stack provides the unbounded memory needed to compare the counts.`,
          t: `A stack gives unbounded counting.` },
        { d: 'senior', q: `Why does grammar ambiguity matter in compilers, and how is it handled?`,
          a: `An ambiguous grammar gives one program two parse trees, so it could have two meanings. Expression grammars are the usual case, such as 1 + 2 * 3. Fix it by rewriting the grammar with precedence levels, or by giving the parser generator explicit precedence and associativity rules. General CFG parsing with CYK runs in O(n cubed), so practical parsers use restricted grammars such as LL or LR.`,
          t: `Remove ambiguity with precedence, and use LL or LR for speed.` },
      ],
    },
    {
      slug: 'complexity-theory', title: 'Complexity Classes & Reductions', minutes: 6,
      summary: 'P, NP, NP-complete and the reductions that connect them.',
      doc: `
## Overview

Computability asks what can be solved. Complexity theory asks what can be solved **efficiently**. Efficient usually means polynomial time in the input size.

## Core concepts

- **P**: decision problems solvable in polynomial time.
- **NP**: problems whose proposed solutions can be verified in polynomial time.
- **NP-hard**: at least as hard as every problem in NP.
- **NP-complete**: in NP and NP-hard. SAT was the first, proven by Cook and Levin.
- A **reduction** converts problem A into problem B in polynomial time. If B is easy, A is easy.

## Proving a problem NP-complete

1. Show it is in NP by describing a polynomial time verifier.
2. Pick a known NP-complete problem and reduce it to your problem.

## Example problems

| Problem | Class |
|---|---|
| Sorting, shortest path | P |
| SAT, 3-SAT, Clique, Subset Sum | NP-complete |
| Halting problem | NP-hard, not in NP |

> **Note:** Whether P equals NP is the biggest open question in computer science. Most researchers believe they differ.
`,
      questions: [
        { d: 'beginner', q: `Explain P versus NP in plain words.`,
          a: `P is the set of problems we can solve quickly. NP is the set of problems where, if someone hands you an answer, you can check it quickly. P versus NP asks whether every problem that is quick to check is also quick to solve.`,
          t: `Quick to check versus quick to solve.` },
        { d: 'intermediate', q: `What is a polynomial time reduction and how do you use it to prove NP-completeness?`,
          a: `A reduction transforms every instance of problem A into an instance of problem B in polynomial time, so that the answers match. To prove B is NP-complete, show B is in NP and reduce a known NP-complete problem such as 3-SAT to B. That makes B at least as hard.`,
          t: `In NP plus a reduction from a known NP-complete problem.` },
        { d: 'senior', q: `What is the difference between NP-hard and NP-complete? Give an example of each.`,
          a: `NP-complete problems are both in NP and NP-hard. SAT is an example. NP-hard problems need not be in NP, so they may not even be decidable. The halting problem is NP-hard but not in NP because no algorithm decides it at all.`,
          t: `NP-complete means NP-hard and in NP.` },
      ],
    },
  ],
  dsa: [
    {
      slug: 'linear-structures', title: 'Linked Lists, Stacks & Queues', minutes: 6,
      summary: 'The linear building blocks behind undo, scheduling and graph search.',
      doc: `
## Overview

Linear structures store items in a sequence. They differ in how you add and remove items, and that shapes where each one fits.

## Core concepts

| Structure | Access rule | Typical use |
|---|---|---|
| Linked list | Follow pointers | Fast insert and delete in the middle |
| Stack | Last in, first out | Call stack, undo, bracket matching |
| Queue | First in, first out | Task scheduling, BFS |
| Deque | Both ends | Sliding window problems |

An array gives O(1) index access. A linked list gives O(1) insert after a known node but O(n) search.

## Example: reverse a linked list

~~~javascript
function reverse(head) {
  let prev = null;
  while (head) {
    const next = head.next;
    head.next = prev;
    prev = head;
    head = next;
  }
  return prev;
}
~~~

## Best practices

- Draw the pointers before you code. Most linked list bugs are lost references.
- Use a dummy head node to avoid special cases at the start of a list.
`,
      questions: [
        { d: 'beginner', q: `When would you choose a linked list over an array?`,
          a: `Choose a linked list when you insert or delete often in the middle and already hold the node, because no elements shift. Choose an array when you need fast index access and cache friendly iteration, which is most of the time.`,
          t: `Arrays win on access, lists win on cheap inserts.` },
        { d: 'intermediate', q: `Reverse a singly linked list in place.`,
          a: `Walk the list with three pointers: previous, current and next. At each step save next, point current back at previous, then move both forward. It runs in O(n) time and O(1) space.`,
          code: `function reverse(head) {
  let prev = null;
  while (head) {
    const next = head.next;
    head.next = prev;
    prev = head;
    head = next;
  }
  return prev;
}`, lang: 'javascript',
          t: `Three pointers, one pass, constant space.` },
        { d: 'senior', q: `How do you detect a cycle in a linked list using constant memory?`,
          a: `Use Floyd's tortoise and hare. Move a slow pointer one step and a fast pointer two steps. If they ever meet, there is a cycle. If the fast pointer reaches the end, there is none. It runs in O(n) time and O(1) space, unlike a hash set which needs O(n) space.`,
          code: `function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`, lang: 'javascript',
          t: `Two speeds meet inside a cycle.` },
      ],
    },
    {
      slug: 'sorting-searching', title: 'Sorting & Searching', minutes: 6,
      summary: 'The classic algorithms, their costs and how to choose between them.',
      doc: `
## Overview

Sorting puts data in order so that searching and many other tasks become faster. Interviews focus on the trade-offs, not on memorising code.

## Core concepts

| Algorithm | Average | Worst | Space | Stable |
|---|---|---|---|---|
| Insertion sort | O(n squared) | O(n squared) | O(1) | Yes |
| Merge sort | O(n log n) | O(n log n) | O(n) | Yes |
| Quick sort | O(n log n) | O(n squared) | O(log n) | No |
| Heap sort | O(n log n) | O(n log n) | O(1) | No |

A sort is **stable** if equal items keep their original order.

## Example: binary search

Binary search needs sorted input and runs in O(log n).

~~~javascript
function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
~~~

> **Tip:** Built in sorts are tuned and well tested. Write your own only when asked or when you need a special property.
`,
      questions: [
        { d: 'beginner', q: `What does binary search require and what is its complexity?`,
          a: `The data must be sorted. Each step halves the search range, so it takes O(log n) time and O(1) extra space when written as a loop.`,
          t: `Sorted input, logarithmic time.` },
        { d: 'intermediate', q: `Compare merge sort and quick sort.`,
          a: `Merge sort always runs in O(n log n), is stable and suits linked lists and external sorting, but needs O(n) extra space. Quick sort sorts in place with excellent cache behaviour and averages O(n log n), but its worst case is O(n squared) and it is not stable.`,
          t: `Merge sort is predictable, quick sort is fast in practice.` },
        { d: 'senior', q: `Why is quick sort often faster than merge sort in practice, and how do you avoid its worst case?`,
          a: `Quick sort works in place and touches memory sequentially, so it uses the CPU cache well and has small constants. The worst case appears with bad pivots, such as an already sorted array with a first element pivot. Avoid it with a random pivot, median of three, or introsort, which switches to heap sort if recursion gets too deep.`,
          t: `Good pivots keep quick sort at O(n log n).` },
      ],
    },
    {
      slug: 'dynamic-programming', title: 'Dynamic Programming & Greedy', minutes: 7,
      summary: 'Break problems into overlapping subproblems and know when greedy is enough.',
      doc: `
## Overview

Dynamic programming (DP) solves a problem by combining answers to smaller overlapping subproblems and storing each answer so it is computed once.

## Core concepts

- **Optimal substructure**: the best answer is built from best answers to subproblems.
- **Overlapping subproblems**: the same subproblem appears many times.
- **Memoization** is top down: recursion plus a cache. **Tabulation** is bottom up: fill a table in order.
- A **greedy** algorithm takes the best local choice each step. It is simpler and faster, but only correct for some problems.

## Example: minimum coins

~~~javascript
function minCoins(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
~~~

## Steps to solve a DP problem

1. Define the state. What does dp[i] mean?
2. Write the recurrence.
3. Set the base cases.
4. Choose the fill order and return the answer.
`,
      questions: [
        { d: 'beginner', q: `What is dynamic programming?`,
          a: `A technique that solves a problem by splitting it into overlapping subproblems, solving each once and storing the result. It turns exponential recursive solutions into polynomial ones.`,
          t: `Solve each subproblem once, then reuse it.` },
        { d: 'intermediate', q: `Find the minimum number of coins that make a given amount.`,
          a: `Let dp[a] be the fewest coins for amount a. For each amount try every coin and take the best of dp[a - coin] plus one. Start with dp[0] equals 0. It runs in O(amount times coins).`,
          code: `const dp = Array(amount + 1).fill(Infinity);
dp[0] = 0;
for (let a = 1; a <= amount; a++)
  for (const c of coins)
    if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);`, lang: 'javascript',
          t: `State, recurrence, base case, order.` },
        { d: 'senior', q: `How do you decide between greedy and dynamic programming? Give a case where greedy fails.`,
          a: `Greedy works when a local best choice is always part of a global best answer, which you must prove, usually with an exchange argument. If you cannot prove it, use DP. With coins 1, 3 and 4 and amount 6, greedy picks 4 plus 1 plus 1 for three coins, but the best is 3 plus 3 for two coins.`,
          t: `Greedy needs a proof, DP is the safe default.` },
      ],
    },
  ],
  'artificial-intelligence': [
    {
      slug: 'ml-fundamentals', title: 'Machine Learning Fundamentals', minutes: 6,
      summary: 'Learning paradigms, data splits, overfitting and the metrics that matter.',
      doc: `
## Overview

Machine learning builds models that learn patterns from data instead of following hand-written rules.

## Core concepts

- **Supervised learning** uses labelled data to predict a label (classification) or a number (regression).
- **Unsupervised learning** finds structure without labels, such as clustering.
- **Reinforcement learning** learns by trial, reward and penalty.
- Split data into **train**, **validation** and **test** sets. Tune on validation and report on test once.
- **Bias** is error from a model that is too simple. **Variance** is error from a model that is too sensitive to the training data.

## Metrics for classification

| Metric | Question it answers |
|---|---|
| Precision | Of the items flagged positive, how many were right? |
| Recall | Of all real positives, how many did we find? |
| F1 | Balance between precision and recall |

## Example

~~~python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestClassifier().fit(X_train, y_train)
print(model.score(X_test, y_test))
~~~
`,
      questions: [
        { d: 'beginner', q: `What is the difference between supervised and unsupervised learning?`,
          a: `Supervised learning trains on examples that include the correct answer, to predict labels or numbers. Unsupervised learning has no answers and looks for structure, such as groups of similar customers.`,
          t: `Labels or no labels.` },
        { d: 'intermediate', q: `Explain precision and recall and when each matters most.`,
          a: `Precision is true positives divided by everything predicted positive. Recall is true positives divided by everything that is actually positive. Favour precision when false alarms are costly, such as spam filters. Favour recall when missing a case is costly, such as cancer screening.`,
          t: `Precision avoids false alarms, recall avoids misses.` },
        { d: 'senior', q: `Why can accuracy mislead on imbalanced data, and what do you do about it?`,
          a: `If 99 percent of transactions are legitimate, a model that always predicts legitimate scores 99 percent accuracy and catches no fraud. Use precision, recall, F1 or PR-AUC, resample or weight the classes, and pick the decision threshold from the business cost of each error.`,
          t: `Pick metrics and thresholds that match the cost of errors.` },
      ],
    },
    {
      slug: 'ai-in-production', title: 'Shipping AI to Production', minutes: 6,
      summary: 'Evaluation, cost, latency, safety and monitoring for real AI features.',
      doc: `
## Overview

A good demo is not a product. Production AI needs measurement, guardrails and cost control, because model output is non-deterministic.

## Core concepts

- **Evaluation set**: a fixed list of inputs with expected qualities. Run it on every prompt or model change.
- **Guardrails**: input validation, output schemas, content filters and refusal rules.
- **Latency and cost**: stream tokens, cache repeated work, and route easy requests to smaller models.
- **Monitoring**: track quality scores, errors, token usage and drift over time.
- **Human in the loop**: route low confidence results to a person.

## Example: a tiny regression check

~~~typescript
const cases = [
  { input: 'Refund policy?', mustInclude: '30 days' },
  { input: 'Cancel my plan', mustInclude: 'settings' },
];

for (const c of cases) {
  const out = await generate(c.input);
  console.log(out.includes(c.mustInclude) ? 'PASS' : 'FAIL', c.input);
}
~~~

> **Warning:** Treat user text as untrusted. Never let model output trigger actions without validation.
`,
      questions: [
        { d: 'beginner', q: `Why do AI features need different testing from normal code?`,
          a: `Model output varies from run to run, so exact-match tests are not enough. You need evaluation sets, quality scoring and monitoring to know whether the feature is good and stays good.`,
          t: `Test AI by measuring quality, not exact output.` },
        { d: 'intermediate', q: `How do you evaluate an LLM feature?`,
          a: `Build a golden set of real inputs with expected properties. Score outputs with rules for hard facts, a second model as judge for style and relevance, and regular human review for calibration. Run it on every change to catch regressions, and track the same signals in production.`,
          t: `Golden set, automated scoring, human spot checks.` },
        { d: 'senior', q: `How would you cut the cost and latency of an LLM application?`,
          a: `Shorten prompts, cache repeated results, stream the response so users see text sooner and batch background work. Route simple requests to a smaller, cheaper model and reserve the large one for hard cases. Limit output tokens and measure cost per successful task, not per call.`,
          t: `Smaller models, caching, streaming and tight prompts.` },
      ],
    },
  ],
  'mern-stack': [
    {
      slug: 'javascript-essentials', title: 'JavaScript Essentials', minutes: 7,
      summary: 'Scope, closures, promises and the event loop: the base under every MERN app.',
      doc: `
## Overview

Almost every MERN interview starts with core JavaScript. These ideas explain why code behaves the way it does.

## Core concepts

- **let and const** are block scoped. **var** is function scoped and hoisted. Prefer const.
- A **closure** is a function that remembers variables from where it was created.
- **this** depends on how a function is called. Arrow functions keep the this of their surroundings.
- **Promises** represent a future value. **async and await** is syntax on top of promises.
- The **event loop** runs synchronous code first, then microtasks (promises), then macrotasks (timers).

## Example: closure

~~~javascript
function counter() {
  let count = 0;
  return () => ++count;
}

const next = counter();
next(); // 1
next(); // 2
~~~

## Example: async and await

~~~javascript
async function loadUser(id) {
  try {
    const res = await fetch('/api/users/' + id);
    if (!res.ok) throw new Error('Request failed');
    return await res.json();
  } catch (err) {
    console.error(err);
  }
}
~~~

> **Tip:** Use Promise.all to run independent requests together instead of awaiting them one by one.
`,
      questions: [
        { d: 'beginner', q: `What is the difference between var, let and const?`,
          a: `var is function scoped and hoisted with an undefined value. let and const are block scoped and cannot be used before their declaration. const prevents reassigning the variable but does not make objects immutable.`,
          t: `Prefer const, then let, avoid var.` },
        { d: 'intermediate', q: `What is a closure? Give a practical use.`,
          a: `A closure is a function bundled with the variables from the scope where it was created, so those variables stay alive after the outer function returns. It is used for private state, factory functions, memoization and event handlers.`,
          code: `function counter() {
  let count = 0;
  return () => ++count;
}`, lang: 'javascript',
          t: `Functions remember their birth scope.` },
        { d: 'senior', q: `Predict the output and explain the order.`,
          a: `The output is A, D, C, B. Synchronous logs run first (A and D). The promise callback is a microtask, so it runs next (C). The timer callback is a macrotask, so it runs after microtasks are drained (B), even with a zero delay.`,
          code: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');`, lang: 'javascript',
          t: `Sync, then microtasks, then macrotasks.` },
      ],
    },
    {
      slug: 'react-hooks-state', title: 'React Hooks & State', minutes: 7,
      summary: 'Components, state, effects and the rendering rules interviewers ask about.',
      doc: `
## Overview

React builds the screen from components. A component is a function that returns what should appear for the current **props** and **state**.

## Core concepts

- **Props** come from the parent and are read only. **State** is owned by the component and triggers a re-render when it changes.
- **useState** stores local state. **useReducer** suits complex transitions.
- **useEffect** runs side effects after render. List every value it uses in the dependency array and return a cleanup function when needed.
- **useMemo** and **useCallback** cache values and functions between renders. Use them for expensive work or stable references, not everywhere.
- **useRef** holds a mutable value that does not cause re-renders.
- Lists need stable **keys** so React can match items between renders.

## Example: a custom hook

~~~jsx
import { useEffect, useState } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
~~~

## Common mistakes

- Mutating state directly instead of creating a new object or array.
- Missing dependencies in useEffect, which causes stale values.
- Using the array index as a key in lists that reorder.
`,
      questions: [
        { d: 'beginner', q: `What is the difference between props and state?`,
          a: `Props are inputs passed from a parent and should not be changed by the child. State is data a component owns and updates itself. Changing state re-renders the component.`,
          t: `Props flow down, state lives inside.` },
        { d: 'intermediate', q: `How does the useEffect dependency array work, and why return a cleanup function?`,
          a: `The effect runs after the first render and again whenever a listed dependency changes. An empty array means run once. The cleanup runs before the next effect and on unmount, which is where you remove listeners, clear timers or cancel requests.`,
          code: `useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);`, lang: 'jsx',
          t: `List every dependency and clean up after yourself.` },
        { d: 'senior', q: `Why do components re-render and how do you reduce needless renders?`,
          a: `A component re-renders when its state or context changes, or when its parent renders. First measure with React DevTools. Then keep state close to where it is used, split large contexts, wrap expensive children in React.memo with stable props, and virtualise long lists.`,
          t: `Measure first, then localise state and memoise.` },
      ],
    },
    {
      slug: 'rest-api-auth', title: 'REST APIs & Authentication', minutes: 7,
      summary: 'Design clean HTTP APIs and secure them with tokens, hashing and sensible limits.',
      doc: `
## Overview

A REST API exposes resources over HTTP. Clear URLs, correct status codes and solid authentication make an API easy and safe to use.

## Core concepts

| Method | Use | Idempotent |
|---|---|---|
| GET | Read a resource | Yes |
| POST | Create a resource | No |
| PUT | Replace a resource | Yes |
| PATCH | Update part of a resource | Usually |
| DELETE | Remove a resource | Yes |

Common status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Too Many Requests, 500 Server Error.

## Authentication

- **Sessions** store state on the server and send a cookie.
- **JWT** is a signed token the client sends in each request. It is stateless, but hard to revoke.
- Always hash passwords with bcrypt or argon2. Never store plain text.

## Example: JWT middleware

~~~javascript
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
~~~

> **Warning:** Validate every input on the server, enable CORS only for your own origins and rate limit login routes.
`,
      questions: [
        { d: 'beginner', q: `What is the difference between PUT and PATCH, and what does idempotent mean?`,
          a: `PUT replaces the whole resource and PATCH changes only some fields. An operation is idempotent if repeating it gives the same result as doing it once. PUT and DELETE are idempotent, POST is not.`,
          t: `Idempotent means safe to retry.` },
        { d: 'intermediate', q: `Compare JWT and session cookies.`,
          a: `Sessions keep state on the server, so they are easy to revoke but need shared storage when you scale. JWTs are signed and self-contained, so servers stay stateless, but you cannot easily revoke one before it expires. Pick sessions for simple web apps and JWTs for APIs and multiple services.`,
          t: `Sessions revoke easily, JWTs scale statelessly.` },
        { d: 'senior', q: `How do you secure a JWT based API?`,
          a: `Use short lived access tokens with refresh token rotation, store refresh tokens in httpOnly secure cookies, and protect against CSRF where cookies are used. Hash passwords with bcrypt or argon2, validate input, set strict CORS, rate limit login, use HTTPS only and keep secrets out of the code. Keep a revocation list for sensitive cases.`,
          t: `Short tokens, safe storage, rotation and rate limits.` },
      ],
    },
  ],
  'react-native': [
    {
      slug: 'rn-navigation-expo', title: 'Navigation, Expo & Project Setup', minutes: 6,
      summary: 'Start a project the modern way and move between screens with React Navigation.',
      doc: `
## Overview

Most new React Native apps start with **Expo**, a toolkit that handles builds, native modules and updates. **React Navigation** is the standard library for moving between screens.

## Core concepts

- **Expo managed workflow**: Expo handles the native projects for you. You can still add custom native code through development builds.
- **Bare workflow**: you own the iOS and Android projects directly.
- **Stack navigator**: screens pushed on top of each other. **Tab navigator**: a bottom bar of sections.
- Navigators can be nested, and screens receive **params**.

## Example: start a project

~~~bash
npx create-expo-app my-app
cd my-app
npx expo start
~~~

## Example: a stack navigator

~~~jsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Details" component={Details} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
~~~
`,
      questions: [
        { d: 'beginner', q: `What is the difference between Expo and bare React Native?`,
          a: `Expo gives you a managed toolchain with ready-made modules, cloud builds and over the air updates, so you rarely touch native code. Bare React Native gives full control of the iOS and Android projects but you maintain them yourself. Development builds let Expo apps include custom native modules.`,
          t: `Expo for speed, bare for full native control.` },
        { d: 'intermediate', q: `How does navigation work in React Navigation?`,
          a: `You declare navigators such as stack or tabs and register screens by name. Call navigation.navigate with a name and params to move, and read params through the route prop. Navigators can nest, for example tabs inside a stack.`,
          code: `navigation.navigate('Details', { id: 42 });
// in Details
const { id } = route.params;`, lang: 'jsx',
          t: `Declare screens, navigate by name, pass params.` },
        { d: 'senior', q: `How do you handle an authentication flow and deep links?`,
          a: `Render different navigators based on auth state, so logged out users only see the sign in stack and the app stack mounts after login. For deep links, configure a linking prefix and a screen path map, handle universal links on iOS and app links on Android, and make protected screens redirect to sign in then return to the original target.`,
          t: `Switch navigators on auth state and map links to screens.` },
      ],
    },
    {
      slug: 'rn-performance-release', title: 'Performance, Debugging & Releasing', minutes: 6,
      summary: 'Keep apps smooth, test them and ship updates safely.',
      doc: `
## Overview

Mobile users notice dropped frames and slow starts quickly. Performance work is about keeping the JavaScript thread free and rendering only what changed.

## Core concepts

- **Hermes** is the default JavaScript engine. It starts faster and uses less memory.
- Avoid unnecessary re-renders with React.memo, stable callbacks and good list keys.
- Optimise images: right sizes, caching and modern formats.
- Move heavy work off the JS thread with native modules or background tasks.
- Debug with React DevTools, the performance monitor and the built in logs.
- Test with **Jest** and **React Native Testing Library**, and with **Detox** or **Maestro** for end to end flows.

## Releasing

~~~bash
# build store binaries in the cloud
eas build --platform all
# ship a JavaScript only fix over the air
eas update --branch production
~~~

> **Note:** Over the air updates can change JavaScript and assets only. Native code changes need a new store release.
`,
      questions: [
        { d: 'beginner', q: `What is Hermes and why does it matter?`,
          a: `Hermes is a JavaScript engine built for React Native. It precompiles code to bytecode, which gives faster app start, lower memory use and smaller apps.`,
          t: `Hermes means faster starts and lighter apps.` },
        { d: 'intermediate', q: `A list feels janky. How do you find and fix the problem?`,
          a: `Profile first with the performance monitor and React DevTools. Use FlatList with keyExtractor, memoise row components, avoid inline functions and heavy work in renderItem, set getItemLayout for fixed rows, resize images and tune windowSize and initialNumToRender.`,
          t: `Profile, memoise rows, virtualise and shrink images.` },
        { d: 'senior', q: `Describe a safe release strategy for a React Native app.`,
          a: `Build with CI and EAS, run unit and end to end tests, then release to internal testers, then a staged store rollout of a few percent. Use over the air updates for JavaScript fixes, with channels and rollbacks. Monitor crashes with a service such as Sentry and halt the rollout on regressions.`,
          cmd: `eas build --platform all --profile production
eas update --branch production --message 'Fix checkout crash'`,
          t: `Staged rollouts, OTA for JS fixes, crash monitoring.` },
      ],
    },
  ],
  python: [
    {
      slug: 'async-concurrency', title: 'Concurrency: Threads, Processes & asyncio', minutes: 7,
      summary: 'Pick the right tool for I/O heavy and CPU heavy work.',
      doc: `
## Overview

Concurrency means making progress on many tasks at once. The right tool depends on what the tasks wait for.

## Core concepts

| Tool | Best for | Notes |
|---|---|---|
| asyncio | Many network or file waits | One thread, cooperative, needs async libraries |
| threading | Blocking I/O with sync libraries | Limited by the GIL for CPU work |
| multiprocessing | CPU heavy work | Separate processes, real parallelism |
| concurrent.futures | Simple pools for threads or processes | Clean high level API |

## Example: run requests concurrently

~~~python
import asyncio
import httpx

async def fetch(client, url):
    r = await client.get(url)
    return r.status_code

async def main(urls):
    async with httpx.AsyncClient() as client:
        return await asyncio.gather(*(fetch(client, u) for u in urls))

asyncio.run(main(['https://example.com'] * 5))
~~~

> **Tip:** Never call blocking code inside an async function. Use run_in_executor to push it to a thread.
`,
      questions: [
        { d: 'beginner', q: `What is asyncio good for?`,
          a: `Handling many I/O waits, such as network calls, on a single thread. While one task waits, the event loop runs another. It does not speed up CPU heavy work.`,
          t: `asyncio is for waiting, not for computing.` },
        { d: 'intermediate', q: `Why is asyncio.gather faster than awaiting calls one after another?`,
          a: `Awaiting sequentially waits for each call to finish before starting the next. gather starts all the coroutines so their waits overlap, and total time is close to the slowest call instead of the sum.`,
          code: `results = await asyncio.gather(fetch(a), fetch(b), fetch(c))`, lang: 'python',
          t: `gather overlaps the waiting.` },
        { d: 'senior', q: `How do you choose between threads, processes and asyncio?`,
          a: `Thousands of network connections: asyncio. Blocking libraries that have no async version: a thread pool. CPU heavy computation: multiprocessing or native extensions to avoid the GIL. Mixed workloads: asyncio for the I/O with run_in_executor for blocking or CPU parts.`,
          t: `Match the tool to what the task waits on.` },
      ],
    },
    {
      slug: 'python-testing-packaging', title: 'Testing, Typing & Environments', minutes: 6,
      summary: 'Keep projects reproducible, tested and easier to maintain.',
      doc: `
## Overview

Professional Python work needs isolated environments, automated tests and clear types.

## Core concepts

- A **virtual environment** keeps each project's packages separate.
- **pytest** finds tests automatically, uses plain asserts and offers **fixtures** for shared setup.
- **Type hints** document intent and let tools such as mypy find bugs before running the code.
- **dataclasses** remove boilerplate for classes that mostly hold data.

## Example: environment

~~~bash
python -m venv .venv
source .venv/bin/activate
pip install pytest
pytest -q
~~~

## Example: fixtures and parametrize

~~~python
import pytest

@pytest.fixture
def cart():
    return {'items': []}

@pytest.mark.parametrize('a,b,total', [(1, 2, 3), (5, 5, 10)])
def test_add(a, b, total):
    assert a + b == total
~~~
`,
      questions: [
        { d: 'beginner', q: `Why use virtual environments?`,
          a: `They isolate dependencies per project, so different projects can use different package versions without conflict and the project can be reproduced elsewhere from a requirements file.`,
          cmd: `python -m venv .venv
source .venv/bin/activate`,
          t: `One environment per project.` },
        { d: 'intermediate', q: `How do pytest fixtures and parametrize help?`,
          a: `Fixtures provide reusable setup and teardown that tests receive by name. Parametrize runs one test with many input sets, which reduces duplication and gives each case its own result.`,
          code: `@pytest.mark.parametrize('n,expected', [(2, 4), (3, 9)])
def test_square(n, expected):
    assert n * n == expected`, lang: 'python',
          t: `Reuse setup and run many cases from one test.` },
        { d: 'senior', q: `Python does not enforce type hints at runtime. Why use them?`,
          a: `Static checkers such as mypy and editors use them to catch bugs, power autocomplete and make refactors safer. They also document function contracts for the team. Libraries like Pydantic and FastAPI can additionally validate data at runtime from the same hints.`,
          t: `Hints cost little and catch bugs early.` },
      ],
    },
  ],
  'flask-django': [
    {
      slug: 'django-fundamentals', title: 'Django Fundamentals', minutes: 7,
      summary: 'Project layout, the request lifecycle, migrations and the built in admin.',
      doc: `
## Overview

Django is a batteries included framework. It ships with an ORM, authentication, an admin site, forms and security defaults.

## Core concepts

- Django follows **MTV**: Model (data), Template (HTML) and View (logic).
- A **project** holds settings. An **app** is a reusable module inside it.
- **Migrations** record model changes as versioned files that update the database.
- **Middleware** wraps every request and response, for example sessions and CSRF protection.
- The **admin** gives you a working back office from your models.

## Example: start a project

~~~bash
django-admin startproject shop
cd shop
python manage.py startapp catalog
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
~~~

## Example: model and view

~~~python
from django.db import models
from django.http import JsonResponse

class Product(models.Model):
    name = models.CharField(max_length=120)
    price = models.DecimalField(max_digits=8, decimal_places=2)

def product_list(request):
    return JsonResponse(list(Product.objects.values('id', 'name', 'price')), safe=False)
~~~
`,
      questions: [
        { d: 'beginner', q: `Explain Django's MTV pattern.`,
          a: `Model defines data and database access. Template renders HTML. View receives the request, uses models and returns a response, often by choosing a template. It maps closely to MVC where the Django framework itself acts as the controller.`,
          t: `Model, Template, View.` },
        { d: 'intermediate', q: `How do migrations work?`,
          a: `makemigrations compares your models to the last migration state and writes a new migration file. migrate applies unapplied migrations to the database in order and records them. This keeps schema changes versioned and repeatable across environments.`,
          cmd: `python manage.py makemigrations
python manage.py migrate`,
          t: `Migrations are version control for your schema.` },
        { d: 'senior', q: `Describe the Django request lifecycle and the role of middleware.`,
          a: `The web server hands the request to Django, which runs middleware from top to bottom, resolves the URL to a view, runs the view, then passes the response back up through the middleware in reverse order. Middleware handles cross cutting concerns such as sessions, authentication, CSRF and security headers, so order matters.`,
          t: `Middleware wraps the view on the way in and out.` },
      ],
    },
  ],
  docker: [
    {
      slug: 'docker-security-registries', title: 'Security, Registries & Tagging', minutes: 6,
      summary: 'Ship trusted images: scan them, version them and keep secrets out.',
      doc: `
## Overview

An image is software you run with privileges, so treat it like any other supply chain. Build small, scan often and publish with clear versions.

## Core concepts

- Run as a **non-root user** and use a read only filesystem where possible.
- **Scan images** for known vulnerabilities in CI.
- A **registry** stores images. Examples: Docker Hub, GitHub Container Registry, Amazon ECR.
- **Tags** are movable labels. A **digest** is an immutable content hash. Production should pin versions or digests.
- Never copy **secrets** into an image layer. Layers keep history.

## Example: publish an image

~~~bash
docker build -t myorg/api:1.4.2 .
docker login
docker push myorg/api:1.4.2
docker pull myorg/api@sha256:3f1a...
~~~

## Example: safer Dockerfile lines

~~~dockerfile
FROM node:20-alpine
RUN addgroup -S app && adduser -S app -G app
USER app
~~~
`,
      questions: [
        { d: 'beginner', q: `What is a container registry?`,
          a: `A service that stores and distributes container images. You push images to it from CI and pull them onto servers. Docker Hub is public, while ECR and GitHub Container Registry integrate with cloud accounts and access control.`,
          t: `A registry is a package store for images.` },
        { d: 'intermediate', q: `Why avoid the latest tag in production, and what is a digest?`,
          a: `latest is only a label that moves, so two deployments can run different code. Use explicit version tags, or better a digest, which is a hash of the exact image content and never changes.`,
          t: `Pin versions or digests for repeatable deploys.` },
        { d: 'senior', q: `How should secrets be handled with containers?`,
          a: `Never bake secrets into images or commit them. For builds use BuildKit secret mounts, which are not stored in layers. At runtime inject secrets through the orchestrator, such as Kubernetes Secrets or a secret manager, and prefer short lived credentials and least privilege roles.`,
          cmd: `docker build --secret id=npm,src=.npmrc -t myorg/api:1.4.2 .`,
          t: `Secrets belong to the runtime, not the image.` },
      ],
    },
    {
      slug: 'docker-in-production', title: 'Running Containers in Production', minutes: 6,
      summary: 'Health checks, limits, logging and graceful shutdown.',
      doc: `
## Overview

Running a container in production means it must restart on failure, stay within resource limits, report health and stop cleanly.

## Core concepts

- **Restart policies** bring containers back after crashes.
- **Resource limits** stop one container starving the host.
- **Health checks** tell the platform whether the app can serve traffic.
- **Logging**: write to stdout and stderr and let the platform collect logs.
- **Graceful shutdown**: handle SIGTERM, finish requests and exit. The main process should run as PID 1 in exec form.
- Keep **one main process** per container.

## Example

~~~bash
docker run -d --name api --restart unless-stopped --memory 512m --cpus 1 -p 4000:4000 myorg/api:1.4.2
~~~

~~~yaml
services:
  api:
    image: myorg/api:1.4.2
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:4000/health"]
      interval: 15s
      retries: 3
    stop_grace_period: 30s
~~~
`,
      questions: [
        { d: 'beginner', q: `What are Docker restart policies?`,
          a: `They tell Docker when to restart a stopped container: no, on-failure, always and unless-stopped. unless-stopped is a common production choice because the container returns after a reboot unless you stopped it yourself.`,
          t: `Pick unless-stopped for long running services.` },
        { d: 'intermediate', q: `What does a HEALTHCHECK do and how is it different from a readiness probe?`,
          a: `HEALTHCHECK runs a command periodically and marks the container healthy or unhealthy. In Kubernetes, a liveness probe restarts a stuck container and a readiness probe decides whether it receives traffic. A container can be alive but not ready.`,
          t: `Health shows life, readiness controls traffic.` },
        { d: 'senior', q: `Why does graceful shutdown matter and what breaks it in containers?`,
          a: `On deploy the platform sends SIGTERM, then kills the container after a grace period. The app must stop accepting new requests, finish in-flight work and close connections. It breaks when the app is not PID 1, for example when a shell wrapper swallows the signal. Use the exec form of CMD or a small init such as tini.`,
          code: `CMD ["node", "dist/main.js"]`, lang: 'dockerfile',
          t: `Handle SIGTERM and run the app as PID 1.` },
      ],
    },
  ],
  'devops-cloud': [
    {
      slug: 'linux-networking', title: 'Linux & Networking Essentials', minutes: 7,
      summary: 'The commands and network concepts behind every deployment.',
      doc: `
## Overview

Servers run Linux and talk over networks, so you need a working knowledge of both to debug real problems.

## Core concepts

- **Permissions**: read (4), write (2) and execute (1) for owner, group and others. chmod 755 gives the owner full access and others read and execute.
- **Processes and services**: inspect with ps and top, manage with systemd.
- **DNS** turns names into IP addresses. **TCP** gives reliable delivery. **TLS** encrypts traffic. **HTTP** carries the request.
- A **port** identifies a service on a host, such as 443 for HTTPS.

## Everyday commands

~~~bash
# who is listening on which port
ss -tulpn
# follow a service log
journalctl -u nginx -f
# test a URL and show timing
curl -s -o /dev/null -w '%{http_code} %{time_total}s' https://example.com
# resolve DNS
dig +short example.com
~~~

> **Tip:** When something is down, work from the bottom up: network, DNS, port, process, application.
`,
      questions: [
        { d: 'beginner', q: `What does chmod 755 mean?`,
          a: `The owner gets read, write and execute (7). The group and others get read and execute (5). It is common for scripts and directories that everyone must be able to run or enter but only the owner may change.`,
          t: `7 is rwx, 5 is r-x.` },
        { d: 'intermediate', q: `What happens when you type a URL into a browser?`,
          a: `The browser resolves the domain to an IP address with DNS, opens a TCP connection, performs a TLS handshake for HTTPS, sends an HTTP request and receives the response. It then parses the HTML, loads other resources and renders the page.`,
          t: `DNS, TCP, TLS, HTTP, render.` },
        { d: 'senior', q: `A website is slow or unreachable. How do you troubleshoot from the command line?`,
          a: `Check DNS with dig, connectivity with ping or traceroute, and the port with curl or nc. Look at response timing with curl -w to see where time goes. On the server check ss for listeners, top for CPU and memory, df for disk, and journalctl or the app logs for errors.`,
          cmd: `dig +short example.com
curl -s -o /dev/null -w '%{time_namelookup} %{time_connect} %{time_starttransfer}' https://example.com
ss -tulpn
top`,
          t: `Work layer by layer and measure each step.` },
      ],
    },
    {
      slug: 'infrastructure-as-code', title: 'Infrastructure as Code with Terraform', minutes: 7,
      summary: 'Describe cloud resources in files, review the plan and apply it safely.',
      doc: `
## Overview

Infrastructure as Code (IaC) manages servers, networks and databases with versioned files instead of manual clicks. You get review, history and repeatability.

## Core concepts

- **Declarative**: you describe the desired end state and the tool works out the steps.
- **Terraform state** maps your code to real resources. Store it remotely with locking when working in a team.
- **plan** shows what will change. **apply** makes the change.
- **Modules** package reusable infrastructure.
- **Ansible** configures what runs on servers. Terraform provisions the servers themselves.

## Example

~~~hcl
resource "aws_s3_bucket" "assets" {
  bucket = "talent-scout-assets"
}

output "bucket_name" {
  value = aws_s3_bucket.assets.id
}
~~~

~~~bash
terraform init
terraform plan -out tfplan
terraform apply tfplan
~~~

> **Warning:** Always read the plan. A changed name can mean destroy and recreate, which deletes data.
`,
      questions: [
        { d: 'beginner', q: `What is Infrastructure as Code and why use it?`,
          a: `It means defining infrastructure in code files that live in version control. You get repeatable environments, code review for infrastructure changes, audit history and fast recovery.`,
          t: `Infrastructure you can review, repeat and roll back.` },
        { d: 'intermediate', q: `What is Terraform state and why use remote state with locking?`,
          a: `State records which real resources Terraform manages. A shared remote backend, such as S3 with DynamoDB or Terraform Cloud, lets the team use one source of truth, and locking stops two people applying at once and corrupting state.`,
          cmd: `terraform init
terraform plan -out tfplan
terraform apply tfplan`,
          t: `Share state remotely and lock it.` },
        { d: 'senior', q: `How do you make production infrastructure changes safely, and handle drift?`,
          a: `Review every plan in pull requests, apply from CI with least privilege credentials, split state by environment and use modules. Protect critical resources with prevent_destroy. Detect drift by running plan on a schedule and fix the cause, either by importing the manual change or reverting it.`,
          t: `Plan in review, apply from CI, detect drift on a schedule.` },
      ],
    },
    {
      slug: 'observability', title: 'Monitoring & Observability', minutes: 6,
      summary: 'Metrics, logs, traces, SLOs and alerts that wake you for the right reasons.',
      doc: `
## Overview

Monitoring tells you that something is wrong. Observability gives you enough data to find out why without shipping new code.

## Core concepts

- **Metrics**: numbers over time such as request rate.
- **Logs**: detailed events. Prefer structured JSON logs.
- **Traces**: the path of one request across services.
- The **four golden signals**: latency, traffic, errors and saturation.
- An **SLI** is a measurement, an **SLO** is the target and the **error budget** is the allowed failure.

## Example: an SLO

~~~text
SLI: percentage of requests under 300 ms with status below 500
SLO: 99.5 percent over 30 days
Error budget: 0.5 percent, about 3.6 hours of bad service per month
~~~

## Best practices

- Alert on symptoms users feel, such as error rate, not on every cause.
- Every alert should need a human action and link to a runbook.
- Use dashboards for investigation and alerts for notification.

> **Note:** Prometheus collects metrics, Grafana draws dashboards and OpenTelemetry standardises traces and metrics.
`,
      questions: [
        { d: 'beginner', q: `What is the difference between monitoring and observability?`,
          a: `Monitoring watches known signals and alerts when they cross a threshold. Observability means the system exposes enough metrics, logs and traces that you can ask new questions and find the cause of problems you did not predict.`,
          t: `Monitoring detects, observability explains.` },
        { d: 'intermediate', q: `What are the four golden signals?`,
          a: `Latency (how long requests take), traffic (how much demand), errors (how many requests fail) and saturation (how full your resources are). Together they give a quick health picture of almost any service.`,
          t: `Latency, traffic, errors, saturation.` },
        { d: 'senior', q: `How do you set SLOs and use error budgets?`,
          a: `Choose an SLI users care about, such as the share of fast successful requests, and set an SLO from user needs and cost. The error budget is the allowed failure. While budget remains, ship features. When it is spent, prioritise reliability work. Alert on fast budget burn rather than on single spikes.`,
          t: `Error budgets balance speed and reliability.` },
      ],
    },
  ],
};
