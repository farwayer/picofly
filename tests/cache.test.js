import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {create, markRaw, get$} from 'picofly'


suite('cache', () => {
  test('repeat reads return the same proxy', () => {
    let s = create({obj: {n: 1}, arr: [{n: 1}], map: new Map([[1, {n: 1}]])})

    assert.equal(s.obj, s.obj)
    assert.equal(s.arr, s.arr)
    assert.equal(s.arr[0], s.arr[0])
    assert.equal(s.map.get(1), s.map.get(1))
    assert.equal(s.obj, s['obj'])
  })

  test('proxies are lazy, created on the first read', () => {
    let o = {nested: {n: 1}}
    let s = create(o)
    let proxies = get$(s)[3]

    assert.equal(proxies.has(o.nested), false)

    s.nested

    assert.equal(proxies.has(o.nested), true)
  })

  test('cache wins over markRaw() on an already read object', () => {
    let o = {service: {n: 1}}
    let s = create(o)
    let proxied = s.service

    markRaw(s, o.service)

    assert.equal(s.service, proxied)
  })
})
