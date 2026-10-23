import { SeedSubject } from './types';

export const web: SeedSubject[] = [
  {
    slug: 'mern-stack', name: 'MERN Stack', icon: 'Globe', accent: '#10b981', group: 'Full MERN & Web',
    description: 'Node.js and Express internals, MongoDB modelling, React patterns and Next.js rendering modes.',
    topics: [
      {
        slug: 'node-express', title: 'Node.js & Express Internals', minutes: 7,
        summary: 'The event loop, middleware chain and how to scale a single threaded runtime.',
        doc: `
## The event loop

Node runs your JavaScript on one thread. It stays fast because slow work such as file and network access is handed to the system, and callbacks return to the **event loop** when ready. Heavy CPU work blocks that loop, so move it to worker threads.

## Express middleware

A request flows through functions in the order you register them. Each one can end the response or call **next**. Error handlers have four arguments and go last.

~~~javascript
const express = require('express');
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.get('/users/:id', async (req, res, next) => {
  try {
    res.json(await User.findById(req.params.id));
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message });
});
~~~

> Always forward async errors to next, or the request may hang.
`,
        questions: [
          { d: 'beginner', q: `What is the Node.js event loop?`,
            a: `It is the mechanism that lets a single threaded Node process handle many connections. Long running I/O is delegated to the operating system or a thread pool, and when it finishes its callback is queued and run by the loop. This keeps the main thread free.`,
            t: `One thread, non blocking I/O, callbacks on completion.` },
          { d: 'intermediate', q: `Why does middleware order matter in Express, and how do you handle errors?`,
            a: `Express runs middleware in registration order, so body parsers and authentication must come before the routes that need them. Error handling middleware takes four arguments and must be registered after the routes. In async handlers, catch the error and pass it to next.`,
            code: `app.use(authenticate);          // runs first
app.use('/api', apiRouter);
app.use((err, req, res, next) => {  // errors last
  res.status(500).json({ message: err.message });
});`, lang: 'javascript',
            t: `Order is behaviour: parsers, auth, routes, error handler.` },
          { d: 'senior', q: `How do you scale a Node.js app across CPU cores?`,
            a: `One process uses one core, so run several. Use the cluster module or a process manager such as PM2, or run multiple containers behind a load balancer. Keep the app stateless by moving sessions and caches to Redis. For CPU heavy tasks use worker threads or a job queue.`,
            cmd: `# run one process per core with PM2
pm2 start dist/main.js -i max
pm2 status`,
            t: `Scale out processes, keep state outside the process.` },
        ],
      },
      {
        slug: 'mongo-react-next', title: 'MongoDB, React & Next.js Rendering', minutes: 8,
        summary: 'Model data well, avoid common React traps and choose the right rendering mode.',
        doc: `
## MongoDB modelling

Embed data that you always read together and that stays small, such as an address inside a user. Reference data that grows without limit or is shared, such as the posts of a user. Add an **index** for every common filter and sort.

## React in one rule

Treat state as a snapshot, never mutate it, and list every value an effect uses in its dependency array.

## Next.js rendering modes

| Mode | When HTML is built | Good for |
|---|---|---|
| SSG | At build time | Docs, marketing pages |
| ISR | At build, refreshed on a timer | Product pages, blogs |
| SSR | On every request | Personalised, always fresh pages |
| CSR | In the browser | Dashboards behind login |

~~~typescript
// App Router: regenerate this page at most once a minute (ISR)
export const revalidate = 60;

export default async function Page() {
  const posts = await fetch('https://api.example.com/posts').then((r) => r.json());
  return <PostList posts={posts} />;
}
~~~
`,
        questions: [
          { d: 'beginner', q: `When should you embed documents and when should you reference them in MongoDB?`,
            a: `Embed when the child data is read with the parent, is small and has a bounded size. Reference when the child list can grow without limit, is shared between parents or is updated on its own.`,
            t: `Embed bounded, co-read data. Reference the rest.` },
          { d: 'intermediate', q: `Explain SSG, SSR and ISR in Next.js.`,
            a: `SSG builds HTML once at build time and serves it from a CDN. SSR builds HTML on each request, so data is always fresh but each hit costs server time. ISR is SSG with a revalidation timer: the page is served from cache and rebuilt in the background after it goes stale.`,
            code: `export const revalidate = 60; // ISR
// export const dynamic = 'force-dynamic'; // SSR`, lang: 'typescript',
            t: `ISR gives static speed with periodic freshness.` },
          { d: 'senior', q: `How do you design a compound index for a query with equality, sort and range?`,
            a: `Follow the ESR rule: Equality fields first, then Sort fields, then Range fields. This lets MongoDB use the index for filtering and ordering without an in memory sort. Check the plan with explain and confirm it reports an index scan, not a collection scan.`,
            code: `// query: status = 'open', sort by createdAt, price between
db.orders.createIndex({ status: 1, createdAt: -1, price: 1 });
db.orders.find({ status: 'open', price: { $gt: 10, $lt: 99 } })
  .sort({ createdAt: -1 }).explain('executionStats');`, lang: 'javascript',
            t: `Equality, Sort, Range.` },
        ],
      },
    ],
  },
  {
    slug: 'react-native', name: 'React Native', icon: 'Smartphone', accent: '#38bdf8', group: 'Mobile & Python',
    description: 'Native components, list performance, Redux Toolkit and the new architecture.',
    topics: [
      {
        slug: 'rn-core', title: 'React Native Core & Hooks', minutes: 6,
        summary: 'Native building blocks, lists and the hooks you use every day.',
        doc: `
## Not a web view

React Native renders **real native views**. A View becomes a UIView on iOS and an Android View on Android. You write React components and styles with JavaScript objects, with no CSS files and no DOM.

## Core pieces

- **View, Text, Image**: the basic blocks. All text must live inside Text.
- **FlatList**: a virtualised list that renders only what is on screen.
- **StyleSheet**: flexbox layout, with column as the default direction.

~~~jsx
import { FlatList, Text, View } from 'react-native';

export default function Feed({ items }) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ padding: 16 }}>
          <Text>{item.title}</Text>
        </View>
      )}
    />
  );
}
~~~

> Prefer FlatList over ScrollView for long lists, because ScrollView mounts every child at once.
`,
        questions: [
          { d: 'beginner', q: `How is React Native different from React for the web?`,
            a: `React Native renders native mobile views instead of HTML elements. There is no DOM or CSS, styling uses JavaScript objects with flexbox, and you use components like View and Text rather than div and span. The React model of components, props, state and hooks is the same.`,
            t: `Same React model, native views instead of a DOM.` },
          { d: 'intermediate', q: `Why use FlatList instead of ScrollView for long lists?`,
            a: `ScrollView renders all children immediately, which uses a lot of memory for big lists. FlatList virtualises, rendering only visible rows plus a small buffer and recycling them as you scroll. Provide a stable keyExtractor and consider getItemLayout for fixed height rows.`,
            t: `Virtualise long lists.` },
          { d: 'senior', q: `What changes in the New Architecture of React Native?`,
            a: `The asynchronous JSON bridge is replaced by JSI, which lets JavaScript hold direct references to native objects and call them synchronously. Fabric is the new renderer, and TurboModules load native modules lazily. The result is lower latency, better concurrent rendering support and less serialisation overhead.`,
            t: `JSI, Fabric and TurboModules remove the async bridge.` },
        ],
      },
      {
        slug: 'rn-state-native', title: 'State, Redux & Native Modules', minutes: 6,
        summary: 'Manage app state with Redux Toolkit and know when to cross into native code.',
        doc: `
## Redux Toolkit

Redux keeps shared state in one store. Components dispatch **actions**, **reducers** compute new state, and components read with selectors. Redux Toolkit removes the boilerplate and lets you write "mutating" code that is safe because of Immer.

~~~javascript
import { createSlice, configureStore } from '@reduxjs/toolkit';

const cart = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    added: (state, action) => { state.items.push(action.payload); },
    cleared: (state) => { state.items = []; },
  },
});

export const { added, cleared } = cart.actions;
export const store = configureStore({ reducer: { cart: cart.reducer } });
~~~

## Native modules

When JavaScript cannot reach a platform feature, write a **native module** in Swift, Kotlin or C++ and expose it to JavaScript. Keep calls infrequent and batch data, because crossing the boundary has a cost.
`,
        questions: [
          { d: 'beginner', q: `Describe the Redux data flow.`,
            a: `The UI dispatches an action, a reducer receives the current state and the action and returns new state, the store saves it and subscribed components re-render with the updated values. Data flows in one direction.`,
            t: `Action, reducer, store, view.` },
          { d: 'intermediate', q: `What does createSlice give you in Redux Toolkit?`,
            a: `It generates action creators and a reducer from one definition. You can write code that looks like mutation, and Immer turns it into immutable updates. It removes switch statements and action type constants.`,
            code: `const counter = createSlice({
  name: 'counter',
  initialState: 0,
  reducers: { incremented: (n) => n + 1 },
});`, lang: 'javascript',
            t: `Less boilerplate, safe immutable updates.` },
          { d: 'senior', q: `How do you keep native module calls from hurting performance?`,
            a: `Make fewer, larger calls instead of many small ones, and send compact data. Run heavy work on a native background thread and return a promise. With the New Architecture use TurboModules and JSI for synchronous access when it is truly needed. Profile before optimising.`,
            t: `Batch calls and keep heavy work off the JS thread.` },
        ],
      },
    ],
  },
];
