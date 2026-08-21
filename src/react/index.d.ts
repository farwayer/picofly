import {Context, Provider, FunctionComponent, ComponentType} from 'react'

export let StoreContext: Context<unknown>
export let StoreProvider: Provider<unknown>

export function useContextStore<S>(): S

export function useStore<S>(store?: S): S

export type Selector<S, P, EP> = (store: S, props: P) => EP

export type SelectOptions<S> = {
  getStore?: () => S
  withRef?: boolean
}

type None = null | undefined | false | 0 | 0n | ''

type Norm<E> =
  [E] extends [void] ? {} :
  [Extract<E, None>] extends [never] ? E :
  [Exclude<E, None>] extends [never] ? {} :
  Partial<Exclude<E, None>>

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]

type Mismatch<PE, FP> = {
  [K in keyof PE & keyof FP]: PE[K] extends FP[K] ? never : K
}[keyof PE & keyof FP]

export type Select<S, PE> = <FP>(
  Component: ComponentType<FP> & (
    [Exclude<keyof PE, keyof FP>] extends [never]
      ? [Required<PE>] extends [Pick<FP, keyof PE & keyof FP>]
        ? unknown
        : {'select: props type mismatch': Mismatch<Required<PE>, FP>}
      : {'select: props missing in component': Exclude<keyof PE, keyof FP>}
  ),
  options?: SelectOptions<S>,
) => FunctionComponent<
  [OptionalKeys<PE>] extends [never]
    ? Omit<FP, keyof PE>
    : Omit<FP, keyof PE> & Partial<Pick<FP, OptionalKeys<PE> & keyof FP>>
>

export function select<S>(
): Select<S, {}>

export function select<S, P0, E0>(
  s0: Selector<S, P0, E0>,
): Select<S, Norm<E0>>

export function select<S, P0, E0, E1>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & Norm<E0>, E1>,
): Select<S, Norm<E0> & Norm<E1>>

export function select<S, P0, E0, E1, E2>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & Norm<E0>, E1>,
  s2: Selector<S, P0 & Norm<E0> & Norm<E1>, E2>,
): Select<S, Norm<E0> & Norm<E1> & Norm<E2>>

export function select<S, P0, E0, E1, E2, E3>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & Norm<E0>, E1>,
  s2: Selector<S, P0 & Norm<E0> & Norm<E1>, E2>,
  s3: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2>, E3>,
): Select<S, Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3>>

export function select<S, P0, E0, E1, E2, E3, E4>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & Norm<E0>, E1>,
  s2: Selector<S, P0 & Norm<E0> & Norm<E1>, E2>,
  s3: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2>, E3>,
  s4: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3>, E4>,
): Select<S, Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4>>

export function select<S, P0, E0, E1, E2, E3, E4, E5>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & Norm<E0>, E1>,
  s2: Selector<S, P0 & Norm<E0> & Norm<E1>, E2>,
  s3: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2>, E3>,
  s4: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3>, E4>,
  s5: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4>, E5>,
): Select<S, Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5>>

export function select<S, P0, E0, E1, E2, E3, E4, E5, E6>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & Norm<E0>, E1>,
  s2: Selector<S, P0 & Norm<E0> & Norm<E1>, E2>,
  s3: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2>, E3>,
  s4: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3>, E4>,
  s5: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4>, E5>,
  s6: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5>, E6>,
): Select<S, Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5> & Norm<E6>>

export function select<S, P0, E0, E1, E2, E3, E4, E5, E6, E7>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & Norm<E0>, E1>,
  s2: Selector<S, P0 & Norm<E0> & Norm<E1>, E2>,
  s3: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2>, E3>,
  s4: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3>, E4>,
  s5: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4>, E5>,
  s6: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5>, E6>,
  s7: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5> & Norm<E6>, E7>,
): Select<S, Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5> & Norm<E6> & Norm<E7>>

export function select<S, P0, E0, E1, E2, E3, E4, E5, E6, E7, E8>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & Norm<E0>, E1>,
  s2: Selector<S, P0 & Norm<E0> & Norm<E1>, E2>,
  s3: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2>, E3>,
  s4: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3>, E4>,
  s5: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4>, E5>,
  s6: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5>, E6>,
  s7: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5> & Norm<E6>, E7>,
  s8: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5> & Norm<E6> & Norm<E7>, E8>,
): Select<S, Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5> & Norm<E6> & Norm<E7> & Norm<E8>>

export function select<S, P0, E0, E1, E2, E3, E4, E5, E6, E7, E8, E9>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & Norm<E0>, E1>,
  s2: Selector<S, P0 & Norm<E0> & Norm<E1>, E2>,
  s3: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2>, E3>,
  s4: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3>, E4>,
  s5: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4>, E5>,
  s6: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5>, E6>,
  s7: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5> & Norm<E6>, E7>,
  s8: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5> & Norm<E6> & Norm<E7>, E8>,
  s9: Selector<S, P0 & Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5> & Norm<E6> & Norm<E7> & Norm<E8>, E9>,
): Select<S, Norm<E0> & Norm<E1> & Norm<E2> & Norm<E3> & Norm<E4> & Norm<E5> & Norm<E6> & Norm<E7> & Norm<E8> & Norm<E9>>
