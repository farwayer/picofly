import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {store, onWrite, onRead, lock} from '../src/store.js'
import {obj, map} from '../src/rules/index.js'
import {ValuesSym, SizeSym} from '../src/rules/utils.js'


suite('map', () => {
  let rules = [obj, map]

  let booksMap = () => {
    return new Map().set('1', {
      id: '1',
      name: "Alice in Wonderland",
      author: "Lewis Carroll",
    })
  }

  let booksStore = () => {
    let m = booksMap()
    let s = store(m, rules)

    return [m, s]
  }

  // an object on both sides, to see the iterators proxify key and value
  let pairStore = () => {
    let key = {id: '1'}
    let m = new Map().set(key, {name: "Alice in Wonderland"})
    let s = store(m, rules)

    return [m, s, key]
  }


  test('foreign proxy on top', () => {
    let [m, s] = booksStore()
    let outer = new Proxy(s, {})

    assert.equal(outer.get('1'), s.get('1'))
    assert.equal(outer.has('1'), true)
    assert.equal(outer.size, 1)
    assert.equal([...outer.keys()].length, 1)

    let events = []
    onWrite(s, (obj, prop) => events.push(prop))

    outer.set('2', {id: '2'})
    assert.equal(m.get('2').id, '2')
    assert.ok(events.includes('2'))

    outer.delete('2')
    assert.equal(m.has('2'), false)
  })

  // the method wrapper decides its target from the receiver it was read with,
  // so a wrapper reading it second must still land on the raw Map
  test('foreign proxy after a direct read', () => {
    let [m, s] = booksStore()

    assert.ok(s.has('1'))
    assert.equal(s.get('1'), s.get('1'))

    let outer = new Proxy(s, {})

    assert.ok(outer.has('1'))
    assert.equal(outer.get('1'), s.get('1'))
    assert.equal(outer.size, 1)
    assert.deepEqual(Array.from(outer.keys()), ['1'])

    outer.set('2', {id: '2'})
    assert.equal(m.get('2').id, '2')
  })

  test('method borrowed to a raw Map', () => {
    let [, s] = booksStore()
    let other = new Map().set('9', 'x')

    assert.equal(s.get.call(other, '9'), 'x')
    assert.equal(s.has.call(other, '9'), true)
  })

  test('create', () => {
    let [m, s] = booksStore()

    let mBook = m.get('1')
    let sBook = s.get('1')

    assert.deepEqual(sBook, mBook)
  })

  test('create nested', () => {
    let o = {books: booksMap()}
    let s = store(o, rules)

    let oBook = o.books.get('1')
    let sBook = s.books.get('1')

    assert.deepEqual(sBook, oBook)
  })

  test('size', () => {
    let [m, s] = booksStore()

    let sSize = s.size
    assert.equal(sSize, m.size)
  })

  test('size onRead', () => {
    let [m, s] = booksStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.size

    assert.deepEqual(hits, [SizeSym])
  })

  test('get', () => {
    let [m, s] = booksStore()

    let mBook = m.get('1')
    let sBook = s.get('1')

    assert.deepEqual(sBook, mBook)
  })

  test('get onRead', () => {
    let [m, s] = booksStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.get('1')

    assert.deepEqual(hits, ['1'])
  })

  test('has', () => {
    let [m, s] = booksStore()

    let sHas = s.has('1')
    let mHas = m.has('1')

    assert.equal(sHas, mHas)
  })

  test('has onRead', () => {
    let [m, s] = booksStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.has('1')

    assert.deepEqual(hits, ['1'])
  })

  test('keys', () => {
    let [m, s] = booksStore()

    let sKeys = Array.from(s.keys())
    let mKeys = Array.from(m.keys())

    assert.deepEqual(sKeys, mKeys)
  })

  test('keys onRead', () => {
    let [m, s] = booksStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.keys()

    assert.deepEqual(hits, [SizeSym])
  })

  test('values', () => {
    let [m, s] = booksStore()

    let sValues = Array.from(s.values())
    let mValues = Array.from(m.values())

    assert.deepEqual(sValues, mValues)
  })

  test('values onRead', () => {
    let [m, s] = booksStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.values()

    assert.deepEqual(hits, [ValuesSym])
  })

  test('entries', () => {
    let [m, s] = booksStore()

    let sEntries = Array.from(s.entries())
    let mEntries = Array.from(m.entries())

    assert.deepEqual(sEntries, mEntries)
  })

  test('entries onRead', () => {
    let [m, s] = booksStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.entries()

    assert.deepEqual(hits, [ValuesSym])
  })

  test('forEach', () => {
    let [m, s] = booksStore()
    let calls = []

    s.forEach((val, key, proxy) => {
      assert.equal(proxy, s)
      calls.push([key, val])
    })

    assert.deepEqual(calls, [['1', m.get('1')]])
  })

  test('forEach onRead', () => {
    let [m, s] = booksStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.forEach(() => {})

    assert.deepEqual(hits, [ValuesSym])
  })

  test('for..of', () => {
    let [m, s] = booksStore()

    let mBook = m.get('1')

    for (let entry of s) {
      assert.equal(entry[0], '1')
      assert.deepEqual(entry[1], mBook)
    }
  })

  // what the iterators yield must be proxied, writes through it notify

  test('keys proxify', () => {
    let [, s, key] = pairStore()
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    let [proxied] = Array.from(s.keys())
    proxied.id = '2'

    assert.equal(key.id, '2')
    assert.deepEqual(hits, ['id'])
  })

  test('values proxify', () => {
    let [m, s, key] = pairStore()
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    let [proxied] = Array.from(s.values())
    proxied.name = 'Alice'

    assert.equal(m.get(key).name, 'Alice')
    assert.deepEqual(hits, ['name'])
  })

  test('entries proxify', () => {
    let [m, s, key] = pairStore()
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    let [[proxiedKey, proxiedValue]] = Array.from(s.entries())
    proxiedKey.id = '2'
    proxiedValue.name = 'Alice'

    assert.equal(key.id, '2')
    assert.equal(m.get(key).name, 'Alice')
    assert.deepEqual(hits, ['id', 'name'])
  })

  test('for..of proxify', () => {
    let [m, s, key] = pairStore()
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    for (let [proxiedKey, proxiedValue] of s) {
      proxiedKey.id = '2'
      proxiedValue.name = 'Alice'
    }

    assert.equal(key.id, '2')
    assert.equal(m.get(key).name, 'Alice')
    assert.deepEqual(hits, ['id', 'name'])
  })

  test('delete', () => {
    let [m, s] = booksStore()

    let res = s.delete('1')

    assert.ok(res)
    assert.ok(!(m.has('1')))
  })

  test('delete non-exist', () => {
    let [m, s] = booksStore()

    let res = s.delete('2')

    assert.ok(!(res))
    assert.ok(m.has('1'))
  })

  test('delete onRead', () => {
    let [m, s] = booksStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.delete('1')

    assert.deepEqual(hits, [])
  })

  test('delete onWrite', () => {
    let [m, s] = booksStore()
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.delete('1')

    assert.deepEqual(hits, [SizeSym, ValuesSym, '1'])
  })

  test('delete onWrite non-exist', () => {
    let [_, s] = booksStore()

    onWrite(s, () => {
      assert.fail('unreachable')
    })

    s.delete('2')
  })

  test('clear', () => {
    let [m, s] = booksStore()

    s.clear()

    assert.equal(m.size, 0)
  })

  test('clear onRead', () => {
    let [m, s] = booksStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.clear()

    assert.deepEqual(hits, [])
  })

  test('clear onWrite', () => {
    let [m, s] = booksStore()
    m.set('2', {})
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.clear()

    assert.deepEqual(hits, [SizeSym, ValuesSym, '1', '2'])
  })

  test('clear onWrite empty', () => {
    let [m, s] = booksStore()
    m.delete('1')

    onWrite(s, () => {
      assert.fail('unreachable')
    })

    s.clear()
  })

  test('set', () => {
    let [m, s] = booksStore()
    let book2 = {}

    let resS = s.set('2', book2)
    let mBook2 = m.get('2')

    assert.equal(resS, s)
    assert.equal(mBook2, book2)
  })

  test('set onRead', () => {
    let [m, s] = booksStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.set('2', {})

    assert.deepEqual(hits, [])
  })

  test('set onWrite new', () => {
    let [m, s] = booksStore()
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.set('2', {})

    assert.deepEqual(hits, [SizeSym, ValuesSym, '2'])
  })

  test('set onWrite replace', () => {
    let [m, s] = booksStore()
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.set('1', {})

    assert.deepEqual(hits, [ValuesSym, '1'])
  })

  test('set onWrite same', () => {
    let [m, s] = booksStore()
    let mBook = m.get('1')

    onWrite(s, () => {
      assert.fail('unreachable')
    })

    s.set('1', mBook)
  })

  test('set obj prop', () => {
    let [m, s] = booksStore()

    s.test = 1

    assert.equal(m.test, 1)
    assert.equal(s.test, 1)
  })

  test('set obj prop onWrite', () => {
    let [m, s] = booksStore()
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    s.test = 1

    assert.deepEqual(hits, [Symbol.for('test')])
  })

  test('delete obj prop', () => {
    let [m, s] = booksStore()

    m.test = 1
    assert.equal(m.test, 1)

    delete s.test

    assert.ok(!('test' in m))
    assert.ok(!('test' in s))
  })

  test('delete obj prop onWrite', () => {
    let [m, s] = booksStore()
    m.test = 1
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, m)
      hits.push(key)
    })

    delete s.test

    assert.deepEqual(hits, [Symbol.for('test')])
  })

  test('set obj prop replace onWrite', () => {
    let [m, s] = booksStore()
    s.test = 1

    let hits = []
    onWrite(s, (_, prop) => hits.push(prop))
    s.test = 2

    assert.equal(m.test, 2)
    assert.deepEqual(hits, [Symbol.for('test')])
  })

  test('set obj prop same onWrite', () => {
    let [, s] = booksStore()
    s.test = 1

    let hits = []
    onWrite(s, (_, prop) => hits.push(prop))
    s.test = 1

    assert.deepEqual(hits, [])
  })

  test('get obj prop onRead', () => {
    let [m, s] = booksStore()
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
    let [m, s] = booksStore()
    m.test = {n: 1}

    let hits = []
    onWrite(s, (_, prop) => hits.push(prop))
    s.test.n = 2

    assert.notEqual(s.test, m.test)
    assert.equal(m.test.n, 2)
    assert.deepEqual(hits, ['n'])
  })

  test('obj prop stores the value raw', () => {
    let [m, s] = booksStore()

    s.book = s.get('1')

    assert.equal(m.book, m.get('1'))
  })

  // props are namespaced with Symbol.for, so map.x and map.get('x')
  // stay different subscriptions
  test('obj prop and map key with the same name', () => {
    let [m, s] = booksStore()
    s.set('x', 1)

    let hits = []
    onWrite(s, (_, prop) => hits.push(prop))
    s.x = 2

    assert.deepEqual(hits, [Symbol.for('x')])
    assert.equal(s.get('x'), 1)
    assert.equal(m.x, 2)
  })

  test('obj prop and map key with the same name onRead', () => {
    let [, s] = booksStore()
    s.set('x', 1)
    s.x = 2

    let hits = []
    onRead(s, (_, prop) => hits.push(prop))

    assert.equal(s.get('x'), 1)
    assert.equal(s.x, 2)

    assert.deepEqual(hits, ['x', Symbol.for('x')])
  })

  test('symbol obj prop is not namespaced', () => {
    let [m, s] = booksStore()
    let sym = Symbol('test')

    let hits = []
    onWrite(s, (_, prop) => hits.push(prop))
    s[sym] = 1

    assert.equal(m[sym], 1)
    assert.deepEqual(hits, [sym])
  })

  test('lock', () => {
    let [_, s] = booksStore()
    s.test = 1

    lock(s)

    assert.throws(() => {
      s.delete('1')
    }, /"store locked!" is not a function/)

    assert.throws(() => {
      s.clear()
    }, /"store locked!" is not a function/)

    assert.throws(() => {
      s.set('1', {})
    }, /"store locked!" is not a function/)

    assert.throws(() => {
      s.test2 = 1
    }, /"store locked!" is not a function/)

    assert.throws(() => {
      delete s.test
    }, /"store locked!" is not a function/)
  })
  // a value read back from the store is our proxy; writing it in again has to
  // land raw in the Map, otherwise the data grows a proxy layer per write and
  // every write looks like a change
  test('set stores the value raw', () => {
    let raw = {n: 1}
    let m = new Map().set('k', raw)
    let s = store(m, rules)

    s.set('k', s.get('k'))

    assert.equal(m.get('k'), raw)
  })

  test('set with the value just read notifies nothing', () => {
    let m = new Map().set('k', {n: 1})
    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))
    s.set('k', s.get('k'))

    assert.deepEqual(hits, [])
  })

  test('proxy key is stored raw', () => {
    let raw = {id: 1}
    let m = new Map().set(raw, 'a')
    let s = store(m, rules)
    let [key] = Array.from(s.keys())

    s.set(key, 'b')

    assert.equal(m.size, 1)
    assert.equal(m.get(raw), 'b')
  })

  test('get and has take a proxy key', () => {
    let raw = {id: 1}
    let m = new Map().set(raw, 'a')
    let s = store(m, rules)
    let [key] = Array.from(s.keys())

    assert.equal(s.get(key), 'a')
    assert.ok(s.has(key))
  })

  test('delete inherited prop notifies nothing', () => {
    class MyMap extends Map {}
    MyMap.prototype.tag = 'x'

    let m = new MyMap()
    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    delete s.tag

    assert.deepEqual(hits, [])
    assert.equal(s.tag, 'x')
  })

  test('delete non-configurable prop returns false', () => {
    let m = new Map()
    Object.defineProperty(m, 'tag', {value: 'x', configurable: false})

    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    assert.equal(Reflect.deleteProperty(s, 'tag'), false)
    assert.equal(m.tag, 'x')
    assert.deepEqual(hits, [])
  })

  test('delete an inherited method leaves it working', () => {
    let m = new Map([[1, 1]])
    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    delete s.get

    assert.deepEqual(hits, [])
    assert.equal(s.get(1), 1)
  })

  test('delete symbol prop notifies with the symbol', () => {
    let sym = Symbol('mine')
    let m = new Map([[1, 1]])
    m[sym] = 1

    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    delete s[sym]

    assert.deepEqual(hits, [sym])
    assert.equal(sym in m, false)
  })

  // unwrapping it would cut the object out of the other store, so it stays
  // a proxy in our data and a write notifies both sides
  test('a proxy from another store keeps its own tracking', () => {
    let raw = {n: 1}
    let other = store(raw, [obj])
    let s = store(new Map(), rules)

    let ours = []
    let theirs = []

    onWrite(other, (_, prop) => theirs.push(prop))

    s.set('x', other)
    onWrite(s, (_, prop) => ours.push(prop))

    s.get('x').n = 2

    assert.equal(raw.n, 2)
    assert.deepEqual(ours, ['n'])
    assert.deepEqual(theirs, ['n'])
  })

  // === says NaN differs from NaN and -0 equals +0, Object.is has it right
  test('set NaN over NaN notifies nothing', () => {
    let m = new Map([['1', NaN]])
    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.set('1', NaN)

    assert.deepEqual(hits, [])
  })

  test('set minus zero over plus zero is written', () => {
    let m = new Map([['1', 0]])
    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.set('1', -0)

    assert.ok(Object.is(m.get('1'), -0))
    assert.deepEqual(hits, [ValuesSym, '1'])
  })

  test('prop NaN over NaN notifies nothing', () => {
    let m = new Map()
    m.tag = NaN

    let s = store(m, rules)
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    s.tag = NaN

    assert.deepEqual(hits, [])
  })
})
