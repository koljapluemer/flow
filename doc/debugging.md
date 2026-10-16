# Debugging

## Exercise preview

In dev (`npm run dev`) only, `/dev/exercise/<exercise id>` shows one exercise without the queue (`src/pages/exercise-preview/`). It syncs the selected topics first; the exercise's gestalt must be in one of them. The result is shown on the page and **not** stored.

Exercise ids are `<type>:<variant>:<content id>`, e.g.

- `/dev/exercise/vocab-practice:bare:deu/nett`
- `/dev/exercise/explanation-watch:watch:arz/7495810055649004802`
- `/dev/exercise/snippet-watch:watch:arz/ZoYMAQgRMUw%233` (`#` must be written as `%23`)

The ids the queue picks are logged under `flow:exercise` (see below).

## Logging

The queue logs via [`debug`](https://www.npmjs.com/package/debug) (`src/dumb/log.ts`), off by default. In the browser console:

```js
localStorage.debug = 'flow:*' // or e.g. 'flow:queue,flow:goal'
```

then reload. `localStorage.removeItem('debug')` turns it off.

| Namespace       | Logs                                                         |
| --------------- | ------------------------------------------------------------ |
| `flow:sync`     | per topic, number of items per kind                          |
| `flow:goal`     | per step, progress of each goal; spawned, done               |
| `flow:queue`    | per step, active goals, number due, picked gestalt and why   |
| `flow:exercise` | variants with fit and whether unseen/due, chosen exercise    |
| `flow:rate`     | exercise, grade or answer, new due dates of reviewed gestalts |
