import type {ApiTab, EngineId, Page, TabId} from '~/store/state.ts'

export let Cfg = {
  name: 'Picofly',
  tagline: 'Tiny state manager, built with ❤️',
  install: ['npm i picofly', 'yarn add picofly', 'pnpm add picofly'],
  size: {
    min: '705 B',
    react: '1.21 kB',
  },
  links: {
    github: 'https://github.com/farwayer/picofly',
    npm: 'https://www.npmjs.com/package/picofly',
  },
}

export let Pages: {id: Page, name: string}[] = [
  {
    id: 'why',
    name: 'Another one?',
  },
  {
    id: 'api',
    name: 'API',
  },
  {
    id: 'performance',
    name: 'Performance',
  },
  {
    id: 'hook-vs-selectors',
    name: 'Hook vs Selectors',
  },
  {
    id: 'tips',
    name: 'Tips',
  },
  {
    id: 'architecture',
    name: 'Good, Bad, Ugly Architecture',
  },
]

export let Features = [
  ['⚡', 'Fast', 'every hot path is measured'],
  ['🤏', 'Tiny', `${Cfg.size.min} core, ${Cfg.size.react} with React support`],
  ['🥧', 'Simple', '~160 lines of airy code'],
  ['🍳', 'Handy', 'think about what to do, not how'],
  ['⚛️', 'React & React Native', 'hook and selectors, modern React API'],
  ['🔋', 'Charged', 'Map/Set, TypeScript support and more'],
]

export let Tabs: {id: TabId, name: string, code: string}[] = [
  {
    id: 'store',
    name: 'calc.ts',
    code: `export type Key = 'a' | 'b'

// describe the app state, a class or a plain object
// getters, setters and methods keep working
export class Calc {
	a = 0
	b = 0
	resetting = false

	inc(key: Key) {
		this[key]++
	}
}

// write plain functions that read and change data
// they can be async, generators, whatever
export let reset = async (calc: Calc) => {
	calc.resetting = true

	await delay(500)

	calc.a = 0
	calc.b = 0
	calc.resetting = false
}`,
  },
  {
    id: 'app',
    name: 'app.tsx',
    code: `import {create} from 'picofly'
import {Picofly} from 'picofly/react'
import {Calc} from './calc.ts'
import {CellSum} from './sum.tsx'
import {Reset} from './reset.tsx'
import {CellA, CellB} from './cells.tsx'
import {Inc} from './inc.tsx'

// create and put the store in context
// not happy with context? see [tips](/tips#without-context)
let calc = create(new Calc())

export function Calculator() {
	return (
		<Picofly value={calc}>
			<CellA/>
			<CellB/>
			<CellSum/>

			<Inc cell="a"/>
			<Inc cell="b"/>
			<Reset/>
		</Picofly>
	)
}`,
  },
  {
    id: 'hooks',
    name: 'sum.tsx',
    code: `import {useRef} from 'react'
import {useStore} from 'picofly/react'
import type {Calc} from './calc.ts'

// useStore() to read the data and follow its changes
export function CellSum() {
	let calc = useStore<Calc>()

	let renders = useRef(0)
	renders.current++

	return (
		<div>
			<span>{calc.a + calc.b}</span>
			<span>renders: {renders.current}</span>
		</div>
	)
}`,
  },
  {
    id: 'reset',
    name: 'reset.tsx',
    code: `import {useStore} from 'picofly/react'
import {reset, type Calc} from './calc.ts'

// use the same hook to change the data
export function Reset() {
	let calc = useStore<Calc>()

	return (
		<button onClick={() => reset(calc)} disabled={calc.resetting}>
			{calc.resetting ? <Spinner/> : 'reset'}
		</button>
	)
}`,
  },
  {
    id: 'selectors',
    name: 'cells.tsx (selectors)',
    code: `import {useRef} from 'react'
import {select} from 'picofly/react'
import type {Calc} from './calc.ts'

// you can use [selectors](/hook-vs-selectors) instead of the hook
// selector reads the store and feeds a component
let aValue = (calc: Calc) => ({value: calc.a})
let bValue = (calc: Calc) => ({value: calc.b})

export let CellA = select(aValue)(Cell) // renders only when a changes
export let CellB = select(bValue)(Cell) // renders only when b changes

// pure component
function Cell({value}: {value: number}) {
	let renders = useRef(0)
	renders.current++

	return (
		<div>
			<span>{value}</span>
			<span>renders: {renders.current}</span>
		</div>
	)
}`,
  },
  {
    id: 'inc',
    name: 'inc.tsx (selectors)',
    code: `import {useEffect} from 'react'
import {select} from 'picofly/react'
import type {Calc, Key} from './calc.ts'

// selectors can do more than read the store
// they can attach callbacks and use hooks 
let props = (calc: Calc, props: {cell: Key}) => ({
	title: \`\${props.cell}++\`,
	onClick: () => calc.inc(props.cell),
})

let logRendered = () => {
	useEffect(() => console.log('inc rendered!'))
}

export let Inc = select(props, logRendered)(Button)

// some common component
function Button({onClick, title}: Props) {
	return <button onClick={onClick}>{title}</button>
}`,
  },
]

