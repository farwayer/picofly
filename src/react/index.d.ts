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

type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T]

export type Select<S, PE> = <FP>(
  Component: ComponentType<FP & PE>,
  options?: SelectOptions<S>,
) => FunctionComponent<Omit<FP, RequiredKeys<PE>>>

export function select<S>(
): Select<S, {}>

export function select<S, P0, E0>(
  s0: Selector<S, P0, E0>,
): Select<S, E0>

export function select<S, P0, E0, E1>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & E0, E1>,
): Select<S, E0 & E1>

export function select<S, P0, E0, E1, E2>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & E0, E1>,
  s2: Selector<S, P0 & E0 & E1, E2>,
): Select<S, E0 & E1 & E2>

export function select<S, P0, E0, E1, E2, E3>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & E0, E1>,
  s2: Selector<S, P0 & E0 & E1, E2>,
  s3: Selector<S, P0 & E0 & E1 & E2, E3>,
): Select<S, E0 & E1 & E2 & E3>

export function select<S, P0, E0, E1, E2, E3, E4>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & E0, E1>,
  s2: Selector<S, P0 & E0 & E1, E2>,
  s3: Selector<S, P0 & E0 & E1 & E2, E3>,
  s4: Selector<S, P0 & E0 & E1 & E2 & E3, E4>,
): Select<S, E0 & E1 & E2 & E3 & E4>

export function select<S, P0, E0, E1, E2, E3, E4, E5>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & E0, E1>,
  s2: Selector<S, P0 & E0 & E1, E2>,
  s3: Selector<S, P0 & E0 & E1 & E2, E3>,
  s4: Selector<S, P0 & E0 & E1 & E2 & E3, E4>,
  s5: Selector<S, P0 & E0 & E1 & E2 & E3 & E4, E5>,
): Select<S, E0 & E1 & E2 & E3 & E4 & E5>

export function select<S, P0, E0, E1, E2, E3, E4, E5, E6>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & E0, E1>,
  s2: Selector<S, P0 & E0 & E1, E2>,
  s3: Selector<S, P0 & E0 & E1 & E2, E3>,
  s4: Selector<S, P0 & E0 & E1 & E2 & E3, E4>,
  s5: Selector<S, P0 & E0 & E1 & E2 & E3 & E4, E5>,
  s6: Selector<S, P0 & E0 & E1 & E2 & E3 & E4 & E5, E6>,
): Select<S, E0 & E1 & E2 & E3 & E4 & E5 & E6>

export function select<S, P0, E0, E1, E2, E3, E4, E5, E6, E7>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & E0, E1>,
  s2: Selector<S, P0 & E0 & E1, E2>,
  s3: Selector<S, P0 & E0 & E1 & E2, E3>,
  s4: Selector<S, P0 & E0 & E1 & E2 & E3, E4>,
  s5: Selector<S, P0 & E0 & E1 & E2 & E3 & E4, E5>,
  s6: Selector<S, P0 & E0 & E1 & E2 & E3 & E4 & E5, E6>,
  s7: Selector<S, P0 & E0 & E1 & E2 & E3 & E4 & E5 & E6, E7>,
): Select<S, E0 & E1 & E2 & E3 & E4 & E5 & E6 & E7>

export function select<S, P0, E0, E1, E2, E3, E4, E5, E6, E7, E8>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & E0, E1>,
  s2: Selector<S, P0 & E0 & E1, E2>,
  s3: Selector<S, P0 & E0 & E1 & E2, E3>,
  s4: Selector<S, P0 & E0 & E1 & E2 & E3, E4>,
  s5: Selector<S, P0 & E0 & E1 & E2 & E3 & E4, E5>,
  s6: Selector<S, P0 & E0 & E1 & E2 & E3 & E4 & E5, E6>,
  s7: Selector<S, P0 & E0 & E1 & E2 & E3 & E4 & E5 & E6, E7>,
  s8: Selector<S, P0 & E0 & E1 & E2 & E3 & E4 & E5 & E6 & E7, E8>,
): Select<S, E0 & E1 & E2 & E3 & E4 & E5 & E6 & E7 & E8>

export function select<S, P0, E0, E1, E2, E3, E4, E5, E6, E7, E8, E9>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P0 & E0, E1>,
  s2: Selector<S, P0 & E0 & E1, E2>,
  s3: Selector<S, P0 & E0 & E1 & E2, E3>,
  s4: Selector<S, P0 & E0 & E1 & E2 & E3, E4>,
  s5: Selector<S, P0 & E0 & E1 & E2 & E3 & E4, E5>,
  s6: Selector<S, P0 & E0 & E1 & E2 & E3 & E4 & E5, E6>,
  s7: Selector<S, P0 & E0 & E1 & E2 & E3 & E4 & E5 & E6, E7>,
  s8: Selector<S, P0 & E0 & E1 & E2 & E3 & E4 & E5 & E6 & E7, E8>,
  s9: Selector<S, P0 & E0 & E1 & E2 & E3 & E4 & E5 & E6 & E7 & E8, E9>,
): Select<S, E0 & E1 & E2 & E3 & E4 & E5 & E6 & E7 & E8 & E9>
