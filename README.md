# tsqtsq

Hackathon summer 2024 project

# PromQL Query Library

Kubernetes Monitoring uses an ever-growing number of PromQL queries, which can be found over in [queries.ts](../queries.ts). Previously, most of the PromQL was hand-written. Syntax-wise this is fine as due to the CI check which uses [node-generate.ts](../scripts/node-generate.ts). A large number of hand-written queries are, however, difficult to maintain. Wide-ranging changes and common "query snippets" have varying approaches and often impact query readability. Consider the following use cases:

- Implement de-duplication of all existing queries that use the KSM requests and limits metrics
- Blanket-ignore pods named `POD` for all CPU usage queries
- Support both OpenCost and cloudcost-exporter in all cost queries
- Support both Node Exporter and Windows Exporter in all memory usage queries

The library in this directory is an effort to reduce the potential toil involved in refactoring tasks like those mentioned above.

## Principles

- Maintain "backwards compatibilty" by returning PromQL queries as a simple `string` - just like the string literals and template strings we used before.
- Re-usability of "query snippets" is a priority.
- Avoid verbose library usage and syntax wherever possible, prefer ease of use over type purity.
- Aim to make metrics and labels "discoverable" through IntelliSense, to aid query writing in the editor.
- Embed "sensible defaults" and tribal knowledge using query abstraction - e.g. using `container!=""` as a default matcher for requests/limits but only if the `container` label is not passed a value (this avoids matching against the confusing pod-level cgroup metrics).
- Prefer named object/property parameters over ordered/implicit arguments - because who can remember whether the labels or the query comes first.

## Worked Example

Here's the entrypoint, we want to sum all of the CPU container limits across a whole cluster:

- A list of KSM metrics and rules are available in [metrics/ksm.ts](metrics/ksm.ts), we'll use `ksm.metrics.kube_pod_container_resource_limits`.
  - This metric has only one required label: `resource` and it has to be either `cpu` or `memory`
  - A bunch of other labels are available (`cluster`, `node`, `namespace` etc), only pass the ones you need, doesn't matter if it's `undefined` (it will be automatically discarded if it is)

```ts
// queries.ts
ClusterDetail: {
  CpuLimits: (cluster?: string) =>
    // promql.sum() is pretty much 1:1 with what you would write in PromQL, i.e.: sum()
    promql.sum({
      // this part uses the Expression class and is where most of the work happens
      expr: ksm.metrics.kube_pod_container_resource_limits({
        resource: 'cpu',
        cluster,
      }),
    }),
}
```

What does the query look like? You can run `make test-promql` and open up [rules.yml](../../rules.yml) to see what's generated:

```yaml
- record: SceneQueries_ClusterDetail_CpuLimits_WithArgs
  expr: sum(max by (cluster, node, namespace, pod, container) (kube_pod_container_resource_limits{container!="", resource=~"cpu", cluster=~"arg0"}))
- record: SceneQueries_ClusterDetail_CpuLimits_WithoutArgs
  expr: sum(max by (cluster, node, namespace, pod, container) (kube_pod_container_resource_limits{container!="", resource=~"cpu"}))
```

Here's just the PromQL query prettified and commented:

```sql
# promql.sum
sum(
  # auto de-duplication using max by
  max by (cluster, node, namespace, pod, container) (
    # ksm.metrics.kube_pod_container_resource_limits
    #   - container!="" is a default label selector, which is only used if you
    #     don't pass a container parameter.
    kube_pod_container_resource_limits{container!="", resource=~"cpu", cluster=~"arg0"}
  )
)
```

How does it work? Check out [metrics/ksm.ts](metrics/ksm.ts). This is where we define a reusable, de-duplicated, default-valued query for metrics and rules. Here's just the `kube_pod_container_resource_limits` metric:

```ts
export const ksm = {
  metrics: {
    kube_pod_container_resource_limits: (
      values: kube_pod_container_resource_labels
    ) => {
      return promql.max({
        by: "cluster, node, namespace, pod, container",
        expr: new Expression({
          metric: "kube_pod_container_resource_limits",
          values,
          defaultOperator: MatchingOperator.regexMatch,
          defaultSelectors: [
            {
              label: "container",
              operator: MatchingOperator.notEqual,
              value: "",
            },
          ],
        }).toString(),
      });
    },
  },
};
```

The `toString()` call of [Expression](expression.ts) is where the PromQL string generation actually happens, here're the important parts:

```ts
export class Expression {
  // ... snip
  selectors = new Map<string, LabelSelector>();

	toString(): string {
    const selectors = Array.from(this.selectors)
      .map(([label, selector]) => `${label}${selector.operator}"${selector.value}"`)
      .join(', ');
    return `${this.metric}{${selectors}}`;
  }
```

## More Examples

Check out the table tests for a full range of examples, showing the capabilities of the `Expression` class:

- [expression.spec.ts](expression.spec.ts)
- [promql.spec.ts](promql.spec.ts)