export let Api: {
  id: ApiTab
  name: string
  items: [string, string, string?][]
}[] = [
  {
    id: 'core',
    name: 'picofly',
    items: [
      ['create(state)',
       `Creates a store from the state with every [rule](#rules) there is.

        \`state\`: \`any\` Any type the rules support, or a class instance.

        **Returns:** \`state\` The store, the state proxied.`, `class State {
  user = {name: 'Ann'}
  videos = new Map()
}

let app = create(new State()) // or a plain object

app.user.name = 'Bob' // subscribers are notified`],
      ['store(state, rules)',
       `Creates a store from the state with the [rules](#rules) you pick.
        Fewer rules ship fewer bytes and do less per read.

        \`state\`: \`any\` Any type the rules support, or a class instance.

        \`rules\`: \`rule[]\` Any of the exported [rules](#rules), or your own.

        **Returns:** \`state\` The store, the state proxied.`, `// objects and arrays only,
// the smallest and fastest store
let app = store({count: 0}, [obj])`],
      ['markRaw(store, value)',
       `Marks the value so it never gets a proxy. For api clients, sockets and
        other service objects.
        Needs the [\`raw\`](#rules) rule (in defaults for \`create\`).

        **Returns:** \`value\` The value as is.`, `app.api = markRaw(app, createApi())

app.api.fetch('/videos')`],
      ['isRaw(store, value)', 'Whether the value was marked with `markRaw()`.', `isRaw(app, app.api) // true`],
      ['onWrite(store, cb)',
       `Subscribes to changes in \`store\`.

        \`cb\`: \`(rawObj, key) => void\` Called after every data change.

        **Returns:** \`() => void\` The unsubscribe function.`, `let unsub = onWrite(app, (obj, key) => {
  console.log('changed:', key)
})

app.user.name = 'Kim' // changed: name
unsub()`],
      ['onRead(store, cb)',
       `Subscribes to reads in \`store\`.

        \`cb\`: \`(rawObj, key) => void\` Called after every data read.

        **Returns:** \`() => void\` The unsubscribe function.`, `onRead(app, (obj, key) => {
  console.log('read:', key)
})

app.user.name // read: name`],
      ['lock(store)',
       `Makes writes throw.`, `lock(app)

app.user.name = 'Eve' // TypeError: store locked!`],
      ['unlock(store)',
       `Allows writes again.`, `unlock(app)

app.user.name = 'Eve' // works again`],
      ['isLocked(store)', 'Whether writes are locked.', `isLocked(app) // false`],
    ],
  },
  {
    id: 'react',
    name: 'picofly/react',
    items: [
      ['Picofly',
       `Puts the store in context.`, `let app = create({count: 0})

<Picofly value={app}>
  <App/>
</Picofly>`],
      ['useStore(store?)',
       `Returns the store and subscribes to its changes. \`useStore()\`
        tracks the data read and renders the component when it changes.
        During render the store stays locked, so a write to it throws.

        \`store\`: \`store\` Taken from context when not given.

        **Returns:** \`store\` The store.`, `let Name = () => {
  let app = useStore<App>()

  return <b>{app.user.name}</b> // renders when the name changes
}`],
      ['select(...selectors)(Component, options?)',
       `Feeds a component with store data as props and renders it when that
        data changes. More in [hook vs selectors](/hook-vs-selectors).

        \`selector\`: \`(store, props) => props\` Adds or overwrites props.
        Runs in render, hooks allowed.

        \`options\`: \`{getStore?: () => store}\` Takes the store from somewhere
        else than the context.

        **Returns:** \`component\` The wrapped component, its own props plus the
        ones the selectors take.`, `let videoById = (app, props) => ({
  video: app.videos.get(props.id),
})

export default select(videoById)(Video)`],
      ['useContextStore()',
       `Reads the store from context without subscribing to it. Should not be
        used directly. Although it can be a small optimization for components
        that never read the store, \`useStore()\` is the better choice.

        **Returns:** \`store\` The store from context.`, `let Actions = () => {
  let app = useContextStore<App>()

  return <button onClick={() => app.count++}>+1</button>
}`],
      ['PicoflyContext', 'The context itself, if you ever need it.'],
    ],
  },
  {
    id: 'selectors',
    name: 'picofly/selectors',
    items: [
      ['spec(selectors)',
       `Merges named selectors into one.

        \`selectors\`: \`{[name]: selector | path}\` A selector or a dot path
        into the store.

        **Returns:** \`(store, props) => values\` The merged selector.`, `let videoPage = spec({
  video: (app, props) => app.videos.get(props.id),
  name: 'user.name', // a path works too
})

export default select(videoPage)(VideoPage)`],
      ['item(name, cfg?)',
       `Picks \`name\` out of the \`name + s\` \`Map\` by \`props.id\`.

        \`cfg\`: \`{map?: string, idProp?: string}\` Dot paths to the \`Map\` in
        the store and to the id in props.

        **Returns:** \`(store, props) => {[name]: value}\` The selector.`, `// app.videos.get(props.id) comes in as the video prop
export default select(item('video'))(Video)

// other paths
item('video', {map: 'data.videos', idProp: 'params.id'})`],
    ],
  },
  {
    id: 'react-selectors',
    name: 'picofly/react/selectors',
    items: [
      ['callback(name, cb, deps?)',
       `A \`useCallback\` handler as a prop.

        \`cb\`: \`(store, ...args) => void\` The handler body.

        \`deps\`: \`(store, props) => unknown[]\` Extra dependencies.

        **Returns:** \`(store, props) => {[name]: handler}\` The selector.`, `let onWatch = callback('onWatch', watchVideo)

export default select(onWatch)(Video)`],
      ['effect(fns)',
       `A \`useEffect\` in selector form.

        \`fns\`: \`{run?, clean?, deps?}\` All three take \`(store, props)\`:
        \`run\` may return a cleanup of its own, \`clean\` is the cleanup when
        it does not, \`deps\` returns the dependency array.

        **Returns:** \`(store, props) => void\` The selector, it adds no props.`, `export default select(
  effect({
    run: loadVideo,
    deps: (app, props) => [props.id],
  }),
)(Video)`],
    ],
  },
]

