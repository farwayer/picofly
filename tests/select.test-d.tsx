// type tests for select()
// run: yarn types. --strict is required there: without strictNullChecks the
// `| undefined` unions collapse and these cases stop being representative
// every case must typecheck, every @ts-expect-error must fire

import {ComponentProps, ReactNode} from 'react'
import {select} from '../src/react'

type App = {n: number}
type OuterProps = {id: string}

let base = (app: App, props: OuterProps) => ({name: 'x'})
let age = (app: App, props: OuterProps) => ({age: 42})
let eff = (app: App, props: OuterProps) => {}  // void effect-selector

// pass-through props (id) are declared on the component and survive the Omit
type CProps = {id: string, name: string, age: number, extra?: boolean}
let C = (props: CProps) => null

// 1. plain chain
let R1 = select(base, age)(C)
let r1 = <R1 id="1" extra/>

// 2. void selector inside the chain (fix #1)
let R2 = select(base, eff, age)(C)
let r2 = <R2 id="1"/>

// 3. void-only chain: all component props stay outer
let R3 = select(eff)((props: {x: number}) => null)
let r3 = <R3 x={1} id="1"/>

// 4. chain consuming previous selector's output
let R4 = select(
  base,
  (app: App, props: OuterProps & {name: string}) => ({len: props.name.length}),
)((props: {id: string, name: string, len: number}) => null)
let r4 = <R4 id="1"/>

// 5. selector prop missing in component props
// @ts-expect-error
select(base)((props: {other: string}) => null)

// 6. same mismatch, but with a void selector in the chain (fix #2 closes the escape)
// @ts-expect-error
select(eff, base)((props: {other: string}) => null)

// 7. selector prop type not matching component prop type
// @ts-expect-error
select(base)((props: {name: number}) => null)

// 8. zero selectors
let R8 = select()((props: {x: number}) => null)
let r8 = <R8 x={1}/>

// 9. conditional selector, prop required in component:
// the selector may return nothing, so outside must provide it
let cond = (app: App, props: OuterProps) => app.n > 0 ? {age: 42} : undefined
let R9 = select(cond)((props: {id: string, age: number}) => null)
let r9 = <R9 id="1" age={7}/>
// @ts-expect-error
let r9bad = <R9 id="1"/>

// 10. same selector, prop optional in component: outside may omit it
let R10 = select(cond)((props: {id: string, age?: number}) => null)
let r10a = <R10 id="1"/>
let r10b = <R10 id="1" age={7}/>

// 11. `&&` combinator form (false lands in the union)
let flag = (app: App, props: OuterProps) => app.n > 0 && {age: 42}
let R11 = select(flag)((props: {id: string, age?: number}) => null)
let r11 = <R11 id="1"/>

// 12. chain after a conditional selector sees the prop as optional
select(cond, (app: App, props: OuterProps & {age?: number}) => ({name: String(props.age ?? 0)}))

// 13. conditional selector prop type mismatch is still caught
// @ts-expect-error
select(cond)((props: {id: string, age: string}) => null)

// 14. overriding selector does not read the prop, so passing it is pointless
let icon = (app: App) => ({icon: 'x'})
let R14 = select(icon)((props: {id: string, icon: string}) => null)
let r14 = <R14 id="1"/>
// @ts-expect-error
let r14bad = <R14 id="1" icon="y"/>

// 15. augmenting selector reads the prop and derives from it, so it stays passable
let merge = (app: App, props: OuterProps & {style?: string}) => ({style: 'merged'})
let R15 = select(merge)((props: {id: string, style?: string}) => null)
let r15a = <R15 id="1" style="s"/>
let r15b = <R15 id="1"/>

// 16. P0 is inferred even when props is declared by a later selector only
let noProps = (app: App) => ({a: 1})
let R16 = select(noProps, merge)((props: {id: string, a: number, style?: string}) => null)
let r16 = <R16 id="1" style="s"/>
// @ts-expect-error a is overridden by the selector
let r16bad = <R16 id="1" a={2}/>

// 17. wrapping a foreign component: style is merged by a selector,
// so it must stay passable at the call site
let Text = (p: {style?: object, children?: ReactNode, onPress?: () => void}) => null
type LinkProps = ComponentProps<typeof Text> & {uri: string}

let Link = select(
  (app: App, props: LinkProps) => ({onPress: () => {}}),
  (app: App, props: LinkProps) => ({style: {...props.style}}),
)<LinkProps>(Text)

let l1 = <Link uri="https://x" style={{}}>text</Link>
let l2 = <Link uri="https://x"/>
// @ts-expect-error
let l3 = <Link style={{}}/>

// 18. a prop the selector needs but the component does not declare
// (the README's videoById/<Video id/> shape)
type Video = {name: string}
let videoById = (app: {videos: Map<string, Video>}, props: {id: string}) => ({
  video: props.id ? app.videos.get(props.id) : undefined,
})
let R18 = select(videoById)((props: {video?: Video}) => null)
let r18 = <R18 id="1"/>

// 19. and it is required, not optional
// @ts-expect-error
let r19 = <R18/>

// 20. every selector brings its own props, so the order does not matter
type App20 = {flag: boolean, videos: Map<string, Video>}
let flagged = (app: App20) => ({hasFlag: app.flag})
let byId = (app: App20, props: {id: string}) => ({video: app.videos.get(props.id)})
let Both = (props: {id: string, hasFlag: boolean, video?: Video}) => null
let R20 = select(flagged, byId)(Both)
let r20 = <R20 id="1"/>
let R20b = select(byId, flagged)(Both)
let r20b = <R20b id="1"/>

// 21. a prop an earlier selector provides is not asked from the caller
let usesFlag = (app: App20, props: {hasFlag: boolean}) => ({shown: props.hasFlag})
let R21 = select(flagged, usesFlag)((props: {hasFlag: boolean, shown: boolean}) => null)
let r21 = <R21/>

// 22. what no selector provides is still required
let R22 = select(usesFlag, byId)((props: {shown: boolean, video?: Video}) => null)
let r22 = <R22 id="1" hasFlag/>
// @ts-expect-error
let r22b = <R22 hasFlag/>
// @ts-expect-error
let r22c = <R22 id="1"/>

// 23. the store comes as is or as a function returning it
let app: App = {n: 1}
let R23 = select(base, age)(C, {store: app})
let R23b = select(base, age)(C, {store: () => app})
// @ts-expect-error
select(base, age)(C, {store: {m: 1}})
// @ts-expect-error
select(base, age)(C, {getStore: () => app})
