import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {store, obj, onWrite, onRead, lock, unlock} from 'picofly'
import {KeysSym} from '../src/rules/utils.js'


suite('obj', () => {
  let timerStore = () => {
    let o = {timer: {ticks: 0}}
    let s = store(o, [obj])
    return [o, s]
  }

  test('symbol prop', () => {
    let sym = Symbol('mine')
    let o = {[sym]: {n: 1}}
    let s = store(o, [obj])

    assert.equal(s[sym].n, 1)
    assert.notEqual(s[sym], o[sym])
  })

  test('create', () => {
    let [o, s] = timerStore()

    let sObj = JSON.parse(JSON.stringify(s))
    assert.deepEqual(sObj, o)
  })

  test('set', () => {
    let [o, s] = timerStore()

    s.timer.ticks = 1
    assert.equal(o.timer.ticks, 1)
    assert.equal(s.timer.ticks, 1)
  })

  test('delete', () => {
    let [o, s] = timerStore()

    delete s.timer.ticks
    assert.ok(!('ticks' in s.timer))
    assert.ok(!('ticks' in o.timer))
  })

  test('onWrite set root', () => {
    let [o, s] = timerStore()
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, o)
      hits.push(key)
    })

    s.show = true

    assert.deepEqual(hits, [KeysSym, 'show'])
  })

  test('onWrite set nested', () => {
    let [o, s] = timerStore()
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, o.timer)
      hits.push(key)
    })

    s.timer.ticks = 1

    assert.deepEqual(hits, ['ticks'])
  })

  test('onWrite set int key no length', () => {
    let o = {}
    let s = store(o, [obj])

    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, o)
      hits.push(key)
    })

    s[1] = 5

    assert.deepEqual(hits, [KeysSym, '1'])
  })

  test('onWrite set same', () => {
    let [_, s] = timerStore()

    onWrite(s, () => {
      assert.fail('unreachable')
    })

    s.timer.ticks = 0
  })

  test('onWrite set same obj', () => {
    let [_, s] = timerStore()

    onWrite(s, () => {
      assert.fail('unreachable')
    })

    s.timer = s.timer
  })

  test('onWrite delete nested', () => {
    let [o, s] = timerStore()
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, o.timer)
      hits.push(key)
    })

    delete s.timer.ticks

    assert.deepEqual(hits, [KeysSym, 'ticks'])
  })

  // gap: `had` looks at the prototype, so shadowing an inherited prop makes a
  // new own key while the key set stays quiet. Telling that apart would cost
  // an `Object.hasOwn` on every write
  test('inherited prop becomes own on write', () => {
    let proto = {tag: 'x'}
    let o = Object.create(proto)
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.tag = 'y'

    // the key list grew and nobody heard about it
    assert.deepEqual(hits, ['tag'])
    assert.deepEqual(Reflect.ownKeys(o), ['tag'])
    assert.equal(proto.tag, 'x')
    assert.equal(s.tag, 'y')
  })

  test('onWrite delete inherited notifies nothing', () => {
    let proto = {inherited: 1}
    let o = Object.create(proto)
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, key) => hits.push(key))

    delete s.inherited

    assert.deepEqual(hits, [])
    assert.equal(s.inherited, 1)
  })

  test('onWrite delete missing notifies nothing', () => {
    let [, s] = timerStore()
    let hits = []

    onWrite(s, (_, key) => hits.push(key))

    delete s.nothing

    assert.deepEqual(hits, [])
  })

  test('delete non-configurable returns false', () => {
    let o = {}
    Object.defineProperty(o, 'fixed', {value: 1, configurable: false})

    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, key) => hits.push(key))

    assert.equal(Reflect.deleteProperty(s, 'fixed'), false)
    assert.equal(o.fixed, 1)
    assert.deepEqual(hits, [])
  })

  test('delete symbol prop notifies', () => {
    let sym = Symbol('mine')
    let o = {[sym]: 1}
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, key) => hits.push(key))

    delete s[sym]

    assert.deepEqual(hits, [KeysSym, sym])
    assert.equal(sym in o, false)
  })

  test('delete own prop uncovers the inherited one', () => {
    let o = Object.create({x: 'proto'})
    o.x = 'own'

    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, key) => hits.push(key))

    delete s.x

    assert.deepEqual(hits, [KeysSym, 'x'])
    assert.equal(s.x, 'proto')
  })

  test('delete on a sealed object returns false', () => {
    let o = Object.seal({x: 1})
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, key) => hits.push(key))

    assert.equal(Reflect.deleteProperty(s, 'x'), false)
    assert.equal(o.x, 1)
    assert.deepEqual(hits, [])
  })

  // preventExtensions leaves props configurable, so the delete goes through
  test('delete on a non-extensible object works', () => {
    let o = Object.preventExtensions({x: 1})
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, key) => hits.push(key))

    delete s.x

    assert.deepEqual(hits, [KeysSym, 'x'])
    assert.equal('x' in o, false)
  })

  // unwrapping it would cut the object out of the other store, so it stays
  // a proxy in our data and a write notifies both sides
  test('a proxy from another store keeps its own tracking', () => {
    let raw = {n: 1}
    let other = store(raw, [obj])
    let s = store({}, [obj])

    let ours = []
    let theirs = []

    onWrite(s, (_, prop) => ours.push(prop))
    onWrite(other, (obj, prop) => theirs.push(prop))

    s.x = other

    assert.deepEqual(ours, [KeysSym, 'x'])
    assert.deepEqual(theirs, [])

    s.x.n = 2

    assert.equal(raw.n, 2)
    assert.deepEqual(ours, [KeysSym, 'x', 'n'])
    assert.deepEqual(theirs, ['n'])
  })

  // === says NaN differs from NaN and -0 equals +0, Object.is has it right
  test('NaN over NaN notifies nothing', () => {
    let s = store({x: NaN}, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.x = NaN

    assert.deepEqual(hits, [])
  })

  test('minus zero over plus zero is written', () => {
    let o = {x: 0}
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.x = -0

    assert.ok(Object.is(o.x, -0))
    assert.deepEqual(hits, ['x'])
  })

  test('lock', () => {
    let [_, s] = timerStore()

    lock(s)

    assert.throws(() => {
      s.timer.ticks = 1
    }, /"store locked!" is not a function/)

    assert.throws(() => {
      delete s.timer.ticks
    }, /"store locked!" is not a function/)
  })

  test('unlock', () => {
    let [o, s] = timerStore()

    lock(s)
    unlock(s)

    s.timer.ticks = 1

    assert.equal(o.timer.ticks, 1)
    assert.equal(s.timer.ticks, 1)
  })

  test('a read subscriber cannot change what a prop returns', () => {
    let o = {a: 1}
    let s = store(o, [obj])

    let off = onRead(s, () => {
      o.a = 2
    })

    assert.equal(s.a, 1)
    off()
    assert.equal(o.a, 2)
  })

  test('listing keys is a read', () => {
    let o = {a: 1}
    let s = store(o, [obj])
    let hits = []

    let off = onRead(s, (_, prop) => hits.push(prop))

    Object.keys(s)
    for (let key in s) key

    assert.deepEqual(hits, [KeysSym, KeysSym])

    // the values behind the keys are read as usual
    s.a
    off()

    assert.deepEqual(hits, [KeysSym, KeysSym, 'a'])
  })

  // gap: `[[GetOwnProperty]]` has no trap, so asking whether a prop is there
  // without reading it is not a read. Trapping it would fire on every key of
  // every enumeration — the engine checks enumerable through it — and the
  // answer is the one `in` already tracks
  test('asking for an own prop tracks nothing', () => {
    let o = {x: 1}
    let s = store(o, [obj])
    let hits = []

    let off = onRead(s, (_, prop) => hits.push(prop))

    Object.hasOwn(s, 'x')
    Object.getOwnPropertyDescriptor(s, 'x')
    off()

    assert.deepEqual(hits, [])
  })

  // what a component would see: the props a read tracked, then a write
  // checked against them
  let wakes = (s, read, write) => {
    let tracked = new Set()
    let off = onRead(s, (_, prop) => tracked.add(prop))

    read()
    off()

    let hit = false
    let stop = onWrite(s, (_, prop) => {
      hit ||= tracked.has(prop)
    })

    write()
    stop()

    return hit
  }

  // gap: `in` subscribes to the key, so writing a new value there wakes a
  // reader whose answer never changed. Keying it wider would mean waking on
  // every key added to the object
  test('in wakes on a value change too', () => {
    let s = store({a: 1}, [obj])

    assert.equal(wakes(s, () => 'a' in s, () => { s.a = 2 }), true)
    assert.equal(wakes(s, () => 'a' in s, () => { s.b = 1 }), false)
    assert.equal(wakes(s, () => 'a' in s, () => { delete s.a }), true)
  })

  test('in is a read', () => {
    let o = {a: 1}
    let s = store(o, [obj])
    let hits = []

    let off = onRead(s, (_, prop) => hits.push(prop))

    'a' in s
    'zz' in s
    off()

    assert.deepEqual(hits, ['a', 'zz'])
  })

  test('a read subscriber cannot change what in returns', () => {
    let o = {a: 1}
    let s = store(o, [obj])

    let off = onRead(s, () => {
      delete o.a
    })

    assert.equal('a' in s, true)
    off()
    assert.equal('a' in o, false)
  })

  test('a read subscriber cannot change the key list', () => {
    let o = {a: 1, b: 2}
    let s = store(o, [obj])

    let off = onRead(s, () => {
      delete o.b
    })

    assert.deepEqual(Reflect.ownKeys(s), ['a', 'b'])
    off()
    assert.deepEqual(Reflect.ownKeys(o), ['a'])
  })

  // gap: `Object.keys` is `ownKeys` plus a descriptor per key, and we notify
  // in between, so a read subscriber can still drop one of them. Holding the
  // list would mean answering descriptors out of a snapshot nobody else needs
  test('a read subscriber can drop a key from Object.keys', () => {
    let o = {a: 1, b: 2}
    let s = store(o, [obj])

    let off = onRead(s, () => {
      delete o.b
    })

    assert.deepEqual(Object.keys(s), ['a'])
    off()
  })

  test('onRead root', () => {
    let [o, s] = timerStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, o)
      hits.push(key)
    })

    s.timer

    assert.deepEqual(hits, ['timer'])
  })

  test('onRead nested', () => {
    let [o, s] = timerStore()
    let hits = []

    onRead(s, (obj, key) => hits.push([obj, key]))

    s.timer.ticks

    assert.deepEqual(hits.map(([, key]) => key), ['timer', 'ticks'])
    assert.equal(hits[0][0], o)
    assert.equal(hits[1][0], o.timer)
  })

  test('symbol key write', () => {
    let sym = Symbol('mine')
    let o = {}
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))
    s[sym] = 1

    assert.deepEqual(hits, [KeysSym, sym])
    assert.equal(o[sym], 1)
  })

  test('Object.assign notifies every key', () => {
    let o = {a: 0}
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))
    Object.assign(s, {a: 1, b: 2})

    assert.deepEqual(hits, ['a', KeysSym, 'b'])
    assert.deepEqual(o, {a: 1, b: 2})
  })

  // gap: a proxy carries no private brand, so `this` inside a class method is
  // the wrong object for #fields. Public fields and getters over them work, an
  // instance that needs private state has to be markRaw'd
  test('private field through the store throws', () => {
    class Counter {
      #n = 1

      get n() {
        return this.#n
      }

      inc() {
        this.#n++
      }
    }

    let c = new Counter()
    let s = store(c, [obj])

    assert.throws(() => s.n, TypeError)
    assert.throws(() => s.inc(), TypeError)
    assert.equal(c.n, 1)
  })

  // a proxy of their own around our data: what the store shows is what their
  // get trap returns, and what lands is what their set trap stores
  test('an inner proxy that stores something else is written through', () => {
    let raw = {n: 4}
    let theirs = new Proxy(raw, {
      set: (target, prop, val, receiver) => Reflect.set(target, prop, val * 2, receiver),
    })

    let s = store({box: theirs}, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.box.n = 4

    assert.deepEqual(hits, ['n'])
    assert.equal(raw.n, 8)
  })

  test('an inner proxy that transforms both ways notifies nothing', () => {
    let raw = {n: 4}
    let theirs = new Proxy(raw, {
      get: (target, prop, receiver) => Reflect.get(target, prop, receiver) / 2,
      set: (target, prop, val, receiver) => Reflect.set(target, prop, val * 2, receiver),
    })

    let s = store({box: theirs}, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.box.n = 2

    assert.deepEqual(hits, [])
    assert.equal(raw.n, 4)
  })

  test('an inner proxy behind an outer one notifies nothing either', () => {
    let raw = {n: 4}
    let theirs = new Proxy(raw, {
      get: (target, prop, receiver) => Reflect.get(target, prop, receiver) / 2,
      set: (target, prop, val, receiver) => Reflect.set(target, prop, val * 2, receiver),
    })

    let s = store({box: theirs}, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    new Proxy(s.box, {}).n = 2

    assert.deepEqual(hits, [])
    assert.equal(raw.n, 4)
  })


  test('an inner proxy handing out fresh wrappers notifies nothing', () => {
    let raw = {n: 1}
    let theirs
    theirs = new Proxy(raw, {
      get: (target, prop, receiver) => typeof prop === 'symbol' || receiver === theirs
        ? Reflect.get(target, prop, receiver)
        : {of: Reflect.get(target, prop, receiver)},
    })

    let s = store({box: theirs}, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.box.n = 1

    assert.deepEqual(hits, [])
    assert.equal(raw.n, 1)
  })

  test('an inner proxy unwrapping a ref notifies the change', () => {
    let ref = {value: 1}
    let raw = {n: ref}
    let theirs
    theirs = new Proxy(raw, {
      get: (target, prop, receiver) => prop === 'n' && receiver === theirs
        ? Reflect.get(target, prop, receiver).value
        : Reflect.get(target, prop, receiver),
      set(target, prop, val) {
        target[prop].value = val
        return true
      },
    })

    let s = store({box: theirs}, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.box.n = 5

    assert.deepEqual(hits, ['n'])
    assert.equal(ref.value, 5)
  })

  // gap: an inner proxy that keeps its state for its own receiver shows us the
  // real value while a reader of the store gets undefined, so we announce a
  // change nobody can see
  test('an inner proxy guarding its state over-notifies', () => {
    let raw = {n: 1}
    let theirs
    theirs = new Proxy(raw, {
      get: (target, prop, receiver) => typeof prop === 'symbol' || receiver === theirs
        ? Reflect.get(target, prop, receiver)
        : undefined,
    })

    let s = store({box: theirs}, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.box.n = 5

    assert.deepEqual(hits, ['n'])
    assert.equal(s.box.n, undefined)
  })

  // gap: an inner proxy that answers its own receiver with something of its
  // own hides the change from us, while a reader of the store sees it
  test('an inner proxy answering itself hides the change', () => {
    let raw = {n: 1}
    let theirs
    theirs = new Proxy(raw, {
      get: (target, prop, receiver) => typeof prop === 'symbol' || receiver !== theirs
        ? Reflect.get(target, prop, receiver)
        : 99,
    })

    let s = store({box: theirs}, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.box.n = 5

    assert.deepEqual(hits, [])
    assert.equal(s.box.n, 5)
  })

  // an outer proxy is the receiver, so the write takes the slow path
  test('NaN over NaN through an outer proxy notifies nothing', () => {
    let o = {a: NaN}
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    new Proxy(s, {}).a = NaN

    assert.deepEqual(hits, [])
  })

  test('minus zero over plus zero through an outer proxy notifies', () => {
    let o = {a: 0}
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    new Proxy(s, {}).a = -0

    assert.deepEqual(hits, ['a'])
    assert.ok(Object.is(o.a, -0))
  })

  test('same value through an outer proxy notifies nothing', () => {
    let o = {a: 1}
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    new Proxy(s, {}).a = 1

    assert.deepEqual(hits, [])
  })

  test('a store used as a prototype keeps writes on the child', () => {
    let o = {a: 1}
    let s = store(o, [obj])
    let child = Object.create(s)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    child.a = 2

    assert.deepEqual(hits, [])
    assert.equal(o.a, 1)
    assert.equal(child.a, 2)
    assert.ok(Object.hasOwn(child, 'a'))
  })

  test('Reflect.set with a primitive receiver fails', () => {
    let o = {a: 1}
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    assert.equal(Reflect.set(s, 'a', 5, 1), false)
    assert.deepEqual(hits, [])
    assert.equal(o.a, 1)
  })

  // gap: the value is defined on the other store, not set on it, and defining
  // is not tracked, so neither store hears about the write
  test('Reflect.set into another store notifies nothing', () => {
    let a = {x: 1}
    let b = {x: 1}
    let sa = store(a, [obj])
    let sb = store(b, [obj])
    let hits = []

    onWrite(sa, (_, prop) => hits.push('a:' + prop))
    onWrite(sb, (_, prop) => hits.push('b:' + prop))

    assert.ok(Reflect.set(sa, 'x', 5, sb))

    assert.deepEqual(hits, [])
    assert.equal(a.x, 1)
    assert.equal(b.x, 5)
  })

  test('Reflect.set with a foreign receiver leaves the store alone', () => {
    let o = {a: 0}
    let s = store(o, [obj])
    let other = {}
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    assert.ok(Reflect.set(s, 'a', 5, other))
    assert.deepEqual(hits, [])
    assert.equal(o.a, 0)
    assert.equal(other.a, 5)
  })
})
