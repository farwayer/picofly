export function callback<const Name extends string, App, Args extends unknown[]>(
	name: Name,
	cb: (app: App, ...args: Args) => unknown,
	deps?: Deps<App, unknown>,
): (app: App, props: unknown) => {[key in Name]: (...args: Args) => void}

export function effect<App, Props>(
	fns?: EffectFns<App, Props>,
): (app: App, props: Props) => void

export type EffectFns<App, Props> = {
	run?: Run<App, Props>
	clean?: Clean<App, Props>
	deps?: Deps<App, Props>
}


type Clean<App, Props> = (app: App, props: Props) => void
type Deps<App, Props> = (app: App, props: Props) => unknown[]
type Run<App, Props> = (app: App, props: Props) => Clean<App, Props> | void
