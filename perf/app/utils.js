// A real app on a real renderer: react-dom into happy-dom, every library with
// its own binding. What we measure is the whole loop — write, notification,
// re-render — and how many components one write woke up.
import {Window} from 'happy-dom'

let window = new Window({url: 'http://localhost'})

for (let key of [
  'window', 'document', 'HTMLElement', 'Element', 'Node', 'Event',
  'CustomEvent', 'MutationObserver', 'requestAnimationFrame',
  'cancelAnimationFrame', 'getComputedStyle',
]) {
  Object.defineProperty(globalThis, key, {value: window[key], configurable: true})
}

let {createElement: h} = await import('react')
let {createRoot} = await import('react-dom/client')
let {flushSync} = await import('react-dom')

export {h, flushSync}

// the list every app renders: a header over rows, each row on its own data
export let rows = +(globalThis.process?.env.PERF_ROWS ?? 0) || 1000

export let data = (n = rows) => ({
  items: Array.from({length: n}, (_, i) => ({
    id: i,
    name: 'item ' + i,
    done: false,
  })),
})

// how many components rendered since the last read
export let counter = () => {
  let n = 0

  return {
    hit: () => n++,
    take: () => {
      let was = n
      n = 0
      return was
    },
  }
}

// one op, flushed the way each library flushes in an app: react commits the
// write itself, a library that coalesces its notifications gets its microtask
// first and commits on the second flush. Needs a bench with `flush: true`
export let commit = async body => {
  flushSync(body)
  await null
  flushSync(noop)
}

let noop = () => {}

// the previous app leaves the document, or a mount bench grows it forever
let last

export let mount = element => {
  last?.remove()

  let host = window.document.createElement('div')
  last = host
  window.document.body.appendChild(host)

  let root = createRoot(host)
  flushSync(() => root.render(element))

  return {
    host,
    unmount: () => root.unmount(),
  }
}
