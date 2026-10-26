/* @histoforge-metrics
[
  {
    "name": "object_count",
    "label": "Object count",
    "type": "scalar",
    "decimals": 0,
    "aggregation": "sum"
  },
  {
    "name": "object_area",
    "label": "Object area",
    "type": "distribution",
    "unit": "µm²",
    "decimals": 1,
    "aggregation": "pool"
  }
]
*/
def objects = m.byClass(children, "Object") + m.byClass(children, "Object (Review)")
def areas = objects.collect { m.area(it) * pixelWidthMicrons * pixelHeightMicrons }
return [object_count: objects.size(), object_area: areas]
