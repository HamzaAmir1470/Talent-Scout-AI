import { SeedSubject } from './types';

const G = 'Core CS & AI';

export const core: SeedSubject[] = [
  {
    slug: 'software-engineering', name: 'Software Engineering', icon: 'Layers', accent: '#8b5cf6', group: G,
    description: 'Design principles, agile delivery, testing and the habits that keep large codebases healthy.',
    topics: [
      {
        slug: 'solid-principles', title: 'SOLID & Clean Design', minutes: 6,
        summary: 'Five design rules that keep classes small, flexible and easy to test.',
        doc: `
## Why SOLID matters

SOLID is a set of five habits that make object oriented code easier to change. Interviewers use it to check whether you can design, not just code.

| Letter | Rule | One line summary |
|---|---|---|
| S | Single Responsibility | A class has one reason to change |
| O | Open / Closed | Extend behaviour without editing old code |
| L | Liskov Substitution | Subtypes must work wherever the parent works |
| I | Interface Segregation | Prefer small, focused interfaces |
| D | Dependency Inversion | Depend on abstractions, not concrete classes |

## Dependency Inversion in practice

The high level service below never knows which mailer it uses. You can swap it in tests.

~~~typescript
interface Mailer { send(to: string, body: string): Promise<void>; }

class SmtpMailer implements Mailer {
  async send(to: string, body: string) { /* talk to SMTP */ }
}

class SignupService {
  constructor(private readonly mailer: Mailer) {}
  async register(email: string) {
    // ...create the user, then
    await this.mailer.send(email, 'Welcome aboard');
  }
}

// production
new SignupService(new SmtpMailer());
// test
new SignupService({ send: async () => {} });
~~~

> Rules of thumb are not laws. Apply a principle when it removes pain you can actually point to.
`,
        questions: [
          { d: 'beginner', q: `What does the Single Responsibility Principle mean?`,
            a: `A class or module should have one reason to change. If a class both formats a report and saves it to disk, a change in the format or a change in the storage will each force an edit. Splitting them keeps each change small and local.`,
            t: `One class, one reason to change.` },
          { d: 'intermediate', q: `Explain the Liskov Substitution Principle with an example.`,
            a: `Code that works with a base type must keep working when you pass any subtype. The classic breach is a Square that extends Rectangle. Setting the width of a Square also changes the height, so code that expects independent sides now gives wrong results.`,
            code: `class Rectangle { constructor(public w: number, public h: number) {} area() { return this.w * this.h; } }
class Square extends Rectangle {
  set width(v: number) { this.w = v; this.h = v; } // surprises callers
}`, lang: 'typescript',
            t: `A subtype must honour the promises of its parent.` },
          { d: 'senior', q: `How do you apply Dependency Inversion in NestJS, and when does it become over-engineering?`,
            a: `Define an abstraction (an interface or abstract class) and bind an implementation to an injection token in the module. Consumers inject the token, so tests can supply a fake. It becomes over-engineering when there is only one implementation and no realistic second one, because the extra layer adds indirection with no payoff.`,
            code: `@Module({
  providers: [{ provide: 'MAILER', useClass: SmtpMailer }, SignupService],
})
export class SignupModule {}

@Injectable()
export class SignupService {
  constructor(@Inject('MAILER') private readonly mailer: Mailer) {}
}`, lang: 'typescript',
            t: `Invert dependencies at boundaries that really vary, such as I/O.` },
        ],
      },
      {
        slug: 'agile-testing', title: 'SDLC, Agile & Testing', minutes: 5,
        summary: 'How teams plan, ship and verify software without breaking production.',
        doc: `
## The software lifecycle

Every project moves through requirements, design, build, test, release and maintenance. **Waterfall** runs these phases once in order. **Agile** repeats them in short cycles so feedback arrives early.

## The testing pyramid

Write many fast tests at the bottom and few slow tests at the top.

1. **Unit tests** check one function or class in isolation. They run in milliseconds.
2. **Integration tests** check that modules work together, for example a service with a real database.
3. **End to end tests** drive the whole app like a user. They are slow and fragile, so keep them few.

~~~javascript
// a small, fast unit test (Jest)
test('applies a 10 percent discount', () => {
  expect(applyDiscount(200, 0.1)).toBe(180);
});
~~~

> A failing test should tell you what broke in under a minute.
`,
        questions: [
          { d: 'beginner', q: `What is the difference between Agile and Waterfall?`,
            a: `Waterfall plans everything up front and delivers once at the end, so changes are expensive. Agile delivers small increments in short sprints and adapts to feedback. Agile suits changing requirements, while Waterfall suits fixed, well understood scope such as regulated hardware work.`,
            t: `Waterfall plans once, Agile learns continuously.` },
          { d: 'intermediate', q: `What is the testing pyramid and why is its shape important?`,
            a: `It shows the ideal mix of tests: many unit tests, fewer integration tests and very few end to end tests. Lower level tests are fast, cheap and pinpoint failures. Top level tests are slow and flaky. An inverted pyramid gives slow feedback and a painful suite.`,
            t: `Push checks as low in the pyramid as you can.` },
          { d: 'senior', q: `How do you decide when to pay down technical debt?`,
            a: `Treat debt like a loan. Pay it down when the interest is high, meaning it slows the team on code they touch often, causes incidents or blocks a planned feature. Make it visible with a backlog and size it. Reserve a steady slice of each sprint and tie big refactors to feature work so the business sees the value.`,
            t: `Fix debt where you pay interest every week.` },
        ],
      },
    ],
  },
  {
    slug: 'automata', name: 'Automata & Computation', icon: 'Cpu', accent: '#06b6d4', group: G,
    description: 'Finite automata, regular languages, Turing machines and the limits of computation.',
    topics: [
      {
        slug: 'finite-automata', title: 'DFA, NFA & Regular Languages', minutes: 6,
        summary: 'The simplest machines of computation and the languages they recognise.',
        doc: `
## What is a finite automaton?

A finite automaton reads a string one symbol at a time and moves between a fixed set of states. If it ends in an **accepting state**, the string belongs to the language.

- **DFA**: exactly one move for each state and symbol.
- **NFA**: may have several moves, or none, and may use epsilon moves.
- Both recognise exactly the **regular languages**, the same ones regular expressions describe.

## Example: even number of zeros

A two state DFA tracks whether the zero count so far is even or odd.

~~~javascript
const delta = {
  even: { '0': 'odd',  '1': 'even' },
  odd:  { '0': 'even', '1': 'odd'  },
};

function accepts(input) {
  let state = 'even';
  for (const ch of input) state = delta[state][ch];
  return state === 'even';
}

accepts('1001'); // true  (two zeros)
accepts('0111'); // false (one zero)
~~~

> Finite memory is the key limit. A DFA cannot count to an unbounded number.
`,
        questions: [
          { d: 'beginner', q: `What is the difference between a DFA and an NFA?`,
            a: `A DFA has exactly one next state for every state and input symbol. An NFA can have several next states, none at all, or epsilon moves, and accepts if any path reaches an accepting state. They recognise the same class of languages.`,
            t: `NFAs are easier to write, DFAs are easier to run.` },
          { d: 'intermediate', q: `How do you use the pumping lemma, and what can it prove?`,
            a: `Assume the language is regular and take the pumping length p. Pick a string of length at least p, split it as xyz with y non empty and xy no longer than p, then show some repetition of y leaves the language. That contradiction proves the language is not regular. The lemma can only disprove regularity, never prove it.`,
            t: `Pumping lemma proves non-regularity only.` },
          { d: 'senior', q: `Are NFAs more powerful than DFAs? What does conversion cost?`,
            a: `No, they accept the same languages. The subset construction turns an NFA with n states into a DFA with up to 2 to the power n states, because each DFA state stands for a set of NFA states. That blow up is real for some languages, so NFAs can be exponentially more compact.`,
            t: `Same power, exponential gap in size.` },
        ],
      },
      {
        slug: 'turing-machines', title: 'Turing Machines & Decidability', minutes: 6,
        summary: 'A model of general computation and the problems no program can solve.',
        doc: `
## The Turing machine

A Turing machine has an infinite tape, a head that reads and writes one cell, and a finite set of states. Despite its simplicity it can compute anything a modern computer can. This claim is the **Church-Turing thesis**.

## Decidable or not

- A language is **decidable** if some machine always halts with yes or no.
- It is **recognisable** if a machine accepts every member but may loop on others.
- The **halting problem** asks whether a program stops on a given input. It is undecidable.

## Complexity classes

| Class | Meaning |
|---|---|
| P | Solvable in polynomial time |
| NP | A proposed answer can be checked in polynomial time |
| NP-complete | The hardest problems in NP |

> Whether P equals NP is still open and carries a million dollar prize.
`,
        questions: [
          { d: 'beginner', q: `What is a Turing machine?`,
            a: `It is a mathematical model with an infinite tape, a read and write head and a finite control. At each step it reads a symbol, writes a symbol, moves left or right and changes state. It models what any algorithm can compute.`,
            t: `Tape plus states equals general computation.` },
          { d: 'intermediate', q: `Sketch why the halting problem is undecidable.`,
            a: `Suppose a decider H(P, x) tells whether program P halts on x. Build a program D that runs H(D, D) and then does the opposite: it loops if H says it halts, and halts if H says it loops. Running D on itself is a contradiction, so H cannot exist.`,
            t: `Diagonalisation makes a program that contradicts the decider.` },
          { d: 'senior', q: `What does NP-complete mean, and what follows if one such problem is solved fast?`,
            a: `A problem is NP-complete if it is in NP and every NP problem reduces to it in polynomial time. A polynomial time algorithm for any one of them would give one for all of NP, which would prove P equals NP. In practice we use heuristics, approximation and special cases for these problems.`,
            t: `Solve one NP-complete problem fast and you solve them all.` },
        ],
      },
    ],
  },
  {
    slug: 'dsa', name: 'Data Structures & Algorithms', icon: 'GitBranch', accent: '#22c55e', group: G,
    description: 'Complexity analysis, hashing, trees and graphs: the core of every coding interview.',
    topics: [
      {
        slug: 'complexity-hashing', title: 'Big O, Arrays & Hashing', minutes: 6,
        summary: 'Measure cost, then trade memory for speed with hash maps.',
        doc: `
## Reading Big O

Big O describes how running time grows as input size n grows. It ignores constants and keeps the dominant term.

| Operation | Array | Hash map |
|---|---|---|
| Read by index or key | O(1) | O(1) average |
| Search by value | O(n) | O(1) average |
| Insert at end | O(1) amortised | O(1) average |
| Insert in middle | O(n) | n/a |

## Trade space for time

The two sum problem shows the idea. A nested loop is O(n squared). A hash map brings it to O(n).

~~~javascript
function twoSum(nums, target) {
  const seen = new Map(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}
~~~

> When you see "find a pair" or "have I seen this", reach for a hash map.
`,
        questions: [
          { d: 'beginner', q: `What are the time complexities of common array operations?`,
            a: `Reading by index is O(1). Searching an unsorted array is O(n). Appending is amortised O(1). Inserting or deleting in the middle is O(n) because later elements shift.`,
            t: `Index access is cheap, shifting is not.` },
          { d: 'intermediate', q: `Solve two sum in linear time.`,
            a: `Walk the array once and store each value with its index in a map. For every number, check whether target minus the number is already in the map. If yes, return both indexes. This costs O(n) time and O(n) extra space.`,
            code: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const j = seen.get(target - nums[i]);
    if (j !== undefined) return [j, i];
    seen.set(nums[i], i);
  }
  return [];
}`, lang: 'javascript',
            t: `A map turns a second loop into a lookup.` },
          { d: 'senior', q: `How do hash tables handle collisions, and why is insertion amortised O(1)?`,
            a: `Two main ways: chaining stores colliding keys in a list or tree per bucket, and open addressing probes for the next free slot. When the load factor passes a threshold the table doubles and rehashes. That resize is O(n) but happens rarely, so the average cost per insert stays O(1).`,
            t: `Rare expensive resizes spread out to constant average cost.` },
        ],
      },
      {
        slug: 'trees-graphs', title: 'Trees, Graphs & Traversal', minutes: 7,
        summary: 'Model relationships and walk them with BFS, DFS and shortest path algorithms.',
        doc: `
## Graphs in one minute

A graph is a set of nodes joined by edges. A tree is a connected graph with no cycles. Store graphs as an **adjacency list** for most problems because it uses O(V + E) space.

## Breadth first search

BFS visits nodes level by level using a queue. It finds the shortest path in an unweighted graph.

~~~javascript
function bfs(graph, start) {
  const dist = { [start]: 0 };
  const queue = [start];
  while (queue.length) {
    const node = queue.shift();
    for (const next of graph[node] ?? []) {
      if (!(next in dist)) {
        dist[next] = dist[node] + 1;
        queue.push(next);
      }
    }
  }
  return dist;
}
~~~

## Pick the right tool

- **BFS**: shortest path with equal edge cost, level order.
- **DFS**: cycle detection, topological sort, backtracking.
- **Dijkstra**: shortest path with non negative weights.
`,
        questions: [
          { d: 'beginner', q: `When would you choose BFS over DFS?`,
            a: `Choose BFS when you need the shortest path in an unweighted graph or want to process nodes level by level. Choose DFS when you need to explore a whole branch, detect cycles or build a topological order. BFS uses a queue and DFS uses a stack or recursion.`,
            t: `BFS for nearest, DFS for deepest.` },
          { d: 'intermediate', q: `How do you detect a cycle in a directed graph?`,
            a: `Run DFS and track three colours: unvisited, in the current path and finished. If you reach a node that is in the current path, you found a back edge, which means a cycle. Alternatively, run Kahn's topological sort. If fewer than all nodes are removed, a cycle exists.`,
            t: `A back edge to the active path means a cycle.` },
          { d: 'senior', q: `What is the complexity of Dijkstra's algorithm and why does it fail with negative edges?`,
            a: `With a binary heap it runs in O((V + E) log V). It assumes that once a node is popped, its distance is final, which is only true when edges cannot reduce a path later. A negative edge can break that assumption, so use Bellman-Ford, which runs in O(V times E) and also detects negative cycles.`,
            t: `Dijkstra needs non negative weights, otherwise use Bellman-Ford.` },
        ],
      },
    ],
  },
  {
    slug: 'artificial-intelligence', name: 'Artificial Intelligence', icon: 'BrainCircuit', accent: '#ec4899', group: G,
    description: 'Neural networks, large language models, retrieval augmented generation and deployment trade-offs.',
    topics: [
      {
        slug: 'neural-networks', title: 'Neural Network Fundamentals', minutes: 6,
        summary: 'Neurons, activations, loss and backpropagation without the hand waving.',
        doc: `
## The building block

A neuron computes a weighted sum of its inputs, adds a bias and passes the result through an **activation function**. Layers of neurons form a network.

1. **Forward pass**: push data through the layers to get a prediction.
2. **Loss**: measure how wrong the prediction is.
3. **Backpropagation**: use the chain rule to find how each weight affects the loss.
4. **Update**: nudge each weight against its gradient.

~~~python
import numpy as np

def relu(x): return np.maximum(0, x)

x = np.array([0.5, -1.2, 3.0])
W = np.random.randn(3, 4) * 0.1
b = np.zeros(4)

hidden = relu(x @ W + b)   # one layer forward pass
~~~

## Common activations

- **ReLU**: fast and the default for hidden layers.
- **Sigmoid**: squashes to 0 to 1 for binary output.
- **Softmax**: turns scores into class probabilities.
`,
        questions: [
          { d: 'beginner', q: `Why do neural networks need activation functions?`,
            a: `Without them every layer is a linear function, and a stack of linear functions is still one linear function. Non linear activations let the network learn curved decision boundaries and complex patterns.`,
            t: `No non-linearity means no depth benefit.` },
          { d: 'intermediate', q: `What is the vanishing gradient problem?`,
            a: `In deep networks with sigmoid or tanh, gradients shrink as they travel back through many layers, so early layers learn very slowly. Remedies include ReLU style activations, careful weight initialisation, batch normalisation and residual connections.`,
            t: `Use ReLU, good init and skip connections for deep nets.` },
          { d: 'senior', q: `How do you diagnose and fix overfitting?`,
            a: `Overfitting shows as low training loss with high validation loss. Fix it with more data or augmentation, a smaller model, weight decay, dropout, early stopping and cross validation. Always compare train and validation curves before changing the model.`,
            t: `Watch the train versus validation gap.` },
        ],
      },
      {
        slug: 'llms-rag', title: 'LLMs, Prompting & RAG', minutes: 7,
        summary: 'How language models work and how to ground them in your own data.',
        doc: `
## How an LLM answers

A large language model splits text into **tokens**, then predicts the next token again and again using the **attention** mechanism to weigh earlier tokens. It learns patterns, not a database of facts, so it can sound confident and still be wrong.

## Retrieval Augmented Generation

RAG gives the model fresh, private facts at question time.

1. **Chunk** your documents and create vector **embeddings**.
2. Store them in a vector database.
3. On each question, embed the query and fetch the closest chunks.
4. Put those chunks into the prompt and ask the model to answer from them.

~~~typescript
const hits = await vectorDb.search(await embed(question), { topK: 4 });
const context = hits.map((h) => h.text).join(' | ');

const answer = await llm.generate(
  'Answer only from the context. If unsure, say you do not know. ' +
  'Context: ' + context + ' Question: ' + question,
);
~~~

> Good retrieval matters more than a bigger model. Bad chunks give bad answers.
`,
        questions: [
          { d: 'beginner', q: `What is a token in an LLM?`,
            a: `A token is a small piece of text, often a word or part of a word, that the model reads and writes. Context limits and pricing are measured in tokens, and a rough rule is that one token is about four English characters.`,
            t: `Models see tokens, not words.` },
          { d: 'intermediate', q: `When should you use RAG instead of fine-tuning?`,
            a: `Use RAG when knowledge changes often, must be cited or is private, because you can update the index without retraining. Fine-tune to change style, format or behaviour. Many systems combine them.`,
            t: `RAG adds knowledge, fine-tuning shapes behaviour.` },
          { d: 'senior', q: `How do you reduce hallucinations in a production RAG system?`,
            a: `Improve retrieval first with better chunking, hybrid keyword and vector search and reranking. Instruct the model to answer only from context and to admit uncertainty. Require citations, add a confidence or grounding check, and evaluate with a fixed test set so you can measure regressions.`,
            t: `Better retrieval, strict prompts, measured evaluation.` },
        ],
      },
    ],
  },
];
