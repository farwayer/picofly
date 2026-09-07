import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {create, store, builtins, obj, map, set} from 'picofly'


suite('builtins', () => {
  let Builtins = {
    date: new Date(),
    error: new Error('x'),
    regexp: /x/,
    numberBox: new Number(1),
    stringBox: new String('x'),
    booleanBox: new Boolean(true),
    promise: Promise.resolve(),
    weakMap: new WeakMap(),
    weakSet: new WeakSet(),
    buffer: new ArrayBuffer(8),
    bytes: new Uint8Array(8),
    view: new DataView(new ArrayBuffer(8)),
    blob: new Blob([]),
    url: new URL('https://x.io'),
    generator: (function* () { yield 1 })(),
    tagged: {[Symbol.toStringTag]: 'Tagged'},
  }

  for (let [name, val] of Object.entries(Builtins)) {
    test(`${name} stays raw`, () => {
      let s = create({val})
      assert.equal(s.val, val)
    })
  }

  test('proxies plain data and class instances', () => {
    class Model {n = 1}
    let o = {obj: {}, arr: [], map: new Map(), set: new Set(), model: new Model()}
    let s = create(o)

    for (let key of Object.keys(o)) {
      assert.notEqual(s[key], o[key], key)
    }
  })

  test('generator works through the store', () => {
    let s = create({gen: (function* () { yield 1 })()})
    assert.equal(s.gen.next().value, 1)
  })

  test('obj alone proxies builtins', () => {
    let date = new Date()
    let s = store({date}, [obj])
    assert.notEqual(s.date, date)
  })

  test('obj with builtins keeps Map and Set raw', () => {
    let o = {map: new Map(), set: new Set(), plain: {}}
    let s = store(o, [builtins, obj])

    assert.equal(s.map, o.map)
    assert.equal(s.set, o.set)
    assert.notEqual(s.plain, o.plain)
  })

  test('map rule proxies a Map, obj still proxies builtins', () => {
    let o = {map: new Map([[1, 1]]), date: new Date()}
    let s = store(o, [obj, map])

    assert.equal(s.map.get(1), 1)
    assert.notEqual(s.map, o.map)
    assert.notEqual(s.date, o.date)
  })

  test('set rule alone proxies a Set, values stay raw', () => {
    let val = {n: 1}
    let src = new Set([val])
    let s = store(src, [set])

    assert.notEqual(s, src)
    assert.equal(s.has(val), true)
    assert.equal([...s][0], val)
  })

  test('set rule proxies a Set, obj still proxies builtins', () => {
    let o = {set: new Set([1]), date: new Date()}
    let s = store(o, [obj, set])

    assert.notEqual(s.set, o.set)
    assert.equal(s.set.has(1), true)
    assert.notEqual(s.date, o.date)
  })

  test('without the set rule a Set stays raw', () => {
    let o = {map: new Map([[1, 1]]), set: new Set([1])}
    let s = store(o, [builtins, obj, map])

    assert.notEqual(s.map, o.map)
    assert.equal(s.map.get(1), 1)
    assert.equal(s.set, o.set)
  })

  test('default proxies Map and Set', () => {
    let o = {map: new Map([[1, {n: 1}]]), set: new Set([1])}
    let s = create(o)

    assert.notEqual(s.map, o.map)
    assert.notEqual(s.set, o.set)
    assert.equal(s.map.get(1).n, 1)
    assert.equal(s.set.has(1), true)
  })
})
