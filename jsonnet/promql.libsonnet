// tsqtsq - A PromQL Query Library (Jsonnet implementation)
//
// This is a hand-written port of the TypeScript implementation in ../src.
// The API deliberately mirrors the TypeScript API one-to-one: every function
// takes a single params object with the same field names as the TypeScript
// types, and returns a plain string. A call like
//
//   promql.sum({ expr: 'up', by: ['job'] })
//
// is valid in both languages, modulo quote style.
//
// Behavioural equivalence with the TypeScript implementation is enforced by
// replaying the recorder-generated conformance corpus in spec/fixtures/
// (see jsonnet/test/conformance.jsonnet and scripts/test-jsonnet.sh).
//
// Documented divergences from JavaScript semantics (both are deliberate
// spec decisions, chosen so that output is deterministic in jsonnet, which
// has no insertion-ordered objects):
//
//   1. Expression applies `values` in lexicographic label order. The
//      TypeScript implementation applies them in object insertion order.
//   2. offset() emits units in canonical descending order (y w d h m s ms).
//      The TypeScript implementation emits them in object insertion order.
//      PromQL requires descending order, so callers should already be
//      passing units this way.

local str(v) = if std.type(v) == 'string' then v else std.toString(v);

// PromQL label matching operators (=, !=, =~, !~).
// Mirrors the MatchingOperator enum in src/types.ts.
local matchingOperator = {
  equal: '=',
  notEqual: '!=',
  regexMatch: '=~',
  notRegexMatch: '!~',
};

local offsetUnitOrder = ['y', 'w', 'd', 'h', 'm', 's', 'ms'];

// Mirrors buildOffsetString() in src/utils.ts.
local buildOffsetString(units) =
  local unitString = std.join('', [
    str(units[u]) + u
    for u in offsetUnitOrder
    if std.objectHas(units, u) && units[u] > 0
  ]);
  if std.length(unitString) > 0 then 'offset ' + unitString else '';

// Query builder with methods for composing PromQL queries.
// All methods return plain strings. Mirrors `promql` in src/promql.ts.
local promql = {
  // Helper for *_over_time functions.
  x_over_time(x, q, range='$__range', interval='')::
    '%s_over_time((%s)[%s:%s])' % [x, q, range, interval],

  local overTime(fn) = function(params)
    promql.x_over_time(
      fn,
      params.expr,
      std.get(params, 'range', '$__range'),
      std.get(params, 'interval', ''),
    ),

  // Aggregation over time
  avg_over_time: overTime('avg'),
  count_over_time: overTime('count'),
  last_over_time: overTime('last'),
  max_over_time: overTime('max'),
  min_over_time: overTime('min'),
  present_over_time: overTime('present'),
  stddev_over_time: overTime('stddev'),
  stdvar_over_time: overTime('stdvar'),
  sum_over_time: overTime('sum'),
  quantile_over_time: overTime('quantile'),

  offset(params):: buildOffsetString(params.units),

  by(labels=null):: if labels != null then ' by (%s) ' % std.join(', ', labels) else '',
  without(labels=null):: if labels != null then ' without (%s) ' % std.join(', ', labels) else '',
  byOrWithout(params)::
    local by = std.get(params, 'by');
    if by != null then self.by(by) else self.without(std.get(params, 'without')),

  // Aggregation
  local aggregation(op) = function(params)
    '%s%s(%s)' % [op, promql.byOrWithout(params), params.expr],

  sum: aggregation('sum'),
  min: aggregation('min'),
  max: aggregation('max'),
  avg: aggregation('avg'),
  group: aggregation('group'),
  count: aggregation('count'),
  stddev: aggregation('stddev'),
  stdvar: aggregation('stdvar'),

  local aggregationWithParameter(op) = function(params)
    '%s%s(%s, %s)' % [op, promql.byOrWithout(params), str(params.parameter), params.expr],

  count_values: aggregationWithParameter('count_values'),
  bottomk: aggregationWithParameter('bottomk'),
  topk: aggregationWithParameter('topk'),
  quantile: aggregationWithParameter('quantile'),

  and(params):: self.binaryOp('and', params),
  or(params):: self.binaryOp('or', params),
  unless(params):: self.binaryOp('unless', params),

  rate(params):: 'rate(%s[%s])' % [params.expr, std.get(params, 'interval', '$__rate_interval')],
  increase(params):: 'increase(%s[%s])' % [params.expr, std.get(params, 'interval', '$__range')],

  // Labels
  label_replace(params)::
    'label_replace(%s, "%s", "%s", "%s", "%s")' % [
      params.expr,
      params.newLabel,
      std.get(params, 'replacement', '$1'),
      params.existingLabel,
      std.get(params, 'regex', '(.*)'),
    ],

  label_join(params)::
    'label_join(%s, "%s", "%s", %s)' % [
      params.expr,
      params.newLabel,
      std.get(params, 'separator', ','),
      std.join(', ', ['"%s"' % label for label in params.labels]),
    ],

  // Shared helper for arithmetic, logical and comparison binary operators
  // with vector matching.
  binaryOp(op, params)::
    local on = std.get(params, 'on');
    local ignoring = std.get(params, 'ignoring');
    local groupLeft = std.get(params, 'groupLeft');
    local groupRight = std.get(params, 'groupRight');
    local bool = std.get(params, 'bool', false);
    local hasOn = on != null && std.length(on) > 0;
    local hasIgnoring = ignoring != null && std.length(ignoring) > 0;

    if (groupLeft != null || groupRight != null) && !hasOn && !hasIgnoring then
      error 'group_left/group_right require an "on" or "ignoring" clause'
    else
      local matching =
        (
          if hasOn then ' on (%s)' % std.join(', ', on)
          else if hasIgnoring then ' ignoring (%s)' % std.join(', ', ignoring)
          else ''
        )
        + (
          if groupLeft != null then
            (if std.length(groupLeft) > 0 then ' group_left (%s)' % std.join(', ', groupLeft) else ' group_left()')
          else if groupRight != null then
            (if std.length(groupRight) > 0 then ' group_right (%s)' % std.join(', ', groupRight) else ' group_right()')
          else ''
        );
      '%s %s%s%s %s' % [params.left, op, if bool == true then ' bool' else '', matching, params.right],

  add(params):: self.binaryOp('+', params),
  sub(params):: self.binaryOp('-', params),
  mul(params):: self.binaryOp('*', params),
  div(params):: self.binaryOp('/', params),
  mod(params):: self.binaryOp('%', params),
  pow(params):: self.binaryOp('^', params),

  eq(params):: self.binaryOp('==', params),
  neq(params):: self.binaryOp('!=', params),
  gt(params):: self.binaryOp('>', params),
  lt(params):: self.binaryOp('<', params),
  gte(params):: self.binaryOp('>=', params),
  lte(params):: self.binaryOp('<=', params),
};

