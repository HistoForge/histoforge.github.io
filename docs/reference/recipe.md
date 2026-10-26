# Recipe reference

`recipe.json` belongs at the root of the module repository. It is ordinary JSON: use double-quoted
strings, with no comments or trailing commas. For a walkthrough, start with
[Create your first module](../module-authoring/first-module.md).

## Module fields

| Field | Required | Meaning |
|---|---|---|
| `schemaVersion` | Yes | Recipe format version: `3`. |
| `name` | Yes | Display name in QuPath. |
| `description` | No | Nonempty, single-line description. |
| `models` | Yes | Nonempty map of model names to their settings. |
| `steps` | Yes | Nonempty list of model and script steps in execution order. |
| `upstream` | No | Immediate source module as `owner/name@commit`, using the full 40-character lowercase commit. Records the source, not an automatic update connection. |
| `trainingReportDigest` | No | SHA-256 of the module's exact `training-report.json`. Preserve a HistoForge-generated report and this value together. |

License metadata, discovery tags and human attribution belong in `README.md` and supporting
files, not in recipe fields. Unknown fields are rejected; do not add an `author`, `license` or
`tags` field here.

A training report must match the model it describes, including its name, weights, output classes,
resolution and analysis GPU. Editing the report to make it fit another model does not create
training evidence. Keep additional reports as supporting files under different names and explain
their source in the README. See [Add a model](../module-authoring/add-model.md).

## Model fields

A model name starts with a lowercase letter and contains only lowercase letters, digits and
underscores. For example, `objects` is the name used in `models.objects` and in a step's `model`
value. It is not a repository name.

| Field | Meaning |
|---|---|
| `arch` | Supported model implementation. See [Model compatibility](model-compatibility.md). |
| `gpu` | Default cloud GPU for this model. |
| `weights` | For installation, `{ "type": "vendored", "file": "objects.safetensors" }`: the weights are included in the repository. The filename must match the model name. |
| `input` | Image resolution, analysis area and any required crop or tiling settings. |
| `output` | Objects or regions returned by the model, with their class labels. |
| `params` | Parameters supported by that model implementation, not arbitrary Python arguments. |

All except `params` are required by the recipe format; the supported model implementations also
require particular parameters. Keep the model entry and weights together when reusing a model.
Ordinary module installation requires the weight files in the repository. It does not download
arbitrary external weights or model code from a pointer in the recipe.

## Input

Every input declares a positive `micronsPerPixel`, in µm/px. Input images are RGB, with valid pixel
calibration. HistoForge samples the image at the model's required resolution.

| `type` | Additional fields | Use |
|---|---|---|
| `field` | No `framing`. | Analyze the selected region. |
| `crop` | `framing: { "paddingModelPx": N }`, where `N` is a nonnegative integer. | Analyze an image around a structure from an earlier model. Requires `parentModel` and `parentClass` in the step. |

`paddingModelPx` is measured at the **model's** resolution, not the original image's resolution.
For example, 32 pixels at 0.5 µm/px adds 16 µm on each side, limited by the slide boundary.

(recipe-tiling)=
### Tiling settings

Preserve the tiling settings supplied with the model. There are two forms:

- Without `fieldProfile`, the model uses its fixed tile settings, including `params.bsize` and
  `params.tile_overlap` where specified.
- With `fieldProfile`, the model declares the permitted image-field sizes and tiling behavior.
  Do not also set `params.bsize` or `params.tile_overlap`.

The complete `fieldProfile` record contains:

| Field | Required value or constraint |
|---|---|
| `planner` | `variable-field-v2` |
| `minSideModelPx`, `preferredTileSideModelPx`, `maxSideModelPx` | Positive integers in that order from smallest to largest; each divisible by `alignmentModelPx`. |
| `alignmentModelPx` | `16` for the supported implementations. |
| `outerArtificialPaddingModelPx` | `8`. Supplies a zero-valued border after image normalization; it is not extra slide tissue. |
| `smallRoiContext` | Boolean. Allows nearby image context for small field ROIs; must be `false` for crop models. |
| `tileOverlap` | Number from 0 inclusive to 1 exclusive. |
| `aggregation` | `cellpose-tapered-mean-v1` |
| `preprocessing` | `normalize99-real-image-v1` |

These are model configuration, not settings to adjust merely to make an image fit. Changing the
field sizes or preprocessing assumptions can change predictions.

### Large-region settings

An optional `input.largeRegion` declares `coreWidthModelPx`, `coreHeightModelPx` and
`haloPerSideModelPx`: processing-region width, height and surrounding context in model pixels.
The two dimensions must be positive integers; the context must be a nonnegative integer.

These processing regions are separate from neural-network tiles. Adding the record does not
enable large-region or whole-slide execution on a model that lacks that support. Retain tested
settings from the source module; see [Whole-slide analysis](../using-histoforge/whole-slide.md).

## Output classes

A model that separates individual objects without classifying them uses:

```json
{ "type": "instance_segmentation", "classes": ["Object"] }
```

This single class is assigned after segmentation. It is not a classifier channel.

For `instance_segmentation_and_classification` or `dense_classification`, declare every class
channel, including background:

```json
{
  "type": "instance_segmentation_and_classification",
  "classChannels": [
    { "channel": 0, "role": "background" },
    { "channel": 1, "role": "emitted", "pathClass": "Object" },
    { "channel": 2, "role": "training_only", "pathClass": "Other" }
  ]
}
```

This illustrates the format, not a class mapping for an arbitrary checkpoint. Channel numbers
must match the trained weights, be unique, and run consecutively from zero. Array order does not
change their meaning. The supported classifiers require background at channel zero.

- `background` has no `pathClass` and produces no returned object.
- `emitted` requires a `pathClass` and is returned to QuPath.
- `training_only` requires a `pathClass` but is not returned to QuPath.

There must be at least one emitted class, and class labels must be unique. The model still makes
its prediction over **all** channels before suppressing background or training-only predictions.
Deleting unwanted channels changes that decision and can make the weights incompatible.

## Steps and scripts

| Step | Meaning |
|---|---|
| `{ "model": "objects" }` | Run a declared field model over the analysis region. |
| `{ "model": "objects", "parentModel": "structures", "parentClass": ["Structure"] }` | Run a declared crop model within eligible structures. The parent must name an earlier field-model step. |
| `{ "script": "review_objects.groovy" }` | Run a processing script at this point. |
| `{ "script": "metrics.groovy" }` | Calculate measurements. May occur once, last. |

Model and script steps cannot repeat. Script paths must be relative `.groovy` files inside the
repository. Processing scripts can declare new classes with `@histoforge-classes`; the
measurement script must declare its results with `@histoforge-metrics`. See
[Processing scripts](../module-authoring/processing-scripts.md) and
[Measurements](../module-authoring/measurements.md) for complete files.
