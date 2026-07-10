// Replays the recorder-generated conformance corpus (spec/fixtures/) against
// the jsonnet implementation. Cases with an `error` field assert that the
// implementation raises; jsonnet has no try/catch, so those are checked by
// scripts/test-jsonnet.sh via per-case invocations of error_case.jsonnet.
local fixtures = import '../../spec/fixtures/conformance.json';
local invoke = import './invoke.libsonnet';

local stringCases = [c for c in fixtures.cases if std.objectHas(c, 'expected')];
local errorCases = [c for c in fixtures.cases if std.objectHas(c, 'error')];

local results = [
  {
    case: c,
    actual: invoke(c.fn, c.params),
    pass: self.actual == c.expected,
  }
  for c in stringCases
];

local failures = [r for r in results if !r.pass];

if std.length(failures) == 0 then
  'PASS: %d/%d conformance cases (%d error cases checked separately)' % [
    std.length(results),
    std.length(results),
    std.length(errorCases),
  ]
else
  error '%d/%d conformance cases FAILED:\n\n' % [std.length(failures), std.length(results)] + std.join('\n\n', [
    '[%s] %s\n  expected: %s\n  actual:   %s' % [f.case.suite, f.case.fn, f.case.expected, f.actual]
    for f in failures
  ])
