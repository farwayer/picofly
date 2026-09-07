import type {ApiTab, EngineId, Page, TabId} from '~/store/state'

export let Cfg = {
  name: 'Picofly',
  tagline: 'Tiny state manager, built with ❤️',
  install: ['npm i picofly', 'yarn add picofly'],
  size: {
    min: '579 B',
    react: '795 B',
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
    id: 'architecture',
    name: 'Good, Bad, Ugly Architecture',
  },
]

export let Features = [
  ['⚡', 'Fast', 'every hot path is measured'],
  ['🤏', 'Tiny', `${Cfg.size.min} minimal, ${Cfg.size.react} with React support`],
  ['🥧', 'Simple', '~140 lines of airy code'],
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
export class Calc {
  a = 0
  b = 0
  resetting = false
}

// write plain functions that read and change data
export let inc = (calc: Calc, key: Key) => {
  calc[key]++
}

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
    code: `import {useRef} from 'react'
import {create} from 'picofly'
import {Picofly} from 'picofly/react'
import {Calc} from './calc.ts'
import {CellSum} from './sum.tsx'
import {Reset} from './reset.tsx'
import {CellA, CellB} from './cells.tsx'
import {Inc} from './inc.tsx'

// put the store in context, the rest takes it from there
export function Calculator() {
  let calcRef = useRef<Calc | null>(null)
  let calc = calcRef.current ??= create(new Calc())

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

// useStore() reads the data and follows its changes
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
import type {Calc} from './calc.ts'
import {reset} from './calc.ts'

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

// you can use selectors instead of the hook
// it reads the store and feeds a component
let aValue = (calc: Calc) => ({value: calc.a})
let bValue = (calc: Calc) => ({value: calc.b})

export let CellA = select(aValue)(Cell) // renders only when a changes
export let CellB = select(bValue)(Cell) // renders only when b changes

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
    code: `import {memo, useCallback} from 'react'
import {select} from 'picofly/react'
import type {Calc, Key} from './calc.ts'
import {inc} from './calc.ts'

// selectors can do more than read the store
// they can attach callbacks and call hooks
export let Inc = select(
  (calc: Calc, props: {cell: Key}) => ({
    onClick: useCallback(() => inc(calc, props.cell), [props.cell]),
    children: \`\${props.cell}++\`,
  }),
)(memo(Button))

function Button({onClick, children}: Props) {
  return <button onClick={onClick}>{children}</button>
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

        \`cb\`: \`(rawObj, prop) => void\` Called after every data change.

        **Returns:** \`() => void\` The unsubscribe function.`, `let unsub = onWrite(app, (obj, prop) => {
  console.log('changed:', prop)
})

app.user.name = 'Kim' // changed: name
unsub()`],
      ['onRead(store, cb)',
       `Subscribes to reads in \`store\`.

        \`cb\`: \`(rawObj, prop) => void\` Called after every data read.

        **Returns:** \`() => void\` The unsubscribe function.`, `onRead(app, (obj, prop) => {
  console.log('read:', prop)
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

        **Returns:** \`(store, props) => {[name]: handler}\` The selector.`, `let onWatch = callback('onWatch', (app, id) => watchVideo(app, id))

export default select(onWatch)(Video)`],
      ['effect(fns)',
       `A \`useEffect\` in selector form.

        \`fns\`: \`{run?, clean?, deps?}\` All three take \`(store, props)\`:
        \`run\` may return a cleanup of its own, \`clean\` is the cleanup when
        it does not, \`deps\` returns the dependency array.

        **Returns:** \`(store, props) => void\` The selector, it adds no props.`, `export default select(
  effect({
    run: (app, props) => loadVideo(app, props.id),
    deps: (app, props) => [props.id],
  }),
)(Video)`],
    ],
  },
]

