// private
export const IProxify = 0
export const IWriteSubs = 1
export const IReadSubs = 2
export const ICache = 3
export const ILocked = 4

export let store = (state, rules) => {
	rules || 'pass rules!'()

	rules = rules
		// the rule must return a priority if called without the next
		.sort((rule1, rule2) => rule1() - rule2())
		.reduceRight((next, rule) => rule(next), naked)

	// it would be elegant to create a `primitive` and a `cache` rule
	// but inlining inside `reduceRight` may break with custom rules
	// primitive checks and the cache must work quickly regardless
	// do not add anything!
	// 91 bc <= max-maglev-inlined-bytecode-size=100, JSC FTL=100
	let proxify = ($, val, res) =>
		typeof val === 'object' && val
			? $[ICache].get(val) || ( // cached
				val[$Sym] === $ // proxied (only in one case: getter returned our proxy)
					? val
					: (
						// cache only if not the same obj returned from the rules
						(res = rules($, val)) === val ||
						$[ICache].set(val, res),
					res)
			)
			: val

	let $ = [	       // internal store state
		proxify,       // 0 = proxify fn
		new Set(),     // 1 = write subs
		new Set(),     // 2 = read subs
		new WeakMap(), // 3 = proxy cache
		0,             // 4 = locked
		               // 5-20 = reserved
		               // 21-... can be used by libs/rules
		               // but it's better to use symbols (or str keys)
		               // to prevent overlaps (see raw rule, react)
	]

	return proxify($, state)
}

let subscriber = subsIndex => (store, cb) => {
	typeof cb === 'function' || 'bad cb!'()

	let subs = get$(store)[subsIndex].add(cb)

	return () => {
		subs.delete(cb)
	}
}

let locker = locked => store =>
	get$(store)[ILocked] = locked

export let onWrite = /* @__PURE__ */ subscriber(IWriteSubs)
export let onRead = /* @__PURE__ */ subscriber(IReadSubs)
export let lock = /* @__PURE__ */ locker(1)
export let unlock = /* @__PURE__ */ locker(0)
export let isLocked = store => !!get$(store)[ILocked]


// private
export let $Sym = /* @__PURE__ */ Symbol()
export let NakedSym = /* @__PURE__ */ Symbol()
export let get$ = val => val && val[$Sym] || 'bad store!'()
export let naked = ($, val) =>
	typeof val === 'object' && val && val[$Sym] === $
		? val[NakedSym]
		: val
