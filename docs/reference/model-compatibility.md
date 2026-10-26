# Model compatibility

A compatible model needs matching architecture, weights, input settings and output classes.
Saving an unrelated model as `.safetensors` does not make it compatible with HistoForge.

## Supported model families

| Recipe `arch` | What it produces |
|---|---|
| `dinov3-adapter-cellpose` | Individual objects, optionally classified. |
| `dinov3-adapter-hovernet` | Individual objects, optionally classified. |
| `dinov3-adapter-semantic` | Pixel-classified tissue regions, not separate cell instances. |

These names identify HistoForge's specific DINOv3-based implementations. They do not promise
compatibility with every Cellpose, HoVer-Net or semantic-segmentation checkpoint. Use the complete
model entry and weights from a compatible module or HistoForge training result.

The connected backend determines which models can run and which can be trained. Analysis support
does not imply training or whole-slide support. Check the selected module in QuPath; changing an
architecture name in JSON cannot enable a missing implementation.

## Model parameters

The following keys belong inside a model's `params`. Preserve the source values unless you are
deliberately evaluating a change. Unknown keys are rejected.

| Parameter | Applies to | Meaning and constraints |
|---|---|---|
| `num_classes` | All three families | Required. `0` for segmentation without a classifier; otherwise the complete number of class channels, including background and training-only channels. |
| `min_instance_pixels` | Cellpose and HoVer | Required nonnegative integer. Minimum final object area in model-grid pixels; `0` disables this size filter. It is not measured in original-image pixels. |
| `bsize` | All, without `fieldProfile` | Positive tile side length in model pixels, divisible by 16. |
| `tile_overlap` | All, without `fieldProfile` | Tile overlap fraction, from 0 inclusive to 1 exclusive. |
| `batch_size` | Cellpose and semantic | Positive number of model tiles processed together on the GPU. Not the number of images or ROIs. |
| `edge_threshold`, `fg_threshold` | HoVer | Boundary and foreground thresholds, from 0 inclusive to 1 exclusive. |
| `object_size` | HoVer | Positive size setting used to form watershed markers. Not a substitute for `min_instance_pixels`. |
| `morph_kernel` | HoVer | Positive odd morphological kernel size. |
| `ksize` | HoVer | Positive odd gradient kernel size, at most 31. |

For example, an object area of 100 model pixels at 0.5 µm/px is 25 µm². Do not transfer a pixel-area
threshold unchanged between models at different resolutions and assume the physical threshold
is the same.

When `input.fieldProfile` is present, it owns field size and overlap instead of `bsize` and
`tile_overlap`. Its exact fields are in the [Recipe reference](recipe-tiling).

## Weights and unsupported combinations

For ordinary installation, include each model's complete weight file as
`<model-name>.safetensors`. The model's `weights.file` must name that file. Keep the encoder and
task-specific weights in the form expected by the supported implementation; a generic encoder
checkpoint alone is not a complete analysis model.

Recipes do not install arbitrary Python code, independently swap in a foundation encoder, or
call another Hugging Face module as a step. To combine compatible models, follow
[Add a model](../module-authoring/add-model.md). To discuss support for a different architecture,
contact [histoforge.contact@gmail.com](mailto:histoforge.contact@gmail.com).
