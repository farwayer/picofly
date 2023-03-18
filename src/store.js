// noinspection JSAnnotator,JSValidateTypes

let WriteSubsSym = Symbol()
let ProtectorSym = Symbol()

export let store = (obj) => {
  let subs = new Set()
  let cache = new WeakMap()

  return proxifyWrite(cache, subs, obj)
}

export let readableStore = (obj, onRead) => {
  return readable(store(obj), onRead)
}

export let readable = (store, onRead) => {
  getSubs(store) // check if store is valid

  let cache = new WeakMap()
  let protector = [1]

  return proxifyRead(cache, onRead, protector, store)
}

export let onWrite = (store, cb) => {
  let subs = getSubs(store).add(cb)

  return () => {
    subs.delete(cb)
  }
}

let proxifyWrite = (cache, subs, obj) => cached(cache, obj, () => {
  let wProxy = new Proxy(obj, {
    defineProperty(obj, prop, desc) {
      // in theory prop getter (prev or next) can modify object
      // so we need to use Reflect with wProxy as receiver
      // to catch this changes

      let has = prop in obj
      let prev = has && ReflectGet(obj, prop, wProxy)

      ReflectDefineProperty(obj, prop, desc)

      let next = has && ReflectGet(obj, prop, wProxy)

      if (!has || next !== prev) {
        notify(subs, wProxy, prop)
      }

      return true
    },

    deleteProperty(obj, prop) {
      let has = prop in obj
      if (!has) return true

      delete obj[prop]
      notify(subs, wProxy, prop)

      return true
    },

    get(obj, prop, receiver) {
      if (prop === WriteSubsSym) {
        return subs
      }

      let val = ReflectGet(obj, prop, receiver)
      return isObj(val)
        ? proxifyWrite(cache, subs, val)
        : val
    },
  })

  return wProxy
})

let proxifyRead = (cache, onRead, protector, obj) => cached(cache, obj, () => {
  return new Proxy(obj, {
    get(wProxy, prop, receiver) {
      if (prop === ProtectorSym) {
        return protector
      }

      let val = ReflectGet(wProxy, prop, receiver)
      if (prop === WriteSubsSym) {
        return val
      }

      if (onRead && protector[0]) {
        onRead(wProxy, prop)
      }

      return isObj(val)
        ? proxifyRead(cache, onRead, protector, val)
        : val
    },

    set(wProxy, prop, val, receiver) {
      protector[0] && "store protected!"()

      return ReflectSet(wProxy, prop, val, receiver)
    },
  })
})

let cached = (cache, key, init) => {
  let val = cache.get(key)
  if (val) return val

  val = init()
  cache.set(key, val)
  return val
}

let notify = (subs, obj, prop) => {
  for (let cb of subs) {
    cb(obj, prop)
  }
}

let getSubs = store => store[WriteSubsSym] || "not store!"()
let isObj = val => typeof val === 'object'
let ReflectGet = Reflect.get
let ReflectSet = Reflect.set
let ReflectDefineProperty = Reflect.defineProperty
let protectSetter = enabled => readStore => {
  (readStore[ProtectorSym] || "not readable store!"())[0] = enabled
  return readStore
}

export let protect = /* @__PURE__ */ protectSetter(1)
export let unprotect = /* @__PURE__ */ protectSetter(0)
