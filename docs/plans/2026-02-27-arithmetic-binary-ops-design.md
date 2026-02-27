# Arithmetic Binary Ops with Vector Matching

## Summary

Add six arithmetic binary operator methods to the `promql` object with full PromQL vector matching support (`on`/`ignoring`/`group_left`/`group_right`). Also update CI to Node 24.

## Types

New type in `types.ts`:

```ts
type ArithmeticBinaryOpParams = {
  left: string;
  right: string;
  on?: string[];
  ignoring?: string[];
  groupLeft?: string[];
  groupRight?: string[];
};
```

- `on`/`ignoring` mutually exclusive (`on` wins if both provided)
- `groupLeft`/`groupRight` mutually exclusive (`groupLeft` wins if both provided)
- All matching params optional

## Methods

Six methods on `promql`: `add` (+), `sub` (-), `mul` (*), `div` (/), `mod` (%), `pow` (^).

Internal helper `arithmeticBinaryOp(op, params)` builds the matching clause.

## Output Format

```
<left> <op> [on/ignoring (...)] [group_left/group_right (...)] <right>
```

## Node 24

Update `.github/workflows/ci.yaml` `node-version` from `'20'` to `'24'`.

## Tests

New `src/test/arithmeticBinaryOp.spec.ts` using `it.each()` pattern.
