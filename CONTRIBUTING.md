# Contributing guide

1. Install dependencies

```
npm i
```

2. Run tests in watch mode

```
npm run test:watch
```

3. For any new features, add new tests

## Releasing a new version

1. Open a PR bumping the version in `package.json`
2. After version PR is merged, run `npm run deploy` which will build and publish a new version to npm
