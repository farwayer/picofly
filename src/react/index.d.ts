import {Context, Provider, FunctionComponent, ComponentType} from 'react'

export let StoreContext: Context<unknown>
export let StoreProvider: Provider<unknown>

export function useContextStore<S>(): S

export function useStore<S>(store?: S): S

export type Selector<S, P, EP> = (store: S, props: P) => EP

export type SelectOptions<S> = {
  getStore?: () => S,
  withRef?: boolean,
}

export type Select<S, PE> = <FP>(
  Component: ComponentType<FP>,
  options?: SelectOptions<S>
) => FunctionComponent<Optional<FP, keyof PE>>

export function select<S, P>(
): Select<S, P>

export function select<S, P0, E0>(
  s0: Selector<S, P0, E0>,
): Select<S, E0>

export function select<S, P0, E0, P1, E1>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P1, E1>,
): Select<S, E0 & E1>

export function select<S, P0, E0, P1, E1, P2, E2>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P1, E1>,
  s2: Selector<S, P2, E2>,
): Select<S, E1 & E2>

export function select<S, P0, E0, P1, E1, P2, E2, P3, E3>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P1, E1>,
  s2: Selector<S, P2, E2>,
  s3: Selector<S, P3, E3>,
): Select<S, E1 & E2 & E3>

export function select<S, P0, E0, P1, E1, P2, E2, P3, E3, P4, E4>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P1, E1>,
  s2: Selector<S, P2, E2>,
  s3: Selector<S, P3, E3>,
  s4: Selector<S, P4, E4>,
): Select<S, E1 & E2 & E3 & E4>

export function select<S, P0, E0, P1, E1, P2, E2, P3, E3, P4, E4, P5, E5>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P1, E1>,
  s2: Selector<S, P2, E2>,
  s3: Selector<S, P3, E3>,
  s4: Selector<S, P4, E4>,
  s5: Selector<S, P5, E5>,
): Select<S, E1 & E2 & E3 & E4 & E5>

export function select<S, P0, E0, P1, E1, P2, E2, P3, E3, P4, E4, P5, E5, P6, E6>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P1, E1>,
  s2: Selector<S, P2, E2>,
  s3: Selector<S, P3, E3>,
  s4: Selector<S, P4, E4>,
  s5: Selector<S, P5, E5>,
  s6: Selector<S, P6, E6>,
): Select<S, E1 & E2 & E3 & E4 & E5 & E6>

export function select<S, P0, E0, P1, E1, P2, E2, P3, E3, P4, E4, P5, E5, P6, E6, P7, E7>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P1, E1>,
  s2: Selector<S, P2, E2>,
  s3: Selector<S, P3, E3>,
  s4: Selector<S, P4, E4>,
  s5: Selector<S, P5, E5>,
  s6: Selector<S, P6, E6>,
  s7: Selector<S, P7, E7>,
): Select<S, E1 & E2 & E3 & E4 & E5 & E6 & E7>

export function select<S, P0, E0, P1, E1, P2, E2, P3, E3, P4, E4, P5, E5, P6, E6, P7, E7, P8, E8>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P1, E1>,
  s2: Selector<S, P2, E2>,
  s3: Selector<S, P3, E3>,
  s4: Selector<S, P4, E4>,
  s5: Selector<S, P5, E5>,
  s6: Selector<S, P6, E6>,
  s7: Selector<S, P7, E7>,
  s8: Selector<S, P8, E8>,
): Select<S, E1 & E2 & E3 & E4 & E5 & E6 & E7 & E8>

export function select<S, P0, E0, P1, E1, P2, E2, P3, E3, P4, E4, P5, E5, P6, E6, P7, E7, P8, E8, P9, E9>(
  s0: Selector<S, P0, E0>,
  s1: Selector<S, P1, E1>,
  s2: Selector<S, P2, E2>,
  s3: Selector<S, P3, E3>,
  s4: Selector<S, P4, E4>,
  s5: Selector<S, P5, E5>,
  s6: Selector<S, P6, E6>,
  s7: Selector<S, P7, E7>,
  s8: Selector<S, P8, E8>,
): Select<S, E1 & E2 & E3 & E4 & E5 & E6 & E7 & E8 & E9>

type Optional<T, K extends keyof any> = Omit<T, K> & Partial<T>
