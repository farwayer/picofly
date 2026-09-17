import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {Window} from 'happy-dom'
import {
  createElement as h, StrictMode, useState, useLayoutEffect, act,
  startTransition,
} from 'react'
import {create} from 'picofly'
import {Picofly, useStore, select} from 'picofly/react'


let window = new Window()

for (let key of ['window', 'document', 'Event', 'Node', 'Element', 'HTMLElement']) {
  Object.defineProperty(globalThis, key, {value: window[key], configurable: true})
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true

// react schedules through this module, mocked so a test can stop a render
// half-way. act() has its own queue, so the other tests do not notice
let require = createRequire(import.meta.url)
let Scheduler = require('scheduler/unstable_mock')
require('scheduler')
require.cache[require.resolve('scheduler')].exports = Scheduler

// react-dom reads the dom globals, so it is imported after them
let {createRoot} = await import('react-dom/client')
let {flushSync} = await import('react-dom')

let mount = element => {
  let host = window.document.createElement('div')
  window.document.body.appendChild(host)

  // errors are asserted on, no need to print them
  let root = createRoot(host, {onUncaughtError: () => {}})
  act(() => root.render(element))

  return {
    text: () => host.textContent,
    render: element => act(() => root.render(element)),
    unmount: () => act(() => root.unmount()),
  }
}

let write = fn => act(fn)


suite('react', () => {
  test('read key write re-renders', () => {
    let store = create({n: 0})
    let C = () => {
      let s = useStore(store)
      return h('div', null, '' + s.n)
    }

    let app = mount(h(C))
    assert.equal(app.text(), '0')

    write(() => {store.n = 1})
    assert.equal(app.text(), '1')
  })

  test('store from context', () => {
    let store = create({n: 0})
    let C = () => {
      let s = useStore()
      return h('div', null, '' + s.n)
    }

    let app = mount(h(Picofly, {value: store}, h(C)))

    write(() => {store.n = 1})
    assert.equal(app.text(), '1')
  })

  test('only the components that read the key re-render', () => {
    let store = create({a: 0, b: 0, deep: {x: 0}})
    let aRenders = 0
    let deepRenders = 0

    let A = () => {
      let s = useStore(store)
      aRenders++
      return h('i', null, '' + s.a)
    }
    let Deep = () => {
      let s = useStore(store)
      deepRenders++
      return h('b', null, '' + s.deep.x)
    }

    mount(h('div', null, h(A), h(Deep)))
    assert.deepEqual([aRenders, deepRenders], [1, 1])

    write(() => {store.a = 1})
    assert.deepEqual([aRenders, deepRenders], [2, 1])

    write(() => {store.deep.x = 1})
    assert.deepEqual([aRenders, deepRenders], [2, 2])

    // nobody reads b
    write(() => {store.b = 1})
    assert.deepEqual([aRenders, deepRenders], [2, 2])
  })

  test('keys that are not read anymore stop notifying', () => {
    let store = create({show: true, n: 0})
    let renders = 0

    let C = () => {
      let s = useStore(store)
      renders++
      return h('div', null, s.show ? '' + s.n : 'hidden')
    }

    mount(h(C))

    write(() => {store.show = false})
    assert.equal(renders, 2)

    write(() => {store.n = 1})
    assert.equal(renders, 2)
  })

  test('parent and child track separately', () => {
    let store = create({parent: 0, child: 0})
    let parentRenders = 0
    let childRenders = 0

    let Child = () => {
      let s = useStore(store)
      childRenders++
      return h('i', null, '' + s.child)
    }
    let Parent = () => {
      let s = useStore(store)
      parentRenders++
      return h('div', null, '' + s.parent, h(Child))
    }

    mount(h(Parent))

    write(() => {store.child = 1})
    assert.deepEqual([parentRenders, childRenders], [1, 2])

    write(() => {store.parent = 1})
    assert.deepEqual([parentRenders, childRenders], [2, 3])
  })

  test('a component mounted later tracks too', () => {
    let store = create({a: 0, b: 0})

    let A = () => {
      let s = useStore(store)
      return h('i', null, '' + s.a)
    }
    let B = () => {
      let s = useStore(store)
      return h('b', null, '' + s.b)
    }
    let App = ({both}) => h('div', null, h(A), both && h(B))

    let app = mount(h(App, {both: false}))
    app.render(h(App, {both: true}))

    write(() => {store.b = 1})
    assert.equal(app.text(), '01')

    write(() => {store.a = 1})
    assert.equal(app.text(), '11')
  })

  test('own state update keeps tracking', () => {
    let store = create({n: 0})
    let setOwn

    let C = () => {
      let s = useStore(store)
      let [own, set] = useState(0)
      setOwn = set
      return h('div', null, s.n + ':' + own)
    }

    let app = mount(h(C))

    act(() => setOwn(1))
    write(() => {store.n = 1})
    assert.equal(app.text(), '1:1')
  })

  // two renders in a row that no store write caused: the second one has to
  // drop the keys the first one read, and nothing may pile up in between
  test('a key dropped on an own render stops notifying', () => {
    let store = create({a: 0, b: 0})
    let renders = 0
    let setFlag

    let C = () => {
      let s = useStore(store)
      let [flag, set] = useState(true)
      setFlag = set
      renders++
      return h('div', null, flag ? 'a' + s.a : 'b' + s.b)
    }

    let app = mount(h(C))

    act(() => setFlag(false))
    act(() => setFlag(true))
    assert.equal(renders, 3)
    assert.equal(app.text(), 'a0')

    // b was read by the middle render only
    write(() => {store.b = 1})
    assert.equal(renders, 3)
  })

  test('write from a layout effect on mount is not lost', () => {
    let store = create({n: 0})

    let Child = () => {
      // the store is already unlocked for effects of descendants,
      // but the component is not subscribed yet
      useLayoutEffect(() => {store.n = 1}, [])
      return null
    }
    let C = () => {
      let s = useStore(store)
      return h('div', null, '' + s.n, h(Child))
    }

    let app = mount(h(C))
    assert.equal(app.text(), '1')
  })

  // the same window on a re-render: the component is subscribed by now, so
  // what saves the write is the notification, not react's mount-time check
  test('write from a layout effect on update is not lost', () => {
    let store = create({a: 0, b: 0})

    let Child = ({a}) => {
      useLayoutEffect(() => {
        if (a) store.b = a + 1
      }, [a])

      return null
    }
    let C = () => {
      let s = useStore(store)
      return h('div', null, `${s.a}:${s.b}`, h(Child, {a: s.a}))
    }

    let app = mount(h(C))
    assert.equal(app.text(), '0:0')

    write(() => {store.a = 1})
    assert.equal(app.text(), '1:2')
  })

  test('strict mode keeps tracking', () => {
    let store = create({n: 0})
    let C = () => {
      let s = useStore(store)
      return h('div', null, '' + s.n)
    }

    // react remounts effects once, resubscribing without a render
    let app = mount(h(StrictMode, null, h(C)))

    write(() => {store.n = 1})
    assert.equal(app.text(), '1')
  })

  test('strict mode keeps tracking with select', () => {
    let store = create({n: 0})
    let View = ({n}) => h('div', null, '' + n)
    let C = select(s => ({n: s.n}))(View, {store})

    let app = mount(h(StrictMode, null, h(C)))

    write(() => {store.n = 1})
    assert.equal(app.text(), '1')
  })

  // a selector gets the props it is about to override, so a callback can wrap
  // the one that came in. Overriding in place made the wrapper call itself.
  test('a selector can wrap the prop it overrides', () => {
    let store = create({n: 0})
    let calls = []
    let onClick

    let View = props => {
      onClick = props.onClick
      return h('div', null, '' + props.n)
    }

    let C = select(
      (s, props) => ({
        n: s.n,
        onClick: () => {
          calls.push('outer')
          props.onClick()
        },
      }),
    )(View, {store})

    mount(h(C, {onClick: () => calls.push('inner')}))
    onClick()

    assert.deepEqual(calls, ['outer', 'inner'])
  })

  test('select takes the store itself or a function returning it', () => {
    let store
    let View = ({n}) => h('div', null, '' + n)
    let Lazy = select(s => ({n: s.n}))(View, {store: () => store})

    // the function runs at render, so the store may not exist yet
    store = create({n: 0})
    let Direct = select(s => ({n: s.n}))(View, {store})

    let app = mount(h('div', null, h(Direct), h(Lazy)))
    assert.equal(app.text(), '00')

    write(() => {store.n = 1})
    assert.equal(app.text(), '11')
  })

  test('write during render throws', () => {
    let store = create({n: 0})
    let C = () => {
      let s = useStore(store)
      store.n = s.n + 1
      return null
    }

    assert.throws(() => mount(h(C)), {message: /locked/})
  })

  test('write after unmount is quiet', () => {
    let store = create({n: 0})
    let renders = 0

    let C = () => {
      let s = useStore(store)
      renders++
      return h('div', null, '' + s.n)
    }

    let app = mount(h(C))
    app.unmount()

    write(() => {store.n = 1})
    assert.equal(renders, 1)
  })

  // a transition renders A, yields, and the store changes in the gap. The
  // scheduler is stopped between the two readers, and the write goes in
  // through `write`. Every commit is collected: a mix of old and new is a tear
  let tornBy = async (t, write) => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = false
    t.after(() => {globalThis.IS_REACT_ACT_ENVIRONMENT = true})

    let store = create({n: 0})
    let host = window.document.createElement('div')
    let commits = []
    let bump

    let Reader = ({tag}) => {
      let s = useStore(store)
      Scheduler.log(tag)
      useLayoutEffect(() => {commits.push(host.textContent)})
      return h('i', null, '' + s.n)
    }
    let App = () => {
      let [, set] = useState(0)
      bump = () => set(t => t + 1)
      return h('div', null, h(Reader, {tag: 'A'}), h(Reader, {tag: 'B'}))
    }

    // react hands work to the scheduler in a microtask, hence the awaits
    createRoot(host).render(h(App))
    await null
    Scheduler.unstable_flushAllWithoutAsserting()
    assert.equal(host.textContent, '00')
    Scheduler.unstable_clearLog()

    startTransition(bump)
    await null
    Scheduler.unstable_flushNumberOfYields(1)
    assert.deepEqual(Scheduler.unstable_clearLog(), ['A'])
    assert.equal(host.textContent, '00')

    // the render lock lifts in a microtask, as it does in a browser gap
    await null
    write(store)
    await null
    Scheduler.unstable_flushAllWithoutAsserting()

    assert.equal(host.textContent, '11')
    return commits.filter(text => text !== '00' && text !== '11')
  }

  // a click or a key press: the write is a sync lane, react drops the
  // half-rendered pass and re-renders both readers before anything lands
  test('a discrete write during a yielded transition does not tear', async t => {
    assert.deepEqual(await tornBy(t, store => flushSync(() => {store.n = 1})), [])
  })

  // a timer or a response: the write is a default lane, and react lets a
  // running transition finish first. B would render the new value next to
  // the old one A rendered, but useSyncExternalStore re-checks its snapshot
  // before commit and renders the pair again before anything lands
  test('a default write during a yielded transition does not tear', async t => {
    assert.deepEqual(await tornBy(t, store => {store.n = 1}), [])
  })
})
