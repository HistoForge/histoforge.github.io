# Script functions

HistoForge provides shared functions for selecting objects, measuring their shapes and matching
objects by position. They are available as `m` inside module Groovy scripts, without a separate
import or installation.

This reference applies to scripts run by HistoForge as part of a module. Opening a standalone
script in QuPath's script editor does not supply these variables automatically. For step-by-step
instructions, follow [Add a processing script](../module-authoring/processing-scripts.md) or
[Add measurements](../module-authoring/measurements.md). The examples below are fragments, except
for the [complete measurements example](#complete-measurements-example) at the end.

## Select objects, then call a function

```groovy
def nuclei = m.byClass(children, "Round Leydig Nuclei")
def values = nuclei.collect { m.eccentricity(it) }
```

`children` is the list of objects HistoForge supplies for the current analysis region. The first
line selects only objects in that list with the exact class label `Round Leydig Nuclei`. The
second line uses Groovy's `collect` to call `m.eccentricity` once per selected object and return
a list of numbers, in the same order. If no objects match, both lists are empty.

Functions use the objects or numbers you pass; they do not search the image for additional
objects. Where geometry is needed, QuPath provides it through `object.getROI().getGeometry()`
using the **Java Topology Suite (JTS)**, a library for points, lines and polygons. These functions
read geometry without changing the object's outline.

## Inputs supplied to scripts

HistoForge supplies the following variables to both processing scripts and measurement
scripts:

| Variable | Meaning |
|---|---|
| `children` | A flat list of QuPath objects supplied for this region and script stage. It can include nested objects; it is not just a list of direct hierarchy children. |
| `roi` | A separate annotation representing the complete analysis region. In whole-slide analysis, it represents the slide region. |
| `roiAreaPx` | The analysis region's polygon area in square image pixels, not its bounding-rectangle area. |
| `pixelWidthMicrons` | Image pixel width in micrometers per pixel. |
| `pixelHeightMicrons` | Image pixel height in micrometers per pixel. |
| `config` | An immutable, empty map. It does not currently provide module-defined settings. |
| `m` | The shared functions documented on this page. |

For measurement scripts, `children` contains eligible classified annotations and detections
assigned to the region; these need not all have been created by the selected module. Processing
scripts receive the eligible objects visible at their position in the recipe. Neither
list should be assumed to contain every object in the image. The supplied objects are copies,
not the live project objects. HistoForge prepares them before running the script; filtering the
list does not avoid that preparation.

Functions taking `object` use that object's `getROI()`. For a QuPath cell object, that is the
cell outline, not its separate nucleus outline. Select nucleus objects when measuring nuclei.
The examples below reuse `nuclei` from the selection example; replace the class label with the
one used by your module.

## byClass

`m.byClass(objects, name)` takes a list of QuPath objects and a class-label string. It returns a
new list containing the same object references whose full class label matches `name` exactly,
including case. Objects without a class are skipped. Input order is preserved; no match returns
an empty list.

The function does not check whether an object is a detection or annotation, match partial class
names, or search descendants outside the supplied list. It does not change any classifications.
The result is a list of objects, with no measurement units.

```groovy
def selected = m.byClass(children, "Round Leydig Nuclei")
def count = selected.size()
```

## area

`m.area(object)` takes one QuPath object and returns its ROI area as a `double`, in **square
image pixels**. It calls QuPath's `getROI().getArea()`. For polygonal ROIs this includes all
components and subtracts holes. It is not a count of pixels in a rasterized mask and does not
automatically convert to square micrometers.

```groovy
def areasPx2 = nuclei.collect { m.area(it) }
def areasUm2 = areasPx2.collect {
    it * pixelWidthMicrons * pixelHeightMicrons
}
```

For example, 100 px² at 0.5 µm/px in both directions is 25 µm². Summing object areas counts
overlapping areas more than once; `area` does not calculate the union of several objects.

## pct

`m.pct(value, denominator)` takes a numeric value and a denominator that may be `null`.
It returns `value / denominator * 100` as a number, or `null` when the denominator is missing
or nonpositive. A `NaN` denominator also returns `null`. The numerator must be a number, not
`null`.

Use compatible units for both arguments. The result is a **percentage**, not a fraction; it is
not restricted to 0–100. A zero numerator with a positive denominator returns zero, which is
different from a missing result. Supply finite numbers: the function does not otherwise reject
infinities or a non-finite numerator.

```groovy
def percent = m.pct(25.0d, 100.0d)    // 25.0
def zero = m.pct(0.0d, 100.0d)        // 0.0
def missing = m.pct(25.0d, null)      // null
def undefined = m.pct(25.0d, 0.0d)    // null
```

## Shape measurements

`eccentricity`, `minorAxis`, `majorAxis` and `solidity` take one QuPath object. For a multipart
polygon they first select the component with the largest polygon area, using `mainPoly`.
They then use **only that component's exterior boundary**: holes and smaller components do not
contribute to the shape measurement. This differs from `area`, which measures the full ROI.

These functions require a polygon exterior. They are not measurements for point or line ROIs
and do not repair invalid geometry or supply a missing ROI. Missing or incompatible inputs can
raise a script error rather than return a missing measurement.

The three moment-based functions measure how the filled exterior's area is distributed around
its centroid. They use polygon-area moments, not a fit to boundary points or a rasterized mask.
If `lambdaLarge` and `lambdaSmall` are the eigenvalues of the normalized second central moment
matrix, in descending order, the calculations are:

```text
eccentricity = sqrt(max(0, 1 - lambdaSmall / lambdaLarge))
major axis   = 4 * sqrt(max(0, lambdaLarge))
minor axis   = 4 * sqrt(max(0, lambdaSmall))
```

Eccentricity returns zero if `lambdaLarge <= 0`. If the exterior's absolute signed area is
less than `1e-9` px², both eigenvalues are set to zero and all three measurements return zero.
Zero in these cases does not establish a biologically round object.

### eccentricity

`m.eccentricity(object)` returns a **dimensionless** `double`. Zero corresponds to equal
second moments in both principal directions; values approaching one indicate increasingly
elongated shapes. This is not circularity: it does not use perimeter and is not, by itself,
a test for a smooth or convex outline.

```groovy
def eccentricities = nuclei.collect { m.eccentricity(it) }
```

### minorAxis

`m.minorAxis(object)` returns the shorter axis of the equivalent second-moment ellipse as a
`double`, in **image pixels**. It is not the shorter side of the object's bounding box.

```groovy
def minorAxesPx = nuclei.collect { m.minorAxis(it) }
```

### majorAxis

`m.majorAxis(object)` returns the longer axis of the equivalent second-moment ellipse as a
`double`, in **image pixels**. It is not the bounding-box width or the maximum distance between
boundary points.

```groovy
def majorAxesPx = nuclei.collect { m.majorAxis(it) }
def majorAxesUm = majorAxesPx.collect { it * pixelWidthMicrons }
```

For example, a filled 10 × 5 pixel rectangle has moment-based axes of approximately
11.55 and 5.77 pixels, not 10 and 5 pixels. The physical-length conversion above assumes square
pixels. HistoForge requires finite, positive and equal pixel width and height before running
module scripts; these functions do not rescale the outline themselves.

### solidity

`m.solidity(object)` returns a **dimensionless** `double`: the area enclosed by the selected
component's exterior divided by the area of its convex hull. The convex hull is the smallest
convex polygon enclosing that exterior. A convex exterior gives one; indentations reduce the
ratio. If the hull area is zero, the function returns zero.

Holes are ignored in both areas. A convex tubule outline with a lumen can therefore have a
solidity of one; this value does not mean the ROI has no holes or that the section is suitable
for a particular biological measurement.

```groovy
def solidities = nuclei.collect { m.solidity(it) }
```

## mainPoly

`m.mainPoly(geometry)` takes a **JTS geometry**, not a QuPath object, and returns a geometry.
With two or more immediate components, it returns the one with the largest `getArea()`;
equal areas keep the first component. For polygons, this selection uses area **after
subtracting holes**, even though the shape functions above subsequently ignore those holes.

With zero or one component, it returns the input unchanged. It does not recursively unwrap
collections, convert another geometry type into a polygon, remove holes or make a new copy.
In particular, a one-component collection remains a collection. Use polygonal input; do not
assume an arbitrary geometry will become a polygon or modify the returned geometry in place.
Coordinates retain their original units, which are image pixels for geometry from these objects.

```groovy
def largestComponentAreasPx2 = nuclei.collect {
    def geometry = it.getROI().getGeometry()
    def component = m.mainPoly(geometry)
    component.getArea()
}
```

## matchLargestByCentroid

`m.matchLargestByCentroid(children, parents)` takes two lists of QuPath objects. Here the
argument names describe the two lists you pass; the function does not discover children or
parents from the QuPath hierarchy.

For each child, in the supplied order:

1. Read its ROI centroid with QuPath's `getCentroidX()` and `getCentroidY()`.
2. Find the **first parent in the supplied parent order** whose JTS geometry contains that
   point. Points on an outer or hole boundary are excluded; points inside a hole are also
   excluded. All polygon components of a parent participate.
3. If a parent matches, keep this child only if that parent has no retained child or this
   child's `area` is larger. Equal areas keep the earlier child.

Only the centroid must be inside: the child's complete outline need not be contained by the
parent. A child that matches an earlier parent is not reconsidered for a later parent if it
loses the largest-child comparison. An unmatched child is omitted.

The result is a list of two-element arrays, each `[child, parent]`. Pairs appear in the order
each parent first received a match, not necessarily the input parent order. Replacing a retained
child does not move that pair. No matches returns an empty list. The function returns the
supplied object references and **does not change the QuPath hierarchy**.

Centroids and areas are compared in image coordinates; the returned pairs have no measurement
units. Supply objects from the same image and plane: the function does not check image identity
or z/time coordinates.

```groovy
def selectedNuclei = m.byClass(children, "Round Leydig Nuclei")
def selectedCells = m.byClass(children, "Leydig Cell")
def pairs = m.matchLargestByCentroid(selectedNuclei, selectedCells)
def pairedNuclearAreasPx2 = pairs.collect { pair -> m.area(pair[0]) }
```

For overlapping parents, changing `selectedCells` order can change the match. For example,
if the same nucleus centroid is inside cells A and B, `[A, B]` assigns it to A, while `[B, A]`
assigns it to B. This is a positional rule, not evidence of biological parentage.

This helper's centroid rule is separate from the interior-point rule used when
[running a model within detected structures](../module-authoring/recipes.md#run-a-model-within-detected-structures).

## Complete measurements example

In a module whose recipe already runs `metrics.groovy`, the following complete file returns
one eccentricity value per selected nucleus. Replace the class label to match your module.
The header declares the result's name, display label, type and aggregation; the returned map
must use the same name. An empty distribution means no objects matched, not a failed calculation.

```groovy
/* @histoforge-metrics
[
  {
    "name": "nuclear_eccentricity",
    "label": "Nuclear Eccentricity",
    "type": "distribution",
    "decimals": 2,
    "aggregation": "pool"
  }
]
*/
def nuclei = m.byClass(children, "Round Leydig Nuclei")
return [nuclear_eccentricity: nuclei.collect { m.eccentricity(it) }]
```

The class names are examples, not a requirement to install a particular module. None of these
functions changes an object's shape or class. Processing scripts may separately make the
[permitted classification changes](../module-authoring/processing-scripts.md#what-the-script-may-change);
measurement scripts return calculations without editing objects.
