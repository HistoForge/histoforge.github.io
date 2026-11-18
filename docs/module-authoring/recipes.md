# Combine models in a recipe

The `models` section declares the available models; `steps` says which ones run and in what order.
Keep all required weights and scripts in the same module. See [Add a model](add-model.md) before
copying a model from another source.

Each model or script can appear only once in `steps`. Processing scripts go where their inputs
are available. If the module has `metrics.groovy`, it must be the final step.

## Run models over the same region

Suppose the module has two compatible models named `structures` and `objects`, both with
`input.type` set to `field`. This `steps` list runs each over the selected analysis region,
then calculates measurements:

```json
[
  { "model": "structures" },
  { "model": "objects" },
  { "script": "metrics.groovy" }
]
```

The second model receives image pixels, not the first model's predictions. Putting models in a
list does not automatically make one analyze the other's objects.

## Run a model within detected structures

To analyze each structure separately, the second model must use `crop` input and name the model
that supplies its structures. This is sometimes called **gating**: preceding objects determine
where the next model runs.

The following examples are recipe excerpts, not downloadable models. They assume that
`structures` produces the class `Structure` and `objects` is suitable for analysis within it.
Replace these names with the exact names in your models.

In the `objects` model entry, the input could be:

```json
{
  "type": "crop",
  "micronsPerPixel": 0.5,
  "framing": { "paddingModelPx": 32 }
}
```

Here, 0.5 µm/px and 32 pixels are illustrative settings, not recommended defaults. Copy the
resolution and crop settings appropriate to the trained model. The padding adds 16 µm of
surrounding image on each side of a structure's bounding rectangle, where the slide permits it.
It provides context; it does not enlarge the structure being analyzed.

The matching `steps` list is:

```json
[
  { "model": "structures" },
  {
    "model": "objects",
    "parentModel": "structures",
    "parentClass": ["Structure"]
  },
  { "script": "metrics.groovy" }
]
```

`parentModel` identifies the earlier model, and `parentClass` selects accepted structure classes.
Both are required. The parent model must run directly over the analysis region: nesting another
model inside these child results is not supported.

For each eligible structure, HistoForge reads its surrounding image and runs the child model.
It retains a predicted object when an interior point of that object lies within the structure.
The object's outline may cross the structure boundary; results are still clipped to the outer
analysis region. This is not a test that the whole child outline fits inside its parent.

Matching manually drawn structures can also provide inputs if they have no HistoForge model
assignment. Output belonging to a different HistoForge model cannot substitute just because its
class name matches.

With **Redo**, or after the parent model runs successfully in the current analysis, no eligible
structures means the child does not run. **Fill** reports a missing prerequisite if it finds no
eligible structures and has not run the parent model. It never runs the child over the whole
region instead.

## Process results between models

A [processing script](processing-scripts.md) can reclassify structures before the child model runs.
Put the script after the structure model and before the child step. Use the script's declared
output classes in `parentClass` when those are the classes you want to select.

Keep a single final measurement script. When combining existing modules, merge the calculations
you need into that script rather than adding two `metrics.groovy` steps.

After changing the recipe, [reinstall and test the new version](test-and-share.md#test-an-update).
Check both regions with eligible structures and regions without them.
