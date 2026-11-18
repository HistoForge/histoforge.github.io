# Actions and results

Actions apply to the **checked images**, not simply the image open in the QuPath viewer. Confirm
the image selection, assigned module and **Scope** before starting.

## Fill, Redo and Metrics

| Action | Use it to |
|---|---|
| **Fill** | Run missing model output while keeping existing output where it can be reused. |
| **Redo** | Run models again and replace their previous output. |
| **Metrics** | Recalculate measurements from the current objects without rerunning models or processing scripts. |

The model selector defaults to **All models**. To choose individual models, the checked images
must share the same installed module. This selector controls model steps, not script steps:
processing scripts follow the recipe's order. **Fill** and **Redo** also calculate measurements
when the module defines them.

A module without measurements can still produce objects, but **Metrics** and HistoForge's Excel
**Export** are unavailable for it.

**Set Module** assigns the module used for subsequent actions; it does not remove existing
objects. Measurements may include objects from other modules or manual annotations when their
classes match the measurement script. Use a separate test project when comparing modules so
their results are not counted together.

## Analysis scope

| Scope | Area analyzed on each checked image |
|---|---|
| **HistoForge ROIs** | Rectangles created with the **HistoForge ROI** tool. |
| **Annotations by class** | All eligible QuPath area annotations with the selected class. |
| **Whole slide** | The image, without requiring ROIs. |

Follow [Your first analysis](../getting-started/first-analysis.md) for either ROI method, or
[Whole-slide analysis](whole-slide.md) for an entire image.

Switching between ROI and whole-slide output for the same model requires **Redo**. Read its
confirmation before accepting a replacement.

(using-existing-annotations)=
### Using existing annotations

**Annotations by class** includes all eligible annotations with the chosen class on every checked
image. Highlighting an annotation does not restrict this selection. Class names must match
exactly: **Tissue** does not include **Tissue: Subclass**. If an image has no matching area
annotations, HistoForge reports the problem; it does not analyze the whole slide instead.

Outlines may be irregular, contain holes or have several disconnected parts. They must stay
inside the image and must not overlap, although their edges may touch. Points, lines, detections
and annotations produced by HistoForge are not used as analysis boundaries. The ROI tool's size
restriction does not apply to these outlines; the image and model limits below still apply.

Both locked and unlocked annotations can be selected. **Fill** and **Redo** lock and save the
boundaries before analysis, and model predictions are clipped to those outlines. To change a
boundary later, use QuPath's **Unlock**, edit it, save with **Save Project & Refresh**, then use
**Redo** to replace its results. **Metrics** and **Export** do not change annotation locks.

## Inference precision

BF16 can run model predictions faster on supported cloud GPUs. Shorter GPU runs can also reduce
compute costs. Speed and cost savings depend on the model, image and GPU. BF16 uses fewer digits
in some calculations, so predictions and measurements can differ from **Default**.

Open **Settings → Inference precision** to choose the numerical precision used for new **Fill**
and **Redo** runs.

- **BF16 (if applicable)** is selected initially. It uses BF16 when the model and GPU support
  it; otherwise it uses **Default**.
- **Default** uses the model's standard numerical precision.

Changing this setting does not alter existing results, unfinished runs or training. Use **Redo**
to replace existing results with the selected precision.

## Saving results

HistoForge may save results from several regions together. A region finishing processing does
not mean its results have been saved. Stopping the action or closing QuPath before the save can
lose unsaved results; results already saved to the project are kept.

An action can report **Partial** when only some results were saved or measurements failed.
Check the image and **Jobs → Details** before continuing. For interrupted work, follow
[Resume unfinished work](../reference/troubleshooting.md#resume-unfinished-work).

## Image preparation limits

HistoForge checks the image source and requested region against the limits of the extension,
connected backend and selected models. Opening a slide in QuPath or analyzing a small ROI does
not establish that the same model can analyze the whole slide.

For prepared images, size estimates include all RGB pixels in the required bounding rectangle
plus encoding overhead, including any context needed by the models. This is not the polygon's
area or the compressed slide size. An irregular region may therefore require more image data
than its tissue area suggests.

HistoForge automatically chooses between preparing image data from QuPath and uploading an
eligible local slide with its required companion files. Original-slide upload can use OpenSlide
or Bio-Formats, following the image and reader selected in QuPath. Small regions may still use
prepared images. See [local image guidance](../getting-started/before-you-start.md#open-a-local-image)
for import steps and tested examples.

Each prepared file is limited to **16 GiB**, or the backend's limit if lower. The standard backend
accepts an original-slide upload of up to **32 GiB in total**, including packaged companion files.
These are upload limits, not maximum slide sizes or guarantees of model support. Larger inputs
may use several prepared images, each within its limit. Training has separate limits.

An original upload includes the entire slide and its metadata, even for one ROI. Read
[Data and privacy](../reference/data-and-privacy.md) before uploading. Slides opened directly from
S3 use [prepared image data](cloud-image-compatibility), not original-file uploads.

For a size error, follow [Image-size limits](prepared-image-exceeds-the-size-limit). Do not change
a model's resolution just to bypass a limit: that changes the scale of tissue it sees.

## Manual corrections

Model results are ordinary QuPath objects. After editing their shapes or classes, save the image
and run **Metrics** to update the measurements.

:::{warning}
**Redo** replaces output belonging to the selected models, including objects you have manually
edited. It is not an undo operation. Manually created objects that do not belong to those models
are preserved.
:::

A model that successfully finds no objects can replace previous output with an empty result.
This is different from a failed model run.

## Reading the image table

| Column | Meaning |
|---|---|
| **Status** | Whether output from the assigned module is present in the selected scope. It does not confirm that every model step ran or that the output is accurate. |
| **Last Run** | The outcome of the latest action in this QuPath session, such as **Saved**, **Partial** or **Failed**. |

QuPath stores the analysis regions and result objects in the image data. Displayed HistoForge
measurements are temporary and can be recomputed; export a workbook to retain them. The
**Last Run** message is also session-specific.

If an action fails, read its complete message before repeating it. See
[Troubleshooting](../reference/troubleshooting.md).