export let Rules: [string, number, string][] = [
  ['raw', 10, `never proxies what \`markRaw()\` marked, for api clients, sockets and other service objects`],
  ['map', 20, `proxies a \`Map\``],
  ['set', 30, `proxies a \`Set\``],
  ['builtins', 40, `leaves \`Date\`, \`Error\`, \`RegExp\`, boxed primitives and everything carrying \`Symbol.toStringTag\` (\`Promise\`, \`Blob\`, DOM nodes etc.) as is`],
  ['obj', 50, `proxies everything else, objects and arrays`],
]

export let RulesPick = `// objects and arrays only, the smallest store
let app = store({count: 0}, [obj])

// every rule there is, the same as create()
let app = store(state, [raw, map, set, builtins, obj])`

export let OwnRule = `// 35 to run before builtins, which filters Date out
let date = next => !next ? 35 : ($, val) =>
	val instanceof Date ? proxifyDate($, val) : next($, val)

let app = store({}, [obj, builtins, date])`

export let Libs: [string, string][] = [
  ['picofly', '1.0.0-beta.3'],
  ['valtio', '2.3.2'],
  ['mobx', '7.0.3'],
]

export let Verdict: [string, string][] = [
  ['Putting data in',
   `==410x== vs valtio, ==492x== vs mobx. *Picofly* wraps the root and
    stops there, so ==10k== objects land in ==812 ns== against ==21–26 ms==.`],
  ['Updating',
   `==6.6x== vs valtio, ==3.5x== vs mobx. The lead grows wherever the value is
    an object, it is not proxied on the way in, no matter how big it is.`],
  ['Reading',
   `==4.6x== vs valtio, ==1.1x== vs mobx. The first read pays a small penalty
    for lazy proxies.`],
]

