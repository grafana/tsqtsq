import { promql } from './promql';
import { OffsetUnits, PodsWithWorkloadLabels } from './types';

export const buildOffsetString = (offset: OffsetUnits) => {
  // iterate through all units and build a string from them
  let unitString = '';
  for (const [unit, value] of Object.entries(offset)) {
    if (value > 0) {
      unitString += `${value}${unit}`;
    }
  }
  return unitString.length ? `offset ${unitString}` : '';
};

export const snippets = {
  pods: {
    withWorkloads: (values: PodsWithWorkloadLabels) => {
      let { cluster, namespace, workload, workload_type, pod, lastOverTime = false } = values;

      cluster = cluster || '.+';
      namespace = namespace || '.+';
      workload_type = workload_type || '.+';
      pod = pod || '.+';

      const last_over_time = (q: string) => (lastOverTime ? promql.last_over_time({ expr: q }) : q);

      if (workload) {
        return `
          ${last_over_time(
            `namespace_workload_pod:kube_pod_owner:relabel{cluster=~"${cluster}", namespace=~"${namespace}", workload_type=~"${workload_type}", workload=~"${workload}", pod=~"${pod}"}`
          )}
  
          OR
  
          label_replace(
            label_replace(
              ${last_over_time(
                `namespace_workload_pod:kube_pod_owner:relabel{cluster=~"${cluster}", namespace=~"${namespace}", workload_type=~"${workload_type}", workload="", pod=~"${workload}.+"}`
              )}
            , "workload", "$1", "pod", "(.+)-(.+)")
          , "workload_type", "replicaset", "", "")
  
          OR
  
          label_replace(
            label_replace(
              ${last_over_time(
                `kube_pod_owner{cluster=~"${cluster}", namespace=~"${namespace}", pod=~"${workload}", owner_kind=""}`
              )}
            , "workload", "$1", "pod", "(.+)")
          , "workload_type", "pod", "", "")
  
          OR
  
          label_replace(
            label_replace(
              ${last_over_time(
                `kube_pod_owner{cluster=~"${cluster}", namespace=~"${namespace}", pod=~"${workload}", owner_kind="Node"}`
              )}
            , "workload", "$1", "pod", "(.+)")
          , "workload_type", "staticpod", "", "")
        `;
      } else {
        return `
          ${last_over_time(
            `namespace_workload_pod:kube_pod_owner:relabel{cluster=~"${cluster}", namespace=~"${namespace}", workload_type=~"${workload_type}", workload!="", pod=~"${pod}"}`
          )}
  
          OR
  
          label_replace(
            label_replace(
              ${last_over_time(
                `namespace_workload_pod:kube_pod_owner:relabel{cluster=~"${cluster}", namespace=~"${namespace}", workload_type=~"${workload_type}", workload="", pod=~"${pod}"}`
              )}
            , "workload", "$1", "pod", "(.+)-(.+)")
          , "workload_type", "replicaset", "", "")
  
          OR
  
          label_replace(
            label_replace(
              ${last_over_time(
                `kube_pod_owner{cluster=~"${cluster}", namespace=~"${namespace}", pod=~"${pod}", owner_kind=""}`
              )}
            , "workload", "$1", "pod", "(.+)")
          , "workload_type", "pod", "", "")
  
          OR
  
          label_replace(
            label_replace(
              ${last_over_time(
                `kube_pod_owner{cluster=~"${cluster}", namespace=~"${namespace}", pod=~"${pod}", owner_kind="Node"}`
              )}
            , "workload", "$1", "pod", "(.+)")
          , "workload_type", "staticpod", "", "")
        `;
      }
    },
  },
};
