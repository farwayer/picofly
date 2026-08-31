import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {create, obj, onWrite} from 'picofly'


suite('arr', () => {
  let arrStore = () => {
    let a = [1, 2, 3]
    let s = create(a, obj)
    return [a, s]
  }

  test('create', () => {
    let [a, s] = arrStore()

    let sArr = JSON.parse(JSON.stringify(s))
    assert.deepEqual(sArr, a)
  })

  test('set', () => {
    let [a, s] = arrStore()

    s[0] = 5
    assert.equal(a[0], 5)
    assert.equal(s[0], 5)
  })

  test('push', () => {
    let [a, s] = arrStore()

    s.push(5)
    assert.equal(a[3], 5)
    assert.equal(s[3], 5)
  })

  test('onWrite push', () => new Promise(resolve => {
    let [a, s] = arrStore()

    let called = 0

    onWrite(s, (arr, key) => {
      if (!called++) {
        assert.equal(arr, a)
        assert.equal(key, '3')
      } else {
        assert.equal(arr, a)
        assert.equal(key, 'length')
        resolve()
      }
    })

    s.push(5)
    assert.fail('unreachable')
  }))

  test('onWrite push to empty', () => new Promise(resolve => {
    let a = []
    let s = create(a, obj)

    let called = 0

    onWrite(s, (arr, key) => {
      if (!called++) {
        assert.equal(arr, a)
        assert.equal(key, '0')
      } else {
        assert.equal(arr, a)
        assert.equal(key, 'length')
        resolve()
      }
    })

    s.push(5)
    assert.fail('unreachable')
  }))

  test('onWrite set new length', () => new Promise(resolve => {
    let [a, s] = arrStore()

    let called = 0

    onWrite(s, (arr, key) => {
      if (!called++) {
        assert.equal(arr, a)
        assert.equal(key, '3')
      } else {
        assert.equal(arr, a)
        assert.equal(key, 'length')
        resolve()
      }
    })

    s[3] = 5
    assert.fail('unreachable')
  }))

  test('onWrite set no length change', () => new Promise(resolve => {
    let [a, s] = arrStore()

    let set = false

    onWrite(s, (arr, key) => {
      assert.equal(arr, a)
      assert.equal(key, '0')
      set = true
    })

    s[0] = 5

    assert.ok(set)
    resolve()
  }))

  test('onWrite set existing int no length change', () => new Promise(resolve => {
    let [a, s] = arrStore()

    let set = false

    onWrite(s, (arr, key) => {
      assert.equal(arr, a)
      assert.equal(key, '1')
      set = true
    })

    s[1] = 5

    assert.equal(s.length, 3)
    assert.ok(set)
    resolve()
  }))

  test('onWrite pop', () => new Promise(resolve => {
    let [a, s] = arrStore()

    let called = 0

    onWrite(s, (arr, key) => {
      if (!called++) {
        assert.equal(arr, a)
        assert.equal(key, '2')
      } else {
        assert.equal(arr, a)
        assert.equal(key, 'length')
        resolve()
      }
    })

    s.pop()
    assert.fail('unreachable')
  }))

  test('onWrite set str no length change', () => new Promise(resolve => {
    let [a, s] = arrStore()

    let set = false

    onWrite(s, (arr, key) => {
      assert.equal(arr, a)
      assert.equal(key, 'xxx')
      set = true
    })

    s['xxx'] = 5

    assert.equal(s.length, 3)
    assert.ok(set)
    resolve()
  }))

  test('onWrite set not int no length change', () => new Promise(resolve => {
    let [a, s] = arrStore()

    let set = false

    onWrite(s, (arr, key) => {
      assert.equal(arr, a)
      assert.equal(key, '0.5')
      set = true
    })

    s[0.5] = 5

    assert.equal(s.length, 3)
    assert.ok(set)
    resolve()
  }))

  test('onWrite set zero prefix int no length change', () => new Promise(resolve => {
    let [a, s] = arrStore()

    let set = false

    onWrite(s, (arr, key) => {
      assert.equal(arr, a)
      assert.equal(key, '05')
      set = true
    })

    s['05'] = 5

    assert.equal(s.length, 3)
    assert.ok(set)
    resolve()
  }))

  test('onWrite set neg int no length change', () => new Promise(resolve => {
    let [a, s] = arrStore()

    let set = false

    onWrite(s, (arr, key) => {
      assert.equal(arr, a)
      assert.equal(key, '-5')
      set = true
    })

    s[-5] = 5

    assert.equal(s.length, 3)
    assert.ok(set)
    resolve()
  }))

  test('onWrite set str digit start no length change', () => new Promise(resolve => {
    let [a, s] = arrStore()

    let set = false

    onWrite(s, (arr, key) => {
      assert.equal(arr, a)
      assert.equal(key, '4xx')
      set = true
    })

    s['4xx'] = 5

    assert.equal(s.length, 3)
    assert.ok(set)
    resolve()
  }))

  test('onWrite set exp int no length change', () => new Promise(resolve => {
    let [a, s] = arrStore()

    let set = false

    onWrite(s, (arr, key) => {
      assert.equal(arr, a)
      assert.equal(key, '1e3')
      set = true
    })

    s['1e3'] = 5

    assert.equal(s.length, 3)
    assert.ok(set)
    resolve()
  }))

  test('onWrite set sparse zero idx no length change', () => new Promise(resolve => {
    let a = [, 2, 3]
    let s = create(a, obj)

    let set = false

    onWrite(s, (arr, key) => {
      assert.equal(arr, a)
      assert.equal(key, '0')
      set = true
    })

    s[0] = 1

    assert.equal(s.length, 3)
    assert.ok(set)
    resolve()
  }))

  test('onWrite set large int no length change', () => new Promise(resolve => {
    let [a, s] = arrStore()

    let set = false

    onWrite(s, (arr, key) => {
      assert.equal(arr, a)
      assert.equal(key, '4294967295')
      set = true
    })

    s[4294967295] = 5

    assert.equal(s.length, 3)
    assert.ok(set)
    resolve()
  }))
})