export let Caveats: [string, string][] = [
  ['One timer, many operations', `the clock costs nothing per operation and the code runs warm.`],
  ['Median of nine passes',
   `one process per benchmark and library, order rotates every pass. The
    best repeat wins, and with a \`gc()\` before each one the collector stays
    outside the clock. *Picofly* allocates next to nothing, so it has nothing
    to gain from that and hands the head start to *Valtio* and *MobX*.`],
  ['Reads go through a subscriber',
   `the \`onRead\` tracker in *Picofly*, the \`proxy-compare\` proxy in *Valtio*,
    a \`Reaction\` in *MobX*.`],
  ['Writes reach a subscriber',
   `one noop live listener each, \`onWrite\` in *Picofly*, a sync
    \`subscribe\` in *Valtio*, \`observe\` in *MobX*.`],
]

// the app benches run a real renderer, so the method under the table is
// their own
export let ReactCaveats: [string, string][] = [
  ['A real app on a real renderer',
   `*react-dom* into *happy-dom*, production build. Every library gets its own
    binding and its own idiomatic shape: \`useStore\` in *Picofly*,
    \`useSnapshot\` in *Valtio*, \`observer\` in *MobX*, a selector per value in
    *Zustand*.`],
  ['Median of nine passes',
   `one process per benchmark and library, order rotates every pass, a
    \`gc()\` before each repeat.`],
  ['One operation, flushed the way an app flushes',
   `the write is wrapped in \`flushSync\`, and a library that coalesces its
    notifications in a microtask gets it, then a second flush. The render is
    inside the measurement, not after it.`],
  ['Rows are memoized',
   `a parent render does not redraw the list on its own, so the number in
    brackets is how many row components the write actually woke.`],
  ['The last column is the same app with no store at all',
   `plain \`useState\` and immutable updates, the floor everything else is
    read against.`],
]

// a bench row can carry a footnote, numbered in the order they are listed
export let Notes: [string[], string][] = [
  [
    ['update/arr/length-cut', 'update/arr/length-cut-holes'],
    `*Valtio* and *MobX* notify once for the whole array, *Picofly* once per
     dropped index, so a reader of \`list[7]\` learns about the cut.`,
  ],
]

export type Bench = [string, [string, ...string[]][]][]

let V8: Bench = [
  ['fill', [
    ['obj/num-100', '339', '36,895', '46,772'],
    ['obj/obj-100', '344', '142,419', '224,406'],
    ['obj/obj-10k', '812', '21,067,743', '26,384,894'],
    ['arr/num-100', '338', '41,138', '3,014'],
    ['arr/obj-100', '339', '147,321', '169,896'],
    ['map/num-100', '351', '53,544', '10,128'],
    ['map/obj-100', '353', '165,230', '201,003'],
    ['set/num-100', '344', '54,996', '5,643'],
    ['set/obj-100', '352', '271,118', '177,315'],
  ]],
  ['update', [
    ['obj/set-100subs', '198', '2,173', '717'],
    ['obj/set-deep', '205', '3,060', '5,487'],
    ['obj/set-num', '199', '326', '375'],
    ['obj/set-obj', '208', '1,167', '2,310'],
    ['obj/set-same', '26.9', '24.5', '29.4'],
    ['obj/delete', '116', '174', '501'],
    ['arr/set-num', '226', '337', '146'],
    ['arr/set-obj', '180', '1,486', '2,183'],
    ['arr/push-num', '830', '774', '226'],
    ['arr/push-obj', '865', '1,874', '2,424'],
    ['arr/length-cut', '1,324', '292', '281'],
    ['arr/length-cut-holes', '329', '255', '268'],
    ['map/set-num', '39.5', '1,361', '59.7'],
    ['map/set-obj', '40.7', '2,574', '1,625'],
    ['map/delete', '123', '1,458', '291'],
    ['map/clear-num', '302', '1,464', '8,094'],
    ['map/clear-obj', '379', '2,549', '8,802'],
    ['set/add-num', '36.2', '1,462', '33.4'],
    ['set/add-obj', '40.1', '3,556', '1,618'],
    ['set/delete', '102', '1,454', '165'],
    ['set/clear-num', '333', '1,581', '4,279'],
    ['set/clear-obj', '344', '2,493', '7,587'],
  ]],
  ['read', [
    ['obj/get-deep-cold', '315', '1,817', '271'],
    ['obj/get-deep-cached', '106', '178', '137'],
    ['obj/get-num', '23.4', '45.4', '30.0'],
    ['obj/get-obj-cold', '70.6', '178', '82.2'],
    ['obj/get-obj-cached', '28.3', '45.8', '29.6'],
    ['arr/get-num', '96.5', '142', '80.0'],
    ['arr/get-obj-cold', '161', '495', '169'],
    ['arr/get-obj-cached', '102', '143', '79.2'],
    ['arr/iterate-num', '8,560', '16,159', '6,340'],
    ['arr/iterate-obj-cold', '19,635', '67,069', '20,076'],
    ['arr/iterate-obj-cached', '11,801', '23,627', '10,049'],
    ['map/foreach-num', '824', '23,460', '2,662'],
    ['map/get-num', '20.6', '275', '11.7'],
    ['map/get-obj-cold', '95.2', '1,573', '186'],
    ['map/get-obj-cached', '26.4', '278', '11.9'],
    ['map/has', '19.7', '84.5', '6.8'],
    ['map/iterate-entries', '982', '26,283', '2,249'],
    ['map/iterate-keys', '321', '1,479', '168'],
    ['map/iterate-num', '323', '25,161', '1,978'],
    ['map/iterate-obj-cold', '11,475', '91,017', '39,611'],
    ['map/iterate-obj-cached', '3,491', '32,279', '6,498'],
    ['map/size', '15.5', '49.6', '2.8'],
    ['set/foreach-num', '335', '46,650', '768'],
    ['set/has', '20.5', '87.9', '4.3'],
    ['set/iterate-num', '328', '25,447', '696'],
    ['set/iterate-obj-cold', '10,273', '96,676', '12,334'],
    ['set/iterate-obj-cached', '3,479', '32,514', '3,906'],
    ['set/size', '15.6', '51.6', '2.7'],
  ]],
]

