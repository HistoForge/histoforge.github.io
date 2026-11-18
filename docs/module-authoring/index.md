# Module authoring

Create a module when you want to combine models, change how their results are processed, or add
measurements. We recommend starting with [an AI assistant](ai-assisted.md), such as ChatGPT or
Claude, with tools for editing files and uploading to Hugging Face. Describe what you want to
analyze and measure; the assistant builds the module, saves it in your repository, and helps
you test it in QuPath.

You do not need this section to [use an existing module](../using-histoforge/modules.md) or
[train a model with your annotations](../training/index.md). A training result is already a
module and can be [published directly from QuPath](../training/publish.md).

Before starting, complete one analysis in QuPath and read
[Models, recipes and modules](../key-concepts.md#models-recipes-and-modules). You will need a
Hugging Face account that can create and edit a model repository.

If you prefer to edit the files yourself, start with [Create your first module](first-module.md).
The guides below explain `recipe.json` and Groovy scripts, which QuPath installs and runs as part
of a module. QuPath does not provide a recipe editor.

```{toctree}
:maxdepth: 1

ai-assisted
first-module
add-model
recipes
processing-scripts
measurements
test-and-share
```

For exact settings, use the [Recipe reference](../reference/recipe.md),
[Model compatibility](../reference/model-compatibility.md), and
[Script functions](../reference/script-functions.md). Adding support for a different neural-network
architecture requires changes to HistoForge, not just a new recipe. Contact
[histoforge.contact@gmail.com](mailto:histoforge.contact@gmail.com) to discuss a model contribution.
