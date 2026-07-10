// Recording wrapper around the real `promql` object. The fixture generator
// aliases the spec files' `import { promql } from '../promql'` to this module,
// so every public API call made by the jest suite is captured as a fixture.
import { promql as real } from '../../src/promql';
import { record } from './recorder-state';

export const promql: typeof real = new Proxy(real, {
  get(target, prop: string) {
    const orig = (target as Record<string, unknown>)[prop];
    if (typeof orig !== 'function') {
      return orig;
    }
    return (...args: unknown[]) => {
      // Public API functions take a single params object. Internal helpers
      // (x_over_time, binaryOp, by, without, byOrWithout) take positional
      // arguments and are not part of the cross-language contract.
      const isPublic =
        args.length === 1 && typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0]);
      try {
        const result = (orig as (...a: unknown[]) => unknown).apply(target, args);
        if (isPublic && typeof result === 'string') {
          record({ fn: prop, params: args[0], expected: result });
        }
        return result;
      } catch (e) {
        if (isPublic && e instanceof Error) {
          record({ fn: prop, params: args[0], error: e.message });
        }
        throw e;
      }
    };
  },
});