let JSC: Bench = [
  ['fill', [
    ['obj/num-100', '130', '25,675', '34,047'],
    ['obj/obj-100', '134', '93,617', '130,525'],
    ['obj/obj-10k', '580', '12,546,000', '17,351,000'],
    ['arr/num-100', '135', '20,516', '1,548'],
    ['arr/obj-100', '135', '94,183', '89,450'],
    ['map/num-100', '139', '32,481', '10,176'],
    ['map/obj-100', '151', '116,280', '107,980'],
    ['set/num-100', '137', '29,859', '4,729'],
    ['set/obj-100', '144', '202,167', '135,875'],
  ]],
  ['update', [
    ['obj/set-100subs', '104', '4,172', '298'],
    ['obj/set-deep', '121', '2,117', '4,028'],
    ['obj/set-num', '102', '198', '180'],
    ['obj/set-obj', '106', '659', '1,422'],
    ['obj/set-same', '25.9', '6.0', '11.5'],
    ['obj/delete', '92.0', '124', '286'],
    ['arr/set-num', '147', '244', '65.8'],
    ['arr/set-obj', '133', '823', '1,312'],
    ['arr/push-num', '462', '405', '172'],
    ['arr/push-obj', '464', '912', '1,179'],
    ['arr/length-cut', '364', '240', '376'],
    ['arr/length-cut-holes', '266', '243', '232'],
    ['map/set-num', '76.3', '856', '138'],
    ['map/set-obj', '79.3', '1,658', '1,327'],
    ['map/delete', '186', '1,192', '416'],
    ['map/clear-num', '959', '1,051', '9,713'],
    ['map/clear-obj', '1,347', '2,799', '10,204'],
    ['set/add-num', '71.4', '887', '75.0'],
    ['set/add-obj', '74.3', '2,088', '1,298'],
    ['set/delete', '197', '1,074', '216'],
    ['set/clear-num', '951', '1,109', '7,766'],
    ['set/clear-obj', '969', '16,278', '8,683'],
  ]],
  ['read', [
    ['obj/get-deep-cold', '593', '1,731', '164'],
    ['obj/get-deep-cached', '94.0', '124', '61.6'],
    ['obj/get-num', '21.3', '23.6', '10.8'],
    ['obj/get-obj-cold', '191', '337', '33.0'],
    ['obj/get-obj-cached', '23.1', '24.8', '11.2'],
    ['arr/get-num', '38.4', '69.3', '19.2'],
    ['arr/get-obj-cold', '205', '441', '25.4'],
    ['arr/get-obj-cached', '39.5', '54.1', '19.2'],
    ['arr/iterate-num', '6,442', '9,584', '3,092'],
    ['arr/iterate-obj-cold', '24,405', '59,082', '5,384'],
    ['arr/iterate-obj-cached', '9,245', '15,072', '4,705'],
    ['map/foreach-num', '2,153', '10,318', '2,588'],
    ['map/get-num', '29.2', '114', '10.2'],
    ['map/get-obj-cold', '195', '1,535', '161'],
    ['map/get-obj-cached', '29.7', '108', '10.3'],
    ['map/has', '20.9', '39.9', '6.5'],
    ['map/iterate-entries', '1,979', '11,022', '2,565'],
    ['map/iterate-keys', '515', '885', '397'],
    ['map/iterate-num', '522', '10,000', '2,221'],
    ['map/iterate-obj-cold', '17,770', '76,400', '20,080'],
    ['map/iterate-obj-cached', '3,977', '17,542', '3,572'],
    ['map/size', '16.9', '27.6', '5.3'],
    ['set/foreach-num', '1,162', '20,060', '986'],
    ['set/has', '21.5', '41.2', '4.0'],
    ['set/iterate-num', '1,224', '10,293', '1,034'],
    ['set/iterate-obj-cold', '17,864', '77,538', '2,974'],
    ['set/iterate-obj-cached', '4,181', '16,490', '1,950'],
    ['set/size', '16.8', '27.5', '5.5'],
  ]],
]