# PromQL Query Library

Kubernetes Monitoring uses an ever-growing number of PromQL queries, which can be found over in [queries.ts](../queries.ts). Previously, most of the PromQL was hand-written. Syntax-wise this is fine as due to the CI check which uses [node-generate.ts](../scripts/node-generate.ts). A large number of hand-written queries are, however, difficult to maintain. Wide-ranging changes and common "query snippets" have varying approaches and often impact query readability. Consider the following use cases:

- Implement de-duplication of all existing queries that use the KSM requests and limits metrics
- Blanket-ignore pods named `POD` for all CPU usage queries
- Support both OpenCost and cloudcost-exporter in all cost queries
- Support both Node Exporter and Windows Exporter in all memory usage queries

The library in this directory is an effort to reduce the potential toil involved in refactoring tasks like those mentioned above.

## Principles

- Maintain "backwards compatibilty" by returning PromQL queries as a simple `string` - just like the string literals and template strings we used before.
- Re-usability of "query snippets" is a priority.
- Avoid verbose library usage and syntax wherever possible, prefer ease of use over type purity.
- Aim to make metrics and labels "discoverable" through IntelliSense, to aid query writing in the editor.
- Embed "sensible defaults" and tribal knowledge using query abstraction - e.g. using `container!=""` as a default matcher for requests/limits but only if the `container` label is not passed a value (this avoids matching against the confusing pod-level cgroup metrics).
- Prefer named object/property parameters over ordered/implicit arguments - because who can remember whether the labels or the query comes first.

## Worked Example

Here's the entrypoint, we want to sum all of the CPU container limits across a whole cluster:

- A list of KSM metrics and rules are available in [metrics/ksm.ts](metrics/ksm.ts), we'll use `ksm.metrics.kube_pod_container_resource_limits`.
  - This metric has only one required label: `resource` and it has to be either `cpu` or `memory`
  - A bunch of other labels are available (`cluster`, `node`, `namespace` etc), only pass the ones you need, doesn't matter if it's `undefined` (it will be automatically discarded if it is)

```ts
// queries.ts
ClusterDetail: {
  CpuLimits: (cluster?: string) =>
    // promql.sum() is pretty much 1:1 with what you would write in PromQL, i.e.: sum()
    promql.sum({
      // this part uses the Expression class and is where most of the work happens
      expr: ksm.metrics.kube_pod_container_resource_limits({
        resource: 'cpu',
        cluster,
      }),
    }),
}
```

What does the query look like? You can run `make test-promql` and open up [rules.yml](../../rules.yml) to see what's generated:

```yaml
- record: SceneQueries_ClusterDetail_CpuLimits_WithArgs
  expr: sum(max by (cluster, node, namespace, pod, container) (kube_pod_container_resource_limits{container!="", resource=~"cpu", cluster=~"arg0"}))
- record: SceneQueries_ClusterDetail_CpuLimits_WithoutArgs
  expr: sum(max by (cluster, node, namespace, pod, container) (kube_pod_container_resource_limits{container!="", resource=~"cpu"}))
```

Here's just the PromQL query prettified and commented:

```sql
# promql.sum
sum(
  # auto de-duplication using max by
  max by (cluster, node, namespace, pod, container) (
    # ksm.metrics.kube_pod_container_resource_limits
    #   - container!="" is a default label selector, which is only used if you
    #     don't pass a container parameter.
    kube_pod_container_resource_limits{container!="", resource=~"cpu", cluster=~"arg0"}
  )
)
```

How does it work? Check out [metrics/ksm.ts](metrics/ksm.ts). This is where we define a reusable, de-duplicated, default-valued query for metrics and rules. Here's just the `kube_pod_container_resource_limits` metric:

```ts
export const ksm = {
  metrics: {
    kube_pod_container_resource_limits: (
      values: kube_pod_container_resource_labels
    ) => {
      return promql.max({
        by: "cluster, node, namespace, pod, container",
        expr: new Expression({
          metric: "kube_pod_container_resource_limits",
          values,
          defaultOperator: MatchingOperator.regexMatch,
          defaultSelectors: [
            {
              label: "container",
              operator: MatchingOperator.notEqual,
              value: "",
            },
          ],
        }).toString(),
      });
    },
  },
};
```

The `toString()` call of [Expression](expression.ts) is where the PromQL string generation actually happens, here're the important parts:

```ts
export class Expression {
  // ... snip
  selectors = new Map<string, LabelSelector>();

	toString(): string {
    const selectors = Array.from(this.selectors)
      .map(([label, selector]) => `${label}${selector.operator}"${selector.value}"`)
      .join(', ');
    return `${this.metric}{${selectors}}`;
  }
```

## More Examples

Check out the table tests for a full range of examples, showing the capabilities of the `Expression` class:

- [expression.spec.ts](expression.spec.ts)
- [promql.spec.ts](promql.spec.ts)
