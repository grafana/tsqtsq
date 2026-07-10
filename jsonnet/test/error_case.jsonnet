// Evaluates a single error-case fixture by index; expected to FAIL with the
// fixture's error message. Driven by scripts/test-jsonnet.sh, which asserts
// on the non-zero exit and the message.
local fixtures = import '../../spec/fixtures/conformance.json';
local invoke = import './invoke.libsonnet';

function(index)
  local errorCases = [c for c in fixtures.cases if std.objectHas(c, 'error')];
  local case = errorCases[index];
  invoke(case.fn, case.params)
