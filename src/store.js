export let store = (initValue, proxify) => {
  proxify || 'pass proxifier!'()

  let $ = [         // internal store state
    proxify,        // 0 = proxify fn
    new WeakMap(),  // 1 = proxy cache
    new Set(),      // 2 = write subs
    new Set(),      // 3 = read subs
                    // 4 = locked
                    // 5-20 = reserved
                    // 21-... can be used by libs
                    // but it's better to use symbols (or str keys)
                    // to prevent overlaps (see react)
  ]

  return proxify($, initValue)
}

let subscriber = subsIndex => (store, cb) => {
  typeof cb === 'function' || 'invalid cb!'()

  let subs = get$(store)[subsIndex].add(cb)

  return () => {
    subs.delete(cb)
  }
}

let locker = locked => store => {
  get$(store)[4] = locked
}

export let onWrite = /* @__PURE__ */ subscriber(2)
export let onRead = /* @__PURE__ */ subscriber(3)
export let lock = /* @__PURE__ */ locker(1)
export let unlock = /* @__PURE__ */ locker(0)
export let isLocked = store => !!get$(store)[4]


// private
export let $Sym = /* @__PURE__ */ Symbol()
export let NakedSym = /* @__PURE__ */ Symbol()
export let get$ = val => val && val[$Sym] || 'invalid store!'()
