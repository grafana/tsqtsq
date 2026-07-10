#!/usr/bin/env bash
# Replays the recorder-generated conformance corpus (spec/fixtures/) against
# the jsonnet implementation. Requires `jsonnet` (go-jsonnet) and `jq`.
set -euo pipefail

cd "$(dirname "$0")/.."

JSONNET="${JSONNET:-jsonnet}"
FIXTURES=spec/fixtures/conformance.json

# String-producing cases: replayed in one evaluation.
"$JSONNET" jsonnet/test/conformance.jsonnet

# Error cases: jsonnet has no try/catch, so each one is evaluated separately
# and must fail with the recorded message.
error_count=$(jq '[.cases[] | select(.error != null)] | length' "$FIXTURES")
for ((i = 0; i < error_count; i++)); do
  expected=$(jq -r "[.cases[] | select(.error != null)][$i].error" "$FIXTURES")
  if output=$("$JSONNET" --tla-code "index=$i" jsonnet/test/error_case.jsonnet 2>&1); then
    echo "FAIL: error case $i did not raise. Expected error: $expected" >&2
    exit 1
  fi
  if ! grep -qF "$expected" <<<"$output"; then
    echo "FAIL: error case $i raised the wrong error." >&2
    echo "  expected: $expected" >&2
    echo "  actual:   $output" >&2
    exit 1
  fi
done
echo "PASS: $error_count/$error_count error cases"
