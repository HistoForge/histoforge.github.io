# Add measurements

HistoForge reads measurements from `metrics.groovy`, once at the end of the recipe. The script
returns numbers; it must not edit objects. Those results supply the measurement table and Excel
export.

The [first-module example](first-module.md) counts one class. This version also includes objects
flagged by the [processing script](processing-scripts.md) and returns their individual areas.

## Write the script

Replace your copy's `metrics.groovy` with:

```{literalinclude} ../../examples/module-authoring/measurements/metrics.groovy
:language: groovy
```

Replace the two class labels to match your module. Selecting classes is important: the supplied
objects can include manual annotations and results from other modules, not just this module's
output. Do not count tissue-region fragments as cells.

`m.area` returns square image pixels. Multiplying by both pixel scales converts that area to µm².
The script returns one area per object, including those flagged for review.

## Declare each result

The first block comment must contain `@histoforge-metrics` followed by a JSON list. Each entry
declares a result's `name`, display `label`, `type`, `decimals` and `aggregation`; `unit` is optional.
The returned map must contain exactly those names, with no extra or missing keys.

| Type | Return value | Aggregation across regions |
|---|---|---|
| `scalar` | One finite number, or `null` for a missing value. | `sum` adds values; `mean` gives each region with a value equal weight. |
| `distribution` | A list of finite numbers, or `null` for a missing result. | `pool` combines the individual observations before calculating summary statistics. |

Choose the aggregation for the question you are answering. Counts normally use `sum`. Individual
object areas use `pool`, so each object contributes equally. Averaging each region's mean area
with `mean` instead gives a region containing two objects the same weight as one containing 200.

## Empty, missing and failed results

No matching objects gives `object_count: 0` and `object_area: []`. Zero is a valid count; an empty
distribution has no mean. Use `null` when a value is undefined, such as a ratio with no valid
denominator. Missing values are not treated as zeros during aggregation.

If a calculation fails, let the error surface. Do not catch it and return zero. A missing key,
wrong value type, or non-finite value such as `NaN` is an error, not a missing measurement.

## Check the numbers

On a clean test region with two selected objects of 100 and 300 µm², expect count 2 and pooled mean
area 200 µm². With no matching objects, expect count 0 and no mean area. Check the table and
[Excel export](../using-histoforge/export.md), including units and grouping.

After editing only this script, reinstall the module and run **Metrics** on the existing test
objects. **Metrics** does not run the processing script or models. If those changed too, follow
[Test an update](test-and-share.md#test-an-update).
