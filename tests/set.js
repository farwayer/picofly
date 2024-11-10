import {test} from 'uvu'
import * as assert from 'uvu/assert'
import {create, onWrite, onRead, lock} from '../src/store.js'
import {objMapSetIgnoreSpecialsRef} from '../src/proxify/index.js'
import {SizeSym} from '../src/proxify/set.js'

// TODO: test iterators key/val proxify

let colorSet = () => {
  return new Set()
		.add('green')
		.add('purple')
}

let colorStore = () => {
  let m = colorSet()
  let s = create(m, objMapSetIgnoreSpecialsRef)

  return [m, s]
}


test('create', () => {
  let [m, s] = colorStore()

	let sValues = Array.from(s.values())
	let mValues = Array.from(m.values())

  assert.equal(sValues, mValues)
})

test('size', () => {
  let [m, s] = colorStore()

  assert.is(s.size, m.size)
})

test('size onRead', () => new Promise(resolve => {
  let [m, s] = colorStore()

  onRead(s, (obj, key) => {
    assert.is(obj, m)
    assert.is(key, SizeSym)
    resolve()
  })

  s.size
  assert.unreachable()
}))

test('has', () => {
  let [m, s] = colorStore()

  let sHas = s.has('green')
  let mHas = m.has('green')

  assert.is(sHas, mHas)
})

test('has onRead', () => new Promise(resolve => {
  let [m, s] = colorStore()

  let called = 0

  onRead(s, (obj, key) => {
    if (!called++) {
      assert.is(obj, m)
      assert.is(key, Symbol.for('has'))
    } else {
      assert.is(obj, m)
      assert.is(key, 'green')
      resolve()
    }
  })

  s.has('green')
  assert.unreachable()
}))

test('keys', () => {
  let [m, s] = colorStore()

  let sKeys = Array.from(s.keys())
  let mKeys = Array.from(m.keys())

  assert.equal(sKeys, mKeys)
})

test('keys onRead', () => new Promise(resolve => {
  let [m, s] = colorStore()

  let called = 0

  onRead(s, (obj, key) => {
    if (!called++) {
      assert.is(obj, m)
      assert.is(key, Symbol.for('keys'))
    } else {
      assert.is(obj, m)
      resolve()
    }
  })

  s.keys()
  assert.unreachable()
}))

test('values', () => {
  let [m, s] = colorStore()

  let sValues = Array.from(s.values())
  let mValues = Array.from(m.values())

  assert.equal(sValues, mValues)
})

test('values onRead', () => new Promise(resolve => {
  let [m, s] = colorStore()

  let called = 0

  onRead(s, (obj, key) => {
    if (!called++) {
      assert.is(obj, m)
      assert.is(key, Symbol.for('values'))
    } else {
      assert.is(obj, m)
      assert.is(key, SizeSym)
      resolve()
    }
  })

  s.values()
  assert.unreachable()
}))

test('entries', () => {
  let [m, s] = colorStore()

  let sEntries = Array.from(s.entries())
  let mEntries = Array.from(m.entries())

  assert.equal(sEntries, mEntries)
})

test('entries onRead', () => new Promise(resolve => {
  let [m, s] = colorStore()

  let called = 0

  onRead(s, (obj, key) => {
    if (!called++) {
      assert.is(obj, m)
      assert.is(key, Symbol.for('entries'))
    } else {
      assert.is(obj, m)
      assert.is(key, SizeSym)
      resolve()
    }
  })

  s.entries()
  assert.unreachable()
}))

test('forEach', () => new Promise(resolve => {
  let [m, s] = colorStore()

	let called = 0

  s.forEach((val, key, proxy) => {
		if (!called++) {
			assert.equal(key, 'green')
			assert.equal(val, 'green')
			assert.is(proxy, s)
		} else {
			assert.equal(key, 'purple')
			assert.equal(val, 'purple')
			assert.is(proxy, s)
			resolve()
		}
  })

  assert.unreachable()
}))

test('forEach onRead', () => new Promise(resolve => {
  let [m, s] = colorStore()

  let called = 0

  onRead(s, (obj, key) => {
    if (!called++) {
      assert.is(obj, m)
      assert.is(key, Symbol.for('forEach'))
    } else {
      assert.is(obj, m)
      resolve()
    }
  })

  s.forEach(() => {})
  assert.unreachable()
}))

test('for..of', () => {
  let [m, s] = colorStore()

	let called = 0

  for (let val of s) {
		if (!called++) {
			assert.is(val, 'green')
		} else {
			assert.is(val, 'purple')
		}
  }
})

test('delete', () => {
  let [m, s] = colorStore()

  let res = s.delete('purple')

  assert.ok(res)
  assert.not(m.has('purple'))
  assert.is(m.size, 1)
})

