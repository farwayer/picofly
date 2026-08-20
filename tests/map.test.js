import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {store, onWrite, onRead, lock} from '../src/store.js'
import {objMap} from '../src/proxify/index.js'
import {EntriesSym, ValuesSym, SizeSym} from '../src/proxify/map.js'


suite('map', () => {
  // TODO: test iterators key/val proxify

  let booksMap = () => {
    return new Map().set('1', {
      id: '1',
      name: "Alice in Wonderland",
      author: "Lewis Carroll",
    })
  }

  let booksStore = () => {
    let m = booksMap()
    let s = store(m, objMap)

    return [m, s]
  }


  test('create', () => {
    let [m, s] = booksStore()

    let mBook = m.get('1')
    let sBook = s.get('1')

    assert.deepEqual(sBook, mBook)
  })

  test('create nested', () => {
    let o = {books: booksMap()}
    let s = store(o, objMap)

    let oBook = o.books.get('1')
    let sBook = s.books.get('1')

    assert.deepEqual(sBook, oBook)
  })

  test('size', () => {
    let [m, s] = booksStore()

    let sSize = s.size
    assert.equal(sSize, m.size)
  })

  test('size onRead', () => new Promise(resolve => {
    let [m, s] = booksStore()

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      assert.equal(key, SizeSym)
      resolve()
    })

    s.size
    assert.fail('unreachable')
  }))

  test('get', () => {
    let [m, s] = booksStore()

    let mBook = m.get('1')
    let sBook = s.get('1')

    assert.deepEqual(sBook, mBook)
  })

  test('get onRead', () => new Promise(resolve => {
    let [m, s] = booksStore()

    let called = 0

    onRead(s, (obj, key) => {
      if (!called++) {
        assert.equal(obj, m)
        assert.equal(key, Symbol.for('get'))
      } else {
        assert.equal(obj, m)
        assert.equal(key, '1')
        resolve()
      }
    })

    s.get('1')
    assert.fail('unreachable')
  }))

  test('has', () => {
    let [m, s] = booksStore()

    let sHas = s.has('1')
    let mHas = m.has('1')

    assert.equal(sHas, mHas)
  })

  test('has onRead', () => new Promise(resolve => {
    let [m, s] = booksStore()

    let called = 0

    onRead(s, (obj, key) => {
      if (!called++) {
        assert.equal(obj, m)
        assert.equal(key, Symbol.for('has'))
      } else {
        assert.equal(obj, m)
        assert.equal(key, '1')
        resolve()
      }
    })

    s.has('1')
    assert.fail('unreachable')
  }))

  test('keys', () => {
    let [m, s] = booksStore()

    let sKeys = Array.from(s.keys())
    let mKeys = Array.from(m.keys())

    assert.deepEqual(sKeys, mKeys)
  })

  test('keys onRead', () => new Promise(resolve => {
    let [m, s] = booksStore()

    let called = 0

    onRead(s, (obj, key) => {
      if (!called++) {
        assert.equal(obj, m)
        assert.equal(key, Symbol.for('keys'))
      } else {
        assert.equal(obj, m)
        resolve()
      }
    })

    s.keys()
    assert.fail('unreachable')
  }))

  test('values', () => {
    let [m, s] = booksStore()

    let sValues = Array.from(s.values())
    let mValues = Array.from(m.values())

    assert.deepEqual(sValues, mValues)
  })

  test('values onRead', () => new Promise(resolve => {
    let [m, s] = booksStore()

    let called = 0

    onRead(s, (obj, key) => {
      if (!called++) {
        assert.equal(obj, m)
        assert.equal(key, Symbol.for('values'))
      } else {
        assert.equal(obj, m)
        assert.equal(key, ValuesSym)
        resolve()
      }
    })

    s.values()
    assert.fail('unreachable')
  }))

  test('entries', () => {
    let [m, s] = booksStore()

    let sEntries = Array.from(s.entries())
    let mEntries = Array.from(m.entries())

    assert.deepEqual(sEntries, mEntries)
  })

  test('entries onRead', () => new Promise(resolve => {
    let [m, s] = booksStore()

    let called = 0

    onRead(s, (obj, key) => {
      if (!called++) {
        assert.equal(obj, m)
        assert.equal(key, Symbol.for('entries'))
      } else {
        assert.equal(obj, m)
        assert.equal(key, EntriesSym)
        resolve()
      }
    })

    s.entries()
    assert.fail('unreachable')
  }))

  test('forEach', () => new Promise(resolve => {
    let [m, s] = booksStore()

    let mBook = m.get('1')

    s.forEach((val, key, proxy) => {
      assert.deepEqual(key, '1')
      assert.deepEqual(val, mBook)
      assert.equal(proxy, s)
      resolve()
    })

    assert.fail('unreachable')
  }))

  test('forEach onRead', () => new Promise(resolve => {
    let [m, s] = booksStore()

    let called = 0

    onRead(s, (obj, key) => {
      if (!called++) {
        assert.equal(obj, m)
        assert.equal(key, Symbol.for('forEach'))
      } else {
        assert.equal(obj, m)
        resolve()
      }
    })

    s.forEach(() => {})
    assert.fail('unreachable')
  }))

  test('for..of', () => {
    let [m, s] = booksStore()

    let mBook = m.get('1')

    for (let entry of s) {
      assert.equal(entry[0], '1')
      assert.deepEqual(entry[1], mBook)
    }
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

  test('delete onRead', () => new Promise(resolve => {
    let [m, s] = booksStore()

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      assert.equal(key, Symbol.for('delete'))
      resolve()
    })

    s.delete('1')

    assert.fail('unreachable')
  }))

  test('delete onWrite', () => {
    let [_, s] = booksStore()

    let c, cSize, cValues, cEntries

    onWrite(s, (obj, key) => {
      switch (key) {
        case '1': return c = true
        case SizeSym: return cSize = true
        case ValuesSym: return cValues = true
        case EntriesSym: return cEntries = true
      }
    })

    s.delete('1')

    assert.ok(c, 'c')
    assert.ok(cSize, 'size')
    assert.ok(cValues, 'values')
    assert.ok(cEntries, 'entries')
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

  test('clear onRead', () => new Promise(resolve => {
    let [m, s] = booksStore()

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      assert.equal(key, Symbol.for('clear'))
      resolve()
    })

    s.clear()

    assert.fail('unreachable')
  }))

  test('clear onWrite', () => {
    let [m, s] = booksStore()
    m.set('2', {})

    let c1, c2, cSize, cValues, cEntries

    onWrite(s, (obj, key) => {
      switch (key) {
        case '1': return c1 = true
        case '2': return c2 = true
        case SizeSym: return cSize = true
        case ValuesSym: return cValues = true
        case EntriesSym: return cEntries = true
      }
    })

    s.clear()

    assert.ok(c1, 'c1')
    assert.ok(c2, 'c2')
    assert.ok(cSize, 'size')
    assert.ok(cValues, 'values')
    assert.ok(cEntries, 'entries')
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

  test('set onRead', () => new Promise(resolve => {
    let [m, s] = booksStore()
    let book2 = {}

    onRead(s, (obj, key) => {
      assert.equal(obj, m)
      assert.equal(key, Symbol.for('set'))
      resolve()
    })

    s.set('2', book2)

    assert.fail('unreachable')
  }))

  test('set onWrite new', () => {
    let [_, s] = booksStore()
    let book2 = {}

    let c, cSize, cValues, cEntries

    onWrite(s, (obj, key) => {
      switch (key) {
        case '2': return c = true
        case SizeSym: return cSize = true
        case ValuesSym: return cValues = true
        case EntriesSym: return cEntries = true
      }
    })

    s.set('2', book2)

    assert.ok(c, 'c')
    assert.ok(cSize, 'size')
    assert.ok(cValues, 'values')
    assert.ok(cEntries, 'entries')
  })

  test('set onWrite replace', () => {
    let [_, s] = booksStore()
    let book2 = {}

    let c, cValues, cEntries

    onWrite(s, (obj, key) => {
      switch (key) {
        case '1': return c = true
        case SizeSym: return assert.fail('unreachable')
        case ValuesSym: return cValues = true
        case EntriesSym: return cEntries = true
      }
    })

    s.set('1', book2)

    assert.ok(c, 'c')
    assert.ok(cValues, 'values')
    assert.ok(cEntries, 'entries')
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

  test('set obj prop onWrite', () => new Promise(resolve => {
    let [m, s] = booksStore()

    onWrite(s, (obj, key) => {
      assert.equal(obj, m)
      assert.equal(key, Symbol.for('test'))
      resolve()
    })

    s.test = 1
    assert.fail('unreachable')
  }))

  test('define obj prop', () => {
    let [m, s] = booksStore()

    Object.defineProperty(s, 'test', {value: 1})
    assert.equal(m.test, 1)
    assert.equal(s.test, 1)
  })

  test('define obj prop onWrite', () => new Promise(resolve => {
    let [m, s] = booksStore()

    onWrite(s, (obj, key) => {
      assert.equal(obj, m)
      assert.equal(key, Symbol.for('test'))
      resolve()
    })

    Object.defineProperty(s, 'test', {value: 1})
    assert.fail('unreachable')
  }))


  test('delete obj prop', () => {
    let [m, s] = booksStore()

    m.test = 1
    assert.equal(m.test, 1)

    delete s.test

    assert.ok(!('test' in m))
    assert.ok(!('test' in s))
  })

  test('delete obj prop onWrite', () => new Promise(resolve => {
    let [m, s] = booksStore()
    m.test = 1

    onWrite(s, (obj, key) => {
      assert.equal(obj, m)
      assert.equal(key, Symbol.for('test'))
      resolve()
    })

    delete s.test
    assert.fail('unreachable')
  }))

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
      Object.defineProperty(s, 'test2', {value: 1})
    }, /"store locked!" is not a function/)

    assert.throws(() => {
      delete s.test
    }, /"store locked!" is not a function/)
  })
})
