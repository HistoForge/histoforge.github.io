# Key concepts

HistoForge organizes an analysis as a **module**. You install a module, assign it to your images,
and run it inside QuPath.

## Models, recipes and modules

| Term | Meaning |
|---|---|
| **Model** | A neural network that predicts objects or tissue classes from images. Its saved parameters are called weights. A module can contain one model or several. |
| **Recipe** | The module's instructions: which models to use, their settings, and the order of model and script steps. These are stored in `recipe.json`. |
| **Module** | The complete analysis package: its recipe, model weights, and any scripts for processing objects or calculating measurements. |

For example, a testicular analysis could first identify seminiferous tubules, then identify germ
cells within those tubules, and finally calculate measurements. The models make predictions; the
recipe defines how those steps fit together; the module packages the workflow.

For analysis, choose a trained model suited to your images. [Starter models](training/choose-model.md)
provide a starting point for training, not ready-made predictions for your study.

You do not need to edit a recipe to use an existing module. Select it in **Modules** and open
**Workflow** to see its steps, output classes and required image resolution. To build or change
one, follow [Module authoring](module-authoring/index.md).

## Analysis regions

A **region of interest (ROI)** is an area selected for analysis. You can draw rectangles with the
**HistoForge ROI** tool or use existing QuPath area annotations through **Annotations by class**.
The latter selects all eligible annotations with the chosen class on each checked image, not just
the highlighted annotation. **Whole slide** analyzes the image without requiring ROIs. See
[Your first analysis](getting-started/first-analysis.md) for the region-selection steps.

A **tissue region** predicted by a model is a result, not an analysis ROI. For example, a model
may label areas of epithelium and stroma inside the ROI you drew.

## Results and measurements

**Segmentation** identifies the outlines of individual cells or structures, or the areas occupied
by tissue classes. **Classification** assigns class labels to those results. A tissue-region
model does not separate individual cells, so counting its regions is not a cell count.

Results are editable QuPath objects. If the module defines measurements, HistoForge calculates
them during analysis. **Metrics** recalculates measurements from the current objects without
rerunning models or processing scripts; **Export** saves them in an Excel file. Modules without
measurements still provide objects for review, but not HistoForge measurement tables or export.

## Training and publishing

**Fine-tuning** adapts an existing model using your annotated images. HistoForge trains one
selected model at a time and saves the result as a new module in your Modal workspace. The source
module remains unchanged.

You can use that result privately. **Publishing** is a separate action that copies a module to a
Hugging Face repository, where you choose who can access it.
