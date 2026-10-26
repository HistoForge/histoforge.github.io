# Create your first module

This example copies a module you already use and adds an object count. The model and its weights
stay unchanged. You will work in your own private Hugging Face repository, then install the result
in QuPath.

## Choose the source

Use an installed module that you have run successfully on a suitable image. For this example,
choose one model that segments individual objects, such as nuclei or tissue structures. Counting
fragments from a tissue-region model is not a cell count.

In **Modules**, select the source and open **Workflow**. Note one output class you want to count,
with its exact spelling. These examples use `Object` as a sample class name; replace it with your
chosen class in every script. Do not rename a biological class just to match the example.

Check that the source's terms permit making this copy, and retain its license and attribution
files. If you start with your own training result, the same upstream terms still need review.

## Make a private copy

Check that HistoForge's Hugging Face token can create, read and write the new private repository.
See [publishing permissions](../training/publish.md#before-publishing).

1. Follow [Publish from QuPath](../training/publish.md#publish-from-qupath), using a **new**
   repository name under your account and **Private** visibility.
2. Leave **Also install the published copy locally** unchecked if it is offered. You will install
   the edited copy later.
3. After publication succeeds, open your new repository on Hugging Face.

The repository contains `recipe.json`, its model weight files, and any scripts and supporting
files. Do not move them into an extra folder. Keep the source module installed and unchanged.

## Add the count

Use the repository's **Files and versions** tab to edit text files. Open `recipe.json` and change
its `name` to distinguish the copy, for example `Object count example`. Update its `description`
to describe your change. Keep the complete `models` section, weight files and any training report
unchanged.

Create `metrics.groovy` at the repository root with the following content. If the copied module
already has that file, this example **replaces its measurements** in your copy.

```{literalinclude} ../../examples/module-authoring/count/metrics.groovy
:language: groovy
```

Replace `Object` with the class you selected. `m.byClass` selects matching objects; `size()` counts
them. The first comment declares the measurement shown in QuPath, and the returned map supplies
its value under the same name, `object_count`. No matching objects returns zero.

In `recipe.json`, keep the existing steps and add this entry **last** in `steps`:

```json
{ "script": "metrics.groovy" }
```

If that entry is already present at the end, leave it there. Do not add it twice. Separate JSON
entries with commas, without a comma after the final entry. Save each change to the repository;
Hugging Face calls each saved version a **commit**.

Review the copied `README.md` too. Describe the added count and identify the source model. Do not
present the source's evaluation as a new evaluation of your modified workflow.

## Install and check it

1. [Install your new repository](../using-histoforge/modules.md#install-it) from **Modules**.
2. Select it and check **Workflow**: the existing model steps should be followed by the count.
3. Create a fresh test project with a suitable image, without previous analysis objects. Assign
   your new module and draw one small HistoForge ROI, following
   [Your first analysis](../getting-started/first-analysis.md).
4. Run **Fill**, inspect the objects of your chosen class, and compare their count with
   **Object count** in the measurement table.
5. [Export to Excel](../using-histoforge/export.md) and check the same value there.

The fresh project avoids counting old results alongside the new results. Measurement scripts can
see eligible objects from other modules or manual annotations too; a class filter does not identify
which model created an object.

For later edits, follow [Test and share your module](test-and-share.md). Saving a file on Hugging
Face does not update the installed copy automatically.
