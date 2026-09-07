export let cn = (...args: unknown[]) =>
  args.filter(Boolean).join(' ')