export let Rules: [string, number, string][] = [
  ['raw', 10, `keeps whatever \`markRaw()\` marked`],
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

export let Setup: [string, string][] = [
  ['picofly', `0.1.0`],
  ['valtio', `2.3.2`],
  ['mobx', `7.0.3`],
  ['node', `24.18.1 on Linux, i9-13900`],
  ['measured', `2026-09-07`],
  ['run', `\`./perf/run.sh\``],
]

export let Verdict: [string, string][] = [
  ['Putting data in',
   `==422x== vs valtio, ==508x== vs mobx. *Picofly* wraps the root and
    stops there, so ==10k== objects land in ==864 ns== against ==21–26 ms==.`],
  ['Updating',
   `==7.3x== vs valtio, ==4.8x== vs mobx. The lead grows wherever the value is
    an object, it is not proxied on the way in, no matter how big it is.`],
  ['Reading',
   `==4.2x== vs valtio, ==1.0x== vs mobx. The first read pays a small penalty
    for lazy proxies. And *Picofly* uses a real \`Map\` and \`Set\`, while
    *Valtio* and *MobX* replace them with emulations.`],
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

export type Bench = [string, [string, string, string, string][]][]

let V8: Bench = [
  ['fill', [
    ['arr/num-100', '336', '43,330', '3,138'],
    ['arr/obj-100', '334', '147,009', '169,850'],
    ['arr/push-obj-100', '77,010', '173,596', '218,755'],
    ['map/num-100', '342', '53,643', '9,712'],
    ['map/obj-100', '349', '164,954', '197,663'],
    ['obj/num-100', '335', '37,057', '45,504'],
    ['obj/obj-100', '336', '141,910', '226,574'],
    ['obj/obj-10k', '864', '20,955,428', '26,496,477'],
    ['set/num-100', '340', '54,942', '5,138'],
    ['set/obj-100', '343', '268,628', '179,069'],
  ]],
  ['update', [
    ['arr/push-num', '860', '774', '234'],
    ['arr/push-obj', '807', '1,811', '2,435'],
    ['arr/set-num', '185', '346', '148'],
    ['arr/set-obj', '159', '1,494', '2,177'],
    ['map/clear-num', '339', '1,505', '8,125'],
    ['map/clear-obj', '397', '2,542', '8,880'],
    ['map/delete', '126', '1,420', '291'],
    ['map/set-num', '33.3', '1,415', '159'],
    ['map/set-obj', '34.2', '2,646', '2,348'],
    ['obj/delete', '103', '172', '489'],
    ['obj/set-100subs', '201', '2,160', '728'],
    ['obj/set-deep', '207', '3,091', '5,517'],
    ['obj/set-num', '224', '342', '385'],
    ['obj/set-obj', '211', '1,151', '2,264'],
    ['obj/set-same', '25.6', '25.2', '28.9'],
    ['set/add-num', '32.4', '1,556', '58.6'],
    ['set/add-obj', '37.4', '3,608', '2,198'],
    ['set/clear-num', '296', '1,601', '4,279'],
    ['set/clear-obj', '339', '2,472', '7,428'],
    ['set/delete', '71.4', '1,369', '164'],
  ]],
  ['read', [
    ['arr/get-num', '94.1', '142', '80.1'],
    ['arr/get-obj-cached', '102', '145', '79.7'],
    ['arr/get-obj-cold', '273', '599', '166'],
    ['arr/iterate-num', '8,430', '16,171', '6,346'],
    ['arr/iterate-obj-cached', '11,748', '23,802', '10,259'],
    ['arr/iterate-obj-cold', '19,864', '67,325', '20,606'],
    ['map/get-num', '21.0', '275', '11.7'],
    ['map/get-obj-cached', '26.5', '276', '11.9'],
    ['map/get-obj-cold', '81.9', '1,652', '226'],
    ['map/has', '20.1', '84.8', '6.9'],
    ['map/iterate-entries', '938', '26,181', '2,252'],
    ['map/iterate-keys', '302', '1,484', '168'],
    ['map/iterate-num', '303', '25,459', '1,982'],
    ['map/iterate-obj-cached', '3,131', '32,191', '6,483'],
    ['map/iterate-obj-cold', '11,091', '90,860', '39,026'],
    ['map/size', '15.8', '49.5', '2.7'],
    ['obj/get-deep-cached', '105', '184', '139'],
    ['obj/get-deep-cold', '271', '1,836', '283'],
    ['obj/get-num', '24.5', '43.8', '30.0'],
    ['obj/get-obj-cached', '28.4', '46.0', '30.5'],
    ['obj/get-obj-cold', '109', '212', '118'],
    ['set/has', '20.9', '86.6', '4.3'],
    ['set/iterate-num', '307', '25,632', '692'],
    ['set/iterate-obj-cached', '3,088', '32,460', '3,898'],
    ['set/iterate-obj-cold', '10,850', '92,264', '12,912'],
    ['set/size', '15.8', '50.4', '2.7'],
  ]],
]

let JSC: Bench = [
  ['fill', [
    ['arr/num-100', '100', '20,200', '1,700'],
    ['arr/obj-100', '100', '80,900', '114,500'],
    ['arr/push-obj-100', '37,400', '96,300', '141,800'],
    ['map/num-100', '100', '31,100', '9,600'],
    ['map/obj-100', '200', '94,500', '97,500'],
    ['obj/num-100', '100', '25,400', '32,700'],
    ['obj/obj-100', '100', '82,000', '148,900'],
    ['obj/obj-10k', '1,000', '11,278,000', '16,875,000'],
    ['set/num-100', '100', '28,800', '4,700'],
    ['set/obj-100', '200', '136,300', '88,100'],
  ]],
  ['update', [
    ['arr/push-num', '400', '370', '170'],
    ['arr/push-obj', '410', '860', '1,100'],
    ['arr/set-num', '80.0', '230', '60.0'],
    ['arr/set-obj', '70.0', '740', '1,230'],
    ['map/clear-num', '940', '970', '8,390'],
    ['map/clear-obj', '960', '2,450', '8,340'],
    ['map/delete', '170', '1,100', '370'],
    ['map/set-num', '70.0', '820', '130'],
    ['map/set-obj', '70.0', '1,490', '1,230'],
    ['obj/delete', '80.0', '110', '280'],
    ['obj/set-100subs', '110', '3,520', '280'],
    ['obj/set-deep', '130', '1,750', '3,830'],
    ['obj/set-num', '110', '180', '160'],
    ['obj/set-obj', '120', '640', '1,280'],
    ['obj/set-same', '21.5', '5.7', '10.7'],
    ['set/add-num', '70.0', '810', '70.0'],
    ['set/add-obj', '70.0', '1,840', '1,190'],
    ['set/clear-num', '930', '990', '6,760'],
    ['set/clear-obj', '960', '2,690', '7,280'],
    ['set/delete', '170', '880', '200'],
  ]],
  ['read', [
    ['arr/get-num', '46.7', '51.9', '19.1'],
    ['arr/get-obj-cached', '48.0', '51.7', '18.9'],
    ['arr/get-obj-cold', '190', '440', '20.0'],
    ['arr/iterate-num', '7,348', '9,352', '3,071'],
    ['arr/iterate-obj-cached', '10,064', '14,416', '4,636'],
    ['arr/iterate-obj-cold', '21,600', '52,800', '4,400'],
    ['map/get-num', '32.2', '114', '9.9'],
    ['map/get-obj-cached', '33.6', '107', '10.0'],
    ['map/get-obj-cold', '180', '1,240', '150'],
    ['map/has', '23.2', '39.3', '6.1'],
    ['map/iterate-entries', '2,395', '11,948', '2,702'],
    ['map/iterate-keys', '1,045', '880', '392'],
    ['map/iterate-num', '1,123', '10,332', '2,224'],
    ['map/iterate-obj-cached', '4,600', '16,020', '3,428'],
    ['map/iterate-obj-cold', '14,000', '67,600', '18,800'],
    ['map/size', '20.9', '22.8', '5.4'],
    ['obj/get-deep-cached', '118', '122', '48.7'],
    ['obj/get-deep-cold', '540', '1,500', '140'],
    ['obj/get-num', '26.7', '23.2', '10.5'],
    ['obj/get-obj-cached', '28.3', '24.4', '10.5'],
    ['obj/get-obj-cold', '170', '350', '20.0'],
    ['set/has', '23.6', '36.4', '4.0'],
    ['set/iterate-num', '1,137', '9,864', '975'],
    ['set/iterate-obj-cached', '4,556', '15,548', '1,938'],
    ['set/iterate-obj-cold', '14,000', '67,600', '2,400'],
    ['set/size', '21.7', '22.7', '5.5'],
  ]],
]

let SM: Bench = [
  ['fill', [
    ['arr/num-100', '225', '25,980', '2,326'],
    ['arr/obj-100', '230', '155,071', '178,460'],
    ['arr/push-obj-100', '48,195', '172,019', '198,986'],
    ['map/num-100', '234', '40,093', '20,319'],
    ['map/obj-100', '250', '175,500', '205,560'],
    ['obj/num-100', '225', '25,460', '32,270'],
    ['obj/obj-100', '229', '149,971', '205,655'],
    ['obj/obj-10k', '960', '19,921,702', '26,468,659'],
    ['set/num-100', '236', '40,925', '12,531'],
    ['set/obj-100', '244', '414,501', '200,380'],
  ]],
  ['update', [
    ['arr/push-num', '455', '380', '204'],
    ['arr/push-obj', '460', '1,405', '1,616'],
    ['arr/set-num', '122', '261', '120'],
    ['arr/set-obj', '128', '1,364', '1,538'],
    ['map/clear-num', '1,762', '2,140', '17,347'],
    ['map/clear-obj', '2,183', '3,300', '20,248'],
    ['map/delete', '135', '1,114', '461'],
    ['map/set-num', '69.9', '1,191', '167'],
    ['map/set-obj', '73.0', '2,412', '1,498'],
    ['obj/delete', '117', '165', '228'],
    ['obj/set-100subs', '202', '4,048', '738'],
    ['obj/set-deep', '204', '4,536', '4,336'],
    ['obj/set-num', '196', '254', '404'],
    ['obj/set-obj', '200', '1,272', '1,731'],
    ['obj/set-same', '71.1', '50.8', '73.5'],
    ['set/add-num', '67.5', '1,242', '91.0'],
    ['set/add-obj', '74.5', '3,624', '1,450'],
    ['set/clear-num', '1,570', '2,305', '13,328'],
    ['set/clear-obj', '1,927', '4,134', '15,042'],
    ['set/delete', '88.5', '1,343', '164'],
  ]],
  ['read', [
    ['arr/get-num', '38.1', '85.4', '21.9'],
    ['arr/get-obj-cached', '48.7', '119', '22.0'],
    ['arr/get-obj-cold', '234', '818', '53.1'],
    ['arr/iterate-num', '7,927', '18,187', '4,474'],
    ['arr/iterate-obj-cached', '14,071', '34,006', '9,130'],
    ['arr/iterate-obj-cold', '32,901', '148,961', '10,880'],
    ['map/get-num', '40.0', '296', '34.0'],
    ['map/get-obj-cached', '51.4', '298', '34.2'],
    ['map/get-obj-cold', '239', '2,008', '194'],
    ['map/has', '39.2', '100', '18.6'],
    ['map/iterate-entries', '2,294', '32,399', '5,652'],
    ['map/iterate-keys', '1,396', '4,849', '786'],
    ['map/iterate-num', '1,409', '29,430', '5,348'],
    ['map/iterate-obj-cached', '7,284', '45,134', '10,003'],
    ['map/iterate-obj-cold', '24,960', '184,264', '43,843'],
    ['map/size', '36.1', '78.4', '13.3'],
    ['obj/get-deep-cached', '184', '442', '146'],
    ['obj/get-deep-cold', '617', '1,976', '223'],
    ['obj/get-num', '38.0', '78.3', '42.6'],
    ['obj/get-obj-cached', '48.5', '112', '36.3'],
    ['obj/get-obj-cold', '229', '701', '55.4'],
    ['set/has', '39.4', '104', '15.4'],
    ['set/iterate-num', '1,276', '29,698', '1,290'],
    ['set/iterate-obj-cached', '6,765', '45,903', '5,334'],
    ['set/iterate-obj-cold', '24,740', '115,676', '7,736'],
    ['set/size', '37.0', '77.1', '13.3'],
  ]],
]

export let Engines: {id: EngineId, name: string, bench: Bench}[] = [
  {id: 'v8', name: 'V8', bench: V8},
  {id: 'jsc', name: 'JSC', bench: JSC},
  {id: 'sm', name: 'SpiderMonkey', bench: SM},
]