test('delete non-exist', () => {
  let [m, s] = colorStore()

  let res = s.delete('blue')

  assert.not.ok(res)
  assert.ok(m.has('green'))
  assert.ok(m.has('purple'))
	assert.is(m.size, 2)
})

test('delete onRead', () => new Promise(resolve => {
  let [m, s] = colorStore()

  onRead(s, (obj, key) => {
    assert.is(obj, m)
    assert.is(key, Symbol.for('delete'))
    resolve()
  })

  s.delete('green')

  assert.unreachable()
}))

test('delete onWrite', () => {
  let [_, s] = colorStore()

  let c, cSize

  onWrite(s, (obj, key) => {
    switch (key) {
      case 'green': return c = true
      case SizeSym: return cSize = true
    }
  })

  s.delete('green')

  assert.ok(c, 'c')
  assert.ok(cSize, 'size')
})

test('delete onWrite non-exist', () => {
  let [_, s] = colorStore()

  onWrite(s, () => {
    assert.unreachable()
  })

  s.delete('blue')
})

test('clear', () => {
  let [m, s] = colorStore()

  s.clear()

  assert.is(m.size, 0)
})

test('clear onRead', () => new Promise(resolve => {
  let [m, s] = colorStore()

  onRead(s, (obj, key) => {
    assert.is(obj, m)
    assert.is(key, Symbol.for('clear'))
    resolve()
  })

  s.clear()

  assert.unreachable()
}))

test('clear onWrite', () => {
  let [m, s] = colorStore()

  let c1, c2, cSize

  onWrite(s, (obj, key) => {
    switch (key) {
      case 'green': return c1 = true
      case 'purple': return c2 = true
      case SizeSym: return cSize = true
    }
  })

  s.clear()

  assert.ok(c1, 'c1')
  assert.ok(c2, 'c2')
  assert.ok(cSize, 'size')
})

test('clear onWrite empty', () => {
  let [m, s] = colorStore()
  m.delete('green')
  m.delete('purple')

  onWrite(s, () => {
    assert.unreachable()
  })

  s.clear()
})

test('add', () => {
  let [m, s] = colorStore()

  let resS = s.add('blue')

  assert.is(resS, s)
  assert.is(m.size, 3)
  assert.equal(Array.from(m), ['green', 'purple', 'blue'])
})

test('add onRead', () => new Promise(resolve => {
  let [m, s] = colorStore()

  onRead(s, (obj, key) => {
    assert.is(obj, m)
    assert.is(key, Symbol.for('add'))
    resolve()
  })

  s.add('blue')

  assert.unreachable()
}))

test('add onWrite new', () => {
  let [_, s] = colorStore()

  let c, cSize

  onWrite(s, (obj, key) => {
    switch (key) {
      case 'blue': return c = true
      case SizeSym: return cSize = true
    }
  })

  s.add('blue')

  assert.ok(c, 'c')
  assert.ok(cSize, 'size')
})

test('add onWrite same', () => {
  let [m, s] = colorStore()

  onWrite(s, () => {
    assert.unreachable()
  })

  s.add('green')
})

test('set obj prop', () => {
  let [m, s] = colorStore()

  s.test = 1

  assert.is(m.test, 1)
  assert.is(s.test, 1)
})

test('set obj prop onWrite', () => new Promise(resolve => {
  let [m, s] = colorStore()

  onWrite(s, (obj, key) => {
    assert.is(obj, m)
    assert.is(key, Symbol.for('test'))
    resolve()
  })

  s.test = 1
  assert.unreachable()
}))

test('define obj prop', () => {
  let [m, s] = colorStore()

  Object.defineProperty(s, 'test', {value: 1})
  assert.is(m.test, 1)
  assert.is(s.test, 1)
})

test('define obj prop onWrite', () => new Promise(resolve => {
  let [m, s] = colorStore()

  onWrite(s, (obj, key) => {
    assert.is(obj, m)
    assert.is(key, Symbol.for('test'))
    resolve()
  })

  Object.defineProperty(s, 'test', {value: 1})
  assert.unreachable()
}))


test('delete obj prop', () => {
  let [m, s] = colorStore()

  m.test = 1
  assert.is(m.test, 1)

  delete s.test

  assert.not('test' in m)
  assert.not('test' in s)
})

test('delete obj prop onWrite', () => new Promise(resolve => {
  let [m, s] = colorStore()
  m.test = 1

  onWrite(s, (obj, key) => {
    assert.is(obj, m)
    assert.is(key, Symbol.for('test'))
    resolve()
  })

  delete s.test
  assert.unreachable()
}))

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
    Object.defineProperty(s, 'test2', {value: 1})
  }, /"store locked!" is not a function/)

  assert.throws(() => {
    delete s.test
  }, /"store locked!" is not a function/)
})

test.run()
