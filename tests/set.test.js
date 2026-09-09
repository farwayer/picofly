import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {store, onWrite, onRead, lock} from '../src/store.js'
import {obj, set} from '../src/rules/index.js'
import {KeysSym, SizeSym} from '../src/rules/utils.js'


suite('set', () => {
  let rules = [obj, set]

  let colorSet = () => {
    return new Set()
  		.add('green')
  		.add('purple')
  }

  let colorStore = () => {
    let m = colorSet()
    let s = store(m, rules)

    return [m, s]
  }

  // an object inside, to see the iterators proxify what they yield
  let objStore = () => {
    let item = {name: 'green'}
    let m = new Set().add(item)
    let s = store(m, rules)

    return [m, s, item]
  }


  // both sides of `this === receiver ? set : this` in the method wrappers
  test('foreign proxy on top', () => {
    let [m, s] = colorStore()
    let outer = new Proxy(s, {})

    assert.equal(outer.has('green'), true)
    assert.equal(outer.size, 2)
    assert.equal([...outer.values()].length, 2)

    let events = []
    onWrite(s, (_, prop) => events.push(prop))

    outer.add('red')
    assert.ok(m.has('red'))
    assert.ok(events.includes('red'))

    outer.delete('red')
    assert.equal(m.has('red'), false)
  })

  // same as in map: the wrapper may read a method after the store did
  test('foreign proxy after a direct read', () => {
    let [m, s] = colorStore()

    assert.ok(s.has('green'))

    let outer = new Proxy(s, {})

    assert.ok(outer.has('green'))
    assert.equal(outer.size, 2)
    assert.deepEqual(Array.from(outer.values()), ['green', 'purple'])

    outer.add('red')
    assert.ok(m.has('red'))
  })

  test('method borrowed to a raw Set', () => {
    let [, s] = colorStore()
    let other = new Set().add('yellow')

    assert.equal(s.has.call(other, 'yellow'), true)
    assert.equal(s.has.call(other, 'green'), false)

    s.add.call(other, 'blue')
    assert.ok(other.has('blue'))
  })

  test('create', () => {
    let [m, s] = colorStore()

  	let sValues = Array.from(s.values())
  	let mValues = Array.from(m.values())

    assert.deepEqual(sValues, mValues)
  })

  test('size', () => {
    let [m, s] = colorStore()

    assert.equal(s.size, m.size)
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

  test('a read subscriber cannot change what has returns', () => {
    let raw = new Set(['a'])
    let s = store(raw, rules)

    let off = onRead(s, () => {
      raw.delete('a')
    })

    assert.equal(s.has('a'), true)
    off()
    assert.equal(raw.has('a'), false)
  })

  test('has wakes on its own value only', () => {
    let s = store(new Set(['a']), rules)

    assert.equal(wakes(s, () => s.has('a'), () => s.add('b')), false)
    assert.equal(wakes(s, () => s.has('a'), () => s.delete('a')), true)
  })

  // the other side of map's `has wakes on a value change too`: a set holds no
  // value to replace, so adding what is already there wakes nobody
  test('has sleeps through a re-add', () => {
    let s = store(new Set(['a']), rules)

    assert.equal(wakes(s, () => s.has('a'), () => s.add('a')), false)
  })

  test('size wakes on a new value', () => {
    let s = store(new Set(['a']), rules)

    assert.equal(wakes(s, () => s.size, () => s.add('a')), false)
    assert.equal(wakes(s, () => s.size, () => s.add('b')), true)
  })

  // gap: `[[GetOwnProperty]]` has no trap, so asking whether a prop is there
  // without reading it is not a read. Trapping it would fire on every key of
  // every enumeration — the engine checks enumerable through it — and the
  // answer is the one `in` already tracks
  test('asking for an own prop tracks nothing', () => {
    let m = new Set()
    m.x = 1
    let s = store(m, rules)
    let hits = []

    let off = onRead(s, (_, prop) => hits.push(prop))

    Object.hasOwn(s, 'x')
    Object.getOwnPropertyDescriptor(s, 'x')
    off()

    assert.deepEqual(hits, [])
  })

  test('in is a read', () => {
    let m = new Set()
    m.x = 1
    let s = store(m, rules)
    let hits = []

    let off = onRead(s, (_, prop) => hits.push(prop))

    'x' in s
    'zz' in s
    off()

    // object props are namespaced, the way get and set already do it
    assert.deepEqual(hits, [Symbol.for('x'), Symbol.for('zz')])
  })

  test('listing keys is a read', () => {
    let m = new Set()
    m.x = 1
    let s = store(m, rules)
    let hits = []

    let off = onRead(s, (_, prop) => hits.push(prop))

    Object.keys(s)
    off()

    assert.deepEqual(hits, [KeysSym])
  })

  test('listing keys wakes on a new prop only', () => {
    let m = new Set()
    m.x = 1
    let s = store(m, rules)

    assert.equal(wakes(s, () => Object.keys(s), () => { s.y = 2 }), true)
    assert.equal(wakes(s, () => Object.keys(s), () => { s.x = 3 }), false)
  })

  test('a read subscriber cannot change what in returns', () => {
    let m = new Set()
    m.x = 1
    let s = store(m, rules)

    let off = onRead(s, () => {
      delete m.x
    })

    assert.equal('x' in s, true)
    off()
    assert.equal('x' in m, false)
  })

  test('a read subscriber cannot change the key list', () => {
    let m = new Set()
    m.x = 1
    m.y = 2
    let s = store(m, rules)

    let off = onRead(s, () => {
      delete m.y
    })

    assert.deepEqual(Reflect.ownKeys(s), ['x', 'y'])
    off()
    assert.deepEqual(Reflect.ownKeys(m), ['x'])
  })

  test('size onRead', () => {
    let [m, s] = colorStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.size

    assert.deepEqual(hits, [SizeSym])
  })

  test('has', () => {
    let [m, s] = colorStore()

    let sHas = s.has('green')
    let mHas = m.has('green')

    assert.equal(sHas, mHas)
  })

  test('has onRead', () => {
    let [m, s] = colorStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.has('green')

    assert.deepEqual(hits, ['green'])
  })

  test('keys', () => {
    let [m, s] = colorStore()

    let sKeys = Array.from(s.keys())
    let mKeys = Array.from(m.keys())

    assert.deepEqual(sKeys, mKeys)
  })

  test('keys onRead', () => {
    let [m, s] = colorStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.keys()

    assert.deepEqual(hits, [SizeSym])
  })

  test('values', () => {
    let [m, s] = colorStore()

    let sValues = Array.from(s.values())
    let mValues = Array.from(m.values())

    assert.deepEqual(sValues, mValues)
  })

  test('values onRead', () => {
    let [m, s] = colorStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.values()

    assert.deepEqual(hits, [SizeSym])
  })

  test('entries', () => {
    let [m, s] = colorStore()

    let sEntries = Array.from(s.entries())
    let mEntries = Array.from(m.entries())

    assert.deepEqual(sEntries, mEntries)
  })

  test('entries onRead', () => {
    let [m, s] = colorStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.entries()

    assert.deepEqual(hits, [SizeSym])
  })

  test('forEach', () => {
    let [, s] = colorStore()
    let calls = []

    s.forEach((val, key, proxy) => {
      assert.equal(proxy, s)
      calls.push([key, val])
    })

    assert.deepEqual(calls, [['green', 'green'], ['purple', 'purple']])
  })

  test('forEach onRead', () => {
    let [m, s] = colorStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.forEach(() => {})

    assert.deepEqual(hits, [SizeSym])
  })

  test('for..of', () => {
    let [m, s] = colorStore()

  	let called = 0

    for (let val of s) {
  		if (!called++) {
  			assert.equal(val, 'green')
  		} else {
  			assert.equal(val, 'purple')
  		}
    }
  })

  // what the iterators yield must be proxied, writes through it notify

  test('values proxify', () => {
    let [, s, item] = objStore()
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    let [proxied] = Array.from(s.values())
    proxied.name = 'red'

    assert.equal(item.name, 'red')
    assert.deepEqual(hits, ['name'])
  })

  test('keys proxify', () => {
    let [, s, item] = objStore()
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    let [proxied] = Array.from(s.keys())
    proxied.name = 'red'

    assert.equal(item.name, 'red')
    assert.deepEqual(hits, ['name'])
  })

  // entries gives the same value twice, both sides proxied
  test('entries proxify', () => {
    let [, s, item] = objStore()
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    let [[first, second]] = Array.from(s.entries())
    assert.equal(first, second)

    first.name = 'red'
    second.color = 'blue'

    assert.equal(item.name, 'red')
    assert.equal(item.color, 'blue')
    assert.deepEqual(hits, ['name', KeysSym, 'color'])
  })

  test('for..of proxify', () => {
    let [, s, item] = objStore()
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    for (let proxied of s) {
      proxied.name = 'red'
    }

    assert.equal(item.name, 'red')
    assert.deepEqual(hits, ['name'])
  })

  test('delete', () => {
    let [m, s] = colorStore()

    let res = s.delete('purple')

    assert.ok(res)
    assert.ok(!(m.has('purple')))
    assert.equal(m.size, 1)
  })

  test('delete non-exist', () => {
    let [m, s] = colorStore()

    let res = s.delete('blue')

    assert.ok(!(res))
    assert.ok(m.has('green'))
    assert.ok(m.has('purple'))
  	assert.equal(m.size, 2)
  })

  test('delete onRead', () => {
    let [m, s] = colorStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.delete('green')

    assert.deepEqual(hits, [])
  })

  test('delete onWrite', () => {
    let [m, s] = colorStore()
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.delete('green')

    assert.deepEqual(hits, [SizeSym, 'green'])
  })

  test('delete onWrite non-exist', () => {
    let [_, s] = colorStore()

    onWrite(s, () => {
      assert.fail('unreachable')
    })

    s.delete('blue')
  })

  test('clear', () => {
    let [m, s] = colorStore()

    s.clear()

    assert.equal(m.size, 0)
  })

  test('clear onRead', () => {
    let [m, s] = colorStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.clear()

    assert.deepEqual(hits, [])
  })

  test('clear onWrite', () => {
    let [m, s] = colorStore()
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.clear()

    assert.deepEqual(hits, [SizeSym, 'green', 'purple'])
  })

  test('clear onWrite empty', () => {
    let [m, s] = colorStore()
    m.delete('green')
    m.delete('purple')

    onWrite(s, () => {
      assert.fail('unreachable')
    })

    s.clear()
  })

  test('add', () => {
    let [m, s] = colorStore()

    let resS = s.add('blue')

    assert.equal(resS, s)
    assert.equal(m.size, 3)
    assert.deepEqual(Array.from(m), ['green', 'purple', 'blue'])
  })

  test('add onRead', () => {
    let [m, s] = colorStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.add('blue')

    assert.deepEqual(hits, [])
  })

  test('add onWrite new', () => {
    let [m, s] = colorStore()
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.add('blue')

    assert.deepEqual(hits, [SizeSym, 'blue'])
  })

  test('add onWrite same', () => {
    let [m, s] = colorStore()

    onWrite(s, () => {
      assert.fail('unreachable')
    })

    s.add('green')
  })

  test('set obj prop', () => {
    let [m, s] = colorStore()

    s.test = 1

    assert.equal(m.test, 1)
    assert.equal(s.test, 1)
  })

  test('set obj prop onWrite', () => {
    let [m, s] = colorStore()
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.test = 1

    assert.deepEqual(hits, [KeysSym, Symbol.for('test')])
  })

  test('delete obj prop', () => {
    let [m, s] = colorStore()

    m.test = 1
    assert.equal(m.test, 1)

    delete s.test

    assert.ok(!('test' in m))
    assert.ok(!('test' in s))
  })

  test('delete obj prop onWrite', () => {
    let [m, s] = colorStore()
    m.test = 1
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    delete s.test

    assert.deepEqual(hits, [KeysSym, Symbol.for('test')])
  })

  test('set obj prop replace onWrite', () => {
    let [m, s] = colorStore()
    s.test = 1

    let hits = []
    onWrite(s, (_, prop) => hits.push(prop))
    s.test = 2

    assert.equal(m.test, 2)
    assert.deepEqual(hits, [Symbol.for('test')])
  })

  test('set obj prop same onWrite', () => {
    let [, s] = colorStore()
    s.test = 1

    let hits = []
    onWrite(s, (_, prop) => hits.push(prop))
    s.test = 1

    assert.deepEqual(hits, [])
  })

  test('get obj prop onRead', () => {
    let [m, s] = colorStore()
    m.test = 1

    let hits = []
    onRead(s, (obj, prop) => {
      assert.equal(obj, m)
      hits.push(prop)
    })

    assert.equal(s.test, 1)
    assert.deepEqual(hits, [Symbol.for('test')])
  })

  test('obj prop object value is proxified', () => {
    let [m, s] = colorStore()
    m.test = {n: 1}

    let hits = []
    onWrite(s, (_, prop) => hits.push(prop))
    s.test.n = 2

    assert.notEqual(s.test, m.test)
    assert.equal(m.test.n, 2)
    assert.deepEqual(hits, ['n'])
  })

  test('obj prop stores the value raw', () => {
    let raw = {n: 1}
    let set = new Set([raw])
    let s = store(set, rules)
    let [item] = Array.from(s.values())

    s.item = item

    assert.equal(set.item, raw)
  })

  // props are namespaced with Symbol.for, so set.x and set.has('x')
  // stay different subscriptions
  test('obj prop and set element with the same name', () => {
    let [m, s] = colorStore()
    s.add('x')

    let hits = []
    onWrite(s, (_, prop) => hits.push(prop))
    s.x = 2

    assert.deepEqual(hits, [KeysSym, Symbol.for('x')])
    assert.ok(s.has('x'))
    assert.equal(m.x, 2)
  })

  test('obj prop and set element with the same name onRead', () => {
    let [, s] = colorStore()
    s.add('x')
    s.x = 2

    let hits = []
    onRead(s, (_, prop) => hits.push(prop))

    assert.ok(s.has('x'))
    assert.equal(s.x, 2)

    assert.deepEqual(hits, ['x', Symbol.for('x')])
  })

  test('symbol obj prop is not namespaced', () => {
    let [m, s] = colorStore()
    let sym = Symbol('test')

    let hits = []
    onWrite(s, (_, prop) => hits.push(prop))
    s[sym] = 1

    assert.equal(m[sym], 1)
    assert.deepEqual(hits, [KeysSym, sym])
  })

  test('lock', () => {
    let [_, s] = colorStore()
    s.test = 1

    lock(s)

    assert.throws(() => {
      s.delete('green')
    }, /"store locked!" is not a function/)

    assert.throws(() => {
      s.clear()
    }, /"store locked!" is not a function/)

    assert.throws(() => {
      s.add('green', {})
    }, /"store locked!" is not a function/)

    assert.throws(() => {
      s.test2 = 1
    }, /"store locked!" is not a function/)

    assert.throws(() => {
      delete s.test
    }, /"store locked!" is not a function/)
  })
  // same as in map: an element read back is our proxy, adding it again must not
  // put a second entry into the raw Set
  test('add stores the value raw', () => {
    let raw = {n: 1}
    let set = new Set([raw])
    let s = store(set, rules)
    let [item] = Array.from(s.values())

    s.add(item)

    assert.equal(set.size, 1)
    assert.ok(set.has(raw))
  })

  test('add of an element just read notifies nothing', () => {
    let set = new Set([{n: 1}])
    let s = store(set, rules)
    let hits = []
    let [item] = Array.from(s.values())

    onWrite(s, (_, prop) => hits.push(prop))
    s.add(item)

    assert.deepEqual(hits, [])
  })

  test('has and delete take a proxied element', () => {
    let raw = {n: 1}
    let set = new Set([raw])
    let s = store(set, rules)
    let [item] = Array.from(s.values())

    assert.ok(s.has(item))
    assert.ok(s.delete(item))
    assert.equal(set.size, 0)
  })

  test('shadowing a prop with the same value notifies nothing', () => {
    class MySet extends Set {}
    MySet.prototype.tag = 'x'

    let m = new MySet()
    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.tag = 'x'

    assert.deepEqual(hits, [])
    assert.ok(Object.hasOwn(m, 'tag'))
  })

  test('accessor with a getter notifies its own prop too', () => {
    class MySet extends Set {
      _n = 1

      get n() {
        return this._n
      }

      set n(v) {
        this._n = v
      }
    }

    let m = new MySet()
    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.n = 2

    assert.deepEqual(hits, [Symbol.for('_n'), Symbol.for('n')])
    assert.equal(m._n, 2)
  })

  // gap: `had` looks at the prototype, so shadowing an inherited prop makes a
  // new own key while the key set stays quiet. Telling that apart would cost
  // an `Object.hasOwn` on every write
  test('inherited prop becomes own on write', () => {
    class MySet extends Set {}
    MySet.prototype.tag = 'x'

    let m = new MySet()
    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.tag = 'y'

    assert.deepEqual(hits, [Symbol.for('tag')])
    // the key list grew and nobody heard about it
    assert.deepEqual(Reflect.ownKeys(m), ['tag'])
    assert.equal(MySet.prototype.tag, 'x')
    assert.equal(s.tag, 'y')
  })

  test('delete inherited prop notifies nothing', () => {
    class MySet extends Set {}
    MySet.prototype.tag = 'x'

    let m = new MySet()
    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    delete s.tag

    assert.deepEqual(hits, [])
    assert.equal(s.tag, 'x')
  })

  test('delete non-configurable prop returns false', () => {
    let m = new Set()
    Object.defineProperty(m, 'tag', {value: 'x', configurable: false})

    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    assert.equal(Reflect.deleteProperty(s, 'tag'), false)
    assert.equal(m.tag, 'x')
    assert.deepEqual(hits, [])
  })

  test('delete an inherited method leaves it working', () => {
    let m = new Set([1])
    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    delete s.has

    assert.deepEqual(hits, [])
    assert.equal(s.has(1), true)
  })

  test('delete symbol prop notifies with the symbol', () => {
    let sym = Symbol('mine')
    let m = new Set([1])
    m[sym] = 1

    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    delete s[sym]

    assert.deepEqual(hits, [KeysSym, sym])
    assert.equal(sym in m, false)
  })

  // unwrapping it would cut the object out of the other store, so it stays
  // a proxy in our data and a write notifies both sides
  test('a proxy from another store keeps its own tracking', () => {
    let raw = {n: 1}
    let other = store(raw, [obj])
    let s = store(new Set(), rules)

    let ours = []
    let theirs = []

    onWrite(other, (_, prop) => theirs.push(prop))

    s.add(other)
    onWrite(s, (_, prop) => ours.push(prop))

    let [item] = Array.from(s.values())
    item.n = 2

    assert.equal(raw.n, 2)
    assert.deepEqual(ours, ['n'])
    assert.deepEqual(theirs, ['n'])
  })

  // add compares by SameValueZero, like a real Set does
  test('add NaN twice notifies once', () => {
    let m = new Set()
    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.add(NaN)
    s.add(NaN)

    assert.equal(m.size, 1)
    assert.deepEqual(hits, [SizeSym, NaN])
  })

  test('add minus zero over plus zero notifies nothing', () => {
    let m = new Set([0])
    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.add(-0)

    assert.equal(m.size, 1)
    assert.deepEqual(hits, [])
  })

  // === says NaN differs from NaN and -0 equals +0, Object.is has it right
  test('prop same value through an outer proxy notifies nothing', () => {
    let m = new Set()
    m.tag = 1

    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    new Proxy(s, {}).tag = 1

    assert.deepEqual(hits, [])
  })

  test('a store used as a prototype keeps writes on the child', () => {
    let m = new Set()
    m.tag = 1

    let s = store(m, rules)
    let child = Object.create(s)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    child.tag = 2

    assert.deepEqual(hits, [])
    assert.equal(m.tag, 1)
    assert.ok(Object.hasOwn(child, 'tag'))
  })

  test('Reflect.set with a primitive receiver fails', () => {
    let m = new Set()
    m.tag = 1

    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    assert.equal(Reflect.set(s, 'tag', 5, 1), false)
    assert.deepEqual(hits, [])
    assert.equal(m.tag, 1)
  })

  // gap: the value is defined on the other store, not set on it, and defining
  // is not tracked, so neither store hears about the write
  test('Reflect.set into another store notifies nothing', () => {
    let a = new Set()
    a.tag = 1
    let b = new Set()
    b.tag = 1

    let sa = store(a, rules)
    let sb = store(b, rules)
    let hits = []

    onWrite(sa, (_, prop) => hits.push('a:' + String(prop)))
    onWrite(sb, (_, prop) => hits.push('b:' + String(prop)))

    assert.ok(Reflect.set(sa, 'tag', 5, sb))

    assert.deepEqual(hits, [])
    assert.equal(a.tag, 1)
    assert.equal(b.tag, 5)
  })


  test('an inner proxy handing out fresh wrappers notifies nothing', () => {
    let raw = new Set()
    raw.tag = 1
    let theirs
    theirs = new Proxy(raw, {
      get: (target, prop, receiver) => typeof prop === 'symbol' || receiver === theirs
        ? Reflect.get(target, prop, receiver)
        : {of: Reflect.get(target, prop, receiver)},
    })

    let s = store(theirs, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.tag = 1

    assert.deepEqual(hits, [])
    assert.equal(raw.tag, 1)
  })

  test('an inner proxy unwrapping a ref notifies the change', () => {
    let ref = {value: 1}
    let raw = new Set()
    raw.tag = ref
    let theirs
    theirs = new Proxy(raw, {
      get: (target, prop, receiver) => prop === 'tag' && receiver === theirs
        ? Reflect.get(target, prop, receiver).value
        : Reflect.get(target, prop, receiver),
      set(target, prop, val) {
        target[prop].value = val
        return true
      },
    })

    let s = store(theirs, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.tag = 5

    assert.deepEqual(hits, [Symbol.for('tag')])
    assert.equal(ref.value, 5)
  })

  // gap: an inner proxy that keeps its state for its own receiver shows us the
  // real value while a reader of the store gets undefined, so we announce a
  // change nobody can see
  test('an inner proxy guarding its state over-notifies', () => {
    let raw = new Set()
    raw.tag = 1
    let theirs
    theirs = new Proxy(raw, {
      get: (target, prop, receiver) => typeof prop === 'symbol' || receiver === theirs
        ? Reflect.get(target, prop, receiver)
        : undefined,
    })

    let s = store(theirs, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.tag = 5

    assert.deepEqual(hits, [Symbol.for('tag')])
    assert.equal(s.tag, undefined)
  })

  // gap: an inner proxy that answers its own receiver with something of its
  // own hides the change from us, while a reader of the store sees it
  test('an inner proxy answering itself hides the change', () => {
    let raw = new Set()
    raw.tag = 1
    let theirs
    theirs = new Proxy(raw, {
      get: (target, prop, receiver) => typeof prop === 'symbol' || receiver !== theirs
        ? Reflect.get(target, prop, receiver)
        : 99,
    })

    let s = store(theirs, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.tag = 5

    assert.deepEqual(hits, [])
    assert.equal(s.tag, 5)
  })

  // an outer proxy is the receiver, so the prop write takes the slow path
  test('prop NaN through an outer proxy notifies nothing', () => {
    let m = new Set()
    m.tag = NaN

    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    new Proxy(s, {}).tag = NaN

    assert.deepEqual(hits, [])
  })

  test('prop minus zero through an outer proxy notifies', () => {
    let m = new Set()
    m.tag = 0

    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    new Proxy(s, {}).tag = -0

    assert.deepEqual(hits, [Symbol.for('tag')])
    assert.ok(Object.is(m.tag, -0))
  })

  test('prop NaN over NaN notifies nothing', () => {
    let m = new Set()
    m.tag = NaN

    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.tag = NaN

    assert.deepEqual(hits, [])
  })
})