let SM: Bench = [
  ['fill', [
    ['obj/num-100', '214', '25,321', '32,279'],
    ['obj/obj-100', '225', '153,151', '204,950'],
    ['obj/obj-10k', '794', '20,088,192', '26,223,744'],
    ['arr/num-100', '215', '25,866', '2,250'],
    ['arr/obj-100', '215', '153,326', '176,301'],
    ['map/num-100', '219', '40,170', '20,521'],
    ['map/obj-100', '220', '175,398', '206,025'],
    ['set/num-100', '219', '41,085', '12,554'],
    ['set/obj-100', '220', '419,766', '203,945'],
  ]],
  ['update', [
    ['obj/set-100subs', '189', '4,118', '735'],
    ['obj/set-deep', '192', '4,600', '4,315'],
    ['obj/set-num', '184', '252', '401'],
    ['obj/set-obj', '188', '1,279', '1,730'],
    ['obj/set-same', '74.0', '50.8', '74.2'],
    ['obj/delete', '117', '167', '227'],
    ['arr/set-num', '131', '260', '120'],
    ['arr/set-obj', '140', '1,344', '1,532'],
    ['arr/push-num', '472', '378', '204'],
    ['arr/push-obj', '486', '1,420', '1,630'],
    ['arr/length-cut', '479', '366', '311'],
    ['arr/length-cut-holes', '443', '346', '306'],
    ['map/set-num', '69.4', '1,199', '168'],
    ['map/set-obj', '73.5', '2,420', '1,491'],
    ['map/delete', '137', '1,093', '465'],
    ['map/clear-num', '2,346', '2,145', '17,190'],
    ['map/clear-obj', '2,585', '3,311', '21,673'],
    ['set/add-num', '68.5', '1,237', '91.0'],
    ['set/add-obj', '73.0', '3,572', '1,447'],
    ['set/delete', '101', '1,304', '162'],
    ['set/clear-num', '1,409', '2,305', '13,470'],
    ['set/clear-obj', '1,739', '3,987', '14,801'],
  ]],
  ['read', [
    ['obj/get-deep-cold', '667', '1,940', '222'],
    ['obj/get-deep-cached', '190', '442', '146'],
    ['obj/get-num', '37.9', '79.6', '42.6'],
    ['obj/get-obj-cold', '259', '679', '55.4'],
    ['obj/get-obj-cached', '49.3', '103', '33.4'],
    ['arr/get-num', '37.9', '86.5', '22.0'],
    ['arr/get-obj-cold', '269', '808', '54.0'],
    ['arr/get-obj-cached', '49.9', '102', '21.1'],
    ['arr/iterate-num', '7,942', '18,450', '4,480'],
    ['arr/iterate-obj-cold', '35,282', '151,055', '10,860'],
    ['arr/iterate-obj-cached', '14,260', '33,993', '9,120'],
    ['map/foreach-num', '1,492', '21,322', '5,816'],
    ['map/get-num', '39.9', '300', '34.0'],
    ['map/get-obj-cold', '279', '2,034', '190'],
    ['map/get-obj-cached', '52.1', '306', '33.9'],
    ['map/has', '39.2', '104', '18.6'],
    ['map/iterate-entries', '2,368', '32,009', '5,650'],
    ['map/iterate-keys', '1,442', '4,648', '750'],
    ['map/iterate-num', '1,451', '29,483', '5,329'],
    ['map/iterate-obj-cold', '27,500', '180,838', '56,617'],
    ['map/iterate-obj-cached', '7,855', '44,800', '9,926'],
    ['map/size', '36.2', '77.8', '13.3'],
    ['set/foreach-num', '836', '41,395', '1,390'],
    ['set/has', '39.5', '103', '15.4'],
    ['set/iterate-num', '1,317', '29,550', '1,291'],
    ['set/iterate-obj-cold', '27,525', '121,820', '7,700'],
    ['set/iterate-obj-cached', '7,665', '45,471', '5,328'],
    ['set/size', '37.2', '77.3', '13.3'],
  ]],
]

