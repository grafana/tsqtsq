// Minimal jest shim so the real spec files can run unmodified outside jest
// while the recorder captures their public API calls. Only the matchers the
// suite actually uses are implemented; anything else fails loudly.

export const stats = { assertions: 0 };

type SpecFn = (arg?: unknown) => void;

const describe = (_name: string, fn: () => void) => fn();

const it = (_name: string, fn: SpecFn) => fn();
it.each =
  (cases: unknown[]) =>
  (_title: string, fn: SpecFn) =>
    cases.forEach((c) => fn(c));

const expect = (actual: unknown) => ({
  toStrictEqual: (expected: unknown) => {
    stats.assertions++;
    if (actual !== expected) {
      throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },
  toEqual(expected: unknown) {
    this.toStrictEqual(expected);
  },
  toThrow: (message?: string) => {
    stats.assertions++;
    let thrown: Error | undefined;
    try {
      (actual as () => unknown)();
    } catch (e) {
      thrown = e as Error;
    }
    if (thrown === undefined) {
      throw new Error('expected function to throw');
    }
    if (message !== undefined && !thrown.message.includes(message)) {
      throw new Error(`expected error containing ${JSON.stringify(message)}, got ${JSON.stringify(thrown.message)}`);
    }
  },
});

Object.assign(globalThis, { describe, it, test: it, expect });
