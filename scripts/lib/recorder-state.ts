// Shared state for the fixture recorder. Public API calls made by the spec
// files are recorded here as conformance cases and written to spec/fixtures/.

export type FixtureCase = {
  suite: string;
  fn: string;
  params: unknown;
  expected?: string;
  error?: string;
};

export const recorded: FixtureCase[] = [];

const seen = new Set<string>();
let currentSuite = '';

export const setSuite = (suite: string) => {
  currentSuite = suite;
};

export const record = (entry: Omit<FixtureCase, 'suite'>) => {
  // params are JSON round-tripped so the dedupe key and the emitted fixture
  // are exactly what a replaying implementation will see.
  const params = JSON.parse(JSON.stringify(entry.params));
  const key = JSON.stringify([entry.fn, params, entry.expected ?? null, entry.error ?? null]);
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  recorded.push({ suite: currentSuite, ...entry, params });
};