// a whole app instead of a store: react-dom rendering a list of rows into
// happy-dom, every library with its own binding
let Hermes: Bench = [
  ['fill', [
    ['obj/num-100', '1,350', '152,500', '327,500'],
    ['obj/obj-100', '1,425', '775,000', '1,469,999'],
    ['obj/obj-10k', '2,750', '96,000,000', '145,350,003'],
    ['arr/num-100', '1,350', '163,750', '34,667'],
    ['arr/obj-100', '1,375', '794,999', '1,069,999'],
    ['map/num-100', '1,400', '240,000', '151,250'],
    ['map/obj-100', '1,450', '940,001', '1,260,000'],
    ['set/num-100', '1,325', '240,000', '90,833'],
    ['set/obj-100', '1,300', '1,714,999', '1,195,000'],
  ]],
  ['update', [
    ['obj/set-100subs', '1,355', '17,833', '7,643'],
    ['obj/set-deep', '1,515', '17,333', '33,500'],
    ['obj/set-num', '1,365', '1,316', '3,000'],
    ['obj/set-obj', '1,471', '6,312', '13,125'],
    ['obj/set-same', '678', '314', '642'],
    ['obj/delete', '1,041', '757', '1,578'],
    ['arr/set-num', '1,500', '1,282', '1,329'],
    ['arr/set-obj', '1,594', '6,813', '12,000'],
    ['arr/push-num', '3,679', '1,889', '2,711'],
    ['arr/push-obj', '3,786', '6,875', '13,125'],
    ['arr/length-cut', '10,800', '1,010', '4,500'],
    ['arr/length-cut-holes', '8,667', '1,010', '4,500'],
    ['map/set-num', '1,041', '4,636', '2,060'],
    ['map/set-obj', '1,148', '10,000', '12,300'],
    ['map/delete', '1,041', '3,029', '1,741'],
    ['map/clear-num', '23,000', '4,500', '140,500'],
    ['map/clear-obj', '23,500', '7,214', '144,000'],
    ['set/add-num', '971', '4,682', '1,163'],
    ['set/add-obj', '1,052', '14,625', '11,600'],
    ['set/delete', '981', '2,941', '1,074'],
    ['set/clear-num', '23,000', '4,417', '119,000'],
    ['set/clear-obj', '23,833', '7,857', '120,500'],
  ]],
  ['read', [
    ['obj/get-deep-cold', '7,500', '13,875', '4,333'],
    ['obj/get-deep-cached', '2,940', '3,332', '2,704'],
    ['obj/get-num', '704', '624', '684'],
    ['obj/get-obj-cold', '2,146', '4,000', '1,052'],
    ['obj/get-obj-cached', '753', '900', '680'],
    ['arr/get-num', '784', '665', '672'],
    ['arr/get-obj-cold', '2,295', '4,292', '1,010'],
    ['arr/get-obj-cached', '832', '940', '672'],
    ['arr/iterate-num', '179,600', '163,800', '133,600'],
    ['arr/iterate-obj-cold', '416,000', '605,002', '246,667'],
    ['arr/iterate-obj-cached', '257,800', '258,400', '207,800'],
    ['map/foreach-num', '32,400', '180,000', '115,000'],
    ['map/get-num', '776', '2,332', '672'],
    ['map/get-obj-cold', '2,763', '9,750', '2,889'],
    ['map/get-obj-cached', '830', '2,600', '660'],
    ['map/has', '784', '1,236', '337'],
    ['map/iterate-entries', '39,400', '237,400', '113,000'],
    ['map/iterate-keys', '23,800', '36,400', '15,798'],
    ['map/iterate-num', '23,600', '213,400', '102,800'],
    ['map/iterate-obj-cold', '252,498', '753,333', '431,999'],
    ['map/iterate-obj-cached', '98,400', '306,800', '173,400'],
    ['map/size', '697', '624', '242'],
    ['set/foreach-num', '20,200', '353,000', '39,200'],
    ['set/has', '764', '1,224', '214'],
    ['set/iterate-num', '24,000', '213,200', '37,000'],
    ['set/iterate-obj-cold', '254,999', '840,001', '145,714'],
    ['set/iterate-obj-cached', '98,600', '307,600', '107,200'],
    ['set/size', '704', '624', '238'],
  ]],
]

