// Dispatches a conformance fixture case to the jsonnet implementation.
local tsqtsq = import '../promql.libsonnet';

function(fn, params)
  if fn == 'Expression' then
    local expr = std.foldl(
      function(acc, selector) acc.setSelector(selector),
      std.get(params, 'setSelectors', []),
      tsqtsq.Expression(params),
    );
    expr.toString()
  else
    tsqtsq.promql[fn](params)
