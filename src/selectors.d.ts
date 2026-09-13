export function spec<const S extends Spec>(
	spec: S,
): (app: SpecApp<S>, props: SpecProps<S>) => Simplify<SpecValues<S>>

export function item<
	App extends object,
	const Name extends string = string,
	const MapPath extends string = `${Name}s`,
	const IdPath extends string = 'id',
>(
	name: Name,
	cfg?: {map?: MapPath, idProp?: IdPath},
): (
	app: App,
	props: PathValue<IdPath, ItemKey<App, MapPath>>,
) => {[key in Name]: ItemValue<App, MapPath> | undefined}


type Spec = Record<string, string | AnySelector>
type AnySelector = (app: any, props: any) => unknown

type SpecApp<S> = [SelectorApp<S>] extends [never]
	? object
	: Intersect<SelectorApp<S>>
type SpecProps<S> = [SelectorProps<S>] extends [never]
	? unknown
	: Intersect<SelectorProps<S>>

type SelectorApp<S> = {
	[name in keyof S]: S[name] extends (app: infer App, ...rest: never[]) => unknown
		? App
		: never
}[keyof S]
type SelectorProps<S> = {
	[name in keyof S]: S[name] extends (app: never, props: infer Props) => unknown
		? Props
		: never
}[keyof S]

type SpecValues<S> = {
	[name in keyof S]: S[name] extends (...args: never[]) => infer Value
		? Value
		: S[name] extends string
			? Get<SpecApp<S>, S[name]>
			: never
}

type ItemKey<App, MapPath extends string> =
	Get<App, MapPath> extends ReadonlyMap<infer Key, unknown> ? Key : never
type ItemValue<App, MapPath extends string> =
	Get<App, MapPath> extends ReadonlyMap<unknown, infer Value> ? Value : never

type PathValue<Path extends string, Value> =
	Path extends `${infer Key}.${infer Rest}`
		? {[key in Key]: PathValue<Rest, Value>}
		: {[key in Path]: Value}

type Get<T, Path extends string> =
	Path extends `${infer Key}.${infer Rest}`
		? Key extends keyof T ? Get<T[Key], Rest> : never
		: Path extends keyof T ? T[Path] : never

type Simplify<T> = {[key in keyof T]: T[key]} & {}

type Intersect<U> =
	(U extends unknown ? (u: U) => void : never) extends (u: infer I) => void
		? I
		: never