// Composable PromQL metric selector with label matching.
// Mirrors the Expression class in src/expression.ts: construct with
// Expression({ metric, values, defaultOperator, defaultSelectors }), chain
// setSelector() calls, and call toString() to produce the selector string.
//
// Unlike the TypeScript class, setSelector() returns a NEW expression
// (jsonnet values are immutable), so calls must be chained or reassigned:
//
//   Expression({ ... }).setSelector({ ... }).toString()
local expressionObject(metric, entries) = {
  setSelector(selector)::
    local hasLabel = std.any([e.label == selector.label for e in entries]);
    local newEntries =
      if hasLabel then [
        if e.label == selector.label then e { selectors: e.selectors + [selector] } else e
        for e in entries
      ]
      else entries + [{ label: selector.label, selectors: [selector] }];
    expressionObject(metric, newEntries),

  toString()::
    '%s{%s}' % [
      metric,
      std.join(', ', [
        '%s%s"%s"' % [e.label, s.operator, s.value]
        for e in entries
        for s in e.selectors
      ]),
    ],
};

local expression(opts) =
  // set default selectors first
  local withDefaults = std.foldl(
    function(acc, selector)
      if std.any([e.label == selector.label for e in acc]) then [
        if e.label == selector.label then e { selectors: e.selectors + [selector] } else e
        for e in acc
      ]
      else acc + [{ label: selector.label, selectors: [selector] }],
    std.get(opts, 'defaultSelectors', []),
    [],
  );

  // override default selectors with actual values (lexicographic label order)
  local entries = std.foldl(
    function(acc, label)
      local selector = { operator: opts.defaultOperator, label: label, value: opts.values[label] };
      if std.any([e.label == label for e in acc]) then [
        if e.label == label then e { selectors: [selector] } else e
        for e in acc
      ]
      else acc + [{ label: label, selectors: [selector] }],
    [l for l in std.objectFields(opts.values) if opts.values[l] != null],
    withDefaults,
  );

  expressionObject(opts.metric, entries);

{
  promql: promql,
  Expression: expression,
  MatchingOperator: matchingOperator,
}
