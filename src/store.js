// noinspection JSAnnotator,JSValidateTypes

let WriteSubsSym = Symbol()
let ProtectorSym = Symbol()
let RefsSym = Symbol()


export let store = (obj) => {
  let subs = new Set()
  let refs = new Set()
  let cache = new WeakMap()

  return proxifyWrite(cache, subs, refs, obj)
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

export let ref = (store, obj) => {
  let refs = getRefs(store)

  if (isObj(obj)) {
    refs.add(obj)
  }

  return obj
}


let proxifyWrite = (cache, subs, refs, obj) => cached(cache, obj, () => {
  let wProxy = new Proxy(obj, {
    get(obj, prop, receiver) {
      if (prop === WriteSubsSym) {
        return subs
      }
      if (prop === RefsSym) {
        return refs
      }

      let val = ReflectGet(obj, prop, receiver)
      let needProxify = isObj(val) && !refs.has(val)

      return needProxify
        ? proxifyWrite(cache, subs, refs, val)
        : val
    },

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
      if (prop === WriteSubsSym || prop === RefsSym) {
        return val
      }

      if (onRead && protector[0]) {
        onRead(wProxy, prop)
      }

      let needProxify = isObj(val) && !getRefs(wProxy).has(val)

      return needProxify
        ? proxifyRead(cache, onRead, protector, val)
        : val
    },

    defineProperty(wProxy, prop, desc) {
      assertNotProtected(protector)

      return ReflectDefineProperty(wProxy, prop, desc)
    },

    deleteProperty(wProxy, prop) {
      assertNotProtected(protector)

      delete wProxy[prop]
      return true
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
let getRefs = store => store[RefsSym] || "not store!"()
let isObj = val => val instanceof Object
let ReflectGet = Reflect.get
let ReflectDefineProperty = Reflect.defineProperty
let assertNotProtected = protector => protector[0] && "store protected!"()
let protectSetter = enabled => readStore => {
  (readStore[ProtectorSym] || "not readable store!"())[0] = enabled
  return readStore
}

export let protect = /* @__PURE__ */ protectSetter(1)
export let unprotect = /* @__PURE__ */ protectSetter(0)
