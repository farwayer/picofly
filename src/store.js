// noinspection JSAnnotator,JSValidateTypes

let $Sym = Symbol()


export let store = (obj, proxify = basicProxify) => {
  let $ = [         // internal store data
    proxify,        // 0 = proxify fn
    new WeakMap(),  // 1 = proxy cache
    new Set(),      // 2 = write subs
                    // 3 = onRead (store is locked if set)
  ]

  return proxify($, obj)
}

export let onWrite = (store, cb) => {
  let subs = get$(store)[2].add(cb)

  return () => {
    subs.delete(cb)
  }
}

export let lock = (store, onRead) => {
  get$(store)[3] = onRead
}

export let unlock = (store) => {
  get$(store)[3] = 0
}


// for external libs
export let get$ = store => store[$Sym] || "invalid store!"()

export let basicProxify = ($, val) => {
  return typeof val === 'object' && val !== null
    ? proxifyObj($, val)
    : val
}

export let proxifyObj = ($, obj) => {
  let [proxify, cache, writeSubs] = $

  let proxy = cache.get(obj)
  if (proxy) return proxy

  proxy = new Proxy(obj, {
    get(obj, prop, receiver) {
      if (prop === $Sym) {
        return $
      }

      let val = ReflectGet(obj, prop, receiver)

      let onRead = $[3]
      onRead && onRead(obj, prop)

      return proxify($, val)
    },

    defineProperty(obj, prop, desc) {
      $[3] && "store locked!"()

      // in theory prop getter (prev or next) can modify object
      // so we need to use Reflect with the proxy as receiver
      // to catch this changes

      let has = prop in obj
      let prev = has && ReflectGet(obj, prop, proxy)

      ReflectDefineProperty(obj, prop, desc)

      let next = has && ReflectGet(obj, prop, proxy)

      if (!has || next !== prev) {
        for (let cb of writeSubs) {
          cb(obj, prop)
        }
      }

      return true
    },

    deleteProperty(obj, prop) {
      $[3] && "store locked!"()

      let has = prop in obj
      if (!has) return true

      delete obj[prop]

      for (let cb of writeSubs) {
        cb(obj, prop)
      }

      return true
    },
  })

  cache.set(obj, proxy)

  return proxy
}

let ReflectGet = Reflect.get
let ReflectDefineProperty = Reflect.defineProperty
