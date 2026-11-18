# Review the trained result

When **Jobs** shows **Complete**, the new module is available in your Modal workspace. It has not
been published to Hugging Face.

## Read the report

1. In **Jobs**, select **Open latest details** for the completed run.
2. Review the training and validation curves, selected model result, and any reported warnings
   or unavailable metrics.
3. Select **Open in Modules** to locate the result module.

You can reopen its report through the module's **⋯ → View training report** menu.

HistoForge opens a saved report in your browser. To see newer progress during training, select
**Open latest details** again; refreshing the browser page does not update it.

% Screenshot: training-report

Validation results describe the split used during training. If validation was set to 0%, there
is no held-out validation result. Do not compare scores without checking the task, class labels
and evaluation data they describe.

## Try the trained module

1. Create a separate test project with images not used to train the model and no previous analysis
   objects. Validation images can be used for this visual review.
2. In **Project**, check the images and use **Set Module** to assign the trained module.
3. Run it on representative regions using the [first-analysis workflow](../getting-started/first-analysis.md).
4. Review the predictions using your study's review procedure.

For an independent performance estimate, use a separate test set excluded from both training and
validation. Validation influences model selection, so its scores are not an independent test.

A standalone result contains only the selected model, without processing or measurement scripts.
A copied workflow retains those scripts; check that their class names and calculations still
fit the trained model. To add or change them, follow [Module authoring](../module-authoring/index.md).

Keep the result private or [publish the module](publish.md) when you are ready to share it.

## Remove data you no longer need

Uploaded training data remains in Modal after training. Use
[Manage uploaded training data](../reference/data-and-privacy.md#delete-uploaded-training-data)
to delete it. **Clear history** in Jobs removes the job record and its run details, not the
dataset or the completed module. The module retains its own training report.