let ReactApp: Bench = [
  ['app', [
    ['obj/mount-all', '6,867 (1000)', '13,415 (1000)', '7,037 (1000)', '5,646 (1000)'],
    ['obj/patch', '257 (100)', '2,630 (100)', '315 (100)', '270 (100)'],
    ['obj/upsert', '975 (200)', '5,243 (200)', '1,339 (200)', '610 (200)'],
    ['obj/add', '377 (1)', '1,660 (1)', '662 (1)', '197 (1)'],
    ['obj/delete', '381 (0)', '1,542 (0)', '631 (0)', '205 (0)'],
    ['arr/mount-all', '6,520 (1000)', '13,073 (1000)', '6,282 (1000)', '5,480 (1000)'],
    ['arr/toggle-one', '46.2 (1)', '904 (1)', '49.2 (1)', '71.3 (1)'],
    ['arr/rename-one', '40.0 (1)', '891 (1)', '45.8 (1)', '70.4 (1)'],
    ['arr/push', '122 (1)', '1,045 (1)', '1,074 (1001)', '157 (1)'],
    ['arr/delete', '843 (499)', '6,504 (499)', '1,198 (999)', '432 (499)'],
    ['arr/fill-new', '1,979 (1000)', '4,954 (1000)', '4,308 (1000)', '1,071 (1000)'],
    ['arr/fill-same', '1,245 (1000)', '431 (0)', '3,351 (1000)', '439 (1000)'],
    ['map/mount-all', '6,582 (1000)', '14,864 (1000)', '6,461 (1000)', '5,430 (1000)'],
    ['map/fill-10k', '4,000 (1000)', '55,685 (1000)', '26,154 (1000)', '3,405 (1000)'],
    ['map/patch', '247 (100)', '2,830 (100)', '274 (100)', '300 (100)'],
    ['map/upsert', '727 (200)', '6,386 (200)', '783 (200)', '669 (200)'],
    ['map/switch-page', '382 (100)', '658 (100)', '471 (100)', '329 (100)'],
    ['map/add', '165 (1)', '1,926 (1)', '267 (1)', '228 (1)'],
    ['map/delete', '164 (0)', '1,339 (0)', '269 (0)', '231 (0)'],
  ]],
]

export let Engines: {
  id: EngineId
  name: string
  env: string
  bench: Bench
  // the app benches run zustand too, the core ones do not
  libs?: [string, string][]
  unit?: string
  renders?: boolean
}[] = [
  {id: 'v8', name: 'V8', env: 'node v24.18.1', bench: V8},
  {id: 'jsc', name: 'JSC', env: 'webkit2gtk 2.48.7', bench: JSC},
  {id: 'sm', name: 'SpiderMonkey', env: 'JavaScript-C140.11.0', bench: SM},
  {
    id: 'hermes',
    name: 'Hermes',
    env: 'Hermes 260318099.0.1 (React Native 0.88, -Os)',
    bench: Hermes,
  },
  {
    id: 'react',
    name: 'React (V8)',
    env: 'node v24.18.1, react-dom 19.3.0 into happy-dom, production build',
    bench: ReactApp,
    libs: [...Libs, ['zustand', '5.0.15']],
    unit: 'µs',
    renders: true,
  },
]
