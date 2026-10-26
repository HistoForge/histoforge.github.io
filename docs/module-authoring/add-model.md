# Add a model

A model entry in `recipe.json` pairs a weight file with the settings needed to use it. Start from
the complete entry of a compatible module, or from a model you
[trained in HistoForge](../training/index.md). A weight file alone is not enough.

If you need a starting point for training a new task, see
[Choose a starting model](../training/choose-model.md). Starter models are for
training; adding them to a recipe does not teach them your tissue classes.

## Reuse a model

1. Check the source module's intended images, evaluation, limitations and redistribution terms.
2. Copy its complete model entry into your recipe's `models` section.
3. Copy the weight file named in that entry, along with required attribution and license notices.
4. Give the model a unique name within your recipe, using lowercase letters, digits and
   underscores, starting with a letter. For example, `objects`.
5. Name its weight file to match: `objects.safetensors`. Set `weights.file` to that filename.
6. Add a step that names the model, in the intended execution order.

For a model that analyzes the whole selected region, the step is:

```json
{ "model": "objects" }
```

This name refers to an entry in **your** `models` section, not to a Hugging Face repository.
Combining modules means copying the required model files and settings into one module. A step
cannot call another module by its repository name. Follow
[Combine models in a recipe](recipes.md) when the model needs preceding results.

If the source has a training report, preserve it only with the model it describes, including the
model's name, weights and settings. Do not attach that report to a different model. When combining
several trained models, retain their individual reports as supporting files and explain their
sources in the README; do not fabricate a single combined training report.

## Keep settings consistent with the weights

| Setting | What to check |
|---|---|
| Architecture | The model must use an implementation supported by HistoForge. Changing `arch` does not convert weights to another architecture. |
| Image resolution | `input.micronsPerPixel` sets the model's pixel size, in µm/px. Preserve the resolution used for training unless you have evaluated a deliberate change. |
| Input area | A `field` model analyzes the selected region. A `crop` model analyzes an area around a preceding structure and needs a matching recipe step. |
| Classes | Class-channel numbers and labels must retain their trained meaning, including background and any classes not returned as objects. |
| Model parameters | Copy the settings with the weights. Changing a class count or network input configuration can make them incompatible. |
| GPU | `gpu` is the default device for analysis. It must have enough memory; changing it does not change the model's classes. |

For a model with a classifier, adding a class name to JSON does not create a trained class.
Use the training workflow to learn new classes. A segmentation-only model instead assigns one
class label to every detected object; that label is not a learned distinction between cell types.

The [compatibility reference](../reference/model-compatibility.md) lists supported model families
and parameters. Check changes on representative images before replacing a model used in a study.
