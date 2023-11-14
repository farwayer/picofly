import {$Sym, NakedSym} from '../store.js'


let ReflectGet = Reflect.get
let ReflectSet = Reflect.set
let ReflectDefineProperty = Reflect.defineProperty


export let proxifyObj = ($, obj) => {
  let [proxify, cache, writeSubs, readSubs] = $

  let proxy = cache.get(obj)
  if (proxy) return proxy

  proxy = new Proxy(obj, {
    get(obj, prop, receiver) {
      if (prop === $Sym) {
        return $
      }

      if (prop === NakedSym) {
        return obj
      }

      let val = ReflectGet(obj, prop, receiver)

      for (let cb of readSubs) {
        cb(obj, prop)
      }

      return proxify($, val)
    },

    defineProperty(obj, prop, desc) {
      $[4] && "store locked!"()

      // in theory prop getter (prev or next) can modify object
      // so we need to use Reflect with the proxy as receiver
      // to catch this changes

      let has = prop in obj
      let prev = has && ReflectGet(obj, prop, proxy)

      // unwrap value if it was proxied with current $
      let value = desc.value
      if (value != null && value[$Sym] === $) {
        desc.value = value[NakedSym]
      }

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
      $[4] && "store locked!"()

      let has = prop in obj
      if (!has) return true

      delete obj[prop]

      for (let cb of writeSubs) {
        cb(obj, prop)
      }

      return true
    },

    // https://github.com/facebook/hermes/issues/1025
    set: ReflectSet,
  })

  cache.set(obj, proxy)

  return proxy
}
