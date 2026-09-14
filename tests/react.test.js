import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {Window} from 'happy-dom'
import {
  createElement as h, StrictMode, useState, useLayoutEffect, act,
} from 'react'
import {create} from 'picofly'
import {Picofly, useStore, select} from 'picofly/react'


let window = new Window()

for (let key of ['window', 'document', 'Event', 'Node', 'Element', 'HTMLElement']) {
  Object.defineProperty(globalThis, key, {value: window[key], configurable: true})
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true

// react-dom reads the dom globals, so it is imported after them
let {createRoot} = await import('react-dom/client')

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
    let C = select(s => ({n: s.n}))(View, {getStore: () => store})

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
    )(View, {getStore: () => store})

    mount(h(C, {onClick: () => calls.push('inner')}))
    onClick()

    assert.deepEqual(calls, ['outer', 'inner'])
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
})
