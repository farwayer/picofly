import {test} from 'uvu'
import * as assert from 'uvu/assert'
import {create, obj, onWrite} from 'picofly'


let arrStore = () => {
  let a = [1, 2, 3]
  let s = create(a, obj)
  return [a, s]
}

test('create', () => {
  let [a, s] = arrStore()

  let sArr = JSON.parse(JSON.stringify(s))
  assert.equal(sArr, a)
})

test('set', () => {
  let [a, s] = arrStore()

  s[0] = 5
  assert.is(a[0], 5)
  assert.is(s[0], 5)
})

test('push', () => {
  let [a, s] = arrStore()

  s.push(5)
  assert.is(a[3], 5)
  assert.is(s[3], 5)
})

test('onWrite push', () => new Promise(resolve => {
  let [a, s] = arrStore()

  let called = 0

  onWrite(s, (arr, key) => {
    if (!called++) {
      assert.is(arr, a)
      assert.is(key, '3')
    } else {
      assert.is(arr, a)
      assert.is(key, 'length')
      resolve()
    }
  })

  s.push(5)
  assert.unreachable()
}))

test('onWrite set new length', () => new Promise(resolve => {
  let [a, s] = arrStore()

  let called = 0

  onWrite(s, (arr, key) => {
    if (!called++) {
      assert.is(arr, a)
      assert.is(key, '3')
    } else {
      assert.is(arr, a)
      assert.is(key, 'length')
      resolve()
    }
  })

  s[3] = 5
  assert.unreachable()
}))

test('onWrite set no length change', () => new Promise(resolve => {
  let [a, s] = arrStore()

  let set = false

  onWrite(s, (arr, key) => {
    assert.is(arr, a)
    assert.is(key, '0')
    set = true
  })

  s[0] = 5

  assert.ok(set)
  resolve()
}))

test('onWrite pop', () => new Promise(resolve => {
  let [a, s] = arrStore()

  let called = 0

  onWrite(s, (arr, key) => {
    if (!called++) {
      assert.is(arr, a)
      assert.is(key, '2')
    } else {
      assert.is(arr, a)
      assert.is(key, 'length')
      resolve()
    }
  })

  s.pop()
  assert.unreachable()
}))

test('onWrite set str no length change', () => new Promise(resolve => {
  let [a, s] = arrStore()

  let set = false

  onWrite(s, (arr, key) => {
    assert.is(arr, a)
    assert.is(key, 'xxx')
    set = true
  })

  s['xxx'] = 5

  assert.is(s.length, 3)
  assert.ok(set)
  resolve()
}))

test('onWrite set not int no length change', () => new Promise(resolve => {
  let [a, s] = arrStore()

  let set = false

  onWrite(s, (arr, key) => {
    assert.is(arr, a)
    assert.is(key, '0.5')
    set = true
  })

  s[0.5] = 5

  assert.is(s.length, 3)
  assert.ok(set)
  resolve()
}))

test('onWrite set zero prefix int no length change', () => new Promise(resolve => {
  let [a, s] = arrStore()

  let set = false

  onWrite(s, (arr, key) => {
    assert.is(arr, a)
    assert.is(key, '05')
    set = true
  })

  s['05'] = 5

  assert.is(s.length, 3)
  assert.ok(set)
  resolve()
}))

test('onWrite set neg int no length change', () => new Promise(resolve => {
  let [a, s] = arrStore()

  let set = false

  onWrite(s, (arr, key) => {
    assert.is(arr, a)
    assert.is(key, '-5')
    set = true
  })

  s[-5] = 5

  assert.is(s.length, 3)
  assert.ok(set)
  resolve()
}))

test('onWrite set str digit start no length change', () => new Promise(resolve => {
  let [a, s] = arrStore()

  let set = false

  onWrite(s, (arr, key) => {
    assert.is(arr, a)
    assert.is(key, '4xx')
    set = true
  })

  s['4xx'] = 5

  assert.is(s.length, 3)
  assert.ok(set)
  resolve()
}))

test('onWrite set large int no length change', () => new Promise(resolve => {
  let [a, s] = arrStore()

  let set = false

  onWrite(s, (arr, key) => {
    assert.is(arr, a)
    assert.is(key, '4294967295')
    set = true
  })

  s[4294967295] = 5

  assert.is(s.length, 3)
  assert.ok(set)
  resolve()
}))

test.run()
