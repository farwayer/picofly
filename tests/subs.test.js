import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {store, obj, onWrite, onRead} from 'picofly'


suite('subs', () => {
  let numStore = () => store({n: 0}, [obj])

  test('bad callback throws', () => {
    let s = numStore()

    assert.throws(() => {
      onWrite(s, 1)
    }, /"bad cb!" is not a function/)

    assert.throws(() => {
      onRead(s, null)
    }, /"bad cb!" is not a function/)
  })

  test('onWrite unsubscribe stops the notifications', () => {
    let s = numStore()
    let hits = 0

    let unsub = onWrite(s, () => hits++)
    s.n = 1
    unsub()
    s.n = 2

    assert.equal(hits, 1)
  })

  test('onWrite unsubscribe twice is fine', () => {
    let s = numStore()
    let hits = 0

    let unsub = onWrite(s, () => hits++)
    unsub()
    unsub()
    s.n = 1

    assert.equal(hits, 0)
  })

  test('onWrite from a nested proxy subscribes to the store', () => {
    let s = store({nested: {n: 0}}, [obj])
    let hits = []

    onWrite(s.nested, (_, key) => hits.push(key))
    s.nested.n = 1

    assert.deepEqual(hits, ['n'])
  })

  // the Set behind the list dedupes, an array would notify twice
  // see TODO.md, «Подписчики массивом вместо Set»
  test('onWrite the same callback twice notifies once', () => {
    let s = numStore()
    let hits = 0
    let cb = () => hits++

    onWrite(s, cb)
    onWrite(s, cb)
    s.n = 1

    assert.equal(hits, 1)
  })

  // a running notify must survive a list change from inside a callback:
  // useStore unsubscribes the whole component right there
  test('onWrite unsubscribed during a notify does not run', () => {
    let s = numStore()
    let hits = []

    onWrite(s, () => {
      hits.push('first')
      unsubSecond()
    })
    let unsubSecond = onWrite(s, () => hits.push('second'))

    s.n = 1

    assert.deepEqual(hits, ['first'])
  })

  test('onRead unsubscribe stops the notifications', () => {
    let s = numStore()
    let hits = 0

    let unsub = onRead(s, () => hits++)
    s.n
    unsub()
    s.n

    assert.equal(hits, 1)
  })

  test('onRead the same callback twice notifies once', () => {
    let s = numStore()
    let hits = 0
    let cb = () => hits++

    onRead(s, cb)
    onRead(s, cb)
    s.n

    assert.equal(hits, 1)
  })
})
