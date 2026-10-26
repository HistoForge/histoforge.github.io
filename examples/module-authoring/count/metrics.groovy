/* @histoforge-metrics
[
  {
    "name": "object_count",
    "label": "Object count",
    "type": "scalar",
    "decimals": 0,
    "aggregation": "sum"
  }
]
*/
def objects = m.byClass(children, "Object")
return [object_count: objects.size()]
